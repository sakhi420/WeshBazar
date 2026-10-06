/**
 * Permission catalog and role mapping (spec §61).
 *
 * Controllers never reference role strings for admin surfaces; they declare
 * the permission a route requires (`@RequirePermissions`) and this module maps
 * roles to permissions. Future roles only need a new entry here — no
 * controller changes.
 */
import type { UserRole } from '../../generated/prisma/enums';

/** Permission identifiers used by admin/moderation routes (spec §61). */
export const PERMISSIONS = [
  'LISTING_REVIEW',
  'LISTING_REJECT',
  'LISTING_ARCHIVE',
  'REPORT_REVIEW',
  'USER_READ',
  'USER_SUSPEND',
  'USER_BAN',
  'USER_RESTORE',
  'CATEGORY_MANAGE',
  'LOCATION_MANAGE',
  'AUDIT_READ',
  'ANALYTICS_READ',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * Role → permissions. Moderators run the content queues (review/reject,
 * reports, the suspicious-users view) and may read marketplace analytics;
 * every management, user-moderation and audit permission is reserved for
 * ADMIN (§59, §60, §62).
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  USER: [],
  MODERATOR: ['LISTING_REVIEW', 'LISTING_REJECT', 'REPORT_REVIEW', 'USER_READ', 'ANALYTICS_READ'],
  ADMIN: PERMISSIONS,
};

export function isPermission(value: unknown): value is Permission {
  return typeof value === 'string' && (PERMISSIONS as readonly string[]).includes(value);
}

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/** True when the role holds every permission in `required`. */
export function hasAllPermissions(role: UserRole, required: readonly Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return required.every((permission) => granted.includes(permission));
}
