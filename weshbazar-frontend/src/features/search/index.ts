/**
 * Search feature (master prompt §21, §25–27).
 * Owns: the discovery query grammar (q, category, province, city, price,
 * condition, sort, filter expressions), URL state via nuqs, and cursor
 * pagination. Filter UI is built from the category filter-schema.
 *
 * Note: the nuqs parsers live in `./parsers` and are deliberately NOT
 * re-exported here — they are client-only, and this barrel is imported by
 * Server Components (search / category pages). Client components import the
 * parsers directly from `@/features/search/parsers`.
 */
export * from './params';
