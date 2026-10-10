/**
 * Admin moderation — API error helpers (master prompt §42, §44;
 * frontend-error-map.md §3.6). Every moderation failure stays explainable in
 * the queue; a 403 converges to the honest access-denied gate and a dead
 * session routes back to login (never a redirect loop).
 */

import { ApiError, ApiErrorCode } from '@/lib/api';

const GENERIC_MESSAGE = 'انجام عمل ناموفق بود؛ دوباره تلاش کنید.';

/** True when the backend refused the call for a signed-in principal. */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

/** True when the session is gone (401) — the caller must route to login. */
export function isSessionLostError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.isSessionTerminal);
}

/** Persian message for a failed moderation command, branched on `error.code`. */
export function describeModerationError(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_MESSAGE;
  switch (error.code) {
    case ApiErrorCode.VALIDATION_ERROR:
      return 'ورودی‌ها معتبر نیستند؛ دلیل رد را انتخاب کنید و دوباره تلاش کنید.';
    case 'LISTING_INVALID_TRANSITION':
      return 'این عمل در وضعیت کنونی آگهی مجاز نیست؛ فهرست به‌روزرسانی شد.';
    case 'LISTING_NOT_FOUND':
      return 'آگهی پیدا نشد؛ ممکن است حذف شده باشد — فهرست به‌روزرسانی شد.';
    case ApiErrorCode.FORBIDDEN:
      return 'دسترسی شما به این عملیات مجاز نیست.';
    case ApiErrorCode.RATE_LIMITED:
      return 'درخواست‌ها زیاد بوده است؛ کمی بعد دوباره تلاش کنید.';
    case ApiErrorCode.NETWORK:
      return 'ارتباط با سرور برقرار نشد؛ اتصال اینترنت را بررسی کنید.';
    default:
      return GENERIC_MESSAGE;
  }
}
