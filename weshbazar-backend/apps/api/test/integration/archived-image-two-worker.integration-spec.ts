/**
 * Integration tests for the archived-image cleanup job's two-worker concurrency
 * (spec §5.17.4 item 6). Two independent JobsService instances — each with its
 * own PostgreSQL connection and its own StorageProvider handle over a shared
 * real temp storage root — race to clean the same eligible listing. A controlled
 * barrier pins the interleaving so the claim invariants are asserted, not just
 * a sequential re-run.
 */
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import configuration from '../../src/config/configuration';
import { PrismaService } from '../../src/database/prisma.service';
import { JobsService } from '../../src/modules/jobs/jobs.service';
import { ListingsService } from '../../src/modules/listings/listings.service';
import { LocalStorageProvider } from '../../src/providers/storage/local-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from '../../src/providers/storage/storage.provider';

const DAY_MS = 24 * 60 * 60 * 1000;

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

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

/**
 * Programmable storage wrapper: real file I/O delegates to the inner provider,
 * but the first delete can block on a gate so a test can hold a worker mid-job
 * after its claim transaction has committed but before any binary is removed.
 */
class ControlledStorage implements StorageProvider {
  readonly deleted: string[] = [];
  blockFirstDelete: { promise: Promise<void> } | null = null;
  private deleteCount = 0;

  constructor(private readonly inner: StorageProvider) {}

  reset(): void {
    this.deleted.length = 0;
    this.blockFirstDelete = null;
    this.deleteCount = 0;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    return this.inner.put(key, data, contentType);
  }

  async delete(key: string): Promise<void> {
    if (this.blockFirstDelete && this.deleteCount === 0) {
      await this.blockFirstDelete.promise;
    }
    this.deleteCount += 1;
    await this.inner.delete(key);
    this.deleted.push(key);
  }

  async deletePrefix(prefix: string): Promise<number> {
    return this.inner.deletePrefix(prefix);
  }

  async exists(key: string): Promise<boolean> {
    return this.inner.exists(key);
  }

  getPublicUrl(key: string): string {
    return this.inner.getPublicUrl(key);
  }

  async list(prefix: string) {
    return this.inner.list(prefix);
  }
}

interface WorkerHarness {
  moduleRef: TestingModule;
  prisma: PrismaService;
  jobs: JobsService;
  storage: ControlledStorage;
}

async function buildWorker(storageRoot: string): Promise<WorkerHarness> {
  process.env.JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED = 'true';
  process.env.JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN = 'false';
  process.env.LOCAL_STORAGE_PATH = storageRoot;
  const moduleRef = await Test.createTestingModule({
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
        useFactory: (inner: LocalStorageProvider) => new ControlledStorage(inner),
      },
      { provide: ListingsService, useValue: {} },
    ],
  }).compile();
  const prisma = moduleRef.get(PrismaService);
  const jobs = moduleRef.get(JobsService);
  const storage = moduleRef.get<StorageProvider>(STORAGE_PROVIDER) as ControlledStorage;
  await prisma.$connect();
  return { moduleRef, prisma, jobs, storage };
}

async function seedBase(prisma: PrismaService) {
  const user = await prisma.user.create({
    data: {
      phone: `072${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('u'),
      passwordHash: 'x'.repeat(60),
      displayName: 'seller',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });
  const seller = await prisma.sellerAccount.create({
    data: { ownerUserId: user.id, displayName: 'seller', slug: unique('sl'), status: 'ACTIVE' },
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
  return { seller, category, province, city };
}

async function seedListing(
  prisma: PrismaService,
  storage: StorageProvider,
  now: Date,
  imageCount: number,
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
      description: 'Listing description for the two-worker concurrency test',
      condition: 'NEW',
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    },
  });

  const keys: string[] = [];
  for (let i = 0; i < imageCount; i += 1) {
    const imageId = randomUUID();
    const storageKey = `listings/${listing.id}/${imageId}/original.jpg`;
    const variantKey = `listings/${listing.id}/${imageId}/thumbnail.webp`;
    await storage.put(storageKey, Buffer.from(`orig-${i}`), 'image/jpeg');
    await storage.put(variantKey, Buffer.from(`thumb-${i}`), 'image/webp');
    await prisma.listingImage.create({
      data: {
        id: imageId,
        listingId: listing.id,
        storageKey,
        variants: { thumbnail: { key: variantKey, width: 1, height: 1, size: 1 } },
        mimeType: 'image/jpeg',
        size: 3,
        width: 1,
        height: 1,
        checksum: unique('sum'),
        sortOrder: i,
        isPrimary: i === 0,
      },
    });
    keys.push(storageKey, variantKey);
  }
  return { listing, keys };
}

describe('archived-image cleanup two-worker concurrency (integration)', () => {
  let workerA: WorkerHarness;
  let workerB: WorkerHarness;
  let storageRoot: string;

  beforeAll(async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-twoworker-'));
    workerA = await buildWorker(storageRoot);
    workerB = await buildWorker(storageRoot);
    await purgeTestData(workerA.prisma);
  });

  afterAll(async () => {
    await workerA.prisma.$disconnect();
    await workerB.prisma.$disconnect();
    await workerA.moduleRef.close();
    await workerB.moduleRef.close();
    await rm(storageRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    workerA.storage.reset();
    workerB.storage.reset();
    await purgeTestData(workerA.prisma);
  });

  it('only one worker claims when the second starts while the first is mid-job', async () => {
    const now = new Date();
    const { listing, keys } = await seedListing(workerA.prisma, workerA.storage, now, 2);

    // Hold worker A after its claim commit, before any binary is removed.
    const gate = deferred();
    workerA.storage.blockFirstDelete = { promise: gate.promise };

    const pA = workerA.jobs.cleanArchivedListingImages(now);

    // Wait until worker A's claim (soft-delete) is durably committed.
    let live = 1;
    for (let i = 0; i < 400 && live !== 0; i += 1) {
      live = await workerA.prisma.listingImage.count({
        where: { listingId: listing.id, deletedAt: null },
      });
      if (live !== 0) {
        await sleep(10);
      }
    }
    expect(live).toBe(0);
    // Worker A is now committed but blocked before deleting any file.
    for (const key of keys) {
      await expect(workerB.storage.exists(key)).resolves.toBe(true);
    }

    // Worker B runs while worker A is still in flight (genuinely concurrent):
    // it must see the already-soft-deleted gallery and claim nothing.
    const countsB = await workerB.jobs.cleanArchivedListingImages(now);
    expect(countsB.scannedListings).toBe(0);
    expect(countsB.claimedListings).toBe(0);
    expect(countsB.claimedImages).toBe(0);
    expect(countsB.purgedImages).toBe(0);

    // Release worker A; it finishes removing the binaries itself.
    gate.resolve();
    const countsA = await pA;
    expect(countsA.claimedListings).toBe(1);
    expect(countsA.claimedImages).toBe(2);
    expect(countsA.purgedImages).toBe(keys.length);
    expect(countsA.purgedListings).toBe(1);

    // Final DB state: both rows soft-deleted exactly once, never hard-deleted.
    const rows = await workerA.prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(rows.length).toBe(2);
    expect(rows.every((row) => row.deletedAt !== null)).toBe(true);

    // Final storage: every key removed, and removed by exactly one worker.
    for (const key of keys) {
      await expect(workerA.storage.exists(key)).resolves.toBe(false);
    }
    expect([...workerA.storage.deleted].sort()).toEqual([...keys].sort());
    expect(workerB.storage.deleted).toEqual([]);
  });

  it('concurrent start: exactly one claimant regardless of interleaving', async () => {
    const now = new Date();
    const { listing, keys } = await seedListing(workerA.prisma, workerA.storage, now, 2);

    const [countsA, countsB] = await Promise.all([
      workerA.jobs.cleanArchivedListingImages(now),
      workerB.jobs.cleanArchivedListingImages(now),
    ]);

    const winner = countsA.claimedListings === 1 ? countsA : countsB;
    const loser = countsA.claimedListings === 1 ? countsB : countsA;

    // Exactly one worker claims the listing and its images.
    expect(winner.claimedListings).toBe(1);
    expect(winner.claimedImages).toBe(2);
    expect(winner.purgedImages).toBe(keys.length);
    expect(winner.purgedListings).toBe(1);
    expect(loser.claimedListings).toBe(0);
    expect(loser.claimedImages).toBe(0);
    expect(loser.purgedImages).toBe(0);
    expect(loser.purgedListings).toBe(0);

    // The loser detected the change either at scan time (scannedListings === 0)
    // or inside the FOR UPDATE re-check (it pre-scanned, then skipped via guard).
    expect(loser.scannedListings === 0 || loser.skippedGuard >= 1).toBe(true);

    // Final DB state: both rows soft-deleted once, never hard-deleted.
    const rows = await workerA.prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(rows.length).toBe(2);
    expect(rows.every((row) => row.deletedAt !== null)).toBe(true);

    // Final storage: every key removed exactly once across both workers.
    for (const key of keys) {
      await expect(workerA.storage.exists(key)).resolves.toBe(false);
    }
    const allDeleted = [...workerA.storage.deleted, ...workerB.storage.deleted];
    expect(new Set(allDeleted).size).toBe(keys.length);
  });
});