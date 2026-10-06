/**
 * Engagement e2e (Phase 10) — boots the real application (test database) and
 * covers spec §53–§57, §42, §72 and §160:
 *
 *  - contact configuration on create/update: defaults, overrides, Telegram
 *    handle validation, replacement semantics, material-change re-review
 *  - the anonymous contact action: active-listing/seller/visibility gates,
 *    method resolution (fallback vs override vs disabled), sanitized payload,
 *    click analytics and the per-IP rate limit
 *  - favorites: auth, duplicate 409 backed by the unique constraint, guarded
 *    favoriteCount counter, 204 removal, favoriteAdds analytics, the
 *    visibility-aware /me/favorites feed with cursor pagination
 *  - reports: auth + fresh verified-phone gate, own-listing rejection,
 *    duplicate-open 409 backed by the partial unique index, description
 *    limits, SOLD reportability, report analytics and the per-user rate limit
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

const PASSWORD = 'S3cure!Pass';
const RUN_ID = randomInt(0x100000, 0xffffff).toString(16);
const PREFIX = `e2e-p10-${RUN_ID}`;
const CODE_BASE = RUN_ID.slice(0, 4).toUpperCase();
const DESCRIPTION = `${PREFIX} Engagement fixture listing maintained carefully with accessories.`;

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
      retryAfterSeconds?: number;
    };
  };
  requestId: string;
}

interface RefData {
  id: string;
  slug: string;
  name: string;
}

interface ContactMethodData {
  type: string;
  enabled: boolean;
  valueOverride: string | null;
}

interface OwnerListingData {
  id: string;
  slug: string;
  status: string;
  version: number;
  price: number | null;
  contactMethods: ContactMethodData[];
}

interface ContactTargetData {
  method: string;
  value: string;
}

interface FavoriteItemData {
  favoritedAt: string;
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number | null;
    currency: string;
    status: string;
    category: RefData;
    primaryImage: unknown;
  };
}

interface ReportData {
  id: string;
  listingId: string | null;
  reportedUserId: string | null;
  reason: string;
  description: string | null;
  status: string;
  resolvedAt: string | null;
  createdAt: string;
}

interface UserFixture {
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

describe('Contacts, favorites and reports (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let rateLimitService: RateLimitService;
  let listings: ListingsService;

  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];

  let adminToken: string;
  let adminUserId: string;
  let sellerA: UserFixture;
  let sellerSuspended: UserFixture;
  let buyer: UserFixture;
  let buyer2: UserFixture;
  let buyerLadder: UserFixture;
  let unverifiedBuyer: UserFixture;

  let autoCat: { id: string; slug: string };
  let reviewCat: { id: string; slug: string };
  let provinceP: { id: string; slug: string };
  let cityP: { id: string; slug: string };

  let sellerPhoneNormalized: string;
  let sellerAccountAId: string;

  let lContactDefault: FixtureListing;
  let lContactCustom: FixtureListing;
  let lMutable: FixtureListing;
  let lDraft: FixtureListing;
  let lSold: FixtureListing;
  let lSuspended: FixtureListing;
  let lCounter: FixtureListing;
  let lReported: FixtureListing;
  let lFav1: FixtureListing;
  let lFav2: FixtureListing;
  let lFav3: FixtureListing;
  let lFavSold: FixtureListing;
  let lFavArchived: FixtureListing;
  let reportLimitListings: string[];

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
    listings = app.get(ListingsService);

    const admin = await createAdminToken();
    adminToken = admin.token;
    adminUserId = admin.userId;

    autoCat = await createCategory({
      slug: `${PREFIX}-auto`,
      moderationMode: 'AUTO_APPROVE',
      translations: [{ locale: 'en', name: 'E2E P10 Auto Category' }],
    });
    reviewCat = await createCategory({
      slug: `${PREFIX}-review`,
      translations: [{ locale: 'en', name: 'E2E P10 Review Category' }],
    });
    provinceP = await createProvince(`XX-${CODE_BASE}`, 'E2E P10 Province');
    cityP = await createCity(provinceP.id, `${PREFIX}-city`, 'E2E P10 City');

    sellerA = await registerUser('E2E P10 Seller A', true);
    sellerSuspended = await registerUser('E2E P10 Seller Suspended', true);
    buyer = await registerUser('E2E P10 Buyer', true);
    buyer2 = await registerUser('E2E P10 Buyer Two', true);
    buyerLadder = await registerUser('E2E P10 Buyer Ladder', true);
    unverifiedBuyer = await registerUser('E2E P10 Buyer Unverified', false);

    const sellerUserA = await prisma.user.findUniqueOrThrow({
      where: { id: sellerA.userId },
      select: { phoneNormalized: true },
    });
    sellerPhoneNormalized = sellerUserA.phoneNormalized;

    lContactDefault = await publish(sellerA.token);
    lContactCustom = await publish(sellerA.token, {
      contactMethods: [
        { type: 'PHONE', valueOverride: '0701234567' },
        { type: 'WHATSAPP', enabled: false },
        { type: 'TELEGRAM', valueOverride: 'weshbazar' },
      ],
    });
    lMutable = await publish(sellerA.token);
    const draftOnly = await draft(sellerA.token);
    lDraft = { id: draftOnly.id, slug: draftOnly.slug, version: draftOnly.version };
    lSold = await publish(sellerA.token);
    await markSold(sellerA.token, lSold);
    lCounter = await publish(sellerA.token);
    lReported = await publish(sellerA.token);
    lFav1 = await publish(sellerA.token);
    lFav2 = await publish(sellerA.token);
    lFav3 = await publish(sellerA.token);
    lFavSold = await publish(sellerA.token);
    lFavArchived = await publish(sellerA.token);

    // A suspended seller's listing stays ACTIVE in the row, but every public
    // surface (contact included) must hide it as LISTING_NOT_FOUND.
    lSuspended = await publish(sellerSuspended.token);
    await prisma.sellerAccount.update({
      where: { ownerUserId: sellerSuspended.userId },
      data: { status: 'SUSPENDED' },
    });

    sellerAccountAId = (
      await prisma.sellerAccount.findUniqueOrThrow({
        where: { ownerUserId: sellerA.userId },
        select: { id: true },
      })
    ).id;

    // Ten extra ACTIVE listings for the report rate-limit walk (seeded
    // directly — the limit is about submissions, not fixture creation).
    await prisma.listing.createMany({
      data: Array.from({ length: 10 }, (_, index) => ({
        sellerAccountId: sellerAccountAId,
        categoryId: autoCat.id,
        provinceId: provinceP.id,
        cityId: cityP.id,
        slug: `${PREFIX}-rl-${index}`,
        title: `${PREFIX} Rate limit listing ${index}`,
        description: DESCRIPTION,
        condition: 'GOOD' as const,
        status: 'ACTIVE' as const,
      })),
    });
    const seeded = await prisma.listing.findMany({
      where: { slug: { startsWith: `${PREFIX}-rl-` } },
      select: { id: true },
      orderBy: { slug: 'asc' },
    });
    reportLimitListings = seeded.map((row) => row.id);
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
    // Reporter FK is Restrict — reports must go before their authors.
    await prisma.report.deleteMany({
      where: {
        OR: [{ reporterUserId: { in: createdUserIds } }, { listingId: { in: createdListingIds } }],
      },
    });
    await prisma.listing.deleteMany({ where: { sellerAccountId: { in: sellerAccountIds } } });
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

  async function registerUser(displayName: string, verify: boolean): Promise<UserFixture> {
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
    if (verify) {
      await prisma.user.update({
        where: { id: body.data.user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }
    return { userId: body.data.user.id, token: body.data.tokens.accessToken };
  }

  async function createAdminToken(): Promise<{ token: string; userId: string }> {
    rateLimitService.reset();
    const phone = uniquePhone();
    const register = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone, password: PASSWORD, displayName: 'E2E P10 Admin' })
      .expect(201);
    const registered = register.body as SuccessEnvelope<{ user: { id: string } }>;
    const userId = registered.data.user.id;
    createdUserIds.push(userId);
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN', phoneVerifiedAt: new Date() },
    });
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

  async function createCategory(payload: Record<string, unknown>): Promise<{
    id: string;
    slug: string;
  }> {
    const response = await request(server)
      .post('/api/v1/admin/categories')
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<{ id: string; slug: string }>).data;
  }

  async function createProvince(code: string, name: string): Promise<{ id: string; slug: string }> {
    const response = await request(server)
      .post('/api/v1/admin/provinces')
      .set('authorization', `Bearer ${adminToken}`)
      .send({ code, translations: [{ locale: 'en', name }] })
      .expect(201);
    return (response.body as SuccessEnvelope<{ id: string; slug: string }>).data;
  }

  async function createCity(
    provinceId: string,
    slug: string,
    name: string,
  ): Promise<{ id: string; slug: string }> {
    const response = await request(server)
      .post(`/api/v1/admin/provinces/${provinceId}/cities`)
      .set('authorization', `Bearer ${adminToken}`)
      .send({ slug, translations: [{ locale: 'en', name }] })
      .expect(201);
    return (response.body as SuccessEnvelope<{ id: string; slug: string }>).data;
  }

  async function draft(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<OwnerListingData> {
    const response = await request(server)
      .post('/api/v1/listings')
      .set('authorization', `Bearer ${token}`)
      .send({
        title: `${PREFIX} Engagement Draft`,
        description: DESCRIPTION,
        categoryId: autoCat.id,
        provinceId: provinceP.id,
        cityId: cityP.id,
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
  ): Promise<FixtureListing> {
    const created = await draft(token, overrides);
    const response = await request(server)
      .post(`/api/v1/listings/${created.id}/submit`)
      .set('authorization', `Bearer ${token}`)
      .send({})
      .expect(200);
    const owner = (response.body as SuccessEnvelope<OwnerListingData>).data;
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

  async function reveal(
    listingId: string,
    method: string,
    expectedStatus = 200,
  ): Promise<SuccessEnvelope<ContactTargetData> | ErrorEnvelope> {
    const response = await request(server)
      .post(`/api/v1/listings/${listingId}/contact`)
      .send({ method })
      .expect(expectedStatus);
    return response.body as SuccessEnvelope<ContactTargetData> | ErrorEnvelope;
  }

  async function saveFavorite(user: UserFixture, listingId: string): Promise<void> {
    await request(server)
      .post(`/api/v1/favorites/${listingId}`)
      .set('authorization', `Bearer ${user.token}`)
      .expect(201);
  }

  async function favoritesFeed(
    user: UserFixture,
    query = '',
  ): Promise<SuccessEnvelope<FavoriteItemData[]>> {
    const response = await request(server)
      .get(`/api/v1/me/favorites${query}`)
      .set('authorization', `Bearer ${user.token}`)
      .expect(200);
    return response.body as SuccessEnvelope<FavoriteItemData[]>;
  }

  async function report(
    user: UserFixture,
    listingId: string,
    body: Record<string, unknown>,
    expectedStatus = 201,
  ): Promise<SuccessEnvelope<ReportData> | ErrorEnvelope> {
    const response = await request(server)
      .post(`/api/v1/listings/${listingId}/reports`)
      .set('authorization', `Bearer ${user.token}`)
      .send(body)
      .expect(expectedStatus);
    return response.body as SuccessEnvelope<ReportData> | ErrorEnvelope;
  }

  async function getOwnerListing(listingId: string): Promise<OwnerListingData> {
    const response = await request(server)
      .get(`/api/v1/me/listings/${listingId}`)
      .set('authorization', `Bearer ${sellerA.token}`)
      .expect(200);
    return (response.body as SuccessEnvelope<OwnerListingData>).data;
  }

  // --- Contact action (spec §54) -------------------------------------------------

  describe('contact action', () => {
    it('reveals the seller phone for default PHONE and WHATSAPP methods without auth', async () => {
      const phone = (await reveal(
        lContactDefault.id,
        'PHONE',
      )) as SuccessEnvelope<ContactTargetData>;
      expect(phone.data).toEqual({ method: 'PHONE', value: sellerPhoneNormalized });

      const whatsapp = (await reveal(
        lContactDefault.id,
        'WHATSAPP',
      )) as SuccessEnvelope<ContactTargetData>;
      expect(whatsapp.data).toEqual({ method: 'WHATSAPP', value: sellerPhoneNormalized });

      // §72: each click lands in today's (UTC) analytic row.
      const stat = await prisma.listingDailyStat.findFirst({
        where: { listingId: lContactDefault.id },
      });
      expect(stat?.phoneClicks).toBe(1);
      expect(stat?.whatsappClicks).toBe(1);
    });

    it('prefers overrides, respects disabled rows and canonicalizes Telegram handles', async () => {
      const phone = (await reveal(
        lContactCustom.id,
        'PHONE',
      )) as SuccessEnvelope<ContactTargetData>;
      expect(phone.data.value).toBe('+93701234567');

      const disabled = (await reveal(lContactCustom.id, 'WHATSAPP', 404)) as ErrorEnvelope;
      expect(disabled.error.code).toBe('CONTACT_METHOD_NOT_FOUND');

      const telegram = (await reveal(
        lContactCustom.id,
        'TELEGRAM',
      )) as SuccessEnvelope<ContactTargetData>;
      expect(telegram.data.value).toBe('@weshbazar');
    });

    it('answers CONTACT_METHOD_NOT_FOUND for methods that are not configured', async () => {
      const response = (await reveal(lContactDefault.id, 'TELEGRAM', 404)) as ErrorEnvelope;
      expect(response.error.code).toBe('CONTACT_METHOD_NOT_FOUND');
    });

    it('rejects non-active listings with LISTING_NOT_ACTIVE', async () => {
      const draftResponse = (await reveal(lDraft.id, 'PHONE', 409)) as ErrorEnvelope;
      expect(draftResponse.error.code).toBe('LISTING_NOT_ACTIVE');

      const soldResponse = (await reveal(lSold.id, 'PHONE', 409)) as ErrorEnvelope;
      expect(soldResponse.error.code).toBe('LISTING_NOT_ACTIVE');
    });

    it('hides listings of suspended sellers as LISTING_NOT_FOUND', async () => {
      const response = (await reveal(lSuspended.id, 'PHONE', 404)) as ErrorEnvelope;
      expect(response.error.code).toBe('LISTING_NOT_FOUND');
    });

    it('answers LISTING_NOT_FOUND for unknown ids', async () => {
      const response = (await reveal(randomUUID(), 'PHONE', 404)) as ErrorEnvelope;
      expect(response.error.code).toBe('LISTING_NOT_FOUND');
    });

    it('validates the method payload and the id parameter', async () => {
      const invalidMethod = await request(server)
        .post(`/api/v1/listings/${lContactDefault.id}/contact`)
        .send({ method: 'SIGNAL' })
        .expect(400);
      expect((invalidMethod.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const missingMethod = await request(server)
        .post(`/api/v1/listings/${lContactDefault.id}/contact`)
        .send({})
        .expect(400);
      expect((missingMethod.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      await request(server)
        .post('/api/v1/listings/not-a-uuid/contact')
        .send({ method: 'PHONE' })
        .expect(400);
    });
  });

  // --- Contact configuration (§53, §42) -----------------------------------------

  describe('contact configuration', () => {
    it('creates drafts with the default PHONE + WHATSAPP configuration', async () => {
      const owner = await getOwnerListing(lContactDefault.id);
      expect(owner.contactMethods).toEqual([
        { type: 'PHONE', enabled: true, valueOverride: null },
        { type: 'WHATSAPP', enabled: true, valueOverride: null },
      ]);
    });

    it('stores normalized overrides and disabled rows from the create payload', async () => {
      const owner = await getOwnerListing(lContactCustom.id);
      expect(owner.contactMethods).toEqual([
        { type: 'PHONE', enabled: true, valueOverride: '+93701234567' },
        { type: 'WHATSAPP', enabled: false, valueOverride: null },
        { type: 'TELEGRAM', enabled: true, valueOverride: '@weshbazar' },
      ]);
    });

    it('rejects invalid configurations with field-level details', async () => {
      const missingHandle = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({
          title: `${PREFIX} Bad contact draft`,
          description: DESCRIPTION,
          categoryId: autoCat.id,
          provinceId: provinceP.id,
          cityId: cityP.id,
          condition: 'GOOD',
          pricingType: 'PAID',
          price: 1_000,
          contactMethods: [{ type: 'TELEGRAM' }],
        })
        .expect(400);
      const missingHandleBody = missingHandle.body as ErrorEnvelope;
      expect(missingHandleBody.error.code).toBe('VALIDATION_ERROR');
      expect(missingHandleBody.error.details?.errors?.[0]?.field).toBe('contactMethods.TELEGRAM');

      const tooMany = await request(server)
        .post('/api/v1/listings')
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({
          title: `${PREFIX} Too many methods`,
          description: DESCRIPTION,
          categoryId: autoCat.id,
          provinceId: provinceP.id,
          cityId: cityP.id,
          condition: 'GOOD',
          pricingType: 'PAID',
          price: 1_000,
          contactMethods: [
            { type: 'PHONE' },
            { type: 'WHATSAPP' },
            { type: 'TELEGRAM', valueOverride: '@weshbazar' },
            { type: 'TELEGRAM', valueOverride: '@weshbazar' },
          ],
        })
        .expect(400);
      expect((tooMany.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('replaces the stored configuration on update and revalidates the replacement', async () => {
      const response = await request(server)
        .patch(`/api/v1/listings/${lMutable.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({
          expectedVersion: lMutable.version,
          contactMethods: [{ type: 'TELEGRAM', valueOverride: 'mutable_handle' }],
        })
        .expect(200);
      const patched = (response.body as SuccessEnvelope<OwnerListingData>).data;
      expect(patched.version).toBe(lMutable.version + 1);
      expect(patched.contactMethods).toEqual([
        { type: 'TELEGRAM', enabled: true, valueOverride: '@mutable_handle' },
      ]);

      // The old PHONE row is gone; the new Telegram row resolves.
      const removed = (await reveal(lMutable.id, 'PHONE', 404)) as ErrorEnvelope;
      expect(removed.error.code).toBe('CONTACT_METHOD_NOT_FOUND');
      const telegram = (await reveal(
        lMutable.id,
        'TELEGRAM',
      )) as SuccessEnvelope<ContactTargetData>;
      expect(telegram.data.value).toBe('@mutable_handle');

      // An invalid replacement fails before any write.
      const invalid = await request(server)
        .patch(`/api/v1/listings/${lMutable.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({
          expectedVersion: patched.version,
          contactMethods: [{ type: 'PHONE', valueOverride: 'not-a-number' }],
        })
        .expect(400);
      expect((invalid.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const unchanged = await getOwnerListing(lMutable.id);
      expect(unchanged.version).toBe(patched.version);
      expect(unchanged.contactMethods).toEqual([
        { type: 'TELEGRAM', enabled: true, valueOverride: '@mutable_handle' },
      ]);
    });
  });

  // --- Favorites (spec §55, §110) -------------------------------------------------

  describe('favorites', () => {
    it('requires authentication on every favorites route', async () => {
      await request(server).post(`/api/v1/favorites/${lCounter.id}`).expect(401);
      await request(server).delete(`/api/v1/favorites/${lCounter.id}`).expect(401);
      await request(server).get('/api/v1/me/favorites').expect(401);
    });

    it('saves, rejects duplicates and removes with consistent counters and analytics', async () => {
      const saved = await request(server)
        .post(`/api/v1/favorites/${lCounter.id}`)
        .set('authorization', `Bearer ${buyer.token}`)
        .expect(201);
      const savedBody = saved.body as SuccessEnvelope<{ listingId: string; favoritedAt: string }>;
      expect(savedBody.data.listingId).toBe(lCounter.id);
      expect(Number.isNaN(new Date(savedBody.data.favoritedAt).getTime())).toBe(false);

      const afterSave = await prisma.listing.findUniqueOrThrow({
        where: { id: lCounter.id },
        select: { favoriteCount: true },
      });
      expect(afterSave.favoriteCount).toBe(1);
      const stat = await prisma.listingDailyStat.findFirst({
        where: { listingId: lCounter.id },
      });
      expect(stat?.favoriteAdds).toBe(1);

      // Duplicate protection is the unique constraint, not a pre-check.
      const duplicate = await request(server)
        .post(`/api/v1/favorites/${lCounter.id}`)
        .set('authorization', `Bearer ${buyer.token}`)
        .expect(409);
      expect((duplicate.body as ErrorEnvelope).error.code).toBe('FAVORITE_ALREADY_EXISTS');
      const afterDuplicate = await prisma.listing.findUniqueOrThrow({
        where: { id: lCounter.id },
        select: { favoriteCount: true },
      });
      expect(afterDuplicate.favoriteCount).toBe(1);

      await request(server)
        .delete(`/api/v1/favorites/${lCounter.id}`)
        .set('authorization', `Bearer ${buyer.token}`)
        .expect(204);

      const repeat = await request(server)
        .delete(`/api/v1/favorites/${lCounter.id}`)
        .set('authorization', `Bearer ${buyer.token}`)
        .expect(404);
      expect((repeat.body as ErrorEnvelope).error.code).toBe('FAVORITE_NOT_FOUND');

      const afterRemove = await prisma.listing.findUniqueOrThrow({
        where: { id: lCounter.id },
        select: { favoriteCount: true },
      });
      expect(afterRemove.favoriteCount).toBe(0);
    });

    it('renders saved listings with the public card shape', async () => {
      await saveFavorite(buyer2, lReported.id);

      const page = await favoritesFeed(buyer2);
      expect(page.data).toHaveLength(1);
      const item = page.data[0];
      expect(item.listing.id).toBe(lReported.id);
      expect(item.listing.slug).toBe(lReported.slug);
      expect(item.listing.status).toBe('ACTIVE');
      expect(item.listing.price).toBe(45_000);
      expect(item.listing.currency).toBe('AFN');
      expect(item.listing.category.id).toBe(autoCat.id);
      expect(item.listing.category.name).toBe('E2E P10 Auto Category');
      expect(Number.isNaN(new Date(item.favoritedAt).getTime())).toBe(false);
      expect(page.meta?.hasMore).toBe(false);
    });

    it('keeps SOLD entries but drops archived ones from the feed', async () => {
      await saveFavorite(buyer, lFavSold.id);
      await saveFavorite(buyer, lFavArchived.id);
      await markSold(sellerA.token, lFavSold);
      await archive(sellerA.token, lFavArchived);

      const page = await favoritesFeed(buyer);
      expect(page.data.map((entry) => entry.listing.slug)).toEqual([lFavSold.slug]);
      expect(page.data[0].listing.status).toBe('SOLD');
    });

    it('paginates the feed newest-first with a stable keyset cursor', async () => {
      await saveFavorite(buyerLadder, lFav1.id);
      await saveFavorite(buyerLadder, lFav2.id);
      await saveFavorite(buyerLadder, lFav3.id);
      // Distinct, ordered save times make the cursor deterministic.
      const savedAt = [
        { listingId: lFav1.id, createdAt: '2026-06-01T00:00:00.000Z' },
        { listingId: lFav2.id, createdAt: '2026-06-02T00:00:00.000Z' },
        { listingId: lFav3.id, createdAt: '2026-06-03T00:00:00.000Z' },
      ];
      for (const entry of savedAt) {
        await prisma.favorite.update({
          where: {
            userId_listingId: { userId: buyerLadder.userId, listingId: entry.listingId },
          },
          data: { createdAt: new Date(entry.createdAt) },
        });
      }

      const first = await favoritesFeed(buyerLadder, '?limit=2');
      expect(first.data.map((entry) => entry.listing.id)).toEqual([lFav3.id, lFav2.id]);
      expect(first.meta?.hasMore).toBe(true);
      const cursor = first.meta?.nextCursor ?? '';
      expect(typeof cursor).toBe('string');

      const second = await favoritesFeed(
        buyerLadder,
        `?limit=2&cursor=${encodeURIComponent(cursor)}`,
      );
      expect(second.data.map((entry) => entry.listing.id)).toEqual([lFav1.id]);
      expect(second.meta?.hasMore).toBe(false);
      expect(second.meta?.nextCursor).toBeNull();
    });

    it('rejects saving listings that are not publicly ACTIVE', async () => {
      const draftListing = await request(server)
        .post(`/api/v1/favorites/${lDraft.id}`)
        .set('authorization', `Bearer ${buyer2.token}`)
        .expect(409);
      expect((draftListing.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_ACTIVE');

      const soldListing = await request(server)
        .post(`/api/v1/favorites/${lSold.id}`)
        .set('authorization', `Bearer ${buyer2.token}`)
        .expect(409);
      expect((soldListing.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_ACTIVE');

      const suspendedListing = await request(server)
        .post(`/api/v1/favorites/${lSuspended.id}`)
        .set('authorization', `Bearer ${buyer2.token}`)
        .expect(404);
      expect((suspendedListing.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_FOUND');

      const unknownListing = await request(server)
        .post(`/api/v1/favorites/${randomUUID()}`)
        .set('authorization', `Bearer ${buyer2.token}`)
        .expect(404);
      expect((unknownListing.body as ErrorEnvelope).error.code).toBe('LISTING_NOT_FOUND');

      await request(server)
        .post('/api/v1/favorites/not-a-uuid')
        .set('authorization', `Bearer ${buyer2.token}`)
        .expect(400);
    });

    it('rejects malformed cursors with VALIDATION_ERROR', async () => {
      const response = await request(server)
        .get('/api/v1/me/favorites?cursor=not-a-cursor')
        .set('authorization', `Bearer ${buyer.token}`)
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --- Reports (spec §56–§57) -----------------------------------------------------

  describe('reports', () => {
    it('requires authentication', async () => {
      await request(server)
        .post(`/api/v1/listings/${lReported.id}/reports`)
        .send({ reason: 'SCAM' })
        .expect(401);
    });

    it('requires a verified phone number', async () => {
      const response = (await report(
        unverifiedBuyer,
        lReported.id,
        { reason: 'SCAM' },
        403,
      )) as ErrorEnvelope;
      expect(response.error.code).toBe('PHONE_NOT_VERIFIED');
    });

    it('stores the report, attributes it to the seller and records analytics', async () => {
      const description = `${PREFIX} Scam listing report`;
      const created = (await report(buyer, lReported.id, {
        reason: 'SCAM',
        description,
      })) as SuccessEnvelope<ReportData>;
      expect(created.data.listingId).toBe(lReported.id);
      expect(created.data.reportedUserId).toBe(sellerA.userId);
      expect(created.data.reason).toBe('SCAM');
      expect(created.data.description).toBe(description);
      expect(created.data.status).toBe('OPEN');
      expect(created.data.resolvedAt).toBeNull();

      const stored = await prisma.report.findUniqueOrThrow({ where: { id: created.data.id } });
      expect(stored.reporterUserId).toBe(buyer.userId);

      const stat = await prisma.listingDailyStat.findFirst({ where: { listingId: lReported.id } });
      expect(stat?.reports).toBe(1);
    });

    it('rejects a second open report for the same listing by the same user', async () => {
      const response = (await report(
        buyer,
        lReported.id,
        { reason: 'SPAM' },
        409,
      )) as ErrorEnvelope;
      expect(response.error.code).toBe('REPORT_ALREADY_OPEN');
    });

    it('lets a different user report the same listing', async () => {
      const created = (await report(buyer2, lReported.id, {
        reason: 'MISLEADING',
      })) as SuccessEnvelope<ReportData>;
      expect(created.data.status).toBe('OPEN');

      const stat = await prisma.listingDailyStat.findFirst({ where: { listingId: lReported.id } });
      expect(stat?.reports).toBe(2);
    });

    it('refuses self-reports', async () => {
      const response = (await report(
        sellerA,
        lReported.id,
        { reason: 'SCAM' },
        400,
      )) as ErrorEnvelope;
      expect(response.error.code).toBe('CANNOT_REPORT_OWN_LISTING');
    });

    it('hides drafts, suspended sellers and unknown ids as LISTING_NOT_FOUND', async () => {
      const draftListing = (await report(
        buyer2,
        lDraft.id,
        { reason: 'SCAM' },
        404,
      )) as ErrorEnvelope;
      expect(draftListing.error.code).toBe('LISTING_NOT_FOUND');

      const suspended = (await report(
        buyer2,
        lSuspended.id,
        { reason: 'SCAM' },
        404,
      )) as ErrorEnvelope;
      expect(suspended.error.code).toBe('LISTING_NOT_FOUND');

      const unknown = (await report(
        buyer2,
        randomUUID(),
        { reason: 'SCAM' },
        404,
      )) as ErrorEnvelope;
      expect(unknown.error.code).toBe('LISTING_NOT_FOUND');
    });

    it('accepts reports for SOLD listings', async () => {
      const created = (await report(buyer2, lSold.id, {
        reason: 'STOLEN',
      })) as SuccessEnvelope<ReportData>;
      expect(created.data.listingId).toBe(lSold.id);
      expect(created.data.status).toBe('OPEN');
    });

    it('validates the reason, the description length and the id parameter', async () => {
      const badReason = await request(server)
        .post(`/api/v1/listings/${lFav1.id}/reports`)
        .set('authorization', `Bearer ${buyerLadder.token}`)
        .send({ reason: 'BANANA' })
        .expect(400);
      expect((badReason.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const missingReason = await request(server)
        .post(`/api/v1/listings/${lFav1.id}/reports`)
        .set('authorization', `Bearer ${buyerLadder.token}`)
        .send({})
        .expect(400);
      expect((missingReason.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const longDescription = await request(server)
        .post(`/api/v1/listings/${lFav1.id}/reports`)
        .set('authorization', `Bearer ${buyerLadder.token}`)
        .send({ reason: 'OTHER', description: 'x'.repeat(1001) })
        .expect(400);
      expect((longDescription.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      await request(server)
        .post('/api/v1/listings/not-a-uuid/reports')
        .set('authorization', `Bearer ${buyerLadder.token}`)
        .send({ reason: 'SCAM' })
        .expect(400);
    });
  });

  // --- Material change re-review (§42) --------------------------------------------

  describe('material contact change', () => {
    it('routes an approved listing back into review when contact methods change', async () => {
      const created = await draft(sellerA.token, { categoryId: reviewCat.id });
      const submission = await request(server)
        .post(`/api/v1/listings/${created.id}/submit`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({})
        .expect(200);
      expect((submission.body as SuccessEnvelope<OwnerListingData>).data.status).toBe(
        'PENDING_REVIEW',
      );

      // The moderation HTTP surface arrives with Phase 11 — drive the same
      // service call the admin approval endpoint will make.
      const approved = await listings.approve(adminUserId, created.id, 'en');
      expect(approved.status).toBe('ACTIVE');

      const patched = await request(server)
        .patch(`/api/v1/listings/${created.id}`)
        .set('authorization', `Bearer ${sellerA.token}`)
        .send({
          expectedVersion: approved.version,
          contactMethods: [{ type: 'TELEGRAM', valueOverride: 'review_handle' }],
        })
        .expect(200);
      const owner = (patched.body as SuccessEnvelope<OwnerListingData>).data;
      expect(owner.status).toBe('PENDING_REVIEW');
      expect(owner.version).toBe(approved.version + 1);
      expect(owner.contactMethods).toEqual([
        { type: 'TELEGRAM', enabled: true, valueOverride: '@review_handle' },
      ]);

      // Back in review, the listing is not publicly contactable.
      const hidden = (await reveal(created.id, 'TELEGRAM', 409)) as ErrorEnvelope;
      expect(hidden.error.code).toBe('LISTING_NOT_ACTIVE');
    });
  });

  // --- Rate limits (§57) -----------------------------------------------------------

  describe('rate limits', () => {
    it('caps anonymous contact reveals per IP', async () => {
      for (let index = 0; index < 30; index += 1) {
        await reveal(lContactDefault.id, 'PHONE');
      }

      const limited = (await reveal(lContactDefault.id, 'PHONE', 429)) as ErrorEnvelope;
      expect(limited.error.code).toBe('RATE_LIMITED');
      expect(limited.error.details?.scope).toBe('contact:create:ip');
      expect(typeof limited.error.details?.retryAfterSeconds).toBe('number');
    });

    it('caps report submissions per user and checks the limit before duplicates', async () => {
      for (const listingId of reportLimitListings) {
        await report(buyer, listingId, { reason: 'SPAM' });
      }

      // An 11th submission is rejected by the limiter — before the duplicate
      // check this repeat of the first listing would otherwise hit.
      const limited = (await report(
        buyer,
        reportLimitListings[0],
        { reason: 'SPAM' },
        429,
      )) as ErrorEnvelope;
      expect(limited.error.code).toBe('RATE_LIMITED');
      expect(limited.error.details?.scope).toBe('report:create:user');
    });
  });
});
