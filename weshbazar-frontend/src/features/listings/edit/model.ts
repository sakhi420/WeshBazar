/**
 * Edit Listing — pure state model (master prompt §42).
 *
 * The edit page diffs the seller's form against the seeded server snapshot
 * and PATCHes only the fields that actually changed: the backend treats every
 * provided material field as a material change (`MATERIAL_CHANGE_FIELDS`), so
 * re-sending an untouched ACTIVE listing would push it back into review.
 * Contact methods follow the same discipline — they are sent only when the
 * seller genuinely edited them, because the payload replaces the complete
 * stored set and a blind write could clobber a configuration the response
 * does not document.
 *
 * Pure module: no React, no HTTP — unit-testable end to end.
 */

import type { CategorySummary, FilterSchemaField } from '@/features/categories';
import type { ListingCondition } from '@/lib/api';
import type {
  AttributeValues,
  OwnerListing,
  OwnerListingStatus,
  PricingType,
  UpdateListingPayload,
} from '../types';
import {
  attributesForPayload,
  contactMethodsFromDraft,
  parsePriceAmount,
  type ContactConfig,
} from '../sell';

/**
 * Statuses whose gallery the owner may still change (mirrors the backend
 * `IMAGE_MUTABLE_STATUSES`): broader than the edit gate, because a listing
 * that re-entered PENDING_REVIEW after its first new image must accept the
 * rest of the batch.
 */
export const LISTING_IMAGE_MUTABLE_STATUSES: readonly OwnerListingStatus[] = [
  'DRAFT',
  'REJECTED',
  'ACTIVE',
  'PENDING_REVIEW',
];

/** True while `PATCH …/images/*` is accepted for the status. */
export function canMutateListingImages(status: OwnerListingStatus): boolean {
  return LISTING_IMAGE_MUTABLE_STATUSES.includes(status);
}

/** All-off contact config — the "unknown" seed, so nothing is sent by default. */
export const EMPTY_CONTACT_CONFIG: ContactConfig = {
  phoneEnabled: false,
  whatsappEnabled: false,
  telegramEnabled: false,
  phoneOverride: '',
  whatsappOverride: '',
  telegramHandle: '',
};

/** The server snapshot the working form is diffed against. */
export interface EditListingSeed {
  version: number;
  status: OwnerListingStatus;
  title: string;
  description: string;
  condition: ListingCondition;
  pricingType: PricingType;
  price: number | null;
  negotiable: boolean;
  categoryId: string;
  categoryName: string;
  /** Normalized server attributes (raw JSON, as stored). */
  attributes: Record<string, unknown>;
  provinceId: string;
  cityId: string;
  /** Seeded contact configuration; null when the response does not carry it. */
  contact: ContactConfig | null;
}

/** The seller's working copy — text inputs hold raw strings. */
export interface EditListingForm {
  title: string;
  description: string;
  condition: ListingCondition | null;
  pricingType: PricingType;
  /** Raw price text as typed (Persian digits allowed). */
  price: string;
  negotiable: boolean;
  categoryId: string;
  attributes: AttributeValues;
  provinceId: string;
  cityId: string;
  contact: ContactConfig;
}

/**
 * Runtime read of the owner contact configuration. The presenter includes it
 * on owner responses but the frozen `OwnerListingDto` does not document it —
 * so it is read defensively and `null` (unknown) disables blind writes.
 */
export function readContactConfig(listing: OwnerListing): ContactConfig | null {
  const raw = (listing as { contactMethods?: unknown }).contactMethods;
  if (!Array.isArray(raw)) return null;
  const config: ContactConfig = { ...EMPTY_CONTACT_CONFIG };
  let matched = false;
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) continue;
    const row = entry as Record<string, unknown>;
    const enabled = row.enabled === true;
    const override = typeof row.valueOverride === 'string' ? row.valueOverride : '';
    if (row.type === 'PHONE') {
      config.phoneEnabled = enabled;
      config.phoneOverride = override;
      matched = true;
    } else if (row.type === 'WHATSAPP') {
      config.whatsappEnabled = enabled;
      config.whatsappOverride = override;
      matched = true;
    } else if (row.type === 'TELEGRAM') {
      config.telegramEnabled = enabled;
      config.telegramHandle = override;
      matched = true;
    }
  }
  return matched ? config : null;
}

/** Server attribute JSON → form values (only shapes the fields can edit). */
export function toAttributeValues(raw: Record<string, unknown>): AttributeValues {
  const values: AttributeValues = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' || typeof value === 'boolean') {
      values[key] = value;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      values[key] = value;
    } else if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      values[key] = [...value];
    }
  }
  return values;
}

/** Map the owner record onto the working form and its diff seed. */
export function seedEditForm(listing: OwnerListing): {
  form: EditListingForm;
  seed: EditListingSeed;
} {
  const contact = readContactConfig(listing);
  return {
    form: {
      title: listing.title,
      description: listing.description,
      condition: listing.condition,
      pricingType: listing.pricingType,
      price: listing.price === null ? '' : String(listing.price),
      negotiable: listing.negotiable,
      categoryId: listing.category.id,
      attributes: toAttributeValues(listing.attributes),
      provinceId: listing.province.id,
      cityId: listing.city.id,
      contact: contact === null ? { ...EMPTY_CONTACT_CONFIG } : { ...contact },
    },
    seed: {
      version: listing.version,
      status: listing.status,
      title: listing.title,
      description: listing.description,
      condition: listing.condition,
      pricingType: listing.pricingType,
      price: listing.price,
      negotiable: listing.negotiable,
      categoryId: listing.category.id,
      categoryName: listing.category.name,
      attributes: listing.attributes,
      provinceId: listing.province.id,
      cityId: listing.city.id,
      contact,
    },
  };
}

/** Wire-equality for one attribute value (arrays order-free, numbers loose). */
function attributeValueEquals(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    const left = a.map((item) => String(item)).sort();
    const right = b.map((item) => String(item)).sort();
    return left.every((item, index) => item === right[index]);
  }
  if (typeof a === 'number' || typeof b === 'number') {
    return toFiniteNumber(a) === toFiniteNumber(b);
  }
  return a === b;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Payload attributes vs stored attributes (stored null/undefined ignored). */
export function attributesEqual(a: AttributeValues, b: Record<string, unknown>): boolean {
  const keysB = Object.keys(b).filter((key) => b[key] !== null && b[key] !== undefined);
  const keysA = Object.keys(a);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!(key in b)) return false;
    if (!attributeValueEquals(a[key], b[key])) return false;
  }
  return true;
}

/** Strict compare of two contact configurations (both already normalized). */
export function contactConfigsEqual(a: ContactConfig, b: ContactConfig): boolean {
  return (
    a.phoneEnabled === b.phoneEnabled &&
    a.whatsappEnabled === b.whatsappEnabled &&
    a.telegramEnabled === b.telegramEnabled &&
    a.phoneOverride === b.phoneOverride &&
    a.whatsappOverride === b.whatsappOverride &&
    a.telegramHandle === b.telegramHandle
  );
}

/**
 * Did the seller actually edit the contact section? With an unknown seed the
 * untouched all-off placeholder never counts, so nothing is replaced unless
 * the seller configured something explicitly.
 */
export function isContactDirty(contact: ContactConfig, seedContact: ContactConfig | null): boolean {
  return seedContact === null
    ? !contactConfigsEqual(contact, EMPTY_CONTACT_CONFIG)
    : !contactConfigsEqual(contact, seedContact);
}

/**
 * `UpdateListingDto` carrying only the real changes (§42). Returns null when
 * the form matches the seed — the caller shows «no changes» instead of a
 * pointless PATCH. `expectedVersion` rides along whenever a patch exists.
 */
export function buildEditPatch(
  form: EditListingForm,
  seed: EditListingSeed,
  fields: readonly FilterSchemaField[],
): UpdateListingPayload | null {
  const patch: UpdateListingPayload = {};

  const title = form.title.trim();
  if (title !== seed.title) patch.title = title;
  const description = form.description.trim();
  if (description !== seed.description) patch.description = description;

  if (form.condition !== null && form.condition !== seed.condition) {
    patch.condition = form.condition;
  }

  if (form.pricingType !== seed.pricingType) {
    // Mirror create semantics: non-PAID forces price null / negotiable false.
    patch.pricingType = form.pricingType;
    patch.price = form.pricingType === 'PAID' ? parsePriceAmount(form.price) : null;
    patch.negotiable = form.pricingType === 'PAID' ? form.negotiable : false;
  } else if (form.pricingType === 'PAID') {
    const amount = parsePriceAmount(form.price);
    if (amount !== seed.price) patch.price = amount;
    if (form.negotiable !== seed.negotiable) patch.negotiable = form.negotiable;
  }

  const attributePayload = attributesForPayload(form.attributes, fields);
  if (form.categoryId !== seed.categoryId) {
    // A category switch re-resolves attributes against the new schema.
    patch.categoryId = form.categoryId;
    patch.attributes = attributePayload;
  } else if (!attributesEqual(attributePayload, seed.attributes)) {
    patch.attributes = attributePayload;
  }

  if (form.provinceId !== seed.provinceId) patch.provinceId = form.provinceId;
  if (form.cityId !== seed.cityId) patch.cityId = form.cityId;

  if (isContactDirty(form.contact, seed.contact)) {
    patch.contactMethods = contactMethodsFromDraft(form.contact);
  }

  if (Object.keys(patch).length === 0) return null;
  patch.expectedVersion = seed.version;
  return patch;
}

/** One row of the category selector. */
export interface CategoryOption {
  id: string;
  /** Full path label (`والد / فرزند`) so depth survives a flat select. */
  label: string;
  /** Leaf categories only — the backend rejects parents (CATEGORY_NOT_LEAF). */
  selectable: boolean;
}

/** Flat list → select options with path labels, taxonomy order preserved. */
export function buildCategoryOptions(categories: readonly CategorySummary[]): CategoryOption[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  return categories.map((category) => {
    const parts: string[] = [];
    let node: CategorySummary | undefined = category;
    let guard = 0;
    while (node !== undefined && guard < 10) {
      parts.unshift(node.name);
      node = node.parentId !== null ? byId.get(node.parentId) : undefined;
      guard += 1;
    }
    return { id: category.id, label: parts.join(' / '), selectable: !category.hasChildren };
  });
}
