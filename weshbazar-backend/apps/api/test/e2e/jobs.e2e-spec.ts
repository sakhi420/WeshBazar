/**
 * Background jobs e2e (Phase 14) — boots the real application (test database +
 * local storage) and covers spec §69, §70, §164 (api-contract §152, §153):
 *
 *  - JOBS_ENABLED=false registers no timers (§69) while the job methods stay
 *    directly callable
 *  - an expired ACTIVE listing disappears from the public feed, the detail and
 *    the seller profile count immediately — before any job runs
 *  - the expire job flips it to ARCHIVED with a SYSTEM revision (null actor,
 *    version+1) and writes no moderation/audit rows; a re-run is a no-op
 *  - stale drafts are archived with a SYSTEM revision while recent drafts are
 *    untouched
 *  - expired verification challenges / refresh sessions are deleted only past
 *    the retention window
 *  - the orphan-media sweep deletes storage objects + rows only after
 *    retention, never touches live images, and reconciles unreferenced keys
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request from 'supertest';
import sharp from 'sharp';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { validateEnv } from '../../src/config/env.schema';
import { PrismaService } from '../../src/database/prisma.service';
import { JobsService } from '../../src/modules/jobs/jobs.service';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../src/providers/storage/storage.provider';

const PASSWORD = 'S3cure!Pass';
const RUN_ID = randomInt(0x100000, 0xffffff).toString(16);
const PREFIX = `e2e-${RUN_ID}`;
const CODE_BASE = RUN_ID.slice(0, 4).toUpperCase();
const DESCRIPTION = `${PREFIX} Well maintained device including original box and charger.`;
const IMAGE_WIDTH = 1200;
const IMAGE_HEIGHT = 800;

/** Retention windows mirrored from test-env.ts (days). */
const CHALLENGE_RETENTION_DAYS = 1;
const SESSION_RETENTION_DAYS = 30;
const MEDIA_RETENTION_DAYS = 7;
const STALE_DRAFT_DAYS = 30;

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string };
  requestId: string;
}

interface RefData {
  id: string;
  slug: string;
}

interface ImageData {
  id: string;
  url: string;
  variants: Record<string, { url: string; width: number; height: number }>;
}

interface OwnerListingData {
  id: string;
  slug: string;
  status: string;
  version: number;
  expiresAt: string | null;
  archivedAt: string | null;
  publishedAt: string | null;
  images: ImageData[];
}

interface RevisionData {
  version: number;
  changeType: string;
  snapshot: Record<string, unknown>;
  createdByUserId: string | null;
}

interface PublicSummaryData {
  id: string;
  slug: string;
}

interface PublicSellerProfileData {
  slug: string;
  activeListingCount: number;
}

interface SellerFixture {
  userId: string;
  token: string;
}

let phoneSeed = 0;

function uniquePhone(): string {
  phoneSeed += 1;
  const suffix = String((randomInt(0, 9_000_000) + phoneSeed) % 10_000_000).padStart(7, '0');
  return `+9370${suffix}`;
}

function daysAgo(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysAhead(days: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/** Solid-colour test image; any distinct buffer works for the pipeline. */
async function makeImage(color = '#3366aa'): Promise<Buffer> {
  return sharp({
    create: { width: IMAGE_WIDTH, height: IMAGE_HEIGHT, channels: 3, background: color },
  })
    .jpeg()
    .toBuffer();
}

describe('Background jobs (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let jobs: JobsService;
  let rateLimitService: RateLimitService;
  let storage: StorageProvider;
  let jpegImage: Buffer;

  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];
  const createdPhones: string[] = [];
  /** Storage keys planted outside the listing prefixes (reconcile tests). */
  const plantedStorageKeys: string[] = [];

  let adminToken: string;
  let sellerA: SellerFixture;
  let jobsCat: RefData;
  let provinceX: RefData;
  let cityX: RefData;

  beforeAll(async () => {
    const env = validateEnv(process.env);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter(env));
    app.useLogger(false);
    await configureApp(app, env);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    server = app.getHttpServer();
    prisma = app.get(PrismaService);
    jobs = app.get(JobsService);
    rateLimitService = app.get(RateLimitService);
    storage = app.get<StorageProvider>(STORAGE_PROVIDER);

    jpegImage = await makeImage();
    adminToken = (await createAdminToken()).token;
    await createFixtures();
  });

  beforeEach(() => {
    rateLimitService.reset();
  });

  afterAll(async () => {
    const sellerAccounts = await prisma.sellerAccount.findMany({
      where: { ownerUserId: { in: createdUserIds } },
      select: { id: true },
    });
    const sellerAccountIds = sellerAccounts.map((seller) => seller.id);
    await prisma.listing.deleteMany({ where: { sellerAccountId: { in: sellerAccountIds } } });
    for (const listingId of createdListingIds) {
      await storage.deletePrefix(`listings/${listingId}`).catch(() => 0);
    }
    for (const key of plantedStorageKeys) {
      await storage.delete(key).catch(() => undefined);
    }
    await prisma.verificationChallenge.deleteMany({ where: { phone: { in: createdPhones } } });
    await prisma.category.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.city.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.province.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.sellerAccount.deleteMany({ where: { id: { in: sellerAccountIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  // --- Helpers -----------------------------------------------------------------

  async function registerUser(displayName: string): Promise<SellerFixture> {
    rateLimitService.reset();
    const phone = uniquePhone();
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone, password: PASSWORD, displayName })
      .expect(201);
    const body = response.body as SuccessEnvelope<{
      user: { id: string };
      tokens: { accessToken: string };
    }>;
    createdUserIds.push(body.data.user.id);
    await prisma.user.update({
      where: { id: body.data.user.id },
      data: { phoneVerifiedAt: new Date() },
    });
    return { userId: body.data.user.id, token: body.data.tokens.accessToken };
  }

  async function createAdminToken(): Promise<{ token: string; userId: string }> {
    rateLimitService.reset();
    const phone = uniquePhone();
    const register = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone, password: PASSWORD, displayName: 'E2E Jobs Admin' })
      .expect(201);
    const registered = register.body as SuccessEnvelope<{ user: { id: string } }>;
    const userId = registered.data.user.id;
    createdUserIds.push(userId);
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ phone, password: PASSWORD })
      .expect(200);
    return {
      token: (login.body as SuccessEnvelope<{ tokens: { accessToken: string } }>).data.tokens
        .accessToken,
      userId,
    };
  }

  async function createCategory(payload: Record<string, unknown>): Promise<RefData> {
    const response = await request(server)
      .post('/api/v1/admin/categories')
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<RefData>).data;
  }

  async function createFixtures(): Promise<void> {
    // Leaf + AUTO_APPROVE: submit publishes immediately, so the suite can pin
    // `expiresAt` and exercise the expiration job without moderation.
    jobsCat = await createCategory({
      slug: `${PREFIX}-jobs-cat`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Jobs Category' }],
    });
    const province = await request(server)
      .post('/api/v1/admin/provinces')
      .set('authorization', `Bearer ${adminToken}`)
      .send({
        code: `JM-${CODE_BASE}`,
        translations: [{ locale: 'en', name: 'E2E Jobs Province' }],
      })
      .expect(201);
    provinceX = (province.body as SuccessEnvelope<RefData>).data;
    const city = await request(server)
      .post(`/api/v1/admin/provinces/${provinceX.id}/cities`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ slug: `${PREFIX}-city`, translations: [{ locale: 'en', name: 'E2E Jobs City' }] })
      .expect(201);
    cityX = (city.body as SuccessEnvelope<RefData>).data;

    sellerA = await registerUser('E2E Jobs Seller A');
  }

  async function draft(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<OwnerListingData> {
    const response = await request(server)
      .post('/api/v1/listings')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: `${PREFIX} Jobs Listing`,
        description: DESCRIPTION,
        categoryId: jobsCat.id,
        provinceId: provinceX.id,
        cityId: cityX.id,
        condition: 'GOOD',
        pricingType: 'PAID',
        price: 45_000,
        currency: 'AFN',
        ...overrides,
      })
      .expect(201);
    const data = (response.body as SuccessEnvelope<OwnerListingData>).data;
    createdListingIds.push(data.id);
    return data;
  }

  /** Draft + submit; asserts the AUTO_APPROVE category published it as ACTIVE. */
  async function publish(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<OwnerListingData> {
    const created = await draft(token, overrides);
    const response = await request(server)
      .post(`/api/v1/listings/${created.id}/submit`)
      .set('authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    const published = (response.body as SuccessEnvelope<OwnerListingData>).data;
    expect(published.status).toBe('ACTIVE');
    expect(published.expiresAt).not.toBeNull();
    return published;
  }

  async function ownerView(token: string, listingId: string): Promise<OwnerListingData> {
    const response = await request(server)
      .get(`/api/v1/me/listings/${listingId}`)
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    return (response.body as SuccessEnvelope<OwnerListingData>).data;
  }

  async function fetchRevisions(token: string, listingId: string): Promise<RevisionData[]> {
    const response = await request(server)
      .get(`/api/v1/listings/${listingId}/revisions`)
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    return (response.body as SuccessEnvelope<RevisionData[]>).data;
  }

  /** Feed ids restricted to the suite category. */
  async function feedIds(): Promise<string[]> {
    const response = await request(server)
      .get(`/api/v1/listings?category=${jobsCat.slug}&limit=60`)
      .expect(200);
    return (response.body as SuccessEnvelope<PublicSummaryData[]>).data.map((item) => item.id);
  }

  async function sellerProfileCount(sellerUserId: string): Promise<number> {
    const account = await prisma.sellerAccount.findUniqueOrThrow({
      where: { ownerUserId: sellerUserId },
      select: { slug: true },
    });
    const response = await request(server).get(`/api/v1/sellers/${account.slug}`).expect(200);
    return (response.body as SuccessEnvelope<PublicSellerProfileData>).data.activeListingCount;
  }

  async function uploadImage(token: string, listingId: string): Promise<ImageData> {
    const response = await request(server)
      .post(`/api/v1/listings/${listingId}/images`)
      .set('authorization', `Bearer ${token}`)
      .attach('file', jpegImage, 'photo.jpg');
    expect(response.status).toBe(201);
    const data = (response.body as SuccessEnvelope<OwnerListingData>).data;
    expect(data.images).toHaveLength(1);
    return data.images[0];
  }

  /** Original + variant storage keys of an image row (mirrors media.service). */
  async function imageStorageKeys(imageId: string): Promise<string[]> {
    const row = await prisma.listingImage.findUniqueOrThrow({
      where: { id: imageId },
      select: { storageKey: true, variants: true },
    });
    const variants = row.variants as unknown as Record<string, { key?: string } | undefined>;
    const keys = [row.storageKey];
    for (const descriptor of Object.values(variants)) {
      if (descriptor?.key !== undefined) {
        keys.push(descriptor.key);
      }
    }
    return keys;
  }

  async function createChallenge(expiresAt: Date): Promise<string> {
    const phone = uniquePhone();
    createdPhones.push(phone);
    const row = await prisma.verificationChallenge.create({
      data: {
        phone,
        purpose: 'REGISTER',
        codeHash: randomUUID().replaceAll('-', ''),
        expiresAt,
        maxAttempts: 5,
        resendAvailableAt: expiresAt,
        lastSentAt: expiresAt,
        createdAt: expiresAt,
      },
      select: { id: true },
    });
    return row.id;
  }

  async function createSession(userId: string, expiresAt: Date): Promise<string> {
    const row = await prisma.refreshSession.create({
      data: {
        userId,
        familyId: randomUUID(),
        tokenHash: randomUUID().replaceAll('-', ''),
        expiresAt,
        createdAt: expiresAt,
        lastUsedAt: expiresAt,
      },
      select: { id: true },
    });
    return row.id;
  }

  // --- Scheduling configuration -------------------------------------------------

  describe('scheduling configuration (spec §69)', () => {
    it('registers no timers under JOBS_ENABLED=false while the methods stay callable', async () => {
      const scheduler = app.get(SchedulerRegistry);
      expect(scheduler.getIntervals()).toEqual([]);

      // Directly callable regardless of the flag — the same entry points the
      // scheduled handlers use.
      const outcome = await jobs.expireListings();
      expect(typeof outcome.scanned).toBe('number');
      expect(typeof outcome.updated).toBe('number');
    });
  });

  // --- Listing expiration --------------------------------------------------------

  describe('listing expiration (spec §70; api-contract §152, §153)', () => {
    // A dedicated seller keeps the profile-count assertion deterministic.
    let expirySeller: SellerFixture;
    let expiredId: string;
    let expiredSlug: string;
    let expiredVersion: number;
    let liveId: string;

    beforeAll(async () => {
      expirySeller = await registerUser('E2E Jobs Expiry Seller');
      const live = await publish(expirySeller.token, { title: `${PREFIX} Jobs Live Listing` });
      const expired = await publish(expirySeller.token, {
        title: `${PREFIX} Jobs Expiring Listing`,
      });
      liveId = live.id;
      expiredId = expired.id;
      expiredSlug = expired.slug;
      expiredVersion = expired.version;

      // Backdate the runway: ACTIVE but past `expiresAt` (§70).
      await prisma.listing.update({
        where: { id: expiredId },
        data: { expiresAt: daysAgo(1) },
      });
    });

    it('hides the expired listing from the public feed, detail and profile count', async () => {
      const ids = await feedIds();
      expect(ids).toContain(liveId);
      expect(ids).not.toContain(expiredId);

      const detail = await request(server).get(`/api/v1/listings/${expiredSlug}`).expect(404);
      expect((detail.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_FOUND');

      // Only the live listing counts as publicly active (§70) — the expired row
      // is still ACTIVE in the database, i.e. the job has not run yet.
      expect(await sellerProfileCount(expirySeller.userId)).toBe(1);

      // The owner still sees the truth: status + expired runway (§152).
      const owner = await ownerView(expirySeller.token, expiredId);
      expect(owner.status).toBe('ACTIVE');
      expect(new Date(owner.expiresAt!).getTime()).toBeLessThan(Date.now());
    });

    it('archives it through the expire job with a SYSTEM revision and no admin rows', async () => {
      const outcome = await jobs.expireListings();
      expect(outcome.updated).toBeGreaterThanOrEqual(1);

      const owner = await ownerView(expirySeller.token, expiredId);
      expect(owner.status).toBe('ARCHIVED');
      expect(owner.archivedAt).not.toBeNull();
      expect(owner.version).toBe(expiredVersion + 1);

      const revisions = await fetchRevisions(expirySeller.token, expiredId);
      const latest = revisions[0];
      expect(latest.version).toBe(expiredVersion + 1);
      expect(latest.changeType).toBe('SYSTEM');
      expect(latest.createdByUserId).toBeNull();
      expect(latest.snapshot.status).toBe('ARCHIVED');

      // System transitions write no admin-actor rows (§58).
      expect(await prisma.moderationAction.count({ where: { listingId: expiredId } })).toBe(0);
      expect(
        await prisma.auditLog.count({ where: { entityType: 'Listing', entityId: expiredId } }),
      ).toBe(0);

      // Public reads stay consistent after the reconciliation.
      const ids = await feedIds();
      expect(ids).toContain(liveId);
      expect(ids).not.toContain(expiredId);
      await request(server).get(`/api/v1/listings/${expiredSlug}`).expect(404);
      expect(await sellerProfileCount(expirySeller.userId)).toBe(1);
    });

    it('is idempotent — a second pass finds nothing to do', async () => {
      const second = await jobs.expireListings();
      expect(second).toEqual({ scanned: 0, updated: 0 });
    });
  });

  // --- Stale drafts --------------------------------------------------------------

  describe('stale draft archiving (spec §69)', () => {
    it('archives only drafts past the TTL and records a SYSTEM revision', async () => {
      const stale = await draft(sellerA.token, { title: `${PREFIX} Jobs Stale Draft` });
      const fresh = await draft(sellerA.token, { title: `${PREFIX} Jobs Fresh Draft` });

      // Backdate `updatedAt` (Prisma manages the column; raw SQL is explicit).
      const backdated = daysAgo(STALE_DRAFT_DAYS + 1);
      await prisma.$executeRaw`UPDATE "Listing" SET "updatedAt" = ${backdated} WHERE "id" = ${stale.id}::uuid`;

      const outcome = await jobs.archiveStaleDrafts();
      expect(outcome.updated).toBeGreaterThanOrEqual(1);

      const archived = await ownerView(sellerA.token, stale.id);
      expect(archived.status).toBe('ARCHIVED');
      expect(archived.archivedAt).not.toBeNull();
      expect(archived.version).toBe(stale.version + 1);

      const revisions = await fetchRevisions(sellerA.token, stale.id);
      expect(revisions[0].changeType).toBe('SYSTEM');
      expect(revisions[0].createdByUserId).toBeNull();
      expect(revisions[0].snapshot.status).toBe('ARCHIVED');

      const untouched = await ownerView(sellerA.token, fresh.id);
      expect(untouched.status).toBe('DRAFT');
      expect(untouched.version).toBe(fresh.version);

      const second = await jobs.archiveStaleDrafts();
      expect(second).toEqual({ scanned: 0, updated: 0 });
    });
  });

  // --- Retention cleanups --------------------------------------------------------

  describe('retention cleanups (spec §69, §164)', () => {
    it('deletes verification challenges only past the retention window', async () => {
      const oldId = await createChallenge(daysAgo(CHALLENGE_RETENTION_DAYS + 2));
      const freshId = await createChallenge(daysAgo(0.5));

      const outcome = await jobs.cleanExpiredVerificationChallenges();
      expect(outcome.deleted).toBeGreaterThanOrEqual(1);

      expect(await prisma.verificationChallenge.findUnique({ where: { id: oldId } })).toBeNull();
      expect(
        await prisma.verificationChallenge.findUnique({ where: { id: freshId } }),
      ).not.toBeNull();
    });

    it('deletes refresh sessions only past the retention window', async () => {
      const oldId = await createSession(sellerA.userId, daysAgo(SESSION_RETENTION_DAYS + 10));
      const freshId = await createSession(sellerA.userId, daysAgo(1));

      const outcome = await jobs.cleanExpiredRefreshSessions();
      expect(outcome.deleted).toBeGreaterThanOrEqual(1);

      expect(await prisma.refreshSession.findUnique({ where: { id: oldId } })).toBeNull();
      expect(await prisma.refreshSession.findUnique({ where: { id: freshId } })).not.toBeNull();
    });
  });

  // --- Orphan media --------------------------------------------------------------

  describe('orphan media sweep (spec §64, §67, §69)', () => {
    it('removes soft-deleted images and their objects only after retention', async () => {
      // Past retention: must be swept (row + all four objects).
      const expiredTarget = await draft(sellerA.token, { title: `${PREFIX} Jobs Swept Image` });
      const expiredImage = await uploadImage(sellerA.token, expiredTarget.id);
      await request(server)
        .delete(`/api/v1/listings/${expiredTarget.id}/images/${expiredImage.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      await prisma.listingImage.update({
        where: { id: expiredImage.id },
        data: { deletedAt: daysAgo(MEDIA_RETENTION_DAYS + 1) },
      });

      // Inside retention: must survive (§67 — a delayed reader may hold the URL).
      const freshTarget = await draft(sellerA.token, { title: `${PREFIX} Jobs Kept Image` });
      const freshImage = await uploadImage(sellerA.token, freshTarget.id);
      await request(server)
        .delete(`/api/v1/listings/${freshTarget.id}/images/${freshImage.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);

      const expiredKeys = await imageStorageKeys(expiredImage.id);
      const freshKeys = await imageStorageKeys(freshImage.id);
      expect(expiredKeys).toHaveLength(4); // original + thumbnail/medium/large
      for (const key of [...expiredKeys, ...freshKeys]) {
        expect(await storage.exists(key)).toBe(true);
      }

      const outcome = await jobs.cleanOrphanMedia();
      expect(outcome.deleted).toBeGreaterThanOrEqual(1);

      expect(await prisma.listingImage.findUnique({ where: { id: expiredImage.id } })).toBeNull();
      for (const key of expiredKeys) {
        expect(await storage.exists(key)).toBe(false);
      }

      const kept = await prisma.listingImage.findUnique({ where: { id: freshImage.id } });
      expect(kept).not.toBeNull();
      expect(kept?.deletedAt).not.toBeNull();
      for (const key of freshKeys) {
        expect(await storage.exists(key)).toBe(true);
      }
    });

    it('never touches live images or their objects', async () => {
      const target = await draft(sellerA.token, { title: `${PREFIX} Jobs Live Image` });
      const image = await uploadImage(sellerA.token, target.id);
      const keys = await imageStorageKeys(image.id);

      await jobs.cleanOrphanMedia();

      const row = await prisma.listingImage.findUnique({ where: { id: image.id } });
      expect(row).not.toBeNull();
      expect(row?.deletedAt).toBeNull();
      for (const key of keys) {
        expect(await storage.exists(key)).toBe(true);
      }
    });

    it('reconciles unreferenced storage keys only past retention', async () => {
      // A generated-shape key with no ListingImage row (failed-upload leftover).
      const orphanKey = `listings/${randomUUID()}/${randomUUID()}/original.jpg`;
      // A key the pipeline never generates: the parser must leave it alone.
      const foreignKey = `listings/${randomUUID()}/not-an-image-id/original.jpg`;
      await storage.put(orphanKey, jpegImage, 'image/jpeg');
      await storage.put(foreignKey, jpegImage, 'image/jpeg');
      plantedStorageKeys.push(orphanKey, foreignKey);

      // Fresh mtime: inside the retention window, nothing is reconciled.
      await jobs.cleanOrphanMedia();
      expect(await storage.exists(orphanKey)).toBe(true);

      // Simulate the retention window elapsing without touching mtimes: move
      // the job's clock forward past the cutoff.
      const later = daysAhead(MEDIA_RETENTION_DAYS + 1);
      const outcome = await jobs.cleanOrphanMedia(later);
      expect(outcome.reconciled).toBeGreaterThanOrEqual(1);

      expect(await storage.exists(orphanKey)).toBe(false);
      expect(await storage.exists(foreignKey)).toBe(true);

      // Objects that still back a row are never reconciled, even past the cutoff.
      const target = await draft(sellerA.token, { title: `${PREFIX} Jobs Protected Image` });
      const image = await uploadImage(sellerA.token, target.id);
      const keys = await imageStorageKeys(image.id);
      await jobs.cleanOrphanMedia(later);
      for (const key of keys) {
        expect(await storage.exists(key)).toBe(true);
      }
    });
  });
});
