/**
 * Prisma database access.
 *
 * Prisma 7 requires a driver adapter: the generated client is constructed with
 * `@prisma/adapter-pg` backed by a `pg` connection pool whose size/timeouts
 * come from validated configuration. The service is the only component that
 * knows about connection details; feature modules inject `PrismaService`.
 *
 * Startup deliberately does NOT crash when the database is unreachable: the
 * process stays alive (liveness) while `/health/ready` reports the failure
 * until the database becomes available.
 */
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { AppConfig } from '../config/config.types';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService<AppConfig, true>) {
    const database = configService.get('database', { infer: true });
    super({
      adapter: new PrismaPg({
        connectionString: database.url,
        max: database.poolMax,
        connectionTimeoutMillis: database.poolConnectTimeoutMs,
        idleTimeoutMillis: database.poolIdleTimeoutMs,
        // The pg adapter normalizes timestamp results by replacing the
        // server-rendered UTC offset with `+00:00` and encodes parameters as
        // naive UTC wall-clock strings — both are only sound when the session
        // runs in UTC. With a local server timezone, stored instants would be
        // silently skewed by the UTC offset (breaking raw SQL comparisons).
        options: '-c timezone=UTC',
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.warn(
        `Database is not reachable at startup; readiness will report unavailable until it is: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /**
   * Cheap connectivity probe used by the readiness endpoint. Returns the
   * round-trip latency in milliseconds; throws when the database is down.
   */
  async ping(): Promise<number> {
    const startedAt = Date.now();
    await this.$queryRaw`SELECT 1`;
    return Date.now() - startedAt;
  }
}
