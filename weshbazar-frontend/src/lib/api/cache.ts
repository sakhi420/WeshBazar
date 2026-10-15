import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from './query-keys';

/**
 * Drop every user-scoped TanStack Query cache. Single source of truth so the
 * header logout and the account/security sign-out paths always clear the same
 * private groups (master prompt §7/§437; audit CACHE-001/CACHE-002).
 *
 * `queryKeys.auth` is intentionally excluded here: the full logout flow
 * *invalidates* it so the bootstrap refetch flips the UI to anonymous, while
 * the local sign-out paths *remove* it. Callers keep that distinction.
 */
export function clearUserScopedCaches(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: queryKeys.account.all });
  queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
  queryClient.removeQueries({ queryKey: queryKeys.listings.all });
  queryClient.removeQueries({ queryKey: queryKeys.contacts.all });
  queryClient.removeQueries({ queryKey: queryKeys.admin.all });
  queryClient.removeQueries({ queryKey: queryKeys.analytics.all });
}