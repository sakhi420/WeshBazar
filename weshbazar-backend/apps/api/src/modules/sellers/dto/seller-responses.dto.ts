/** Swagger response shapes for the public seller profile API (spec §109). */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicSellerProfileDto {
  @ApiProperty({ example: 'ahmad-wesh' })
  slug!: string;

  @ApiProperty({ example: 'Ahmad Wesh' })
  displayName!: string;

  @ApiPropertyOptional({ nullable: true, example: 'Electronics seller based in Kabul.' })
  bio!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  memberSince!: Date;

  @ApiProperty({ description: 'Whether the seller has a verified phone number.' })
  phoneVerified!: boolean;

  @ApiProperty({ description: 'Number of ACTIVE listings.', example: 4 })
  activeListingCount!: number;

  @ApiPropertyOptional({ nullable: true, description: 'Public URL of the seller avatar image, null when none set.' })
  avatarUrl!: string | null;
}
