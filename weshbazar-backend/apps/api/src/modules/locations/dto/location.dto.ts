/**
 * Admin location payloads (spec §36, §106).
 *
 * Province codes follow ISO 3166-2:AF (`AF-KAB`, uppercased automatically);
 * slugs are generated from the English name when omitted (province fallback:
 * the lowercased code). City slugs are unique per province.
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
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LocationStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const upper = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toUpperCase() : value;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CODE_PATTERN = /^[A-Z]{2}-[A-Z0-9]{1,6}$/;

export class LocationTranslationDto {
  @ApiProperty({
    example: 'fa-AF',
    description: 'Locale code; BCP-47 aliases are normalized to en/fa/ps.',
  })
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Locale must be at least 2 characters.' })
  @MaxLength(20)
  locale!: string;

  @ApiProperty({ example: 'کابل' })
  @Transform(trim)
  @IsString()
  @MinLength(1, { message: 'Translation name must not be empty.' })
  @MaxLength(140)
  name!: string;
}

export class CreateProvinceDto {
  @ApiProperty({ example: 'AF-KAB', description: 'ISO 3166-2:AF code (uppercased automatically).' })
  @Transform(upper)
  @IsString()
  @Matches(CODE_PATTERN, { message: 'Code must look like an ISO 3166-2 code (e.g. AF-KAB).' })
  code!: string;

  @ApiPropertyOptional({
    description: 'Custom slug; generated from the English name when omitted.',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'Slug must be 2–140 characters of lowercase letters, digits and hyphens.',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: LocationStatus, default: LocationStatus.ACTIVE })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    type: [LocationTranslationDto],
    description: 'At least one entry with locale "en".',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LocationTranslationDto)
  translations!: LocationTranslationDto[];
}

export class UpdateProvinceDto {
  @ApiPropertyOptional({ example: 'AF-KAB' })
  @Transform(upper)
  @IsOptional()
  @IsString()
  @Matches(CODE_PATTERN, { message: 'Code must look like an ISO 3166-2 code (e.g. AF-KAB).' })
  code?: string;

  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'Slug must be 2–140 characters of lowercase letters, digits and hyphens.',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: LocationStatus })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [LocationTranslationDto],
    description: 'Entries are upserted per locale.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationTranslationDto)
  translations?: LocationTranslationDto[];
}

export class CreateCityDto {
  @ApiPropertyOptional({
    description: 'Custom slug; generated from the English name when omitted.',
  })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'Slug must be 2–140 characters of lowercase letters, digits and hyphens.',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: LocationStatus, default: LocationStatus.ACTIVE })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({
    type: [LocationTranslationDto],
    description: 'At least one entry with locale "en".',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LocationTranslationDto)
  translations!: LocationTranslationDto[];
}

export class UpdateCityDto {
  @ApiPropertyOptional()
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(140)
  @Matches(SLUG_PATTERN, {
    message: 'Slug must be 2–140 characters of lowercase letters, digits and hyphens.',
  })
  slug?: string;

  @ApiPropertyOptional({ enum: LocationStatus })
  @IsOptional()
  @IsEnum(LocationStatus)
  status?: LocationStatus;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [LocationTranslationDto],
    description: 'Entries are upserted per locale.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationTranslationDto)
  translations?: LocationTranslationDto[];
}
