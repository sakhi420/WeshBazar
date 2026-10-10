/**
 * Sell wizard — draft state (master prompt §34–§41, §139).
 *
 * The draft is the wizard's single source of truth: it lives in `SellProvider`
 * (React context), persists to localStorage between sessions, and feeds the
 * payload builders that talk to the frozen backend. The server draft
 * (`POST /listings`) is created at the end of the location step; `listingId` /
 * `listingVersion` link the local draft to it afterwards (§43 guard).
 *
 * Pure module: no React, no HTTP — storage access happens in the provider.
 */

import type { ListingCondition } from '@/lib/api';
import type { FilterSchemaField } from '@/features/categories';
import type {
  AttributeValue,
  AttributeValues,
  ContactMethodInput,
  CreateListingPayload,
  OwnerListing,
  PricingType,
  PublicAttribute,
  UpdateListingPayload,
} from '../types';
import {
  canonicalizeTelegramHandle,
  normalizePhoneOverride,
  parseDecimalNumber,
  parsePriceAmount,
  parseWholeNumber,
  type ContactConfig,
} from './validation';
import { isSellStepKey, type SellStepKey } from './sell-steps';

/** localStorage key; the version suffix allows future migrations. */
export const SELL_DRAFT_STORAGE_KEY = 'weshbazar.sell-draft.v1';

const CONDITIONS: readonly ListingCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];
const PRICING_TYPES: readonly PricingType[] = ['PAID', 'FREE', 'CONTACT'];

/** Contact configuration as edited in the wizard (§39). */
export type SellContactDraft = ContactConfig;

/** Defaults mirror the backend (§53): PHONE + WHATSAPP on, Telegram off. */
export const DEFAULT_CONTACT_DRAFT: SellContactDraft = {
  phoneEnabled: true,
  whatsappEnabled: true,
  telegramEnabled: false,
  phoneOverride: '',
  whatsappOverride: '',
  telegramHandle: '',
};

/** The wizard draft — every field a step collects plus progress markers. */
export interface SellDraft {
  categoryId: string | null;
  categoryName: string | null;
  title: string;
  description: string;
  condition: ListingCondition | null;
  pricingType: PricingType;
  /** Raw price text as typed (Persian digits allowed). */
  price: string;
  negotiable: boolean;
  attributes: AttributeValues;
  provinceId: string | null;
  provinceName: string | null;
  cityId: string | null;
  cityName: string | null;
  contact: SellContactDraft;
  /** Last finished step — drives resume and stepper progress. */
  completedStep: SellStepKey | null;
  /** Server draft linkage (created at the end of the location step). */
  listingId: string | null;
  listingVersion: number | null;
  updatedAt: string;
}

/** A fresh draft with backend-matching defaults. */
export function createEmptyDraft(now: Date = new Date()): SellDraft {
  return {
    categoryId: null,
    categoryName: null,
    title: '',
    description: '',
    condition: null,
    pricingType: 'PAID',
    price: '',
    negotiable: false,
    attributes: {},
    provinceId: null,
    provinceName: null,
    cityId: null,
    cityName: null,
    contact: { ...DEFAULT_CONTACT_DRAFT },
    completedStep: null,
    listingId: null,
    listingVersion: null,
    updatedAt: now.toISOString(),
  };
}

// --- Storage (§139) -------------------------------------------------------------

/** Serialize for localStorage. */
export function serializeDraft(draft: SellDraft): string {
  return JSON.stringify(draft);
}

/**
 * Defensive parse of a stored draft: every field is re-validated and coalesced
 * so a corrupted or older payload can never crash the wizard (§139). Returns
 * null when nothing usable is stored.
 */
export function parseStoredDraft(raw: string | null, now: Date = new Date()): SellDraft | null {
  if (raw === null || raw.trim().length === 0) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  return {
    categoryId: asStringOrNull(record.categoryId),
    categoryName: asStringOrNull(record.categoryName),
    title: asString(record.title),
    description: asString(record.description),
    condition: asCondition(record.condition),
    pricingType: asPricingType(record.pricingType) ?? 'PAID',
    price: asString(record.price),
    negotiable: typeof record.negotiable === 'boolean' ? record.negotiable : false,
    attributes: asAttributes(record.attributes),
    provinceId: asStringOrNull(record.provinceId),
    provinceName: asStringOrNull(record.provinceName),
    cityId: asStringOrNull(record.cityId),
    cityName: asStringOrNull(record.cityName),
    contact: asContact(record.contact),
    completedStep: isSellStepKey(record.completedStep) ? record.completedStep : null,
    listingId: asStringOrNull(record.listingId),
    listingVersion:
      typeof record.listingVersion === 'number' &&
      Number.isInteger(record.listingVersion) &&
      record.listingVersion > 0
        ? record.listingVersion
        : null,
    updatedAt:
      typeof record.updatedAt === 'string' && record.updatedAt.length > 0
        ? record.updatedAt
        : now.toISOString(),
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asCondition(value: unknown): ListingCondition | null {
  return CONDITIONS.includes(value as ListingCondition) ? (value as ListingCondition) : null;
}

function asPricingType(value: unknown): PricingType | null {
  return PRICING_TYPES.includes(value as PricingType) ? (value as PricingType) : null;
}

function asAttributeValue(value: unknown): AttributeValue | undefined {
  if (typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
    return value as string[];
  }
  return undefined;
}

function asAttributes(value: unknown): AttributeValues {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
  const result: AttributeValues = {};
  for (const [key, raw] of Object.entries(value)) {
    const clean = asAttributeValue(raw);
    if (clean !== undefined) result[key] = clean;
  }
  return result;
}

function asContact(value: unknown): SellContactDraft {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ...DEFAULT_CONTACT_DRAFT };
  }
  const record = value as Record<string, unknown>;
  return {
    phoneEnabled:
      typeof record.phoneEnabled === 'boolean'
        ? record.phoneEnabled
        : DEFAULT_CONTACT_DRAFT.phoneEnabled,
    whatsappEnabled:
      typeof record.whatsappEnabled === 'boolean'
        ? record.whatsappEnabled
        : DEFAULT_CONTACT_DRAFT.whatsappEnabled,
    telegramEnabled:
      typeof record.telegramEnabled === 'boolean'
        ? record.telegramEnabled
        : DEFAULT_CONTACT_DRAFT.telegramEnabled,
    phoneOverride: asString(record.phoneOverride),
    whatsappOverride: asString(record.whatsappOverride),
    telegramHandle: asString(record.telegramHandle),
  };
}

/** True when the draft holds anything worth restoring (drives the §139 banner). */
export function draftHasProgress(draft: SellDraft): boolean {
  return (
    draft.categoryId !== null ||
    draft.title.trim().length > 0 ||
    draft.description.trim().length > 0 ||
    draft.price.trim().length > 0
  );
}

// --- Payload builders (§45, §53) ------------------------------------------------

/**
 * Contact rows in backend order (§53). The complete set is always sent —
 * `valueOverride: null` means "fall back to the verified phone"; Telegram
 * carries its canonical `@name`.
 */
export function contactMethodsFromDraft(contact: SellContactDraft): ContactMethodInput[] {
  return [
    {
      type: 'PHONE',
      enabled: contact.phoneEnabled,
      valueOverride: normalizePhoneOverride(contact.phoneOverride),
    },
    {
      type: 'WHATSAPP',
      enabled: contact.whatsappEnabled,
      valueOverride: normalizePhoneOverride(contact.whatsappOverride),
    },
    {
      type: 'TELEGRAM',
      enabled: contact.telegramEnabled,
      valueOverride: contact.telegramEnabled
        ? canonicalizeTelegramHandle(contact.telegramHandle)
        : null,
    },
  ];
}

/** Typed payload value for one schema field; undefined = omit from payload. */
function coerceAttributeValue(
  field: FilterSchemaField,
  raw: AttributeValue | undefined,
): AttributeValue | undefined {
  if (raw === undefined) return undefined;
  switch (field.type) {
    case 'TEXT':
    case 'LONG_TEXT': {
      if (typeof raw !== 'string') return undefined;
      const value = raw.trim();
      return value.length === 0 ? undefined : value;
    }
    case 'INTEGER':
    case 'YEAR': {
      const amount = parseWholeNumber(raw);
      return amount === null ? undefined : amount;
    }
    case 'DECIMAL': {
      const amount = parseDecimalNumber(raw);
      return amount === null ? undefined : amount;
    }
    case 'BOOLEAN':
      return typeof raw === 'boolean' ? raw : undefined;
    case 'DATE': {
      if (typeof raw !== 'string') return undefined;
      const value = raw.trim();
      return value.length === 0 ? undefined : value;
    }
    case 'SELECT':
      return typeof raw === 'string' && raw.length > 0 ? raw : undefined;
    case 'MULTI_SELECT':
      return Array.isArray(raw) && raw.length > 0 ? [...new Set(raw)] : undefined;
    default:
      return undefined;
  }
}

/** Payload attributes: only schema keys, form values coerced per type (§37). */
export function attributesForPayload(
  values: AttributeValues,
  fields: readonly FilterSchemaField[],
): AttributeValues {
  const payload: AttributeValues = {};
  for (const field of fields) {
    const coerced = coerceAttributeValue(field, values[field.field]);
    if (coerced !== undefined) payload[field.field] = coerced;
  }
  return payload;
}

/**
 * `CreateListingDto` from the draft (§45). Returns null while a required
 * piece is missing — the location step is the only caller and its guard
 * already ensures completeness, but the builder stays defensive.
 */
export function buildListingCreatePayload(
  draft: SellDraft,
  fields: readonly FilterSchemaField[],
): CreateListingPayload | null {
  const { categoryId, provinceId, cityId, condition } = draft;
  if (categoryId === null || provinceId === null || cityId === null || condition === null) {
    return null;
  }
  const price = draft.pricingType === 'PAID' ? parsePriceAmount(draft.price) : null;
  if (draft.pricingType === 'PAID' && (price === null || price <= 0)) return null;
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    categoryId,
    provinceId,
    cityId,
    condition,
    pricingType: draft.pricingType,
    price,
    currency: 'AFN',
    negotiable: draft.pricingType === 'PAID' ? draft.negotiable : false,
    attributes: attributesForPayload(draft.attributes, fields),
    contactMethods: contactMethodsFromDraft(draft.contact),
  };
}

/**
 * `UpdateListingDto` from the draft (§43): the wizard PATCHes the complete
 * current state once the server draft exists, carrying `expectedVersion`
 * whenever the linkage is known.
 */
export function buildListingUpdatePayload(
  draft: SellDraft,
  fields: readonly FilterSchemaField[],
): UpdateListingPayload | null {
  const create = buildListingCreatePayload(draft, fields);
  if (create === null) return null;
  return {
    ...create,
    expectedVersion: draft.listingVersion ?? undefined,
  };
}

/** Merge server linkage after create/PATCH: the draft follows `version` (§43). */
export function mergeOwnerListing(
  draft: SellDraft,
  listing: OwnerListing,
  now: Date = new Date(),
): SellDraft {
  return {
    ...draft,
    listingId: listing.id,
    listingVersion: listing.version,
    updatedAt: now.toISOString(),
  };
}

/**
 * Draft attributes as `PublicAttribute[]` for the §40 preview — labels and
 * types come from the live schema, values are coerced exactly like the
 * payload so the preview shows what the server will receive.
 */
export function toPreviewAttributes(
  values: AttributeValues,
  fields: readonly FilterSchemaField[],
): PublicAttribute[] {
  const result: PublicAttribute[] = [];
  for (const field of fields) {
    const coerced = coerceAttributeValue(field, values[field.field]);
    if (coerced === undefined) continue;
    result.push({ key: field.field, label: field.label, type: field.type, value: coerced });
  }
  return result;
}
