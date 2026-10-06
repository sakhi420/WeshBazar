/**
 * Analytics query DTOs (spec §71–§72, §106, §162).
 *
 * `from`/`to` accept ISO dates or datetimes; range policy (defaults, cap,
 * UTC day semantics) lives in `analytics-range.ts`.
 */
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class AnalyticsRangeQueryDto {
  /** Inclusive start day; defaults to 29 days before `to`. */
  @IsOptional()
  @Transform(trim)
  @IsISO8601()
  from?: string;

  /** Inclusive end day; defaults to today (UTC). */
  @IsOptional()
  @Transform(trim)
  @IsISO8601()
  to?: string;
}
