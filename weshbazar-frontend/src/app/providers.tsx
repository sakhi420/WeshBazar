'use client';

/**
 * Client-side providers (master prompt §5, §32, §39).
 * Kept as a narrow client boundary so Server Components stay the default.
 *  - TanStack Query for server state
 *  - nuqs App Router adapter for URL state: updates go through the Next router
 *    so Server Components re-render with the new searchParams (SSR results).
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { useState, type ReactNode } from 'react';
import { ReferralCapture } from '@/features/attribution';
import { ApiError } from '@/lib/api';
import { AuthProvider } from '@/components/auth/auth-provider';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.isRetriableGet && failureCount < 1) return true;
          return false;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AuthProvider>
          <ReferralCapture />
          {children}
        </AuthProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
}
