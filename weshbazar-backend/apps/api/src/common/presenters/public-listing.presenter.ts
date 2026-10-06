/**
 * Public listing presenters (spec §52, §110).
 *
 * Anonymous callers never see moderation metadata, rejected reasons, seller
 * contact values or lifecycle internals — the detail shape exists only for
 * ACTIVE and SOLD listings. Contact *availability* is announced here; the
 * values themselves are released only through the Phase 10 contact endpoint.
 */
import type { AttributeType, ListingContactType } from '../../generated/prisma/enums';
import { pickTranslation, type Locale } from '../utils/locale.utils';
import {
  toListingImageView,
  type ListingImageView,
  type ListingLocationRef,
  type ListingWithRefs,
  type MediaUrlResolver,
} from './listing.presenter';

export interface PublicAttributeView {
  key: string;
  label: string;
  /** Definition type; null when the attribute definition no longer exists. */
  type: AttributeType | null;
  value: string | number | boolean | string[];
}

export interface PublicContactView {
  /** Whether values can be revealed (Phase 10 endpoint); values are never embedded. */
  available: boolean;
  methods: ListingContactType[];
}

export interface PublicSellerRef {
  slug: string;
  displayName: string;
  memberSince: Date;
  phoneVerified: boolean;
}

export interface PublicListingSummary {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  pricingType: ListingWithRefs['pricingType'];
  negotiable: boolean;
  condition: ListingWithRefs['condition'];
  category: ListingLocationRef;
  province: ListingLocationRef;
  city: ListingLocationRef;
  primaryImage: ListingImageView | null;
  publishedAt: Date | null;
}

export interface PublicListingDetail extends PublicListingSummary {
  /** Only ACTIVE and SOLD are publicly reachable (§110). */
  status: 'ACTIVE' | 'SOLD';
  description: string;
  attributes: PublicAttributeView[];
  images: ListingImageView[];
  seller: PublicSellerRef;
  contact: PublicContactView;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicListingExtras {
  attributes: PublicAttributeView[];
  seller: PublicSellerRef;
  contact: PublicContactView;
}

export function toPublicListingSummary(
  row: ListingWithRefs,
  locale: Locale,
  urlFor: MediaUrlResolver,
): PublicListingSummary {
  const primary = row.images.find((image) => image.isPrimary) ?? row.images[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    price: row.price === null ? null : Number(row.price),
    currency: row.currency,
    pricingType: row.pricingType,
    negotiable: row.negotiable,
    condition: row.condition,
    category: toLocationRef(row.category, locale),
    province: toLocationRef(row.province, locale),
    city: toLocationRef(row.city, locale),
    primaryImage: primary === null ? null : toListingImageView(primary, urlFor),
    publishedAt: row.publishedAt,
  };
}

export function toPublicListingDetail(
  row: ListingWithRefs,
  locale: Locale,
  urlFor: MediaUrlResolver,
  extras: PublicListingExtras,
): PublicListingDetail {
  return {
    ...toPublicListingSummary(row, locale, urlFor),
    status: row.status === 'SOLD' ? 'SOLD' : 'ACTIVE',
    description: row.description,
    attributes: extras.attributes,
    images: row.images.map((image) => toListingImageView(image, urlFor)),
    seller: extras.seller,
    contact: extras.contact,
    soldAt: row.status === 'SOLD' ? row.soldAt : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toLocationRef(
  row: { id: string; slug: string; translations: Array<{ locale: string; name: string }> },
  locale: Locale,
): ListingLocationRef {
  return {
    id: row.id,
    slug: row.slug,
    name: pickTranslation(row.translations, locale)?.name ?? row.slug,
  };
}
