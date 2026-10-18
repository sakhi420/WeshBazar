/**
 * Seller listings feed query (owner decision D1): cursor pagination over a
 * seller's publicly visible ACTIVE listings. Mirrors FavoritesQueryDto.
 */
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';

const toLimit = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

export class SellerListingsQueryDto extends LocaleQueryDto {
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