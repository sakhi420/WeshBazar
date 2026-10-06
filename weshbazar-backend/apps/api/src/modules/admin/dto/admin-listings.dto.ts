/**
 * Admin listing-moderation DTOs (spec §58, §59, §106).
 *
 * The queue defaults to PENDING_REVIEW in FIFO (oldest first) order — that is
 * the review workflow — while `reported=true` switches to the open-report
 * view across statuses. `sort` is an explicit override for both.
 */
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { LocaleQueryDto } from '../../../common/dto/locale-query.dto';
import { ListingStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

const toBoolean = ({ value }: { value: unknown }): unknown =>
  value === 'true' ? true : value === 'false' ? false : value;

export const ADMIN_LISTING_SORTS = ['oldest', 'newest'] as const;
export type AdminListingSort = (typeof ADMIN_LISTING_SORTS)[number];

export class AdminListingsQueryDto extends LocaleQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  /** Only listings with at least one OPEN/UNDER_REVIEW report (§59). */
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  reported?: boolean;

  @IsOptional()
  @Transform(trim)
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(trim)
  @IsUUID()
  sellerAccountId?: string;

  /** Title substring search (case-insensitive). */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(trim)
  @IsIn(ADMIN_LISTING_SORTS)
  sort?: AdminListingSort;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(toNumber)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class RejectListingDto {
  /** Machine-readable rejection reason (spec §44 / §58). */
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  reason!: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}

/** Optional body for approve/archive/restore moderation commands. */
export class ModerationNoteDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;
}
