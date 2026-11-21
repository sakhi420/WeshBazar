import type { ExhibitionFixture } from './fixtures';

export const EXHIBITION_SELLERS = {
  kamal: {
    displayName: 'کمال',
    slug: 'kamal-ahmadi',
    bio: 'آگهی‌های وسایط نقلیه و خدمات کاری',
  },
  hasan: {
    displayName: 'حسن',
    slug: 'hasan-rezaei',
    bio: 'آگهی‌های خانه، املاک و لوازم منزل',
  },
  mir: {
    displayName: 'میر',
    slug: 'mir-ahmadi',
    bio: 'آگهی‌های موبایل، کمپیوتر و پوشاک',
  },
  farid: {
    displayName: 'فرید',
    slug: 'farid-mohammadi',
    bio: 'آگهی‌های زراعتی، تجهیزات طبی و ورزشی',
  },
  khalid: {
    displayName: 'خالد',
    slug: 'khalid-sadat',
    bio: 'آگهی‌های کودک، کتاب و سرگرمی',
  },
} as const;

export type ExhibitionSellerKey = keyof typeof EXHIBITION_SELLERS;

const VEHICLES_AND_JOBS = new Set([
  'cars',
  'motorcycles',
  'bicycles',
  'vehicle-parts',
  'jobs',
  'services',
]);

const HOMES_AND_FURNITURE = new Set([
  'properties-for-rent',
  'properties-for-sale',
  'shops-offices',
  'furniture',
  'home-appliances',
  'garden-outdoor',
]);

const TECH_AND_FASHION = new Set([
  'mobile-phones',
  'tablets',
  'laptops-computers',
  'tvs-audio',
  'gaming',
  'mens-clothing',
  'womens-clothing',
  'watches-jewelry',
]);

const AGRICULTURE_AND_MEDICAL = new Set([
  'livestock',
  'pets',
  'farm-tools',
  'medical-equipment',
]);

const KIDS_AND_BOOKS = new Set([
  'toys-games',
  'baby-gear',
  'books',
]);

function fixtureOrdinal(fixture: ExhibitionFixture): number {
  const match = fixture.slug.match(/-(\d{3})$/);
  return match ? Number(match[1]) : 0;
}

/**
 * Keeps related products on the same seller profile while distributing the
 * 147 fixtures as 30 / 30 / 29 / 30 / 28 (all below the 50-active-listing cap).
 */
export function sellerKeyForFixture(fixture: ExhibitionFixture): ExhibitionSellerKey {
  const { categorySlug } = fixture;
  const ordinal = fixtureOrdinal(fixture);

  if (VEHICLES_AND_JOBS.has(categorySlug)) return 'kamal';
  if (HOMES_AND_FURNITURE.has(categorySlug)) return 'hasan';
  if (TECH_AND_FASHION.has(categorySlug)) return 'mir';
  if (AGRICULTURE_AND_MEDICAL.has(categorySlug)) return 'farid';
  if (KIDS_AND_BOOKS.has(categorySlug)) return 'khalid';

  if (categorySlug === 'sports-equipment') {
    return ordinal >= 1 && ordinal <= 5 ? 'farid' : 'khalid';
  }
  if (categorySlug === 'miscellaneous') {
    if (ordinal >= 1 && ordinal <= 3) return 'hasan';
    if (ordinal >= 4 && ordinal <= 8) return 'mir';
    if (ordinal >= 9 && ordinal <= 10) return 'farid';
  }

  throw new Error(
    `No exhibition seller assignment for fixture "${fixture.key}" (${categorySlug}).`,
  );
}
