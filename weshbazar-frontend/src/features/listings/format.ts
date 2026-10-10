/**
 * Listings feature — display formatting (master prompt §12 typography copy,
 * §25 microcopy, §54–57 bidi/long-text/bad-data resilience).
 *
 * Pure functions, no React. All Persian/Dari copy lives here so components
 * stay presentational. Unknown enum values must never crash a page — they fall
 * back to a neutral, honest label.
 */

import type { ListingCondition } from '@/lib/api';
import type {
  ContactMethodType,
  OwnerListingStatus,
  PricingType,
  PublicAttribute,
  PublicListingStatus,
} from './types';

const FA_LOCALE = 'fa-AF';

// --- Numbers & prices --------------------------------------------------------

const numberFormat = new Intl.NumberFormat(FA_LOCALE, { maximumFractionDigits: 2 });

/** Localized decimal number (Persian digits). */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** Currency code → Dari label. Unknown codes pass through unchanged. */
export function formatCurrency(currency: string): string {
  return currency === 'AFN' ? 'افغانی' : currency;
}

/**
 * Terminal price label for a listing (card + detail).
 * PAID → «۴۵٬۰۰۰ افغانی»; FREE → «رایگان»; CONTACT → «تماس بگیرید».
 * PAID with a null price stays honest: «قیمت اعلام نشده».
 */
export function formatPrice(
  price: number | null,
  currency: string,
  pricingType: PricingType,
): string {
  if (pricingType === 'FREE') return 'رایگان';
  if (pricingType === 'CONTACT') return 'تماس بگیرید';
  if (price === null || !Number.isFinite(price)) return 'قیمت اعلام نشده';
  return `${formatNumber(price)} ${formatCurrency(currency)}`;
}

// --- Enums -------------------------------------------------------------------

const CONDITION_LABELS: Record<ListingCondition, string> = {
  NEW: 'نو',
  LIKE_NEW: 'در حد نو',
  GOOD: 'سالم',
  FAIR: 'معمولی',
};

/** Persian/Dari condition label; unknown values pass through as-is. */
export function formatCondition(condition: string): string {
  return CONDITION_LABELS[condition as ListingCondition] ?? condition;
}

const STATUS_LABELS: Record<PublicListingStatus, string> = {
  ACTIVE: 'فعال',
  SOLD: 'فروخته شد',
};

/** Public listing status label; unknown values pass through as-is. */
export function formatStatus(status: string): string {
  return STATUS_LABELS[status as PublicListingStatus] ?? status;
}

const CONTACT_METHOD_LABELS: Record<ContactMethodType, string> = {
  PHONE: 'تماس تلفنی',
  WHATSAPP: 'واتساپ',
  TELEGRAM: 'تلگرام',
};

/** Contact method label; unknown values pass through as-is. */
export function formatContactMethod(method: string): string {
  return CONTACT_METHOD_LABELS[method as ContactMethodType] ?? method;
}

const OWNER_STATUS_LABELS: Record<OwnerListingStatus, string> = {
  DRAFT: 'پیش‌نویس',
  PENDING_REVIEW: 'در انتظار بررسی',
  ACTIVE: 'فعال',
  REJECTED: 'رد شده',
  SOLD: 'فروخته شد',
  ARCHIVED: 'بایگانی‌شده',
};

/** Owner lifecycle status label; unknown values pass through as-is. */
export function formatOwnerStatus(status: string): string {
  return OWNER_STATUS_LABELS[status as OwnerListingStatus] ?? status;
}

const OWNER_STATUS_HINTS: Partial<Record<OwnerListingStatus, string>> = {
  DRAFT: 'هنوز برای بررسی ارسال نشده است.',
  PENDING_REVIEW: 'نتیجهٔ بررسی به‌زودی مشخص می‌شود.',
  REJECTED: 'این آگهی رد شده است.',
  SOLD: 'این آگهی فروخته شده است.',
  ARCHIVED: 'برای انتشار دوباره، آن را بازنشر کنید.',
};

/** Supportive hint for a lifecycle status; null when the row needs none. */
export function formatOwnerStatusHint(status: string): string | null {
  return OWNER_STATUS_HINTS[status as OwnerListingStatus] ?? null;
}

// --- Dates -------------------------------------------------------------------

/** «امروز / دیروز / ۳ روز پیش / ۲ ماه پیش / ۱ سال پیش» — never negative. */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return 'امروز';
  if (days === 1) return 'دیروز';
  if (days < 30) return `${formatNumber(days)} روز پیش`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${formatNumber(months)} ماه پیش`;
  return `${formatNumber(Math.floor(months / 12))} سال پیش`;
}

/**
 * Countdown for an ACTIVE listing's expiry (§31, §70): «۳ روز مانده» /
 * «کمتر از یک روز مانده» / «منقضی شده» (the archive job may lag). Empty for
 * invalid input so the caller can hide the row.
 */
export function formatExpiryCountdown(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const remainingMs = date.getTime() - now.getTime();
  if (remainingMs <= 0) return 'منقضی شده';
  const days = Math.ceil(remainingMs / 86_400_000);
  if (days <= 1) return 'کمتر از یک روز مانده';
  return `${formatNumber(days)} روز مانده`;
}

/** Persian solar date, e.g. «حمل ۱۴۰۳». Falls back to the year on failure. */
export function formatMonthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(`${FA_LOCALE}-u-ca-persian`, {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return String(date.getFullYear());
  }
}

// --- Attributes --------------------------------------------------------------

/** Display string for a dynamic attribute value (bad data must not crash). */
export function formatAttributeValue(attribute: PublicAttribute): string {
  const { value } = attribute;
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'بله' : 'نخیر';
  if (typeof value === 'number') return Number.isFinite(value) ? formatNumber(value) : '';
  if (Array.isArray(value)) return value.map((item) => String(item)).join('، ');
  return String(value);
}

// --- Contact targets (§36: validate before turning a value into a URL) -------

/**
 * Build a safe external href for a revealed, server-authoritative target.
 * Returns null when the value does not match the method's expected charset —
 * the UI then offers copy-to-clipboard only, never a blind URL.
 */
export function buildContactHref(method: ContactMethodType, value: string): string | null {
  const trimmed = value.trim();
  if (method === 'PHONE') {
    if (!/^\+?[0-9][0-9\s\-()]{4,19}$/.test(trimmed)) return null;
    return `tel:${trimmed.replace(/[^+0-9]/g, '')}`;
  }
  if (method === 'WHATSAPP') {
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length < 7 || digits.length > 20) return null;
    return `https://wa.me/${digits}`;
  }
  if (method === 'TELEGRAM') {
    const handle = trimmed.replace(/^@/, '');
    if (!/^[A-Za-z0-9_]{3,32}$/.test(handle)) return null;
    return `https://t.me/${handle}`;
  }
  return null;
}
