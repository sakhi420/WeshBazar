/**
 * Admin module (spec §58–§62, §106, §161): user management, the listing and
 * report moderation queues and the moderation commands that back them.
 *
 * Imported surface:
 *   - `AuditModule` — every command writes its audit row in-transaction.
 *   - `ListingsModule` — listing commands delegate to `ListingsService` so
 *     the state machine has exactly one implementation.
 *   - `StorageModule` — image URLs on admin queues resolve like everywhere
 *     else, through the configured storage provider (§64).
 *
 * Taxonomy/locations admin controllers stay in their feature modules; the
 * audit search controller lives in `AuditModule` — this module owns the
 * queue workflows that tie them together.
 */
import { Module } from '@nestjs/common';
import { StorageModule } from '../../providers/storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { ListingsModule } from '../listings/listings.module';
import { AdminListingsController } from './admin-listings.controller';
import { AdminListingsService } from './admin-listings.service';
import { AdminReportsController } from './admin-reports.controller';
import { AdminReportsService } from './admin-reports.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [AuditModule, ListingsModule, StorageModule],
  controllers: [AdminUsersController, AdminListingsController, AdminReportsController],
  providers: [AdminUsersService, AdminListingsService, AdminReportsService],
})
export class AdminModule {}
