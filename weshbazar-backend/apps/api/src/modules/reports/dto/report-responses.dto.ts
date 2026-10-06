/**
 * Swagger response shape for report submission (spec §56).
 * Mirrors `common/presenters/report.presenter.ts`.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReportDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  listingId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  reportedUserId!: string | null;

  @ApiProperty({ example: 'SCAM' })
  reason!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'OPEN' })
  status!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  resolvedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
