'use client';

/**
 * Auth session bootstrap (master prompt §7) — resolves "who is signed in?"
 * for protected UI by rotating an access token from the refresh cookie when
 * the in-memory token is gone (reload / new tab), then reading /auth/me.
 * Uses the shared query cache so later surfaces reuse the same snapshot.
 */

import { useQuery } from '@tanstack/react-query';
import { ApiError, queryKeys } from '@/lib/api';
import { bootstrapCurrentUser } from './api';
import type { UserSummary } from './types';

export type AuthStatus = 'checking' | 'ready' | 'anonymous' | 'unreachable';

export interface AuthState {
  status: AuthStatus;
  user: UserSummary | null;
  /** Re-run the bootstrap (e.g. after an offline failure). */
  retry: () => void;
}

export function useAuthBootstrap(): AuthState {
  const query = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: bootstrapCurrentUser,
    retry: false,
    staleTime: 30_000,
  });

  const retry = () => {
    void query.refetch();
  };

  if (query.isPending) {
    return { status: 'checking', user: null, retry };
  }

  if (query.isError) {
    const error = query.error;
    const anonymous =
      error instanceof ApiError && (error.status === 401 || error.isSessionTerminal);
    return { status: anonymous ? 'anonymous' : 'unreachable', user: null, retry };
  }

  return { status: 'ready', user: query.data?.user ?? null, retry };
}
