/**
 * Public sitemap — only real inventory and real landing pages (§119 SEO rules).
 *
 * - Includes: static pages, ACTIVE browse categories, and ACTIVE listings from
 *   public discovery (the feed is ACTIVE listings of ACTIVE sellers only).
 * - Excludes: `/admin`, `/account`, `/search` (infinite parameter combinations)
 *   and seller storefronts (kept until Phase 2 shows real listings there).
 * - The backend unreachable → only static pages are emitted, never fabricated.
 */
import type { MetadataRoute } from 'next';
import { fetchCategoriesServer } from '@/features/categories';
import { fetchListingsServer } from '@/features/listings';
import { SITE_URL } from '@/lib/env';

/** Regenerate hourly in the background so new listings enter promptly. */
export const revalidate = 3600;

/** Hard cap on traversal so a misbehaving cursor can never emit unbounded XML. */
const MAX_LISTING_PAGES = 500;
const LISTING_PAGE_SIZE = 60;

interface StaticRoute {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>;
  priority: number;
}

const STATIC_ROUTES: StaticRoute[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/market', changeFrequency: 'daily', priority: 0.9 },
  { path: '/categories', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/help', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.3 },
];

interface ListingEntry {
  slug: string;
  lastModified?: Date;
}

/** Walk every page of the ACTIVE feed (limit 60) into one slug list. */
async function activeListings(): Promise<ListingEntry[]> {
  const out: ListingEntry[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_LISTING_PAGES; page += 1) {
    const result = await fetchListingsServer({ sort: 'newest', limit: LISTING_PAGE_SIZE, cursor });
    for (const item of result.items) {
      out.push({
        slug: item.slug,
        lastModified: item.publishedAt ? new Date(item.publishedAt) : undefined,
      });
    }
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return out;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [categories, listings] = await Promise.all([
      fetchCategoriesServer(),
      activeListings(),
    ]);

    for (const category of categories) {
      entries.push({
        url: `${SITE_URL}/category/${category.slug}`,
        changeFrequency: 'daily',
        priority: 0.6,
      });
    }

    for (const listing of listings) {
      entries.push({
        url: `${SITE_URL}/listing/${listing.slug}`,
        changeFrequency: 'weekly',
        priority: 0.8,
        ...(listing.lastModified ? { lastModified: listing.lastModified } : {}),
      });
    }
  } catch {
    // Backend down at generation time: static pages only, never fabricated inventory.
  }

  return entries;
}