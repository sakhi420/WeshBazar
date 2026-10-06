/**
 * `PATCH /me` payload.
 *
 * Rules:
 * - Strings are trimmed before validation.
 * - `avatarKey` and `seller.bio` set to `''` clear the value (stored as null).
 * - `seller.slug` is intentionally NOT editable — public URLs stay stable
 *   (SEO contract, spec §111).
 */
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsString, Length, Matches, MaxLength, ValidateNested } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateSellerProfileDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(2, 80, { message: 'Seller display name must be 2-80 characters.' })
  displayName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must be at most 500 characters.' })
  bio?: string;
}

export class UpdateMeDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @Length(2, 80, { message: 'Display name must be 2-80 characters.' })
  displayName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  @Matches(/^$|^[A-Za-z0-9][A-Za-z0-9/_\-.]*$/, {
    message: 'Avatar key must be a storage object key.',
  })
  avatarKey?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateSellerProfileDto)
  seller?: UpdateSellerProfileDto;
}
