/**
 * Behavior tests for the My Listings view model (§31).
 *
 * The permission table must mirror the frozen backend state machine
 * (apps/api/src/modules/listings/listing-state.ts): every divergence would
 * surface as a LISTING_INVALID_TRANSITION 409 in production.
 */

import { listingLifecycle, statusFilterForTab, statusTabLabel } from './view-model';

describe('listingLifecycle', () => {
  it('ACTIVE may renew, mark sold, archive, view and edit', () => {
    expect(listingLifecycle('ACTIVE')).toEqual({
      canRenew: true,
      canMarkSold: true,
      canArchive: true,
      canViewPublic: true,
      canEdit: true,
    });
  });

  it('ARCHIVED may only renew (republish → DRAFT)', () => {
    expect(listingLifecycle('ARCHIVED')).toEqual({
      canRenew: true,
      canMarkSold: false,
      canArchive: false,
      canViewPublic: false,
      canEdit: false,
    });
  });

  it('DRAFT and REJECTED may only be edited (edit→submit cycle)', () => {
    for (const status of ['DRAFT', 'REJECTED'] as const) {
      expect(listingLifecycle(status)).toEqual({
        canRenew: false,
        canMarkSold: false,
        canArchive: false,
        canViewPublic: false,
        canEdit: true,
      });
    }
  });

  it('PENDING_REVIEW exposes no owner actions; SOLD stays viewable only', () => {
    expect(listingLifecycle('PENDING_REVIEW')).toEqual({
      canRenew: false,
      canMarkSold: false,
      canArchive: false,
      canViewPublic: false,
      canEdit: false,
    });
    expect(listingLifecycle('SOLD')).toEqual({
      canRenew: false,
      canMarkSold: false,
      canArchive: false,
      canViewPublic: true,
      canEdit: false,
    });
  });
});

describe('status tabs', () => {
  it('ALL carries no API filter; every other tab filters by its own status', () => {
    expect(statusFilterForTab('ALL')).toBeUndefined();
    expect(statusFilterForTab('ACTIVE')).toBe('ACTIVE');
    expect(statusFilterForTab('PENDING_REVIEW')).toBe('PENDING_REVIEW');
    expect(statusFilterForTab('ARCHIVED')).toBe('ARCHIVED');
  });

  it('labels are Persian: همه for ALL, the localized status otherwise', () => {
    expect(statusTabLabel('ALL')).toBe('همه');
    expect(statusTabLabel('ACTIVE')).toBe('فعال');
    expect(statusTabLabel('DRAFT')).toBe('پیش‌نویس');
    expect(statusTabLabel('PENDING_REVIEW')).toBe('در انتظار بررسی');
    expect(statusTabLabel('ARCHIVED')).toBe('بایگانی‌شده');
  });
});
