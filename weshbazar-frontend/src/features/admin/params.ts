'use client';

/**
 * nuqs parsers for the admin moderation queue — client-only by design
 * (mirrors my-listings/params.ts): parsers must never be constructed in a
 * module a Server Component can import, and this module is re-exported from
 * no barrel. The server never reads these params.
 */

import { parseAsInteger, parseAsString, parseAsStringLiteral } from 'nuqs';
import { LISTING_QUEUE_VIEWS, QUEUE_SORT_OPTIONS } from './model';

const VIEW_KEYS = LISTING_QUEUE_VIEWS.map((item) => item.key);
const SORT_KEYS = QUEUE_SORT_OPTIONS.map((item) => item.value);

export const queueViewParser = parseAsStringLiteral(VIEW_KEYS);
export const queueSortParser = parseAsStringLiteral(SORT_KEYS);
export const queueSearchParser = parseAsString;
export const queuePageParser = parseAsInteger;
export const queueSellerParser = parseAsString;
