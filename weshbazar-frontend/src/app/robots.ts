/**
 * Robots policy — let crawlers index public inventory while blocking private
 * surfaces (mirrors the `X-Robots-Tag` rules in `next.config.mjs`).
 */
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}