'use client';

/**
 * nuqs parsers for the discovery URL state — client-only by design.
 *
 * nuqs parsers are client functions: constructing them at module scope inside
 * a shared module breaks Server Components ("Attempted to call
 * parseAsStringLiteral() from the server"). Server code reads the URL through
 * `parseDiscoverySearchParams` from `./params`; only client components may
 * import this module. It is intentionally NOT re-exported from the feature
 * barrel so a Server Component can never pick it up transitively.
 */

import { parseAsArrayOf, parseAsFloat, parseAsString, parseAsStringLiteral } from 'nuqs';
import { CONDITION_OPTIONS, FILTER_SEPARATOR, SORT_OPTIONS } from './params';

/**
 * Keys are the public URL parameter names; `condition` and `filter` are
 * separator-joined lists (`filter` uses the pipe separator — see the
 * FILTER_SEPARATOR note in params.ts).
 */
export const discoveryParamsParsers = {
  q: parseAsString,
  category: parseAsString,
  province: parseAsString,
  city: parseAsString,
  minPrice: parseAsFloat,
  maxPrice: parseAsFloat,
  condition: parseAsArrayOf(parseAsStringLiteral(CONDITION_OPTIONS), ','),
  sort: parseAsStringLiteral(SORT_OPTIONS),
  filter: parseAsArrayOf(parseAsString, FILTER_SEPARATOR),
};
