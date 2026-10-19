/**
 * Search-interaction telemetry DTOs (ANALYTICS-001/003/004/005).
 *
 * One public, anonymous, rate-limited `POST /search/events` endpoint carries
 * every lightweight search interaction the frontend already knows about:
 * submitted queries, filter apply/remove/clear, sort changes and listing card
 * opens. Every field is optional except `type`; the backend logs only the
 * fields that are present (no PII, no IP in the payload — see
 * docs/search-telemetry-privacy.md).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Slugs mirror the discovery query grammar (lowercase kebab). */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const SEARCH_EVENT_TYPES = [
  'search_submitted',
  'search_results_viewed',
  'filter_applied',
  'filter_removed',
  'filter_cleared',
  'sort_changed',
  'listing_card_opened',
] as const;

export type SearchEventType = (typeof SEARCH_EVENT_TYPES)[number];

export class SearchEventDto {
  @ApiProperty({
    enum: SEARCH_EVENT_TYPES,
    example: 'search_submitted',
    description: 'Interaction event kind.',
  })
  @IsEnum(SEARCH_EVENT_TYPES)
  type!: SearchEventType;

  @ApiPropertyOptional({ example: 'iphone 13', description: 'Submitted keyword.' })
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

  @ApiPropertyOptional({ example: 'price_asc', description: 'Sort value.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  sort?: string;

  @ApiPropertyOptional({ example: 'minPrice', description: 'Filter facet key.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  filterKey?: string;

  @ApiPropertyOptional({ example: '100000', description: 'Filter facet value.' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  filterValue?: string;

  @ApiPropertyOptional({ example: 12, description: 'Result count (search_results_viewed).' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  count?: number;

  @ApiPropertyOptional({ example: 'toyota-corolla-2020', description: 'Listing slug (card opened).' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  listingId?: string;
}

export class SearchEventResponseDto {
  @ApiProperty({ example: true })
  recorded!: boolean;
}