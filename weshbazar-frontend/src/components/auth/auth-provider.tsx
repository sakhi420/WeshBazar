'use client';

/**
 * AuthProvider — global authentication state for the app shell.
 *
 * Wraps `useAuthBootstrap` and exposes:
 *  - auth status + current user to the header, nav, and protected pages.
 *  - a performLogout() that clears the session, token, all user-scoped
 *    TanStack Query caches, and the owner-scoped sell draft before
 *    redirecting — so the next user on the same device sees a clean slate.
 *
 * Master prompt §2, §7, §437; contract V5.3 session regression.
 */

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { clearAccessToken, queryKeys } from '@/lib/api';
import { logout as logoutApi, useAuthBootstrap } from '@/features/auth';
import type { AuthState } from '@/features/auth';
import { clearSellDraftForUser } from '@/features/listings/sell';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface AuthContextValue extends AuthState {
  /** Sign out the current user: revoke server session, drop local state. */
  performLogout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const auth = useAuthBootstrap();

  const performLogout = useCallback(async () => {
    // 1. If we have a user identity, clear their draft before the session dies.
    if (auth.user?.id) {
      clearSellDraftForUser(auth.user.id);
    }

    // 2. Revoke the server session + drop the in-memory access token.
    //    Always clear the local token even when the server call fails so
    //    a subsequent login starts clean.
    try {
      await logoutApi();
    } catch {
      // The network may be gone; the browser still removes the cookie on
      // our side once its path expires. Clear the token unconditionally.
    }
    clearAccessToken();

    // 3. Nuke every user-scoped TanStack Query cache so no stale private
    //    data survives in memory after the redirect.
    queryClient.removeQueries({ queryKey: queryKeys.auth.all });
    queryClient.removeQueries({ queryKey: queryKeys.account.all });
    queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
    queryClient.removeQueries({ queryKey: queryKeys.listings.all });
    queryClient.removeQueries({ queryKey: queryKeys.contacts.all });
    queryClient.removeQueries({ queryKey: queryKeys.analytics });
    queryClient.removeQueries({ queryKey: queryKeys.admin.all });

    // 4. Redirect to homepage; public browsing stays functional (§7).
    router.replace('/');
  }, [auth.user?.id, queryClient, router]);

  const value: AuthContextValue = {
    ...auth,
    performLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}