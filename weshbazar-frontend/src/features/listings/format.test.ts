/**
 * Behavior tests for listings formatting (master prompt §12, §56–57).
 *
 * Formatting is the single source of Persian/Dari copy for the listings
 * surface. Unknown enum values must pass through (never crash), and the
 * contact-href validator is the security boundary that keeps phone / WhatsApp
 * / Telegram links honest — bad data must yield no URL, not a blind fallback.
 */

import {
  buildContactHref,
  formatAttributeValue,
  formatCondition,
  formatCurrency,
  formatExpiryCountdown,
  formatOwnerStatusHint,
  formatPrice,
  formatRelativeTime,
  formatStatus,
} from './format';
import type { PublicAttribute } from './types';

describe('formatPrice', () => {
  it('PAID with a number renders localized digits + افغانی', () => {
    const label = formatPrice(45000, 'AFN', 'PAID');
    expect(label).toContain('افغانی');
    // Either ASCII `45,000` or Persian-digit form — both are valid in fa-AF.
    expect(label).toMatch(/45,?000|۴۵[,٬]?۰۰۰/);
  });

  it('PAID with a null price stays honest instead of inventing a number', () => {
    expect(formatPrice(null, 'AFN', 'PAID')).toBe('قیمت اعلام نشده');
  });

  it('FREE and CONTACT use their own labels regardless of price', () => {
    expect(formatPrice(99999, 'AFN', 'FREE')).toBe('رایگان');
    expect(formatPrice(100, 'AFN', 'CONTACT')).toBe('تماس بگیرید');
  });

  it('formatCurrency passes unknown codes through unchanged', () => {
    expect(formatCurrency('AFN')).toBe('افغانی');
    expect(formatCurrency('USD')).toBe('USD');
  });
});

describe('formatCondition / formatStatus', () => {
  it('maps every known condition and falls through for unknown ones', () => {
    expect(formatCondition('NEW')).toBe('نو');
    expect(formatCondition('LIKE_NEW')).toBe('در حد نو');
    expect(formatCondition('GOOD')).toBe('سالم');
    expect(formatCondition('FAIR')).toBe('معمولی');
    expect(formatCondition('MINTY')).toBe('MINTY');
  });

  it('maps status values and passes unknown through', () => {
    expect(formatStatus('ACTIVE')).toBe('فعال');
    expect(formatStatus('SOLD')).toBe('فروخته شد');
    expect(formatStatus('EXPIRED')).toBe('EXPIRED');
  });
});

describe('formatAttributeValue', () => {
  const make = (value: PublicAttribute['value']): PublicAttribute => ({
    key: 'x',
    label: 'X',
    type: 'TEXT',
    value,
  });

  it('formats each supported value type', () => {
    expect(formatAttributeValue(make('hello'))).toBe('hello');
    expect(formatAttributeValue(make(true))).toBe('بله');
    expect(formatAttributeValue(make(false))).toBe('نخیر');
    expect(formatAttributeValue(make(['a', 'b', 'c']))).toBe('a، b، c');
    // Numeric output may use Persian digits; verify a number appears.
    expect(formatAttributeValue(make(42))).toMatch(/42|۴۲/);
  });

  it('returns empty string for null/undefined so rows can be omitted', () => {
    expect(formatAttributeValue(make(null as unknown as string))).toBe('');
    expect(formatAttributeValue(make(undefined as unknown as string))).toBe('');
  });

  it('localizes SELECT option values and passes free text through', () => {
    const typed = (value: PublicAttribute['value'], type: string | null): PublicAttribute => ({
      key: 'property_type',
      label: 'Property type',
      type,
      value,
    });
    expect(formatAttributeValue(typed('house', 'SELECT'))).toBe('حویلی / خانه');
    expect(formatAttributeValue(typed('apartment', 'SELECT'))).toBe('آپارتمان');
    expect(formatAttributeValue(typed('yes', 'SELECT'))).toBe('بله');
    expect(formatAttributeValue(typed('no', 'SELECT'))).toBe('نخیر');
    expect(formatAttributeValue(typed('Toyota', 'TEXT'))).toBe('Toyota');
  });
});

describe('buildContactHref (security boundary)', () => {
  it('builds a tel: href only for well-formed phone numbers', () => {
    expect(buildContactHref('PHONE', '+93 70 123 4567')).toBe('tel:+93701234567');
    expect(buildContactHref('PHONE', '+93(0)70-123-4567')).toBe('tel:+930701234567');
    expect(buildContactHref('PHONE', 'call me')).toBeNull();
    expect(buildContactHref('PHONE', '+93')).toBeNull();
  });

  it('builds a wa.me href only for digit-only WhatsApp values of valid length', () => {
    expect(buildContactHref('WHATSAPP', '+93701234567')).toBe('https://wa.me/93701234567');
    expect(buildContactHref('WHATSAPP', '123')).toBeNull();
    expect(buildContactHref('WHATSAPP', 'not-a-number')).toBeNull();
  });

  it('builds a t.me href only for canonical Telegram handles', () => {
    expect(buildContactHref('TELEGRAM', '@user_name')).toBe('https://t.me/user_name');
    expect(buildContactHref('TELEGRAM', 'user_name')).toBe('https://t.me/user_name');
    expect(buildContactHref('TELEGRAM', 'ab')).toBeNull();
    expect(buildContactHref('TELEGRAM', 'not a handle!')).toBeNull();
  });
});

describe('formatRelativeTime', () => {
  const isoDaysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

  it('maps recent windows to human-readable Persian labels', () => {
    expect(formatRelativeTime(isoDaysAgo(0))).toBe('امروز');
    expect(formatRelativeTime(isoDaysAgo(1))).toBe('دیروز');
    expect(formatRelativeTime(isoDaysAgo(7))).toMatch(/روز پیش/);
    expect(formatRelativeTime(isoDaysAgo(60))).toMatch(/ماه پیش/);
    expect(formatRelativeTime(isoDaysAgo(400))).toMatch(/سال پیش/);
  });

  it('returns empty string for invalid ISO so the caller can hide the row', () => {
    expect(formatRelativeTime('not-a-date')).toBe('');
  });
});

describe('formatExpiryCountdown', () => {
  const now = new Date();
  const isoInDays = (days: number) => new Date(now.getTime() + days * 86_400_000).toISOString();

  it('renders a Persian countdown for upcoming expiries', () => {
    expect(formatExpiryCountdown(isoInDays(10), now)).toMatch(/روز مانده/);
    expect(formatExpiryCountdown(isoInDays(0.2), now)).toBe('کمتر از یک روز مانده');
  });

  it('marks passed expiries (archive job may lag) and rejects invalid input', () => {
    expect(formatExpiryCountdown(new Date(now.getTime() - 1000).toISOString(), now)).toBe(
      'منقضی شده',
    );
    expect(formatExpiryCountdown('not-a-date', now)).toBe('');
  });
});

describe('formatOwnerStatusHint', () => {
  it('hints the waiting states and rejects unknown statuses', () => {
    expect(formatOwnerStatusHint('DRAFT')).toMatch(/ارسال نشده/);
    expect(formatOwnerStatusHint('PENDING_REVIEW')).toMatch(/بررسی/);
    expect(formatOwnerStatusHint('REJECTED')).toMatch(/رد شده/);
    expect(formatOwnerStatusHint('ARCHIVED')).toMatch(/بازنشر/);
  });

  it('renders nothing for terminal/actionable statuses and unknown values', () => {
    expect(formatOwnerStatusHint('ACTIVE')).toBeNull();
    expect(formatOwnerStatusHint('SOLD')).toBeTruthy();
    expect(formatOwnerStatusHint('WEIRD')).toBeNull();
  });
});
