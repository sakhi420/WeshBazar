/**
 * Report submission payload (spec §56).
 *
 * The reason is a closed enum, the description is bounded — "reasonable
 * description limits" from §57 — and both are trimmed before validation so
 * whitespace-only input never stores as data.
 */
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class SubmitReportDto {
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string | null;
}
