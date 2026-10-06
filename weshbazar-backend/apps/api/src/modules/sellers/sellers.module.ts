/**
 * Sellers feature module: seller-account lifecycle, owner seller views and
 * the public seller profile API.
 */
import { Module } from '@nestjs/common';
import { SellerAccountsService } from './seller-accounts.service';
import { SellersController } from './sellers.controller';

@Module({
  controllers: [SellersController],
  providers: [SellerAccountsService],
  exports: [SellerAccountsService],
})
export class SellersModule {}
