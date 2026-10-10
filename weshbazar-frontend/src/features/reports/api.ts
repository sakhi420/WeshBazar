/**
 * Reports feature — data access (master prompt §2, §3).
 *
 * POST /listings/{id}/reports with an Idempotency-Key. Backend enforces:
 * verified phone (PHONE_NOT_VERIFIED), one open report per listing
 * (REPORT_ALREADY_OPEN), and CANNOT_REPORT_OWN_LISTING.
 */

import { newIdempotencyKey, post } from '@/lib/api';
import type { Report, SubmitReportInput } from './types';

export interface SubmitReportOptions {
  /** Reuse across retries of the same intent; generate a fresh one per intent. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

/** Submit a report for a listing. */
export function submitListingReport(
  listingId: string,
  input: SubmitReportInput,
  options: SubmitReportOptions = {},
): Promise<Report> {
  const description = input.description?.trim();
  return post<Report>(
    `/listings/${encodeURIComponent(listingId)}/reports`,
    {
      reason: input.reason,
      // `undefined` is dropped by JSON.stringify — omit an empty description.
      description: description ? description : undefined,
    },
    {
      idempotencyKey: options.idempotencyKey ?? newIdempotencyKey(),
      signal: options.signal,
    },
  );
}
