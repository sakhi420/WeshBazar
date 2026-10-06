/**
 * Standalone OpenAPI 3.x generator.
 *
 * Boots the Nest application (with HTTP transport wired) without calling
 * `.listen()`, then asks `@nestjs/swagger` to serialize the full spec and
 * writes it to the repo-level `docs/openapi.json` file (2-space indent).
 *
 * Run after `nest build`:
 *   node dist/scripts/generate-openapi.js
 *
 * Or via the npm script:
 *   npm run openapi:generate
 */
import 'reflect-metadata';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { config as loadDotenv } from 'dotenv';
import { AppModule } from '../app.module.js';
import { configureApp, createFastifyAdapter } from '../bootstrap.js';
import { validateEnv, type Env } from '../config/env.schema.js';

const ENV_FILES = ['.env', '../../.env'];

function loadEnvironmentFiles(): void {
  for (const file of ENV_FILES) {
    const absolutePath = resolve(process.cwd(), file);
    if (existsSync(absolutePath)) {
      loadDotenv({ path: absolutePath, quiet: true });
    }
  }
  if (!process.env.SWAGGER_ENABLED) {
    process.env.SWAGGER_ENABLED = 'true';
  }
}

const OUTPUT_PATH = resolve(process.cwd(), '../../docs/openapi.json');

export async function generateOpenapiDocument() {
  loadEnvironmentFiles();
  const env: Env = validateEnv(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    createFastifyAdapter(env),
    { bufferLogs: true, abortOnError: false },
  );
  await configureApp(app, env);
  await app.init();

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('WeshBazar API')
      .setDescription(
        'Afghanistan C2C marketplace API (v1). All endpoints return the standard ' +
          'success/error envelope: { success, data|error, meta?, requestId }.',
      )
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
      .addCookieAuth(env.REFRESH_COOKIE_NAME, {
        type: 'apiKey',
        in: 'cookie',
        name: env.REFRESH_COOKIE_NAME,
        description:
          'HttpOnly refresh cookie (sent automatically by the browser to /api/v1/auth only).',
      }, 'refresh-cookie')
      .build(),
  );

  await app.close();

  return document;
}

export function summarizeDocument(document: {
  openapi?: string;
  paths?: Record<string, unknown>;
  components?: { schemas?: Record<string, unknown> };
}) {
  const paths = Object.keys(document.paths ?? {}).length;
  const operationIds = new Set<string>();
  for (const pathItem of Object.values(document.paths ?? {})) {
    for (const op of Object.values(pathItem as Record<string, { operationId?: string }>)) {
      if (op && typeof op === 'object' && op.operationId) {
        operationIds.add(op.operationId);
      }
    }
  }
  const duplicateOperationIds: string[] = [];
  const seen = new Set<string>();
  for (const id of operationIds) {
    if (seen.has(id)) duplicateOperationIds.push(id);
    seen.add(id);
  }
  const schemas = Object.keys(document.components?.schemas ?? {}).length;
  return {
    openapiVersion: document.openapi ?? 'unknown',
    paths,
    operationIdsCount: operationIds.size,
    duplicateOperationIds,
    schemas,
  };
}

async function main(): Promise<void> {
  const document = await generateOpenapiDocument();
  const summary = summarizeDocument(document);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(document, null, 2) + '\n', 'utf8');

  // eslint-disable-next-line no-console
  console.log(
    `[openapi] wrote ${OUTPUT_PATH}\n` +
      `  paths       : ${summary.paths}\n` +
      `  operationIds: ${summary.operationIdsCount}\n` +
      `  schemas     : ${summary.schemas}\n` +
      `  version     : ${summary.openapiVersion}`,
  );

  if (summary.duplicateOperationIds.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[openapi] WARNING: duplicate operationIds detected: ${summary.duplicateOperationIds.join(', ')}`);
  }
  // eslint-disable-next-line no-process-exit
  process.exit(0);
}

const IS_DIRECT_RUN = process.argv[1]?.replace(/\\/g, '/').endsWith('/generate-openapi.js') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('/generate-openapi.ts') ||
  false;

if (IS_DIRECT_RUN) {
  main().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error(
      'Fatal OpenAPI generation error:',
      error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : String(error),
    );
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
}
