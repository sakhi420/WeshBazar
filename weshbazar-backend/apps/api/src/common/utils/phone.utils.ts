/**
 * Phone number normalization built on libphonenumber-js.
 *
 * `phoneNormalized` (E.164) is the only uniqueness/authentication key in the
 * database; the raw user-entered string is kept for display only.
 */
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/** Default region for numbers entered without an international prefix. */
export const DEFAULT_PHONE_REGION: CountryCode = 'AF';

/**
 * Normalize a user-entered phone number to E.164, or return null when the
 * number is not valid for its region.
 */
export function normalizePhone(
  input: string,
  defaultRegion: CountryCode = DEFAULT_PHONE_REGION,
): string | null {
  const parsed = parsePhoneNumberFromString(input.trim(), defaultRegion);
  if (!parsed || !parsed.isValid()) {
    return null;
  }
  return parsed.number;
}

/** Mask an E.164 number for display ("+93701234567" → "+93*****4567"). */
export function maskPhone(e164: string): string {
  if (e164.length <= 8) {
    return e164;
  }
  return `${e164.slice(0, 3)}${'*'.repeat(e164.length - 7)}${e164.slice(-4)}`;
}
