/**
 * Swagger response shape for audit log search (spec §62).
 * Mirrors `common/presenters/audit.presenter.ts`.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ApiProperty({ example: 'LISTING_APPROVED' })
  action!: string;

  @ApiProperty({ example: 'Listing' })
  entityType!: string;

  @ApiPropertyOptional({ nullable: true })
  entityId!: string | null;

  @ApiProperty({ type: Object })
  metadata!: Record<string, unknown>;

  @ApiPropertyOptional({ nullable: true })
  ipAddress!: string | null;

  @ApiPropertyOptional({ nullable: true })
  userAgent!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
