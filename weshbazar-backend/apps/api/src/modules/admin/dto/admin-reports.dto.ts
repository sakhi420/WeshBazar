/**
 * Admin report-queue DTOs (spec §59, §106).
 *
 * The queue defaults to FIFO order while open (oldest first) and to
 * newest-first once a status filter narrows to closed reports, so the two
 * workflows (work the backlog / audit recent decisions) both feel natural.
 */
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ReportReason, ReportStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

export class AdminReportsQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @Transform(trim)
  @IsEnum(ReportReason)
  reason?: ReportReason;

  /** The suspicious-users workflow: all reports about one account (§59). */
  @IsOptional()
  @Transform(trim)
  @IsUUID()
  reportedUserId?: string;

  @IsOptional()
  @Transform(trim)
  @IsUUID()
  listingId?: string;

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

/** Body for resolve/dismiss; the note is the documented outcome (§106). */
export class ResolveReportDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  note?: string;
}
