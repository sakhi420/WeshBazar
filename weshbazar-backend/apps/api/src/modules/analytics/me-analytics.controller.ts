/**
 * Seller analytics API (spec §107, §162): the authenticated account's own
 * listing summary — counters by status, lifetime views/favorites, ranged
 * engagement and top listings.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { SellerSummaryView } from '../../common/presenters/analytics.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AnalyticsRangeQueryDto } from './dto/analytics.dto';
import { SellerSummaryDto } from './dto/analytics-responses.dto';
import { SellerAnalyticsService } from './seller-analytics.service';

@ApiTags('me')
@ApiBearerAuth('access-token')
@Controller('me/analytics')
export class MeAnalyticsController {
  constructor(private readonly analytics: SellerAnalyticsService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'My listing analytics summary for a range (default 30 days)',
    operationId: 'me_analytics_summary',
  })
  @ApiOkResponse({ type: SellerSummaryDto })
  summary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AnalyticsRangeQueryDto,
  ): Promise<SellerSummaryView> {
    return this.analytics.summary(user.id, query.from, query.to);
  }
}
