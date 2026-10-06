/**
 * App foundation e2e — boots the real application (test database) plus a
 * probe controller and proves the transport pipeline end-to-end:
 *
 *   - success envelope `{ success, data, requestId }` on every response
 *   - 204 responses stay body-less
 *   - domain errors (AppException) map to the catalog code and status
 *   - unexpected errors become a generic INTERNAL_ERROR without leaking details
 *   - DTO validation failures produce VALIDATION_ERROR with field details
 *   - transport-level failures (malformed JSON, unsupported media type,
 *     oversized body) also produce the standard error envelope — these flow
 *     through Nest's root error handler into the global exception filter
 *   - request IDs: echoed on the header, present in the envelope, and
 *     client-supplied values ignored unless TRUST_REQUEST_ID_HEADER is set
 *   - health probes stay outside the /api/v1 prefix and report database state
 */
import { Body, Controller, Get, HttpCode, Module, Post } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { IsNotEmpty, IsString } from 'class-validator';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/bootstrap';
import { AppException } from '../../src/common/errors/app.exception';
import { Public } from '../../src/common/decorators/public.decorator';
import { validateEnv } from '../../src/config/env.schema';

interface ErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { errors?: Array<{ field: string; messages: string[] }> };
  };
  requestId: string;
}

class EchoDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@Controller('__e2e')
class E2eProbeController {
  @Public()
  @Get('ok')
  ok(): { value: number } {
    return { value: 42 };
  }

  @Public()
  @Get('empty')
  @HttpCode(204)
  empty(): void {
    // 204: must produce a body-less response.
  }

  @Public()
  @Get('missing')
  missing(): never {
    throw new AppException('LISTING_NOT_FOUND');
  }

  @Public()
  @Get('boom')
  boom(): never {
    throw new Error('internal detail that must not leak');
  }

  @Public()
  @Post('echo')
  echo(@Body() dto: EchoDto): { echo: string } {
    return { echo: dto.message };
  }

  /** Deliberately NOT @Public: exercises the global JwtAuthGuard. */
  @Get('protected')
  protected(): { secret: boolean } {
    return { secret: true };
  }
}

@Module({ controllers: [E2eProbeController] })
class E2eProbeModule {}

describe('App foundation (e2e)', () => {
  let app: NestFastifyApplication;
  let server: ReturnType<NestFastifyApplication['getHttpServer']>;

  beforeAll(async () => {
    const env = validateEnv(process.env);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, E2eProbeModule],
    }).compile();

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

  describe('success responses', () => {
    it('wraps data in the success envelope and echoes the request id', async () => {
      const response = await request(server).get('/api/v1/__e2e/ok').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { value: 42 },
        requestId: expect.any(String),
      });
      expect(response.headers['x-request-id']).toBe(response.body.requestId);
    });

    it('keeps 204 responses body-less', async () => {
      const response = await request(server).get('/api/v1/__e2e/empty').expect(204);
      expect(response.text).toBe('');
    });

    it('ignores client-supplied request ids unless trust is enabled', async () => {
      const response = await request(server)
        .get('/api/v1/__e2e/ok')
        .set('x-request-id', 'client-supplied-1234')
        .expect(200);

      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).not.toBe('client-supplied-1234');
    });
  });

  describe('error responses', () => {
    it('maps domain exceptions to their catalog code and status', async () => {
      const response = await request(server).get('/api/v1/__e2e/missing').expect(404);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('LISTING_NOT_FOUND');
      expect(body.error.message).toBe('Listing not found.');
      expect(body.requestId).toBe(response.headers['x-request-id']);
    });

    it('turns unexpected errors into a generic INTERNAL_ERROR without leaking details', async () => {
      const response = await request(server).get('/api/v1/__e2e/boom').expect(500);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toBe('An unexpected error occurred.');
      expect(body.error.details).toBeUndefined();
      expect(JSON.stringify(body)).not.toContain('must not leak');
    });

    it('reports validation failures with per-field details', async () => {
      const missingField = await request(server).post('/api/v1/__e2e/echo').send({}).expect(400);

      const missingBody = missingField.body as ErrorEnvelope;
      expect(missingBody.error.code).toBe('VALIDATION_ERROR');
      expect(missingBody.error.details?.errors?.[0]?.field).toBe('message');

      const unknownField = await request(server)
        .post('/api/v1/__e2e/echo')
        .send({ message: 'hello', notAllowed: true })
        .expect(400);

      expect((unknownField.body as ErrorEnvelope).error.code).toBe('VALIDATION_ERROR');
    });

    it('returns an envelope for malformed JSON bodies (pre-Nest transport path)', async () => {
      const response = await request(server)
        .post('/api/v1/__e2e/echo')
        .set('content-type', 'application/json')
        .send('{"message": ')
        .expect(400);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('BAD_REQUEST');
      expect(body.requestId).toBe(response.headers['x-request-id']);
    });

    it('rejects unsupported media types with the standard envelope', async () => {
      const response = await request(server)
        .post('/api/v1/__e2e/echo')
        .set('content-type', 'application/xml')
        .send('<message>hi</message>')
        .expect(415);

      expect((response.body as ErrorEnvelope).error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    });

    it('rejects oversized JSON bodies with the standard envelope', async () => {
      const response = await request(server)
        .post('/api/v1/__e2e/echo')
        .send({ message: 'x'.repeat(2 * 1024 * 1024) })
        .expect(413);

      expect((response.body as ErrorEnvelope).error.code).toBe('PAYLOAD_TOO_LARGE');
    });

    it('returns a NOT_FOUND envelope for unknown routes', async () => {
      const response = await request(server).get('/api/v1/no-such-route').expect(404);
      expect((response.body as ErrorEnvelope).error.code).toBe('NOT_FOUND');
    });
  });

  describe('authentication guard', () => {
    it('rejects unauthenticated access to protected routes with UNAUTHORIZED', async () => {
      const response = await request(server).get('/api/v1/__e2e/protected').expect(401);

      const body = response.body as ErrorEnvelope;
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
      expect(body.requestId).toBe(response.headers['x-request-id']);
    });

    it('rejects malformed bearer tokens with TOKEN_INVALID', async () => {
      const response = await request(server)
        .get('/api/v1/__e2e/protected')
        .set('authorization', 'Bearer not-a-real-token')
        .expect(401);

      expect((response.body as ErrorEnvelope).error.code).toBe('TOKEN_INVALID');
    });
  });

  describe('health probes', () => {
    it('serves /health/live outside the API prefix', async () => {
      const response = await request(server).get('/health/live').expect(200);
      expect((response.body as { success: boolean; data: { status: string } }).data.status).toBe(
        'ok',
      );
    });

    it('serves /health/ready with the database check satisfied', async () => {
      const response = await request(server).get('/health/ready').expect(200);
      const body = response.body as {
        success: boolean;
        data: { status: string; checks: { database: { status: string } } };
      };
      expect(body.data.status).toBe('ok');
      expect(body.data.checks.database.status).toBe('ok');
    });
  });
});
