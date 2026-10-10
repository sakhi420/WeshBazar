'use client';

/**
 * Active sessions (master prompt §33) — device list, per-row revoke and
 * "log out everywhere".
 *
 * Revoking the current device (or logout-all) signs this device out locally:
 * the backend clears the refresh cookie, so caches are wiped and the caller
 * routes to login. Other rows just refetch the list. Destructive actions are
 * two-step (arm → confirm) per the prompt's §50 guidance.
 */

import { useEffect, useState } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { FormError } from '@/features/auth/components';
import { formatRelativeTime } from '@/features/listings';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { useLogoutAll, useRevokeSession, useSessions, useSignOutLocal } from '../hooks';
import { describeDevice } from '../session-label';
import type { SessionSummary } from '../types';

export function SecuritySessionsSection({ onSignedOut }: { onSignedOut: () => void }) {
  const sessionsQuery = useSessions(true);
  const revokeMutation = useRevokeSession();
  const logoutAllMutation = useLogoutAll();
  const signOutLocal = useSignOutLocal();

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingLogoutAll, setConfirmingLogoutAll] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const busy = revokeMutation.isPending || logoutAllMutation.isPending;

  // The session can die between the page gate and the list fetch.
  const sessionLost =
    sessionsQuery.isError &&
    sessionsQuery.error instanceof ApiError &&
    (sessionsQuery.error.status === 401 || sessionsQuery.error.isSessionTerminal);

  useEffect(() => {
    if (sessionLost) onSignedOut();
  }, [sessionLost, onSignedOut]);

  function handleRevoke(session: SessionSummary) {
    if (busy) return;
    setActionError(null);
    revokeMutation.mutate(session.id, {
      onSuccess: () => {
        setConfirmingId(null);
        if (session.current) {
          // The backend cleared the refresh cookie with the revoke.
          signOutLocal();
          onSignedOut();
        }
      },
      onError: (error) => {
        setConfirmingId(null);
        if (!(error instanceof ApiError)) {
          setActionError('عملیات انجام نشد. دوباره تلاش کنید.');
          return;
        }
        if (error.status === 401 || error.isSessionTerminal) {
          signOutLocal();
          onSignedOut();
          return;
        }
        if (
          error.code === ApiErrorCode.SESSION_NOT_FOUND ||
          error.code === ApiErrorCode.NOT_FOUND
        ) {
          // The row was already revoked elsewhere — converge to server truth.
          void sessionsQuery.refetch();
          setActionError('این نشست دیگر فعال نیست.');
          return;
        }
        if (error.code === ApiErrorCode.NETWORK) {
          setActionError('اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
          return;
        }
        setActionError('عملیات انجام نشد. دوباره تلاش کنید.');
      },
    });
  }

  function handleLogoutAll() {
    if (busy) return;
    setActionError(null);
    logoutAllMutation.mutate(undefined, {
      onSuccess: () => {
        onSignedOut();
      },
      onError: (error) => {
        if (error instanceof ApiError && (error.status === 401 || error.isSessionTerminal)) {
          signOutLocal();
          onSignedOut();
          return;
        }
        if (error instanceof ApiError && error.code === ApiErrorCode.NETWORK) {
          setActionError('اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
          return;
        }
        setActionError('خروج از همهٔ دستگاه‌ها انجام نشد. دوباره تلاش کنید.');
      },
    });
  }

  return (
    <section
      aria-labelledby="security-sessions"
      className="rounded-card border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id="security-sessions" className="text-card-title font-semibold text-foreground">
        نشست‌های فعال
      </h2>
      <p className="mt-1 text-meta text-muted-foreground">
        دستگاه‌هایی که به حساب شما وارد شده‌اند. هر نشستی را که نمی‌شناسید پایان دهید.
      </p>

      <div className="mt-4 space-y-4">
        <FormError>{actionError}</FormError>

        {sessionsQuery.isPending ? (
          <div className="space-y-2" aria-hidden>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : sessionsQuery.isError ? (
          <ErrorState
            requestId={
              sessionsQuery.error instanceof ApiError ? sessionsQuery.error.requestId : undefined
            }
            description="بارگیری نشست‌ها ناموفق بود. دوباره تلاش کنید."
            onRetry={() => void sessionsQuery.refetch()}
          />
        ) : sessionsQuery.data.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="نشست فعالی یافت نشد"
            description="هیچ دستگاهی به حساب شما متصل نیست."
          />
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-control border border-border">
            {sessionsQuery.data.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                busy={busy}
                confirming={confirmingId === session.id}
                onArm={() => setConfirmingId(session.id)}
                onCancel={() => setConfirmingId(null)}
                onRevoke={() => handleRevoke(session)}
              />
            ))}
          </ul>
        )}

        {sessionsQuery.data && sessionsQuery.data.length > 0 ? (
          <div className="border-t border-border pt-4">
            {confirmingLogoutAll ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-ui text-foreground">
                  از همهٔ دستگاه‌ها خارج می‌شوید، از جمله همین دستگاه. مطمئنید؟
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmingLogoutAll(false)}
                  disabled={busy}
                >
                  انصراف
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-danger text-surface hover:bg-danger/90"
                  onClick={handleLogoutAll}
                  disabled={busy}
                >
                  {logoutAllMutation.isPending ? 'در حال خروج…' : 'خروج از همه'}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
                onClick={() => setConfirmingLogoutAll(true)}
                disabled={busy}
              >
                <LogOut aria-hidden />
                خروج از همهٔ دستگاه‌ها
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

// --- Session row -----------------------------------------------------------------

interface SessionRowProps {
  session: SessionSummary;
  busy: boolean;
  confirming: boolean;
  onArm: () => void;
  onCancel: () => void;
  onRevoke: () => void;
}

function SessionRow({ session, busy, confirming, onArm, onCancel, onRevoke }: SessionRowProps) {
  const label = describeDevice(session.deviceName, session.userAgent);
  const lastActive = formatRelativeTime(session.lastUsedAt ?? session.createdAt);

  return (
    <li className="flex flex-wrap items-start justify-between gap-3 px-3 py-3 sm:px-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="break-words text-ui font-medium text-foreground">{label}</p>
          {session.current ? (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-caption font-medium text-primary">
              این دستگاه
            </span>
          ) : null}
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-meta text-muted-foreground">
          {lastActive ? <span>آخرین فعالیت: {lastActive}</span> : null}
          {session.ipAddress ? (
            <>
              <span aria-hidden>·</span>
              <span dir="ltr" className="bidi-ltr">
                {session.ipAddress}
              </span>
            </>
          ) : null}
        </p>
      </div>

      {confirming ? (
        <div
          role="group"
          aria-label="تأیید پایان نشست"
          className="flex shrink-0 items-center gap-2"
        >
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={busy}>
            انصراف
          </Button>
          <Button type="button" size="sm" onClick={onRevoke} disabled={busy}>
            تأیید
          </Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" onClick={onArm} disabled={busy}>
          {session.current ? 'خروج از این دستگاه' : 'پایان‌دادن'}
        </Button>
      )}
    </li>
  );
}
