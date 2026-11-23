/**
 * Shared validation issue types and helpers.
 *
 * Internally, validators may group several messages for one field. The frozen
 * API v1 contract exposes each issue as a separate { field, message } item.
 */
import { AppException } from '../errors/app.exception';
import { isValidSlugFormat } from '../utils/slug.utils';
export interface FieldValidationIssue {
  field: string;
  messages: string[];
}

export interface ApiFieldValidationError {
  field: string;
  message: string;
}

/** Convert grouped internal issues to the API v1 field/message array. */
export function toApiFieldErrors(
  issues: readonly FieldValidationIssue[],
): ApiFieldValidationError[] {
  return issues.flatMap((issue) =>
    issue.messages.map((message) => ({ field: issue.field, message })),
  );
}

export const SLUG_ISSUE_MESSAGE =
  'Slug must be 2–140 characters of lowercase letters, digits and hyphens.';

export function assertNoIssues(issues: FieldValidationIssue[]): void {
  if (issues.length > 0) {
    throw new AppException('VALIDATION_ERROR', { details: toApiFieldErrors(issues) });
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
