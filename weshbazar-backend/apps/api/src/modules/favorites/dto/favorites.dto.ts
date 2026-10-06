/**
 * Favorites request DTOs (spec §55): the `/me/favorites` feed query.
 */
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

const toLimit = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

/** Locale is embedded so the feed read needs a single `@Query()` DTO. */
export class FavoritesQueryDto extends LocaleQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @IsOptional()
  @Transform(toLimit)
  @IsInt()
  @Min(1)
  @Max(60)
  limit?: number;
}
