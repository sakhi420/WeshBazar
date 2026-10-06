import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Browser clients send no body — the refresh token travels in the HttpOnly
 * cookie. Non-browser clients may pass it explicitly in the body.
 */
export class RefreshDto {
  @ApiPropertyOptional({
    maxLength: 512,
    description:
      'Opaque refresh token. Omit it when the web cookie transport is used (recommended for browsers).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  refreshToken?: string;
}
