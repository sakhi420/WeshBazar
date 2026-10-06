/**
 * Owner listing feed: `GET /me/listings` and `GET /me/listings/:id`
 * (spec §107).
 *
 * The feed is cursor-paginated newest-first, optionally filtered by lifecycle
 * status so the seller dashboard can render one tab per state. The
 * single-listing read lives here (not at `GET /listings/:id`) so the public
 * detail route can own `GET /listings/:slug`.
 */
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import type { CursorPaginated } from '../../common/http/pagination';
import type { OwnerListing, OwnerListingSummary } from '../../common/presenters/listing.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { resolveLocale } from '../../common/utils/locale.utils';
import { OwnerListingsQueryDto } from './dto/listing.dto';
import { OwnerListingDto, OwnerListingSummaryDto } from './dto/listing-responses.dto';
import { ListingsService } from './listings.service';

@ApiTags('me')
@ApiBearerAuth('access-token')
@Controller('me/listings')
export class MeListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOperation({
    summary: 'My listings (cursor pagination, newest first)',
    operationId: 'me_listings_list',
  })
  @ApiOkResponse({ type: [OwnerListingSummaryDto] })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OwnerListingsQueryDto,
  ): Promise<CursorPaginated<OwnerListingSummary>> {
    return this.listings.listForOwner(user.id, query, resolveLocale(query.locale));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my listings (by id)', operationId: 'me_listings_get' })
  @ApiOkResponse({ type: OwnerListingDto })
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.getForOwner(user.id, id, resolveLocale(query.locale));
  }
}
