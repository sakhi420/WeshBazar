/**
 * Public discovery query DTO (spec §49, §51).
 *
 * Shape/format checks only: category/province/city are slugs resolved by the
 * discovery service (unknown slugs yield an empty feed, not an error), and
 * dynamic `filter` expressions are parsed and whitelisted separately against
 * the category's attribute schema (see `discovery/filter-parser.ts`).
 * `minPrice`/`maxPrice` bounds use the same absolute sanity caps as listing
 * creation so a query can never ask for values money can't represent.
 */
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';
import { ListingCondition } from '../../../generated/prisma/enums';
import { SEARCH_SORTS } from '../../../providers/search/search.provider';

/** Slug shape used by categories, provinces and cities. */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const ABSOLUTE_PRICE_MAX = 999_999_999_999.99;

/** Hard sanity cap; the configured limit of valid filters is enforced later. */
const RAW_FILTER_CAP = 32;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

const toLimit = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

/** Accepts `?condition=NEW,GOOD` and repeated `?condition=NEW&condition=GOOD`. */
const toCsvList = ({ value }: { value: unknown }): unknown => {
  if (value === undefined) {
    return undefined;
  }
  const raw: unknown[] = Array.isArray(value) ? value : [value];
  const entries: unknown[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') {
      // Not a CSV value at all — validation rejects it with a 400.
      entries.push(entry);
      continue;
    }
    for (const part of entry.split(',')) {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        entries.push(trimmed);
      }
    }
  }
  return entries;
};

/** `filter` may be repeated (`?filter=a&filter=b`) or a single expression. */
const toFilterList = ({ value }: { value: unknown }): unknown => {
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value : [value];
};

export class ListingDiscoveryQueryDto extends LocaleQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @Matches(SLUG_PATTERN)
  category?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @Matches(SLUG_PATTERN)
  province?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  @Matches(SLUG_PATTERN)
  city?: string;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(ABSOLUTE_PRICE_MAX)
  minPrice?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(ABSOLUTE_PRICE_MAX)
  maxPrice?: number;

  @IsOptional()
  @Transform(toCsvList)
  @IsEnum(ListingCondition, { each: true })
  @ArrayMaxSize(4)
  condition?: ListingCondition[];

  @IsOptional()
  @IsIn([...SEARCH_SORTS])
  sort?: (typeof SEARCH_SORTS)[number];

  @IsOptional()
  @Transform(toFilterList)
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(RAW_FILTER_CAP)
  @MaxLength(200, { each: true })
  filter?: string[];

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
