/**
 * Profile & sellers e2e — boots the real application (test database) and
 * covers the Phase 4 surface:
 *
 *   - GET /me / PATCH /me (auth gate, updates, validation, clear semantics)
 *   - personal seller account provisioning at registration (spec §25)
 *   - slug allocation (collisions, non-latin fallback)
 *   - public seller profile (safe DTO, anonymous access, moderation hiding)
 *   - account status policy (suspended users are refused, sellers hidden)
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
import { MockSmsProvider } from '../../src/providers/sms/mock-sms.provider';

const PASSWORD = 'S3cure!Pass';

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  requestId: string;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
  requestId: string;
}

interface MyProfileData {
  id: string;
  phone: string;
  displayName: string;
  role: string;
  status: string;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  avatarKey: string | null;
  createdAt: string;
  seller: {
    id: string;
    type: string;
    displayName: string;
    slug: string;
    bio: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface PublicSellerData {
  slug: string;
  displayName: string;
  bio: string | null;
  memberSince: string;
  phoneVerified: boolean;
  activeListingCount: number;
}

let phoneSeed = 0;

/** Random, valid Afghan mobile number (unique enough across runs). */
function uniquePhone(): string {
  phoneSeed += 1;
  const suffix = String((randomInt(0, 9_000_000) + phoneSeed) % 10_000_000).padStart(7, '0');
  return `+9370${suffix}`;
}

describe('Profile & sellers (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;
  let rateLimitService: RateLimitService;
  let sms: MockSmsProvider;
  let prisma: PrismaService;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const env = validateEnv(process.env);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter(env));
    app.useLogger(false);
    await configureApp(app, env);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    server = app.getHttpServer();
    rateLimitService = app.get(RateLimitService);
    sms = app.get(MockSmsProvider);
    prisma = app.get(PrismaService);
  });

  beforeEach(() => {
    rateLimitService.reset();
    sms.clear();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      // Seller accounts must go first (ownerUserId FK is Restrict).
      await prisma.sellerAccount.deleteMany({ where: { ownerUserId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await app.close();
  });

  // --- Helpers -----------------------------------------------------------------

  async function registerUser(
    displayName?: string,
  ): Promise<{ userId: string; accessToken: string }> {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone: uniquePhone(), password: PASSWORD, ...(displayName ? { displayName } : {}) })
      .expect(201);

    const body = response.body as SuccessEnvelope<{
      user: { id: string };
      tokens: { accessToken: string };
    }>;
    createdUserIds.push(body.data.user.id);
    return { userId: body.data.user.id, accessToken: body.data.tokens.accessToken };
  }

  async function getMyProfile(accessToken: string): Promise<MyProfileData> {
    const response = await request(server)
      .get('/api/v1/me')
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200);
    return (response.body as SuccessEnvelope<MyProfileData>).data;
  }

  // --- GET /me -----------------------------------------------------------------

  describe('GET /me', () => {
    it('rejects anonymous callers with the standard envelope', async () => {
      const response = await request(server).get('/api/v1/me').expect(401);
      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns the user with a provisioned personal seller account and no secrets', async () => {
      const { accessToken } = await registerUser('Buyer One');
      const profile = await getMyProfile(accessToken);

      expect(profile.displayName).toBe('Buyer One');
      expect(profile.avatarKey).toBeNull();
      expect(profile.phoneVerified).toBe(false);
      expect(profile.seller.type).toBe('INDIVIDUAL');
      expect(profile.seller.status).toBe('ACTIVE');
      expect(profile.seller.displayName).toBe('Buyer One');
      expect(profile.seller.slug).toMatch(/^buyer-one(-[0-9a-f]{6})?$/);

      const raw = JSON.stringify(profile);
      expect(raw).not.toContain('passwordHash');
      expect(raw).not.toContain('lockedUntil');
      expect(raw).not.toContain('failedLoginAttempts');
      expect('ownerUserId' in profile.seller).toBe(false);
    });
  });

  // --- PATCH /me ---------------------------------------------------------------

  describe('PATCH /me', () => {
    it('updates user and seller fields while keeping the slug stable', async () => {
      const { accessToken } = await registerUser('Initial Name');
      const before = await getMyProfile(accessToken);

      const response = await request(server)
        .patch('/api/v1/me')
        .set('authorization', `Bearer ${accessToken}`)
        .send({
          displayName: 'Updated Name',
          avatarKey: 'avatars/user-1.jpg',
          seller: { displayName: 'Updated Store', bio: 'Selling electronics in Kabul.' },
        })
        .expect(200);

      const profile = (response.body as SuccessEnvelope<MyProfileData>).data;
      expect(profile.displayName).toBe('Updated Name');
      expect(profile.avatarKey).toBe('avatars/user-1.jpg');
      expect(profile.seller.displayName).toBe('Updated Store');
      expect(profile.seller.bio).toBe('Selling electronics in Kabul.');
      expect(profile.seller.slug).toBe(before.seller.slug);
    });

    it('clears bio and avatar with empty strings', async () => {
      const { accessToken } = await registerUser('Clear Me');
      await request(server)
        .patch('/api/v1/me')
        .set('authorization', `Bearer ${accessToken}`)
        .send({ avatarKey: 'avatars/tmp.png', seller: { bio: 'Temporary bio.' } })
        .expect(200);

      const profile = await (
        await request(server)
          .patch('/api/v1/me')
          .set('authorization', `Bearer ${accessToken}`)
          .send({ avatarKey: '', seller: { bio: '' } })
          .expect(200)
      ).body;
      const data = (profile as SuccessEnvelope<MyProfileData>).data;
      expect(data.avatarKey).toBeNull();
      expect(data.seller.bio).toBeNull();
    });

    it('validates payloads strictly', async () => {
      const { accessToken } = await registerUser('Validated User');
      const patch = (payload: Record<string, unknown>) =>
        request(server)
          .patch('/api/v1/me')
          .set('authorization', `Bearer ${accessToken}`)
          .send(payload);

      const shortName = await patch({ displayName: 'A' }).expect(400);
      expect((shortName.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');

      await patch({ avatarKey: '!! not a key !!' }).expect(400);
      await patch({ unknownField: true }).expect(400);
      await patch({ seller: { bio: 'x'.repeat(501) } }).expect(400);
      await patch({ seller: { slug: 'hijacked-slug' } }).expect(400);
    });

    it('is refused for suspended accounts', async () => {
      const { accessToken, userId } = await registerUser('Suspended User');
      await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });

      const getResponse = await request(server)
        .get('/api/v1/me')
        .set('authorization', `Bearer ${accessToken}`)
        .expect(403);
      expect((getResponse.body as ErrorEnvelope).error.code).toBe('ACCOUNT_NOT_ACTIVE');

      const patchResponse = await request(server)
        .patch('/api/v1/me')
        .set('authorization', `Bearer ${accessToken}`)
        .send({ displayName: 'Still Trying' })
        .expect(403);
      expect((patchResponse.body as ErrorEnvelope).error.code).toBe('ACCOUNT_NOT_ACTIVE');
    });
  });

  // --- Slug allocation ---------------------------------------------------------

  describe('seller slug allocation', () => {
    it('gives same-named sellers distinct slugs', async () => {
      const first = await registerUser('Ahmad Wesh');
      const second = await registerUser('Ahmad Wesh');

      const firstSlug = (await getMyProfile(first.accessToken)).seller.slug;
      const secondSlug = (await getMyProfile(second.accessToken)).seller.slug;

      expect(firstSlug).toMatch(/^ahmad-wesh(-[0-9a-f]{6})?$/);
      expect(secondSlug).toMatch(/^ahmad-wesh(-[0-9a-f]{6})?$/);
      expect(firstSlug).not.toBe(secondSlug);
    });

    it('falls back to a generic base for non-latin display names', async () => {
      const { accessToken } = await registerUser('احمد ویش');
      const slug = (await getMyProfile(accessToken)).seller.slug;
      expect(slug).toMatch(/^seller(-[0-9a-f]{6})?$/);
    });
  });

  // --- Public seller profile ---------------------------------------------------

  describe('GET /sellers/:slug', () => {
    it('serves a safe public profile to anonymous callers', async () => {
      const { accessToken, userId } = await registerUser('Public Seller');
      const profile = await getMyProfile(accessToken);

      const response = await request(server)
        .get(`/api/v1/sellers/${profile.seller.slug}`)
        .expect(200);

      const data = (response.body as SuccessEnvelope<PublicSellerData>).data;
      expect(data.slug).toBe(profile.seller.slug);
      expect(data.displayName).toBe('Public Seller');
      expect(data.bio).toBeNull();
      expect(data.phoneVerified).toBe(false);
      expect(data.activeListingCount).toBe(0);
      expect(new Date(data.memberSince).getTime()).toBeLessThanOrEqual(Date.now());

      // No internal identifiers, phone numbers or account metadata.
      const raw = JSON.stringify(data);
      expect(raw).not.toContain('"id"');
      expect(raw).not.toContain('"phone"');
      expect(raw).not.toContain(userId);
    });

    it('returns 404 for unknown or malformed slugs', async () => {
      const missing = await request(server).get('/api/v1/sellers/no-such-seller-here').expect(404);
      expect((missing.body as ErrorEnvelope).error.code).toBe('SELLER_ACCOUNT_NOT_FOUND');

      const malformed = await request(server).get('/api/v1/sellers/x').expect(404);
      expect((malformed.body as ErrorEnvelope).error.code).toBe('SELLER_ACCOUNT_NOT_FOUND');
    });

    it('hides suspended seller accounts', async () => {
      const { accessToken, userId } = await registerUser('Hidden Seller');
      const profile = await getMyProfile(accessToken);
      await prisma.sellerAccount.update({
        where: { ownerUserId: userId },
        data: { status: 'SUSPENDED' },
      });

      await request(server).get(`/api/v1/sellers/${profile.seller.slug}`).expect(404);
    });

    it('hides the seller of a suspended user', async () => {
      const { accessToken, userId } = await registerUser('Banned Owner');
      const profile = await getMyProfile(accessToken);
      await prisma.user.update({ where: { id: userId }, data: { status: 'BANNED' } });

      await request(server).get(`/api/v1/sellers/${profile.seller.slug}`).expect(404);
    });
  });
});
