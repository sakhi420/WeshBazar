/**
 * Shared bootstrap configuration.
 *
 * `main.ts` and the e2e tests both build the application through these helpers
 * so the transport setup (request IDs, security headers, CORS, prefix,
 * plugins, Swagger) is identical in production and under test.
 *
 * IMPORTANT: no custom Fastify `setErrorHandler` is installed here. Nest's
 * router layer already installs a root error handler that funnels
 * transport-level failures (malformed JSON, oversized bodies, unsupported
 * media types) through the global exception filter — overriding it triggers
 * Fastify's FSTWRN004 warning and replaces Nest's exception layer.
 */
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import path from 'node:path';
import { RequestMethod } from '@nestjs/common';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { SwaggerModule } from '@nestjs/swagger';
import { buildSwaggerConfig } from './common/http/openapi-document.js';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import type { Env } from './config/env.schema';

/** JSON body limit for regular endpoints (uploads use multipart). */
const JSON_BODY_LIMIT_BYTES = 1024 * 1024;

/** Accept only sane, log-safe request IDs from clients. */
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function createRequestIdGenerator(
  trustRequestIdHeader: boolean,
): (request: IncomingMessage) => string {
  return (request: IncomingMessage): string => {
    if (trustRequestIdHeader) {
      const header = request.headers['x-request-id'];
      const candidate = Array.isArray(header) ? header[0] : header;
      if (typeof candidate === 'string' && REQUEST_ID_PATTERN.test(candidate)) {
        return candidate;
      }
    }
    return randomUUID();
  };
}

export function createFastifyAdapter(env: Env): FastifyAdapter {
  return new FastifyAdapter({
    trustProxy: env.TRUST_PROXY,
    bodyLimit: JSON_BODY_LIMIT_BYTES,
    genReqId: createRequestIdGenerator(env.TRUST_REQUEST_ID_HEADER),
  });
}

/**
 * Applies the transport configuration to a created Nest application.
 * Called by `main.ts` after `NestFactory.create` and by e2e tests after
 * `createNestApplication`.
 */
export async function configureApp(app: NestFastifyApplication, env: Env): Promise<void> {
  // Security headers. CSP is disabled because Swagger UI relies on inline
  // scripts; all other helmet defaults (nosniff, frameguard, referrer policy,
  // HSTS) stay on. crossOriginResourcePolicy allows serving stored media to
  // the separate frontend origin later.
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  // Cookie support (httpOnly refresh cookie) — opaque tokens, so no secret.
  await app.register(cookie);

  // Multipart limits; real parsing/validation happens in the media module.
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_UPLOAD_SIZE,
      files: env.MAX_IMAGES_PER_LISTING,
      fields: 20,
      parts: 40,
    },
  });

  // Serve locally stored media (spec §64: local storage is dev-only). Keys
  // are unique per upload, so immutable caching is safe; production swaps in
  // object storage and serves media from the CDN instead.
  if (env.STORAGE_PROVIDER === 'local') {
    const storageRoot = path.resolve(env.LOCAL_STORAGE_PATH);
    await mkdir(storageRoot, { recursive: true });
    await app.register(fastifyStatic, {
      root: storageRoot,
      prefix: '/media/',
      decorateReply: false,
      maxAge: '1d',
      immutable: true,
    });
  }

  app.setGlobalPrefix('api/v1', {
    exclude: [
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
    ],
  });

  app.enableCors({
    origin: env.CORS_ALLOWED_ORIGINS.length > 0 ? env.CORS_ALLOWED_ORIGINS : false,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['x-request-id'],
    maxAge: 600,
  });

  // Echo the request id on every response, including 404s and errors.
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id);
    done();
  });

  if (env.SWAGGER_ENABLED) {
    const document = SwaggerModule.createDocument(app, buildSwaggerConfig(env));
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
    });
  }
}
