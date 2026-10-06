/**
 * `@CurrentUser()` injects the authenticated principal attached to the request
 * by the authentication guard. When a field name is passed, only that field is
 * injected (e.g. `@CurrentUser('id') userId: string`).
 *
 * Throws UNAUTHORIZED if no principal is present — this can only happen when a
 * route is neither public nor guarded correctly, so failing loudly is right.
 */
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { AppException } from '../errors/app.exception';
import type { AuthenticatedRequest, AuthenticatedUser } from '../types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (field: keyof AuthenticatedUser | undefined, context: ExecutionContext): unknown => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new AppException('UNAUTHORIZED', {
        message: 'No authenticated principal is attached to this request.',
      });
    }
    return field === undefined ? user : user[field];
  },
);
