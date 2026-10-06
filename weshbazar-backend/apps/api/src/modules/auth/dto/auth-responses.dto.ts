/**
 * Swagger response models for the auth endpoints. These classes exist for
 * documentation only — responses are plain objects built by AuthService.
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '0701234567' })
  phone!: string;

  @ApiProperty({ example: 'Ahmad' })
  displayName!: string;

  @ApiProperty({ enum: ['USER', 'MODERATOR', 'ADMIN'] })
  role!: string;

  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED'] })
  status!: string;

  @ApiProperty()
  phoneVerified!: boolean;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  phoneVerifiedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

export class AuthTokensDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ example: 900 })
  accessTokenExpiresInSeconds!: number;

  @ApiProperty({ description: 'Short-lived; browsers should instead rely on the HttpOnly cookie.' })
  refreshToken!: string;

  @ApiProperty({ example: 2_592_000 })
  refreshTokenExpiresInSeconds!: number;
}

export class AuthSessionRefDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserSummaryDto })
  user!: UserSummaryDto;

  @ApiProperty({ type: AuthTokensDto })
  tokens!: AuthTokensDto;

  @ApiProperty({ type: AuthSessionRefDto })
  session!: AuthSessionRefDto;
}

export class SessionSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastUsedAt!: Date | null;

  @ApiProperty({ type: String, nullable: true })
  ipAddress!: string | null;

  @ApiProperty({ type: String, nullable: true })
  userAgent!: string | null;

  @ApiProperty({ type: String, nullable: true })
  deviceName!: string | null;

  @ApiProperty({ description: 'True for the session that issued the current access token.' })
  current!: boolean;
}

export class MeResponseDto {
  @ApiProperty({ type: UserSummaryDto })
  user!: UserSummaryDto;

  @ApiProperty({ type: SessionSummaryDto, nullable: true })
  session!: SessionSummaryDto | null;
}

export class LogoutAllResponseDto {
  @ApiProperty({ example: 3 })
  revokedCount!: number;
}

export class GenericMessageDto {
  @ApiProperty()
  message!: string;
}

export class ResendVerificationResponseDto {
  @ApiProperty()
  sent!: boolean;

  @ApiProperty()
  phoneVerified!: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  resendAvailableAt!: string | null;
}

export class ChangePhoneResponseDto {
  @ApiProperty()
  sent!: boolean;

  @ApiProperty({ example: '+93*****4321' })
  newPhone!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  resendAvailableAt!: string;
}
