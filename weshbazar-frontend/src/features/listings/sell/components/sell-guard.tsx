'use client';

/**
 * Per-step guard (master prompt §34–§41).
 *
 * Wraps every sell step with the three gates the wizard needs before a form
 * may mount: session (guests → login with `next` preserved), storage
 * hydration (the draft must be read first), and step prerequisites (missing
 * data redirects to the earliest unfinished step instead of rendering a
 * broken form). Mirrors the favorites gate for its loading/error states.
 */

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { useAuthBootstrap } from '@/features/auth';
import { missingPrerequisite, sellStepPath, type SellStepKey } from '@/features/listings';
import { useSell } from './sell-provider';

interface SellGuardProps {
  step: SellStepKey;
  children: ReactNode;
}

export function SellGuard({ step, children }: SellGuardProps) {
  const router = useRouter();
  const { status, retry } = useAuthBootstrap();
  const { ready, draft } = useSell();

  // No session → sign-in required before anything is collected.
  useEffect(() => {
    if (status === 'anonymous') {
      router.replace(`/auth/login?next=${encodeURIComponent(sellStepPath(step))}`);
    }
  }, [status, router, step]);

  // Unmet prerequisites → the earliest unfinished step owns the data.
  const target = ready ? missingPrerequisite(step, draft) : null;
  useEffect(() => {
    if (target !== null && target !== step) {
      router.replace(sellStepPath(target));
    }
  }, [target, router, step]);

  if (status === 'checking' || !ready) {
    return <BlockedNotice text="در حال آماده‌سازی…" />;
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
    return <BlockedNotice text="در حال انتقال به صفحهٔ ورود…" />;
  }

  if (target !== null) {
    // The effect above is redirecting to the prerequisite step.
    return <BlockedNotice text="در حال انتقال…" />;
  }

  return <>{children}</>;
}

function BlockedNotice({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {text}
    </div>
  );
}
