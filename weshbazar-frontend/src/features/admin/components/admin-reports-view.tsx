'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { queryKeys, ApiError } from '@/lib/api';
import { AdminAccessDenied } from './admin-access-denied';
import { useAdminGate } from '../hooks';
import { get, type PageResult } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/features/listings';

interface AdminReportItem {
  id: string;
  listing: { id: string; slug: string; title: string };
  reporter: { id: string; displayName: string };
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
}

function fetchAdminReports(params: { page?: number }): Promise<PageResult<AdminReportItem>> {
  return get<AdminReportItem[]>('/admin/reports').then((data) => ({
    items: data as unknown as AdminReportItem[],
    page: params.page ?? 1,
    limit: 20,
    total: (data as unknown as AdminReportItem[]).length,
    totalPages: 1,
    hasMore: false,
  }));
}

export function AdminReportsView() {
  const { status, role } = useAdminGate();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.reports({}),
    queryFn: () => fetchAdminReports({}),
    enabled: status === 'ready',
  });

  if (status === 'checking') return <Loader2 className="mx-auto mt-8 size-6 animate-spin text-muted-foreground" />;
  if (status === 'anonymous' || status === 'unreachable') return <ErrorState onRetry={() => window.location.reload()} />;
  if (status === 'forbidden') return <AdminAccessDenied />;

  if (isLoading) return <Loader2 className="mx-auto mt-8 size-6 animate-spin text-muted-foreground" />;
  if (isError) return <ErrorState requestId={error instanceof ApiError ? error.requestId : undefined} onRetry={() => void refetch()} />;

  const reports = data?.items ?? [];

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="گزارشی در انتظار بررسی نیست"
        description="همهٔ گزارش‌ها بررسی شده‌اند."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-ui font-semibold text-foreground">{formatReason(report.reason)}</p>
              <p className="mt-1 text-meta text-muted-foreground">
                آگهی: {report.listing.title} · گزارش‌دهنده: {report.reporter.displayName}
              </p>
              {report.description ? (
                <p className="mt-2 whitespace-pre-line text-meta text-muted-foreground">{report.description}</p>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-caption font-medium text-warning">
              {formatStatus(report.status)}
            </span>
          </div>
          <p className="mt-2 text-caption text-muted-foreground">{formatRelativeTime(report.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

const REASON_LABELS: Record<string, string> = {
  PROHIBITED_ITEM: 'کالای ممنوعه',
  MISLEADING: 'اطلاعات گمراه‌کننده',
  SPAM: 'هرزنامه',
  DUPLICATE: 'آگهی تکراری',
  BAD_PHOTO: 'تصاویر نامناسب',
  OFFENSIVE: 'محتوای توهین‌آمیز',
  SCAM: 'کلاهبرداری',
  OTHER: 'سایر',
};

function formatReason(reason: string): string { return REASON_LABELS[reason] ?? reason; }
function formatStatus(status: string): string {
  const map: Record<string, string> = { OPEN: 'باز', UNDER_REVIEW: 'در حال بررسی', RESOLVED: 'بسته', DISMISSED: 'رد شده' };
  return map[status] ?? status;
}