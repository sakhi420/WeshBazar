/**
 * Owner-facing listing presenters (spec §107).
 *
 * These shapes back the seller's own screens (`/me/listings`, edit form,
 * command responses). The public discovery/detail shapes are deliberately
 * different and live in `public-listing.presenter.ts`.
 *
 * Image URLs are resolved through a `MediaUrlResolver` callback instead of
 * the presenter reaching for configuration — the storage abstraction (§64)
 * owns URL construction, and presenters stay pure.
 */
import type {
  Category,
  CategoryTranslation,
  City,
  CityTranslation,
  Listing,
  ListingContactMethod,
  ListingImage,
  ListingRevision,
  Province,
  ProvinceTranslation,
} from '../../generated/prisma/client';
import type { ListingContactType } from '../../generated/prisma/enums';
import { pickTranslation, type Locale } from '../utils/locale.utils';

/** Localized refs + gallery — the row shape every listing presenter builds on. */
export type ListingWithRefs = Listing & {
  category: Category & { translations: CategoryTranslation[] };
  province: Province & { translations: ProvinceTranslation[] };
  city: City & { translations: CityTranslation[] };
  images: ListingImage[];
};

/** Owner rows additionally carry the contact configuration (§53). */
export type ListingWithRelations = ListingWithRefs & {
  /** Ordered by the DB enum (PHONE, WHATSAPP, TELEGRAM). */
  contactMethods: ListingContactMethod[];
};

/** Maps a storage key to a publicly loadable URL (StorageProvider §64). */
export type MediaUrlResolver = (storageKey: string) => string;

export interface ListingLocationRef {
  id: string;
  slug: string;
  name: string;
}

export interface ListingVariantView {
  url: string;
  width: number;
  height: number;
}

/** Owner-visible contact configuration; values only for the owner (§53). */
export interface ContactMethodView {
  type: ListingContactType;
  enabled: boolean;
  valueOverride: string | null;
}

export interface ListingImageView {
  id: string;
  /** URL of the stored original (re-encoded JPEG). */
  url: string;
  /** Derived variants keyed by name: thumbnail / medium / large (§66). */
  variants: Record<string, ListingVariantView>;
  width: number;
  height: number;
  isPrimary: boolean;
  sortOrder: number;
}

export interface OwnerListing {
  id: string;
  slug: string;
  status: Listing['status'];
  version: number;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  pricingType: Listing['pricingType'];
  negotiable: boolean;
  condition: Listing['condition'];
  attributes: Record<string, unknown>;
  contactMethods: ContactMethodView[];
  category: ListingLocationRef;
  province: ListingLocationRef;
  city: ListingLocationRef;
  images: ListingImageView[];
  views: number;
  favoriteCount: number;
  publishedAt: Date | null;
  soldAt: Date | null;
  archivedAt: Date | null;
  expiresAt: Date | null;
  rejectedReason: string | null;
  rejectedNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OwnerListingSummary {
  id: string;
  slug: string;
  status: Listing['status'];
  version: number;
  title: string;
  price: number | null;
  currency: string;
  pricingType: Listing['pricingType'];
  condition: Listing['condition'];
  category: ListingLocationRef;
  primaryImage: ListingImageView | null;
  views: number;
  favoriteCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingRevisionView {
  id: string;
  version: number;
  changeType: ListingRevision['changeType'];
  snapshot: Record<string, unknown>;
  attributeSchemaReference: unknown;
  createdByUserId: string | null;
  createdAt: Date;
}

export function toOwnerListing(
  row: ListingWithRelations,
  locale: Locale,
  urlFor: MediaUrlResolver,
): OwnerListing {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    version: row.version,
    title: row.title,
    description: row.description,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    pricingType: row.pricingType,
    negotiable: row.negotiable,
    condition: row.condition,
    attributes: (row.attributes ?? {}) as Record<string, unknown>,
    contactMethods: row.contactMethods.map(({ type, enabled, valueOverride }) => ({
      type,
      enabled,
      valueOverride,
    })),
    category: toRef(row.category, locale),
    province: toRef(row.province, locale),
    city: toRef(row.city, locale),
    images: row.images.map((image) => toListingImageView(image, urlFor)),
    views: row.views,
    favoriteCount: row.favoriteCount,
    publishedAt: row.publishedAt,
    soldAt: row.soldAt,
    archivedAt: row.archivedAt,
    expiresAt: row.expiresAt,
    rejectedReason: row.rejectedReason,
    rejectedNote: row.rejectedNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toOwnerListingSummary(
  row: ListingWithRefs,
  locale: Locale,
  urlFor: MediaUrlResolver,
): OwnerListingSummary {
  const primary = row.images.find((image) => image.isPrimary) ?? row.images[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    version: row.version,
    title: row.title,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    pricingType: row.pricingType,
    condition: row.condition,
    category: toRef(row.category, locale),
    primaryImage: primary === null ? null : toListingImageView(primary, urlFor),
    views: row.views,
    favoriteCount: row.favoriteCount,
    expiresAt: row.expiresAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toListingImageView(row: ListingImage, urlFor: MediaUrlResolver): ListingImageView {
  const variants: Record<string, ListingVariantView> = {};
  for (const [name, descriptor] of Object.entries(readVariantDescriptors(row.variants))) {
    variants[name] = {
      url: urlFor(descriptor.key),
      width: descriptor.width,
      height: descriptor.height,
    };
  }
  return {
    id: row.id,
    url: urlFor(row.storageKey),
    variants,
    width: row.width,
    height: row.height,
    isPrimary: row.isPrimary,
    sortOrder: row.sortOrder,
  };
}

export function toListingRevisionView(row: ListingRevision): ListingRevisionView {
  return {
    id: row.id,
    version: row.version,
    changeType: row.changeType,
    snapshot: (row.snapshot ?? {}) as Record<string, unknown>,
    attributeSchemaReference: row.attributeSchemaReference,
    createdByUserId: row.createdByUserId,
    createdAt: row.createdAt,
  };
}

interface VariantDescriptor {
  key: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Defensive read of the `ListingImage.variants` JSON descriptor: rows written
 * by this application always match the shape, but old/corrupt rows must not
 * crash listing serialization.
 */
function readVariantDescriptors(raw: unknown): Record<string, VariantDescriptor> {
  if (typeof raw !== 'object' || raw === null) {
    return {};
  }
  const out: Record<string, VariantDescriptor> = {};
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) {
      continue;
    }
    const record = value as Record<string, unknown>;
    if (
      typeof record.key === 'string' &&
      typeof record.width === 'number' &&
      typeof record.height === 'number' &&
      typeof record.size === 'number'
    ) {
      out[name] = {
        key: record.key,
        width: record.width,
        height: record.height,
        size: record.size,
      };
    }
  }
  return out;
}

function toRef(
  row: (Category | Province | City) & { translations: Array<{ locale: string; name: string }> },
  locale: Locale,
): ListingLocationRef {
  return {
    id: row.id,
    slug: row.slug,
    name: pickTranslation(row.translations, locale)?.name ?? row.slug,
  };
}
