/**
 * Background jobs (spec §69, §70, §164; api-contract §152, §153).
 *
 * Five periodic, config-driven jobs keep lifecycle state and retention
 * windows honest:
 *
 *   1. expire-listings       ACTIVE → ARCHIVED once `expiresAt` has passed (§70)
 *   2. archive-stale-drafts  DRAFT → ARCHIVED after STALE_DRAFT_ARCHIVE_AFTER_DAYS (§69)
 *   3. clean-challenges      deletes VerificationChallenges past retention — it
 *                            covers the REGISTER, CHANGE_PHONE and
 *                            PASSWORD_RESET purposes, because there is no
 *                            separate reset-token model (§69, §164)
 *   4. clean-sessions        deletes RefreshSessions past retention (§69)
 *   5. clean-orphan-media    hard-deletes soft-deleted images (storage objects
 *                            + row) past ORPHAN_MEDIA_RETENTION_DAYS and
 *                            reconciles storage keys no row references (§64, §67)
 *
 * Every job is:
 *
 *   - idempotent  — a re-run finds no remaining candidates and the conditional
 *                   guards make concurrent runs safe;
 *   - bounded     — at most `JOBS_BATCH_SIZE` rows/objects per pass (§69);
 *   - observable  — one structured pino log per run with counts + durationMs;
 *   - crash-safe  — a failure is logged and swallowed; the next interval
 *                   retries the same pass and the process never dies.
 *
 * §69 multi-instance caveat: these timers run in-process. With more than one
 * API instance every instance would run every job; the conditional updates and
 * retention cutoffs keep that *correct* (no double transitions, no double
 * deletes), but scheduling must be revisited before horizontal scaling — a
 * single dedicated worker process, or a distributed lock/queue — instead of
 * relying on these timers.
 *
 * Scheduling itself is configuration: with `JOBS_ENABLED=false` (tests,
 * maintenance windows) no timers are registered at all, while the job methods
 * below stay callable directly for manual runs and test suites.
 */
import {
  Inject,
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import type { AppConfig } from '../../config/config.types';
import { PrismaService } from '../../database/prisma.service';
import type { Prisma } from '../../generated/prisma/client';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { ListingsService } from '../listings/listings.service';

/** Counts attached to the structured log line of a job run. */
type JobLogFields = Record<string, number>;

/** Outcome of a bounded, delete-based retention cleanup pass. */
type CleanupOutcome = { scanned: number; deleted: number };

/** Scheduler-registry names — one per job, used for registration + teardown. */
const JOB_NAMES = {
  expireListings: 'jobs.expire-listings',
  archiveStaleDrafts: 'jobs.archive-stale-drafts',
  cleanChallenges: 'jobs.clean-challenges',
  cleanSessions: 'jobs.clean-sessions',
  cleanOrphanMedia: 'jobs.clean-orphan-media',
  cleanArchivedListingImages: 'jobs.clean-archived-listing-images',
} as const;

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobsService.name);
  private readonly jobsConfig: AppConfig['jobs'];
  private readonly storageLimits: AppConfig['storage'];
  /** Interval names this instance registered — removed again on shutdown. */
  private readonly registeredIntervals: string[] = [];
  /** Overlap guard: a pass still in flight when its timer fires is never re-entered. */
  private readonly inFlight = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    private readonly registry: SchedulerRegistry,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.jobsConfig = configService.get('jobs', { infer: true });
    this.storageLimits = configService.get('storage', { infer: true });
  }

  // --- Scheduling -----------------------------------------------------------------

  onModuleInit(): void {
    if (!this.jobsConfig.enabled) {
      // No timers at all; the job methods below remain callable directly.
      return;
    }
    this.registerInterval(
      JOB_NAMES.expireListings,
      this.jobsConfig.expireListingsIntervalSeconds,
      () => this.expireListings(),
    );
    this.registerInterval(
      JOB_NAMES.archiveStaleDrafts,
      this.jobsConfig.archiveStaleDraftsIntervalSeconds,
      () => this.archiveStaleDrafts(),
    );
    this.registerInterval(
      JOB_NAMES.cleanChallenges,
      this.jobsConfig.cleanChallengesIntervalSeconds,
      () => this.cleanExpiredVerificationChallenges(),
    );
    this.registerInterval(
      JOB_NAMES.cleanSessions,
      this.jobsConfig.cleanSessionsIntervalSeconds,
      () => this.cleanExpiredRefreshSessions(),
    );
    this.registerInterval(
      JOB_NAMES.cleanOrphanMedia,
      this.jobsConfig.cleanOrphanMediaIntervalSeconds,
      () => this.cleanOrphanMedia(),
    );
    if (this.jobsConfig.cleanArchivedListingImagesEnabled) {
      this.registerInterval(
        JOB_NAMES.cleanArchivedListingImages,
        this.jobsConfig.cleanArchivedListingImagesIntervalSeconds,
        () => this.cleanArchivedListingImages(),
      );
    }
    this.logger.log(
      {
        jobs: this.registeredIntervals.join(', '),
        batchSize: this.jobsConfig.batchSize,
      },
      'Background jobs scheduled',
    );
  }

  onModuleDestroy(): void {
    for (const name of this.registeredIntervals) {
      if (this.registry.doesExist('interval', name)) {
        this.registry.deleteInterval(name);
      }
    }
    this.registeredIntervals.length = 0;
  }

  /**
   * Registers one config-driven interval. `unref()` keeps a pending timer from
   * holding the process open (dev restarts, test teardown): only real HTTP
   * traffic keeps the server alive.
   */
  private registerInterval(
    name: string,
    intervalSeconds: number,
    run: () => Promise<JobLogFields>,
  ): void {
    const timer = setInterval(() => {
      void this.runScheduled(name, run);
    }, intervalSeconds * 1000);
    timer.unref();
    this.registry.addInterval(name, timer);
    this.registeredIntervals.push(name);
  }

  /**
   * Runs one scheduled pass. Never throws: a failure is logged (with the job
   * name and the error) and swallowed, and the next interval retries the same
   * idempotent pass (§69). A pass that outlives its interval is skipped
   * instead of overlapping.
   */
  private async runScheduled(name: string, run: () => Promise<JobLogFields>): Promise<void> {
    if (!this.jobsConfig.enabled) {
      return;
    }
    if (this.inFlight.has(name)) {
      this.logger.warn({ job: name }, 'Background job still in flight; overlapping run skipped');
      return;
    }
    this.inFlight.add(name);
    const startedAt = Date.now();
    try {
      const counts = await run();
      this.logger.log(
        { job: name, durationMs: Date.now() - startedAt, ...counts },
        'Background job finished',
      );
    } catch (error) {
      this.logger.error(
        { job: name, durationMs: Date.now() - startedAt, err: error },
        'Background job failed; the next run retries',
      );
    } finally {
      this.inFlight.delete(name);
    }
  }

  // --- Jobs (public: callable directly by tests and manual operations, §69) --------

  /**
   * Flags ACTIVE listings whose runway has elapsed as ARCHIVED (§70, §164;
   * api-contract §152). This is a system command: it shares the conditional
   * update + SYSTEM-revision mechanics of human transitions, with a null actor
   * and no moderation/audit rows (both require a human admin, §58).
   *
   * Public reads already hide expired listings, so this pass only reconciles
   * the stored status; idempotent because a re-run finds no candidates.
   */
  async expireListings(now: Date = new Date()): Promise<JobLogFields> {
    const outcome = await this.listings.expireOverdueListings(this.jobsConfig.batchSize, now);
    return { scanned: outcome.scanned, updated: outcome.updated };
  }

  /** Archives DRAFT listings untouched for STALE_DRAFT_ARCHIVE_AFTER_DAYS (§69). */
  async archiveStaleDrafts(now: Date = new Date()): Promise<JobLogFields> {
    const outcome = await this.listings.archiveStaleDraftListings(this.jobsConfig.batchSize, now);
    return { scanned: outcome.scanned, updated: outcome.updated };
  }

  /**
   * Deletes verification challenges whose expiry is older than
   * JOBS_CHALLENGE_RETENTION_DAYS. Once a challenge is past retention it can
   * never be verified again, so the row only wastes space; the retention
   * window (instead of deleting at `expiresAt`) keeps the authoritative
   * expiry check meaningful for fresh rejections.
   */
  async cleanExpiredVerificationChallenges(now: Date = new Date()): Promise<JobLogFields> {
    const cutoff = this.daysAgo(now, this.jobsConfig.challengeRetentionDays);
    return this.deleteBounded(
      () =>
        this.prisma.verificationChallenge.findMany({
          where: { expiresAt: { lt: cutoff } },
          orderBy: { expiresAt: 'asc' },
          take: this.jobsConfig.batchSize,
          select: { id: true },
        }),
      async (ids) => {
        const result = await this.prisma.verificationChallenge.deleteMany({
          where: { id: { in: ids }, expiresAt: { lt: cutoff } },
        });
        return result.count;
      },
    );
  }

  /**
   * Deletes refresh sessions whose expiry is older than
   * JOBS_REFRESH_SESSION_RETENTION_DAYS. The retention window keeps recently
   * expired sessions long enough for refresh-token reuse detection to match a
   * replayed (rotated) token within its family; beyond it nothing can match.
   */
  async cleanExpiredRefreshSessions(now: Date = new Date()): Promise<JobLogFields> {
    const cutoff = this.daysAgo(now, this.jobsConfig.refreshSessionRetentionDays);
    return this.deleteBounded(
      () =>
        this.prisma.refreshSession.findMany({
          where: { expiresAt: { lt: cutoff } },
          orderBy: { expiresAt: 'asc' },
          take: this.jobsConfig.batchSize,
          select: { id: true },
        }),
      async (ids) => {
        const result = await this.prisma.refreshSession.deleteMany({
          where: { id: { in: ids }, expiresAt: { lt: cutoff } },
        });
        return result.count;
      },
    );
  }

  /**
   * Removes media that no longer backs a live row, in two bounded phases
   * (§64, §67, §69 — deletion is deferred by the retention window so a delayed
   * reader holding a URL is not punished):
   *
   *   1. soft-deleted ListingImage rows past ORPHAN_MEDIA_RETENTION_DAYS:
   *      delete the original + every variant object through the
   *      StorageProvider, then hard-delete the row;
   *   2. every storage key under `listings/` older than the retention window
   *      that no ListingImage row references (failed uploads, partial
   *      cleanups). Fresh objects are never touched, so an upload that has not
   *      committed its row yet is safe.
   *
   * Objects of a row whose deletion is still inside the retention window are
   * left alone, and live images never match either phase.
   */
  async cleanOrphanMedia(now: Date = new Date()): Promise<JobLogFields> {
    const cutoff = this.daysAgo(now, this.storageLimits.orphanMediaRetentionDays);
    const rows = await this.sweepDeletedImageRows(cutoff);
    const reconciled = await this.removeUnreferencedObjects(cutoff);
    return { scanned: rows.scanned, deleted: rows.deleted, reconciled };
  }

  /**
   * Safe cleanup of archived listings' images (master prompt §5, §8, §9).
   *
   * Opt-in and dry-run by default: the interval only registers when
   * `cleanArchivedListingImagesEnabled` is true, and this method refuses to
   * mutate while that flag is false — so direct calls are as safe as timers.
   */
  async cleanArchivedListingImages(now: Date = new Date()): Promise<JobLogFields> {
    const startedAt = Date.now();
    const counts: JobLogFields = {
      scannedListings: 0,
      eligibleListings: 0,
      claimedListings: 0,
      claimedImages: 0,
      purgedListings: 0,
      purgedImages: 0,
      skippedGuard: 0,
      skippedReport: 0,
      skippedModeration: 0,
      storageFailed: 0,
      dbFailed: 0,
      needsReconciliation: 0,
    };

    if (!this.jobsConfig.cleanArchivedListingImagesEnabled) {
      counts.durationMs = Date.now() - startedAt;
      return counts;
    }

    const cutoff = this.daysAgo(now, this.jobsConfig.archivedImageRetentionDays);
    const candidates = await this.prisma.listing.findMany({
      where: {
        status: 'ARCHIVED',
        archivedAt: { lte: cutoff },
        deletedAt: null,
        images: { some: { deletedAt: null } },
      },
      orderBy: [{ archivedAt: 'asc' }, { id: 'asc' }],
      take: this.jobsConfig.batchSize,
      select: { id: true },
    });
    counts.scannedListings = candidates.length;

    for (const candidate of candidates) {
      try {
        if (this.jobsConfig.cleanArchivedListingImagesDryRun) {
          await this.inspectForDryRun(candidate.id, cutoff, counts);
        } else {
          await this.claimArchivedListing(candidate.id, cutoff, now, counts);
        }
      } catch (error) {
        counts.dbFailed += 1;
        this.logger.warn(
          { listingId: candidate.id, err: error },
          'Archived image cleanup: listing skipped due to error',
        );
      }
    }

    counts.durationMs = Date.now() - startedAt;
    return counts;
  }

  /** Read-only candidate inspection: classifies the reason without mutating (§8). */
  private async inspectForDryRun(
    listingId: string,
    cutoff: Date,
    counts: JobLogFields,
  ): Promise<void> {
    const [listing, reportCount, moderationCount, liveImageCount] = await Promise.all([
      this.prisma.listing.findUnique({
        where: { id: listingId },
        select: { status: true, archivedAt: true, deletedAt: true },
      }),
      this.prisma.report.count({ where: { listingId } }),
      this.prisma.moderationAction.count({ where: { listingId } }),
      this.prisma.listingImage.count({ where: { listingId, deletedAt: null } }),
    ]);
    if (reportCount > 0) {
      counts.skippedReport += 1;
      return;
    }
    if (moderationCount > 0) {
      counts.skippedModeration += 1;
      return;
    }
    if (
      listing === null ||
      listing.deletedAt !== null ||
      listing.status !== 'ARCHIVED' ||
      listing.archivedAt === null ||
      listing.archivedAt > cutoff ||
      liveImageCount === 0
    ) {
      counts.skippedGuard += 1;
      return;
    }
    counts.eligibleListings += 1;
  }

  /**
   * Atomic claim for one listing: lock, re-check every guard, soft-delete every
   * live image row, commit; then delete the binaries per-key (best effort).
   */
  private async claimArchivedListing(
    listingId: string,
    cutoff: Date,
    now: Date,
    counts: JobLogFields,
  ): Promise<void> {
    let keys: string[] = [];
    await this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Listing" WHERE id = ${listingId}::uuid FOR UPDATE`;

      const listing = await tx.listing.findUnique({
        where: { id: listingId },
        select: { status: true, archivedAt: true, deletedAt: true },
      });
      if (
        listing === null ||
        listing.deletedAt !== null ||
        listing.status !== 'ARCHIVED' ||
        listing.archivedAt === null ||
        listing.archivedAt > cutoff
      ) {
        counts.skippedGuard += 1;
        return;
      }

      const reportCount = await tx.report.count({ where: { listingId } });
      if (reportCount > 0) {
        counts.skippedReport += 1;
        return;
      }
      const moderationCount = await tx.moderationAction.count({ where: { listingId } });
      if (moderationCount > 0) {
        counts.skippedModeration += 1;
        return;
      }

      const images = await tx.listingImage.findMany({
        where: { listingId, deletedAt: null },
        select: { storageKey: true, variants: true },
      });
      if (images.length === 0) {
        counts.skippedGuard += 1;
        return;
      }

      const claimed = await tx.listingImage.updateMany({
        where: { listingId, deletedAt: null },
        data: { deletedAt: now },
      });

      keys = images.flatMap((image) => [image.storageKey, ...readVariantKeys(image.variants)]);
      counts.claimedListings += 1;
      counts.claimedImages += claimed.count;
    });

    if (keys.length === 0) {
      return;
    }

    let deletedFiles = 0;
    let failed = false;
    for (const key of keys) {
      try {
        await this.storage.delete(key);
        deletedFiles += 1;
      } catch (error) {
        failed = true;
        counts.storageFailed += 1;
        this.logger.warn(
          { key, err: error },
          'Archived image cleanup: storage deletion failed; left to clean-orphan-media',
        );
      }
    }
    counts.purgedImages += deletedFiles;
    if (failed) {
      counts.needsReconciliation += 1;
    } else {
      counts.purgedListings += 1;
    }
  }

  // --- Internals -------------------------------------------------------------------

  /**
   * Bounded read-then-delete used by the retention cleanups: at most
   * `JOBS_BATCH_SIZE` rows are deleted per pass, and the delete re-checks the
   * cutoff so a row that was touched in between is simply handled by a later
   * pass instead of being deleted on stale information.
   */
  private async deleteBounded(
    loadBatch: () => Promise<Array<{ id: string }>>,
    deleteBatch: (ids: string[]) => Promise<number>,
  ): Promise<CleanupOutcome> {
    const rows = await loadBatch();
    if (rows.length === 0) {
      return { scanned: 0, deleted: 0 };
    }
    const deleted = await deleteBatch(rows.map((row) => row.id));
    return { scanned: rows.length, deleted };
  }

  /** Phase 1 of the orphan sweep: soft-deleted rows past retention. */
  private async sweepDeletedImageRows(cutoff: Date): Promise<CleanupOutcome> {
    const rows = await this.prisma.listingImage.findMany({
      where: { deletedAt: { lt: cutoff } },
      orderBy: { deletedAt: 'asc' },
      take: this.jobsConfig.batchSize,
      select: { id: true, storageKey: true, variants: true },
    });

    let deleted = 0;
    for (const row of rows) {
      const keys = [row.storageKey, ...readVariantKeys(row.variants)];
      try {
        for (const key of keys) {
          // Storage is touched through the provider only (§64); a missing
          // object is not an error. The row survives until every object is
          // gone, so a failed pass is retried intact by the next interval.
          await this.storage.delete(key);
        }
      } catch (error) {
        this.logger.warn(
          { imageId: row.id, err: error },
          'Orphan sweep: storage deletion failed; row kept for the next pass',
        );
        continue;
      }
      const result = await this.prisma.listingImage.deleteMany({
        where: { id: row.id, deletedAt: { lt: cutoff } },
      });
      deleted += result.count;
    }
    return { scanned: rows.length, deleted };
  }

  /** Phase 2 of the orphan sweep: storage keys with no ListingImage row. */
  private async removeUnreferencedObjects(cutoff: Date): Promise<number> {
    const objects = await this.storage.list(LISTINGS_KEY_PREFIX);
    const stale = objects
      .filter((object) => object.lastModified < cutoff)
      .sort((left, right) => left.lastModified.getTime() - right.lastModified.getTime());

    /**
     * Bounded pass: delete at most `batchSize` objects per run, but scan up to
     * `batchSize * SCAN_TO_DELETE_RATIO` stale candidates. A pure scan cap
     * would starve unreferenced objects when the front of the queue is full of
     * still-referenced storage keys (e.g. live images, or soft-deleted rows
     * that have their own retention sweep in phase 1). Scanning past the first
     * N entries ensures starvation is impossible within a single production
     * bucket of that size, while still bounding total work per pass.
     */
    const SCAN_TO_DELETE_RATIO = 10;
    const maxScanned = this.jobsConfig.batchSize * SCAN_TO_DELETE_RATIO;
    const maxRemoved = this.jobsConfig.batchSize;

    let removed = 0;
    for (let i = 0; i < stale.length && i < maxScanned && removed < maxRemoved; i += 1) {
      const object = stale[i];
      const imageId = parseListingImageId(object.key);
      if (imageId === null) {
        continue;
      }
      const row = await this.prisma.listingImage.findUnique({
        where: { id: imageId },
        select: { id: true },
      });
      if (row !== null) {
        continue;
      }
      try {
        await this.storage.delete(object.key);
        removed += 1;
      } catch (error) {
        this.logger.warn(
          { key: object.key, err: error },
          'Orphan sweep: unreferenced object could not be removed',
        );
      }
    }
    return removed;
  }

  private daysAgo(base: Date, days: number): Date {
    return new Date(base.getTime() - days * 24 * 60 * 60 * 1000);
  }
}

/** Root prefix of every key the media pipeline generates (§64). */
const LISTINGS_KEY_PREFIX = 'listings/';

/** Generated keys are `listings/<listingId uuid>/<imageId uuid>/<file>`. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Extracts the ListingImage id from a generated storage key. Returns null for
 * anything that is not exactly the four-segment shape this application
 * produces, so the reconcile phase only ever considers its own keys.
 */
function parseListingImageId(key: string): string | null {
  const segments = key.split('/');
  if (segments.length !== 4 || segments[0] !== 'listings') {
    return null;
  }
  const [, listingId, imageId] = segments;
  if (!UUID_PATTERN.test(listingId) || !UUID_PATTERN.test(imageId)) {
    return null;
  }
  return imageId;
}

/**
 * Storage keys inside a `ListingImage.variants` descriptor
 * (`{ thumbnail: { key, ... }, medium: {...}, large: {...} }`, see
 * `media.service.ts`). Malformed payloads yield no keys — the sweep must never
 * crash on one bad row.
 */
function readVariantKeys(raw: Prisma.JsonValue): string[] {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return [];
  }
  const keys: string[] = [];
  for (const descriptor of Object.values(raw)) {
    if (descriptor === null || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
      continue;
    }
    const key = (descriptor as { key?: unknown }).key;
    if (typeof key === 'string' && key.length > 0) {
      keys.push(key);
    }
  }
  return keys;
}
