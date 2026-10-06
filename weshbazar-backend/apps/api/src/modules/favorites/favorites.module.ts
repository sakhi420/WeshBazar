/**
 * Favorites module (spec §55): save / unsave / list. Storage is imported for
 * gallery URLs, analytics for the daily favorite-add counter (§72).
 */
import { Module } from '@nestjs/common';
import { StorageModule } from '../../providers/storage/storage.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [StorageModule, AnalyticsModule],
  controllers: [FavoritesController],
  providers: [FavoritesService],
})
export class FavoritesModule {}
