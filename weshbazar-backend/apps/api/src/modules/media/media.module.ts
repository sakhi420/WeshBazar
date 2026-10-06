/**
 * Media feature module: secure image upload, processing and storage
 * (spec §63–§67) on top of the StorageProvider abstraction. ListingsModule is
 * imported so gallery mutations can register their §42 material change;
 * StorageModule is re-exported implicitly through both dependencies.
 */
import { Module } from '@nestjs/common';
import { StorageModule } from '../../providers/storage/storage.module';
import { ListingsModule } from '../listings/listings.module';
import { ImageProcessor } from './image-processor';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [ListingsModule, StorageModule],
  controllers: [MediaController],
  providers: [ImageProcessor, MediaService],
  exports: [MediaService],
})
export class MediaModule {}
