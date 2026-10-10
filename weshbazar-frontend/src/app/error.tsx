'use client';

import { useEffect } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { ErrorState } from '@/components/feedback/error-state';
import { ApiError } from '@/lib/api';

/**
 * Global error boundary (master prompt §51). Must be a Client Component.
 * Surfaces an honest failure with a retry, and logs the request id when the
 * failure came from the API so support can trace it (§5).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with real telemetry later; never log tokens or private data.
    console.error(error);
  }, [error]);

  const requestId = error instanceof ApiError ? error.requestId : undefined;

  return (
    <PageContainer>
      <ErrorState
        className="mt-8"
        title="مشکلی در بارگذاری صفحه پیش آمد"
        description="خطای غیرمنتظره‌ای رخ داد. می‌توانید دوباره تلاش کنید."
        requestId={requestId ?? error.digest}
        onRetry={reset}
      />
    </PageContainer>
  );
}
