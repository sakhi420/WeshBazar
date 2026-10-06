/**
 * Taxonomy e2e (Phase 5) — boots the real application (test database) and
 * covers:
 *
 *   - admin access control (anonymous 401, non-admin 403)
 *   - category CRUD: slug allocation, translation rules, cycle prevention,
 *     delete guards (children / listings)
 *   - attribute & option CRUD: coherence validation, uniqueness, usage guards
 *   - public reads: visibility (ACTIVE chain), tree, slug detail, locale
 *     resolution, filter schema (inherited attributes, inactive excluded)
 *   - the attribute engine through DI: REQUIRED/TYPE failures with
 *     details.errors, leaf/inactive category guards, usage detection
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
import { TaxonomyService } from '../../src/modules/taxonomy/taxonomy.service';

const PASSWORD = 'S3cure!Pass';
const RUN_ID = randomInt(0x100000, 0xffffff).toString(16);
/** Every fixture slug carries this prefix so cleanup can find them. */
const PREFIX = `e2e-${RUN_ID}`;

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: { errors?: Array<Record<string, unknown>> } };
  requestId: string;
}

interface AdminCategoryData {
  id: string;
  slug: string;
  parentId: string | null;
  status: string;
  name: string;
  translations: Array<{ locale: string; name: string; description: string | null }>;
}

interface AdminAttributeData {
  id: string;
  categoryId: string;
  key: string;
  type: string;
  required: boolean;
  isActive: boolean;
  options: Array<{ id: string; value: string; label: string; isActive: boolean }>;
}

interface FilterSchemaFieldData {
  field: string;
  label: string;
  type: string;
  unit: string | null;
  required: boolean;
  filterable: boolean;
  options: Array<{ value: string; label: string }>;
  operators: string[];
}

let phoneSeed = 0;

function uniquePhone(): string {
  phoneSeed += 1;
  const suffix = String((randomInt(0, 9_000_000) + phoneSeed) % 10_000_000).padStart(7, '0');
  return `+9370${suffix}`;
}

describe('Taxonomy (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let prisma: PrismaService;
  let taxonomy: TaxonomyService;
  let rateLimitService: RateLimitService;
  const createdUserIds: string[] = [];

  let adminToken: string;
  let userToken: string;

  // Fixture tree (all slugs start with PREFIX):
  // root (brand required/filterable, color filterable, internal_note hidden)
  //  └── child (ram INTEGER required/filterable, storage SELECT + options)
  // inactiveRoot (INACTIVE)
  //  └── childOfInactive (ACTIVE, but hidden by its parent)
  let root: AdminCategoryData;
  let child: AdminCategoryData;
  let inactiveRoot: AdminCategoryData;
  let childOfInactive: AdminCategoryData;

  let ramAttribute: AdminAttributeData;
  let storageAttribute: AdminAttributeData;

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
    taxonomy = app.get(TaxonomyService);
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
    // Categories: delete leaves until the whole fixture tree is gone.
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
      .send({ phone, password: PASSWORD, displayName: 'E2E Taxonomy User' })
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

  function admin(path: string): request.Test {
    return request(server).get(`/api/v1/admin${path}`).set('authorization', `Bearer ${adminToken}`);
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
  ): Promise<AdminAttributeData> {
    const response = await request(server)
      .post(`/api/v1/admin/categories/${categoryId}/attributes`)
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<AdminAttributeData>).data;
  }

  async function createOption(
    attributeId: string,
    payload: Record<string, unknown>,
  ): Promise<AdminAttributeData['options'][number]> {
    const response = await request(server)
      .post(`/api/v1/admin/attributes/${attributeId}/options`)
      .set('authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    return (response.body as SuccessEnvelope<AdminAttributeData['options'][number]>).data;
  }

  async function createFixtures(): Promise<void> {
    root = await createCategory({
      slug: `${PREFIX}-electronics`,
      translations: [
        { locale: 'en', name: 'E2E Electronics' },
        { locale: 'fa-AF', name: 'الکترونیک آزمایشی' },
      ],
    });
    child = await createCategory({
      parentId: root.id,
      slug: `${PREFIX}-phones`,
      translations: [{ locale: 'en', name: 'E2E Phones' }],
    });
    inactiveRoot = await createCategory({
      slug: `${PREFIX}-hidden`,
      status: 'INACTIVE',
      translations: [{ locale: 'en', name: 'E2E Hidden' }],
    });
    childOfInactive = await createCategory({
      parentId: inactiveRoot.id,
      slug: `${PREFIX}-hidden-child`,
      translations: [{ locale: 'en', name: 'E2E Hidden Child' }],
    });

    await createAttribute(root.id, {
      key: 'brand',
      label: 'Brand',
      type: 'TEXT',
      required: true,
      filterable: true,
      searchable: true,
    });
    await createAttribute(root.id, {
      key: 'color',
      label: 'Color',
      type: 'TEXT',
      filterable: true,
    });
    await createAttribute(root.id, {
      key: 'internal_note',
      label: 'Internal note',
      type: 'TEXT',
    });
    ramAttribute = await createAttribute(child.id, {
      key: 'ram',
      label: 'RAM',
      type: 'INTEGER',
      required: true,
      filterable: true,
      unit: 'GB',
      minValue: 1,
      maxValue: 512,
    });
    storageAttribute = await createAttribute(child.id, {
      key: 'storage',
      label: 'Storage',
      type: 'SELECT',
      filterable: true,
    });
    await createOption(storageAttribute.id, { value: '128', label: '128 GB' });
    await createOption(storageAttribute.id, { value: '64', label: '64 GB', isActive: false });
  }

  // --- Access control ------------------------------------------------------------

  describe('admin access control', () => {
    it('rejects anonymous callers with 401', async () => {
      const response = await request(server).get('/api/v1/admin/categories').expect(401);
      expect((response.body as ErrorEnvelope).error.code).toBe('UNAUTHORIZED');
    });

    it('rejects authenticated non-admin users with 403', async () => {
      const response = await request(server)
        .get('/api/v1/admin/categories')
        .set('authorization', `Bearer ${userToken}`)
        .expect(403);
      expect((response.body as ErrorEnvelope).error.code).toBe('FORBIDDEN');
    });
  });

  // --- Admin category CRUD ---------------------------------------------------------

  describe('admin category CRUD', () => {
    it('lists every category (any status) with translations and counts', async () => {
      const response = await admin('/categories').expect(200);
      const list = (response.body as SuccessEnvelope<AdminCategoryData[]>).data;
      const slugs = list.map((category) => category.slug);
      expect(slugs).toContain(root.slug);
      expect(slugs).toContain(inactiveRoot.slug);
      const rootRow = list.find((category) => category.slug === root.slug);
      expect(rootRow?.translations.map((row) => row.locale).sort()).toEqual(['en', 'fa']);
    });

    it('rejects duplicate explicit slugs with CATEGORY_SLUG_TAKEN', async () => {
      const response = await request(server)
        .post('/api/v1/admin/categories')
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          slug: root.slug,
          translations: [{ locale: 'en', name: 'Duplicate' }],
        })
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('CATEGORY_SLUG_TAKEN');
    });

    it('allocates distinct slugs for same-named categories', async () => {
      const first = await createCategory({
        slug: `${PREFIX}-same-name-a`,
        translations: [{ locale: 'en', name: 'Same Name' }],
      });
      const secondResponse = await request(server)
        .post('/api/v1/admin/categories')
        .set('authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'en', name: 'Same Name' }] })
        .expect(201);
      const second = (secondResponse.body as SuccessEnvelope<AdminCategoryData>).data;
      expect(first.slug).not.toBe(second.slug);
      expect(second.slug).toMatch(/^same-name(-[0-9a-f]{6})?$/);
    });

    it('validates translations (English required, locale support, unique locale)', async () => {
      const missingEnglish = await request(server)
        .post('/api/v1/admin/categories')
        .set('authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'fa-AF', name: 'فقط دری' }] })
        .expect(400);
      const body = missingEnglish.body as ErrorEnvelope;
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(JSON.stringify(body.error.details)).toContain('en');

      await request(server)
        .post('/api/v1/admin/categories')
        .set('authorization', `Bearer ${adminToken}`)
        .send({ translations: [{ locale: 'de', name: 'Deutsch' }] })
        .expect(400);
    });

    it('rejects unknown and non-UUID parents', async () => {
      const notFound = await request(server)
        .post('/api/v1/admin/categories')
        .set('authorization', `Bearer ${adminToken}`)
        .send({
          parentId: '00000000-0000-4000-8000-000000000000',
          translations: [{ locale: 'en', name: 'Orphan' }],
        })
        .expect(404);
      expect((notFound.body as ErrorEnvelope).error.code).toBe('CATEGORY_NOT_FOUND');

      const malformed = await request(server)
        .post('/api/v1/admin/categories')
        .set('authorization', `Bearer ${adminToken}`)
        .send({ parentId: 'not-a-uuid', translations: [{ locale: 'en', name: 'Junk' }] })
        .expect(400);
      expect((malformed.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('prevents cycles when moving categories', async () => {
      const a = await createCategory({
        slug: `${PREFIX}-cycle-a`,
        translations: [{ locale: 'en', name: 'Cycle A' }],
      });
      const b = await createCategory({
        parentId: a.id,
        slug: `${PREFIX}-cycle-b`,
        translations: [{ locale: 'en', name: 'Cycle B' }],
      });

      const self = await request(server)
        .patch(`/api/v1/admin/categories/${a.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ parentId: a.id })
        .expect(409);
      expect((self.body as ErrorEnvelope).error.code).toBe('CATEGORY_CYCLE_DETECTED');

      const descendant = await request(server)
        .patch(`/api/v1/admin/categories/${a.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ parentId: b.id })
        .expect(409);
      expect((descendant.body as ErrorEnvelope).error.code).toBe('CATEGORY_CYCLE_DETECTED');
    });

    it('moves a category to the root and back', async () => {
      const a = await createCategory({
        slug: `${PREFIX}-move-a`,
        translations: [{ locale: 'en', name: 'Move A' }],
      });
      const b = await createCategory({
        parentId: a.id,
        slug: `${PREFIX}-move-b`,
        translations: [{ locale: 'en', name: 'Move B' }],
      });

      const toRoot = await request(server)
        .patch(`/api/v1/admin/categories/${b.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ parentId: null })
        .expect(200);
      expect((toRoot.body as SuccessEnvelope<AdminCategoryData>).data.parentId).toBeNull();

      const back = await request(server)
        .patch(`/api/v1/admin/categories/${b.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ parentId: a.id })
        .expect(200);
      expect((back.body as SuccessEnvelope<AdminCategoryData>).data.parentId).toBe(a.id);
    });

    it('blocks deleting a category with children and deletes an empty one', async () => {
      const blocked = await request(server)
        .delete(`/api/v1/admin/categories/${root.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(409);
      expect((blocked.body as ErrorEnvelope).error.code).toBe('CATEGORY_HAS_CHILDREN');

      const empty = await createCategory({
        slug: `${PREFIX}-empty`,
        translations: [{ locale: 'en', name: 'Empty' }],
      });
      await createAttribute(empty.id, { key: 'note', label: 'Note', type: 'TEXT' });
      await request(server)
        .delete(`/api/v1/admin/categories/${empty.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  // --- Admin attribute & option CRUD -----------------------------------------------

  describe('admin attribute CRUD', () => {
    it('rejects duplicate keys with ATTRIBUTE_KEY_TAKEN', async () => {
      const response = await request(server)
        .post(`/api/v1/admin/categories/${child.id}/attributes`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ key: 'ram', label: 'RAM again', type: 'INTEGER' })
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_KEY_TAKEN');
    });

    it('rejects incoherent constraint/type combinations', async () => {
      const minValueOnText = await request(server)
        .post(`/api/v1/admin/categories/${child.id}/attributes`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ key: 'bad_min', label: 'Bad', type: 'TEXT', minValue: 1 })
        .expect(400);
      expect((minValueOnText.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      await request(server)
        .post(`/api/v1/admin/categories/${child.id}/attributes`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ key: 'bad_range', label: 'Bad', type: 'INTEGER', minValue: 10, maxValue: 5 })
        .expect(400);

      await request(server)
        .post(`/api/v1/admin/categories/${child.id}/attributes`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ key: 'bad_pattern', label: 'Bad', type: 'TEXT', pattern: '([unclosed' })
        .expect(400);

      await request(server)
        .post(`/api/v1/admin/categories/${child.id}/attributes`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ key: 'Bad Key!', label: 'Bad', type: 'TEXT' })
        .expect(400);
    });

    it('refuses options on non-select attributes', async () => {
      const response = await request(server)
        .post(`/api/v1/admin/attributes/${ramAttribute.id}/options`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ value: 'x', label: 'X' })
        .expect(400);
      expect((response.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects duplicate option values with ATTRIBUTE_OPTION_VALUE_TAKEN', async () => {
      const response = await request(server)
        .post(`/api/v1/admin/attributes/${storageAttribute.id}/options`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ value: '128', label: 'Duplicate' })
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_OPTION_VALUE_TAKEN');
    });
  });

  // --- Public reads ------------------------------------------------------------------

  describe('public category reads', () => {
    it('lists visible categories and hides inactive chains', async () => {
      const response = await request(server).get('/api/v1/categories').expect(200);
      const list = (response.body as SuccessEnvelope<Array<{ slug: string; hasChildren: boolean }>>)
        .data;
      const slugs = list.map((category) => category.slug);
      expect(slugs).toContain(root.slug);
      expect(slugs).toContain(child.slug);
      expect(slugs).not.toContain(inactiveRoot.slug);
      expect(slugs).not.toContain(childOfInactive.slug);
      expect(list.find((category) => category.slug === root.slug)?.hasChildren).toBe(true);
    });

    it('builds the nested tree', async () => {
      const response = await request(server).get('/api/v1/categories/tree').expect(200);
      const tree = (
        response.body as SuccessEnvelope<Array<{ slug: string; children: Array<{ slug: string }> }>>
      ).data;
      const rootNode = tree.find((node) => node.slug === root.slug);
      expect(rootNode).toBeDefined();
      expect(rootNode?.children.some((node) => node.slug === child.slug)).toBe(true);
    });

    it('serves detail by slug with parent and ancestors', async () => {
      const response = await request(server).get(`/api/v1/categories/${child.slug}`).expect(200);
      const detail = (
        response.body as SuccessEnvelope<{
          slug: string;
          parent: { slug: string } | null;
          ancestors: Array<{ slug: string }>;
        }>
      ).data;
      expect(detail.slug).toBe(child.slug);
      expect(detail.parent?.slug).toBe(root.slug);
      expect(detail.ancestors.map((ancestor) => ancestor.slug)).toEqual([root.slug]);
    });

    it('resolves locales with BCP-47 aliases and falls back to English', async () => {
      const response = await request(server)
        .get(`/api/v1/categories/${root.slug}?locale=fa-AF`)
        .expect(200);
      expect((response.body as SuccessEnvelope<{ name: string }>).data.name).toBe(
        'الکترونیک آزمایشی',
      );

      const fallback = await request(server)
        .get(`/api/v1/categories/${root.slug}?locale=de-DE`)
        .expect(200);
      expect((fallback.body as SuccessEnvelope<{ name: string }>).data.name).toBe(
        'E2E Electronics',
      );
    });

    it('returns 404 for unknown or hidden slugs', async () => {
      await request(server).get('/api/v1/categories/no-such-category').expect(404);
      const hidden = await request(server)
        .get(`/api/v1/categories/${inactiveRoot.slug}`)
        .expect(404);
      expect((hidden.body as ErrorEnvelope).error.code).toBe('CATEGORY_NOT_FOUND');
    });

    it('serves the filter schema with inherited attributes and active options', async () => {
      const response = await request(server)
        .get(`/api/v1/categories/${child.id}/filter-schema`)
        .expect(200);
      const fields = (response.body as SuccessEnvelope<FilterSchemaFieldData[]>).data;
      const byField = new Map(fields.map((field) => [field.field, field]));

      // Inherited from the root category.
      expect(byField.get('brand')?.required).toBe(true);
      expect(byField.get('brand')?.operators).toEqual(['eq', 'contains']);
      // Own attributes.
      expect(byField.get('ram')?.operators).toEqual(['eq', 'gte', 'lte', 'in']);
      expect(byField.get('ram')?.unit).toBe('GB');
      // Non-filterable attributes are exposed but carry no operators.
      expect(byField.get('internal_note')?.filterable).toBe(false);
      expect(byField.get('internal_note')?.operators).toEqual([]);
      // Options: inactive ones are hidden.
      expect(byField.get('storage')?.options.map((option) => option.value)).toEqual(['128']);
    });

    it('returns 404 for the filter schema of hidden or malformed categories', async () => {
      await request(server).get(`/api/v1/categories/${inactiveRoot.id}/filter-schema`).expect(404);
      await request(server).get('/api/v1/categories/not-a-uuid/filter-schema').expect(404);
    });
  });

  // --- Attribute engine through DI -----------------------------------------------------

  describe('attribute engine (DI)', () => {
    it('reports REQUIRED_ATTRIBUTE_MISSING with per-field details', async () => {
      await expect(taxonomy.validateForCategory(child.id, {})).rejects.toMatchObject({
        code: 'REQUIRED_ATTRIBUTE_MISSING',
        details: {
          errors: expect.arrayContaining([
            expect.objectContaining({ field: 'brand', rule: 'REQUIRED' }),
            expect.objectContaining({ field: 'ram', rule: 'REQUIRED' }),
          ]),
        },
      });
    });

    it('reports INVALID_ATTRIBUTE_VALUE for wrong types', async () => {
      await expect(
        taxonomy.validateForCategory(child.id, { brand: 'Sony', ram: 'lots' }),
      ).rejects.toMatchObject({
        code: 'INVALID_ATTRIBUTE_VALUE',
        details: {
          errors: [expect.objectContaining({ field: 'ram', rule: 'TYPE' })],
        },
      });
    });

    it('normalizes a valid payload', async () => {
      const normalized = await taxonomy.validateForCategory(child.id, {
        brand: '  Sony  ',
        ram: 8,
        storage: '128',
      });
      expect(normalized).toEqual({ brand: 'Sony', ram: 8, storage: '128' });
    });

    it('guards listing creation by category status and leaf position', async () => {
      await expect(taxonomy.assertCategoryUsableForListing(root.id)).rejects.toMatchObject({
        code: 'CATEGORY_NOT_LEAF',
      });
      await expect(taxonomy.assertCategoryUsableForListing(inactiveRoot.id)).rejects.toMatchObject({
        code: 'CATEGORY_INACTIVE',
      });
      await expect(
        taxonomy.assertCategoryUsableForListing('00000000-0000-4000-8000-000000000000'),
      ).rejects.toMatchObject({ code: 'CATEGORY_NOT_FOUND' });
      await expect(taxonomy.assertCategoryUsableForListing(child.id)).resolves.toBeUndefined();
    });
  });

  // --- Usage guards (spec §33) -----------------------------------------------------------

  describe('usage guards', () => {
    let usedText: AdminAttributeData;
    let usedSelect: AdminAttributeData;
    let usedOption: AdminAttributeData['options'][number];
    const listingIds: string[] = [];

    beforeAll(async () => {
      usedText = await createAttribute(child.id, {
        key: 'used_key',
        label: 'Used key',
        type: 'TEXT',
      });
      usedSelect = await createAttribute(child.id, {
        key: 'used_select',
        label: 'Used select',
        type: 'SELECT',
      });
      usedOption = await createOption(usedSelect.id, { value: 'a', label: 'A' });

      const user = await registerUser();
      const seller = await prisma.sellerAccount.findUnique({
        where: { ownerUserId: user.userId },
        select: { id: true },
      });
      const province = await prisma.province.create({
        data: {
          code: `E2-${RUN_ID.slice(0, 4).toUpperCase()}`,
          slug: `${PREFIX}-province`,
          translations: { create: [{ locale: 'en', name: 'E2E Province' }] },
        },
        select: { id: true },
      });
      const city = await prisma.city.create({
        data: {
          provinceId: province.id,
          slug: `${PREFIX}-city`,
          translations: { create: [{ locale: 'en', name: 'E2E City' }] },
        },
        select: { id: true },
      });

      const listing = await prisma.listing.create({
        data: {
          sellerAccountId: seller!.id,
          categoryId: child.id,
          provinceId: province.id,
          cityId: city.id,
          slug: `${PREFIX}-listing-1`,
          title: 'E2E listing',
          description: 'Fixture listing for usage-guard tests.',
          condition: 'NEW',
          attributes: { used_key: 'x', used_select: 'a' },
        },
        select: { id: true },
      });
      listingIds.push(listing.id);
    });

    it('detects key/type changes on used attributes', async () => {
      const keyChange = await request(server)
        .patch(`/api/v1/admin/attributes/${usedText.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ key: 'renamed_key' })
        .expect(409);
      expect((keyChange.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_IN_USE');

      const typeChange = await request(server)
        .patch(`/api/v1/admin/attributes/${usedText.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ type: 'INTEGER' })
        .expect(409);
      expect((typeChange.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_IN_USE');
    });

    it('allows label and flag edits on used attributes', async () => {
      const response = await request(server)
        .patch(`/api/v1/admin/attributes/${usedText.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ label: 'Used key (renamed label)', isActive: false })
        .expect(200);
      expect((response.body as SuccessEnvelope<AdminAttributeData>).data.isActive).toBe(false);
      // Restore for later assertions.
      await request(server)
        .patch(`/api/v1/admin/attributes/${usedText.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);
    });

    it('blocks deleting used attributes and options', async () => {
      const attribute = await request(server)
        .delete(`/api/v1/admin/attributes/${usedText.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(409);
      expect((attribute.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_IN_USE');

      const option = await request(server)
        .delete(`/api/v1/admin/options/${usedOption.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(409);
      expect((option.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_IN_USE');
    });

    it('blocks changing a used option value but allows label edits', async () => {
      const valueChange = await request(server)
        .patch(`/api/v1/admin/options/${usedOption.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ value: 'b' })
        .expect(409);
      expect((valueChange.body as ErrorEnvelope).error.code).toBe('ATTRIBUTE_IN_USE');

      const labelChange = await request(server)
        .patch(`/api/v1/admin/options/${usedOption.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .send({ label: 'A (renamed)' })
        .expect(200);
      expect(
        (labelChange.body as SuccessEnvelope<AdminAttributeData['options'][number]>).data.label,
      ).toBe('A (renamed)');
    });

    it('blocks deleting a category that has listings', async () => {
      const response = await request(server)
        .delete(`/api/v1/admin/categories/${child.id}`)
        .set('authorization', `Bearer ${adminToken}`)
        .expect(409);
      expect((response.body as ErrorEnvelope).error.code).toBe('CATEGORY_HAS_LISTINGS');
      expect(listingIds.length).toBe(1);
    });
  });
});
