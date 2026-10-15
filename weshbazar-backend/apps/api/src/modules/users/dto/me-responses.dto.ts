/** Swagger response shapes for `GET /me` and `PATCH /me`. */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MySellerAccount } from '../../../common/presenters/seller.presenter';
import type { SafeUser } from '../../../common/presenters/user.presenter';

export class MySellerAccountDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['INDIVIDUAL'], example: 'INDIVIDUAL' })
  type!: MySellerAccount['type'];

  @ApiProperty({ example: 'Ahmad Wesh' })
  displayName!: string;

  @ApiProperty({ example: 'ahmad-wesh' })
  slug!: string;

  @ApiPropertyOptional({ nullable: true })
  bio!: string | null;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED'] })
  status!: MySellerAccount['status'];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

export class MyProfileDto {
  @ApiProperty({ format: 'uuid' })
  id!: SafeUser['id'];

  @ApiProperty({ example: '+93701234567' })
  phone!: string;

  @ApiProperty({ example: 'Ahmad Wesh' })
  displayName!: string;

  @ApiProperty({ enum: ['USER', 'MODERATOR', 'ADMIN'] })
  role!: SafeUser['role'];

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED'] })
  status!: SafeUser['status'];

  @ApiProperty()
  phoneVerified!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  phoneVerifiedAt!: Date | null;

  @ApiPropertyOptional({ nullable: true, description: 'Storage key of the avatar image.' })
  avatarKey!: string | null;

  @ApiPropertyOptional({ nullable: true, description: 'Public URL of the avatar image, null when none set.' })
  avatarUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: MySellerAccountDto })
  seller!: MySellerAccount;
}
