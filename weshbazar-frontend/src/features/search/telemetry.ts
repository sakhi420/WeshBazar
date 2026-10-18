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