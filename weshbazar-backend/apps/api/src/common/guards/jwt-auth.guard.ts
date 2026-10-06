/**
 * Global JWT authentication guard.
 *
 * Registered as an `APP_GUARD` in `AuthModule`. Routes marked with
 * `@Public()` stay accessible without a token; when a valid token IS present
 * on a public route, the principal is still attached (optional auth for
 * personalized public responses). Invalid tokens on public routes are treated
 * as anonymous, never as errors.
 *
 * Access tokens are stateless: the guard does not hit the database. Revoking
 * a refresh session does not kill already-issued access tokens; they expire
 * naturally within the access-token TTL. Sensitive operations that must react
 * to revocation immediately re-check state from the database.
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../errors/app.exception';
import type { AccessTokenPayload, AuthenticatedRequest } from '../types/authenticated-user';
import { UserRole, UserStatus } from '../../generated/prisma/enums';

function extractBearerToken(authorization: string | undefined): string | undefined {
  if (!authorization) {
    return undefined;
  }
  const [scheme, value] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !value) {
    return undefined;
  }
  return value;
}

function isValidPayload(payload: AccessTokenPayload): boolean {
  return (
    typeof payload?.sub === 'string' &&
    payload.sub.length > 0 &&
    typeof payload.sid === 'string' &&
    payload.sid.length > 0 &&
    (Object.values(UserRole) as string[]).includes(payload.role) &&
    (Object.values(UserStatus) as string[]).includes(payload.status)
  );
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user) {
      return true;
    }

    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      if (isPublic) {
        return true;
      }
      throw new AppException('UNAUTHORIZED');
    }

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
      if (!isValidPayload(payload)) {
        throw new AppException('TOKEN_INVALID');
      }
      request.user = {
        id: payload.sub,
        role: payload.role,
        status: payload.status,
        sessionId: payload.sid,
        phoneVerified: payload.pv === true,
      };
      return true;
    } catch (error) {
      if (isPublic) {
        return true;
      }
      if (error instanceof AppException) {
        throw error;
      }
      if (error instanceof TokenExpiredError) {
        throw new AppException('TOKEN_EXPIRED');
      }
      throw new AppException('TOKEN_INVALID');
    }
  }
}
