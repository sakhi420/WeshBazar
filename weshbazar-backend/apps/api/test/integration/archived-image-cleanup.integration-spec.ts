/**
 * Integration tests for `JobsService.cleanArchivedListingImages` against real
 * PostgreSQL + the local storage provider. Boots a minimal Nest module (no HTTP)
 * so the real job method runs against the test database.
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
import { STORAGE_PROVIDER } from '../../src/providers/storage/storage.provider';

const DAY_MS = 24 * 60 * 60 * 1000;

async function buildModule(flags: { enabled: boolean; dryRun: boolean; storageRoot: string }) {
  process.env.JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED = String(flags.enabled);
  process.env.JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN = String(flags.dryRun);
  process.env.LOCAL_STORAGE_PATH = flags.storageRoot;
  return Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
      ScheduleModule.forRoot(),
    ],
    providers: [
      PrismaService,
      JobsService,
      LocalStorageProvider,
      { provide: STORAGE_PROVIDER, useExisting: LocalStorageProvider },
      { provide: ListingsService, useValue: {} },
    ],
  }).compile();
}

function unique(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 12)}`;
}

async function seedBase(prisma: PrismaService) {
  const user = await prisma.user.create({
    data: {
      phone: `070${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('pn'),
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
  return { user, seller, category, province, city };
}

async function seedListing(
  prisma: PrismaService,
  storage: LocalStorageProvider,
  opts: { status: string; archivedAt: Date | null; images?: number },
) {
  const { user, seller, category, province, city } = await seedBase(prisma);
  const listing = await prisma.listing.create({
    data: {
      sellerAccountId: seller.id,
      categoryId: category.id,
      provinceId: province.id,
      cityId: city.id,
      slug: unique('lst'),
      title: 'Listing title',
      description: 'Listing description for the cleanup test',
      condition: 'NEW',
      status: opts.status as never,
      archivedAt: opts.archivedAt,
    },
  });

  const keys: string[] = [];
  for (let index = 0; index < (opts.images ?? 1); index += 1) {
    const imageId = randomUUID();
    const key = `listings/${listing.id}/${imageId}/original.jpg`;
    await storage.put(key, Buffer.from(`img-${index}`), 'image/jpeg');
    await prisma.listingImage.create({
      data: {
        id: imageId,
        listingId: listing.id,
        storageKey: key,
        variants: {},
        mimeType: 'image/jpeg',
        size: 5,
        width: 1,
        height: 1,
        checksum: `checksum-${index}`,
        sortOrder: index,
        isPrimary: index === 0,
      },
    });
    keys.push(key);
  }

  return { listing, keys, ownerUserId: user.id };
}

async function addReport(prisma: PrismaService, listingId: string, reportedUserId: string) {
  const reporter = await prisma.user.create({
    data: {
      phone: `079${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('rep'),
      passwordHash: 'x'.repeat(60),
      displayName: 'reporter',
      status: 'ACTIVE',
    },
  });
  return prisma.report.create({
    data: {
      reporterUserId: reporter.id,
      listingId,
      reportedUserId,
      reason: 'SCAM',
      status: 'OPEN',
    },
  });
}

async function addModeration(prisma: PrismaService, listingId: string) {
  const admin = await prisma.user.create({
    data: {
      phone: `078${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('adm'),
      passwordHash: 'x'.repeat(60),
      displayName: 'admin',
      status: 'ACTIVE',
    },
  });
  return prisma.moderationAction.create({
    data: { listingId, adminUserId: admin.id, action: 'ARCHIVE' },
  });
}

describe('cleanArchivedListingImages (integration)', () => {
  let prisma: PrismaService;
  let jobs: JobsService;
  let storage: LocalStorageProvider;
  let storageRoot: string;

  beforeAll(async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-cleanup-'));
    const mod = await buildModule({ enabled: true, dryRun: false, storageRoot });
    prisma = mod.get(PrismaService);
    jobs = mod.get(JobsService);
    storage = mod.get(LocalStorageProvider);
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await rm(storageRoot, { recursive: true, force: true });
  });

  it('claims an eligible archived listing and deletes its binaries', async () => {
    const now = new Date();
    const { listing, keys } = await seedListing(prisma, storage, {
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
      images: 2,
    });
    for (const key of keys) {
      await expect(storage.exists(key)).resolves.toBe(true);
    }

    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.claimedListings).toBeGreaterThanOrEqual(1);
    expect(counts.claimedImages).toBe(2);

    for (const key of keys) {
      await expect(storage.exists(key)).resolves.toBe(false);
    }
    const images = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(images.every((image) => image.deletedAt !== null)).toBe(true);
  });

  it('skips a freshly archived listing inside the TTL', async () => {
    const now = new Date();
    const { listing } = await seedListing(prisma, storage, {
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - DAY_MS),
    });
    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.claimedListings).toBe(0);
    const images = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(images.every((image) => image.deletedAt === null)).toBe(true);
  });

  it('skips ACTIVE and SOLD listings', async () => {
    const now = new Date();
    const active = await seedListing(prisma, storage, {
      status: 'ACTIVE',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    });
    const sold = await seedListing(prisma, storage, {
      status: 'SOLD',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    });
    await jobs.cleanArchivedListingImages(now);
    for (const listingId of [active.listing.id, sold.listing.id]) {
      const images = await prisma.listingImage.findMany({ where: { listingId } });
      expect(images.every((image) => image.deletedAt === null)).toBe(true);
    }
  });

  it('skips ARCHIVED listings with archivedAt = null', async () => {
    const now = new Date();
    const { listing } = await seedListing(prisma, storage, { status: 'ARCHIVED', archivedAt: null });
    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.claimedListings).toBe(0);
    const images = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(images.every((image) => image.deletedAt === null)).toBe(true);
  });

  it('skips listings that have any Report row', async () => {
    const now = new Date();
    const { listing, ownerUserId } = await seedListing(prisma, storage, {
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    });
    await addReport(prisma, listing.id, ownerUserId);
    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.skippedReport).toBeGreaterThanOrEqual(1);
    expect(counts.claimedListings).toBe(0);
    const images = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(images.every((image) => image.deletedAt === null)).toBe(true);
  });

  it('skips listings that have any ModerationAction row', async () => {
    const now = new Date();
    const { listing } = await seedListing(prisma, storage, {
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    });
    await addModeration(prisma, listing.id);
    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.skippedModeration).toBeGreaterThanOrEqual(1);
    expect(counts.claimedListings).toBe(0);
    const images = await prisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(images.every((image) => image.deletedAt === null)).toBe(true);
  });

  it('is idempotent: a re-run finds no new candidates', async () => {
    const now = new Date();
    await seedListing(prisma, storage, {
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
    });
    await jobs.cleanArchivedListingImages(now);
    const second = await jobs.cleanArchivedListingImages(now);
    expect(second.claimedListings).toBe(0);
  });

  it('hard-deletes claimed rows via clean-orphan-media after retention', async () => {
    const now = new Date();
    const { listing } = await seedListing(prisma, storage, {
      status: 'ARCHIVED',
      archivedAt: new Date(now.getTime() - 31 * DAY_MS),
      images: 1,
    });
    await jobs.cleanArchivedListingImages(now);
    expect(await prisma.listingImage.count({ where: { listingId: listing.id, deletedAt: { not: null } } })).toBe(1);
    await jobs.cleanOrphanMedia(new Date(now.getTime() + 8 * DAY_MS));
    expect(await prisma.listingImage.count({ where: { listingId: listing.id } })).toBe(0);
  });
});

describe('cleanArchivedListingImages safety switches (integration)', () => {
  it('ENABLED=false prevents any mutation (direct call)', async () => {
    const storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-disabled-'));
    const mod = await buildModule({ enabled: false, dryRun: false, storageRoot });
    const prisma = mod.get(PrismaService);
    const jobs = mod.get(JobsService);
    const storage = mod.get(LocalStorageProvider);
    await prisma.$connect();
    try {
      const now = new Date();
      const { listing } = await seedListing(prisma, storage, {
        status: 'ARCHIVED',
        archivedAt: new Date(now.getTime() - 31 * DAY_MS),
      });
      const imageId = (await prisma.listingImage.findFirst({ where: { listingId: listing.id } }))!.id;
      const key = (await prisma.listingImage.findUnique({ where: { id: imageId } }))!.storageKey;

      const counts = await jobs.cleanArchivedListingImages(now);
      expect(counts.claimedListings).toBe(0);
      expect(counts.scannedListings).toBe(0);
      await expect(storage.exists(key)).resolves.toBe(true);
      const image = await prisma.listingImage.findUnique({ where: { id: imageId } });
      expect(image?.deletedAt).toBeNull();
    } finally {
      await prisma.$disconnect();
      await mod.close();
      await rm(storageRoot, { recursive: true, force: true });
    }
  });

  it('DRY_RUN=true mutates nothing', async () => {
    const storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-dryrun-'));
    const mod = await buildModule({ enabled: true, dryRun: true, storageRoot });
    const prisma = mod.get(PrismaService);
    const jobs = mod.get(JobsService);
    const storage = mod.get(LocalStorageProvider);
    await prisma.$connect();
    try {
      const now = new Date();
      const { listing } = await seedListing(prisma, storage, {
        status: 'ARCHIVED',
        archivedAt: new Date(now.getTime() - 31 * DAY_MS),
      });
      const image = (await prisma.listingImage.findFirst({ where: { listingId: listing.id } }))!;
      const counts = await jobs.cleanArchivedListingImages(now);
      expect(counts.eligibleListings).toBeGreaterThanOrEqual(1);
      expect(counts.claimedListings).toBe(0);
      expect(counts.claimedImages).toBe(0);
      await expect(storage.exists(image.storageKey)).resolves.toBe(true);
      const after = await prisma.listingImage.findUnique({ where: { id: image.id } });
      expect(after?.deletedAt).toBeNull();
    } finally {
      await prisma.$disconnect();
      await mod.close();
      await rm(storageRoot, { recursive: true, force: true });
    }
  });
});