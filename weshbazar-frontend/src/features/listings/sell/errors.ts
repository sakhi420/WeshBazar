/**
 * Sell wizard + owner listing lifecycle — API error copy (frontend-error-map.md, §283–§291).
 *
 * The frozen backend emits stable string codes; unknown codes fall back to a
 * generic honest message. Field-level details keep flowing through
 * `bindFieldErrors` from the auth form kit.
 */

import { ApiError, ApiErrorCode } from '@/lib/api';

const GENERIC_MESSAGE = 'انجام عمل ناموفق بود؛ دوباره تلاش کنید.';

/** Persian message for a failed sell mutation (form-level alert). */
export function describeSellError(error: unknown): string {
  if (!(error instanceof ApiError)) return GENERIC_MESSAGE;
  switch (error.code) {
    case 'LISTING_LIMIT_REACHED':
      return 'به سقف مجاز آگهی‌های حساب خود رسیده‌اید؛ برای ثبت آگهی جدید یکی از آگهی‌های قدیمی را بایگانی کنید.';
    case 'LISTING_VERSION_CONFLICT':
      return 'آگهی از جای دیگری تغییر کرده است؛ اطلاعات به‌روز شد — دوباره تلاش کنید.';
    case 'LISTING_EDIT_NOT_ALLOWED':
      return 'در وضعیت کنونی، ویرایش این آگهی مجاز نیست.';
    case 'PHONE_NOT_VERIFIED':
      return 'برای ثبت نهایی آگهی، ابتدا شمارهٔ تلفن حساب خود را تأیید کنید.';
    case 'ACCOUNT_NOT_ACTIVE':
      return 'حساب کاربری شما فعال نیست؛ برای بررسی با پشتیبانی تماس بگیرید.';
    case 'LISTING_INVALID_TRANSITION':
      return 'این عمل در وضعیت کنونی آگهی مجاز نیست؛ فهرست به‌روز شد.';
    case 'LISTING_NOT_ACTIVE':
      return 'این آگهی دیگر فعال نیست؛ فهرست به‌روز شد.';
    case 'LISTING_NOT_FOUND':
      return 'آگهی پیدا نشد؛ ممکن است حذف یا منتقل شده باشد.';
    case 'CATEGORY_NOT_LEAF':
      return 'این دسته زیرشاخه دارد؛ یک زیردستهٔ نهایی انتخاب کنید.';
    case 'CATEGORY_INACTIVE':
    case 'CATEGORY_NOT_FOUND':
      return 'دستهٔ انتخاب‌شده دیگر در دسترس نیست؛ یک دستهٔ دیگر انتخاب کنید.';
    case 'LOCATION_INACTIVE':
      return 'مکان انتخاب‌شده دیگر در دسترس نیست؛ ولایت و شهر را دوباره انتخاب کنید.';
    case 'MEDIA_STORAGE_FAILED':
      return 'بارگذاری تصویر ناموفق بود؛ دوباره تلاش کنید.';
    case 'IMAGE_TOO_LARGE':
      return 'حجم تصویر بیشتر از ۵ مگابایت است.';
    case 'IMAGE_DIMENSIONS_TOO_LARGE':
      return 'ابعاد تصویر بیش از حد بزرگ است؛ تصویر کوچک‌تری انتخاب کنید.';
    case 'UNSUPPORTED_IMAGE_TYPE':
      return 'فقط تصاویر JPEG، PNG و WebP پذیرفته می‌شوند.';
    case 'LISTING_IMAGE_LIMIT_REACHED':
      return 'حداکثر ۱۰ تصویر برای هر آگهی مجاز است.';
    case 'MEDIA_ALREADY_LINKED':
      return 'این تصویر قبلاً به آگهی پیوست شده است.';
    case ApiErrorCode.RATE_LIMITED:
      return 'درخواست‌های شما زیاد بوده است؛ کمی بعد دوباره تلاش کنید.';
    case ApiErrorCode.NETWORK:
      return 'ارتباط با سرور برقرار نشد؛ اتصال اینترنت خود را بررسی کنید.';
    case ApiErrorCode.VALIDATION_ERROR:
      return 'برخی اطلاعات کامل یا معتبر نیست؛ موارد مشخص‌شده را اصلاح کنید.';
    default:
      return GENERIC_MESSAGE;
  }
}

/** True when a failed mutation should trigger a fresh owner-listing read (§43). */
export function shouldRefreshOwnerListing(error: unknown): boolean {
  return error instanceof ApiError && error.code === 'LISTING_VERSION_CONFLICT';
}
