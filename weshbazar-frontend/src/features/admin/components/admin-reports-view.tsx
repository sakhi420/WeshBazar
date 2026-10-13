'use client';

/**
 * Admin reports view (§45) — report queue with status filtering.
 *
 * Session-gated exactly like the dashboard (§43): guests are routed to login
 * with `next` preserved. A signed-in USER lands on the honest access-denied
 * surface. A stale-role 403 or dead session routes back to login (§42).
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { parseAsInteger, parseAsStringLiteral } from 'nuqs';
import { Loader2, ShieldAlert } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/features/listings';
import { useAuthBootstrap } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { isForbiddenError, isSessionLostError } from '../errors';
import { useAdminReports } from '../hooks';
import { AdminAccessDenied } from './admin-access-denied';

// --- URL state parsers (nuqs) -----------------------------------------------

const statusParser = parseAsStringLiteral(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] as const);
const pageParser = parseAsInteger;

// --- Labels -----------------------------------------------------------------

const REASON_LABELS: Record<string, string> = {
  PROHIBITED_ITEM: 'کالای ممنوعه', MISLEADING: 'اطلاعات گمراه‌کننده', SPAM: 'هرزنامه',
  DUPLICATE: 'آگهی تکراری', BAD_PHOTO: 'تصاویر نامناسب', OFFENSIVE: 'محتوای توهین‌آمیز',
  SCAM: 'کلاهبرداری', OTHER: 'سایر',
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'باز', UNDER_REVIEW: 'در حال بررسی', RESOLVED: 'بسته', DISMISSED: 'رد شده',
};
const STATUS_TABS = [
  { key: '', label: 'همه' },
  { key: 'OPEN', label: 'باز' },
  { key: 'UNDER_REVIEW', label: 'در حال بررسی' },
  { key: 'RESOLVED', label: 'بسته' },
  { key: 'DISMISSED', label: 'رد شده' },
] as const;

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/reports')}`;

export function AdminReportsView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();

  // No session → sign-in required before the queue can render.
  useEffect(() => {
    if (status === 'anonymous') router.replace(LOGIN_HREF);
  }, [status, router]);

  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  // URL-driven pagination + status filter.
  const [statusParam, setStatusParam] = useQueryState('status', statusParser);
  const [pageParam, setPageParam] = useQueryState('page', pageParser);
  const page = pageParam ?? 1;

  const params = useMemo(() => ({
    status: statusParam ?? undefined,
    page,
    limit: 20,
  }), [statusParam, page]);

  const enabled = status === 'ready' && user !== null && user.role !== 'USER';
  const reports = useAdminReports(params, enabled);
  const denied = isForbiddenError(reports.error);
  const sessionLost = isSessionLostError(reports.error);

  useEffect(() => {
    if (sessionLost) gotoLogin();
  }, [sessionLost, gotoLogin]);

  // --- Gate states ---------------------------------------------------------

  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable') return (
    <ErrorState title="ارتباط با سرور برقرار نشد" description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید." onRetry={retry} />
  );
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;
  if (denied) return <AdminAccessDenied />;

  // --- Data states ---------------------------------------------------------

  const items = reports.data?.items ?? [];
  const total = reports.data?.total ?? 0;
  const totalPages = reports.data?.totalPages ?? 1;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status filter tabs */}
      <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="فیلتر وضعیت">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { void setStatusParam(tab.key || null); void setPageParam(null); }}
            className={cn(
              'whitespace-nowrap rounded-t-control px-3 py-2 text-caption font-medium transition-colors',
              (statusParam ?? '') === tab.key ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {reports.isPending ? <ReportsSkeleton /> :
       reports.isError ? <ErrorState requestId={reports.error instanceof ApiError ? reports.error.requestId : undefined} title="دریافت گزارش‌ها ناموفق بود" onRetry={() => void reports.refetch()} /> :
       items.length === 0 ? <EmptyState icon={ShieldAlert} title="گزارشی در انتظار بررسی نیست" description="همهٔ گزارش‌ها بررسی شده‌اند." /> :
       <>
         <div className={cn('space-y-3', reports.isPlaceholderData && 'opacity-60')}>
           {items.map((r) => (
             <div key={r.id} className="rounded-card border border-border bg-surface p-4">
               <div className="flex items-start justify-between gap-3">
                 <div className="min-w-0">
                   <p className="text-ui font-semibold text-foreground">{REASON_LABELS[r.reason] ?? r.reason}</p>
                   <p className="mt-1 text-meta text-muted-foreground">
                     آگهی: {r.listing.title} · گزارش‌دهنده: {r.reporter.displayName}
                   </p>
                   {r.description ? <p className="mt-2 whitespace-pre-line text-meta text-muted-foreground">{r.description}</p> : null}
                 </div>
                 <span className="shrink-0 rounded-full bg-warning/10 px-2.5 py-1 text-caption font-medium text-warning">
                   {STATUS_LABELS[r.status] ?? r.status}
                 </span>
               </div>
               <p className="mt-2 text-caption text-muted-foreground">{formatRelativeTime(r.createdAt)}</p>
             </div>
           ))}
         </div>

         {/* Pagination */}
         {totalPages > 1 && (
           <div className="flex items-center justify-between gap-3">
             <p className="text-caption text-muted-foreground">{total.toLocaleString('fa-IR')} گزارش</p>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" disabled={page <= 1 || reports.isFetching} onClick={() => void setPageParam(page - 1)}>قبلی</Button>
               <span className="text-caption text-muted-foreground">صفحهٔ {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}</span>
               <Button variant="outline" size="sm" disabled={page >= totalPages || reports.isFetching} onClick={() => void setPageParam(page + 1)}>بعدی</Button>
             </div>
           </div>
         )}
       </>
      }
    </div>
  );
}

// --- Helpers ---------------------------------------------------------------

function AdminSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />{label}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-card border border-border bg-surface p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}