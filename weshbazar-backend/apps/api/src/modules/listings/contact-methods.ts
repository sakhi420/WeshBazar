/**
 * Contact method configuration and resolution (spec §53–§54).
 *
 * Pure module: sellers configure which methods (PHONE / WHATSAPP / TELEGRAM)
 * a listing exposes and optionally override the value; the contact endpoint
 * resolves the value for one enabled method. PHONE and WHATSAPP default to
 * the seller's verified phone, TELEGRAM requires a validated `@handle` —
 * arbitrary URLs are never accepted.
 */
import { normalizePhone } from '../../common/utils/phone.utils';
import type { ListingContactType } from '../../generated/prisma/enums';

/** One configured method row (shape shared by storage and payloads). */
export interface ContactMethodValue {
  type: ListingContactType;
  enabled: boolean;
  valueOverride: string | null;
}

/** Loose input before normalization (request payload shape). */
export interface ContactMethodInput {
  type: ListingContactType;
  enabled?: boolean;
  valueOverride?: string | null;
}

export interface ContactMethodIssue {
  field: string;
  messages: string[];
}

/**
 * Default configuration when a listing does not specify one: both
 * phone-derived methods enabled (seller-verified phone fallback), no
 * Telegram — matching the seeded demo data.
 */
export const DEFAULT_CONTACT_METHODS: readonly ContactMethodValue[] = [
  { type: 'PHONE', enabled: true, valueOverride: null },
  { type: 'WHATSAPP', enabled: true, valueOverride: null },
];

/** Telegram usernames: 5–32 chars, must start with a letter (after `@`). */
const TELEGRAM_HANDLE_PATTERN = /^@[A-Za-z][A-Za-z0-9_]{4,31}$/;

/** Stable ordering for responses and snapshots. */
const TYPE_ORDER: Record<ListingContactType, number> = { PHONE: 0, WHATSAPP: 1, TELEGRAM: 2 };

/** Deterministic display order (PHONE, WHATSAPP, TELEGRAM). */
export function orderContactMethods<T extends { type: ListingContactType }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type]);
}

/**
 * Validates and normalizes a seller-supplied contact configuration. Returns
 * every problem at once (like the attribute engine) so clients fix the whole
 * payload in one round trip; duplicates are rejected because the storage key
 * is `(listingId, type)`.
 */
export function normalizeContactMethods(inputs: readonly ContactMethodInput[]): {
  methods: ContactMethodValue[];
  issues: ContactMethodIssue[];
} {
  const issues: ContactMethodIssue[] = [];
  const seen = new Set<ListingContactType>();
  const methods: ContactMethodValue[] = [];

  for (const input of inputs) {
    const field = `contactMethods.${input.type}`;
    if (seen.has(input.type)) {
      issues.push({ field, messages: ['Each contact method type may appear at most once.'] });
      continue;
    }
    seen.add(input.type);

    const enabled = input.enabled ?? true;
    const raw = input.valueOverride?.trim() ?? null;
    const valueOverride = raw === null || raw.length === 0 ? null : raw;

    if (input.type === 'TELEGRAM') {
      if (valueOverride === null) {
        if (enabled) {
          issues.push({
            field,
            messages: ['A Telegram handle is required to enable this method.'],
          });
          continue;
        }
        methods.push({ type: input.type, enabled, valueOverride: null });
        continue;
      }
      // Accept `@name` or bare `name`, store canonical `@name`.
      const candidate = valueOverride.startsWith('@') ? valueOverride : `@${valueOverride}`;
      if (!TELEGRAM_HANDLE_PATTERN.test(candidate)) {
        issues.push({
          field,
          messages: ['Enter a Telegram username like @weshbazar (5–32 letters, digits or _).'],
        });
        continue;
      }
      methods.push({ type: input.type, enabled, valueOverride: candidate });
      continue;
    }

    // PHONE / WHATSAPP: the override is optional (falls back to the seller's
    // verified phone) but must be a valid dialable number when provided.
    if (valueOverride === null) {
      methods.push({ type: input.type, enabled, valueOverride: null });
      continue;
    }
    const normalized = normalizePhone(valueOverride);
    if (normalized === null) {
      issues.push({
        field,
        messages: ['Enter a valid phone number (e.g. 0701234567 or +93701234567).'],
      });
      continue;
    }
    methods.push({ type: input.type, enabled, valueOverride: normalized });
  }

  return { methods: orderContactMethods(methods), issues };
}

/**
 * Resolves the value revealed through the contact endpoint for one enabled
 * method, or null when the method is not enabled (or has no resolvable
 * value). Never returns a value for a disabled row.
 */
export function resolveContactValue(
  method: ListingContactType,
  rows: readonly ContactMethodValue[],
  sellerPhone: string | null,
): string | null {
  const row = rows.find((candidate) => candidate.type === method && candidate.enabled);
  if (row === undefined) {
    return null;
  }
  if (row.valueOverride !== null) {
    return row.valueOverride;
  }
  return method === 'TELEGRAM' ? null : sellerPhone;
}
