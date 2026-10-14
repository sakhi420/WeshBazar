'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { parseAsInteger, parseAsString } from 'nuqs';
import { FileText, Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthBootstrap } from '@/features/auth';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/features/listings';
import { isForbiddenError, isSessionLostError } from '../errors';
import { useAdminAuditLogs } from '../hooks';
import { ActiveFilterChips } from './ActiveFilterChips';
import { AdminAccessDenied } from './admin-access-denied';

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/audit')}`;

const ACTION_LABELS: Record<string, string> = {
  USER_SUSPENDED: 'تعلیق کاربر', USER_BANNED: 'مسدودیت کاربر', USER_RESTORED: 'بازگردانی کاربر',
  LISTING_APPROVED: 'تأیید آگهی', LISTING_REJECTED: 'رد آگهی',
  LISTING_ARCHIVED_BY_ADMIN: 'بایگانی آگهی', LISTING_RESTORED_BY_ADMIN: 'بازگردانی آگهی',
  REPORT_RESOLVED: 'حل گزارش', REPORT_DISMISSED: 'رد گزارش',
  CATEGORY_CREATED: 'ایجاد دسته‌بندی', CATEGORY_UPDATED: 'ویرایش دسته‌بندی',
  CATEGORY_DELETED: 'حذف دسته‌بندی',
  ATTRIBUTE_CREATED: 'ایجاد ویژگی', ATTRIBUTE_DELETED: 'حذف ویژگی',
  LOCATION_CREATED: 'ایجاد مکان', LOCATION_UPDATED: 'ویرایش مکان', LOCATION_DELETED: 'حذف مکان',
};
export function AdminAuditView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();
  useEffect(() => { if (status === 'anonymous') router.replace(LOGIN_HREF); }, [status, router]);
  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  const [pageParam, setPageParam] = useQueryState('page', parseAsInteger);
  const [actionParam, setActionParam] = useQueryState('action', parseAsString);
  const page = pageParam ?? 1;

  const params = useMemo(() => ({ action: actionParam ?? undefined, page, limit: 20 }), [actionParam, page]);
  const enabled = status === 'ready' && user !== null && user.role === 'ADMIN';
  const auditLogs = useAdminAuditLogs(params, enabled);
  const denied = isForbiddenError(auditLogs.error);
  const sessionLost = isSessionLostError(auditLogs.error);
  useEffect(() => { if (sessionLost) gotoLogin(); }, [sessionLost, gotoLogin]);

  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable') return <ErrorState title="ارتباط با سرور برقرار نشد" onRetry={retry} />;
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  if (denied || (user && user.role === 'USER')) return <AdminAccessDenied />;

  const items = auditLogs.data?.items ?? [];
  const total = auditLogs.data?.total ?? 0;
  const totalPages = auditLogs.data?.totalPages ?? 1;
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <select value={actionParam ?? ''}
          onChange={(e) => { void setActionParam(e.target.value || null); void setPageParam(null); }}
          className="h-control rounded-control border border-border bg-surface px-3 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <option value="">همهٔ اقدامات</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
<ActiveFilterChips
      chips={[
        ...(actionParam ? [{ key: 'action', label: ACTION_LABELS[actionParam] ?? actionParam, onRemove: () => { void setActionParam(null); void setPageParam(null); } }] : []),
      ]}
      onClearAll={() => { void setActionParam(null); void setPageParam(null); }}
    />

      {auditLogs.isPending ? <AuditSkeleton /> :
       auditLogs.isError ? <ErrorState title="دریافت رویدادها ناموفق بود" onRetry={() => void auditLogs.refetch()} /> :
       items.length === 0 ? <EmptyState icon={FileText} title="هیچ رویدادی ثبت نشده" /> :
       <>
         <div className={cn('overflow-x-auto rounded-card border border-border bg-surface', auditLogs.isPlaceholderData && 'opacity-60')}>
           <table className="w-full min-w-[600px] border-collapse text-ui">
             <thead>
               <tr className="border-b border-border bg-muted/20">
                 <th className="py-2.5 pe-3 ps-4 text-start text-caption font-medium text-muted-foreground">زمان</th>
                 <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">اقدام</th>
                 <th className="py-2.5 pe-3 text-start text-caption font-medium text-muted-foreground">نوع</th>
                 <th className="py-2.5 pe-4 text-start text-caption font-medium text-muted-foreground">شناسه</th>
               </tr>
             </thead>
             <tbody>
               {items.map((log) => (
                 <tr key={log.id} className="border-b border-border">
                   <td className="py-3 pe-3 ps-4 text-muted-foreground">{formatRelativeTime(log.createdAt)}</td>
                   <td className="py-3 pe-3">{ACTION_LABELS[log.action] ?? log.action}</td>
                   <td className="py-3 pe-3 text-muted-foreground">{log.entityType}</td>
                   <td className="py-3 pe-4 font-mono text-caption text-muted-foreground">{log.entityId?.slice(0, 12) ?? '—'}</td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
         {totalPages > 1 && (
           <div className="flex items-center justify-between gap-3">
             <p className="text-caption text-muted-foreground">{total.toLocaleString('fa-IR')} رویداد</p>
             <div className="flex items-center gap-2">
               <Button variant="outline" size="sm" disabled={page <= 1 || auditLogs.isFetching}
                 onClick={() => void setPageParam(page - 1)}>قبلی</Button>
               <span className="text-caption text-muted-foreground">صفحهٔ {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}</span>
               <Button variant="outline" size="sm" disabled={page >= totalPages || auditLogs.isFetching}
                 onClick={() => void setPageParam(page + 1)}>بعدی</Button>
             </div>
           </div>
         )}
       </>}
    </div>
  );
}

function AdminSpinner({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground"><Loader2 aria-hidden className="size-4 animate-spin" />{label}</div>;
}

function AuditSkeleton() {
  return <div className="space-y-3" aria-hidden>{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
}