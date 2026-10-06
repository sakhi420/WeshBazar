/**
 * Unit tests for the listing state machine (spec §40–§42, §70).
 *
 * The transition table is the single authority for legal status changes;
 * these tests pin the full matrix so a careless edit cannot open a bypass
 * around moderation or the explicit republish flow.
 */
import type { ListingStatus } from '../../generated/prisma/enums';
import {
  EDITABLE_STATUSES,
  MATERIAL_CHANGE_FIELDS,
  resolveListingTransition,
} from './listing-state';

const ALL_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
];

describe('resolveListingTransition', () => {
  describe('SUBMIT', () => {
    it('routes DRAFT and REJECTED to PENDING_REVIEW under REVIEW_REQUIRED', () => {
      expect(
        resolveListingTransition({
          action: 'SUBMIT',
          status: 'DRAFT',
          moderationMode: 'REVIEW_REQUIRED',
        }),
      ).toBe('PENDING_REVIEW');
      expect(
        resolveListingTransition({
          action: 'SUBMIT',
          status: 'REJECTED',
          moderationMode: 'REVIEW_REQUIRED',
        }),
      ).toBe('PENDING_REVIEW');
    });

    it('publishes directly under AUTO_APPROVE', () => {
      expect(
        resolveListingTransition({
          action: 'SUBMIT',
          status: 'DRAFT',
          moderationMode: 'AUTO_APPROVE',
        }),
      ).toBe('ACTIVE');
    });

    it('is illegal from every other state', () => {
      for (const status of ['PENDING_REVIEW', 'ACTIVE', 'SOLD', 'ARCHIVED'] as const) {
        expect(
          resolveListingTransition({
            action: 'SUBMIT',
            status,
            moderationMode: 'AUTO_APPROVE',
          }),
        ).toBeNull();
      }
    });
  });

  describe('APPROVE / REJECT', () => {
    it('APPROVE only from PENDING_REVIEW', () => {
      expect(resolveListingTransition({ action: 'APPROVE', status: 'PENDING_REVIEW' })).toBe(
        'ACTIVE',
      );
      for (const status of ALL_STATUSES.filter((s) => s !== 'PENDING_REVIEW')) {
        expect(resolveListingTransition({ action: 'APPROVE', status })).toBeNull();
      }
    });

    it('REJECT only from PENDING_REVIEW', () => {
      expect(resolveListingTransition({ action: 'REJECT', status: 'PENDING_REVIEW' })).toBe(
        'REJECTED',
      );
      for (const status of ALL_STATUSES.filter((s) => s !== 'PENDING_REVIEW')) {
        expect(resolveListingTransition({ action: 'REJECT', status })).toBeNull();
      }
    });
  });

  describe('MARK_SOLD / ARCHIVE', () => {
    it('only ACTIVE listings can be sold', () => {
      expect(resolveListingTransition({ action: 'MARK_SOLD', status: 'ACTIVE' })).toBe('SOLD');
      for (const status of ALL_STATUSES.filter((s) => s !== 'ACTIVE')) {
        expect(resolveListingTransition({ action: 'MARK_SOLD', status })).toBeNull();
      }
    });

    it('only ACTIVE listings can be archived', () => {
      expect(resolveListingTransition({ action: 'ARCHIVE', status: 'ACTIVE' })).toBe('ARCHIVED');
      for (const status of ALL_STATUSES.filter((s) => s !== 'ACTIVE')) {
        expect(resolveListingTransition({ action: 'ARCHIVE', status })).toBeNull();
      }
    });
  });

  describe('RENEW', () => {
    it('extends ACTIVE listings in place', () => {
      expect(resolveListingTransition({ action: 'RENEW', status: 'ACTIVE' })).toBe('ACTIVE');
    });

    it('returns ARCHIVED listings to DRAFT (explicit republish flow)', () => {
      expect(resolveListingTransition({ action: 'RENEW', status: 'ARCHIVED' })).toBe('DRAFT');
    });

    it('is illegal from DRAFT, PENDING_REVIEW, REJECTED and SOLD', () => {
      for (const status of ['DRAFT', 'PENDING_REVIEW', 'REJECTED', 'SOLD'] as const) {
        expect(resolveListingTransition({ action: 'RENEW', status })).toBeNull();
      }
    });
  });

  describe('ADMIN_ARCHIVE / ADMIN_RESTORE (§58, §106)', () => {
    it('ADMIN_ARCHIVE takes down only ACTIVE listings', () => {
      expect(resolveListingTransition({ action: 'ADMIN_ARCHIVE', status: 'ACTIVE' })).toBe(
        'ARCHIVED',
      );
      for (const status of ALL_STATUSES.filter((s) => s !== 'ACTIVE')) {
        expect(resolveListingTransition({ action: 'ADMIN_ARCHIVE', status })).toBeNull();
      }
    });

    it('ADMIN_RESTORE republishes only ARCHIVED listings', () => {
      expect(resolveListingTransition({ action: 'ADMIN_RESTORE', status: 'ARCHIVED' })).toBe(
        'ACTIVE',
      );
      for (const status of ALL_STATUSES.filter((s) => s !== 'ARCHIVED')) {
        expect(resolveListingTransition({ action: 'ADMIN_RESTORE', status })).toBeNull();
      }
    });
  });

  describe('EXPIRE / ARCHIVE_STALE_DRAFT (§69, §70 — system jobs)', () => {
    it('EXPIRE archives only ACTIVE listings', () => {
      expect(resolveListingTransition({ action: 'EXPIRE', status: 'ACTIVE' })).toBe('ARCHIVED');
      for (const status of ALL_STATUSES.filter((s) => s !== 'ACTIVE')) {
        expect(resolveListingTransition({ action: 'EXPIRE', status })).toBeNull();
      }
    });

    it('ARCHIVE_STALE_DRAFT archives only DRAFT listings', () => {
      expect(resolveListingTransition({ action: 'ARCHIVE_STALE_DRAFT', status: 'DRAFT' })).toBe(
        'ARCHIVED',
      );
      for (const status of ALL_STATUSES.filter((s) => s !== 'DRAFT')) {
        expect(resolveListingTransition({ action: 'ARCHIVE_STALE_DRAFT', status })).toBeNull();
      }
    });
  });

  describe('EDIT', () => {
    it('keeps DRAFT editable and demotes REJECTED to DRAFT', () => {
      expect(resolveListingTransition({ action: 'EDIT', status: 'DRAFT' })).toBe('DRAFT');
      expect(resolveListingTransition({ action: 'EDIT', status: 'REJECTED' })).toBe('DRAFT');
    });

    it('sends material edits of ACTIVE listings back to review under REVIEW_REQUIRED', () => {
      expect(
        resolveListingTransition({
          action: 'EDIT',
          status: 'ACTIVE',
          moderationMode: 'REVIEW_REQUIRED',
          materialChanges: true,
        }),
      ).toBe('PENDING_REVIEW');
    });

    it('keeps ACTIVE listings live for non-material or auto-approved edits', () => {
      expect(
        resolveListingTransition({
          action: 'EDIT',
          status: 'ACTIVE',
          moderationMode: 'REVIEW_REQUIRED',
          materialChanges: false,
        }),
      ).toBe('ACTIVE');
      expect(
        resolveListingTransition({
          action: 'EDIT',
          status: 'ACTIVE',
          moderationMode: 'AUTO_APPROVE',
          materialChanges: true,
        }),
      ).toBe('ACTIVE');
      expect(resolveListingTransition({ action: 'EDIT', status: 'ACTIVE' })).toBe('ACTIVE');
    });

    it('is illegal for PENDING_REVIEW, SOLD and ARCHIVED listings', () => {
      for (const status of ['PENDING_REVIEW', 'SOLD', 'ARCHIVED'] as const) {
        expect(
          resolveListingTransition({
            action: 'EDIT',
            status,
            moderationMode: 'AUTO_APPROVE',
            materialChanges: true,
          }),
        ).toBeNull();
      }
    });
  });
});

describe('listing policy constants', () => {
  it('MATERIAL_CHANGE_FIELDS covers the moderation-relevant fields (§42)', () => {
    expect([...MATERIAL_CHANGE_FIELDS]).toEqual([
      'title',
      'description',
      'price',
      'pricingType',
      'currency',
      'negotiable',
      'condition',
      'categoryId',
      'provinceId',
      'cityId',
      'attributes',
      'contactMethods',
    ]);
  });

  it('EDITABLE_STATUSES is exactly DRAFT, REJECTED and ACTIVE', () => {
    expect([...EDITABLE_STATUSES]).toEqual(['DRAFT', 'REJECTED', 'ACTIVE']);
  });
});
