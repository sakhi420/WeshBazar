'use client';

/**
 * Admin taxonomy view — category listing (read-only for now).
 *
 * Session-gated exactly like the dashboard (§43): guests are routed to login
 * with `next` preserved. A signed-in USER lands on the honest access-denied
 * surface. A stale-role 403 or dead session routes back to login (§42).
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FolderTree } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { useAuthBootstrap } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isForbiddenError, isSessionLostError } from '../errors';
import { useAdminCategories } from '../hooks';
import { AdminAccessDenied } from './admin-access-denied';

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/taxonomy')}`;

export function AdminTaxonomyView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();

  useEffect(() => { if (status === 'anonymous') router.replace(LOGIN_HREF); }, [status, router]);
  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  const enabled = status === 'ready' && user !== null && user.role !== 'USER';
  const categories = useAdminCategories(enabled);
  const denied = isForbiddenError(categories.error);
  const sessionLost = isSessionLostError(categories.error);

  useEffect(() => { if (sessionLost) gotoLogin(); }, [sessionLost, gotoLogin]);

  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable') return <ErrorState title="ارتباط با سرور برقرار نشد" description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید." onRetry={retry} />;
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;
  if (denied) return <AdminAccessDenied />;

  const items = categories.data ?? [];

  return (
    <div className={cn('space-y-4', className)}>
      {categories.isPending ? <TaxonomySkeleton /> :
       categories.isError ? <ErrorState requestId={categories.error instanceof ApiError ? categories.error.requestId : undefined} title="دریافت دسته‌بندی‌ها ناموفق بود" onRetry={() => void categories.refetch()} /> :
       items.length === 0 ? <EmptyState icon={FolderTree} title="دسته‌بندی‌ای ثبت نشده" /> :
       <div className="rounded-card border border-border bg-surface">
         <ul className="divide-y divide-border">
           {items.map((c) => (
             <li key={c.id} className="flex items-center justify-between px-4 py-3">
               <span className="text-ui font-medium">{c.name}</span>
               <span className="text-caption text-muted-foreground" dir="ltr">{c.slug}</span>
             </li>
           ))}
         </ul>
       </div>}
    </div>
  );
}

function AdminSpinner({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground"><Loader2 aria-hidden className="size-4 animate-spin" />{label}</div>;
}

function TaxonomySkeleton() {
  return <div className="space-y-3" aria-hidden>{Array.from({ length: 5 }, (_, i) => (
    <div key={i} className="rounded-card border border-border bg-surface p-4 space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div>
  ))}</div>;
}