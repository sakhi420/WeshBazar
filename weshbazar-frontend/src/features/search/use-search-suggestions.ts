'use client';

/**
 * Live search suggestions (master prompt §112–113) — client-only by design.
 *
 * Two additive layers, neither replacing Enter-to-submit:
 *  - L1 recent searches: persisted in localStorage, shown on empty focus.
 *  - L2 live result preview: debounced `GET /listings?q=…&limit=5` reusing the
 *    frozen public discovery contract (no invented endpoint), with
 *    AbortController so a newer keystroke cancels the in-flight request.
 *
 * Deliberately NOT re-exported from the feature barrel: `params.ts` is the
 * Server-Component safe entry, and this module touches `window`.
 */

import { useEffect, useRef, useState } from 'react';
import { fetchListings } from '@/features/listings';
import { readRecentSearches, saveRecentSearch } from './recent-searches';

// Re-exported for `SearchField`, which consumes recent history directly.
export { readRecentSearches, saveRecentSearch };

export interface SearchSuggestion {
  kind: 'recent' | 'listing';
  label: string;
  /** Listing detail slug (kind === 'listing'). */
  slug?: string;
  /** Committed search query (kind === 'recent'). */
  query?: string;
}

const MIN_QUERY_CHARS = 2;
const DEBOUNCE_MS = 250;
const PREVIEW_LIMIT = 5;

export function useSearchSuggestions(query: string, enabled: boolean) {
  const [listings, setListings] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    abortRef.current?.abort();
    abortRef.current = null;

    if (!enabled || trimmed.length < MIN_QUERY_CHARS) {
      setListings([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const page = await fetchListings({ q: trimmed, limit: PREVIEW_LIMIT }, controller.signal);
        if (controller.signal.aborted) return;
        setListings(
          page.items.map((item) => ({
            kind: 'listing' as const,
            label: item.title,
            slug: item.slug,
          })),
        );
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        setListings([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled]);

  return { listings, loading };
}