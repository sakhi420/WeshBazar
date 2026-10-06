/**
 * Listings e2e (Phase 7) — boots the real application (test database) and
 * covers:
 *
 *   - creation rules: length/pricing/plain-text validation, dynamic
 *     attributes (required, type, range, options), category and location
 *     guards, mass-assignment immunity (no payload can set status/version)
 *   - the state machine: submit, auto-approve, review, approve/reject,
 *     mark-sold, archive, renew — including every illegal transition
 *   - versioning & concurrency: expectedVersion pre-checks, conditional
 *     update races (LISTING_VERSION_CONFLICT), append-only revision history
 *   - ownership (IDOR): cross-seller reads and commands are denied
 *   - publish gates: verified phone, pending/active limits, create rate limit
 *   - searchText normalization persisted on write
 *   - GET /me/listings cursor pagination + status filtering
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { randomInt, randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { validateEnv } from '../../src/config/env.schema';
import { PrismaService } from '../../src/database/prisma.service';
import { ListingsService } from '../../src/modules/listings/listings.service';
import { normalizeSearchText } from '../../src/modules/listings/search-text';

const PASSWORD = 'S3cure!Pass';
const RUN_ID = randomInt(0x100000, 0xffffff).toString(16);
const PREFIX = `e2e-${RUN_ID}`;
const CODE_BASE = RUN_ID.slice(0, 4).toUpperCase();
const DESCRIPTION = `${PREFIX} Well maintained device including original box and charger.`;

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: { nextCursor: string | null; hasMore: boolean; limit: number };
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { errors?: Array<Record<string, unknown>>; scope?: string };
  };
  requestId: string;
}

interface RefData {
  id: string;
  slug: string;
  name: string;
}

interface OwnerListingData {
  id: string;
  slug: string;
  status: string;
  version: number;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  pricingType: string;
  negotiable: boolean;
  condition: string;
  attributes: Record<string, unknown>;
  category: RefData;
  province: RefData;
  city: RefData;
  views: number;
  favoriteCount: number;
  publishedAt: string | null;
  soldAt: string | null;
  archivedAt: string | null;
  expiresAt: string | null;
  rejectedReason: string | null;
  rejectedNote: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RevisionData {
  id: string;
  version: number;
  changeType: string;
  snapshot: Record<string, unknown>;
  attributeSchemaReference: Array<{ key: string; type: string; required: boolean }> | null;
  createdByUserId: string | null;
  createdAt: string;
}

interface AdminCategoryData {
  id: string;
  slug: string;
  status: string;
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

describe('Listings (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let listings: ListingsService;
  let rateLimitService: RateLimitService;
  const createdUserIds: string[] = [];

  let adminToken: string;
  let adminUserId: string;

  /** sellerA: verified, drives the main lifecycle flows. */
  let sellerA: SellerFixture;
  /** sellerB: verified, used for IDOR and pagination. */
  let sellerB: SellerFixture;
  /** Unverified until a test verifies it mid-flow. */
  let sellerUnverified: SellerFixture;
  let sellerPendingCap: SellerFixture;
  let sellerActiveCap: SellerFixture;
  let sellerRateLimit: SellerFixture;

  let autoCat: AdminCategoryData;
  let reviewCat: AdminCategoryData;
  let treeRoot: AdminCategoryData;
  let treeLeaf: AdminCategoryData;
  let tempCat: AdminCategoryData;
  let inactiveCat: AdminCategoryData;
  let provinceX: AdminLocationData;
  let cityX: AdminLocationData;
  let province2: AdminLocationData;
  let city2: AdminLocationData;

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

    const admin = await createAdminToken();
    adminToken = admin.token;
    adminUserId = admin.userId;

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
    for (let pass = 0; pass < 6; pass += 1) {
      const leaves = await prisma.category.findMany({
        where: { slug: { startsWith: PREFIX }, children: { none: {} } },
        select: { id: true },
      });
      if (leaves.length === 0) {
        break;
      }
      await prisma.category.deleteMany({ where: { id: { in: leaves.map((leaf) => leaf.id) } } });
    }
    await prisma.city.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.province.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.sellerAccount.deleteMany({ where: { id: { in: sellerAccountIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await app.close();
  });

  // --- Helpers -----------------------------------------------------------------

  async function registerUser(displayName: string): Promise<SellerFixture> {
    // Registrations share one IP-scoped limiter window; reset per helper call
    // so a fixture-heavy suite never trips the anti-abuse guard.
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
    return { userId: body.data.user.id, token: body.data.tokens.accessToken };
  }

  async function verifyPhone(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { phoneVerifiedAt: new Date() } });
  }

  /** Admin tokens must come from a login AFTER the role is raised. */
  async function createAdminToken(): Promise<{ token: string; userId: string }> {
    rateLimitService.reset();
    const phone = uniquePhone();
    const register = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone, password: PASSWORD, displayName: 'E2E Listings Admin' })
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
  ): Promise<{ id: string }> {
    const response = await request(server)
      .post(`/api/v1/admin/categories/${categoryId}/attributes`)
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<{ id: string }>).data;
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

  function draftPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      title: `${PREFIX} iPhone 13 Pro Max`,
      description: DESCRIPTION,
      categoryId: autoCat.id,
      provinceId: provinceX.id,
      cityId: cityX.id,
      condition: 'GOOD',
      pricingType: 'PAID',
      price: 45_000,
      currency: 'AFN',
      ...overrides,
    };
  }

  async function draft(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<OwnerListingData> {
    const response = await request(server)
      .post('/api/v1/listings')
      .set('authorization', `Bearer ${token}`)
      .send(draftPayload(overrides))
      .expect(201);
    return (response.body as SuccessEnvelope<OwnerListingData>).data;
  }

  async function sellerAccountIdFor(userId: string): Promise<string> {
    const seller = await prisma.sellerAccount.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    return seller!.id;
  }

  /** Direct inserts for limit fixtures — faster than driving HTTP in a loop. */
  async function seedListings(
    sellerAccountId: string,
    status: 'PENDING_REVIEW' | 'ACTIVE',
    count: number,
    categoryId: string,
  ): Promise<void> {
    const data = Array.from({ length: count }, (_, index) => ({
      sellerAccountId,
      categoryId,
      provinceId: provinceX.id,
      cityId: cityX.id,
      slug: `${PREFIX}-seed-${status.toLowerCase()}-${index}-${randomInt(0, 1e9).toString(36)}`,
      title: `${PREFIX} Seed ${status} #${index}`,
      description: `${PREFIX} Seeded fixture listing ${index} for ${status} limit tests.`,
      condition: 'NEW' as const,
      status,
    }));
    await prisma.listing.createMany({ data });
  }

  async function createFixtures(): Promise<void> {
    autoCat = await createCategory({
      slug: `${PREFIX}-auto`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Auto Category' }],
    });
    reviewCat = await createCategory({
      slug: `${PREFIX}-review`,
      translations: [{ locale: 'en', name: 'E2E Review Category' }],
    });
    treeRoot = await createCategory({
      slug: `${PREFIX}-tree-root`,
      translations: [{ locale: 'en', name: 'E2E Tree Root' }],
    });
    treeLeaf = await createCategory({
      parentId: treeRoot.id,
      slug: `${PREFIX}-tree-leaf`,
      translations: [{ locale: 'en', name: 'E2E Tree Leaf' }],
    });
    tempCat = await createCategory({
      slug: `${PREFIX}-temp`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E Temp Category' }],
    });
    inactiveCat = await createCategory({
      slug: `${PREFIX}-inactive`,
      status: 'INACTIVE',
      translations: [{ locale: 'en', name: 'E2E Inactive Category' }],
    });

    await createAttribute(reviewCat.id, {
      key: 'ram',
      label: 'RAM',
      type: 'INTEGER',
      required: true,
      filterable: true,
      minValue: 1,
      maxValue: 512,
    });
    const storage = await createAttribute(reviewCat.id, {
      key: 'storage',
      label: 'Storage',
      type: 'SELECT',
      filterable: true,
    });
    await request(server)
      .post(`/api/v1/admin/attributes/${storage.id}/options`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ value: '128', label: '128 GB' })
      .expect(201);
    await request(server)
      .post(`/api/v1/admin/attributes/${storage.id}/options`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ value: '64', label: '64 GB', isActive: false })
      .expect(201);

    provinceX = await createProvince(`XX-${CODE_BASE}`, 'E2E Listings Province');
    province2 = await createProvince(`XX-${CODE_BASE}2`, 'E2E Listings Province 2');
    cityX = await createCity(provinceX.id, `${PREFIX}-city`, 'E2E Listings City');
    city2 = await createCity(province2.id, `${PREFIX}-city-2`, 'E2E Listings City 2');

    sellerA = await registerUser('E2E Seller A');
    sellerB = await registerUser('E2E Seller B');
    sellerUnverified = await registerUser('E2E Seller Unverified');
    sellerPendingCap = await registerUser('E2E Seller Pending Cap');
    sellerActiveCap = await registerUser('E2E Seller Active Cap');
    sellerRateLimit = await registerUser('E2E Seller Rate Limit');
    for (const seller of [sellerA, sellerB, sellerPendingCap, sellerActiveCap, sellerRateLimit]) {
      await verifyPhone(seller.userId);
    }

    // Cap fixtures: sellerPendingCap starts with a full PENDING queue, and
    // sellerActiveCap with a full ACTIVE set plus one pending listing.
    await seedListings(
      await sellerAccountIdFor(sellerPendingCap.userId),
      'PENDING_REVIEW',
      10,
      reviewCat.id,
    );
    await seedListings(await sellerAccountIdFor(sellerActiveCap.userId), 'ACTIVE', 50, autoCat.id);
    await seedListings(
      await sellerAccountIdFor(sellerActiveCap.userId),
      'PENDING_REVIEW',
      1,
      reviewCat.id,
    );
  }

  // --- Creation & validation ------------------------------------------------------

  describe('creation & validation', () => {
    it('rejects anonymous callers with 401', async () => {
      const response = await request(server)
        .post('/api/v1/listings')
        .send(draftPayload())
        .expect(401);
      expect((response.body as ErrorEnvelope).error.code).toBe('UNAUTHORIZED');
    });

    it('creates a DRAFT with slug, version 1 and default pricing flags', async () => {
      const created = await draft(sellerA.token, {
        title: `${PREFIX} iPhone 13 Pro Max`,
        pricingType: undefined,
        currency: undefined,
      });
      expect(created.status).toBe('DRAFT');
      expect(created.version).toBe(1);
      expect(created.slug).toMatch(new RegExp(`^e2e-${RUN_ID}-iphone-13-pro-max-[0-9a-f]{6}$`));
      expect(created.price).toBe(45_000);
      expect(created.pricingType).toBe('PAID');
      expect(created.currency).toBe('AFN');
      expect(created.negotiable).toBe(true);
      expect(created.views).toBe(0);
      expect(created).not.toHaveProperty('searchText');
    });

    it('trims user text and validates configured title/description bounds', async () => {
      const created = await draft(sellerA.token, {
        title: `  ${PREFIX} Trimmed Title Here  `,
      });
      expect(created.title).toBe(`${PREFIX} Trimmed Title Here`);

      const shortTitle = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ title: 'too short' }))
        .expect(400);
      const titleError = (shortTitle.body as ErrorEnvelope).error;
      expect(titleError.code).toBe('VALIDATION_ERROR');
      expect(titleError.details?.errors?.some((issue) => issue.field === 'title')).toBe(true);

      const shortDescription = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ description: 'too short' }))
        .expect(400);
      expect(
        (shortDescription.body as ErrorEnvelope).error.details?.errors?.some(
          (issue) => issue.field === 'description',
        ),
      ).toBe(true);
    });

    it('rejects HTML markup and control characters in plain text fields', async () => {
      const html = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(
          draftPayload({
            title: `${PREFIX} <b>Deal</b> now`,
            description: `${PREFIX} Visit <script>alert(1)</script> for details about this item.`,
          }),
        )
        .expect(400);
      expect((html.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const control = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(
          draftPayload({
            title: `${PREFIX} Bad\u0000Title`,
          }),
        )
        .expect(400);
      expect((control.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('enforces pricing semantics for PAID, FREE and CONTACT', async () => {
      const paidMissing = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ price: null }))
        .expect(400);
      expect((paidMissing.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const paidZero = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ price: 0 }))
        .expect(400);
      expect((paidZero.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const freeWithPrice = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ pricingType: 'FREE', price: 100 }))
        .expect(400);
      expect((freeWithPrice.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const free = await draft(sellerA.token, { pricingType: 'FREE', price: null });
      expect(free.price).toBeNull();

      const contact = await draft(sellerA.token, { pricingType: 'CONTACT', price: null });
      expect(contact.price).toBeNull();
      expect(contact.pricingType).toBe('CONTACT');
    });

    it('rejects prices with more than two decimal places', async () => {
      const response = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ price: 10.999 }))
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('immunizes the payload against mass assignment (status/version/slug)', async () => {
      for (const extra of [
        { status: 'ACTIVE' },
        { version: 99 },
        { slug: 'hacked-slug' },
        { views: 10_000 },
      ]) {
        const response = await request(server)
          .post('/api/v1/listings')
          .set('authorization', `Bearer ${sellerA.token}`)
          .send(draftPayload(extra))
          .expect(400);
        expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('validates category usability', async () => {
      const notLeaf = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ categoryId: treeRoot.id }))
        .expect(400);
      expect((notLeaf.body as ErrorEnvelope).error.code).toBe('CATEGORY_NOT_LEAF');

      const leaf = await draft(sellerA.token, { categoryId: treeLeaf.id });
      expect(leaf.category.id).toBe(treeLeaf.id);

      const inactive = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ categoryId: inactiveCat.id }))
        .expect(422);
      expect((inactive.body as ErrorEnvelope).error.code).toBe('CATEGORY_INACTIVE');

      const missing = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ categoryId: randomUUID() }))
        .expect(404);
      expect((missing.body as ErrorEnvelope).error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('validates that the city belongs to the province and exists', async () => {
      const mismatch = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ provinceId: province2.id, cityId: cityX.id }))
        .expect(400);
      expect((mismatch.body as ErrorEnvelope).error.code).toBe('CITY_PROVINCE_MISMATCH');

      const missing = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ cityId: randomUUID() }))
        .expect(404);
      expect((missing.body as ErrorEnvelope).error.code).toBe('CITY_NOT_FOUND');

      const sameProvince = await draft(sellerA.token, {
        provinceId: province2.id,
        cityId: city2.id,
      });
      expect(sameProvince.city.id).toBe(city2.id);
    });

    it('validates dynamic attributes against the effective schema', async () => {
      const base = { categoryId: reviewCat.id, price: 5_000 };

      const missingRequired = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send(draftPayload({ ...base, attributes: {} }))
        .expect(400);
      expect((missingRequired.body as ErrorEnvelope).error.code).toBe('REQUIRED_ATTRIBUTE_MISSING');

      for (const attributes of [
        { ram: 'eight' },
        { ram: 0 },
        { ram: 8, bogus: 'x' },
        { ram: 8, storage: '64' },
      ]) {
        const response = await request(server)
          .post('/api/v1/listings')
          .set('authorization', `Bearer ${sellerA.token}`)
          .send(draftPayload({ ...base, attributes }))
          .expect(400);
        expect((response.body as ErrorEnvelope).error.code).toBe('INVALID_ATTRIBUTE_VALUE');
      }

      const valid = await draft(sellerA.token, {
        ...base,
        attributes: { ram: 8, storage: '128' },
      });
      expect(valid.attributes).toMatchObject({ ram: 8, storage: '128' });

      const revision = await request(server)
        .get(`/api/v1/listings/${valid.id}/revisions`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const reference = (revision.body as SuccessEnvelope<RevisionData[]>).data[0]
        .attributeSchemaReference;
      expect(reference?.map((entry) => entry.key).sort()).toEqual(['ram', 'storage']);
    });

    it('persists normalized searchText and keeps it out of API responses', async () => {
      const title = `${PREFIX} آيفون ١٢ پرو`;
      const description = `${PREFIX} توضیحات کامل برای آزمایش جستجوی فارسی و ارقام`;
      const created = await draft(sellerA.token, { title, description });
      expect(created).not.toHaveProperty('searchText');

      const row = await prisma.listing.findUnique({
        where: { id: created.id },
        select: { searchText: true },
      });
      expect(row?.searchText).toBe(normalizeSearchText(`${title}\n${description}`));
      expect(row?.searchText).toContain('12');
    });
  });

  // --- State machine ---------------------------------------------------------------

  describe('auto-approve lifecycle', () => {
    let listingId: string;

    it('creates a draft', async () => {
      const created = await draft(sellerA.token, {
        title: `${PREFIX} Auto Lifecycle Listing`,
      });
      listingId = created.id;
      expect(created.status).toBe('DRAFT');
    });

    it('publishes when submitted under AUTO_APPROVE (no body needed)', async () => {
      const response = await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const published = (response.body as SuccessEnvelope<OwnerListingData>).data;
      expect(published.status).toBe('ACTIVE');
      expect(published.version).toBe(2);
      expect(published.publishedAt).not.toBeNull();
      expect(published.expiresAt).not.toBeNull();

      const revisions = await request(server)
        .get(`/api/v1/listings/${listingId}/revisions`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const history = (revisions.body as SuccessEnvelope<RevisionData[]>).data;
      expect(history.map((revision) => revision.version)).toEqual([2, 1]);
      expect(history.map((revision) => revision.changeType)).toEqual(['SUBMIT', 'CREATE']);
      expect(history[0].snapshot.status).toBe('ACTIVE');
      expect(history[1].snapshot.status).toBe('DRAFT');
      expect(history[1].snapshot.price).toBe('45000');
    });

    it('extends the expiry runway on renew', async () => {
      const before = await request(server)
        .get(`/api/v1/me/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const previousExpiry = new Date(
        (before.body as SuccessEnvelope<OwnerListingData>).data.expiresAt!,
      );

      const response = await request(server)
        .post(`/api/v1/listings/${listingId}/renew`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      const renewed = (response.body as SuccessEnvelope<OwnerListingData>).data;
      expect(renewed.status).toBe('ACTIVE');
      expect(renewed.version).toBe(3);
      expect(new Date(renewed.expiresAt!).getTime()).toBeGreaterThan(previousExpiry.getTime());
    });

    it('marks the listing as sold and blocks every later transition', async () => {
      const sold = await request(server)
        .post(`/api/v1/listings/${listingId}/mark-sold`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      const soldData = (sold.body as SuccessEnvelope<OwnerListingData>).data;
      expect(soldData.status).toBe('SOLD');
      expect(soldData.soldAt).not.toBeNull();

      for (const command of ['submit', 'mark-sold', 'archive', 'renew']) {
        const response = await request(server)
          .post(`/api/v1/listings/${listingId}/${command}`)
          .set('authorization', `Bearer ${sellerA.token}`)
          .send({})
          .expect(409);
        expect((response.body as ErrorEnvelope).error.code).toBe('LISTING_INVALID_TRANSITION');
      }
    });
  });

  describe('archive & republish lifecycle', () => {
    let listingId: string;

    it('moves ACTIVE to ARCHIVED and hides it from edits', async () => {
      const created = await draft(sellerA.token, { title: `${PREFIX} Archive Flow Listing` });
      listingId = created.id;
      await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);

      const archived = await request(server)
        .post(`/api/v1/listings/${listingId}/archive`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      const data = (archived.body as SuccessEnvelope<OwnerListingData>).data;
      expect(data.status).toBe('ARCHIVED');
      expect(data.archivedAt).not.toBeNull();

      const edit = await request(server)
        .patch(`/api/v1/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ title: `${PREFIX} Cannot Edit Archived` })
        .expect(409);
      expect((edit.body as ErrorEnvelope).error.code).toBe('LISTING_EDIT_NOT_ALLOWED');
    });

    it('republishes ARCHIVED through renew (explicit republish flow)', async () => {
      const republished = await request(server)
        .post(`/api/v1/listings/${listingId}/renew`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      const data = (republished.body as SuccessEnvelope<OwnerListingData>).data;
      expect(data.status).toBe('DRAFT');
      expect(data.archivedAt).toBeNull();
      expect(data.expiresAt).toBeNull();

      const submitted = await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      expect((submitted.body as SuccessEnvelope<OwnerListingData>).data.status).toBe('ACTIVE');

      const revisions = await request(server)
        .get(`/api/v1/listings/${listingId}/revisions`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const changeTypes = (revisions.body as SuccessEnvelope<RevisionData[]>).data.map(
        (revision) => revision.changeType,
      );
      expect(changeTypes).toEqual(['SUBMIT', 'RESTORE', 'ARCHIVE', 'SUBMIT', 'CREATE']);
    });
  });

  describe('review lifecycle & moderation', () => {
    let listingId: string;

    it('creates a draft with required attributes', async () => {
      const created = await draft(sellerA.token, {
        title: `${PREFIX} Review Lifecycle Listing`,
        categoryId: reviewCat.id,
        attributes: { ram: 8 },
      });
      listingId = created.id;
      expect(created.status).toBe('DRAFT');
      expect(created.category.id).toBe(reviewCat.id);
    });

    it('rejects a stale expectedVersion without mutating', async () => {
      const response = await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ expectedVersion: 99 })
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('LISTING_VERSION_CONFLICT');

      const current = await request(server)
        .get(`/api/v1/me/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      expect((current.body as SuccessEnvelope<OwnerListingData>).data.status).toBe('DRAFT');
    });

    it('submits into PENDING_REVIEW without publishing', async () => {
      const response = await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ expectedVersion: 1 })
        .expect(200);
      const data = (response.body as SuccessEnvelope<OwnerListingData>).data;
      expect(data.status).toBe('PENDING_REVIEW');
      expect(data.publishedAt).toBeNull();
      expect(data.expiresAt).toBeNull();
    });

    it('blocks edits while pending review', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ negotiable: false })
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('LISTING_EDIT_NOT_ALLOWED');
    });

    it('approves through the moderation command (DI) and publishes', async () => {
      const approved = await listings.approve(adminUserId, listingId, 'en');
      expect(approved.status).toBe('ACTIVE');
      expect(approved.publishedAt).not.toBeNull();
      expect(approved.expiresAt).not.toBeNull();

      await expect(listings.approve(adminUserId, listingId, 'en')).rejects.toMatchObject({
        code: 'MODERATION_ACTION_NOT_ALLOWED',
      });
    });

    it('routes material edits of an ACTIVE listing back to PENDING_REVIEW', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ description: `${PREFIX} Updated material description for re-review flow.` })
        .expect(200);
      const data = (response.body as SuccessEnvelope<OwnerListingData>).data;
      expect(data.status).toBe('PENDING_REVIEW');
      expect(data.version).toBe(4);
    });

    it('rejects through the moderation command with a reason', async () => {
      await expect(
        listings.reject(adminUserId, listingId, { reason: 'x'.repeat(65) }, 'en'),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

      const rejected = await listings.reject(
        adminUserId,
        listingId,
        { reason: 'SPAM', note: 'Duplicate of another listing.' },
        'en',
      );
      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectedReason).toBe('SPAM');
      expect(rejected.rejectedNote).toBe('Duplicate of another listing.');
    });

    it('returns an edited rejection to DRAFT and clears the stale reason', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ title: `${PREFIX} Resubmitted Review Listing` })
        .expect(200);
      const data = (response.body as SuccessEnvelope<OwnerListingData>).data;
      expect(data.status).toBe('DRAFT');
      expect(data.rejectedReason).toBeNull();
      expect(data.rejectedNote).toBeNull();

      const resubmitted = await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      expect((resubmitted.body as SuccessEnvelope<OwnerListingData>).data.status).toBe(
        'PENDING_REVIEW',
      );
    });

    it('revalidates fresh state on submit (deactivated category)', async () => {
      const created = await draft(sellerA.token, {
        title: `${PREFIX} Temp Category Listing`,
        categoryId: tempCat.id,
      });
      await request(server)
        .patch(`/api/v1/admin/categories/${tempCat.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      const response = await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(422);
      expect((response.body as ErrorEnvelope).error.code).toBe('CATEGORY_INACTIVE');
    });
  });

  // --- Versioning & concurrency -----------------------------------------------------

  describe('versioning & concurrency', () => {
    it('rejects stale expectedVersion on updates', async () => {
      const created = await draft(sellerA.token, { title: `${PREFIX} Version Guard Listing` });

      const stale = await request(server)
        .patch(`/api/v1/listings/${created.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ negotiable: false, expectedVersion: 1 })
        .expect(200);
      expect((stale.body as SuccessEnvelope<OwnerListingData>).data.version).toBe(2);

      const conflict = await request(server)
        .patch(`/api/v1/listings/${created.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({ title: `${PREFIX} Stale Update Attempt`, expectedVersion: 1 })
        .expect(409);
      expect((conflict.body as ErrorEnvelope).error.code).toBe('LISTING_VERSION_CONFLICT');
    });

    it('resolves racing updates with exactly one winner', async () => {
      const created = await draft(sellerA.token, { title: `${PREFIX} Race Listing` });

      const results = await Promise.all(
        [
          request(server)
            .patch(`/api/v1/listings/${created.id}`)
            .set('authorization', `Bearer ${sellerA.token}`)
            .send({ negotiable: false, expectedVersion: 1 }),
          request(server)
            .patch(`/api/v1/listings/${created.id}`)
            .set('authorization', `Bearer ${sellerA.token}`)
            .send({ negotiable: true, expectedVersion: 1 }),
        ].map((call) => call.then((response) => response.status)),
      );
      expect(results.sort()).toEqual([200, 409]);

      const row = await prisma.listing.findUnique({
        where: { id: created.id },
        select: { version: true },
      });
      expect(row?.version).toBe(2);
    });
  });

  // --- Ownership (IDOR) ---------------------------------------------------------------

  describe('ownership', () => {
    let listingId: string;

    beforeAll(async () => {
      const created = await draft(sellerA.token, { title: `${PREFIX} Ownership Listing` });
      listingId = created.id;
    });

    it('denies cross-seller reads and commands with LISTING_NOT_OWNED', async () => {
      await request(server)
        .get(`/api/v1/me/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(403);
      await request(server)
        .patch(`/api/v1/listings/${listingId}`)
        .set('authorization', `Bearer ${sellerB.token}`)
        .send({ negotiable: false })
        .expect(403);
      await request(server)
        .post(`/api/v1/listings/${listingId}/submit`)
        .set('authorization', `Bearer ${sellerB.token}`)
        .send({})
        .expect(403);
      const revisions = await request(server)
        .get(`/api/v1/listings/${listingId}/revisions`)
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(403);
      expect((revisions.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_OWNED');
    });

    it('requires authentication', async () => {
      await request(server).get(`/api/v1/me/listings/${listingId}`).expect(401);
    });

    it('reports unknown ids as not found and malformed ids as validation errors', async () => {
      const missing = await request(server)
        .get(`/api/v1/me/listings/${randomUUID()}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(404);
      expect((missing.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_FOUND');

      await request(server)
        .get('/api/v1/me/listings/not-a-uuid')
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(400);
    });
  });

  // --- Publish gates & limits ----------------------------------------------------------

  describe('publish gates & limits', () => {
    it('requires a verified phone before publishing', async () => {
      const created = await draft(sellerUnverified.token, {
        title: `${PREFIX} Unverified Phone Listing`,
      });

      const blocked = await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerUnverified.token}`)
        .send({})
        .expect(403);
      expect((blocked.body as ErrorEnvelope).error.code).toBe('PHONE_NOT_VERIFIED');

      await verifyPhone(sellerUnverified.userId);
      const published = await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerUnverified.token}`)
        .send({})
        .expect(200);
      expect((published.body as SuccessEnvelope<OwnerListingData>).data.status).toBe('ACTIVE');
    });

    it('enforces the pending-review queue cap', async () => {
      const created = await draft(sellerPendingCap.token, {
        title: `${PREFIX} Pending Cap Listing`,
        categoryId: reviewCat.id,
        attributes: { ram: 4 },
      });

      const response = await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerPendingCap.token}`)
        .send({})
        .expect(409);
      const error = (response.body as ErrorEnvelope).error;
      expect(error.code).toBe('LISTING_LIMIT_REACHED');
      expect(error.details?.scope).toBe('PENDING_REVIEW');
    });

    it('enforces the active-listing cap on submit and on approval (DI)', async () => {
      const created = await draft(sellerActiveCap.token, {
        title: `${PREFIX} Active Cap Listing`,
      });
      const submit = await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerActiveCap.token}`)
        .send({})
        .expect(409);
      const submitError = (submit.body as ErrorEnvelope).error;
      expect(submitError.code).toBe('LISTING_LIMIT_REACHED');
      expect(submitError.details?.scope).toBe('ACTIVE');

      const sellerAccountId = await sellerAccountIdFor(sellerActiveCap.userId);
      const pending = await prisma.listing.findFirst({
        where: { sellerAccountId, status: 'PENDING_REVIEW' },
        select: { id: true },
      });
      await expect(listings.approve(adminUserId, pending!.id, 'en')).rejects.toMatchObject({
        code: 'LISTING_LIMIT_REACHED',
      });
    });

    it('rate limits listing creation per user', async () => {
      for (let index = 0; index < 20; index += 1) {
        await request(server)
          .post('/api/v1/listings')
          .set('authorization', `Bearer ${sellerRateLimit.token}`)
          .send(draftPayload({ title: `${PREFIX} Rate Limited ${index}` }))
          .expect(201);
      }
      const blocked = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerRateLimit.token}`)
        .send(draftPayload({ title: `${PREFIX} Rate Limited Overflow` }))
        .expect(429);
      expect((blocked.body as ErrorEnvelope).error.code).toBe('RATE_LIMITED');
    });
  });

  // --- Owner feed -----------------------------------------------------------------------

  describe('GET /me/listings', () => {
    const ids: string[] = [];

    beforeAll(async () => {
      for (const suffix of ['One', 'Two', 'Three']) {
        const created = await draft(sellerB.token, {
          title: `${PREFIX} Pagination ${suffix}`,
        });
        ids.push(created.id);
      }
    });

    it('returns only the caller listings, newest first', async () => {
      const response = await request(server)
        .get('/api/v1/me/listings?limit=60')
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(200);
      const body = response.body as SuccessEnvelope<Array<{ id: string }>>;
      const returnedIds = body.data.map((listing) => listing.id);
      for (const id of ids) {
        expect(returnedIds).toContain(id);
      }
      expect(returnedIds.length).toBe(ids.length);
    });

    it('paginates with a stable cursor', async () => {
      const first = await request(server)
        .get('/api/v1/me/listings?limit=2')
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(200);
      const firstBody = first.body as SuccessEnvelope<Array<{ id: string }>>;
      expect(firstBody.data).toHaveLength(2);
      expect(firstBody.meta?.hasMore).toBe(true);
      expect(firstBody.meta?.nextCursor).not.toBeNull();

      const second = await request(server)
        .get(
          `/api/v1/me/listings?limit=2&cursor=${encodeURIComponent(firstBody.meta!.nextCursor!)}`,
        )
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(200);
      const secondBody = second.body as SuccessEnvelope<Array<{ id: string }>>;
      expect(secondBody.data).toHaveLength(1);
      expect(secondBody.meta?.hasMore).toBe(false);
      expect(
        [...new Set([...firstBody.data, ...secondBody.data].map((row) => row.id))].length,
      ).toBe(ids.length);
    });

    it('filters by lifecycle status', async () => {
      const drafts = await request(server)
        .get('/api/v1/me/listings?status=DRAFT')
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(200);
      expect((drafts.body as SuccessEnvelope<unknown[]>).data).toHaveLength(ids.length);

      const active = await request(server)
        .get('/api/v1/me/listings?status=ACTIVE')
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(200);
      expect((active.body as SuccessEnvelope<unknown[]>).data).toHaveLength(0);
    });

    it('rejects malformed cursors and status filters', async () => {
      const cursor = await request(server)
        .get('/api/v1/me/listings?cursor=not-a-valid-cursor')
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(400);
      expect((cursor.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      await request(server)
        .get('/api/v1/me/listings?status=WHATEVER')
        .set('authorization', `Bearer ${sellerB.token}`)
        .expect(400);
    });
  });

  // --- Revision pagination ----------------------------------------------------------------

  describe('revision history pagination', () => {
    it('pages through revisions newest-first with version cursors', async () => {
      const created = await draft(sellerA.token, { title: `${PREFIX} Revision Paging Listing` });
      await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      await request(server)
        .post(`/api/v1/listings/${created.id}/mark-sold`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);

      const first = await request(server)
        .get(`/api/v1/listings/${created.id}/revisions?limit=2`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const firstBody = first.body as SuccessEnvelope<RevisionData[]>;
      expect(firstBody.data.map((revision) => revision.version)).toEqual([3, 2]);
      expect(firstBody.meta?.hasMore).toBe(true);

      const second = await request(server)
        .get(
          `/api/v1/listings/${created.id}/revisions?limit=2&cursor=${encodeURIComponent(firstBody.meta!.nextCursor!)}`,
        )
        .set('authorization', `Bearer ${sellerA.token}`)
        .expect(200);
      const secondBody = second.body as SuccessEnvelope<RevisionData[]>;
      expect(secondBody.data.map((revision) => revision.version)).toEqual([1]);
      expect(secondBody.data[0].changeType).toBe('CREATE');
      expect(secondBody.meta?.hasMore).toBe(false);
    });
  });
});
