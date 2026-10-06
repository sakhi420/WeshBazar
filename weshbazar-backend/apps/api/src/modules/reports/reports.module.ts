/**
 * Reports module (spec §56–§57). Rate limiting is provided by the global
 * rate-limit module; analytics counters come from the shared analytics module.
 */
import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AnalyticsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
