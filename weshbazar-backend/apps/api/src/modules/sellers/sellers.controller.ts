/**
 * Public seller profile API (spec §108, §109).
 *
 * Anonymous callers can view a seller's safe public profile by slug; the
 * response never contains internal IDs, phone numbers, or security metadata.
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import type { CursorPaginated } from '../../common/http/pagination';
import type { PublicListingSummary } from '../../common/presenters/public-listing.presenter';
import type { PublicSellerProfile } from '../../common/presenters/seller.presenter';
import { resolveLocale } from '../../common/utils/locale.utils';
import { PublicListingSummaryDto } from '../listings/dto/discovery-responses.dto';
import { SellerListingsQueryDto } from './dto/seller-listings-query.dto';
import { PublicSellerProfileDto } from './dto/seller-responses.dto';
import { SellerAccountsService } from './seller-accounts.service';

@ApiTags('sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellerAccounts: SellerAccountsService) {}

  @Public()
  @Get(':slug')
  @ApiOperation({
    summary: 'Public seller profile by slug',
    operationId: 'sellers_getPublicProfile',
  })
  @ApiOkResponse({ type: PublicSellerProfileDto })
  getPublicProfile(@Param('slug') slug: string): Promise<PublicSellerProfile> {
    return this.sellerAccounts.getPublicBySlug(slug);
  }

  @Public()
  @Get(':slug/listings')
  @ApiOperation({
    summary: 'Public ACTIVE listings of a seller (cursor pagination)',
    operationId: 'sellers_getPublicListings',
  })
  @ApiOkResponse({ type: [PublicListingSummaryDto] })
  getPublicListings(
    @Param('slug') slug: string,
    @Query() query: SellerListingsQueryDto,
  ): Promise<CursorPaginated<PublicListingSummary>> {
    return this.sellerAccounts.getPublicListingsBySlug(slug, query, resolveLocale(query.locale));
  }
}
