/**
 * Access-token and refresh-token cryptography.
 *
 * - Access tokens: short-lived JWTs signed with `JWT_ACCESS_SECRET` via the
 *   globally registered `JwtModule` (secret + TTL come from configuration).
 * - Refresh tokens: opaque 256-bit random strings. Only their HMAC-SHA256
 *   hash (peppered with `JWT_REFRESH_SECRET`) is ever stored.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../../config/config.types';
import { generateOpaqueToken, hmacSha256Hex } from '../../common/utils/crypto.utils';
import { parseDurationSeconds } from '../../common/utils/duration.utils';
import type { AccessTokenPayload } from '../../common/types/authenticated-user';
import type { User } from '../../generated/prisma/client';

export interface IssuedRefreshToken {
  token: string;
  tokenHash: string;
}

@Injectable()
export class TokenService {
  private readonly refreshSecret: string;
  private readonly accessTtlSeconds: number;
  private readonly refreshTtlSeconds: number;

  constructor(
    private readonly jwtService: JwtService,
    configService: ConfigService<AppConfig, true>,
  ) {
    const auth = configService.get('auth', { infer: true });
    this.refreshSecret = auth.refreshSecret;
    this.accessTtlSeconds = parseDurationSeconds(auth.accessTokenExpiresIn);
    this.refreshTtlSeconds = parseDurationSeconds(auth.refreshTokenExpiresIn);
  }

  get accessTokenTtlSeconds(): number {
    return this.accessTtlSeconds;
  }

  get refreshTokenTtlSeconds(): number {
    return this.refreshTtlSeconds;
  }

  async signAccessToken(
    user: Pick<User, 'id' | 'role' | 'status' | 'phoneVerifiedAt'>,
    sessionId: string,
  ): Promise<string> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      sid: sessionId,
      role: user.role,
      status: user.status,
      pv: user.phoneVerifiedAt !== null,
    };
    return this.jwtService.signAsync(payload);
  }

  /** Generate a raw refresh token together with the hash that is stored. */
  issueRefreshToken(): IssuedRefreshToken {
    const token = generateOpaqueToken();
    return { token, tokenHash: this.hashRefreshToken(token) };
  }

  /** Deterministic lookup key for a raw refresh token. */
  hashRefreshToken(token: string): string {
    return hmacSha256Hex(token, this.refreshSecret);
  }
}
