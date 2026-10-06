/**
 * Audit log search query DTO (spec §106). Filters are exact-match; pagination
 * is page/limit like other admin surfaces (`pagination.ts`).
 */
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { AuditAction } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

export class AuditLogQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsEnum(AuditAction)
  action?: AuditAction;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(50)
  entityType?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(64)
  entityId?: string;

  @IsOptional()
  @Transform(trim)
  @IsUUID()
  actorUserId?: string;

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
