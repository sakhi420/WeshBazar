/**
 * Listing request DTOs (spec §92).
 *
 * Type/shape checks only: marketplace bounds (title/description lengths,
 * pricing rules, attribute limits) come from configuration and are enforced
 * in `ListingsService` so environment tuning never diverges from validation.
 */
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';
import {
  ListingCondition,
  ListingContactType,
  ListingStatus,
  PricingType,
} from '../../../generated/prisma/enums';

export const CURRENCY_PATTERN = /^[A-Z]{3}$/;

/** Hard sanity caps; configured bounds are always tighter. */
const TITLE_ABSOLUTE_MAX = 300;
const DESCRIPTION_ABSOLUTE_MAX = 10_000;

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const uppercase = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.toUpperCase() : value;

const toLimit = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

/**
 * One contact method entry (§53). Shape checks only — override formats
 * (phone normalization, Telegram handle) are validated in the service so the
 * rules live with the contact-method engine.
 */
export class ContactMethodInputDto {
  @IsEnum(ListingContactType)
  type!: ListingContactType;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(160)
  valueOverride?: string | null;
}

export class CreateListingDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_ABSOLUTE_MAX)
  title!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(DESCRIPTION_ABSOLUTE_MAX)
  description!: string;

  @IsUUID()
  categoryId!: string;

  @IsUUID()
  provinceId!: string;

  @IsUUID()
  cityId!: string;

  @IsEnum(ListingCondition)
  condition!: ListingCondition;

  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999_999_999_999.99)
  price?: number | null;

  @IsOptional()
  @Transform(uppercase)
  @Matches(CURRENCY_PATTERN)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  /**
   * Complete contact configuration (§53). Omitted on create → PHONE +
   * WHATSAPP enabled; provided on update → replaces the stored set.
   */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ContactMethodInputDto)
  contactMethods?: ContactMethodInputDto[];
}

export class UpdateListingDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(TITLE_ABSOLUTE_MAX)
  title?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(DESCRIPTION_ABSOLUTE_MAX)
  description?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  provinceId?: string;

  @IsOptional()
  @IsUUID()
  cityId?: string;

  @IsOptional()
  @IsEnum(ListingCondition)
  condition?: ListingCondition;

  @IsOptional()
  @IsEnum(PricingType)
  pricingType?: PricingType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999_999_999_999.99)
  price?: number | null;

  @IsOptional()
  @Transform(uppercase)
  @Matches(CURRENCY_PATTERN)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  /** Complete contact configuration (§53); replaces the stored set when sent. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ContactMethodInputDto)
  contactMethods?: ContactMethodInputDto[];

  /** Optimistic concurrency guard (spec §43); stale values get 409. */
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}

/** Body for the state-machine commands (submit, mark-sold, archive, renew). */
export class ListingCommandDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}

/** Locale is embedded so owner list reads need a single `@Query()` DTO. */
export class OwnerListingsQueryDto extends LocaleQueryDto {
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

  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}

export class RevisionsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @IsOptional()
  @Transform(toLimit)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
