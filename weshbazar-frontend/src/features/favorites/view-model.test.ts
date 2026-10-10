/**
 * Behavior tests for favorites view-model helpers (master prompt §30, §112).
 *
 * The helpers keep copy decisions and DTO→card adaptation out of the
 * presentation layer: labels must reflect the saved state exactly, and the
 * card adapter must stay honest about missing publication dates while never
 * leaking `status` (the card renders sold-ness separately via `sold`).
 */

import {
  favoriteAnnouncement,
  favoriteAriaLabel,
  favoriteErrorAnnouncement,
  favoriteInlineLabel,
  toCardListing,
} from './view-model';
import type { FavoriteListingSummary } from './types';

function makeListing(overrides: Partial<FavoriteListingSummary> = {}): FavoriteListingSummary {
  return {
    id: 'l1',
    slug: 'iphone-13',
    title: 'آیفون ۱۳',
    price: 45000,
    currency: 'AFN',
    pricingType: 'PAID',
    negotiable: true,
    condition: 'LIKE_NEW',
    category: { id: 'c1', slug: 'mobile-phones', name: 'Mobile Phones' },
    province: { id: 'p1', slug: 'kabul', name: 'Kabul' },
    city: { id: 'ct1', slug: 'kabul-city', name: 'Kabul' },
    primaryImage: null,
    status: 'ACTIVE',
    ...overrides,
  };
}

describe('toCardListing', () => {
  it('maps the saved-listing DTO onto the shared card summary', () => {
    const card = toCardListing(makeListing());
    expect(card).toEqual({
      id: 'l1',
      slug: 'iphone-13',
      title: 'آیفون ۱۳',
      price: 45000,
      currency: 'AFN',
      pricingType: 'PAID',
      negotiable: true,
      condition: 'LIKE_NEW',
      category: { id: 'c1', slug: 'mobile-phones', name: 'Mobile Phones' },
      province: { id: 'p1', slug: 'kabul', name: 'Kabul' },
      city: { id: 'ct1', slug: 'kabul-city', name: 'Kabul' },
      primaryImage: null,
      publishedAt: null,
    });
  });

  it('normalizes a missing publishedAt to null so the card can hide the row', () => {
    const card = toCardListing(makeListing({ publishedAt: undefined }));
    expect(card.publishedAt).toBeNull();
  });

  it('keeps the publication date and never carries status onto the card', () => {
    const card = toCardListing(
      makeListing({ publishedAt: '2026-09-30T10:00:00.000Z', status: 'SOLD' }),
    );
    expect(card.publishedAt).toBe('2026-09-30T10:00:00.000Z');
    expect('status' in card).toBe(false);
  });
});

describe('favorite labels and announcements', () => {
  it('aria label reflects the current saved state', () => {
    expect(favoriteAriaLabel(false)).toBe('افزودن به علاقه‌مندی‌ها');
    expect(favoriteAriaLabel(true)).toBe('حذف از علاقه‌مندی‌ها');
  });

  it('inline label reflects the current saved state', () => {
    expect(favoriteInlineLabel(false)).toBe('ذخیره');
    expect(favoriteInlineLabel(true)).toBe('ذخیره شد');
  });

  it('announcements describe the completing action', () => {
    expect(favoriteAnnouncement(true)).toBe('به علاقه‌مندی‌ها افزوده شد.');
    expect(favoriteAnnouncement(false)).toBe('از علاقه‌مندی‌ها حذف شد.');
    expect(favoriteErrorAnnouncement()).toContain('ناموفق');
  });
});
