/**
 * Discovery e2e (Phase 8-9) — boots the real application (test database +
 * local storage) and covers spec §47–§52, §79, §82 and §110:
 *
 *  - public feed visibility: ACTIVE listings of ACTIVE sellers only, category
 *    subtrees, locations, price ranges, conditions, sorts and keyset
 *    pagination (price sorts are NULLS LAST with stable id tie-breaks)
 *  - text search over the normalized `searchText` (case folding, Persian
 *    digit folding, Arabic→Persian letter folding, LIKE-wildcard escaping)
 *  - dynamic attribute filters: whitelisting against the effective schema,
 *    per-type coercion, aggregated violations and the filter budget
 *  - public detail: ACTIVE and SOLD are reachable, every other state (and
 *    listings of suspended sellers) answers LISTING_NOT_FOUND
 *  - the anonymous list/detail rate-limit scopes
 *
 * Fixtures get a deterministic `createdAt` ladder (via a direct Prisma
 * restamp) so feed ordering and cursor walks assert exact sequences.
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { randomInt } from 'node:crypto';
import request from 'supertest';
import sharp from 'sharp';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { encodeCursor } from '../../src/common/http/pagination';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { validateEnv } from '../../src/config/env.schema';
import { PrismaService } from '../../src/database/prisma.service';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../src/providers/storage/storage.provider';

const PASSWORD = 'S3cure!Pass';
const RUN_ID = randomInt(0x100000, 0xffffff).toString(16);
const PREFIX = `e2e-${RUN_ID}`;
const CODE_BASE = RUN_ID.slice(0, 4).toUpperCase();
const DESCRIPTION = `${PREFIX} Test listing maintained carefully with original accessories included.`;

/** Deterministic creation-time ladder base for feed ordering assertions. */
const CREATED_AT_BASE = new Date('2026-06-01T00:00:00.000Z');

/** Shared with the type-guard test, so both sides always agree. */
const L15_ATTRIBUTES = {
  ram: 4,
  color: 'blue',
  tags: ['cheap', 'used'],
  warranty: false,
  released: 2020,
  brand: 'Realme',
  purchased: '2020-01-10',
  rating: 3.2,
};

interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: CursorMeta;
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      errors?: Array<{ field: string; messages: string[] }>;
      scope?: string;
    };
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

interface PublicImageData {
  id: string;
  url: string;
  variants: Record<string, ImageVariantData>;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
}

interface PublicSummaryData {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  pricingType: string;
  negotiable: boolean;
  condition: string;
  category: RefData;
  province: RefData;
  city: RefData;
  primaryImage: PublicImageData | null;
  publishedAt: string | null;
}

interface PublicAttributeData {
  key: string;
  label: string;
  type: string | null;
  value: string | number | boolean | string[];
}

interface PublicDetailData extends PublicSummaryData {
  status: 'ACTIVE' | 'SOLD';
  description: string;
  attributes: PublicAttributeData[];
  images: PublicImageData[];
  seller: { slug: string; displayName: string; memberSince: string; phoneVerified: boolean };
  contact: { available: boolean; methods: string[] };
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OwnerListingData {
  id: string;
  slug: string;
  status: string;
  version: number;
  price: number | null;
  images: PublicImageData[];
}

interface AdminCategoryData {
  id: string;
  slug: string;
}

interface AdminLocationData {
  id: string;
  slug: string;
}

interface AttributeData {
  id: string;
}

interface SellerFixture {
  userId: string;
  token: string;
}

interface FixtureListing {
  id: string;
  slug: string;
  version: number;
}

let phoneSeed = 0;

function uniquePhone(): string {
  phoneSeed += 1;
  const suffix = String((randomInt(0, 9_000_000) + phoneSeed) % 10_000_000).padStart(7, '0');
  return `+9370${suffix}`;
}

describe('Discovery (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let rateLimitService: RateLimitService;
  let storage: StorageProvider;

  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];

  let adminToken: string;
  let sellerA: SellerFixture;
  let sellerB: SellerFixture;
  let sellerSuspended: SellerFixture;

  let phonesCat: AdminCategoryData;
  let mainCat: AdminCategoryData;
  let budgetCat: AdminCategoryData;
  let laptopCat: AdminCategoryData;
  let accessoryCat: AdminCategoryData;
  let provinceA: AdminLocationData;
  let cityA1: AdminLocationData;
  let cityA2: AdminLocationData;
  let provinceB: AdminLocationData;
  let cityB1: AdminLocationData;

  // Visible ACTIVE listings of the phones category (+ its budget subtree).
  let l1: FixtureListing;
  let l2: FixtureListing;
  let l3: FixtureListing;
  let l4: FixtureListing;
  let l5: FixtureListing;
  let l6: FixtureListing;
  let l7: FixtureListing;
  let l8: FixtureListing;
  let l9: FixtureListing;
  let l10: FixtureListing;
  let l11: FixtureListing;
  let l12: FixtureListing;
  let l13: FixtureListing;
  let l14: FixtureListing;
  let l15: FixtureListing;
  let l16: FixtureListing;

  let jpegImage: Buffer;

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
    rateLimitService = app.get(RateLimitService);
    storage = app.get<StorageProvider>(STORAGE_PROVIDER);

    const admin = await createAdminToken();
    adminToken = admin.token;

    await createFixtures();
    await createListings();
    await applyDeterministicOrdering();

    jpegImage = await sharp({
      create: { width: 640, height: 480, channels: 3, background: '#3366aa' },
    })
      .jpeg()
      .toBuffer();
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
    // Children first: category parent links are `onDelete: Restrict`.
    await prisma.category.deleteMany({
      where: { slug: { startsWith: PREFIX }, parentId: { not: null } },
    });
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
      .send({ phone, password: PASSWORD, displayName: 'E2E Discovery Admin' })
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

  async function createAttribute(
    categoryId: string,
    payload: Record<string, unknown>,
  ): Promise<AttributeData> {
    const response = await request(server)
      .post(`/api/v1/admin/categories/${categoryId}/attributes`)
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<AttributeData>).data;
  }

  async function createOption(attributeId: string, value: string, label: string): Promise<void> {
    await request(server)
      .post(`/api/v1/admin/attributes/${attributeId}/options`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ value, label })
      .expect(201);
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

  async function draft(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<OwnerListingData> {
    const response = await request(server)
      .post('/api/v1/listings')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: `${PREFIX} Discovery Draft`,
        description: DESCRIPTION,
        categoryId: mainCat.id,
        provinceId: provinceA.id,
        cityId: cityA1.id,
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

  async function submitForReview(token: string, listingId: string): Promise<OwnerListingData> {
    const response = await request(server)
      .post(`/api/v1/listings/${listingId}/submit`)
      .set('authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    return (response.body as SuccessEnvelope<OwnerListingData>).data;
  }

  /** Draft + submit; asserts the AUTO_APPROVE category published it as ACTIVE. */
  async function publish(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<FixtureListing> {
    const created = await draft(token, overrides);
    const owner = await submitForReview(token, created.id);
    expect(owner.status).toBe('ACTIVE');
    return { id: owner.id, slug: owner.slug, version: owner.version };
  }

  async function markSold(token: string, listing: FixtureListing): Promise<void> {
    const response = await request(server)
      .post(`/api/v1/listings/${listing.id}/mark-sold`)
      .set('authorization', `Bearer ${token}`)
      .send({ expectedVersion: listing.version })
      .expect(200);
    expect((response.body as SuccessEnvelope<OwnerListingData>).data.status).toBe('SOLD');
  }

  async function archive(token: string, listing: FixtureListing): Promise<void> {
    const response = await request(server)
      .post(`/api/v1/listings/${listing.id}/archive`)
      .set('authorization', `Bearer ${token}`)
      .send({ expectedVersion: listing.version })
      .expect(200);
    expect((response.body as SuccessEnvelope<OwnerListingData>).data.status).toBe('ARCHIVED');
  }

  async function uploadImage(token: string, listingId: string): Promise<PublicImageData> {
    const response = await request(server)
      .post(`/api/v1/listings/${listingId}/images`)
      .set('authorization', `Bearer ${token}`)
      .attach('file', jpegImage, 'photo.jpg');
    expect(response.status).toBe(201);
    const data = (response.body as SuccessEnvelope<OwnerListingData>).data;
    expect(data.images).toHaveLength(1);
    return data.images[0];
  }

  function enc(value: string): string {
    return encodeURIComponent(value);
  }

  function idsOf(...listings: FixtureListing[]): string[] {
    return listings.map((listing) => listing.id);
  }

  /** GET /api/v1/listings with the given raw query string. */
  async function getPage(query: string): Promise<{ ids: string[]; meta: CursorMeta }> {
    const response = await request(server).get(`/api/v1/listings?${query}`).expect(200);
    const body = response.body as SuccessEnvelope<PublicSummaryData[]>;
    return { ids: body.data.map((item) => item.id), meta: body.meta as CursorMeta };
  }

  async function searchIds(query: string): Promise<string[]> {
    const page = await getPage(query);
    return page.ids;
  }

  /** `category=<phones>` + one `filter=` per expression. */
  function filterQuery(filters: string[], base = `category=${phonesCat.slug}`): string {
    return [base, ...filters.map((filter) => `filter=${enc(filter)}`)].join('&');
  }

  async function fetchDetail(slug: string, locale?: string): Promise<PublicDetailData> {
    const suffix = locale === undefined ? '' : `?locale=${locale}`;
    const response = await request(server).get(`/api/v1/listings/${slug}${suffix}`).expect(200);
    return (response.body as SuccessEnvelope<PublicDetailData>).data;
  }

  // --- Fixtures ------------------------------------------------------------------

  async function createFixtures(): Promise<void> {
    phonesCat = await createCategory({
      slug: `${PREFIX}-phones`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Discovery Phones Root' }],
    });
    // Listings only exist in leaf categories; the root stays queryable while
    // the leaf children hold the actual listings.
    mainCat = await createCategory({
      slug: `${PREFIX}-phones-main`,
      parentId: phonesCat.id,
      moderationMode: 'AUTO_APPROVE',
      translations: [
        { locale: 'en', name: 'E2E Discovery Phones' },
        { locale: 'fa', name: 'موبایل' },
      ],
    });
    budgetCat = await createCategory({
      slug: `${PREFIX}-phones-budget`,
      parentId: phonesCat.id,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Discovery Budget Phones' }],
    });
    laptopCat = await createCategory({
      slug: `${PREFIX}-laptops`,
      translations: [{ locale: 'en', name: 'E2E Discovery Laptops' }],
    });
    accessoryCat = await createCategory({
      slug: `${PREFIX}-accessories`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Discovery Accessories' }],
    });

    await createAttribute(phonesCat.id, {
      key: 'ram',
      label: 'RAM',
      type: 'INTEGER',
      filterable: true,
      sortOrder: 0,
      unit: 'GB',
    });
    const color = await createAttribute(phonesCat.id, {
      key: 'color',
      label: 'Color',
      type: 'SELECT',
      filterable: true,
      sortOrder: 1,
    });
    for (const [value, label] of [
      ['red', 'Red'],
      ['blue', 'Blue'],
      ['black', 'Black'],
      ['white', 'White'],
    ] as const) {
      await createOption(color.id, value, label);
    }
    const tags = await createAttribute(phonesCat.id, {
      key: 'tags',
      label: 'Tags',
      type: 'MULTI_SELECT',
      filterable: true,
      sortOrder: 2,
    });
    for (const [value, label] of [
      ['cheap', 'Cheap'],
      ['premium', 'Premium'],
      ['popular', 'Popular'],
      ['used', 'Used'],
    ] as const) {
      await createOption(tags.id, value, label);
    }
    await createAttribute(phonesCat.id, {
      key: 'warranty',
      label: 'Warranty',
      type: 'BOOLEAN',
      filterable: true,
      sortOrder: 3,
    });
    await createAttribute(phonesCat.id, {
      key: 'released',
      label: 'Released',
      type: 'YEAR',
      filterable: true,
      sortOrder: 4,
    });
    await createAttribute(phonesCat.id, {
      key: 'brand',
      label: 'Brand',
      type: 'TEXT',
      filterable: true,
      sortOrder: 5,
    });
    await createAttribute(phonesCat.id, {
      key: 'purchased',
      label: 'Purchased',
      type: 'DATE',
      filterable: true,
      sortOrder: 6,
    });
    await createAttribute(phonesCat.id, {
      key: 'rating',
      label: 'Rating',
      type: 'DECIMAL',
      filterable: true,
      sortOrder: 7,
    });
    await createAttribute(phonesCat.id, {
      key: 'notes',
      label: 'Notes',
      type: 'LONG_TEXT',
      filterable: false,
      sortOrder: 8,
    });
    await createAttribute(phonesCat.id, {
      key: 'legacy',
      label: 'Legacy',
      type: 'TEXT',
      filterable: true,
      isActive: false,
      sortOrder: 9,
    });

    provinceA = await createProvince(`XA-${CODE_BASE}`, 'E2E Discovery Province A');
    cityA1 = await createCity(provinceA.id, `${PREFIX}-city-a1`, 'E2E Discovery City A1');
    cityA2 = await createCity(provinceA.id, `${PREFIX}-city-a2`, 'E2E Discovery City A2');
    provinceB = await createProvince(`XB-${CODE_BASE}`, 'E2E Discovery Province B');
    cityB1 = await createCity(provinceB.id, `${PREFIX}-city-b1`, 'E2E Discovery City B1');

    sellerA = await registerUser('E2E Discovery Seller A');
    sellerB = await registerUser('E2E Discovery Seller B');
    sellerSuspended = await registerUser('E2E Discovery Suspended Seller');
  }

  async function createListings(): Promise<void> {
    l1 = await publish(sellerA.token, {
      title: `${PREFIX} Samsung Galaxy S23 128GB`,
      price: 1000,
      negotiable: true,
      attributes: {
        ram: 8,
        color: 'red',
        tags: ['cheap', 'popular'],
        warranty: true,
        released: 2023,
        brand: 'Samsung',
        purchased: '2024-06-15',
        rating: 4.5,
        notes: 'Minor scratch on the frame',
      },
    });
    l2 = await publish(sellerA.token, {
      title: `${PREFIX} Samsung A14 64GB Smartphone`,
      description: `${PREFIX} Special offer save_50 on this well kept device.`,
      condition: 'NEW',
      price: 500,
      negotiable: false,
      attributes: {
        ram: 4,
        color: 'blue',
        tags: ['cheap'],
        warranty: false,
        released: 2022,
        brand: 'Samsung',
        purchased: '2023-02-01',
        rating: 3.5,
      },
    });
    l3 = await publish(sellerA.token, {
      title: `${PREFIX} Apple iPhone 13 Pro 256GB`,
      description: `${PREFIX} Special offer saveX50 on this well kept device.`,
      condition: 'LIKE_NEW',
      price: 1500,
      attributes: {
        ram: 8,
        color: 'blue',
        tags: ['premium'],
        warranty: true,
        released: 2024,
        brand: 'Apple',
        purchased: '2025-01-01',
        rating: 4,
      },
    });
    l4 = await publish(sellerA.token, {
      title: `${PREFIX} Xiaomi Redmi Note 12`,
      pricingType: 'CONTACT',
      price: undefined,
      attributes: {
        ram: 16,
        color: 'red',
        tags: ['cheap', 'used'],
        warranty: false,
        released: 2023,
        brand: 'Xiaomi',
        purchased: '2022-11-20',
        rating: 3,
      },
    });
    l5 = await publish(sellerA.token, {
      title: `${PREFIX} Google Pixel 8 256GB`,
      cityId: cityA2.id,
      condition: 'NEW',
      price: 1200,
      attributes: {
        ram: 12,
        color: 'black',
        tags: ['premium', 'popular'],
        warranty: true,
        released: 2023,
        brand: 'Google',
        purchased: '2024-03-03',
        rating: 4.8,
      },
    });
    l6 = await publish(sellerA.token, {
      title: `${PREFIX} Nothing Phone 2a`,
      provinceId: provinceB.id,
      cityId: cityB1.id,
      condition: 'FAIR',
      price: 900,
      attributes: {
        ram: 6,
        color: 'white',
        tags: ['cheap'],
        warranty: false,
        released: 2021,
        brand: 'Nothing',
        purchased: '2021-09-09',
        rating: 3.9,
      },
    });
    l7 = await publish(sellerA.token, {
      title: `${PREFIX} Clear Case for Smartphones`,
      categoryId: accessoryCat.id,
      condition: 'NEW',
      price: 300,
    });
    const draftEight = await draft(sellerA.token, {
      title: `${PREFIX} Draft Hidden Phone`,
    });
    l8 = { id: draftEight.id, slug: draftEight.slug, version: draftEight.version };
    const pending = await draft(sellerA.token, {
      title: `${PREFIX} Pending Review Laptop`,
      categoryId: laptopCat.id,
    });
    const submitted = await submitForReview(sellerA.token, pending.id);
    expect(submitted.status).toBe('PENDING_REVIEW');
    l9 = { id: submitted.id, slug: submitted.slug, version: submitted.version };
    l10 = await publish(sellerA.token, {
      title: `${PREFIX} Sold Redmi 9 Phone`,
      price: 400,
      attributes: {
        ram: 4,
        color: 'black',
        tags: ['used'],
        warranty: false,
        released: 2020,
        brand: 'Xiaomi',
        purchased: '2020-05-05',
        rating: 3.1,
      },
    });
    await markSold(sellerA.token, l10);
    l11 = await publish(sellerB.token, {
      title: `گوشی آیفون ۱۳ پرو ${PREFIX}`,
      description: `${PREFIX} دستگاه سالم با جعبه اصلی`,
      price: 800,
      attributes: {
        ram: 6,
        color: 'red',
        tags: ['premium'],
        warranty: true,
        released: 2024,
        brand: 'Apple',
        purchased: '2025-02-02',
        rating: 3.5,
      },
    });
    l12 = await publish(sellerSuspended.token, {
      title: `${PREFIX} Suspended Seller Phone`,
      price: 950,
    });
    await prisma.sellerAccount.update({
      where: { ownerUserId: sellerSuspended.userId },
      data: { status: 'SUSPENDED' },
    });
    l13 = await publish(sellerA.token, {
      title: `${PREFIX} Archived Phone`,
      price: 850,
    });
    await archive(sellerA.token, l13);
    l14 = await publish(sellerA.token, {
      title: `${PREFIX} Deleted Phone`,
      price: 750,
    });
    await prisma.listing.update({ where: { id: l14.id }, data: { deletedAt: new Date() } });
    l15 = await publish(sellerA.token, {
      title: `${PREFIX} Realme C55 Budget`,
      categoryId: budgetCat.id,
      condition: 'NEW',
      price: 700,
      attributes: L15_ATTRIBUTES,
    });
    l16 = await publish(sellerA.token, {
      title: `${PREFIX} Orphan Attribute Phone`,
      price: 650,
      attributes: { ram: 8 },
    });
    await markSold(sellerA.token, l16);
    // Simulates an attribute that was removed from the schema after the fact.
    await prisma.listing.update({
      where: { id: l16.id },
      data: { attributes: { ram: 8, ghost: 'legacy' } },
    });

    // Contact-method seeds (Phase 10 releases the values; §110 covers flags).
    // Drafts already receive default PHONE + WHATSAPP rows since Phase 10, so
    // the seeds must upsert on the (listingId, type) key to stay idempotent.
    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: l1.id, type: 'PHONE' } },
      create: { listingId: l1.id, type: 'PHONE', enabled: true },
      update: { enabled: true },
    });
    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: l1.id, type: 'WHATSAPP' } },
      create: { listingId: l1.id, type: 'WHATSAPP', enabled: true },
      update: { enabled: true },
    });
    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: l1.id, type: 'TELEGRAM' } },
      create: { listingId: l1.id, type: 'TELEGRAM', enabled: false },
      update: { enabled: false },
    });
    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: l10.id, type: 'PHONE' } },
      create: { listingId: l10.id, type: 'PHONE', enabled: true },
      update: { enabled: true },
    });
    // l10 stays phone-only: the default WHATSAPP row is turned off.
    await prisma.listingContactMethod.upsert({
      where: { listingId_type: { listingId: l10.id, type: 'WHATSAPP' } },
      create: { listingId: l10.id, type: 'WHATSAPP', enabled: false },
      update: { enabled: false },
    });
  }

  /** Deterministic `createdAt` ladder + view counters for feed ordering. */
  async function applyDeterministicOrdering(): Promise<void> {
    const restamps: Array<[FixtureListing, number]> = [
      [l1, 7],
      [l5, 6],
      [l4, 5],
      [l11, 4],
      [l2, 3],
      [l3, 2],
      [l6, 1],
      [l15, 0],
      [l7, 9],
    ];
    for (const [listing, minutes] of restamps) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: { createdAt: new Date(CREATED_AT_BASE.getTime() + minutes * 60_000) },
      });
    }
    const views: Array<[FixtureListing, number]> = [
      [l1, 5],
      [l2, 30],
      [l3, 1],
      [l4, 50],
      [l5, 10],
      [l6, 0],
      [l7, 2],
      [l11, 7],
      [l15, 3],
    ];
    for (const [listing, count] of views) {
      await prisma.listing.update({ where: { id: listing.id }, data: { views: count } });
    }
  }

  // --- Public feed visibility --------------------------------------------------

  describe('public feed visibility', () => {
    it('returns the active catalog of a category subtree, newest first', async () => {
      const { ids, meta } = await getPage(`category=${phonesCat.slug}`);
      expect(ids).toEqual(idsOf(l1, l5, l4, l11, l2, l3, l6, l15));
      expect(meta.hasMore).toBe(false);
      expect(meta.nextCursor).toBeNull();
      expect(meta.limit).toBe(24);
    });

    it('exposes only the documented public summary fields', async () => {
      const response = await request(server)
        .get(`/api/v1/listings?category=${phonesCat.slug}&limit=1`)
        .expect(200);
      const [item] = (response.body as SuccessEnvelope<PublicSummaryData[]>).data;
      expect(item.id).toBe(l1.id);
      expect(Object.keys(item).sort()).toEqual(
        [
          'category',
          'city',
          'condition',
          'currency',
          'id',
          'negotiable',
          'price',
          'pricingType',
          'primaryImage',
          'province',
          'publishedAt',
          'slug',
          'title',
        ].sort(),
      );
      expect(item.price).toBe(1000);
      expect(item.currency).toBe('AFN');
      expect(item.pricingType).toBe('PAID');
      expect(item.negotiable).toBe(true);
      expect(item.condition).toBe('GOOD');
      expect(item.category).toEqual({
        id: mainCat.id,
        slug: mainCat.slug,
        name: 'E2E Discovery Phones',
      });
      expect(item.province).toEqual({
        id: provinceA.id,
        slug: provinceA.slug,
        name: 'E2E Discovery Province A',
      });
      expect(item.city).toEqual({
        id: cityA1.id,
        slug: cityA1.slug,
        name: 'E2E Discovery City A1',
      });
      expect(item.primaryImage).toBeNull();
      expect(typeof item.publishedAt).toBe('string');
      // Moderation and lifecycle internals never leak into the public feed.
      for (const key of ['status', 'description', 'contact', 'seller', 'views', 'attributes']) {
        expect(item).not.toHaveProperty(key);
      }
    });

    it('keeps only visible states and active sellers in the full feed', async () => {
      const ids = await searchIds(`q=${enc(PREFIX)}`);
      expect(ids).toEqual(idsOf(l7, l1, l5, l4, l11, l2, l3, l6, l15));
      // DRAFT, PENDING_REVIEW, SOLD, ARCHIVED, soft-deleted and the listing
      // of the suspended seller must all stay invisible.
      for (const hidden of [l8, l9, l10, l12, l13, l14, l16]) {
        expect(ids).not.toContain(hidden.id);
      }
    });

    it('isolates categories: the leaf subtrees and the sibling category', async () => {
      expect(await searchIds(`category=${mainCat.slug}`)).toEqual(
        idsOf(l1, l5, l4, l11, l2, l3, l6),
      );
      expect(await searchIds(`category=${budgetCat.slug}`)).toEqual(idsOf(l15));
      expect(await searchIds(`category=${accessoryCat.slug}`)).toEqual(idsOf(l7));
    });

    it('applies province and city filters and requires a province for cities', async () => {
      expect(await searchIds(`province=${provinceA.slug}`)).toEqual(
        idsOf(l7, l1, l5, l4, l11, l2, l3, l15),
      );
      expect(await searchIds(`province=${provinceA.slug}&city=${cityA2.slug}`)).toEqual(idsOf(l5));
      expect(await searchIds(`province=${provinceB.slug}`)).toEqual(idsOf(l6));
      expect(await searchIds(`province=${provinceB.slug}&city=${cityB1.slug}`)).toEqual(idsOf(l6));

      const orphanCity = await request(server)
        .get(`/api/v1/listings?city=${cityA1.slug}`)
        .expect(400);
      const body = orphanCity.body as ErrorEnvelope;
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.details?.errors).toEqual([expect.objectContaining({ field: 'city' })]);
    });

    it('answers unknown slugs with an empty feed instead of an error', async () => {
      for (const query of [
        `category=${PREFIX}-nope`,
        `province=${PREFIX}-nope`,
        `province=${provinceA.slug}&city=${PREFIX}-nope`,
      ]) {
        const { ids, meta } = await getPage(query);
        expect(ids).toEqual([]);
        expect(meta.hasMore).toBe(false);
        expect(meta.nextCursor).toBeNull();
      }
    });

    it('filters by price range and excludes CONTACT listings from ranged queries', async () => {
      expect(await searchIds(`category=${phonesCat.slug}&minPrice=800`)).toEqual(
        idsOf(l1, l5, l11, l3, l6),
      );
      expect(await searchIds(`category=${phonesCat.slug}&maxPrice=900`)).toEqual(
        idsOf(l11, l2, l6, l15),
      );
      expect(await searchIds(`category=${phonesCat.slug}&minPrice=800&maxPrice=1200`)).toEqual(
        idsOf(l1, l5, l11, l6),
      );

      const inverted = await request(server)
        .get(`/api/v1/listings?category=${phonesCat.slug}&minPrice=900&maxPrice=100`)
        .expect(400);
      expect((inverted.body as ErrorEnvelope).error.details?.errors).toEqual([
        expect.objectContaining({ field: 'minPrice' }),
      ]);
    });

    it('filters by condition using CSV values', async () => {
      expect(await searchIds(`category=${phonesCat.slug}&condition=GOOD`)).toEqual(
        idsOf(l1, l4, l11),
      );
      expect(await searchIds(`category=${phonesCat.slug}&condition=NEW,GOOD`)).toEqual(
        idsOf(l1, l5, l4, l11, l2, l15),
      );

      const bad = await request(server)
        .get(`/api/v1/listings?category=${phonesCat.slug}&condition=MINT`)
        .expect(400);
      expect((bad.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('sorts by price with NULLS LAST and by views', async () => {
      expect(await searchIds(`category=${phonesCat.slug}&sort=price_asc`)).toEqual(
        idsOf(l2, l15, l11, l6, l1, l5, l3, l4),
      );
      expect(await searchIds(`category=${phonesCat.slug}&sort=price_desc`)).toEqual(
        idsOf(l3, l5, l1, l6, l11, l15, l2, l4),
      );
      expect(await searchIds(`category=${phonesCat.slug}&sort=most_viewed`)).toEqual(
        idsOf(l4, l2, l5, l11, l1, l15, l3, l6),
      );

      const invalid = await request(server)
        .get(`/api/v1/listings?category=${phonesCat.slug}&sort=cheapest`)
        .expect(400);
      expect((invalid.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('paginates the newest feed with opaque cursors to the last item', async () => {
      const first = await getPage(`category=${phonesCat.slug}&limit=3`);
      expect(first.ids).toEqual(idsOf(l1, l5, l4));
      expect(first.meta.hasMore).toBe(true);
      expect(first.meta.limit).toBe(3);

      const second = await getPage(
        `category=${phonesCat.slug}&limit=3&cursor=${enc(first.meta.nextCursor as string)}`,
      );
      expect(second.ids).toEqual(idsOf(l11, l2, l3));

      const third = await getPage(
        `category=${phonesCat.slug}&limit=3&cursor=${enc(second.meta.nextCursor as string)}`,
      );
      expect(third.ids).toEqual(idsOf(l6, l15));
      expect(third.meta.hasMore).toBe(false);
      expect(third.meta.nextCursor).toBeNull();
    });

    it('paginates price sorts across the NULLS LAST boundary', async () => {
      const first = await getPage(`category=${phonesCat.slug}&sort=price_asc&limit=3`);
      expect(first.ids).toEqual(idsOf(l2, l15, l11));
      const second = await getPage(
        `category=${phonesCat.slug}&sort=price_asc&limit=3&cursor=${enc(first.meta.nextCursor as string)}`,
      );
      expect(second.ids).toEqual(idsOf(l6, l1, l5));
      const third = await getPage(
        `category=${phonesCat.slug}&sort=price_asc&limit=3&cursor=${enc(second.meta.nextCursor as string)}`,
      );
      expect(third.ids).toEqual(idsOf(l3, l4));
      expect(third.meta.hasMore).toBe(false);

      const descFirst = await getPage(`category=${phonesCat.slug}&sort=price_desc&limit=5`);
      expect(descFirst.ids).toEqual(idsOf(l3, l5, l1, l6, l11));
      const descSecond = await getPage(
        `category=${phonesCat.slug}&sort=price_desc&limit=5&cursor=${enc(descFirst.meta.nextCursor as string)}`,
      );
      expect(descSecond.ids).toEqual(idsOf(l15, l2, l4));
      expect(descSecond.meta.hasMore).toBe(false);
    });

    it('rejects malformed, mismatched and structurally broken cursors', async () => {
      const bogus = await request(server).get('/api/v1/listings?cursor=not-a-cursor').expect(400);
      expect((bogus.body as ErrorEnvelope).error.details?.errors).toEqual([
        expect.objectContaining({ field: 'cursor' }),
      ]);

      const newestPage = await getPage(`category=${phonesCat.slug}&limit=3`);
      const mismatched = await request(server)
        .get(`/api/v1/listings?sort=price_asc&cursor=${enc(newestPage.meta.nextCursor as string)}`)
        .expect(400);
      expect((mismatched.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const badId = encodeCursor({
        sort: 'newest',
        id: 'not-a-uuid',
        createdAt: new Date().toISOString(),
      });
      await request(server)
        .get(`/api/v1/listings?cursor=${enc(badId)}`)
        .expect(400);
    });

    it('honours price-null cursors defensively', async () => {
      // Anchors this service itself could have issued for the NULL block.
      const afterSmallest = encodeCursor({
        sort: 'price_asc',
        id: '00000000-0000-0000-0000-000000000001',
        priceNull: true,
      });
      expect(
        await searchIds(`category=${phonesCat.slug}&sort=price_asc&cursor=${enc(afterSmallest)}`),
      ).toEqual(idsOf(l4));

      const afterLargest = encodeCursor({
        sort: 'price_asc',
        id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        priceNull: true,
      });
      expect(
        await searchIds(`category=${phonesCat.slug}&sort=price_asc&cursor=${enc(afterLargest)}`),
      ).toEqual([]);
    });
  });

  // --- Text search -------------------------------------------------------------

  describe('text search', () => {
    it('matches normalized terms across title and description', async () => {
      expect(await searchIds('q=galaxy')).toEqual(idsOf(l1));
      expect(await searchIds('q=samsung')).toEqual(idsOf(l1, l2));
      expect(await searchIds(`q=${enc(`${PREFIX} galaxy`)}`)).toEqual(idsOf(l1));
    });

    it('folds Arabic letter variants and Persian digits', async () => {
      // ARABIC YEH in the query folds to the stored FARSI YEH.
      expect(await searchIds(`q=${enc('آيفون')}`)).toEqual(idsOf(l11));
      expect(await searchIds(`q=${enc('آیفون')}`)).toEqual(idsOf(l11));
      // Persian digits fold to ASCII before matching the stored text.
      expect(await searchIds(`q=${enc('۱۳ پرو')}`)).toEqual(idsOf(l11));
    });

    it('treats LIKE wildcards as literals', async () => {
      expect(await searchIds(`q=${enc('save_50')}`)).toEqual(idsOf(l2));
      expect(await searchIds(`q=${enc('savex50')}`)).toEqual(idsOf(l3));
      expect(await searchIds(`q=${enc('save%50')}`)).toEqual([]);
      expect(await searchIds(`q=${enc('%')}`)).toEqual([]);
    });

    it('compares case-insensitively', async () => {
      expect(await searchIds('q=GALAXY')).toEqual(idsOf(l1));
      expect(await searchIds(`q=${enc('Save_50')}`)).toEqual(idsOf(l2));
    });

    it('ANDs multiple terms and normalizes whitespace', async () => {
      expect(await searchIds(`q=${enc('samsung 64gb')}`)).toEqual(idsOf(l2));
      expect(await searchIds(`q=${enc('samsung 999gb')}`)).toEqual([]);
      expect(await searchIds(`q=${enc('  samsung   galaxy  ')}`)).toEqual(idsOf(l1));
    });

    it('never surfaces non-public listings through search', async () => {
      expect(await searchIds(`q=${enc('hidden draft')}`)).toEqual([]);
      expect(await searchIds(`q=${enc('pending review')}`)).toEqual([]);
    });
  });

  // --- Dynamic attribute filters -------------------------------------------------

  describe('attribute filters', () => {
    async function filterError(query: string): Promise<ErrorEnvelope> {
      const response = await request(server).get(`/api/v1/listings?${query}`).expect(400);
      return response.body as ErrorEnvelope;
    }

    it('filters INTEGER attributes by eq, gte and in', async () => {
      expect(await searchIds(filterQuery(['ram:gte:8']))).toEqual(idsOf(l1, l5, l4, l3));
      expect(await searchIds(filterQuery(['ram:in:4,16']))).toEqual(idsOf(l4, l2, l15));
      expect(await searchIds(filterQuery(['ram:eq:6']))).toEqual(idsOf(l11, l6));
    });

    it('filters DECIMAL, YEAR, DATE and BOOLEAN attributes', async () => {
      expect(await searchIds(filterQuery(['rating:gte:4']))).toEqual(idsOf(l1, l5, l3));
      expect(await searchIds(filterQuery(['released:gte:2023']))).toEqual(
        idsOf(l1, l5, l4, l11, l3),
      );
      expect(await searchIds(filterQuery(['released:lte:2022']))).toEqual(idsOf(l2, l6, l15));
      expect(await searchIds(filterQuery(['purchased:gte:2024-01-01']))).toEqual(
        idsOf(l1, l5, l11, l3),
      );
      expect(await searchIds(filterQuery(['purchased:lte:2020-12-31']))).toEqual(idsOf(l15));
      expect(await searchIds(filterQuery(['warranty:eq:true']))).toEqual(idsOf(l1, l5, l11, l3));
      expect(await searchIds(filterQuery(['warranty:eq:1']))).toEqual(idsOf(l1, l5, l11, l3));
    });

    it('filters SELECT and MULTI_SELECT attributes', async () => {
      expect(await searchIds(filterQuery(['color:eq:red']))).toEqual(idsOf(l1, l4, l11));
      expect(await searchIds(filterQuery(['color:in:red,black']))).toEqual(idsOf(l1, l5, l4, l11));
      expect(await searchIds(filterQuery(['tags:contains:cheap']))).toEqual(
        idsOf(l1, l4, l2, l6, l15),
      );
      expect(await searchIds(filterQuery(['tags:in:premium,used']))).toEqual(
        idsOf(l5, l4, l11, l3, l15),
      );
    });

    it('filters TEXT attributes with case-sensitive eq and contains', async () => {
      expect(await searchIds(filterQuery(['brand:eq:Samsung']))).toEqual(idsOf(l1, l2));
      expect(await searchIds(filterQuery(['brand:contains:Sams']))).toEqual(idsOf(l1, l2));
      // LIKE is case-sensitive on the stored JSON text — pinned deliberately.
      expect(await searchIds(filterQuery(['brand:contains:sams']))).toEqual([]);
    });

    it('combines attribute filters with each other and with q', async () => {
      expect(await searchIds(filterQuery(['ram:gte:8', 'warranty:eq:true']))).toEqual(
        idsOf(l1, l5, l3),
      );
      expect(
        await searchIds(filterQuery(['warranty:eq:true'], `category=${phonesCat.slug}&q=samsung`)),
      ).toEqual(idsOf(l1));
      expect(
        await searchIds(filterQuery(['warranty:eq:false'], `category=${phonesCat.slug}&q=samsung`)),
      ).toEqual(idsOf(l2));
    });

    it('treats exact duplicate filters as idempotent', async () => {
      expect(await searchIds(filterQuery(['ram:eq:8', 'ram:eq:8']))).toEqual(idsOf(l1, l3));
    });

    it('skips wrongly-shaped stored values instead of raising cast errors', async () => {
      await prisma.listing.update({
        where: { id: l15.id },
        data: { attributes: { ...L15_ATTRIBUTES, ram: 'four' } },
      });
      try {
        expect(await searchIds(filterQuery(['ram:gte:4']))).toEqual(
          idsOf(l1, l5, l4, l11, l2, l3, l6),
        );
      } finally {
        await prisma.listing.update({
          where: { id: l15.id },
          data: { attributes: L15_ATTRIBUTES },
        });
      }
      expect(await searchIds(filterQuery(['ram:gte:4']))).toEqual(
        idsOf(l1, l5, l4, l11, l2, l3, l6, l15),
      );
    });

    it('rejects unknown, inactive, non-filterable and disallowed expressions', async () => {
      const unknown = await filterError(filterQuery(['weight:eq:5']));
      expect(unknown.error.code).toBe('VALIDATION_ERROR');
      expect(unknown.error.details?.errors?.[0]?.messages ?? []).toEqual([
        '"weight" is not an attribute of the selected category.',
      ]);

      const inactive = await filterError(filterQuery(['legacy:eq:x']));
      expect(inactive.error.details?.errors?.[0]?.messages ?? []).toEqual([
        'Attribute "legacy" is no longer available for filtering.',
      ]);

      const notFilterable = await filterError(filterQuery(['notes:contains:foo']));
      expect(notFilterable.error.details?.errors?.[0]?.messages ?? []).toEqual([
        'Attribute "notes" cannot be used as a filter.',
      ]);

      const disallowed = await filterError(filterQuery(['brand:gte:S']));
      expect(disallowed.error.details?.errors?.[0]?.messages ?? []).toEqual([
        'Operator "gte" is not allowed for attribute "brand".',
      ]);
    });

    it('aggregates every violation under the "filter" field', async () => {
      const body = await filterError(
        filterQuery(['weight:eq:5', 'notes:contains:foo', 'ram:between:4']),
      );
      const errors = body.error.details?.errors ?? [];
      expect(errors).toHaveLength(3);
      for (const issue of errors) {
        expect(issue.field).toBe('filter');
        expect(issue.messages).toHaveLength(1);
      }
    });

    it('rejects malformed expressions and bad values', async () => {
      const noColons = await filterError(filterQuery(['ram8']));
      expect(noColons.error.details?.errors?.[0]?.messages ?? []).toEqual([
        'Filters use the form key:operator:value.',
      ]);

      const badKey = await filterError(filterQuery(['RAM:eq:8']));
      expect(badKey.error.details?.errors?.[0]?.messages ?? []).toEqual([
        '"RAM" is not a valid attribute key.',
      ]);

      const badValue = await filterError(filterQuery(['ram:gte:abc']));
      expect(badValue.error.details?.errors?.[0]?.messages ?? []).toEqual([
        '"abc" is not a whole number.',
      ]);

      const emptyValue = await filterError(filterQuery(['ram:eq:']));
      expect(emptyValue.error.details?.errors?.[0]?.messages ?? []).toEqual([
        'The filter value is empty.',
      ]);
    });

    it('bounds the "in" list and dedupes its values', async () => {
      expect(await searchIds(filterQuery(['ram:in:4,4,16']))).toEqual(idsOf(l4, l2, l15));

      const twentyOneValues = Array.from({ length: 21 }, (_, index) => index + 1).join(',');
      const body = await filterError(filterQuery([`ram:in:${twentyOneValues}`]));
      expect(body.error.details?.errors?.[0]?.messages ?? []).toEqual([
        'Operator "in" accepts at most 20 values.',
      ]);
    });

    it('enforces the configured filter budget per request', async () => {
      const body = await filterError(
        filterQuery([
          'ram:eq:8',
          'ram:gte:4',
          'ram:lte:16',
          'ram:in:4,8',
          'color:eq:red',
          'color:in:red,blue',
          'brand:eq:Samsung',
          'brand:contains:Sam',
          'warranty:eq:true',
        ]),
      );
      const errors = body.error.details?.errors ?? [];
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('filter');
      expect(errors[0].messages[0]).toContain('At most 8');
    });

    it('requires a category for attribute filters', async () => {
      const body = await filterError(`filter=${enc('ram:eq:8')}`);
      expect(body.error.details?.errors).toEqual([
        expect.objectContaining({
          field: 'filter',
          messages: ['Attribute filters require a category parameter.'],
        }),
      ]);
    });
  });

  // --- Public listing detail -----------------------------------------------------

  describe('public listing detail', () => {
    it('serves an ACTIVE listing with attributes, seller context and contact flags', async () => {
      const detail = await fetchDetail(l1.slug);
      expect(detail.id).toBe(l1.id);
      expect(detail.status).toBe('ACTIVE');
      expect(detail.title).toBe(`${PREFIX} Samsung Galaxy S23 128GB`);
      expect(detail.price).toBe(1000);
      expect(detail.currency).toBe('AFN');
      expect(detail.pricingType).toBe('PAID');
      expect(detail.negotiable).toBe(true);
      expect(detail.condition).toBe('GOOD');
      expect(detail.description).toBe(DESCRIPTION);
      expect(detail.category).toEqual({
        id: mainCat.id,
        slug: mainCat.slug,
        name: 'E2E Discovery Phones',
      });
      expect(detail.province.name).toBe('E2E Discovery Province A');
      expect(detail.city.name).toBe('E2E Discovery City A1');

      const byKey = new Map(detail.attributes.map((attribute) => [attribute.key, attribute]));
      expect(detail.attributes).toHaveLength(9);
      expect(byKey.get('ram')).toEqual({ key: 'ram', label: 'RAM', type: 'INTEGER', value: 8 });
      expect(byKey.get('color')).toEqual({
        key: 'color',
        label: 'Color',
        type: 'SELECT',
        value: 'red',
      });
      expect(byKey.get('tags')).toEqual({
        key: 'tags',
        label: 'Tags',
        type: 'MULTI_SELECT',
        value: ['cheap', 'popular'],
      });
      expect(byKey.get('warranty')).toEqual({
        key: 'warranty',
        label: 'Warranty',
        type: 'BOOLEAN',
        value: true,
      });
      expect(byKey.get('released')).toEqual({
        key: 'released',
        label: 'Released',
        type: 'YEAR',
        value: 2023,
      });
      expect(byKey.get('brand')).toEqual({
        key: 'brand',
        label: 'Brand',
        type: 'TEXT',
        value: 'Samsung',
      });
      expect(byKey.get('purchased')).toEqual({
        key: 'purchased',
        label: 'Purchased',
        type: 'DATE',
        value: '2024-06-15',
      });
      expect(byKey.get('rating')).toEqual({
        key: 'rating',
        label: 'Rating',
        type: 'DECIMAL',
        value: 4.5,
      });
      expect(byKey.get('notes')).toEqual({
        key: 'notes',
        label: 'Notes',
        type: 'LONG_TEXT',
        value: 'Minor scratch on the frame',
      });

      const account = await prisma.sellerAccount.findUniqueOrThrow({
        where: { ownerUserId: sellerA.userId },
      });
      const owner = await prisma.user.findUniqueOrThrow({
        where: { id: sellerA.userId },
        select: { createdAt: true },
      });
      expect(detail.seller).toEqual({
        slug: account.slug,
        displayName: account.displayName,
        memberSince: owner.createdAt.toISOString(),
        phoneVerified: true,
      });
      expect(detail.contact).toEqual({ available: true, methods: ['PHONE', 'WHATSAPP'] });
      expect(detail.images).toEqual([]);
      expect(detail.primaryImage).toBeNull();
      expect(detail.soldAt).toBeNull();
      expect(typeof detail.createdAt).toBe('string');
      expect(typeof detail.updatedAt).toBe('string');
      expect(typeof detail.publishedAt).toBe('string');

      for (const key of [
        'rejectedReason',
        'rejectedNote',
        'archivedAt',
        'expiresAt',
        'version',
        'views',
        'favoriteCount',
      ]) {
        expect(detail).not.toHaveProperty(key);
      }
    });

    it('resolves localized names by locale with English fallback', async () => {
      const fa = await fetchDetail(l1.slug, 'fa');
      expect(fa.category.name).toBe('موبایل');
      expect(fa.title).toBe(`${PREFIX} Samsung Galaxy S23 128GB`);
      const ps = await fetchDetail(l1.slug, 'ps');
      expect(ps.category.name).toBe('E2E Discovery Phones');
    });

    it('exposes SOLD listings with the contact channel closed', async () => {
      const sold = await fetchDetail(l10.slug);
      expect(sold.status).toBe('SOLD');
      expect(typeof sold.soldAt).toBe('string');
      expect(sold.contact).toEqual({ available: false, methods: ['PHONE'] });
    });

    it('keeps orphan attribute keys visible with a null type', async () => {
      const orphan = await fetchDetail(l16.slug);
      const byKey = new Map(orphan.attributes.map((attribute) => [attribute.key, attribute]));
      expect(orphan.attributes).toHaveLength(2);
      expect(byKey.get('ram')).toEqual({ key: 'ram', label: 'RAM', type: 'INTEGER', value: 8 });
      expect(byKey.get('ghost')).toEqual({
        key: 'ghost',
        label: 'ghost',
        type: null,
        value: 'legacy',
      });
    });

    it('hides every non-public state behind LISTING_NOT_FOUND', async () => {
      for (const slug of [l8.slug, l9.slug, l13.slug, l14.slug, l12.slug, `${PREFIX}-missing`]) {
        const response = await request(server).get(`/api/v1/listings/${slug}`).expect(404);
        expect((response.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_FOUND');
      }
    });
  });

  // --- Media integration ---------------------------------------------------------

  describe('media integration', () => {
    it('surfaces uploaded images in the feed card and the public detail', async () => {
      const image = await uploadImage(sellerA.token, l1.id);
      expect(image.isPrimary).toBe(true);
      expect(image.variants.thumbnail.width).toBe(320);

      const feed = await request(server)
        .get(`/api/v1/listings?category=${phonesCat.slug}&limit=1`)
        .expect(200);
      const [card] = (feed.body as SuccessEnvelope<PublicSummaryData[]>).data;
      expect(card.id).toBe(l1.id);
      expect(card.primaryImage?.url).toBe(image.url);
      expect(card.primaryImage?.variants.thumbnail.width).toBe(320);

      const detail = await fetchDetail(l1.slug);
      expect(detail.status).toBe('ACTIVE');
      expect(detail.images).toHaveLength(1);
      expect(detail.images[0].url).toBe(image.url);
      expect(detail.primaryImage?.url).toBe(image.url);
    });
  });

  // --- Rate limiting -------------------------------------------------------------

  describe('rate limiting', () => {
    it('limits the anonymous list scope per client IP and keeps detail independent', async () => {
      const statuses: number[] = [];
      let lastBody: ErrorEnvelope | null = null;
      for (let index = 0; index < 121; index += 1) {
        const response = await request(server).get('/api/v1/listings');
        statuses.push(response.status);
        if (index === 120) {
          lastBody = response.body as ErrorEnvelope;
        }
      }
      expect(statuses.slice(0, 120).every((status) => status === 200)).toBe(true);
      expect(statuses[120]).toBe(429);
      expect(lastBody?.error.code).toBe('RATE_LIMITED');
      expect(lastBody?.error.details?.scope).toBe('search:list:ip');

      // The detail scope is tracked independently of the tripped list scope.
      await request(server).get(`/api/v1/listings/${l1.slug}`).expect(200);
    });
  });
});
