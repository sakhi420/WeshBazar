/**
 * Reports feature — display formatting (master prompt §25 microcopy).
 * Persian/Dari copy for report reasons; unknown values pass through so bad
 * data never crashes the dialog.
 */

import { REPORT_REASONS, type ReportReason } from './types';

const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  SCAM: 'کلاهبرداری',
  STOLEN: 'کالای دزدی',
  PROHIBITED_ITEM: 'کالای ممنوعه',
  SPAM: 'هرزنامه یا تبلیغات',
  MISLEADING: 'اطلاعات گمراه‌کننده',
  DUPLICATE: 'آگهی تکراری',
  OFFENSIVE: 'محتوای توهین‌آمیز',
  OTHER: 'دیگر',
};

/** Persian/Dari label for a report reason; unknown values pass through. */
export function formatReportReason(reason: string): string {
  return REPORT_REASON_LABELS[reason as ReportReason] ?? reason;
}

/** Reason options for the report form, in contract order. */
export const REPORT_REASON_OPTIONS = REPORT_REASONS.map((reason) => ({
  value: reason,
  label: REPORT_REASON_LABELS[reason],
}));
