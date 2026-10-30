/**
 * Integration tests for archived-image cleanup storage failure + reconciliation
 * (spec §5.7, §5.17.4 items 4–5). A controlled StorageProvider wrapper injects
 * faults on real PostgreSQL + a real temporary local storage root.
 */
import { Test } from '@nestjs/testing';
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

/** Programmable storage wrapper — failures only; delegates all real file I/O. */
class ControlledStorage implements StorageProvider {
  readonly deleted: string[] = [];
  readonly failOn = new Set<string>();
  failAfter: number | null = null;
  blockFirstDelete: { promise: Promise<void> } | null = null;
  private deleteCount = 0;

  constructor(private readonly inner: StorageProvider) {}

  reset(): void {
    this.deleted.length = 0;
    this.failOn.clear();
    this.failAfter = null;
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
    if (this.failOn.has(key)) {
      throw new Error(`injected storage failure for ${key}`);
    }
    if (this.failAfter !== null && this.deleteCount === this.failAfter) {
      throw new Error(`injected storage failure at delete #${this.deleteCount}`);
    }
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

const CONTROL = Symbol('CONTROL_STORAGE');

async function buildJobModule(storageRoot: string) {
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
        useFactory: (inner: LocalStorageProvider) => new ControlledStorage(inner),
      },
      {
        provide: CONTROL,
        inject: [STORAGE_PROVIDER],
        useFactory: (s: StorageProvider) => s as ControlledStorage,
      },
      { provide: ListingsService, useValue: {} },
    ],
  }).compile();
}

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const sleep = (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

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
  writeFiles = true,
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
      description: 'Listing description for the storage failure test',
      condition: 'NEW',
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    },
  });

  const images: Array<{ imageId: string; storageKey: string; variantKey: string }> = [];
  for (let i = 0; i < imageCount; i += 1) {
    const imageId = randomUUID();
    const storageKey = `listings/${listing.id}/${imageId}/original.jpg`;
    const variantKey = `listings/${listing.id}/${imageId}/thumbnail.webp`;
    if (writeFiles) {
      await storage.put(storageKey, Buffer.from(`orig-${i}`), 'image/jpeg');
      await storage.put(variantKey, Buffer.from(`thumb-${i}`), 'image/webp');
    }
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
    images.push({ imageId, storageKey, variantKey });
  }
  return { listing, images };
}

describe('archived-image cleanup storage failure (integration)', () => {
  let prisma: PrismaService;
  let jobs: JobsService;
  let storage: ControlledStorage;
  let storageRoot: string;
  let moduleRef: Awaited<ReturnType<typeof buildJobModule>>;

  beforeAll(async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-fault-'));
    moduleRef = await buildJobModule(storageRoot);
    prisma = moduleRef.get(PrismaService);
    jobs = moduleRef.get(JobsService);
    storage = moduleRef.get(CONTROL);
    await prisma.$connect();
    await purgeTestData(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await moduleRef.close();
    await rm(storageRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    storage.reset();
  });

  it('tolerates an already-missing object and still claims the row', async () => {
    const now = new Date();
    const { listing } = await seedListing(prisma, storage, now, 1, false);
    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.storageFailed).toBe(0);
    expect(counts.purgedImages).toBe(2);
    const image = await prisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(image?.deletedAt).not.toBeNull();
  });

  it('one failing key marks the pass for reconciliation, not a hard delete', async () => {
    const now = new Date();
    const { listing, images } = await seedListing(prisma, storage, now, 2);
    const failing = images[0].variantKey;
    storage.failOn.add(failing);

    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.storageFailed).toBe(1);
    expect(counts.needsReconciliation).toBe(1);

    const rows = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(rows.every((row) => row.deletedAt !== null)).toBe(true);
    await expect(storage.exists(failing)).resolves.toBe(true);
    await expect(storage.exists(images[0].storageKey)).resolves.toBe(false);
  });

  it('hard-deletes metadata only after every key is removed', async () => {
    const now = new Date();
    const { listing, images } = await seedListing(prisma, storage, now, 1);
    const failing = images[0].variantKey;
    storage.failOn.add(failing);
    await jobs.cleanArchivedListingImages(now); // soft-delete; variant delete fails

    const later = new Date(now.getTime() + 8 * DAY_MS);
    await jobs.cleanOrphanMedia(later); // still failing → row must survive
    expect(await prisma.listingImage.count({ where: { listingId: listing.id } })).toBe(1);
    await expect(storage.exists(failing)).resolves.toBe(true);

    storage.failOn.clear();
    await jobs.cleanOrphanMedia(later); // healed → object removed, then row hard-deleted
    expect(await prisma.listingImage.count({ where: { listingId: listing.id } })).toBe(0);
    await expect(storage.exists(failing)).resolves.toBe(false);
  });

  it('recovers an interrupted job after commit via clean-orphan-media', async () => {
    const now = new Date();
    const { listing, images } = await seedListing(prisma, storage, now, 1);
    const gate = deferred();
    storage.blockFirstDelete = { promise: gate.promise };

    const jobP = jobs.cleanArchivedListingImages(now);
    for (let i = 0; i < 200; i += 1) {
      const image = await prisma.listingImage.findFirst({ where: { listingId: listing.id } });
      if (image?.deletedAt !== null) {
        break;
      }
      await sleep(10);
    }
    const image = await prisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(image?.deletedAt).not.toBeNull();
    await expect(storage.exists(images[0].storageKey)).resolves.toBe(true);

    // Simulate a crash: forgo the remainder of the job's file deletion.
    storage.blockFirstDelete = null;

    // Restart: idempotent re-run finds no candidates, orphan sweep finishes.
    await jobs.cleanArchivedListingImages(now);
    await jobs.cleanOrphanMedia(new Date(now.getTime() + 8 * DAY_MS));
    expect(await prisma.listingImage.count({ where: { listingId: listing.id } })).toBe(0);
    await expect(storage.exists(images[0].storageKey)).resolves.toBe(false);
    await expect(storage.exists(images[0].variantKey)).resolves.toBe(false);

    gate.resolve();
    await jobP;
  });
});