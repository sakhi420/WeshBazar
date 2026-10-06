/**
 * Locale resolution for localized content (spec §28).
 *
 * The marketplace ships English, Dari and Pashto. Storage uses the short
 * primary subtags (`en`, `fa`, `ps`); clients may send BCP-47 forms such as
 * `fa-AF` / `ps-AF` and they normalize to the stored values.
 */
export const SUPPORTED_LOCALES = ['en', 'fa', 'ps'] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Normalize any BCP-47-ish input (`fa-AF`, `FA_af`, `ps`) to a supported
 * locale, or `null` when the primary subtag is not supported.
 */
export function normalizeLocale(input: unknown): Locale | null {
  if (typeof input !== 'string') {
    return null;
  }
  const primary = input.trim().toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LOCALES as readonly string[]).includes(primary) ? (primary as Locale) : null;
}

/** Normalize with a safe fallback to the default locale. */
export function resolveLocale(input: unknown): Locale {
  return normalizeLocale(input) ?? DEFAULT_LOCALE;
}

/**
 * Pick the translation row for `locale`, falling back to the default locale,
 * then to the first available row (defensive for incomplete data).
 */
export function pickTranslation<T extends { locale: string }>(
  rows: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    rows.find((row) => row.locale === locale) ??
    rows.find((row) => row.locale === DEFAULT_LOCALE) ??
    rows[0]
  );
}
