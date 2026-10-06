/**
 * Swagger response shapes for public discovery (spec §49, §52).
 *
 * Mirror `common/presenters/public-listing.presenter.ts`; the ref/image
 * building blocks are shared with the owner responses.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingImageDto, ListingRefDto } from './listing-responses.dto';

export class PublicAttributeDto {
  @ApiProperty({ example: 'storage' })
  key!: string;

  @ApiProperty({ example: 'Storage' })
  label!: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 'SELECT',
    description: 'Definition type; null when the attribute definition no longer exists.',
  })
  type!: string | null;

  @ApiProperty({
    description: 'Stored attribute value in its native shape.',
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      { type: 'array', items: { type: 'string' } },
    ],
  })
  value!: string | number | boolean | string[];
}

export class PublicContactDto {
  @ApiProperty({
    description:
      'Whether contact values can be revealed (Phase 10 endpoint); values are never embedded.',
  })
  available!: boolean;

  @ApiProperty({ example: ['PHONE', 'WHATSAPP'], type: [String] })
  methods!: string[];
}

export class PublicSellerRefDto {
  @ApiProperty({ example: 'ahmad-electronics' })
  slug!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  memberSince!: Date;

  @ApiProperty()
  phoneVerified!: boolean;
}

export class PublicListingSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'iphone-13-pro-max-a83kd2' })
  slug!: string;

  @ApiProperty()
  title!: string;

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

  @ApiProperty({ type: ListingRefDto })
  category!: ListingRefDto;

  @ApiProperty({ type: ListingRefDto })
  province!: ListingRefDto;

  @ApiProperty({ type: ListingRefDto })
  city!: ListingRefDto;

  @ApiPropertyOptional({ type: ListingImageDto, nullable: true })
  primaryImage!: ListingImageDto | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;
}

export class PublicListingDetailDto extends PublicListingSummaryDto {
  @ApiProperty({ example: 'ACTIVE', description: 'Publicly reachable states: ACTIVE or SOLD.' })
  status!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [PublicAttributeDto] })
  attributes!: PublicAttributeDto[];

  @ApiProperty({ type: [ListingImageDto] })
  images!: ListingImageDto[];

  @ApiProperty({ type: PublicSellerRefDto })
  seller!: PublicSellerRefDto;

  @ApiProperty({ type: PublicContactDto })
  contact!: PublicContactDto;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  soldAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
