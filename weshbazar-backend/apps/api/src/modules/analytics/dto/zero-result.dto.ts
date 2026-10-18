/**
 * Zero-result search telemetry DTOs (owner decision D3).
 *
 * Lightweight demand-signal capture: the market operator learns which queries,
 * categories and provinces have no supply, so they can recruit against hidden
 * demand. No identity data is collected.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Slugs mirror the discovery query grammar (lowercase kebab). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class SearchZeroResultDto {
  @ApiPropertyOptional({ example: 'iphone 13', description: 'Keyword that returned no results.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ example: 'mobile-phones', description: 'Category slug.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @Matches(SLUG_PATTERN)
  category?: string;

  @ApiPropertyOptional({ example: 'kabul', description: 'Province slug.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @Matches(SLUG_PATTERN)
  province?: string;
}

export class SearchZeroResultResponseDto {
  @ApiProperty({ example: true })
  recorded!: boolean;
}