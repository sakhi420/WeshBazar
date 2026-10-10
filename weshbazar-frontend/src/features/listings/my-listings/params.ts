'use client';

/**
 * nuqs parser for the My Listings status tab — client-only by design
 * (mirrors search/parsers.ts): nuqs parsers must never be constructed in a
 * module a Server Component can import, and this module is re-exported from
 * no barrel. Server code never reads this param.
 */

import { parseAsStringLiteral } from 'nuqs';
import { MY_LISTINGS_STATUS_TABS } from './view-model';

export const myListingsStatusParser = parseAsStringLiteral(MY_LISTINGS_STATUS_TABS);
