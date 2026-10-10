/**
 * Contacts feature — data access (master prompt §23, §36).
 *
 * POST /listings/{id}/contact with an Idempotency-Key (frontend-api-contract
 * §8). Guest callers receive 401 → route to login preserving `next`;
 * PHONE_NOT_VERIFIED (403) is surfaced inline; LISTING_NOT_ACTIVE (409)
 * disables the action.
 */

import { newIdempotencyKey, post } from '@/lib/api';
import type { ContactMethodType, ContactTarget } from './types';

export interface RevealContactOptions {
  /** Reuse across retries of the same intent; generate a fresh one per intent. */
  idempotencyKey?: string;
  signal?: AbortSignal;
}

/** Reveal one contact method's server-authoritative target for a listing. */
export function revealContact(
  listingId: string,
  method: ContactMethodType,
  options: RevealContactOptions = {},
): Promise<ContactTarget> {
  return post<ContactTarget>(
    `/listings/${encodeURIComponent(listingId)}/contact`,
    { method },
    {
      idempotencyKey: options.idempotencyKey ?? newIdempotencyKey(),
      signal: options.signal,
    },
  );
}
