/**
 * Integration tests for the `reports.submit` ↔ archived-image-cleanup lock race
 * (spec §5.16.3–§5.16.4). Two independent PostgreSQL connections drive a real
 * `FOR UPDATE` row-lock ordering and assert the final DB + storage state.
 */
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AppException } from '../../src/common/errors/app.exception';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import configuration from '../../src/config/configuration';
import { PrismaService } from '../../src/database/prisma.service';
import { ListingStatsService } from '../../src/modules/analytics/listing-stats.service';
import { JobsService } from '../../src/modules/jobs/jobs.service';
import { ListingsService } from '../../src/modules/listings/listings.service';
import { ReportsService } from '../../src/modules/reports/reports.service';
import { LocalStorageProvider } from '../../src/providers/storage/local-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from '../../src/providers/storage/storage.provider';

const DAY_MS = 24 * 60 * 60 * 1000;

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function unique(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 12)}`;
}

/** Wipe prior-run fixtures so global job counts stay deterministic per suite. */
async function purgeTestData(prisma: PrismaService): Promise<void> {
  await prisma.listingImage.deleteMany({});
  await prisma.listingRevision.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.moderationAction.deleteMany({});
  await prisma.listing.deleteMany({});
}

/** Barrier/gate hooks swapped per test; never touched by production code. */
interface JobHooks {
  jobDeleteGate?: { promise: Promise<void> };
}

async function buildJobModule(storageRoot: string, hooks: JobHooks = {}) {
  process.env.JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED = 'true';
  process.env.JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN = 'false';
  process.env.LOCAL_STORAGE_PATH = storageRoot;
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ScheduleModule.forRoot(),
    ],
    providers: [
      PrismaService,
      JobsService,
      LocalStorageProvider,
      {
        provide: STORAGE_PROVIDER,
        inject: [LocalStorageProvider],
        useFactory: (inner: LocalStorageProvider): StorageProvider => ({
          put: (key: string, data: Buffer, contentType: string) => inner.put(key, data, contentType),
          delete: async (key: string) => {
            if (hooks.jobDeleteGate) {
              await hooks.jobDeleteGate.promise;
            }
            return inner.delete(key);
          },
          deletePrefix: (prefix: string) => inner.deletePrefix(prefix),
          exists: (key: string) => inner.exists(key),
          getPublicUrl: (key: string) => inner.getPublicUrl(key),
          list: (prefix: string) => inner.list(prefix),
        }),
      },
      { provide: ListingsService, useValue: {} },
    ],
  }).compile();
}

async function buildReportModule() {
  return Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, load: [configuration] })],
    providers: [
      PrismaService,
      ReportsService,
      { provide: RateLimitService, useValue: { enforce: jest.fn() } },
      { provide: ListingStatsService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
    ],
  }).compile();
}

async function seedBase(prisma: PrismaService) {
  const owner = await prisma.user.create({
    data: {
      phone: `070${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('own'),
      passwordHash: 'x'.repeat(60),
      displayName: 'owner',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });
  const reporter = await prisma.user.create({
    data: {
      phone: `071${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('rep'),
      passwordHash: 'x'.repeat(60),
      displayName: 'reporter',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });
  const seller = await prisma.sellerAccount.create({
    data: { ownerUserId: owner.id, displayName: 'seller', slug: unique('sl'), status: 'ACTIVE' },
  });
  const category = await prisma.category.create({
    data: { slug: unique('cat'), moderationMode: 'AUTO_APPROVE' },
  });
  const province = await prisma.province.create({
    data: { code: randomUUID().slice(0, 10), slug: unique('prov') },
  });
  const city = await prisma.city.create({
    data: { provinceId: province.id, slug: unique('city') },
  });
  return { owner, reporter, seller, category, province, city };
}

async function seedListing(
  prisma: PrismaService,
  storage: StorageProvider,
  status: string,
  archivedAt: Date | null,
) {
  const base = await seedBase(prisma);
  const listing = await prisma.listing.create({
    data: {
      sellerAccountId: base.seller.id,
      categoryId: base.category.id,
      provinceId: base.province.id,
      cityId: base.city.id,
      slug: unique('lst'),
      title: 'Listing title',
      description: 'Listing description for the report race test',
      condition: 'NEW',
      status: status as never,
      archivedAt,
    },
  });
  const imageId = randomUUID();
  const key = `listings/${listing.id}/${imageId}/original.jpg`;
  await storage.put(key, Buffer.from('img'), 'image/jpeg');
  await prisma.listingImage.create({
    data: {
      id: imageId,
      listingId: listing.id,
      storageKey: key,
      variants: {},
      mimeType: 'image/jpeg',
      size: 3,
      width: 1,
      height: 1,
      checksum: unique('sum'),
      sortOrder: 0,
      isPrimary: true,
    },
  });
  return { listing, key, ownerUserId: base.owner.id, reporterUserId: base.reporter.id };
}

const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

describe('reports.submit ↔ image-cleanup race (integration)', () => {
  let reportPrisma: PrismaService;
  let jobPrisma: PrismaService;
  let reports: ReportsService;
  let jobs: JobsService;
  let statsMock: { record: jest.Mock };
  let jobStorage: StorageProvider;
  let jobHooks: JobHooks;
  let storageRoot: string;
  let reportModule: Awaited<ReturnType<typeof buildReportModule>>;
  let jobModule: Awaited<ReturnType<typeof buildJobModule>>;

  beforeAll(async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-race-'));
    jobHooks = {};
    jobModule = await buildJobModule(storageRoot, jobHooks);
    reportModule = await buildReportModule();
    reports = reportModule.get(ReportsService);
    jobs = jobModule.get(JobsService);
    reportPrisma = reportModule.get(PrismaService);
    jobPrisma = jobModule.get(PrismaService);
    statsMock = reportModule.get(ListingStatsService);
    jobStorage = jobModule.get(STORAGE_PROVIDER);
    await reportPrisma.$connect();
    await jobPrisma.$connect();
    await purgeTestData(reportPrisma);
  });

  afterAll(async () => {
    await reportPrisma.$disconnect();
    await jobPrisma.$disconnect();
    await reportModule.close();
    await jobModule.close();
    await rm(storageRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    statsMock.record.mockReset();
    statsMock.record.mockResolvedValue(undefined);
    jobHooks.jobDeleteGate = undefined;
  });

  it('order A — a committed report wins and protects the images', async () => {
    const now = new Date();
    const { listing, key, reporterUserId } = await seedListing(
      reportPrisma,
      jobStorage,
      'ACTIVE',
      null,
    );

    // Hold the report transaction's lock with a barrier between insert and commit.
    const signaled = deferred();
    const release = deferred();
    statsMock.record.mockImplementation(async () => {
      signaled.resolve();
      await release.promise;
    });

    const submitted = reports.submit(reporterUserId, listing.id, { reason: 'SCAM' });
    await signaled.promise; // report row inserted (uncommitted) while the lock is held

    // The archive transition blocks on submit's FOR UPDATE lock until it commits.
    const archiveP = jobPrisma.listing.update({
      where: { id: listing.id },
      data: { status: 'ARCHIVED', archivedAt: new Date(now.getTime() - 31 * DAY_MS) },
    });
    release.resolve();
    await submitted;
    await archiveP;

    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.skippedReport).toBeGreaterThanOrEqual(1);
    expect(counts.claimedListings).toBe(0);

    const image = await reportPrisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(image?.deletedAt).toBeNull();
    await expect(jobStorage.exists(key)).resolves.toBe(true);
    const report = await reportPrisma.report.findFirst({ where: { listingId: listing.id } });
    expect(report?.status).toBe('OPEN');
  });

  it('order B — job wins: a stale-status report is rejected after the lock', async () => {
    const now = new Date();
    const { listing, key, reporterUserId } = await seedListing(
      reportPrisma,
      jobStorage,
      'ARCHIVED',
      new Date(now.getTime() - 31 * DAY_MS),
    );

    // The job's claim commits (soft-delete, lock released) and then blocks inside
    // the post-commit file deletion — a genuine window for a racing report.
    const gate = deferred();
    jobHooks.jobDeleteGate = { promise: gate.promise };
    const jobP = jobs.cleanArchivedListingImages(now);

    // Wait for the claim (soft-delete) to become durable.
    for (let i = 0; i < 200; i += 1) {
      const image = await jobPrisma.listingImage.findFirst({ where: { listingId: listing.id } });
      if (image?.deletedAt !== null) {
        break;
      }
      await sleep(10);
    }

    // Racing report request now acquires the (free) lock and re-reads status.
    let rejectedCode: string | undefined;
    try {
      await reports.submit(reporterUserId, listing.id, { reason: 'SCAM' });
    } catch (error) {
      if (AppException.isAppException(error)) {
        rejectedCode = error.code;
      }
    }
    expect(rejectedCode).toBe('LISTING_NOT_FOUND');
    expect(await reportPrisma.report.count({ where: { listingId: listing.id } })).toBe(0);

    gate.resolve();
    const counts = await jobP;
    expect(counts.claimedListings).toBeGreaterThanOrEqual(1);

    const image = await jobPrisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(image?.deletedAt).not.toBeNull();
    await expect(jobStorage.exists(key)).resolves.toBe(false);
    const row = await jobPrisma.listing.findUnique({ where: { id: listing.id } });
    expect(row?.status).toBe('ARCHIVED');
  });
});