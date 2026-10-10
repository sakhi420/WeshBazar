/**
 * Form-level error banner (auth forms). One alert per form for errors that
 * are not bound to a specific field (INVALID_CREDENTIALS, RATE_LIMITED, …).
 */

import type { ReactNode } from 'react';
import { CircleAlert } from 'lucide-react';
import { ApiError, ApiErrorCode } from '@/lib/api';

/**
 * Map a VALIDATION_ERROR's `details[]` onto a field-name → message record
 * (frontend-error-map.md §4). Returns an empty record for other codes.
 */
export function bindFieldErrors(error: unknown): Record<string, string> {
  const map: Record<string, string> = {};
  if (error instanceof ApiError && error.code === ApiErrorCode.VALIDATION_ERROR) {
    for (const detail of error.fieldErrors) {
      map[detail.field] = detail.message;
    }
  }
  return map;
}

export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/5 px-3 py-2 text-ui text-danger"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.8} />
      <span>{children}</span>
    </p>
  );
}

/** Quiet info banner (neutral) — e.g. "you were signed out" notices. */
export function FormNotice({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="status"
      className="rounded-control border border-info/30 bg-info/5 px-3 py-2 text-ui text-foreground/90"
    >
      {children}
    </p>
  );
}
