/**
 * Admin user-management DTOs (spec §59, §60, §106).
 *
 * Search is page/limit like every admin surface; moderation mutations never
 * accept a target status — the endpoint itself IS the command (suspend, ban,
 * restore), so role/status cannot be escalated through a payload.
 */
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../../../generated/prisma/enums';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const toNumber = ({ value }: { value: unknown }): unknown =>
  value === undefined ? value : Number(value);

export class AdminUsersQueryDto {
  /** Free-text search over phone, normalized phone and display name. */
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @Transform(trim)
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Transform(trim)
  @IsEnum(UserStatus)
  status?: UserStatus;

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

export class SuspendUserDto {
  /** Operator-facing justification; stored and audited (§60). */
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;

  /** Optional temporary suspension end; omit for an indefinite suspension. */
  @IsOptional()
  @Transform(trim)
  @IsISO8601()
  until?: string;
}

export class BanUserDto {
  /** Operator-facing justification; stored and audited (§60). */
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
