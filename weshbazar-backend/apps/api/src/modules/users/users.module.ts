/**
 * Users feature module: current-user profile read/update.
 */
import { Module } from '@nestjs/common';
import { SellersModule } from '../sellers/sellers.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SellersModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
