/**
 * Behavior tests for the user-scoped cache clearer (audit CACHE-001/CACHE-002).
 * Pins that every private cache group is dropped so a later session cannot read
 * the previous user's data.
 */

import { QueryClient } from '@tanstack/react-query';

import { clearUserScopedCaches } from './cache';
import { queryKeys } from './query-keys';

describe('clearUserScopedCaches', () => {
  it('removes every user-scoped cache group', () => {
    const queryClient = new QueryClient();

    queryClient.setQueryData(queryKeys.account.profile, { id: 'u1' });
    queryClient.setQueryData(queryKeys.favorites.ids, ['listing-1']);
    queryClient.setQueryData(queryKeys.listings.mine({ status: 'ACTIVE', limit: 12 }), [
      { id: 'l1' },
    ]);
    queryClient.setQueryData(queryKeys.contacts.revealed('listing-1'), {
      method: 'PHONE',
      value: '0700000000',
    });
    queryClient.setQueryData(queryKeys.analytics.sellerSummary, { lifetime: { views: 5 } });
    queryClient.setQueryData(queryKeys.admin.dashboard, { activeUsers: 1 });

    clearUserScopedCaches(queryClient);

    expect(queryClient.getQueryData(queryKeys.account.profile)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.favorites.ids)).toBeUndefined();
    expect(
      queryClient.getQueryData(queryKeys.listings.mine({ status: 'ACTIVE', limit: 12 })),
    ).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.contacts.revealed('listing-1'))).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.analytics.sellerSummary)).toBeUndefined();
    expect(queryClient.getQueryData(queryKeys.admin.dashboard)).toBeUndefined();
  });
});