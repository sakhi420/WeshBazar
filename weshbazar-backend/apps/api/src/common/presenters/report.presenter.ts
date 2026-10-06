/**
 * Report presenter (spec §56).
 *
 * Reports are a moderation surface: submitters see their own report back;
 * the moderation queue (Phase 11) will reuse the same row shape.
 */
import type { Report } from '../../generated/prisma/client';
import type { ReportReason, ReportStatus } from '../../generated/prisma/enums';

export interface ReportView {
  id: string;
  listingId: string | null;
  reportedUserId: string | null;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toReportView(row: Report): ReportView {
  return {
    id: row.id,
    listingId: row.listingId,
    reportedUserId: row.reportedUserId,
    reason: row.reason,
    description: row.description,
    status: row.status,
    resolvedAt: row.resolvedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
