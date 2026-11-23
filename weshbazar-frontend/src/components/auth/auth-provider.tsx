'use client';

/**
 * AuthProvider — global authentication state for the app shell.
 *
 * Wraps `useAuthBootstrap` and exposes:
 *  - auth status + current user to the header, nav, and protected pages.
 *  - a performLogout() that clears the session, token, all user-scoped
 *    TanStack Query caches, and the owner-scoped sell draft before
 *    redirecting — so the next user on the same device sees a clean slate.
 *  - a lightweight `weshbazar_session` cookie (path=/) that the Page
 *    Middleware uses as a cheap server-side gate. The backend refresh
 *    cookie (`weshbazar_refresh`) has path=/api/v1/auth and is NEVER
 *    sent on page requests, so middleware must rely on this indicator.
 *
 * Master prompt §2, §7, §437; contract V5.3 session regression.
 */

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  clearAccessToken,
  clearSessionCookie,
  clearUserScopedCaches,
  markLocalLogout,
  publishAuthSessionEvent,
  queryKeys,
  setSessionCookie,
} from '@/lib/api';
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

  // Sync the page‑visible session cookie with the auth bootstrap result.
  // The middleware reads this cookie to decide redirects (§7, V5.3).
  useEffect(() => {
    if (auth.status === 'ready') {
      setSessionCookie();
    } else if (auth.status === 'anonymous') {
      clearSessionCookie();
    }
    // 'checking' / 'unreachable': leave the cookie as‑is (don't flip-flop).
  }, [auth.status]);

  // Keep same-origin tabs in sync when a user signs in or out. The marker
  // cookies are shared by the browser; this event clears stale in-memory
  // access tokens and private query caches in the other tabs.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('weshbazar-auth');
    const handleMessage = (event: MessageEvent<unknown>) => {
      if (event.data !== 'login' && event.data !== 'logout') return;

      clearAccessToken();
      clearUserScopedCaches(queryClient);
      void queryClient.resetQueries({ queryKey: queryKeys.auth.all });

      if (event.data === 'logout') {
        clearSessionCookie();
        router.replace('/');
      }
    };

    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [queryClient, router]);

  const performLogout = useCallback(async () => {
    // 1. If we have a user identity, clear their draft before the session dies.
    if (auth.user?.id) {
      clearSellDraftForUser(auth.user.id);
    }

    // 2. Persist local sign-out before making the network request. The
    //    HttpOnly refresh cookie cannot be removed by JavaScript; this marker
    //    prevents a reload from silently restoring the same session offline.
    markLocalLogout();
    clearSessionCookie();
    publishAuthSessionEvent('logout');

    // 3. Revoke the server session + drop the in-memory access token.
    //    The local sign-out remains in force even when the server is offline.
    try {
      await logoutApi();
    } catch {
      // The network may be gone; the browser still removes the cookie on
      // our side once its path expires. Clear the token unconditionally.
    }
    clearAccessToken();

    // 4. Drop every user-scoped TanStack Query cache so no stale private
    //    data survives in memory after the redirect. `auth` is invalidated
    //    (not removed) so the bootstrap refetch flips the UI to anonymous.
    void queryClient.resetQueries({ queryKey: queryKeys.auth.all });
    clearUserScopedCaches(queryClient);

    // 5. Redirect to homepage; public browsing stays functional (§7).
    router.replace('/');
  }, [auth.user?.id, queryClient, router]);

  const value: AuthContextValue = {
    ...auth,
    performLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}