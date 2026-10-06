/**
 * Permission-based access metadata consumed by the global `PermissionsGuard`.
 * Prefer this over raw `@Roles(...)` on admin/moderation routes so role
 * strings never leak into controllers (spec §61).
 */
import { SetMetadata } from '@nestjs/common';
import type { Permission } from '../authz/permissions';

export const PERMISSIONS_KEY = 'weshbazar:permissions';

export const RequirePermissions = (
  ...permissions: Permission[]
): MethodDecorator & ClassDecorator => SetMetadata(PERMISSIONS_KEY, permissions);
