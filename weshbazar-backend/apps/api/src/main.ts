/**
 * Application bootstrap.
 *
 * Loads `.env` files before Nest exists (so the environment can be validated
 * and Fastify constructed from trusted settings), then wires the shared
 * transport configuration from `bootstrap.ts`. All request/response/error
 * envelope behavior lives in `AppModule` providers, not here.
 */
import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { config as loadDotenv } from 'dotenv';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { configureApp, createFastifyAdapter } from './bootstrap';
import { validateEnv, type Env } from './config/env.schema';

/** `.env` files resolved relative to the current working directory. */
const ENV_FILES = ['.env', '../../.env'];

function loadEnvironmentFiles(): void {
  for (const file of ENV_FILES) {
    const absolutePath = resolve(process.cwd(), file);
    if (existsSync(absolutePath)) {
      // Never overrides already-set process.env values.
      loadDotenv({ path: absolutePath, quiet: true });
    }
  }
}

async function bootstrap(): Promise<void> {
  loadEnvironmentFiles();
  const env: Env = validateEnv(process.env);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    createFastifyAdapter(env),
    { bufferLogs: true },
  );
  app.useLogger(app.get(PinoLogger));
  const logger = app.get(PinoLogger);

  await configureApp(app, env);
  app.enableShutdownHooks();

  await app.listen(env.PORT, '0.0.0.0');
  logger.log(
    `WeshBazar API listening on http://0.0.0.0:${env.PORT} (env: ${env.NODE_ENV}, docs: ${
      env.SWAGGER_ENABLED ? '/docs' : 'disabled'
    })`,
  );
}

bootstrap().catch((error: unknown) => {
  // The Nest logger may not exist yet if configuration itself failed.
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
