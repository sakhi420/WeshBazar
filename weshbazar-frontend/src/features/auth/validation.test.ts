/**
 * Behavior tests for the auth form helpers (master prompt §7, §25–29, §123).
 * These pure functions guard redirect targets (open-redirect protection),
 * normalize phones for the frozen DTOs, and drive the OTP resend cooldown,
 * so each security-relevant edge gets an explicit case.
 */

import {
  RESEND_COOLDOWN_FALLBACK_SECONDS,
  cooldownFromRetryAfter,
  firstParamValue,
  formatCountdown,
  isPlausiblePhone,
  normalizePhone,
  passwordGuides,
  passwordIssues,
  sanitizeNextPath,
  secondsUntil,
  stripToDigits,
  toPersianDigits,
} from './validation';

describe('sanitizeNextPath', () => {
  it('defaults to root for empty input', () => {
    expect(sanitizeNextPath(null)).toBe('/');
    expect(sanitizeNextPath(undefined)).toBe('/');
    expect(sanitizeNextPath('')).toBe('/');
    expect(sanitizeNextPath('   ')).toBe('/');
  });

  it('keeps internal paths with query strings', () => {
    expect(sanitizeNextPath('/search?q=iphone')).toBe('/search?q=iphone');
    expect(sanitizeNextPath('/listing/abc-123')).toBe('/listing/abc-123');
  });

  it('rejects protocol-relative and absolute URLs', () => {
    expect(sanitizeNextPath('//evil.example.com')).toBe('/');
    expect(sanitizeNextPath('https://evil.example.com')).toBe('/');
    expect(sanitizeNextPath('javascript:alert(1)')).toBe('/');
  });

  it('rejects backslashes and control characters', () => {
    expect(sanitizeNextPath('/\\evil.example.com')).toBe('/');
    expect(sanitizeNextPath('/a\u0000b')).toBe('/');
    expect(sanitizeNextPath('/a\u001fb')).toBe('/');
  });
});

describe('normalizePhone', () => {
  it('strips separators, spaces and bidi marks but keeps a leading +', () => {
    expect(normalizePhone('+93 700 (123) 456')).toBe('+93700123456');
    expect(normalizePhone('0700-123-456')).toBe('0700123456');
    expect(normalizePhone('0700\u200c123.456')).toBe('0700123456');
  });
});

describe('isPlausiblePhone', () => {
  it('accepts 9–15 digits with an optional plus', () => {
    expect(isPlausiblePhone('0700123456')).toBe(true);
    expect(isPlausiblePhone('+93700123456')).toBe(true);
  });

  it('rejects too short, too long, or non-digit input', () => {
    expect(isPlausiblePhone('12345678')).toBe(false);
    expect(isPlausiblePhone('1'.repeat(16))).toBe(false);
    expect(isPlausiblePhone('07abc12345')).toBe(false);
  });
});

describe('stripToDigits', () => {
  it('converts Persian and Arabic-Indic digits to Latin', () => {
    expect(stripToDigits('۱۲۳۴۵۶', 10)).toBe('123456');
    expect(stripToDigits('٤٥٦', 10)).toBe('456');
  });

  it('drops non-digits and caps the length', () => {
    expect(stripToDigits('12 34-56', 4)).toBe('1234');
    expect(stripToDigits('abc', 10)).toBe('');
  });
});

describe('passwordIssues', () => {
  it('accepts a password that satisfies the configured policy', () => {
    expect(passwordIssues('secret123')).toEqual([]);
  });

  it('flags short, letter-less, and digit-less passwords', () => {
    expect(passwordIssues('a1')).toHaveLength(1);
    expect(passwordIssues('12345678')).toHaveLength(1);
    expect(passwordIssues('abcdefgh')).toHaveLength(1);
  });

  it('writes the length guide with a Persian digit', () => {
    expect(passwordGuides().join(' ')).toContain('حداقل ۸ نویسه');
    expect(passwordIssues('a1')[0]).toContain('۸');
  });
});

describe('secondsUntil', () => {
  const now = Date.parse('2026-10-08T12:00:00.000Z');

  it('returns 0 for missing, invalid, or past timestamps', () => {
    expect(secondsUntil(null, now)).toBe(0);
    expect(secondsUntil('not-a-date', now)).toBe(0);
    expect(secondsUntil('2026-10-08T11:59:00.000Z', now)).toBe(0);
  });

  it('rounds up to whole seconds and clamps to 300', () => {
    expect(secondsUntil('2026-10-08T12:00:45.000Z', now)).toBe(45);
    expect(secondsUntil('2026-10-08T12:00:00.500Z', now)).toBe(1);
    expect(secondsUntil('2026-10-08T13:00:00.000Z', now)).toBe(300);
  });
});

describe('cooldownFromRetryAfter', () => {
  it('falls back to the OTP resend cooldown when missing', () => {
    expect(cooldownFromRetryAfter(undefined)).toBe(RESEND_COOLDOWN_FALLBACK_SECONDS);
  });

  it('clamps to [0, 300] and rounds up', () => {
    expect(cooldownFromRetryAfter(30)).toBe(30);
    expect(cooldownFromRetryAfter(29.2)).toBe(30);
    expect(cooldownFromRetryAfter(-5)).toBe(0);
    expect(cooldownFromRetryAfter(9999)).toBe(300);
  });
});

describe('formatCountdown / toPersianDigits', () => {
  it('formats seconds as a Persian mm:ss label', () => {
    expect(formatCountdown(65)).toBe('۱:۰۵');
    expect(formatCountdown(0)).toBe('۰:۰۰');
    expect(formatCountdown(300)).toBe('۵:۰۰');
  });

  it('converts every Latin digit in a mixed value', () => {
    expect(toPersianDigits('123abc456')).toBe('۱۲۳abc۴۵۶');
    expect(toPersianDigits(7)).toBe('۷');
  });
});

describe('firstParamValue', () => {
  it('picks the first item of repeated params', () => {
    expect(firstParamValue(['a', 'b'])).toBe('a');
    expect(firstParamValue([])).toBeNull();
  });

  it('passes through single values and missing params', () => {
    expect(firstParamValue('x')).toBe('x');
    expect(firstParamValue(undefined)).toBeNull();
  });
});
