/**
 * Account formatting helpers (master prompt §32) — Persian/Dari presentation
 * of profile fields. Kept pure so they are unit-testable.
 */

import type { UserRole } from '@/features/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'کاربر',
  MODERATOR: 'ناظر',
  ADMIN: 'مدیر',
};

export function formatRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}

/**
 * Avatar initials: first character of the first two words (e.g. «Ahmad Wesh»
 * → «AW»). Falls back to a placeholder when the name has no letters.
 */
export function initialsFrom(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? '';
  const second = parts[1]?.charAt(0) ?? '';
  return `${first}${second}` || '؟';
}
