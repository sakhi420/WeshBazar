/**
 * Public seller profile API (spec §108, §109).
 *
 * Anonymous callers can view a seller's safe public profile by slug; the
 * response never contains internal IDs, phone numbers, or security metadata.
 */
import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import type { PublicSellerProfile } from '../../common/presenters/seller.presenter';
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
}
