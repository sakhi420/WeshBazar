/**
 * Translation-input normalization for localized resources (categories,
 * provinces, cities — spec §28).
 *
 * Inputs accept BCP-47 aliases (`fa-AF` → `fa`); duplicates collapse per
 * locale (last entry wins) and optionally the default locale can be required
 * so every resource has a fallback name.
 */
import { assertNoIssues } from '../validation/field-issues';
import type { FieldValidationIssue } from '../validation/validation.pipe';
import { SUPPORTED_LOCALES, normalizeLocale, type Locale } from './locale.utils';

export interface TranslationInput {
  locale: string;
  name: string;
  description?: string | null;
}

export interface NormalizedTranslation {
  locale: Locale;
  name: string;
  description: string | null;
}

export function normalizeTranslations(
  rows: readonly TranslationInput[],
  requireLocale?: Locale,
): NormalizedTranslation[] {
  const issues: FieldValidationIssue[] = [];
  const byLocale = new Map<Locale, NormalizedTranslation>();

  rows.forEach((row, index) => {
    const locale = normalizeLocale(row.locale);
    if (locale === null) {
      issues.push({
        field: `translations[${index}].locale`,
        messages: [
          `Unsupported locale "${row.locale}". Supported locales: ${SUPPORTED_LOCALES.join(', ')}.`,
        ],
      });
      return;
    }
    const name = row.name.trim();
    if (name.length === 0) {
      issues.push({
        field: `translations[${index}].name`,
        messages: ['Translation name must not be empty.'],
      });
      return;
    }
    byLocale.set(locale, {
      locale,
      name,
      description: row.description?.trim() || null,
    });
  });

  if (requireLocale !== undefined && !byLocale.has(requireLocale)) {
    issues.push({
      field: 'translations',
      messages: [`At least one "${requireLocale}" translation is required.`],
    });
  }

  assertNoIssues(issues);
  return [...byLocale.values()];
}
