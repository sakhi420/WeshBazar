/**
 * Swagger response shapes for favorites (spec §55).
 * Mirror `common/presenters/favorite.presenter.ts`.
 */
import { ApiProperty } from '@nestjs/swagger';
import { PublicListingSummaryDto } from '../../listings/dto/discovery-responses.dto';

export class FavoriteListingSummaryDto extends PublicListingSummaryDto {
  @ApiProperty({ example: 'ACTIVE', description: 'Saved entries are ACTIVE or SOLD only.' })
  status!: string;
}

export class FavoriteItemDto {
  @ApiProperty({ type: String, format: 'date-time' })
  favoritedAt!: Date;

  @ApiProperty({ type: FavoriteListingSummaryDto })
  listing!: FavoriteListingSummaryDto;
}

export class FavoriteViewDto {
  @ApiProperty({ format: 'uuid' })
  listingId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  favoritedAt!: Date;
}
