/**
 * Reports feature — types (master prompt §2, §3).
 * Mirror of SubmitReportDto / ReportDto (docs/openapi.json) for
 * POST /listings/{id}/reports. Do not invent fields.
 */

/** SubmitReportDto.reason enum — order matches the frozen contract. */
export const REPORT_REASONS = [
  'SCAM',
  'STOLEN',
  'PROHIBITED_ITEM',
  'SPAM',
  'MISLEADING',
  'DUPLICATE',
  'OFFENSIVE',
  'OTHER',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

/** SubmitReportDto — request body. `reason` required; description ≤ 1000. */
export interface SubmitReportInput {
  reason: ReportReason;
  description?: string;
}

/** ReportDto — created report returned on 201. */
export interface Report {
  id: string;
  listingId?: string | null;
  reportedUserId?: string | null;
  reason: string;
  description?: string | null;
  status: string;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
