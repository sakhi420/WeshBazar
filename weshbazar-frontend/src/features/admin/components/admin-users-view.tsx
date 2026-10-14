'use client';

/**
 * Admin users view (§46) — user table with search, role/status filters.
 *
 * Session-gated exactly like the dashboard (§43): guests are routed to login
 * with `next` preserved. A signed-in USER lands on the honest access-denied
 * surface. A stale-role 403 or dead session routes back to login (§42).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { parseAsInteger, parseAsString } from 'nuqs';
import { Ban, ChevronDown, ChevronUp, Loader2, Search, UserCheck, UserX, X } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/features/listings';
import { useAuthBootstrap } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { isForbiddenError, isSessionLostError } from '../errors';
import {
  useAdminUsers,
  useSuspendUser,
  useBanUser,
  useRestoreUser,
  useAdminUserDetail,
} from '../hooks';
import { ActiveFilterChips } from './ActiveFilterChips';
import { AdminAccessDenied } from './admin-access-denied';

// --- URL state parsers (nuqs) -----------------------------------------------

const pageParser = parseAsInteger;
const searchParser = parseAsString;

// --- Labels -----------------------------------------------------------------

const ROLE_LABELS: Record<string, string> = { USER: 'کاربر', MODERATOR: 'ناظر', ADMIN: 'مدیر' };
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'فعال',
  SUSPENDED: 'معلق',
  BANNED: 'مسدود',
  DEACTIVATED: 'غیرفعال',
};
const LISTING_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  PENDING_REVIEW: 'در انتظار',
  ACTIVE: 'فعال',
  REJECTED: 'رد شده',
  SOLD: 'فروخته شده',
  ARCHIVED: 'بایگانی',
};

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/users')}`;

export function AdminUsersView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();

  useEffect(() => {
    if (status === 'anonymous') router.replace(LOGIN_HREF);
  }, [status, router]);
  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  const [pageParam, setPageParam] = useQueryState('page', pageParser);
  const page = pageParam ?? 1;
  const [search, setSearch] = useQueryState('q', searchParser);

  // Action state: which user + what operation is in-progress
  const [actionTarget, setActionTarget] = useState<{
    userId: string;
    verb: 'suspend' | 'ban';
  } | null>(null);
  const [reason, setReason] = useState('');
  // Confirmation dialog state — shown before action form appears
  const [confirmTarget, setConfirmTarget] = useState<{
    userId: string;
    verb: 'suspend' | 'ban';
    name: string;
  } | null>(null);

  // Expanded user detail
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const params = useMemo(
    () => ({
      q: search?.trim() || undefined,
      page,
      limit: 20,
    }),
    [search, page],
  );

  const enabled = status === 'ready' && user !== null && user.role !== 'USER';
  const userDetail = useAdminUserDetail(expandedUserId, enabled && expandedUserId !== null);
  const listingStatuses = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SOLD', 'ARCHIVED'];
  const users = useAdminUsers(params, enabled);
  const denied = isForbiddenError(users.error);
  const sessionLost = isSessionLostError(users.error);

  const suspendM = useSuspendUser();
  const banM = useBanUser();
  const restoreM = useRestoreUser();

  useEffect(() => {
    if (sessionLost) gotoLogin();
  }, [sessionLost, gotoLogin]);

  // When an action succeeds, reset the form
  useEffect(() => {
    if (suspendM.isSuccess || banM.isSuccess || restoreM.isSuccess) {
      setActionTarget(null);
      setReason('');
    }
  }, [suspendM.isSuccess, banM.isSuccess, restoreM.isSuccess]);

  const handleActionSubmit = useCallback(() => {
    if (!actionTarget || !reason.trim()) return;
    if (actionTarget.verb === 'suspend')
      suspendM.mutate({ id: actionTarget.userId, payload: { reason: reason.trim() } });
    else banM.mutate({ id: actionTarget.userId, payload: { reason: reason.trim() } });
  }, [actionTarget, reason, suspendM, banM]);

  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable')
    return (
      <ErrorState
        title="ارتباط با سرور برقرار نشد"
        description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        onRetry={retry}
      />
    );
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;
  if (denied) return <AdminAccessDenied />;

  const items = users.data?.items ?? [];
  const total = users.data?.total ?? 0;
  const totalPages = users.data?.totalPages ?? 1;
  const isBusy = suspendM.isPending || banM.isPending || restoreM.isPending;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={search ?? ''}
          onChange={(e) => {
            setSearch(e.target.value || null);
            void setPageParam(null);
          }}
          placeholder="جست‌وجوی کاربر…"
          className="h-control w-full rounded-control border border-input bg-background pe-3 ps-9 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
<ActiveFilterChips
        chips={[
          ...(search ? [{ key: 'q', label: `جست‌وجو: ${search}`, onRemove: () => { void setSearch(null); void setPageParam(null); } }] : []),
        ]}
        onClearAll={() => { void setSearch(null); void setPageParam(null); }}
      />

      {/* Mutation error banner */}
      {(suspendM.isError || banM.isError || restoreM.isError) && (
        <div role="alert" className="rounded-card border border-danger/30 bg-danger/5 p-3 text-ui text-danger">
          {(suspendM.error ?? banM.error ?? restoreM.error) instanceof ApiError
            ? (suspendM.error ?? banM.error ?? (restoreM.error as ApiError))?.message
            : 'عملیات ناموفق بود.'}
          <button
            type="button"
            className="ms-3 underline"
            onClick={() => {
              suspendM.reset();
              banM.reset();
              restoreM.reset();
            }}
          >
            بستن
          </button>
        </div>
      )}
{/* Live region for mutation success announcements */}
      <div aria-live="polite" className="sr-only">
        {suspendM.isSuccess ? 'کاربر با موفقیت معلق شد.' :
         banM.isSuccess ? 'کاربر با موفقیت مسدود شد.' :
         restoreM.isSuccess ? 'کاربر با موفقیت بازگردانی شد.' :
         ''}
      </div>

      {/* Inline action form (suspend/ban reason) */}
      {actionTarget && (
        <div className="space-y-3 rounded-card border border-border bg-surface p-4">
          <p className="text-ui font-semibold">
            {actionTarget.verb === 'suspend' ? 'تعلیق کاربر' : 'مسدودسازی کاربر'}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="علت این اقدام را وارد کنید…"
            rows={2}
            className="rounded-input w-full border border-border bg-surface p-2.5 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={!reason.trim() || isBusy} onClick={handleActionSubmit}>
              {isBusy ? 'در حال انجام…' : 'تأیید'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionTarget(null);
                setReason('');
              }}
            >
              انصراف
            </Button>
          </div>
        </div>
      )}

      {users.isPending ? (
        <UsersSkeleton />
      ) : users.isError ? (
        <ErrorState
          requestId={users.error instanceof ApiError ? users.error.requestId : undefined}
          title="دریافت کاربران ناموفق بود"
          onRetry={() => void users.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="کاربری پیدا نشد" />
      ) : (
        <>
          <div
            className={cn(
              'overflow-x-auto rounded-card border border-border',
              users.isPlaceholderData && 'opacity-60',
            )}
          >
            <table className="w-full text-ui">
              <thead className="border-b border-border bg-muted/30 text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-medium">نام</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">شماره</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">نقش</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">وضعیت</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">تأیید</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">تاریخ عضویت</th>
                  <th scope="col" className="px-4 py-3 text-start font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/20"
                  >
                    <td className="px-4 py-3 font-medium">{u.displayName}</td>
                    <td className="px-4 py-3 font-mono text-meta" dir="ltr">
                      {u.phone}
                    </td>
                    <td className="px-4 py-3">{ROLE_LABELS[u.role] ?? u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-caption font-medium',
                          u.status === 'ACTIVE'
                            ? 'bg-success/10 text-success'
                            : u.status === 'SUSPENDED'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-danger/10 text-danger',
                        )}
                      >
                        {STATUS_LABELS[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{u.phoneVerified ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatRelativeTime(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                          className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title={expandedUserId === u.id ? 'بستن جزئیات' : 'نمایش جزئیات'}
                        >
                          {expandedUserId === u.id ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                          جزئیات
                        </button>
                        {u.status === 'ACTIVE' && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                setConfirmTarget({
                                  userId: u.id,
                                  verb: 'suspend',
                                  name: u.displayName,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption text-warning transition-colors hover:bg-warning/10"
                              title="تعلیق"
                            >
                              <UserX className="size-3.5" /> تعلیق
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                setConfirmTarget({ userId: u.id, verb: 'ban', name: u.displayName })
                              }
                              className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption text-danger transition-colors hover:bg-danger/10"
                              title="مسدود"
                            >
                              <Ban className="size-3.5" /> مسدود
                            </button>
                          </>
                        )}
                        {(u.status === 'SUSPENDED' || u.status === 'BANNED') && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => restoreM.mutate(u.id)}
                            className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption text-success transition-colors hover:bg-success/10"
                            title="بازگردانی"
                          >
                            <UserCheck className="size-3.5" /> بازگردانی
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-caption text-muted-foreground">
                {total.toLocaleString('fa-IR')} کاربر
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || users.isFetching}
                  onClick={() => void setPageParam(page - 1)}
                >
                  قبلی
                </Button>
                <span className="text-caption text-muted-foreground">
                  صفحهٔ {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || users.isFetching}
                  onClick={() => void setPageParam(page + 1)}
                >
                  بعدی
                </Button>
              </div>
            </div>
          )}
{expandedUserId && (
            <div className="rounded-card border border-border bg-muted/10 p-4 space-y-3">
              {userDetail.isPending ? (
                <div className="flex items-center justify-center py-4 text-caption text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mx-2" /> در حال بارگذاری جزئیات…
                </div>
              ) : userDetail.isError ? (
                <div className="py-4 text-center text-caption text-destructive">
                  دریافت جزئیات ناموفق بود.
                  <button type="button" className="ms-2 underline" onClick={() => void userDetail.refetch()}>تلاش دوباره</button>
                </div>
              ) : userDetail.data ? (
                <>
                  <div>
                    <h4 className="text-caption font-semibold text-muted-foreground mb-2">آگهی‌ها بر اساس وضعیت</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {listingStatuses.map((s) => (
                        <span key={s} className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-medium',
                          (userDetail.data!.listingsByStatus[s] ?? 0) > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                        )}>
                          {LISTING_STATUS_LABELS[s] ?? s}: {String(userDetail.data!.listingsByStatus[s] ?? 0)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-4 text-caption text-muted-foreground">
                    <span>📋 گزارش‌های ثبت‌شده: <strong>{userDetail.data.reportsSubmitted}</strong></span>
                    <span>🚩 گزارش‌های دریافتی: <strong>{userDetail.data.openReportsAbout}</strong></span>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Suspend/Ban confirmation */}
      <ConfirmDialog
        open={confirmTarget !== null}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) {
            setActionTarget({ userId: confirmTarget.userId, verb: confirmTarget.verb });
            setConfirmTarget(null);
          }
        }}
        title={confirmTarget?.verb === 'suspend' ? 'تعلیق کاربر؟' : 'مسدودیت کاربر؟'}
        description={
          confirmTarget
            ? `آیا مطمئنید می‌خواهید کاربر «${confirmTarget.name}» را ${confirmTarget.verb === 'suspend' ? 'معلق' : 'مسدود'} کنید؟`
            : ''
        }
        confirmLabel={confirmTarget?.verb === 'suspend' ? 'تعلیق' : 'مسدود'}
      />
    </div>
  );
}

function AdminSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-3 rounded-card border border-border bg-surface p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}
