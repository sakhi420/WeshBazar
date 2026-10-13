'use client';

import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { queryKeys, get, ApiError, type PageResult } from '@/lib/api';
import { formatRelativeTime } from '@/features/listings';
import { useAuthBootstrap } from '@/features/auth';
import { AdminAccessDenied } from './admin-access-denied';

interface AdminReportItem {
  id: string;
  listing: { id: string; slug: string; title: string };
  reporter: { id: string; displayName: string };
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
}

function fetchAdminReports(): Promise<PageResult<AdminReportItem>> {
  return get<AdminReportItem[]>('/admin/reports').then((data) => ({
    items: data as unknown as AdminReportItem[],
    page: 1,
    limit: 20,
    total: (data as unknown as AdminReportItem[]).length,
    totalPages: 1,
    hasMore: false,
  }));
}

const REASON_LABELS: Record<string, string> = {
  PROHIBITED_ITEM: 'کالای ممنوعه', MISLEADING: 'اطلاعات گمراه‌کننده', SPAM: 'هرزنامه',
  DUPLICATE: 'آگهی تکراری', BAD_PHOTO: 'تصاویر نامناسب', OFFENSIVE: 'محتوای توهین‌آمیز',
  SCAM: 'کلاهبرداری', OTHER: 'سایر',
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'باز', UNDER_REVIEW: 'در حال بررسی', RESOLVED: 'بسته', DISMISSED: 'رد شده',
};

export function AdminReportsView() {
  const { status, user } = useAuthBootstrap();
  const enabled = status === 'ready' && user !== null && user.role !== 'USER';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.reports({}),
    queryFn: fetchAdminReports,
    enabled,
  });

  if (status === 'checking') return <Loader2 className="mx-auto mt-8 size-6 animate-spin text-muted-foreground" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;

  const reports = data?.items ?? [];

  if (isLoading) return <Loader2 className="mx-auto mt-6 size-5 animate-spin text-muted-foreground" />;
  if (isError) return <ErrorState requestId={error instanceof ApiError ? error.requestId : undefined} onRetry={() => void refetch()} />;

  if (reports.length === 0) {
    return <EmptyState icon={ShieldAlert} title="گزارشی در انتظار بررسی نیست" description="همهٔ گزارش‌ها بررسی شده‌اند." />;
  }

  return (
    <div className="space-y-4">
      {reports.map((r) => (
        <div key={r.id} className="rounded-card border border-border bg-surface p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-ui font-semibold text-foreground">{REASON_LABELS[r.reason] ?? r.reason}</p>
              <p className="mt-1 text-meta text-muted-foreground">آگهی: {r.listing.title} · گزارش‌دهنده: {r.reporter.displayName}</p>
              {r.description ? <p className="mt-2 whitespace-pre-line text-meta text-muted-foreground">{r.description}</p> : null}
            </div>
            <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-caption font-medium text-warning">{STATUS_LABELS[r.status] ?? r.status}</span>
          </div>
          <p className="mt-2 text-caption text-muted-foreground">{formatRelativeTime(r.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}