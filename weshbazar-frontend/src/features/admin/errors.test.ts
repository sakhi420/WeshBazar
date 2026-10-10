/**
 * Error-mapping tests for the moderation queue (master prompt §42, §44).
 * Branches on stable `error.code` — never on the human-readable message.
 */

import { ApiError } from '@/lib/api';
import { describeModerationError, isForbiddenError, isSessionLostError } from './errors';

const apiError = (code: string, status: number): ApiError =>
  new ApiError({ code, message: 'x', status });

describe('describeModerationError', () => {
  it('explains the moderation-specific failures', () => {
    expect(describeModerationError(apiError('LISTING_INVALID_TRANSITION', 409))).toContain(
      'مجاز نیست',
    );
    expect(describeModerationError(apiError('LISTING_NOT_FOUND', 404))).toContain('پیدا نشد');
    expect(describeModerationError(apiError('VALIDATION_ERROR', 400))).toContain('دلیل رد');
  });

  it('falls back to a generic message for unknown errors', () => {
    const generic = 'انجام عمل ناموفق بود؛ دوباره تلاش کنید.';
    expect(describeModerationError(apiError('INTERNAL_ERROR', 500))).toBe(generic);
    expect(describeModerationError(new Error('boom'))).toBe(generic);
    expect(describeModerationError(null)).toBe(generic);
  });
});

describe('isForbiddenError / isSessionLostError', () => {
  it('classifies 403 as forbidden and 401 as a lost session', () => {
    expect(isForbiddenError(apiError('FORBIDDEN', 403))).toBe(true);
    expect(isForbiddenError(apiError('UNAUTHORIZED', 401))).toBe(false);
    expect(isSessionLostError(apiError('UNAUTHORIZED', 401))).toBe(true);
    expect(isSessionLostError(apiError('SESSION_REVOKED', 401))).toBe(true);
    expect(isSessionLostError(apiError('FORBIDDEN', 403))).toBe(false);
    expect(isSessionLostError(null)).toBe(false);
  });
});
