/**
 * Admin category payloads (spec §27, §106).
 *
 * Localized fields arrive as a `translations` array; the service normalizes
 * BCP-47 aliases (e.g. `fa-AF` → `fa`) and requires an English entry on
 * creation so every category has a fallback name. The slug is generated from
 * the English name when omitted.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CategoryStatus, ModerationMode } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CategoryTranslationDto {
  @ApiProperty({
    example: 'fa-AF',
    description: 'Locale code; BCP-47 aliases are normalized to en/fa/ps.',
  })
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Locale must be at least 2 characters.' })
  @MaxLength(20)
  locale!: string;

  @ApiProperty({ example: 'موبایل و تبلت' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Translation name must not be empty.' })
  @MaxLength(140)
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: 'گوشی، تبلت و لوازم جانبی' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;
}

export class CreateCategoryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Parent category; omit or null for a root category.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Custom slug; generated from the English name when omitted.',
    example: 'mobile-phones',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'Slug must be 2–140 characters of lowercase letters, digits and hyphens.',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: CategoryStatus, default: CategoryStatus.ACTIVE })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ nullable: true, example: 'mobile' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  iconKey?: string | null;

  @ApiPropertyOptional({ enum: ModerationMode, default: ModerationMode.REVIEW_REQUIRED })
  @IsOptional()
  @IsEnum(ModerationMode)
  moderationMode?: ModerationMode;

  @ApiProperty({
    type: [CategoryTranslationDto],
    description: 'At least one entry with locale "en".',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations!: CategoryTranslationDto[];
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'New parent; null moves the category to the root.',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ example: 'mobile-phones' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'Slug must be 2–140 characters of lowercase letters, digits and hyphens.',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: CategoryStatus })
  @IsOptional()
  @IsEnum(CategoryStatus)
  status?: CategoryStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  iconKey?: string | null;

  @ApiPropertyOptional({ enum: ModerationMode })
  @IsOptional()
  @IsEnum(ModerationMode)
  moderationMode?: ModerationMode;

  @ApiPropertyOptional({
    type: [CategoryTranslationDto],
    description: 'Entries are upserted per locale.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryTranslationDto)
  translations?: CategoryTranslationDto[];
}
