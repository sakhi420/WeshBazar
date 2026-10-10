'use client';

/**
 * Admin dashboard view (master prompt §43) — moderation/admin overview.
 *
 * Session-gated like the account views: guests are routed to login with
 * `next` preserved. A signed-in USER lands on the honest access-denied
 * surface — hidden UI is not security, the backend authorizes every read
 * (§42). Each section owns its own query and recovery state.
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { useAuthBootstrap } from '@/features/auth';
import { cn } from '@/lib/utils';
import { AdminAccessDenied } from './admin-access-denied';
import { AdminDashboardContent } from './admin-dashboard-content';

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin')}`;

export function AdminDashboardView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();

  // No session → sign-in required before the admin area can render.
  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(LOGIN_HREF);
    }
  }, [status, router]);

  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  if (status === 'checking') {
    return <AdminSpinner label="در حال بررسی نشست…" />;
  }

  if (status === 'unreachable') {
    return (
      <ErrorState
        title="ارتباط با سرور برقرار نشد"
        description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        onRetry={retry}
      />
    );
  }

  if (status === 'anonymous') {
    // The effect above is redirecting to login.
    return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  }

  if (!user || user.role === 'USER') {
    return <AdminAccessDenied />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <AdminDashboardContent onSessionLost={gotoLogin} />
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
