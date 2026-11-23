/**
 * Auth e2e — boots the real application (test database) and covers every
 * security-sensitive path of the auth module:
 *
 *   - registration (envelope, cookie, unverified state, duplicates, policy)
 *   - phone verification (wrong/right code, resend cooldown, attempt limit)
 *   - login (generic failures, lockout, per-IP/per-phone rate limiting)
 *   - refresh rotation (cookie transport, replay detection, family revocation)
 *   - session management (listing, revocation, ownership isolation)
 *   - logout / logout-all
 *   - password change and reset (session revocation policy)
 *   - phone change (password gate, OTP, old-number invalidation)
 *   - account-existence enumeration parity
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
import type { VerificationPurpose } from '../../src/generated/prisma/enums';
import { MockSmsProvider } from '../../src/providers/sms/mock-sms.provider';

const REFRESH_COOKIE_NAME = 'weshbazar_refresh';
const PASSWORD = 'S3cure!Pass';

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

interface AuthData {
  user: {
    id: string;
    phone: string;
    displayName: string;
    role: string;
    status: string;
    phoneVerified: boolean;
  };
  tokens: {
    accessToken: string;
    accessTokenExpiresInSeconds: number;
    refreshToken: string;
    refreshTokenExpiresInSeconds: number;
  };
  session: { id: string; expiresAt: string };
}

interface SessionSummary {
  id: string;
  current: boolean;
}

interface TestUser {
  phone: string;
  password: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

let phoneSeed = 0;

/** Random, valid Afghan mobile number (unique enough across runs). */
function uniquePhone(): string {
  phoneSeed += 1;
  const suffix = String((randomInt(0, 9_000_000) + phoneSeed) % 10_000_000).padStart(7, '0');
  return `+9370${suffix}`;
}

describe('Auth (e2e)', () => {
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
    // Keep rate-limit state isolated per test (the limiter is per-process).
    rateLimitService.reset();
    sms.clear();
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      // Seller accounts reference users with onDelete: Restrict — remove them
      // first; users then cascade to refresh sessions and OTP challenges.
      await prisma.sellerAccount.deleteMany({ where: { ownerUserId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
    await app.close();
  });

  // --- Helpers -----------------------------------------------------------------

  async function registerUser(password: string = PASSWORD): Promise<TestUser> {
    const phone = uniquePhone();
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send({ phone, password })
      .expect(201);

    const body = response.body as SuccessEnvelope<AuthData>;
    createdUserIds.push(body.data.user.id);
    return {
      phone,
      password,
      userId: body.data.user.id,
      accessToken: body.data.tokens.accessToken,
      refreshToken: body.data.tokens.refreshToken,
      sessionId: body.data.session.id,
    };
  }

  async function loginUser(phone: string, password: string): Promise<SuccessEnvelope<AuthData>> {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({ phone, password })
      .expect(200);
    return response.body as SuccessEnvelope<AuthData>;
  }

  function asUser(user: TestUser): { Authorization: string } {
    return { Authorization: `Bearer ${user.accessToken}` };
  }

  function refreshCookiePair(response: request.Response): string {
    const header = response.headers['set-cookie'];
    const cookies = Array.isArray(header) ? header : header ? [header] : [];
    const cookie = cookies.find((value) => value.startsWith(`${REFRESH_COOKIE_NAME}=`));
    if (!cookie) {
      throw new Error('refresh cookie missing from response');
    }
    return cookie.split(';')[0];
  }

  function lastCode(phone: string, purpose: VerificationPurpose): string {
    const code = sms.getLastCode(phone, purpose);
    if (!code) {
      throw new Error(`no ${purpose} code delivered to ${phone}`);
    }
    return code;
  }

  function errorOf(response: request.Response): ErrorEnvelope['error'] {
    return (response.body as ErrorEnvelope).error;
  }

  // --- Registration ----------------------------------------------------------------

  describe('registration', () => {
    it('creates an unverified account, delivers a code and starts a session', async () => {
      const phone = uniquePhone();
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ phone, password: PASSWORD })
        .expect(201);

      const body = response.body as SuccessEnvelope<AuthData>;
      createdUserIds.push(body.data.user.id);

      expect(body.success).toBe(true);
      expect(body.data.user.phoneVerified).toBe(false);
      expect(body.data.user.role).toBe('USER');
      expect(body.data.tokens.accessToken.length).toBeGreaterThan(20);
      expect(body.data.tokens.refreshToken.length).toBeGreaterThan(20);
      expect(body.data.tokens.accessTokenExpiresInSeconds).toBe(900);
      expect(JSON.stringify(body)).not.toContain('passwordHash');

      // HttpOnly refresh cookie scoped to the auth endpoints.
      const setCookie = response.headers['set-cookie'];
      const rawCookie = (Array.isArray(setCookie) ? setCookie : [setCookie]).find((value) =>
        value?.startsWith(`${REFRESH_COOKIE_NAME}=`),
      );
      expect(rawCookie).toMatch(/HttpOnly/i);
      expect(rawCookie).toMatch(/Path=\/api\/v1\/auth/i);

      // A REGISTER challenge was issued and delivered.
      expect(sms.getLastCode(phone, 'REGISTER')).toMatch(/^\d{6}$/);

      // The issued access token works and reports the unverified state.
      const me = await request(server)
        .get('/api/v1/auth/me')
        .set('authorization', `Bearer ${body.data.tokens.accessToken}`)
        .expect(200);
      const meBody = me.body as SuccessEnvelope<{ user: AuthData['user'] }>;
      expect(meBody.data.user.phoneVerified).toBe(false);
    });

    it('returns validation details in the frozen API v1 field/message array shape', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ password: PASSWORD })
        .expect(400);

      const error = errorOf(response);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'phone', message: expect.any(String) }),
        ]),
      );
    });

    it('rejects a duplicate phone number with PHONE_ALREADY_REGISTERED', async () => {
      const user = await registerUser();
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ phone: user.phone, password: PASSWORD })
        .expect(409);

      expect(errorOf(response).code).toBe('PHONE_ALREADY_REGISTERED');
    });

    it('reports password-policy violations per rule', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ phone: uniquePhone(), password: 'short' })
        .expect(400);

      const error = errorOf(response);
      expect(error.code).toBe('WEAK_PASSWORD');
      const violations = (error.details as { violations: Array<{ rule: string }> }).violations;
      expect(violations.map((violation) => violation.rule)).toEqual(
        expect.arrayContaining(['minLength']),
      );
    });

    it('rejects invalid phone numbers with INVALID_PHONE_NUMBER', async () => {
      const response = await request(server)
        .post('/api/v1/auth/register')
        .send({ phone: '12345', password: PASSWORD })
        .expect(400);

      expect(errorOf(response).code).toBe('INVALID_PHONE_NUMBER');
    });
  });

  // --- Phone verification ------------------------------------------------------------

  describe('phone verification', () => {
    it('rejects a wrong code and reports remaining attempts', async () => {
      const user = await registerUser();
      const code = lastCode(user.phone, 'REGISTER');
      const wrongCode = code === '000000' ? '000001' : '000000';

      const response = await request(server)
        .post('/api/v1/auth/verify-phone')
        .set(asUser(user))
        .send({ code: wrongCode })
        .expect(400);

      const error = errorOf(response);
      expect(error.code).toBe('OTP_INVALID');
      expect(error.details).toEqual({ attemptsRemaining: 4 });
    });

    it('verifies the phone with the delivered code and is idempotent afterwards', async () => {
      const user = await registerUser();
      const code = lastCode(user.phone, 'REGISTER');

      const response = await request(server)
        .post('/api/v1/auth/verify-phone')
        .set(asUser(user))
        .send({ code })
        .expect(200);

      const body = response.body as SuccessEnvelope<{ user: AuthData['user'] }>;
      expect(body.data.user.phoneVerified).toBe(true);

      // Idempotent: a second call with any code succeeds (already verified).
      await request(server)
        .post('/api/v1/auth/verify-phone')
        .set(asUser(user))
        .send({ code: '999999' })
        .expect(200);

      const me = await request(server).get('/api/v1/auth/me').set(asUser(user)).expect(200);
      expect((me.body as SuccessEnvelope<{ user: AuthData['user'] }>).data.user.phoneVerified).toBe(
        true,
      );
    });

    it('enforces the resend cooldown', async () => {
      const user = await registerUser();
      const response = await request(server)
        .post('/api/v1/auth/verify-phone/resend')
        .set(asUser(user))
        .send({})
        .expect(429);

      const error = errorOf(response);
      expect(error.code).toBe('OTP_RESEND_TOO_SOON');
      expect((error.details as { retryAfterSeconds: number }).retryAfterSeconds).toBeGreaterThan(0);
    });

    it('locks the challenge after the attempt limit and never accepts the right code', async () => {
      const user = await registerUser();
      const code = lastCode(user.phone, 'REGISTER');
      const wrongCode = code === '000000' ? '000001' : '000000';

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const response = await request(server)
          .post('/api/v1/auth/verify-phone')
          .set(asUser(user))
          .send({ code: wrongCode })
          .expect(400);
        expect(errorOf(response).code).toBe('OTP_INVALID');
      }

      const exhausted = await request(server)
        .post('/api/v1/auth/verify-phone')
        .set(asUser(user))
        .send({ code: wrongCode })
        .expect(429);
      expect(errorOf(exhausted).code).toBe('OTP_MAX_ATTEMPTS_EXCEEDED');

      const withCorrect = await request(server)
        .post('/api/v1/auth/verify-phone')
        .set(asUser(user))
        .send({ code })
        .expect(429);
      expect(errorOf(withCorrect).code).toBe('OTP_MAX_ATTEMPTS_EXCEEDED');
    });
  });

  // --- Login -------------------------------------------------------------------------

  describe('login', () => {
    it('fails with a generic INVALID_CREDENTIALS for wrong passwords', async () => {
      const user = await registerUser();
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: 'Wrong!Pass1' })
        .expect(401);

      const error = errorOf(response);
      expect(error.code).toBe('INVALID_CREDENTIALS');
      expect(error.message).toBe('The phone number or password is incorrect.');
    });

    it('fails with the same generic code for unknown phone numbers', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: uniquePhone(), password: PASSWORD })
        .expect(401);

      expect(errorOf(response).code).toBe('INVALID_CREDENTIALS');
    });

    it('locks the account after repeated failures and blocks the correct password', async () => {
      const user = await registerUser();
      const wrong = 'Wrong!Pass1';

      for (let attempt = 1; attempt <= 4; attempt += 1) {
        const response = await request(server)
          .post('/api/v1/auth/login')
          .send({ phone: user.phone, password: wrong })
          .expect(401);
        expect(errorOf(response).code).toBe('INVALID_CREDENTIALS');
      }

      const locked = await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: wrong })
        .expect(403);
      const error = errorOf(locked);
      expect(error.code).toBe('ACCOUNT_LOCKED');
      expect(typeof (error.details as { lockedUntil: string }).lockedUntil).toBe('string');

      // Even the correct password is rejected while locked.
      const stillLocked = await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: user.password })
        .expect(403);
      expect(errorOf(stillLocked).code).toBe('ACCOUNT_LOCKED');
    });

    it('rate limits sign-in attempts per window', async () => {
      const phone = uniquePhone();
      for (let attempt = 1; attempt <= 10; attempt += 1) {
        await request(server)
          .post('/api/v1/auth/login')
          .send({ phone, password: PASSWORD })
          .expect(401);
      }

      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({ phone, password: PASSWORD })
        .expect(429);

      const error = errorOf(response);
      expect(error.code).toBe('RATE_LIMITED');
      expect(typeof (error.details as { retryAfterSeconds: number }).retryAfterSeconds).toBe(
        'number',
      );
    });
  });

  // --- Refresh rotation -------------------------------------------------------------

  describe('refresh rotation', () => {
    it('rotates tokens and detects replay by revoking the whole family', async () => {
      const user = await registerUser();

      const first = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);
      const firstBody = first.body as SuccessEnvelope<AuthData>;
      const secondToken = firstBody.data.tokens.refreshToken;
      expect(secondToken).not.toBe(user.refreshToken);

      // Replaying the rotated token is reuse evidence: 401 + family revoked.
      const replay = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
      expect(errorOf(replay).code).toBe('SESSION_REUSE_DETECTED');

      // The successor token died with the family.
      const successor = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: secondToken })
        .expect(401);
      expect(errorOf(successor).code).toBe('SESSION_REUSE_DETECTED');
    });

    it('refresh works through the HttpOnly cookie transport', async () => {
      const user = await registerUser();
      const login = await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: user.password })
        .expect(200);

      const cookiePair = refreshCookiePair(login);
      const response = await request(server)
        .post('/api/v1/auth/refresh')
        .set('cookie', cookiePair)
        .send({})
        .expect(200);

      const body = response.body as SuccessEnvelope<AuthData>;
      expect(body.data.tokens.accessToken.length).toBeGreaterThan(20);
      // A fresh cookie is set on rotation.
      expect(refreshCookiePair(response)).not.toBe(cookiePair);
    });

    it('rejects unknown and missing refresh tokens', async () => {
      const invalid = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'definitely-not-a-real-token' })
        .expect(401);
      expect(errorOf(invalid).code).toBe('REFRESH_TOKEN_INVALID');

      const missing = await request(server).post('/api/v1/auth/refresh').send({}).expect(401);
      expect(errorOf(missing).code).toBe('REFRESH_TOKEN_MISSING');
    });
  });

  // --- Session management -------------------------------------------------------------

  describe('sessions', () => {
    it('lists sessions, marks the current one and revokes one by one', async () => {
      const user = await registerUser();
      const login = await loginUser(user.phone, user.password);

      const list = await request(server).get('/api/v1/auth/sessions').set(asUser(user)).expect(200);
      const sessions = (list.body as SuccessEnvelope<SessionSummary[]>).data;
      expect(sessions).toHaveLength(2);
      expect(sessions.filter((session) => session.current)).toHaveLength(1);
      expect(sessions.find((session) => session.current)?.id).toBe(user.sessionId);

      const other = sessions.find((session) => session.id !== user.sessionId);
      expect(other).toBeDefined();

      await request(server)
        .delete(`/api/v1/auth/sessions/${other?.id ?? ''}`)
        .set(asUser(user))
        .expect(204);

      const after = await request(server)
        .get('/api/v1/auth/sessions')
        .set(asUser(user))
        .expect(200);
      expect((after.body as SuccessEnvelope<SessionSummary[]>).data).toHaveLength(1);

      // The revoked device cannot refresh anymore.
      const replay = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: login.data.tokens.refreshToken })
        .expect(401);
      expect(errorOf(replay).code).toBe('SESSION_REVOKED');
    });

    it('cannot revoke unknown or foreign sessions', async () => {
      const userA = await registerUser();
      const userB = await registerUser();

      const missing = await request(server)
        .delete('/api/v1/auth/sessions/3f1e2d3c-4b5a-4c6d-8e7f-9a0b1c2d3e4f')
        .set(asUser(userA))
        .expect(404);
      expect(errorOf(missing).code).toBe('SESSION_NOT_FOUND');

      const foreign = await request(server)
        .delete(`/api/v1/auth/sessions/${userB.sessionId}`)
        .set(asUser(userA))
        .expect(404);
      expect(errorOf(foreign).code).toBe('SESSION_NOT_FOUND');

      // userB's session is untouched.
      const listB = await request(server)
        .get('/api/v1/auth/sessions')
        .set(asUser(userB))
        .expect(200);
      expect((listB.body as SuccessEnvelope<SessionSummary[]>).data).toHaveLength(1);
    });

    it('logout revokes the current session (SESSION_REVOKED on later refresh)', async () => {
      const user = await registerUser();

      await request(server).post('/api/v1/auth/logout').set(asUser(user)).send({}).expect(204);

      const replay = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
      expect(errorOf(replay).code).toBe('SESSION_REVOKED');
    });

    it('logout-all revokes every session of the account', async () => {
      const user = await registerUser();
      const login = await loginUser(user.phone, user.password);

      const response = await request(server)
        .post('/api/v1/auth/logout-all')
        .set(asUser(user))
        .send({})
        .expect(200);
      expect((response.body as SuccessEnvelope<{ revokedCount: number }>).data.revokedCount).toBe(
        2,
      );

      const list = await request(server).get('/api/v1/auth/sessions').set(asUser(user)).expect(200);
      expect((list.body as SuccessEnvelope<SessionSummary[]>).data).toHaveLength(0);

      for (const token of [user.refreshToken, login.data.tokens.refreshToken]) {
        const replay = await request(server)
          .post('/api/v1/auth/refresh')
          .send({ refreshToken: token })
          .expect(401);
        expect(errorOf(replay).code).toBe('SESSION_REVOKED');
      }
    });
  });

  // --- Password change ------------------------------------------------------------------

  describe('password change', () => {
    it('rejects a wrong current password', async () => {
      const user = await registerUser();
      const response = await request(server)
        .post('/api/v1/auth/change-password')
        .set(asUser(user))
        .send({ currentPassword: 'Wrong!Pass1', newPassword: 'N3w!Passw0rd' })
        .expect(400);

      expect(errorOf(response).code).toBe('CURRENT_PASSWORD_INCORRECT');
    });

    it('changes the password, keeps the current session and revokes the others', async () => {
      const user = await registerUser();
      const otherLogin = await loginUser(user.phone, user.password);

      await request(server)
        .post('/api/v1/auth/change-password')
        .set(asUser(user))
        .send({ currentPassword: user.password, newPassword: 'N3w!Passw0rd' })
        .expect(204);

      // Other device must re-authenticate.
      const otherReplay = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: otherLogin.data.tokens.refreshToken })
        .expect(401);
      expect(errorOf(otherReplay).code).toBe('SESSION_REVOKED');

      // Current session still refreshes.
      await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      // Old password no longer signs in; the new one does.
      await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: user.password })
        .expect(401);
      await loginUser(user.phone, 'N3w!Passw0rd');
    });
  });

  // --- Forgot / reset password -----------------------------------------------------------

  describe('password reset', () => {
    it('answers identically whether or not the account exists', async () => {
      const user = await registerUser();

      const known = await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({ phone: user.phone })
        .expect(200);
      const unknown = await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({ phone: uniquePhone() })
        .expect(200);

      const messageOf = (response: request.Response): string =>
        (response.body as SuccessEnvelope<{ message: string }>).data.message;
      expect(messageOf(known)).toBe(messageOf(unknown));
    });

    it('resets the password with the SMS code and revokes every session', async () => {
      const user = await registerUser();

      await request(server)
        .post('/api/v1/auth/forgot-password')
        .send({ phone: user.phone })
        .expect(200);
      const code = lastCode(user.phone, 'PASSWORD_RESET');

      // Wrong code first: no reset, attempt counted.
      const wrong = await request(server)
        .post('/api/v1/auth/reset-password')
        .send({
          phone: user.phone,
          code: '000000' === code ? '000001' : '000000',
          newPassword: 'N3w!Passw0rd',
        })
        .expect(400);
      expect(errorOf(wrong).code).toBe('OTP_INVALID');

      await request(server)
        .post('/api/v1/auth/reset-password')
        .send({ phone: user.phone, code, newPassword: 'N3w!Passw0rd' })
        .expect(204);

      // All sessions died.
      const replay = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
      expect(errorOf(replay).code).toBe('SESSION_REVOKED');

      // New password signs in; old does not.
      await loginUser(user.phone, 'N3w!Passw0rd');
      await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: user.password })
        .expect(401);

      // The used code cannot be replayed.
      const reuse = await request(server)
        .post('/api/v1/auth/reset-password')
        .send({ phone: user.phone, code, newPassword: 'An0ther!Pass' })
        .expect(400);
      expect(errorOf(reuse).code).toBe('OTP_EXPIRED');
    });
  });

  // --- Phone change ------------------------------------------------------------------------

  describe('phone change', () => {
    it('requires the account password', async () => {
      const user = await registerUser();
      const response = await request(server)
        .post('/api/v1/auth/change-phone')
        .set(asUser(user))
        .send({ password: 'Wrong!Pass1', newPhone: uniquePhone() })
        .expect(400);

      expect(errorOf(response).code).toBe('CURRENT_PASSWORD_INCORRECT');
    });

    it('rejects a change to the current or an already-registered number', async () => {
      const user = await registerUser();
      const other = await registerUser();

      const unchanged = await request(server)
        .post('/api/v1/auth/change-phone')
        .set(asUser(user))
        .send({ password: user.password, newPhone: user.phone })
        .expect(400);
      expect(errorOf(unchanged).code).toBe('PHONE_UNCHANGED');

      const taken = await request(server)
        .post('/api/v1/auth/change-phone')
        .set(asUser(user))
        .send({ password: user.password, newPhone: other.phone })
        .expect(409);
      expect(errorOf(taken).code).toBe('PHONE_ALREADY_REGISTERED');
    });

    it('moves the account to the verified new number and revokes other sessions', async () => {
      const user = await registerUser();
      const otherLogin = await loginUser(user.phone, user.password);
      const newPhone = uniquePhone();

      const started = await request(server)
        .post('/api/v1/auth/change-phone')
        .set(asUser(user))
        .send({ password: user.password, newPhone })
        .expect(200);
      const startedBody = started.body as SuccessEnvelope<{ sent: boolean; newPhone: string }>;
      expect(startedBody.data.sent).toBe(true);
      expect(startedBody.data.newPhone).not.toBe(newPhone); // masked

      // Wrong code does not move the account.
      const wrong = await request(server)
        .post('/api/v1/auth/change-phone/verify')
        .set(asUser(user))
        .send({ code: '000000' })
        .expect(400);
      expect(errorOf(wrong).code).toBe('OTP_INVALID');

      const code = lastCode(newPhone, 'CHANGE_PHONE');
      const verified = await request(server)
        .post('/api/v1/auth/change-phone/verify')
        .set(asUser(user))
        .send({ code })
        .expect(200);
      const verifiedBody = verified.body as SuccessEnvelope<{ user: AuthData['user'] }>;
      expect(verifiedBody.data.user.phoneVerified).toBe(true);

      // Old number no longer signs in; the new one does.
      await request(server)
        .post('/api/v1/auth/login')
        .send({ phone: user.phone, password: user.password })
        .expect(401);
      await loginUser(newPhone, user.password);

      // The other device was revoked (phone change is security-sensitive).
      const replay = await request(server)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: otherLogin.data.tokens.refreshToken })
        .expect(401);
      expect(errorOf(replay).code).toBe('SESSION_REVOKED');

      // The current session survives and its `me` reflects the new number.
      const me = await request(server).get('/api/v1/auth/me').set(asUser(user)).expect(200);
      expect((me.body as SuccessEnvelope<{ user: AuthData['user'] }>).data.user.phone).toBe(
        newPhone,
      );
    });
  });
});
