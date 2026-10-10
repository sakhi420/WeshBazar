/**
 * Behavior tests for account formatting (master prompt §32).
 *
 * The helpers are the single source of Persian/Dari copy for the account
 * surface: every known role maps to a label, unknown values pass through
 * (never crash), and avatar initials must stay stable for names the user
 * types freely.
 */

import { formatRoleLabel, initialsFrom } from './format';
import type { UserRole } from '@/features/auth';

describe('formatRoleLabel', () => {
  it('maps every known role to its Persian label', () => {
    expect(formatRoleLabel('USER')).toBe('کاربر');
    expect(formatRoleLabel('MODERATOR')).toBe('ناظر');
    expect(formatRoleLabel('ADMIN')).toBe('مدیر');
  });

  it('passes unknown values through unchanged', () => {
    expect(formatRoleLabel('SUPERUSER' as UserRole)).toBe('SUPERUSER');
  });
});

describe('initialsFrom', () => {
  it('uses the first letter of the first two words', () => {
    expect(initialsFrom('Ahmad Wesh')).toBe('AW');
    expect(initialsFrom('احمد ویش')).toBe('او');
  });

  it('falls back to a single letter for one-word names', () => {
    expect(initialsFrom('Ahmad')).toBe('A');
    expect(initialsFrom('احمد')).toBe('ا');
  });

  it('ignores extra whitespace', () => {
    expect(initialsFrom('  Ali   Reza  ')).toBe('AR');
  });

  it('returns a placeholder for blank names instead of an empty avatar', () => {
    expect(initialsFrom('')).toBe('؟');
    expect(initialsFrom('   ')).toBe('؟');
  });
});
