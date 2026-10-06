/**
 * Locations e2e (Phase 6) — boots the real application (test database) and
 * covers:
 *
 *   - admin access control (anonymous 401, non-admin 403)
 *   - public reads: active provinces/cities only, localized names, hidden
 *     inactive provinces, 404 semantics for malformed ids
 *   - admin province/city CRUD: ISO code handling, slug allocation
 *     (per-province city slugs), translation upserts, delete guards
 *   - listing validation primitives through DI: city-belongs-to-province,
 *     active-location enforcement
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { randomInt } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { RateLimitService } from '../../src/common/rate-limit/rate-limit.service';
import { validateEnv } from '../../src/config/env.schema';
import { PrismaService } from '../../src/database/prisma.service';
import { LocationsService } from '../../src/modules/locations/locations.service';

const PASSWORD = 'S3cure!Pass';
const RUN_ID = randomInt(0x100000, 0xffffff).toString(16);
const PREFIX = `e2e-${RUN_ID}`;
/** Codes stay ISO-shaped (two letters, hyphen, alphanumerics). */
const CODE_BASE = RUN_ID.slice(0, 4).toUpperCase();

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
  requestId: string;
}

interface AdminProvinceData {
  id: string;
  code: string;
  slug: string;
  status: string;
  name: string;
  translations: Array<{ locale: string; name: string }>;
  cityCount: number;
}

interface AdminCityData {
  id: string;
  provinceId: string;
  slug: string;
  status: string;
  name: string;
}

let phoneSeed = 0;

function uniquePhone(): string {
  phoneSeed += 1;
  const suffix = String((randomInt(0, 9_000_000) + phoneSeed) % 10_000_000).padStart(7, '0');
  return `+9370${suffix}`;
}

describe('Locations (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let locations: LocationsService;
  let rateLimitService: RateLimitService;
  const createdUserIds: string[] = [];

  let adminToken: string;
  let userToken: string;

  // Fixture set (all slugs/prefixes start with PREFIX):
  // provinceMain ── cityMain, cityHidden (deactivated in a test), cityUsed
  // provinceSecond          (mismatch + per-province slug tests)
  // provinceHidden ── cityOfHidden (province INACTIVE)
  // provinceTrash  ── cityTrash  (deleted at the end)
  let provinceMain: AdminProvinceData;
  let provinceSecond: AdminProvinceData;
  let provinceHidden: AdminProvinceData;
  let provinceTrash: AdminProvinceData;
  let cityMain: AdminCityData;
  let cityHidden: AdminCityData;
  let cityUsed: AdminCityData;
  let cityTrash: AdminCityData;

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
    locations = app.get(LocationsService);
    rateLimitService = app.get(RateLimitService);

    adminToken = await createAdminToken();
    userToken = (await registerUser()).accessToken;
    await createFixtures();
  });

  beforeEach(() => {
    rateLimitService.reset();
  });

  afterAll(async () => {
    await prisma.listing.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.city.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    await prisma.province.deleteMany({ where: { slug: { startsWith: PREFIX } } });
    if (createdUserIds.length > 0) {
      await prisma.sellerAccount.deleteMany({ where: { ownerUserId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await app.close();
  });

  // --- Helpers -----------------------------------------------------------------

  async function registerUser(): Promise<{ userId: string; phone: string; accessToken: string }> {
    const phone = uniquePhone();
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone, password: PASSWORD, displayName: 'E2E Locations User' })
      .expect(201);
    const body = response.body as SuccessEnvelope<{
      user: { id: string };
      tokens: { accessToken: string };
    }>;
    createdUserIds.push(body.data.user.id);
    return { userId: body.data.user.id, phone, accessToken: body.data.tokens.accessToken };
  }

  /** Admin tokens must come from a login AFTER the role is raised. */
  async function createAdminToken(): Promise<string> {
    const { userId, phone } = await registerUser();
    await prisma.user.update({ where: { id: userId }, data: { role: 'ADMIN' } });
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ phone, password: PASSWORD })
      .expect(200);
    return (login.body as SuccessEnvelope<{ tokens: { accessToken: string } }>).data.tokens
      .accessToken;
  }

  async function createProvince(payload: Record<string, unknown>): Promise<AdminProvinceData> {
    const response = await request(server)
      .post('/api/v1/admin/provinces')
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<AdminProvinceData>).data;
  }

  async function createCity(
    provinceId: string,
    payload: Record<string, unknown>,
  ): Promise<AdminCityData> {
    const response = await request(server)
      .post(`/api/v1/admin/provinces/${provinceId}/cities`)
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<AdminCityData>).data;
  }

  async function createFixtures(): Promise<void> {
    provinceMain = await createProvince({
      code: `XX-${CODE_BASE}`,
      translations: [
        { locale: 'en', name: 'E2E Main' },
        { locale: 'fa-AF', name: 'اصلی آزمایشی' },
      ],
    });
    provinceSecond = await createProvince({
      code: `XX-${CODE_BASE}2`,
      translations: [{ locale: 'en', name: 'E2E Second' }],
    });
    provinceHidden = await createProvince({
      code: `XX-${CODE_BASE}3`,
      status: 'INACTIVE',
      translations: [{ locale: 'en', name: 'E2E Hidden' }],
    });
    provinceTrash = await createProvince({
      code: `XX-${CODE_BASE}4`,
      translations: [{ locale: 'en', name: 'E2E Trash' }],
    });

    cityMain = await createCity(provinceMain.id, {
      slug: `${PREFIX}-city-main`,
      translations: [{ locale: 'en', name: 'E2E City Main' }],
    });
    cityHidden = await createCity(provinceMain.id, {
      slug: `${PREFIX}-city-hidden`,
      translations: [{ locale: 'en', name: 'E2E City Hidden' }],
    });
    cityUsed = await createCity(provinceMain.id, {
      slug: `${PREFIX}-city-used`,
      translations: [{ locale: 'en', name: 'E2E City Used' }],
    });
    cityTrash = await createCity(provinceTrash.id, {
      slug: `${PREFIX}-city-trash`,
      translations: [{ locale: 'en', name: 'E2E City Trash' }],
    });
    await createCity(provinceHidden.id, {
      slug: `${PREFIX}-city-of-hidden`,
      translations: [{ locale: 'en', name: 'E2E City Of Hidden' }],
    });

    // A listing referencing cityUsed so delete-guards can be exercised.
    const user = await registerUser();
    const seller = await prisma.sellerAccount.findUnique({
      where: { ownerUserId: user.userId },
      select: { id: true },
    });
    const category =
      (await prisma.category.findFirst({
        where: { slug: 'mobile-phones' },
        select: { id: true },
      })) ?? (await prisma.category.findFirst({ select: { id: true } }));
    await prisma.listing.create({
      data: {
        sellerAccountId: seller!.id,
        categoryId: category!.id,
        provinceId: provinceMain.id,
        cityId: cityUsed.id,
        slug: `${PREFIX}-listing-1`,
        title: 'E2E location listing',
        description: 'Fixture listing for location usage tests.',
        condition: 'NEW',
      },
    });
  }

  // --- Access control ------------------------------------------------------------

  describe('admin access control', () => {
    it('rejects anonymous callers with 401', async () => {
      const response = await request(server).get('/api/v1/admin/provinces').expect(401);
      expect((response.body as ErrorEnvelope).error.code).toBe('UNAUTHORIZED');
    });

    it('rejects authenticated non-admin users with 403', async () => {
      const response = await request(server)
        .get('/api/v1/admin/provinces')
        .set('authorization', `Bearer ${userToken}`)
        .expect(403);
      expect((response.body as ErrorEnvelope).error.code).toBe('FORBIDDEN');
    });
  });

  // --- Public reads ------------------------------------------------------------------

  describe('public location reads', () => {
    it('lists active provinces with localized names and hides inactive ones', async () => {
      const response = await request(server).get('/api/v1/locations/provinces').expect(200);
      const list = (
        response.body as SuccessEnvelope<Array<{ slug: string; code: string; name: string }>>
      ).data;
      const slugs = list.map((province) => province.slug);
      expect(slugs).toContain(provinceMain.slug);
      expect(slugs).not.toContain(provinceHidden.slug);
      expect(list.every((province) => province.code.length > 0)).toBe(true);

      const persian = await request(server)
        .get('/api/v1/locations/provinces?locale=fa-AF')
        .expect(200);
      const persianList = (persian.body as SuccessEnvelope<Array<{ slug: string; name: string }>>)
        .data;
      expect(persianList.find((province) => province.slug === provinceMain.slug)?.name).toBe(
        'اصلی آزمایشی',
      );
    });

    it('lists the active cities of a province', async () => {
      const response = await request(server)
        .get(`/api/v1/locations/provinces/${provinceMain.id}/cities`)
        .expect(200);
      const list = (response.body as SuccessEnvelope<Array<{ slug: string; name: string }>>).data;
      const slugs = list.map((city) => city.slug);
      expect(slugs).toContain(cityMain.slug);
      expect(slugs).toContain(cityUsed.slug);
    });

    it('treats inactive provinces as not found', async () => {
      const response = await request(server)
        .get(`/api/v1/locations/provinces/${provinceHidden.id}/cities`)
        .expect(404);
      expect((response.body as ErrorEnvelope).error.code).toBe('PROVINCE_NOT_FOUND');
    });

    it('returns 404 for malformed province ids', async () => {
      const response = await request(server)
        .get('/api/v1/locations/provinces/not-a-uuid/cities')
        .expect(404);
      expect((response.body as ErrorEnvelope).error.code).toBe('PROVINCE_NOT_FOUND');
    });
  });

  // --- Admin province CRUD -------------------------------------------------------------

  describe('admin province CRUD', () => {
    it('lists all provinces with translations and city counts', async () => {
      const response = await request(server)
        .get('/api/v1/admin/provinces')
        .set('authorization', `Bearer ${adminToken}`)
        .expect(200);
      const list = (response.body as SuccessEnvelope<AdminProvinceData[]>).data;
      const main = list.find((province) => province.slug === provinceMain.slug);
      expect(main?.cityCount).toBe(3);
      expect(main?.translations.map((row) => row.locale).sort()).toEqual(['en', 'fa']);
      expect(list.some((province) => province.slug === provinceHidden.slug)).toBe(true);
    });

    it('rejects duplicate codes and malformed codes', async () => {
      const duplicate = await request(server)
        .post('/api/v1/admin/provinces')
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          code: `XX-${CODE_BASE}`,
          translations: [{ locale: 'en', name: 'Duplicate Code' }],
        })
        .expect(409);
      expect((duplicate.body as ErrorEnvelope).error.code).toBe('PROVINCE_CODE_TAKEN');

      const malformed = await request(server)
        .post('/api/v1/admin/provinces')
        .set('authorization', `Bearer ${adminToken}`)
        .send({ code: 'KABUL', translations: [{ locale: 'en', name: 'Kabul' }] })
        .expect(400);
      expect((malformed.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('uppercases lowercase codes automatically', async () => {
      const province = await createProvince({
        code: `xx-${CODE_BASE}5`,
        translations: [{ locale: 'en', name: 'E2E Lowercase Code' }],
      });
      expect(province.code).toBe(`XX-${CODE_BASE}5`);
    });

    it('falls back to the code for non-latin names and rejects duplicate slugs', async () => {
      const nonLatin = await createProvince({
        code: `XX-${CODE_BASE}6`,
        translations: [{ locale: 'en', name: 'کابل' }],
      });
      expect(nonLatin.slug).toBe(`xx-${CODE_BASE}6`.toLowerCase());

      const duplicate = await request(server)
        .post('/api/v1/admin/provinces')
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          code: `XX-${CODE_BASE}7`,
          slug: provinceMain.slug,
          translations: [{ locale: 'en', name: 'Slug Thief' }],
        })
        .expect(409);
      expect((duplicate.body as ErrorEnvelope).error.code).toBe('PROVINCE_SLUG_TAKEN');
    });

    it('upserts translations and rejects duplicate codes on update', async () => {
      const response = await request(server)
        .patch(`/api/v1/admin/provinces/${provinceSecond.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          translations: [
            { locale: 'ps', name: 'دویم آزمایشی' },
            { locale: 'en', name: 'E2E Second (renamed)' },
          ],
        })
        .expect(200);
      const updated = (response.body as SuccessEnvelope<AdminProvinceData>).data;
      const locales = updated.translations.map((row) => row.locale).sort();
      expect(locales).toEqual(['en', 'ps']);
      expect(updated.name).toBe('E2E Second (renamed)');

      const duplicate = await request(server)
        .patch(`/api/v1/admin/provinces/${provinceSecond.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ code: `XX-${CODE_BASE}` })
        .expect(409);
      expect((duplicate.body as ErrorEnvelope).error.code).toBe('PROVINCE_CODE_TAKEN');
    });

    it('blocks deleting provinces that still have cities', async () => {
      const response = await request(server)
        .delete(`/api/v1/admin/provinces/${provinceMain.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('PROVINCE_IN_USE');
    });
  });

  // --- Admin city CRUD --------------------------------------------------------------------

  describe('admin city CRUD', () => {
    it('enforces city slug uniqueness per province only', async () => {
      const duplicate = await request(server)
        .post(`/api/v1/admin/provinces/${provinceMain.id}/cities`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          slug: cityMain.slug,
          translations: [{ locale: 'en', name: 'Copycat' }],
        })
        .expect(409);
      expect((duplicate.body as ErrorEnvelope).error.code).toBe('CITY_SLUG_TAKEN');

      const otherProvince = await createCity(provinceSecond.id, {
        slug: cityMain.slug,
        translations: [{ locale: 'en', name: 'Same slug, other province' }],
      });
      expect(otherProvince.slug).toBe(cityMain.slug);
      expect(otherProvince.provinceId).toBe(provinceSecond.id);
    });

    it('defaults city translations to English-required and allocates slugs', async () => {
      const response = await request(server)
        .post(`/api/v1/admin/provinces/${provinceSecond.id}/cities`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'fa', name: 'فقط دری' }] })
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      const auto = await createCity(provinceSecond.id, {
        translations: [{ locale: 'en', name: `E2E Auto City ${RUN_ID}` }],
      });
      expect(auto.slug).toMatch(new RegExp(`^e2e-auto-city-${RUN_ID}(-[0-9a-f]{6})?$`));
    });

    it('deactivating a city hides it from public lists', async () => {
      await request(server)
        .patch(`/api/v1/admin/cities/${cityHidden.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ status: 'INACTIVE' })
        .expect(200);

      const response = await request(server)
        .get(`/api/v1/locations/provinces/${provinceMain.id}/cities`)
        .expect(200);
      const slugs = (response.body as SuccessEnvelope<Array<{ slug: string }>>).data.map(
        (city) => city.slug,
      );
      expect(slugs).not.toContain(cityHidden.slug);
      expect(slugs).toContain(cityMain.slug);
    });

    it('blocks deleting cities that have listings', async () => {
      const response = await request(server)
        .delete(`/api/v1/admin/cities/${cityUsed.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('CITY_IN_USE');
    });

    it('deletes empty cities and provinces', async () => {
      await request(server)
        .delete(`/api/v1/admin/cities/${cityTrash.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(204);
      await request(server)
        .delete(`/api/v1/admin/provinces/${provinceTrash.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('rejects malformed ids on admin routes', async () => {
      await request(server)
        .delete('/api/v1/admin/cities/not-a-uuid')
        .set('authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  // --- Listing validation primitives (DI) ---------------------------------------------------

  describe('location validation primitives (DI)', () => {
    it('accepts an active city in its own active province', async () => {
      await expect(
        locations.assertLocationUsable(provinceMain.id, cityMain.id),
      ).resolves.toBeUndefined();
    });

    it('rejects a city that belongs to another province', async () => {
      await expect(
        locations.assertLocationUsable(provinceSecond.id, cityMain.id),
      ).rejects.toMatchObject({ code: 'CITY_PROVINCE_MISMATCH' });
    });

    it('rejects inactive cities and provinces', async () => {
      await expect(
        locations.assertLocationUsable(provinceMain.id, cityHidden.id),
      ).rejects.toMatchObject({ code: 'LOCATION_INACTIVE' });

      const ofHidden = await prisma.city.findFirst({
        where: { slug: `${PREFIX}-city-of-hidden` },
        select: { id: true },
      });
      await expect(
        locations.assertLocationUsable(provinceHidden.id, ofHidden!.id),
      ).rejects.toMatchObject({ code: 'LOCATION_INACTIVE' });
    });

    it('reports not-found for unknown or malformed ids', async () => {
      await expect(
        locations.assertLocationUsable(provinceMain.id, '00000000-0000-4000-8000-000000000000'),
      ).rejects.toMatchObject({ code: 'CITY_NOT_FOUND' });

      await expect(
        locations.assertLocationUsable(provinceMain.id, 'not-a-uuid'),
      ).rejects.toMatchObject({ code: 'CITY_NOT_FOUND' });

      await expect(locations.assertLocationUsable('not-a-uuid', cityMain.id)).rejects.toMatchObject(
        { code: 'PROVINCE_NOT_FOUND' },
      );
    });
  });
});
