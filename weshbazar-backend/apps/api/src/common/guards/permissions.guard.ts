/**
 * Global permission guard (spec §61, §76).
 *
 * Runs after `JwtAuthGuard` (principal attached) and `RolesGuard`. Routes
 * without `@RequirePermissions(...)` metadata are unaffected. On protected
 * admin routes the principal's account status is re-checked from the access
 * token claims — a suspended staff account cannot keep acting on a token that
 * was issued before the suspension (the token's `status` claim is refreshed on
 * every sign-in; staff suspension also revokes refresh sessions).
 */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasAllPermissions, type Permission } from '../authz/permissions';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { AppException } from '../errors/app.exception';
import type { AuthenticatedRequest } from '../types/authenticated-user';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) {
      throw new AppException('UNAUTHORIZED');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }
    if (!hasAllPermissions(user.role, required)) {
      throw new AppException('FORBIDDEN');
    }
    return true;
  }
}
