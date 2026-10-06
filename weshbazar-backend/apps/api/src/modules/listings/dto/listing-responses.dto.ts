/**
 * Swagger response shapes for the seller listing APIs (spec §107).
 *
 * The public discovery shapes live in `discovery-responses.dto.ts`; these
 * mirror the owner-facing presenters (`common/presenters/listing.presenter.ts`).
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ListingRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'mobile-phones' })
  slug!: string;

  @ApiProperty({ example: 'Mobile Phones' })
  name!: string;
}

export class ListingVariantDto {
  @ApiProperty()
  url!: string;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;
}

export class ListingImageDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'URL of the stored original (re-encoded JPEG).' })
  url!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'object' },
    description: 'Derived variants keyed by name (thumbnail / medium / large).',
  })
  variants!: Record<string, ListingVariantDto>;

  @ApiProperty()
  width!: number;

  @ApiProperty()
  height!: number;

  @ApiProperty()
  isPrimary!: boolean;

  @ApiProperty()
  sortOrder!: number;
}

export class OwnerListingDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'iphone-13-pro-max-a83kd2' })
  slug!: string;

  @ApiProperty({ example: 'DRAFT' })
  status!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true, example: 45000 })
  price!: number | null;

  @ApiProperty({ example: 'AFN' })
  currency!: string;

  @ApiProperty({ example: 'PAID' })
  pricingType!: string;

  @ApiProperty()
  negotiable!: boolean;

  @ApiProperty({ example: 'GOOD' })
  condition!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  attributes!: Record<string, unknown>;

  @ApiProperty({ type: ListingRefDto })
  category!: ListingRefDto;

  @ApiProperty({ type: ListingRefDto })
  province!: ListingRefDto;

  @ApiProperty({ type: ListingRefDto })
  city!: ListingRefDto;

  @ApiProperty({ type: [ListingImageDto] })
  images!: ListingImageDto[];

  @ApiProperty()
  views!: number;

  @ApiProperty()
  favoriteCount!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  soldAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  archivedAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  rejectedReason!: string | null;

  @ApiPropertyOptional({ nullable: true })
  rejectedNote!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class OwnerListingSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ example: 'ACTIVE' })
  status!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  price!: number | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  pricingType!: string;

  @ApiProperty()
  condition!: string;

  @ApiProperty({ type: ListingRefDto })
  category!: ListingRefDto;

  @ApiPropertyOptional({ type: ListingImageDto, nullable: true })
  primaryImage!: ListingImageDto | null;

  @ApiProperty()
  views!: number;

  @ApiProperty()
  favoriteCount!: number;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class ListingRevisionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 1 })
  version!: number;

  @ApiProperty({ example: 'SUBMIT' })
  changeType!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  snapshot!: Record<string, unknown>;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object' }, nullable: true })
  attributeSchemaReference!: unknown;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  createdByUserId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}
