/**
 * Pure auth-form helpers (master prompt §7, §25–29). Zero React/DOM imports so
 * both server and client modules can use them and behavior tests stay fast.
 *
 * Phone/password checks here are only early guards and guidance; the backend
 * remains the authority (INVALID_PHONE_NUMBER / WEAK_PASSWORD / OTP_* codes).
 */

/** Digits expected by the configured backend OTP (OTP_LENGTH default 6). */
export const OTP_CODE_LENGTH = 6;
/** Backend accepts a 4–10 digit code (VerifyCodeDto pattern). */
export const OTP_MIN_DIGITS = 4;
export const OTP_MAX_DIGITS = 10;
/** Contract RegisterDto minLength; the full policy is enforced server-side. */
export const MIN_PASSWORD_LENGTH = 8;
/** Mirrors the backend OTP resend cooldown when no resendAvailableAt is sent. */
export const RESEND_COOLDOWN_FALLBACK_SECONDS = 60;
/** Upper bound for any server-provided cooldown so timers stay sane. */
const MAX_COOLDOWN_SECONDS = 300;

/**
 * Normalize a phone number for submission: strip whitespace, separators and
 * bidi marks while keeping an optional leading `+`.
 */
export function normalizePhone(raw: string): string {
  return raw.replace(/[\s()\-.\u200c\u2010-\u2015]/g, '');
}

/** Cheap plausibility check (backend INVALID_PHONE_NUMBER is authoritative). */
export function isPlausiblePhone(normalized: string): boolean {
  return /^\+?\d{9,15}$/.test(normalized);
}

/**
 * Keep only digits and cap the length — OTP inputs are digit-only. Persian and
 * Arabic-Indic digits are converted to Latin so the same code always matches.
 */
export function stripToDigits(value: string, maxLength: number): string {
  const latin = value.replace(/[\u06f0-\u06f9]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0x06f0 + 0x30),
  ).replace(/[\u0660-\u0669]/g, (d) =>
    String.fromCharCode(d.charCodeAt(0) - 0x0660 + 0x30),
  );
  return latin.replace(/\D/g, '').slice(0, maxLength);
}

/**
 * Pick the first value from a possibly-array Next.js search param — used by
 * the §25–29 Server Component pages when reading `?next=`, `?reset=`, `?phone=`.
 */
export function firstParamValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Sanitize the `?next=` redirect target: internal, single-slash paths only.
 * Backslashes and control characters are rejected because browsers may
 * normalize them into protocol-relative URLs (open-redirect vector).
 */
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (!raw) return '/';
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  if (/[\\\u0000-\u001f]/.test(value)) return '/';
  return value;
}

/** Short-password guide line — shared by guidance and the inline check. */
const SHORT_PASSWORD_GUIDE = `حداقل ${toPersianDigits(MIN_PASSWORD_LENGTH)} نویسه داشته باشد.`;

/** Persian guidance lines describing the configured password policy. */
export function passwordGuides(): string[] {
  return [
    SHORT_PASSWORD_GUIDE,
    'حداقل یک حرف لاتین داشته باشد.',
    'حداقل یک رقم داشته باشد.',
  ];
}

/** Issues found by the same quick checks the form performs before sending. */
export function passwordIssues(password: string): string[] {
  const issues: string[] = [];
  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push(SHORT_PASSWORD_GUIDE);
  }
  if (!/[A-Za-z]/.test(password)) issues.push('حداقل یک حرف لاتین داشته باشد.');
  if (!/\d/.test(password)) issues.push('حداقل یک رقم داشته باشد.');
  return issues;
}

/** Whole seconds from `now` until an ISO timestamp, clamped to [0, 300]. */
export function secondsUntil(iso: string | null | undefined, now: number = Date.now()): number {
  if (!iso) return 0;
  const target = Date.parse(iso);
  if (!Number.isFinite(target)) return 0;
  const seconds = Math.ceil((target - now) / 1000);
  return Math.min(MAX_COOLDOWN_SECONDS, Math.max(0, seconds));
}

/** Cooldown from a 429 Retry-After value (seconds), clamped like above. */
export function cooldownFromRetryAfter(retryAfterSeconds: number | undefined): number {
  const base = retryAfterSeconds ?? RESEND_COOLDOWN_FALLBACK_SECONDS;
  return Math.min(MAX_COOLDOWN_SECONDS, Math.max(0, Math.ceil(base)));
}

/** Convert every Latin digit in a value to its Persian counterpart. */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(digit)));
}

/** Persian countdown label for a resend button — "۱:۰۵" style. */
export function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return toPersianDigits(`${minutes}:${seconds.toString().padStart(2, '0')}`);
}
