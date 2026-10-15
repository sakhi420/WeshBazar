import type { CategorySummary } from './types';

/**
 * Afghanistan marketplace home-category priority (localization pass).
 *
 * The single-row discovery carousel pins the highest-trade verticals to the
 * front and demotes livestock/agriculture to the tail. Slugs are the frozen
 * backend seed taxonomy (`prisma/seed/taxonomy.data.ts`), so this never
 * touches the API contract — it only reorders presentation.
 */
const HOME_ORDER: readonly string[] = [
  'vehicles', // موتر و وسایط نقلیه
  'mobiles-electronics', // موبایل و الکترونیک
  'real-estate', // املاک و جایداد
  'jobs-services', // خدمات و کاریابی
  'home-furniture', // لوازم خانه
  'fashion-beauty', // مد و زیبایی
  'kids-baby', // اطفال
  'books-education', // کتاب و تعلیم
  'sports-leisure', // ورزش و سرگرمی
  'medical-health', // صحت و درمان
  'miscellaneous', // متفرقه
  'animals-agriculture', // حیوانات و زراعت (انتهای اسکرول)
];

/**
 * Return the top-level categories ordered for the home carousel.
 *
 * `GET /categories` returns a *flat* list (roots + children), so child nodes
 * (e.g. "دوچرخه") are dropped here — only `parentId === null` roots surface.
 * Unknown slugs (newly added by admin) keep their received order and land after
 * the pinned list.
 */
export function orderHomeCategories(categories: CategorySummary[]): CategorySummary[] {
  const rank = new Map(HOME_ORDER.map((slug, index) => [slug, index]));
  return categories
    .filter((category) => category.parentId === null)
    .sort((a, b) => {
      const ra = rank.get(a.slug);
      const rb = rank.get(b.slug);
      if (ra !== undefined && rb !== undefined) return ra - rb;
      if (ra !== undefined) return -1;
      if (rb !== undefined) return 1;
      return a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug);
    });
}