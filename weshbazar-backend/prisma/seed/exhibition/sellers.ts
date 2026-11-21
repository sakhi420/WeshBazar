import type { ExhibitionFixture } from './fixtures';

export const EXHIBITION_SELLERS = {
  pamir: {
    displayName: 'بازار موتر پامیر',
    slug: 'pamir-motor-market',
    bio: 'آگهی‌های موتر، موتورسایکل، بایسکل و پرزه‌جات وسایط',
  },
  ariana: {
    displayName: 'خانه و املاک آریانا',
    slug: 'ariana-properties',
    bio: 'آگهی‌های خانه، زمین، دکان، دفتر و لوازم منزل',
  },
  novin: {
    displayName: 'فروشگاه تجهیزات نوین',
    slug: 'novin-equipment',
    bio: 'آگهی‌های تجهیزات دیجیتال، ورزشی و کالاهای متفرقه',
  },
  family: {
    displayName: 'فروشگاه خانواده',
    slug: 'family-store',
    bio: 'آگهی‌های لوازم کودک، کتاب، بازی و پوشاک خانواده',
  },
  services: {
    displayName: 'بازار خدمات و زراعت',
    slug: 'services-agriculture-market',
    bio: 'آگهی‌های خدمات، کار، زراعت، دامداری و تجهیزات طبی',
  },
} as const;

export type ExhibitionSellerKey = keyof typeof EXHIBITION_SELLERS;

const VEHICLES = new Set([
  'cars',
  'motorcycles',
  'bicycles',
  'vehicle-parts',
]);

const HOMES_AND_PROPERTY = new Set([
  'properties-for-rent',
  'properties-for-sale',
  'shops-offices',
  'furniture',
  'home-appliances',
  'garden-outdoor',
]);

const MODERN_EQUIPMENT = new Set([
  'sports-equipment',
  'gaming',
  'laptops-computers',
  'mobile-phones',
  'tablets',
  'tvs-audio',
  'miscellaneous',
]);

const FAMILY_GOODS = new Set([
  'baby-gear',
  'books',
  'toys-games',
  'mens-clothing',
  'womens-clothing',
  'watches-jewelry',
]);

const SERVICES_AND_AGRICULTURE = new Set([
  'jobs',
  'services',
  'livestock',
  'pets',
  'farm-tools',
  'medical-equipment',
]);

/**
 * Assigns all 147 exhibition fixtures to the five approved public store names.
 * The resulting counts are 18 / 27 / 36 / 31 / 35, each below the 50-listing cap.
 */
export function sellerKeyForFixture(fixture: ExhibitionFixture): ExhibitionSellerKey {
  const { categorySlug } = fixture;

  if (VEHICLES.has(categorySlug)) return 'pamir';
  if (HOMES_AND_PROPERTY.has(categorySlug)) return 'ariana';
  if (MODERN_EQUIPMENT.has(categorySlug)) return 'novin';
  if (FAMILY_GOODS.has(categorySlug)) return 'family';
  if (SERVICES_AND_AGRICULTURE.has(categorySlug)) return 'services';

  throw new Error(
    `No exhibition seller assignment for fixture "${fixture.key}" (${categorySlug}).`,
  );
}
