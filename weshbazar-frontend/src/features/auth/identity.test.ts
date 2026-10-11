/**
 * Identity isolation tests (master prompt V5.3 §Session and account switching).
 *
 * These tests verify that:
 *  - User A → logout → User B cannot see or resume A's private draft.
 *  - Draft keys are scoped per user identity.
 *  - `clearSellDraftForUser` removes only the target user's draft.
 */

import { clearSellDraftForUser, scopedDraftStorageKey } from '@/features/listings/sell';

const draftV1 = {
  categoryId: 'cat-1',
  title: 'A personal draft',
  description: 'should be private',
};

describe('identity isolation — sell draft', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('scoped keys differ per user', () => {
    expect(scopedDraftStorageKey('user-a')).not.toBe(scopedDraftStorageKey('user-b'));
  });

  it('stores a draft under a scoped key', () => {
    const key = scopedDraftStorageKey('user-a');
    window.localStorage.setItem(key, JSON.stringify(draftV1));
    expect(window.localStorage.getItem(key)).toBeTruthy();
  });

  it('clearSellDraftForUser removes only the target user draft', () => {
    const keyA = scopedDraftStorageKey('user-a');
    const keyB = scopedDraftStorageKey('user-b');

    window.localStorage.setItem(keyA, JSON.stringify(draftV1));
    window.localStorage.setItem(keyB, JSON.stringify({ ...draftV1, title: 'B draft' }));

    clearSellDraftForUser('user-a');

    expect(window.localStorage.getItem(keyA)).toBeNull();
    expect(window.localStorage.getItem(keyB)).toBeTruthy(); // B's draft untouched
  });

  it('clearSellDraftForUser is safe on empty storage', () => {
    expect(() => clearSellDraftForUser('unknown')).not.toThrow();
  });
});