/**
 * Security hardening e2e — boots the real application (test database) and
 * asserts the transport-level security posture that no other suite covers:
 *
 *   - Helmet security headers (anti-sniffing, clickjacking, referrer policy,
 *     DNS prefetch control, download/permitted-cross-domain policies, CORP)
 *   - deliberate CSP opt-out (Swagger UI) and absence of the Fastify/Express
 *     `X-Powered-By` server-fingerprint header
 *   - CORS: an allow-listed origin is reflected with credentials, while an
 *     unlisted origin is never reflected (no wildcard / open reflection)
 *
 * This complements `app-foundation.e2e-spec.ts` (error envelopes, auth guard)
 * and `auth.e2e-spec.ts` (rate limiting, token/session security). It is the
 * sole member of the `test:security` target (`--testPathPatterns=security`).
 */
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { validateEnv } from '../../src/config/env.schema';

/** Public read-only route used as the representative API surface. */
const ROUTE = '/api/v1/locations/provinces';

describe('Security hardening (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;

  beforeAll(async () => {
    const env = validateEnv(process.env);
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter(env));
    app.useLogger(false);
    await configureApp(app, env);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('security headers (Helmet)', () => {
    it('applies the anti-sniffing and clickjacking headers', async () => {
      const response = await request(server).get(ROUTE).expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['referrer-policy']).toBe('no-referrer');
      expect(response.headers['x-dns-prefetch-control']).toBe('off');
      expect(response.headers['x-download-options']).toBe('noopen');
      expect(response.headers['x-permitted-cross-domain-policies']).toBe('none');
      expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });

    it('keeps CSP disabled and never leaks the server stack', async () => {
      const response = await request(server).get(ROUTE).expect(200);

      // CSP is deliberately disabled (Swagger UI relies on inline scripts);
      // the app must not silently ship a default allow-list of its own.
      expect(response.headers['content-security-policy']).toBeUndefined();
      // Fastify does not emit X-Powered-By, and Helmet strips it on frameworks
      // that do — either way it must never leak the runtime.
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS policy', () => {
    it('reflects an allow-listed origin with credentials', async () => {
      const response = await request(server)
        .get(ROUTE)
        .set('origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does not reflect an unlisted origin', async () => {
      const response = await request(server)
        .get(ROUTE)
        .set('origin', 'https://evil.example')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});