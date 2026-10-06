/**
 * Application root module.
 *
 * Cross-cutting infrastructure is wired here once, as `APP_*` providers, so it
 * also applies inside e2e tests that boot the module with `Test.createTestingModule`:
 *
 *   - ConfigModule    — validated, namespaced configuration (fails fast on invalid env)
 *   - LoggingModule   — pino structured logging
 *   - PrismaModule    — global database access
 *   - APP_FILTER      — standard error envelope
 *   - APP_INTERCEPTOR — standard success envelope
 *   - APP_PIPE        — strict DTO validation (whitelist + transform)
 *   - APP_GUARD       — JWT authentication + role checks (owned by AuthModule)
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AllExceptionsFilter } from './common/errors/exception.filter';
import { ResponseEnvelopeInterceptor } from './common/http/response.interceptor';
import { RateLimitModule } from './common/rate-limit/rate-limit.module';
import { createValidationPipe } from './common/validation/validation.pipe';
import { configuration } from './config/configuration';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './database/prisma.module';
import { LoggingModule } from './logging/logging.module';
import { StorageModule } from './providers/storage/storage.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ListingsModule } from './modules/listings/listings.module';
import { LocationsModule } from './modules/locations/locations.module';
import { MediaModule } from './modules/media/media.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { TaxonomyModule } from './modules/taxonomy/taxonomy.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      // First match wins; the second entry supports running from apps/api
      // (npm workspace scripts) while the file lives at the repo root.
      envFilePath: ['.env', '../../.env'],
      load: [configuration],
      validate: validateEnv,
    }),
    LoggingModule,
    RateLimitModule,
    StorageModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    AuditModule,
    UsersModule,
    SellersModule,
    TaxonomyModule,
    LocationsModule,
    ListingsModule,
    MediaModule,
    ContactsModule,
    FavoritesModule,
    ReportsModule,
    AdminModule,
    JobsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_PIPE, useFactory: createValidationPipe },
  ],
})
export class AppModule {}
