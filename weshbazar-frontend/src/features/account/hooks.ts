'use client';

/**
 * Account queries and mutations (master prompt §32, §33, §7) — profile
 * update, sign-out, and the security surface (sessions, password change,
 * logout-all).
 *
 * Cache coherence: a profile edit refreshes the account snapshot and the
 * mirrored auth user; sign-out drops every user-scoped cache (identity,
 * profile, favorites) before the app re-resolves the session. A password
 * change keeps the current session but revokes the others server-side, so
 * the sessions list is refetched. Logout-all signs this device out too.
 */

import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { logout } from '@/features/auth';
import type { MeResponse } from '@/features/auth';
import { clearAccessToken, clearSessionCookie, clearUserScopedCaches, queryKeys } from '@/lib/api';
import {
  changePassword,
  fetchSessions,
  logoutAllSessions,
  revokeSession,
  updateMyProfile,
} from './api';

/** Drop the auth snapshot plus every user-scoped cache — shared by sign-out paths. */
function clearUserCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.removeQueries({ queryKey: queryKeys.auth.all });
  clearUserScopedCaches(queryClient);
}

/**
 * Sign this device out locally without a server call — used after revoking
 * the current session, where the backend has already cleared the refresh
 * cookie and dropped the session row.
 */
export function useSignOutLocal(): () => void {
  const queryClient = useQueryClient();
  return useCallback(() => {
    clearAccessToken();
    clearSessionCookie();
    clearUserCaches(queryClient);
  }, [queryClient]);
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.account.profile, profile);
      queryClient.setQueryData<MeResponse>(queryKeys.auth.me, (previous) =>
        previous
          ? { ...previous, user: { ...previous.user, displayName: profile.displayName } }
          : previous,
      );
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clearSessionCookie();
      clearUserCaches(queryClient);
    },
  });
}

// --- Security (§33) ------------------------------------------------------------

/** Active sessions of the account — only fetched once the session is ready. */
export function useSessions(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.auth.sessions,
    queryFn: fetchSessions,
    enabled,
    staleTime: 15_000,
    retry: false,
  });
}

/**
 * Revoke one session. When the revoked row is the current device, the caller
 * also signs out locally (the refresh cookie is already cleared by the
 * backend); other rows just refetch the list.
 */
export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions });
    },
  });
}

/**
 * Revoke every session (destructive): only on success drop the in-memory
 * token and user caches — a failed call leaves the device signed in.
 */
export function useLogoutAll() {
  const signOutLocal = useSignOutLocal();

  return useMutation({
    mutationFn: logoutAllSessions,
    onSuccess: () => {
      signOutLocal();
    },
  });
}

/** Change the password; other sessions are revoked server-side on success. */
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.sessions });
    },
  });
}
