/**
 * My Listings view model (§31): status tabs + lifecycle action permissions.
 *
 * The permission table mirrors the frozen backend state machine
 * (`listings/listing-state.ts`): the backend stays authoritative, the UI only
 * pre-hides actions that would come back as LISTING_INVALID_TRANSITION.
 */

import { formatOwnerStatus } from '../format';
import type { OwnerListingStatus } from '../types';

export const MY_LISTINGS_STATUS_TABS = [
  'ALL',
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
] as const;

export type MyListingsStatusTab = (typeof MY_LISTINGS_STATUS_TABS)[number];

/** Cursor page size for the management list. */
export const MY_LISTINGS_PAGE_LIMIT = 20;

/** Chip label for a status tab («همه» or the localized status). */
export function statusTabLabel(tab: MyListingsStatusTab): string {
  return tab === 'ALL' ? 'همه' : formatOwnerStatus(tab);
}

/** API `status` filter for a tab; ALL means «no filter». */
export function statusFilterForTab(tab: MyListingsStatusTab): OwnerListingStatus | undefined {
  return tab === 'ALL' ? undefined : tab;
}

export interface ListingLifecyclePermissions {
  /** ACTIVE (extend runway) or ARCHIVED (republish → DRAFT). */
  canRenew: boolean;
  /** ACTIVE → SOLD. Final — nothing returns from SOLD. */
  canMarkSold: boolean;
  /** ACTIVE → ARCHIVED (reversible through renew). */
  canArchive: boolean;
  /** ACTIVE/SOLD have a publicly reachable detail page. */
  canViewPublic: boolean;
  /** DRAFT/REJECTED/ACTIVE are editable; wired with the §42 edit route. */
  canEdit: boolean;
}

/** Actions the owner may invoke for a listing in `status`. */
export function listingLifecycle(status: OwnerListingStatus): ListingLifecyclePermissions {
  return {
    canRenew: status === 'ACTIVE' || status === 'ARCHIVED',
    canMarkSold: status === 'ACTIVE',
    canArchive: status === 'ACTIVE',
    canViewPublic: status === 'ACTIVE' || status === 'SOLD',
    canEdit: status === 'DRAFT' || status === 'REJECTED' || status === 'ACTIVE',
  };
}
