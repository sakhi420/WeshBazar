/**
 * Listings feature module: the listing state machine, revision history,
 * owner-facing listing APIs and public discovery (feed + detail).
 * `ListingsService` is exported so the Phase 11 moderation/admin surfaces can
 * drive approve/reject without duplicating transition logic.
 */
import { Module } from '@nestjs/common';
import { SearchModule } from '../../providers/search/search.module';
import { StorageModule } from '../../providers/storage/storage.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuditModule } from '../audit/audit.module';
import { LocationsModule } from '../locations/locations.module';
import { SellersModule } from '../sellers/sellers.module';
import { TaxonomyModule } from '../taxonomy/taxonomy.module';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery/discovery.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { MeListingsController } from './me-listings.controller';

@Module({
  imports: [
    TaxonomyModule,
    LocationsModule,
    SellersModule,
    StorageModule,
    SearchModule,
    AuditModule,
    AnalyticsModule,
  ],
  controllers: [DiscoveryController, ListingsController, MeListingsController],
  providers: [ListingsService, DiscoveryService],
  exports: [ListingsService],
})
export class ListingsModule {}
