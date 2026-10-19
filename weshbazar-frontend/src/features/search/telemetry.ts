/**
 * Zero-result search telemetry (owner decision D3).
 *
 * Fire-and-forget event for demand signals the frontend already knows about: a
 * visitor searched (or filtered) and got zero listings. The backend logs the
 * event; this helper never rejects so a failed beacon can't degrade the search
 * experience.
 */
import { post } from '@/lib/api';

export interface SearchZeroResultPayload {
  q?: string;
  category?: string;
  province?: string;
}

export function recordZeroResultSearch(payload: SearchZeroResultPayload): Promise<void> {
  return post<{ recorded: boolean }>('/search/zero-results', payload, { auth: false })
    .then(() => undefined)
    .catch(() => undefined);
}

/** Valid interaction event kinds (ANALYTICS-001/003/004/005). */
export const SEARCH_EVENT_TYPES = [
  'search_submitted',
  'search_results_viewed',
  'filter_applied',
  'filter_removed',
  'filter_cleared',
  'sort_changed',
  'listing_card_opened',
] as const;
export type SearchEventType = (typeof SEARCH_EVENT_TYPES)[number];

export interface SearchEventPayload {
  type: SearchEventType;
  q?: string;
  category?: string;
  province?: string;
  sort?: string;
  filterKey?: string;
  filterValue?: string;
  count?: number;
  listingId?: string;
}

export function recordSearchEvent(payload: SearchEventPayload): Promise<void> {
  return post<{ recorded: boolean }>('/search/events', payload, { auth: false })
    .then(() => undefined)
    .catch(() => undefined);
}