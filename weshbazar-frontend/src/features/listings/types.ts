/**
 * Listings feature — view models.
 * Shapes mirror the frozen backend contract (docs/openapi.json):
 * PublicListingSummaryDto / PublicListingDetailDto / ListingRefDto /
 * ListingImageDto / PublicAttributeDto / PublicSellerRefDto / PublicContactDto /
 * ContactTargetDto. Do not invent fields.
 */

import type { ListingCondition } from '@/lib/api';

/** `ListingRefDto` — category / province / city reference. */
export interface ListingRef {
  id: string;
  slug: string;
  name: string;
}

/** Derived image variant (`thumbnail` / `medium` / `large`). */
export interface ListingImageVariant {
  url: string;
  width: number;
  height: number;
}

/** `ListingImageDto` — absolute URLs; variants keyed by name. */
export interface ListingImage {
  id: string;
  url: string;
  variants: Record<string, ListingImageVariant>;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
}

/** `PricingType` enum (prisma/schema.prisma via OpenAPI examples). */
export type PricingType = 'PAID' | 'FREE' | 'CONTACT';

/** Publicly reachable listing states (PublicListingSummaryDto.status). */
export type PublicListingStatus = 'ACTIVE' | 'SOLD';

/** `PublicListingSummaryDto` — discovery list item. */
export interface PublicListingSummary {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  pricingType: PricingType;
  negotiable: boolean;
  condition: ListingCondition;
  category: ListingRef;
  province: ListingRef;
  city: ListingRef;
  primaryImage: ListingImage | null;
  publishedAt: string | null;
}

/** `PublicListingDetailDto` — discovery detail. */
export interface PublicListingDetail extends PublicListingSummary {
  status: PublicListingStatus;
  description: string;
  attributes: PublicAttribute[];
  images: ListingImage[];
  seller: PublicSellerRef;
  contact: PublicContact;
  soldAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `PublicAttributeDto` — dynamic attribute with display label. */
export interface PublicAttribute {
  key: string;
  label: string;
  /** Definition type; null when the attribute definition no longer exists. */
  type: string | null;
  value: string | number | boolean | string[];
}

/** `PublicSellerRefDto` — embedded seller reference on a listing. */
export interface PublicSellerRef {
  slug: string;
  displayName: string;
  memberSince: string;
  phoneVerified: boolean;
  avatarUrl: string | null;
}

/** Enabled contact methods on a listing (ListingContactType enum). */
export type ContactMethodType = 'PHONE' | 'WHATSAPP' | 'TELEGRAM';

/** `PublicContactDto` — availability + enabled methods; values never embedded. */
export interface PublicContact {
  available: boolean;
  methods: string[];
}

/** `ContactTargetDto` — revealed server-authoritative contact target. */
export interface ContactTarget {
  method: ContactMethodType;
  value: string;
}

// --- Owner-side (sell flow §34–§41) -------------------------------------------

/** Owner-visible lifecycle status (prisma `ListingStatus`). */
export type OwnerListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SOLD'
  | 'ARCHIVED';

/** Raw attribute value — validated/normalized by the backend engine (§32). */
export type AttributeValue = string | number | boolean | string[];

/** Submitted attribute payload keyed by attribute field key. */
export type AttributeValues = Record<string, AttributeValue>;

/** `ContactMethodInputDto` — one entry of the complete contact configuration (§53). */
export interface ContactMethodInput {
  type: ContactMethodType;
  enabled?: boolean;
  valueOverride?: string | null;
}

/**
 * `OwnerListingDto` — the owner-side payload; every listing/media mutation
 * returns the refreshed record so the wizard and gallery share one source of
 * truth (including `version` for the optimistic guard).
 */
export interface OwnerListing {
  id: string;
  slug: string;
  status: OwnerListingStatus;
  version: number;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  pricingType: PricingType;
  negotiable: boolean;
  condition: ListingCondition;
  attributes: Record<string, unknown>;
  category: ListingRef;
  province: ListingRef;
  city: ListingRef;
  images: ListingImage[];
  views: number;
  favoriteCount: number;
  publishedAt: string | null;
  soldAt: string | null;
  archivedAt: string | null;
  expiresAt: string | null;
  rejectedReason: string | null;
  rejectedNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `OwnerListingSummaryDto` — the seller's list row (`GET /me/listings`, §31).
 * A lighter shape than the full owner record: no description, attributes,
 * image array or location refs — the management card renders only these.
 */
export interface OwnerListingSummary {
  id: string;
  slug: string;
  status: OwnerListingStatus;
  version: number;
  title: string;
  price: number | null;
  currency: string;
  pricingType: PricingType;
  condition: ListingCondition;
  category: ListingRef;
  primaryImage: ListingImage | null;
  views: number;
  favoriteCount: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** `POST /api/v1/listings` — draft creation (§45). */
export interface CreateListingPayload {
  title: string;
  description: string;
  categoryId: string;
  provinceId: string;
  cityId: string;
  condition: ListingCondition;
  pricingType?: PricingType;
  price?: number | null;
  currency?: string;
  negotiable?: boolean;
  attributes?: AttributeValues;
  contactMethods?: ContactMethodInput[];
}

/**
 * `PATCH /api/v1/listings/{id}` — partial edit. `expectedVersion` guards
 * against concurrent writers; material edits may re-enter review (§42).
 */
export interface UpdateListingPayload extends Partial<CreateListingPayload> {
  expectedVersion?: number;
}

/**
 * Discovery query accepted by `GET /api/v1/listings`
 * (frontend-api-contract.md §7). All values are also the documented
 * query-parameter names — nothing invented.
 */
export interface DiscoveryQuery {
  q?: string;
  /** Category slug (leaf). */
  category?: string;
  /** Province slug. */
  province?: string;
  /** City slug. */
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: ListingCondition[];
  sort?: string;
  /** Dynamic attribute filter expressions (`key:operator:value`). */
  filter?: string[];
  cursor?: string;
  limit?: number;
  locale?: string;
}
