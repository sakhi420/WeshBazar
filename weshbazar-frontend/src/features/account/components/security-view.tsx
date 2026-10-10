'use client';

/**
 * Security view (master prompt §33) — password, active sessions, phone.
 *
 * Session-gated like the account view: guests are routed to login with
 * `next` preserved; a session that dies mid-page signs out the same way.
 * The view owns only the gate and layout — each section is a self-contained
 * form/query.
 */

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { useAuthBootstrap } from '@/features/auth';
import { cn } from '@/lib/utils';
import { SecurityPasswordSection } from './security-password-section';
import { SecurityPhoneSection } from './security-phone-section';
import { SecuritySessionsSection } from './security-sessions-section';

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/account/security')}`;

export function SecurityView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, retry } = useAuthBootstrap();

  // No session → sign-in required before security settings can be changed.
  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(LOGIN_HREF);
    }
  }, [status, router]);

  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  if (status === 'checking') {
    return <SessionSpinner label="در حال بررسی نشست…" />;
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
    return <SessionSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      <SecurityPasswordSection onSessionLost={gotoLogin} />
      <SecuritySessionsSection onSignedOut={gotoLogin} />
      <SecurityPhoneSection onSessionLost={gotoLogin} />
    </div>
  );
}

function SessionSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  );
}
