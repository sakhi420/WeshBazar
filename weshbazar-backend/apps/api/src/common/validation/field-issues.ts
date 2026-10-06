/**
 * Helpers for service-level payload issues that mirror the DTO validation
 * shape (`details.errors` with per-field messages), so custom checks in
 * services surface exactly like failures from the global validation pipe.
 */
import { AppException } from '../errors/app.exception';
import { isValidSlugFormat } from '../utils/slug.utils';
import type { FieldValidationIssue } from './validation.pipe';

export const SLUG_ISSUE_MESSAGE =
  'Slug must be 2–140 characters of lowercase letters, digits and hyphens.';

export function assertNoIssues(issues: FieldValidationIssue[]): void {
  if (issues.length > 0) {
    throw new AppException('VALIDATION_ERROR', { details: { errors: issues } });
  }
}

/**
 * Service-level slug guard for explicitly provided slugs (the DTO already
 * enforces the pattern; this covers paths that bypass the HTTP layer).
 */
export function assertValidSlugInput(slug: string | undefined): void {
  if (slug !== undefined && !isValidSlugFormat(slug)) {
    assertNoIssues([{ field: 'slug', messages: [SLUG_ISSUE_MESSAGE] }]);
  }
}
