/**
 * Swagger response shapes for the Phase 11 admin queues (spec §59, §60,
 * §106). Mirrors `common/presenters/admin.presenter.ts` — swagger-only,
 * never imported by runtime code.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminSellerRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'ahmad-electronics-k3f9' })
  slug!: string;

  @ApiProperty({ example: 'Ahmad Electronics' })
  displayName!: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] })
  status!: string;

  @ApiProperty({ example: 12 })
  activeListings!: number;
}

export class AdminUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '+93700123456' })
  phone!: string;

  @ApiProperty({ example: '+93700123456' })
  phoneNormalized!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['USER', 'MODERATOR', 'ADMIN'] })
  role!: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED'] })
  status!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  phoneVerifiedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  suspensionReason!: string | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  suspendedUntil!: Date | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiPropertyOptional({ type: AdminSellerRefDto, nullable: true })
  seller!: AdminSellerRefDto | null;
}

export class AdminUserDetailDto extends AdminUserDto {
  @ApiProperty({
    example: { DRAFT: 0, PENDING_REVIEW: 1, ACTIVE: 4, REJECTED: 0, SOLD: 2, ARCHIVED: 1 },
  })
  listingsByStatus!: Record<string, number>;

  @ApiProperty({ example: 2 })
  openReportsAbout!: number;

  @ApiProperty({ example: 0 })
  reportsSubmitted!: number;
}

export class AdminModerationActionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE'] })
  action!: string;

  @ApiProperty({ format: 'uuid' })
  adminUserId!: string;

  @ApiPropertyOptional({ nullable: true })
  adminDisplayName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  note!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class AdminListingRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SOLD', 'ARCHIVED'] })
  status!: string;
}

export class AdminListingSellerDto {
  @ApiProperty({ format: 'uuid' })
  sellerAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  ownerUserId!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] })
  status!: string;
}

export class AdminListingItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SOLD', 'ARCHIVED'] })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  price!: number | null;

  @ApiProperty({ example: 'AFN' })
  currency!: string;

  @ApiProperty()
  categoryName!: string;

  @ApiProperty()
  provinceName!: string;

  @ApiProperty()
  cityName!: string;

  @ApiProperty({ type: AdminListingSellerDto })
  seller!: AdminListingSellerDto;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Primary image URL, when the gallery has one.',
  })
  thumbnailUrl!: string | null;

  @ApiProperty({ example: 42 })
  views!: number;

  @ApiProperty({ example: 3 })
  favoriteCount!: number;

  @ApiProperty({ example: 1 })
  openReportCount!: number;

  @ApiProperty({ example: 2 })
  version!: number;

  @ApiPropertyOptional({ nullable: true })
  rejectedReason!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ enum: ['APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE'], isArray: true })
  permittedActions!: string[];
}

export class AdminListingDetailDto extends AdminListingItemDto {
  @ApiProperty()
  description!: string;

  @ApiProperty({ example: 'USED' })
  condition!: string;

  @ApiProperty({ example: 'FIXED' })
  pricingType!: string;

  @ApiProperty()
  negotiable!: boolean;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string' },
        enabled: { type: 'boolean' },
        valueOverride: { type: 'string', nullable: true },
      },
    },
  })
  contactMethods!: Array<{ type: string; enabled: boolean; valueOverride: string | null }>;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        url: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' },
        isPrimary: { type: 'boolean' },
      },
    },
  })
  images!: Array<{ id: string; url: string; width: number; height: number; isPrimary: boolean }>;

  @ApiProperty({ type: [AdminModerationActionDto] })
  moderationActions!: AdminModerationActionDto[];
}

export class AdminReportUserRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED'] })
  status!: string;
}

export class AdminReportDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    enum: [
      'SCAM',
      'STOLEN',
      'PROHIBITED_ITEM',
      'SPAM',
      'MISLEADING',
      'DUPLICATE',
      'OFFENSIVE',
      'OTHER',
    ],
  })
  reason!: string;

  @ApiPropertyOptional({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] })
  status!: string;

  @ApiPropertyOptional({ type: AdminListingRefDto, nullable: true })
  listing!: AdminListingRefDto | null;

  @ApiProperty({ type: AdminReportUserRefDto })
  reporter!: AdminReportUserRefDto;

  @ApiPropertyOptional({ type: AdminReportUserRefDto, nullable: true })
  reportedUser!: AdminReportUserRefDto | null;

  @ApiPropertyOptional({
    nullable: true,
    type: 'object',
    properties: { id: { type: 'string', format: 'uuid' }, displayName: { type: 'string' } },
  })
  resolvedBy!: { id: string; displayName: string } | null;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  resolvedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  resolutionNote!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;
}
