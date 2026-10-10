/**
 * Sell wizard — client-side validators (master prompt §36, §37, §39).
 *
 * Mirrors of the authoritative backend engines so the wizard fails fast:
 * title/description/price rules come from `listings.service.validateContent`
 * (§45–§46), dynamic-attribute rules from the taxonomy engine (§32), and
 * contact rules from `contact-methods` (§53). The server always has the final
 * say — these functions only power UX. Every validator returns a Persian
 * message or `null` when the value is valid.
 */

import type { FilterSchemaField } from '@/features/categories';
import type { AttributeValue, PricingType } from '../types';
import { formatNumber } from '../format';

/** Content limits mirrored from the backend environment defaults (§45). */
export const TITLE_MIN_LENGTH = 10;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MIN_LENGTH = 30;
export const DESCRIPTION_MAX_LENGTH = 5000;
/** Wire maximum for `price` (openapi CreateListingDto / UpdateListingDto). */
export const MAX_PRICE = 999999999999.99;
/** `YEAR` attributes accept 1900 … currentYear+1 (taxonomy §32). */
export const YEAR_MIN = 1900;

/** HTML tag detection — plain text only (§46); `<3` or `a < b` pass. */
const HTML_TAG = /<\s*\/?\s*[a-zA-Z][^>]*>/;
/** Control characters that corrupt storage and rendering (§46). */
// eslint-disable-next-line no-control-regex -- matching control characters is the point.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
/** Calendar-safe ISO date (rollover dates like 2025-02-30 fail the round trip). */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
/** Telegram usernames after `@`: a letter followed by 4–31 letters/digits/_. */
const TELEGRAM_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
/** Dialable shape for PHONE/WHATSAPP overrides; the server re-normalizes. */
const PHONE_OVERRIDE_PATTERN = /^\+?\d{9,15}$/;

const DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/** Convert Persian/Arabic-Indic digits to ASCII (inputs + payloads). */
export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => DIGIT_MAP[digit] ?? digit);
}

// --- Content (§45–§46) --------------------------------------------------------

/** Title rule: 10–120 chars, plain text, no control characters. */
export function validateTitle(raw: string): string | null {
  const value = raw.trim();
  if (value.length < TITLE_MIN_LENGTH) {
    return `عنوان باید حداقل ${formatNumber(TITLE_MIN_LENGTH)} نویسه باشد.`;
  }
  if (value.length > TITLE_MAX_LENGTH) {
    return `عنوان نباید بیشتر از ${formatNumber(TITLE_MAX_LENGTH)} نویسه باشد.`;
  }
  if (HTML_TAG.test(value)) return 'فقط متن ساده مجاز است؛ تگ HTML پشتیبانی نمی‌شود.';
  if (CONTROL_CHARS.test(value)) return 'متن شامل نویسه‌های کنترلی پشتیبانی‌نشده است.';
  return null;
}

/** Description rule: 30–5000 chars, plain text, no control characters. */
export function validateDescription(raw: string): string | null {
  const value = raw.trim();
  if (value.length < DESCRIPTION_MIN_LENGTH) {
    return `توضیحات باید حداقل ${formatNumber(DESCRIPTION_MIN_LENGTH)} نویسه باشد.`;
  }
  if (value.length > DESCRIPTION_MAX_LENGTH) {
    return `توضیحات نباید بیشتر از ${formatNumber(DESCRIPTION_MAX_LENGTH)} نویسه باشد.`;
  }
  if (HTML_TAG.test(value)) return 'فقط متن ساده مجاز است؛ تگ HTML پشتیبانی نمی‌شود.';
  if (CONTROL_CHARS.test(value)) return 'متن شامل نویسه‌های کنترلی پشتیبانی‌نشده است.';
  return null;
}

// --- Price (§45) ----------------------------------------------------------------

/**
 * Parse the wizard's raw price text to an amount. Persian/Arabic digits and
 * grouping separators are accepted; returns null when the text is not a
 * non-negative amount within the wire maximum.
 */
export function parsePriceAmount(raw: string): number | null {
  const cleaned = normalizeDigits(raw).replace(/[\s,٬،]/g, '');
  if (cleaned.length === 0 || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount) || amount < 0 || amount > MAX_PRICE) return null;
  return amount;
}

/**
 * Price rule: PAID requires a positive amount; FREE and CONTACT never expose
 * the field in the wizard — leftover input is ignored (the payload clears it).
 */
export function validatePriceField(raw: string, pricingType: PricingType): string | null {
  if (pricingType !== 'PAID') return null;
  const value = raw.trim();
  if (value.length === 0) return 'برای آگهی قیمت‌دار، مبلغ را وارد کنید.';
  const amount = parsePriceAmount(value);
  if (amount === null) return 'مبلغ باید یک عدد معتبر باشد.';
  if (amount <= 0) return 'مبلغ باید بیشتر از صفر باشد.';
  return null;
}

// --- Contact methods (§53) ------------------------------------------------------

/** Cleaned dialable override; null = fall back to the verified phone. */
export function normalizePhoneOverride(raw: string): string | null {
  const value = normalizeDigits(raw).replace(/[\s\-()]/g, '');
  return value.length === 0 ? null : value;
}

/** Optional PHONE/WHATSAPP override: empty passes, otherwise must be dialable. */
export function validatePhoneOverride(raw: string): string | null {
  const value = normalizePhoneOverride(raw);
  if (value === null) return null;
  return PHONE_OVERRIDE_PATTERN.test(value)
    ? null
    : 'شمارهٔ واردشده معتبر نیست؛ نمونه: ۰۷۰۱۲۳۴۵۶۷ یا +۹۳۷۰۱۲۳۴۵۶۷';
}

/** Canonical `@name` form; null when the handle is not a valid Telegram name. */
export function canonicalizeTelegramHandle(raw: string): string | null {
  const name = normalizeDigits(raw.trim()).replace(/^@+/, '');
  return TELEGRAM_NAME_PATTERN.test(name) ? `@${name}` : null;
}

/** Telegram rule: required when enabled, 5–32 chars after `@`, starts with a letter. */
export function validateTelegramHandle(raw: string): string | null {
  if (raw.trim().length === 0) return 'برای فعال‌کردن تلگرام، نام کاربری را وارد کنید.';
  if (canonicalizeTelegramHandle(raw) === null) {
    return 'نام کاربری تلگرام باید ۵ تا ۳۲ نویسه و با حرف شروع شود (نمونه: @weshbazar).';
  }
  return null;
}

/**
 * Contact configuration as edited in the wizard (§39). Shaped to match
 * `SellContactDraft` structurally so validation never imports draft state.
 */
export interface ContactConfig {
  phoneEnabled: boolean;
  whatsappEnabled: boolean;
  telegramEnabled: boolean;
  phoneOverride: string;
  whatsappOverride: string;
  telegramHandle: string;
}

/**
 * Contact step gate: at least one method stays enabled and every enabled row
 * satisfies the server rule. Error keys mirror the backend issue fields
 * (`contactMethods.PHONE`, …) so the step can bind them like API errors.
 */
export function validateContactConfig(contact: ContactConfig): Record<string, string> {
  const errors: Record<string, string> = {};
  if (contact.phoneEnabled) {
    const problem = validatePhoneOverride(contact.phoneOverride);
    if (problem !== null) errors['contactMethods.PHONE'] = problem;
  }
  if (contact.whatsappEnabled) {
    const problem = validatePhoneOverride(contact.whatsappOverride);
    if (problem !== null) errors['contactMethods.WHATSAPP'] = problem;
  }
  if (contact.telegramEnabled) {
    const problem = validateTelegramHandle(contact.telegramHandle);
    if (problem !== null) errors['contactMethods.TELEGRAM'] = problem;
  }
  if (!contact.phoneEnabled && !contact.whatsappEnabled && !contact.telegramEnabled) {
    errors.contactMethods = 'حداقل یک راه تماس را فعال نگه دارید.';
  }
  return errors;
}

// --- Dynamic attributes (§32, §37) ---------------------------------------------

/** Field key → first Persian error message. */
export type AttributeFieldErrors = Record<string, string>;

/**
 * Validate the attributes step against the category's effective schema.
 * Mirrors the taxonomy engine: required enforcement, per-type rules, ranges,
 * lengths, patterns and option membership. Unknown keys are ignored — the
 * payload builder drops them, so the server never sees them.
 */
export function validateAttributeValues(
  values: Record<string, AttributeValue>,
  fields: readonly FilterSchemaField[],
): AttributeFieldErrors {
  const errors: AttributeFieldErrors = {};
  for (const field of fields) {
    const message = validateSingleAttribute(field, values[field.field]);
    if (message !== null) errors[field.field] = message;
  }
  return errors;
}

/** Whole number from a form value or an already-typed number; null when invalid. */
export function parseWholeNumber(raw: AttributeValue | undefined): number | null {
  if (typeof raw === 'number') return Number.isInteger(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const cleaned = normalizeDigits(raw.trim()).replace(/[\s,٬،]/g, '');
  if (!/^-?\d+$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isInteger(amount) ? amount : null;
}

/** Decimal number from a form value or an already-typed number; null when invalid. */
export function parseDecimalNumber(raw: AttributeValue | undefined): number | null {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  if (typeof raw !== 'string') return null;
  const cleaned = normalizeDigits(raw.trim()).replace(/[\s,٬،]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

/**
 * Calendar-safe ISO date check (§32): the pattern alone would accept rollover
 * dates (`2025-02-30`), so the value must round-trip through `Date` unchanged.
 */
export function isValidIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isMissingValue(raw: AttributeValue | undefined): boolean {
  return (
    raw === undefined ||
    (typeof raw === 'string' && raw.trim().length === 0) ||
    (Array.isArray(raw) && raw.length === 0)
  );
}

function matchesPattern(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    // A stored pattern that cannot compile is never the user's fault; skip the
    // check and let the server outcome decide.
    return true;
  }
}

function checkRange(field: FilterSchemaField, value: number, label: string): string | null {
  if (field.min !== null && value < field.min) {
    return `«${label}» باید حداقل ${formatNumber(field.min)} باشد.`;
  }
  if (field.max !== null && value > field.max) {
    return `«${label}» نباید بیشتر از ${formatNumber(field.max)} باشد.`;
  }
  return null;
}

function validateSingleAttribute(
  field: FilterSchemaField,
  raw: AttributeValue | undefined,
): string | null {
  const label = field.label;
  if (isMissingValue(raw)) {
    return field.required ? `«${label}» الزامی است.` : null;
  }

  switch (field.type) {
    case 'TEXT':
    case 'LONG_TEXT': {
      if (typeof raw !== 'string') return `«${label}» باید متن باشد.`;
      const value = raw.trim();
      if (field.minLength !== null && value.length < field.minLength) {
        return `«${label}» باید حداقل ${formatNumber(field.minLength)} نویسه باشد.`;
      }
      if (field.maxLength !== null && value.length > field.maxLength) {
        return `«${label}» نباید بیشتر از ${formatNumber(field.maxLength)} نویسه باشد.`;
      }
      if (field.pattern !== null && !matchesPattern(field.pattern, value)) {
        return `«${label}» قالب مورد انتظار را ندارد.`;
      }
      return null;
    }
    case 'INTEGER': {
      const amount = parseWholeNumber(raw);
      if (amount === null) return `«${label}» باید یک عدد صحیح باشد.`;
      return checkRange(field, amount, label);
    }
    case 'YEAR': {
      const year = parseWholeNumber(raw);
      if (year === null) return `«${label}» باید یک سال چهاررقمی باشد.`;
      const maxYear = new Date().getFullYear() + 1;
      if (year < YEAR_MIN || year > maxYear) {
        return `«${label}» باید بین ${formatNumber(YEAR_MIN)} و ${formatNumber(maxYear)} باشد.`;
      }
      return checkRange(field, year, label);
    }
    case 'DECIMAL': {
      const amount = parseDecimalNumber(raw);
      if (amount === null) return `«${label}» باید یک عدد باشد.`;
      return checkRange(field, amount, label);
    }
    case 'BOOLEAN': {
      if (typeof raw !== 'boolean') return `«${label}» باید بله یا خیر باشد.`;
      return null;
    }
    case 'DATE': {
      if (typeof raw !== 'string' || !isValidIsoDate(raw)) {
        return `«${label}» باید یک تاریخ معتبر (YYYY-MM-DD) باشد.`;
      }
      return null;
    }
    case 'SELECT': {
      if (typeof raw !== 'string' || !field.options.some((option) => option.value === raw)) {
        return `«${label}» یکی از گزینه‌های مجاز نیست.`;
      }
      return null;
    }
    case 'MULTI_SELECT': {
      if (!Array.isArray(raw)) return `«${label}» باید فهرستی از گزینه‌ها باشد.`;
      const invalid = raw.some(
        (item) => typeof item !== 'string' || !field.options.some((option) => option.value === item),
      );
      if (invalid) return `«${label}» شامل گزینه‌های مجاز نیست.`;
      return null;
    }
    default:
      // Unknown schema types are never blocked client-side.
      return null;
  }
}
