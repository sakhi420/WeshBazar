/**
 * URL slug helpers shared by public-facing resources (sellers today,
 * categories and listings later).
 *
 * Slugs are lowercase ASCII, hyphen-separated, and stable once assigned —
 * public URLs depend on them (SEO contract, spec §111).
 */
import { randomBytes } from 'node:crypto';

/** Maximum length for generated slugs (DB columns allow up to 140). */
const MAX_BASE_LENGTH = 120;

/**
 * Convert arbitrary text into a slug candidate. Returns an empty string when
 * the input contains no transliterable ASCII characters (e.g. Pashto/Dari
 * text) — callers must supply a fallback in that case.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_BASE_LENGTH)
    .replace(/-+$/g, ''); // trimming after slice may leave a trailing hyphen
}

/**
 * Validate the slug *format* accepted at public route boundaries. Kept
 * deliberately strict so junk requests fail before touching the database.
 */
export function isValidSlugFormat(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 140;
}

/**
 * Short random suffix used to resolve slug collisions. Uses 24 bits of
 * randomness — collision odds are negligible, and a failed attempt simply
 * retries (the caller loops on unique-constraint errors).
 */
export function slugSuffix(bytes = 3): string {
  return randomBytes(bytes).toString('hex');
}
