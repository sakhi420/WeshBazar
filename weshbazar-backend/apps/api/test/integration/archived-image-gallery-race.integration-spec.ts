/**
 * Integration tests for the job's races against the gallery lifecycle:
 * renew, restoreByAdmin, uploadImage, deleteImage, reorderImage — with a real
 * ListingsService + MediaService (two independent PostgreSQL connections).
 */
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { AuditService } from '../../src/modules/audit/audit.service';
import configuration from '../../src/config/configuration';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { PrismaService } from '../../src/database/prisma.service';
import { JobsService } from '../../src/modules/jobs/jobs.service';
import { ListingsService } from '../../src/modules/listings/listings.service';
import { LocationsService } from '../../src/modules/locations/locations.service';
import { MediaService } from '../../src/modules/media/media.service';
import { ImageProcessor } from '../../src/modules/media/image-processor';
import { SellerAccountsService } from '../../src/modules/sellers/seller-accounts.service';
import { TaxonomyService } from '../../src/modules/taxonomy/taxonomy.service';
import { LocalStorageProvider } from '../../src/providers/storage/local-storage.provider';
import { STORAGE_PROVIDER, type StorageProvider } from '../../src/providers/storage/storage.provider';

const DAY_MS = 24 * 60 * 60 * 1000;

function unique(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 12)}`;
}

async function purgeTestData(prisma: PrismaService): Promise<void> {
  await prisma.listingImage.deleteMany({});
  await prisma.listingRevision.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.moderationAction.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.listing.deleteMany({});
}

async function buildAppModule() {
  return Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, load: [configuration] })],
    providers: [
      PrismaService,
      ListingsService,
      MediaService,
      LocalStorageProvider,
      { provide: STORAGE_PROVIDER, useExisting: LocalStorageProvider },
      { provide: TaxonomyService, useValue: {} },
      { provide: LocationsService, useValue: {} },
      { provide: SellerAccountsService, useValue: {} },
      { provide: RateLimitService, useValue: { enforce: jest.fn() } },
      { provide: AuditService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
      { provide: ImageProcessor, useFactory: () => ({ process: jest.fn() }) },
    ],
  }).compile();
}

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
      { provide: STORAGE_PROVIDER, useExisting: LocalStorageProvider },
      { provide: ListingsService, useValue: {} },
    ],
  }).compile();
}

async function seedBase(prisma: PrismaService) {
  const owner = await prisma.user.create({
    data: {
      phone: `073${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('own'),
      passwordHash: 'x'.repeat(60),
      displayName: 'owner',
      status: 'ACTIVE',
      phoneVerifiedAt: new Date(),
    },
  });
  const admin = await prisma.user.create({
    data: {
      phone: `074${Math.floor(1000000 + Math.random() * 8999999)}`,
      phoneNormalized: unique('adm'),
      passwordHash: 'x'.repeat(60),
      displayName: 'admin',
      status: 'ACTIVE',
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
  return { owner, admin, seller, category, province, city };
}

async function seedListing(
  prisma: PrismaService,
  storage: StorageProvider,
  status: string,
  archivedAt: Date | null,
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
      description: 'Listing description for the gallery race test',
      price: 100,
      condition: 'NEW',
      status: status as never,
      archivedAt,
    },
  });
  const keys: string[] = [];
  for (let i = 0; i < imageCount; i += 1) {
    const imageId = randomUUID();
    const key = `listings/${listing.id}/${imageId}/original.jpg`;
    await storage.put(key, Buffer.from(`img-${i}`), 'image/jpeg');
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
        sortOrder: i,
        isPrimary: i === 0,
      },
    });
    keys.push(key);
  }
  return { listing, keys, ownerUserId: base.owner.id, adminUserId: base.admin.id };
}

let uploadSeq = 0;
function fakeImage(): unknown {
  uploadSeq += 1;
  const data = Buffer.from(`img-${uploadSeq}`);
  return {
    original: { data, checksum: `sum-${uploadSeq}-${randomUUID()}`, size: data.length, width: 1, height: 1 },
    variants: {
      thumbnail: { data, width: 1, height: 1, size: data.length },
      medium: { data, width: 1, height: 1, size: data.length },
      large: { data, width: 1, height: 1, size: data.length },
    },
  };
}

describe('archived-image cleanup gallery races (integration)', () => {
  let appPrisma: PrismaService;
  let jobPrisma: PrismaService;
  let listings: ListingsService;
  let media: MediaService;
  let jobs: JobsService;
  let appStorage: StorageProvider;
  let processorMock: { process: jest.Mock };
  let storageRoot: string;
  let appModule: Awaited<ReturnType<typeof buildAppModule>>;
  let jobModule: Awaited<ReturnType<typeof buildJobModule>>;

  beforeAll(async () => {
    storageRoot = await mkdtemp(path.join(tmpdir(), 'weshbazar-gallery-'));
    process.env.LOCAL_STORAGE_PATH = storageRoot;
    appModule = await buildAppModule();
    jobModule = await buildJobModule(storageRoot);
    listings = appModule.get(ListingsService);
    media = appModule.get(MediaService);
    jobs = jobModule.get(JobsService);
    appPrisma = appModule.get(PrismaService);
    jobPrisma = jobModule.get(PrismaService);
    appStorage = appModule.get(STORAGE_PROVIDER);
    processorMock = appModule.get(ImageProcessor);
    await appPrisma.$connect();
    await jobPrisma.$connect();
    await purgeTestData(appPrisma);
  });

  afterAll(async () => {
    await appPrisma.$disconnect();
    await jobPrisma.$disconnect();
    await appModule.close();
    await jobModule.close();
    await rm(storageRoot, { recursive: true, force: true });
  });

  beforeEach(() => {
    processorMock.process.mockReset();
  });

  it('renew before the job: republished listing is skipped, images preserved', async () => {
    const now = new Date();
    const { listing, keys, ownerUserId } = await seedListing(
      appPrisma,
      appStorage,
      'ARCHIVED',
      new Date(now.getTime() - 31 * DAY_MS),
      1,
    );
    await listings.renew(ownerUserId, listing.id, {}, 'en');
    const row = await appPrisma.listing.findUnique({ where: { id: listing.id } });
    expect(row?.status).toBe('DRAFT');

    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.claimedListings).toBe(0);
    for (const key of keys) {
      await expect(appStorage.exists(key)).resolves.toBe(true);
    }
    const image = await appPrisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(image?.deletedAt).toBeNull();
  });

  it('job claims first, then renew + a fresh upload survives the old job', async () => {
    const now = new Date();
    const { listing, keys, ownerUserId } = await seedListing(
      appPrisma,
      appStorage,
      'ARCHIVED',
      new Date(now.getTime() - 31 * DAY_MS),
      1,
    );

    const counts = await jobs.cleanArchivedListingImages(now);
    expect(counts.claimedListings).toBeGreaterThanOrEqual(1);
    const oldImage = await appPrisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(oldImage?.deletedAt).not.toBeNull();
    await expect(appStorage.exists(keys[0])).resolves.toBe(false);

    await listings.renew(ownerUserId, listing.id, {}, 'en');
    processorMock.process.mockResolvedValue(fakeImage());
    await media.uploadImage(ownerUserId, listing.id, Buffer.from('new'), 'en');

    const images = await appPrisma.listingImage.findMany({ where: { listingId: listing.id } });
    const live = images.filter((image) => image.deletedAt === null);
    expect(live.length).toBe(1);
    expect(live[0].isPrimary).toBe(true);
    await expect(appStorage.exists(live[0].storageKey)).resolves.toBe(true);
    expect(images.some((image) => image.deletedAt !== null)).toBe(true);
  });

  it('restoreByAdmin republishes after the job claimed the gallery', async () => {
    const now = new Date();
    const { listing, adminUserId } = await seedListing(
      appPrisma,
      appStorage,
      'ARCHIVED',
      new Date(now.getTime() - 31 * DAY_MS),
      1,
    );
    await jobs.cleanArchivedListingImages(now);
    await listings.restoreByAdmin(adminUserId, listing.id, 'en', {});

    const row = await appPrisma.listing.findUnique({ where: { id: listing.id } });
    expect(row?.status).toBe('ACTIVE');
    expect(row?.archivedAt).toBeNull();
    const image = await appPrisma.listingImage.findFirst({ where: { listingId: listing.id } });
    expect(image?.deletedAt).not.toBeNull();
  });

  it('deleteImage and reorderImage keep one primary and a dense sortOrder', async () => {
    const { listing, ownerUserId } = await seedListing(appPrisma, appStorage, 'ACTIVE', null, 3);
    const before = await appPrisma.listingImage.findMany({
      where: { listingId: listing.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    expect(before[0].isPrimary).toBe(true);

    await media.deleteImage(ownerUserId, listing.id, before[0].id, 'en');
    const afterDelete = await appPrisma.listingImage.findMany({
      where: { listingId: listing.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    expect(afterDelete.length).toBe(2);
    expect(afterDelete.filter((image) => image.isPrimary).length).toBe(1);

    await media.reorderImage(ownerUserId, listing.id, afterDelete[1].id, { sortOrder: 0 }, 'en');
    const afterReorder = await appPrisma.listingImage.findMany({
      where: { listingId: listing.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    expect(afterReorder.map((image) => image.sortOrder)).toEqual([0, 1]);
    expect(afterReorder.filter((image) => image.isPrimary).length).toBe(1);
  });

  it('clean-orphan-media leaves no half-processed row or object after a delete', async () => {
    const now = new Date();
    const { listing, ownerUserId } = await seedListing(appPrisma, appStorage, 'ACTIVE', null, 2);
    const before = await appPrisma.listingImage.findMany({
      where: { listingId: listing.id, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    });
    const deletedKey = before[0].storageKey;
    await media.deleteImage(ownerUserId, listing.id, before[0].id, 'en');
    await expect(appStorage.exists(deletedKey)).resolves.toBe(true);

    await jobs.cleanOrphanMedia(new Date(now.getTime() + 8 * DAY_MS));
    await expect(appStorage.exists(deletedKey)).resolves.toBe(false);
    const rows = await appPrisma.listingImage.findMany({ where: { listingId: listing.id } });
    expect(rows.length).toBe(1);
    expect(rows[0].deletedAt).toBeNull();
  });
});