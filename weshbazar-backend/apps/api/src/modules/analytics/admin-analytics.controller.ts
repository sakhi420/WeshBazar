/**
 * Admin analytics API (spec §71–§72, §106, §161–§162).
 *
 * Both routes need ANALYTICS_READ — moderators and admins hold it; it never
 * exposes individual user data, only marketplace aggregates.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type {
  AdminDashboardView,
  MarketplaceSummaryView,
} from '../../common/presenters/analytics.presenter';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AnalyticsRangeQueryDto } from './dto/analytics.dto';
import { AdminDashboardDto, MarketplaceSummaryDto } from './dto/analytics-responses.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@RequirePermissions('ANALYTICS_READ')
export class AdminAnalyticsController {
  constructor(private readonly analytics: AdminAnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard counters: users, listings by status, reports', operationId: 'admin_analytics_dashboard' })
  @ApiOkResponse({ type: AdminDashboardDto })
  dashboard(): Promise<AdminDashboardView> {
    return this.analytics.dashboard();
  }

  @Get('analytics/summary')
  @ApiOperation({
    summary: 'Marketplace summary for a range (daily series + engagement totals)',
    operationId: 'admin_analytics_summary',
  })
  @ApiOkResponse({ type: MarketplaceSummaryDto })
  summary(@Query() query: AnalyticsRangeQueryDto): Promise<MarketplaceSummaryView> {
    return this.analytics.marketplaceSummary(query.from, query.to);
  }
}
