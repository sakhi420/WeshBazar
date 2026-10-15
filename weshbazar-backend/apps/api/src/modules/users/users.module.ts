/**
 * Users feature module: current-user profile read/update.
 */
import { Module } from '@nestjs/common';
import { StorageModule } from '../../providers/storage/storage.module';
import { ImageProcessor } from '../media/image-processor';
import { SellersModule } from '../sellers/sellers.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [SellersModule, StorageModule],
  controllers: [UsersController],
  providers: [UsersService, ImageProcessor],
})
export class UsersModule {}
