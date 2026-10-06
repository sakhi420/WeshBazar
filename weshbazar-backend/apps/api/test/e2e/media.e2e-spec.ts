/**
 * Media e2e (Phase 8) — boots the real application (test database + local
 * storage) and covers spec §63–§67, §90 and §107:
 *
 *  - upload validation: auth, multipart shape, magic-byte type detection,
 *    size limit (413), pixel-bomb limit (400), malformed bytes (400)
 *  - the full pipeline: re-encoded original + webp variants written through
 *    the StorageProvider and served over the `/media/` static route
 *  - duplicate checksum rejection and the per-listing image cap
 *  - gallery management: soft delete (files retained for the sweep) with
 *    primary promotion, reorder, primary flag, request validation
 *  - the §42 material-change policy for images: review categories re-enter
 *    PENDING_REVIEW, AUTO_APPROVE stays ACTIVE, REJECTED returns to DRAFT,
 *    SOLD listings are locked
 *  - ownership/IDOR, upload rate limiting, filename-traversal immunity
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request, { type Response as SupertestResponse } from 'supertest';
import sharp from 'sharp';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { validateEnv } from '../../src/config/env.schema';
import { PrismaService } from '../../src/database/prisma.service';
import { ListingsService } from '../../src/modules/listings/listings.service';
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

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { errors?: Array<Record<string, unknown>>; limit?: number };
  };
  requestId: string;
}

interface RefData {
  id: string;
  slug: string;
  name: string;
}

interface ImageVariantData {
  url: string;
  width: number;
  height: number;
}

interface ImageData {
  id: string;
  url: string;
  variants: Record<string, ImageVariantData>;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
}

interface OwnerListingData {
  id: string;
  slug: string;
  status: string;
  version: number;
  title: string;
  images: ImageData[];
  category: RefData;
  rejectedReason: string | null;
  createdAt: string;
}

interface SummaryData {
  id: string;
  primaryImage: ImageData | null;
}

interface AdminCategoryData {
  id: string;
  slug: string;
}

interface AdminLocationData {
  id: string;
  slug: string;
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

/** Solid-colour test images; distinct colours yield distinct checksums. */
async function makeImage(
  format: 'jpeg' | 'png' | 'webp',
  options: { width?: number; height?: number; color?: string } = {},
): Promise<Buffer> {
  const { width = IMAGE_WIDTH, height = IMAGE_HEIGHT, color = '#3366aa' } = options;
  const image = sharp({ create: { width, height, channels: 3, background: color } });
  if (format === 'jpeg') {
    return image.jpeg().toBuffer();
  }
  if (format === 'png') {
    return image.png().toBuffer();
  }
  return image.webp().toBuffer();
}

describe('Media (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let listings: ListingsService;
  let rateLimitService: RateLimitService;
  let storage: StorageProvider;

  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];

  let adminToken: string;
  let adminUserId: string;
  let sellerA: SellerFixture;
  let sellerB: SellerFixture;

  let autoCat: AdminCategoryData;
  let reviewCat: AdminCategoryData;
  let provinceX: AdminLocationData;
  let cityX: AdminLocationData;

  // Shared fixtures, built once per suite.
  let jpegImage: Buffer;
  let pngImage: Buffer;
  let webpImage: Buffer;
  let pixelBomb: Buffer;
  let oversized: Buffer;

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
    listings = app.get(ListingsService);
    rateLimitService = app.get(RateLimitService);
    storage = app.get<StorageProvider>(STORAGE_PROVIDER);

    const admin = await createAdminToken();
    adminToken = admin.token;
    adminUserId = admin.userId;

    await createFixtures();

    jpegImage = await makeImage('jpeg');
    pngImage = await makeImage('png', { color: '#22aa55' });
    webpImage = await makeImage('webp', { color: '#aa3322' });
    // 25,005,000 pixels — just past MAX_IMAGE_PIXELS (25M).
    pixelBomb = await makeImage('png', { width: 5001, height: 5000, color: '#101010' });
    oversized = Buffer.alloc(env.MAX_UPLOAD_SIZE + 4096, 0xff);
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
      .send({ phone, password: PASSWORD, displayName: 'E2E Media Admin' })
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

  async function createCategory(payload: Record<string, unknown>): Promise<AdminCategoryData> {
    const response = await request(server)
      .post('/api/v1/admin/categories')
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<AdminCategoryData>).data;
  }

  async function createProvince(code: string, name: string): Promise<AdminLocationData> {
    const response = await request(server)
      .post('/api/v1/admin/provinces')
      .set('authorization', `Bearer ${adminToken}`)
      .send({ code, translations: [{ locale: 'en', name }] })
      .expect(201);
    return (response.body as SuccessEnvelope<AdminLocationData>).data;
  }

  async function createCity(
    provinceId: string,
    slug: string,
    name: string,
  ): Promise<AdminLocationData> {
    const response = await request(server)
      .post(`/api/v1/admin/provinces/${provinceId}/cities`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ slug, translations: [{ locale: 'en', name }] })
      .expect(201);
    return (response.body as SuccessEnvelope<AdminLocationData>).data;
  }

  async function createFixtures(): Promise<void> {
    autoCat = await createCategory({
      slug: `${PREFIX}-auto`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Media Auto Category' }],
    });
    reviewCat = await createCategory({
      slug: `${PREFIX}-review`,
      translations: [{ locale: 'en', name: 'E2E Media Review Category' }],
    });
    provinceX = await createProvince(`XM-${CODE_BASE}`, 'E2E Media Province');
    cityX = await createCity(provinceX.id, `${PREFIX}-city`, 'E2E Media City');

    sellerA = await registerUser('E2E Media Seller A');
    sellerB = await registerUser('E2E Media Seller B');
  }

  async function draft(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<OwnerListingData> {
    const response = await request(server)
      .post('/api/v1/listings')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: `${PREFIX} Media Listing`,
        description: DESCRIPTION,
        categoryId: autoCat.id,
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

  async function uploadRaw(
    token: string,
    listingId: string,
    file: Buffer,
    filename = 'photo.jpg',
  ): Promise<SupertestResponse> {
    return request(server)
      .post(`/api/v1/listings/${listingId}/images`)
      .set('authorization', `Bearer ${token}`)
      .attach('file', file, filename);
  }

  async function upload(token: string, listingId: string, file: Buffer): Promise<OwnerListingData> {
    const response = await uploadRaw(token, listingId, file);
    expect(response.status).toBe(201);
    return (response.body as SuccessEnvelope<OwnerListingData>).data;
  }

  // --- Upload validation ---------------------------------------------------------

  describe('upload validation', () => {
    it('rejects anonymous uploads with 401', async () => {
      const target = await draft(sellerA.token);
      const response = await request(server)
        .post(`/api/v1/listings/${target.id}/images`)
        .attach('file', jpegImage, 'photo.jpg')
        .expect(401);
      expect((response.body as ErrorEnvelope).error.code).toBe('UNAUTHORIZED');
    });

    it('rejects non-multipart uploads as validation errors', async () => {
      const target = await draft(sellerA.token);
      const response = await request(server)
        .post(`/api/v1/listings/${target.id}/images`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ file: 'not-a-file' })
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects requests without a file part', async () => {
      const target = await draft(sellerA.token);
      const response = await request(server)
        .post(`/api/v1/listings/${target.id}/images`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .field('caption', 'no file here')
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects more than one file per request', async () => {
      const target = await draft(sellerA.token);
      const response = await request(server)
        .post(`/api/v1/listings/${target.id}/images`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .attach('file', jpegImage, 'a.jpg')
        .attach('file', pngImage, 'b.png')
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects non-image bytes by magic sniffing, not by filename', async () => {
      const target = await draft(sellerA.token);
      const response = await uploadRaw(
        sellerA.token,
        target.id,
        Buffer.from(`${PREFIX} definitely not an image`),
        'innocent.jpg',
      );
      expect(response.status).toBe(415);
      expect((response.body as ErrorEnvelope).error.code).toBe('UNSUPPORTED_IMAGE_TYPE');
    });

    it('rejects malformed image bytes with INVALID_IMAGE', async () => {
      const target = await draft(sellerA.token);
      const corrupt = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(64, 0x7a)]);
      const response = await uploadRaw(sellerA.token, target.id, corrupt, 'broken.jpg');
      expect(response.status).toBe(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('INVALID_IMAGE');
    });

    it('rejects uploads above the configured size limit with 413', async () => {
      const target = await draft(sellerA.token);
      const response = await uploadRaw(sellerA.token, target.id, oversized, 'huge.jpg');
      expect(response.status).toBe(413);
      expect((response.body as ErrorEnvelope).error.code).toBe('IMAGE_TOO_LARGE');
    });

    it('rejects pixel bombs with IMAGE_DIMENSIONS_TOO_LARGE', async () => {
      const target = await draft(sellerA.token);
      const response = await uploadRaw(sellerA.token, target.id, pixelBomb, 'bomb.png');
      expect(response.status).toBe(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('IMAGE_DIMENSIONS_TOO_LARGE');
    });

    it('denies uploads to another seller listing with LISTING_NOT_OWNED', async () => {
      const target = await draft(sellerA.token);
      const response = await uploadRaw(sellerB.token, target.id, jpegImage);
      expect(response.status).toBe(403);
      expect((response.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_OWNED');
    });

    it('refuses SOLD listings with LISTING_EDIT_NOT_ALLOWED', async () => {
      const target = await draft(sellerA.token);
      await request(server)
        .post(`/api/v1/listings/${target.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      await request(server)
        .post(`/api/v1/listings/${target.id}/mark-sold`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ expectedVersion: 2 })
        .expect(200);

      const response = await uploadRaw(sellerA.token, target.id, jpegImage);
      expect(response.status).toBe(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('LISTING_EDIT_NOT_ALLOWED');
    });
  });

  // --- The pipeline --------------------------------------------------------------

  describe('storage pipeline', () => {
    it('stores the original + variants, serves them over /media/ and bumps the listing version', async () => {
      const target = await draft(sellerA.token);
      expect(target.version).toBe(1);

      const updated = await upload(sellerA.token, target.id, jpegImage);
      // Images are a material change (§42): every mutation bumps the version.
      expect(updated.version).toBe(2);
      expect(updated.images).toHaveLength(1);

      const image = updated.images[0];
      expect(image.isPrimary).toBe(true);
      expect(image.sortOrder).toBe(0);
      // Original dimensions survive the re-encode.
      expect(image.width).toBe(IMAGE_WIDTH);
      expect(image.height).toBe(IMAGE_HEIGHT);
      expect(Object.keys(image.variants).sort()).toEqual(['large', 'medium', 'thumbnail']);
      expect(image.variants.thumbnail.width).toBe(320);
      expect(image.variants.medium.width).toBe(800);
      // No enlargement: large is capped at the original width.
      expect(image.variants.large.width).toBe(IMAGE_WIDTH);

      // The stored row carries the server-generated key and a SHA-256 checksum.
      const row = await prisma.listingImage.findUniqueOrThrow({ where: { id: image.id } });
      expect(row.storageKey).toBe(`listings/${target.id}/${image.id}/original.jpg`);
      expect(row.checksum).toMatch(/^[0-9a-f]{64}$/);
      expect(row.mimeType).toBe('image/jpeg');

      // Both the original and a variant are publicly served (static route).
      const original = await request(server).get(new URL(image.url).pathname).expect(200);
      expect(original.headers['content-type']).toContain('image/jpeg');
      const thumbnail = await request(server)
        .get(new URL(image.variants.thumbnail.url).pathname)
        .expect(200);
      expect(thumbnail.headers['content-type']).toContain('image/webp');

      // The revision trail documents the image change.
      const revisions = await request(server)
        .get(`/api/v1/listings/${target.id}/revisions`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const history = (
        revisions.body as SuccessEnvelope<Array<{ version: number; changeType: string }>>
      ).data;
      expect(history.map((revision) => revision.changeType)).toEqual(['UPDATE', 'CREATE']);

      // The owner feed surfaces the primary image for cards.
      const feed = await request(server)
        .get(`/api/v1/me/listings?status=DRAFT&limit=60`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const summary = (feed.body as SuccessEnvelope<SummaryData[]>).data.find(
        (item) => item.id === target.id,
      );
      expect(summary?.primaryImage?.url).toBe(image.url);
    });

    it('accepts PNG and WebP uploads, always storing a normalized JPEG original', async () => {
      const target = await draft(sellerA.token);
      await upload(sellerA.token, target.id, pngImage);
      const afterSecond = await upload(sellerA.token, target.id, webpImage);
      expect(afterSecond.images).toHaveLength(2);

      for (const image of afterSecond.images) {
        const row = await prisma.listingImage.findUniqueOrThrow({ where: { id: image.id } });
        expect(row.mimeType).toBe('image/jpeg');
        expect(row.storageKey.endsWith('/original.jpg')).toBe(true);
      }
    });

    it('ignores the client filename entirely (no traversal through the key)', async () => {
      const target = await draft(sellerA.token);
      const updated = await upload(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#123456' }),
      );
      expect(updated.images[0].url).not.toContain('..');

      const sneaky = await uploadRaw(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#654321' }),
        '../../evil name.jpg',
      );
      expect(sneaky.status).toBe(201);
      const sneakyImage = (sneaky.body as SuccessEnvelope<OwnerListingData>).data.images[1];
      expect(sneakyImage.url).toContain(`/media/listings/${target.id}/${sneakyImage.id}/`);
      const row = await prisma.listingImage.findUniqueOrThrow({ where: { id: sneakyImage.id } });
      expect(row.storageKey).not.toContain('..');
      expect(row.storageKey).not.toContain('evil');
    });

    it('rejects duplicate bytes on the same listing with MEDIA_ALREADY_LINKED', async () => {
      const target = await draft(sellerA.token);
      const image = await makeImage('jpeg', { color: '#446688' });
      await upload(sellerA.token, target.id, image);

      const duplicate = await uploadRaw(sellerA.token, target.id, image);
      expect(duplicate.status).toBe(409);
      expect((duplicate.body as ErrorEnvelope).error.code).toBe('MEDIA_ALREADY_LINKED');
    });

    it('enforces the configured per-listing image cap', async () => {
      const target = await draft(sellerA.token);
      for (let index = 0; index < 10; index += 1) {
        await upload(
          sellerA.token,
          target.id,
          await makeImage('jpeg', {
            width: 64,
            height: 64,
            color: `rgb(${index * 25}, ${index * 17}, ${255 - index * 20})`,
          }),
        );
      }
      const overflow = await uploadRaw(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { width: 64, height: 64, color: '#000001' }),
      );
      expect(overflow.status).toBe(409);
      expect((overflow.body as ErrorEnvelope).error.code).toBe('LISTING_IMAGE_LIMIT_REACHED');
    });

    it('rate limits uploads per user', async () => {
      // A dedicated account: this test deliberately leaves the upload window
      // tripped, and `beforeEach` resets cannot cover suite-level `beforeAll`
      // hooks — a shared seller would strand the gallery suite in 429s.
      const sellerLimited = await registerUser('E2E Media Rate Limited Seller');
      const target = await draft(sellerLimited.token);
      const tiny = await makeImage('jpeg', { width: 64, height: 64, color: '#111111' });
      // The first upload succeeds; the identical bytes are rejected as a
      // duplicate afterwards — every request still consumes upload quota.
      let last: SupertestResponse | null = null;
      for (let index = 0; index < 61; index += 1) {
        last = await uploadRaw(sellerLimited.token, target.id, tiny);
      }
      expect(last?.status).toBe(429);
      expect((last?.body as ErrorEnvelope).error.code).toBe('RATE_LIMITED');
    });
  });

  // --- Gallery management --------------------------------------------------------

  describe('gallery management', () => {
    let listingId: string;
    let first: ImageData;
    let second: ImageData;
    let third: ImageData;

    beforeAll(async () => {
      const target = await draft(sellerA.token);
      listingId = target.id;
      first = (
        await upload(sellerA.token, listingId, await makeImage('jpeg', { color: '#aa0000' }))
      ).images[0];
      const two = await upload(
        sellerA.token,
        listingId,
        await makeImage('jpeg', { color: '#00aa00' }),
      );
      second = two.images[1];
      const three = await upload(
        sellerA.token,
        listingId,
        await makeImage('jpeg', { color: '#0000aa' }),
      );
      third = three.images[2];
    });

    it('lists the gallery primary-first then by sortOrder', async () => {
      const response = await request(server)
        .get(`/api/v1/me/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const images = (response.body as SuccessEnvelope<OwnerListingData>).data.images;
      expect(images.map((image) => image.id)).toEqual([first.id, second.id, third.id]);
      expect(images.map((image) => image.sortOrder)).toEqual([0, 1, 2]);
      expect(images.map((image) => image.isPrimary)).toEqual([true, false, false]);
    });

    it('requires sortOrder or isPrimary on reorder', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${listingId}/images/${third.id}/order`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('reorders an image to a new dense position', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${listingId}/images/${third.id}/order`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ sortOrder: 0 })
        .expect(200);
      const images = (response.body as SuccessEnvelope<OwnerListingData>).data.images;
      const byId = new Map(images.map((image) => [image.id, image]));
      expect(byId.get(third.id)?.sortOrder).toBe(0);
      expect(byId.get(first.id)?.sortOrder).toBe(1);
      expect(byId.get(second.id)?.sortOrder).toBe(2);
    });

    it('moves the primary flag to another image', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${listingId}/images/${third.id}/order`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ isPrimary: true })
        .expect(200);
      const images = (response.body as SuccessEnvelope<OwnerListingData>).data.images;
      expect(images[0].id).toBe(third.id);
      expect(images[0].isPrimary).toBe(true);
      expect(images.filter((image) => image.isPrimary)).toHaveLength(1);
    });

    it('soft-deletes an image, keeps its files for the retention sweep, and promotes a successor', async () => {
      // Current state: third (primary), first, second.
      const response = await request(server)
        .delete(`/api/v1/listings/${listingId}/images/${third.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const images = (response.body as SuccessEnvelope<OwnerListingData>).data.images;
      expect(images).toHaveLength(2);
      expect(images.some((image) => image.id === third.id)).toBe(false);
      // The lowest-sortOrder survivor took the primary flag.
      expect(images.find((image) => image.isPrimary)?.id).toBe(first.id);

      // Soft delete: the row remains (audit trail for the sweep)…
      const row = await prisma.listingImage.findUniqueOrThrow({ where: { id: third.id } });
      expect(row.deletedAt).not.toBeNull();
      // …and the storage objects are retained until the sweep (§67).
      expect(await storage.exists(row.storageKey)).toBe(true);
      // The static route still serves the retained file.
      await request(server).get(new URL(third.url).pathname).expect(200);
    });

    it('reports missing and foreign image ids as MEDIA_NOT_FOUND', async () => {
      const other = await draft(sellerA.token);
      const otherImage = (
        await upload(sellerA.token, other.id, await makeImage('jpeg', { color: '#333333' }))
      ).images[0];

      await request(server)
        .delete(`/api/v1/listings/${listingId}/images/${randomUUID()}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(404);

      const foreign = await request(server)
        .delete(`/api/v1/listings/${listingId}/images/${otherImage.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(404);
      expect((foreign.body as ErrorEnvelope).error.code).toBe('MEDIA_NOT_FOUND');

      // Already-deleted images are gone as well.
      await request(server)
        .delete(`/api/v1/listings/${listingId}/images/${third.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(404);
    });

    it('denies cross-seller gallery mutations', async () => {
      await request(server)
        .delete(`/api/v1/listings/${listingId}/images/${first.id}`)
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(403);
      await request(server)
        .patch(`/api/v1/listings/${listingId}/images/${first.id}/order`)
        .set('authorization', `Bearer ${sellerB.token}`)
        .send({ sortOrder: 0 })
        .expect(403);
    });
  });

  // --- Material-change policy (§42) ----------------------------------------------

  describe('material-change policy', () => {
    it('keeps AUTO_APPROVE listings ACTIVE while bumping the version', async () => {
      const target = await draft(sellerA.token);
      await request(server)
        .post(`/api/v1/listings/${target.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);

      const updated = await upload(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#777701' }),
      );
      expect(updated.status).toBe('ACTIVE');
      expect(updated.version).toBe(3);
    });

    it('routes the first image change of an ACTIVE REVIEW_REQUIRED listing back to PENDING_REVIEW', async () => {
      const target = await draft(sellerA.token, { categoryId: reviewCat.id });
      await request(server)
        .post(`/api/v1/listings/${target.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      await listings.approve(adminUserId, target.id, 'en');

      const updated = await upload(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#777702' }),
      );
      expect(updated.status).toBe('PENDING_REVIEW');
      expect(updated.version).toBe(4);
    });

    it('keeps a PENDING_REVIEW listing pending through the rest of a multi-image batch', async () => {
      const target = await draft(sellerA.token, { categoryId: reviewCat.id });
      await request(server)
        .post(`/api/v1/listings/${target.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      await listings.approve(adminUserId, target.id, 'en');

      const firstChange = await upload(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#777703' }),
      );
      expect(firstChange.status).toBe('PENDING_REVIEW');

      // Second upload of the batch: still pending, still accepted. The colour
      // differs well past JPEG quantization — near-identical flat colours
      // re-encode to identical bytes and would trip the duplicate guard.
      const secondChange = await upload(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#1a8a3a' }),
      );
      expect(secondChange.status).toBe('PENDING_REVIEW');
      expect(secondChange.images).toHaveLength(2);
    });

    it('returns a REJECTED listing to DRAFT and clears the stale rejection', async () => {
      const target = await draft(sellerA.token, { categoryId: reviewCat.id });
      await request(server)
        .post(`/api/v1/listings/${target.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      await listings.reject(adminUserId, target.id, { reason: 'BAD_PHOTO' }, 'en');

      const updated = await upload(
        sellerA.token,
        target.id,
        await makeImage('jpeg', { color: '#777705' }),
      );
      expect(updated.status).toBe('DRAFT');
      expect(updated.rejectedReason).toBeNull();
    });
  });
});
