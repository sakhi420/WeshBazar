/**
 * Analytics module (spec §71–§74, §162).
 *
 * Three concerns, kept in one module because they share the §72 counters:
 *
 *   - `ListingStatsService` — per-listing per-day event counters, imported by
 *     the contacts, favorites and reports modules;
 *   - `ViewDedupeService` — the §73 view-counting policy, imported by
 *     discovery;
 *   - the summary APIs (`/admin/analytics`, `/me/analytics`) and dashboard.
 *
 * Kept separate from business modules so analytics logic cannot leak into
 * their flows (§74).
 */
import { Module } from '@nestjs/common';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';
import { ListingStatsService } from './listing-stats.service';
import { MeAnalyticsController } from './me-analytics.controller';
import { SearchTelemetryController } from './search-telemetry.controller';
import { SearchTelemetryService } from './search-telemetry.service';
import { SellerAnalyticsService } from './seller-analytics.service';
import { ViewDedupeService } from './view-dedupe.service';

@Module({
  controllers: [AdminAnalyticsController, MeAnalyticsController, SearchTelemetryController],
  providers: [
    AdminAnalyticsService,
    ListingStatsService,
    SearchTelemetryService,
    SellerAnalyticsService,
    ViewDedupeService,
  ],
  exports: [ListingStatsService, ViewDedupeService],
})
export class AnalyticsModule {}
