/**
 * Admin/moderation presenters (spec §59, §60, §106).
 *
 * These shapes back the moderation queues and user-management screens. They
 * intentionally carry moderation state (rejection reasons, suspension facts,
 * report details) that never appears on public or owner surfaces.
 */
import type {
  AuditAction,
  ListingContactType,
  ListingStatus,
  ModerationActionType,
  ReportReason,
  ReportStatus,
  SellerAccountStatus,
  UserRole,
  UserStatus,
} from '../../generated/prisma/enums';
import type { MediaUrlResolver } from './listing.presenter';

// -----------------------------------------------------------------------------
// Users
// -----------------------------------------------------------------------------

export interface AdminSellerRef {
  id: string;
  slug: string;
  displayName: string;
  status: SellerAccountStatus;
  activeListings: number;
}

export interface AdminUserView {
  id: string;
  phone: string;
  phoneNormalized: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  phoneVerifiedAt: Date | null;
  suspensionReason: string | null;
  suspendedUntil: Date | null;
  createdAt: Date;
  seller: AdminSellerRef | null;
}

/** `listingsByStatus` always contains every listing status (zero-filled). */
export interface AdminUserDetailView extends AdminUserView {
  listingsByStatus: Record<ListingStatus, number>;
  openReportsAbout: number;
  reportsSubmitted: number;
}

export interface AdminUserRowInput {
  id: string;
  phone: string;
  phoneNormalized: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  phoneVerifiedAt: Date | null;
  suspensionReason: string | null;
  suspendedUntil: Date | null;
  createdAt: Date;
  sellerAccount: {
    id: string;
    slug: string;
    displayName: string;
    status: SellerAccountStatus;
    /** Active listings of the seller account, when `_count` was included. */
    _count?: { listings: number };
  } | null;
}

const LISTING_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'PENDING_REVIEW',
  'ACTIVE',
  'REJECTED',
  'SOLD',
  'ARCHIVED',
];

export function toAdminUserView(row: AdminUserRowInput): AdminUserView {
  return {
    id: row.id,
    phone: row.phone,
    phoneNormalized: row.phoneNormalized,
    displayName: row.displayName,
    role: row.role,
    status: row.status,
    phoneVerifiedAt: row.phoneVerifiedAt,
    suspensionReason: row.suspensionReason,
    suspendedUntil: row.suspendedUntil,
    createdAt: row.createdAt,
    seller:
      row.sellerAccount === null
        ? null
        : {
            id: row.sellerAccount.id,
            slug: row.sellerAccount.slug,
            displayName: row.sellerAccount.displayName,
            status: row.sellerAccount.status,
            activeListings: row.sellerAccount._count?.listings ?? 0,
          },
  };
}

export function toAdminUserDetailView(
  row: AdminUserRowInput,
  counts: {
    listingsByStatus: Partial<Record<ListingStatus, number>>;
    openReportsAbout: number;
    reportsSubmitted: number;
  },
): AdminUserDetailView {
  const listingsByStatus = Object.fromEntries(
    LISTING_STATUSES.map((status) => [status, counts.listingsByStatus[status] ?? 0]),
  ) as Record<ListingStatus, number>;
  return {
    ...toAdminUserView(row),
    listingsByStatus,
    openReportsAbout: counts.openReportsAbout,
    reportsSubmitted: counts.reportsSubmitted,
  };
}

// -----------------------------------------------------------------------------
// Listing moderation
// -----------------------------------------------------------------------------

export type ModerationActionLabel = 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'RESTORE';

export interface AdminModerationActionView {
  id: string;
  action: ModerationActionType;
  adminUserId: string;
  adminDisplayName: string | null;
  reason: string | null;
  note: string | null;
  createdAt: Date;
}

export interface AdminListingRefView {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
}

export interface AdminListingItemView {
  id: string;
  slug: string;
  title: string;
  status: ListingStatus;
  price: number | null;
  currency: string;
  categoryName: string;
  provinceName: string;
  cityName: string;
  seller: {
    sellerAccountId: string;
    ownerUserId: string;
    displayName: string;
    slug: string;
    status: SellerAccountStatus;
  };
  /** Primary (or first) image, resolved through the storage provider. */
  thumbnailUrl: string | null;
  views: number;
  favoriteCount: number;
  openReportCount: number;
  version: number;
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  expiresAt: Date | null;
  /** Actions the calling principal may perform on this row (§59). */
  permittedActions: ModerationActionLabel[];
}

export interface AdminListingDetailView extends AdminListingItemView {
  description: string;
  condition: string;
  pricingType: string;
  negotiable: boolean;
  contactMethods: Array<{
    type: ListingContactType;
    enabled: boolean;
    valueOverride: string | null;
  }>;
  images: Array<{ id: string; url: string; width: number; height: number; isPrimary: boolean }>;
  moderationActions: AdminModerationActionView[];
}

/** Row shape for admin listing queues: refs + seller + open-report count. */
export interface AdminListingRowInput {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: ListingStatus;
  price: unknown;
  currency: string;
  condition: string;
  pricingType: string;
  negotiable: boolean;
  views: number;
  favoriteCount: number;
  version: number;
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  expiresAt: Date | null;
  attributes: unknown;
  category: { translations: Array<{ locale: string; name: string }>; slug: string };
  province: { translations: Array<{ locale: string; name: string }>; slug: string };
  city: { translations: Array<{ locale: string; name: string }>; slug: string };
  sellerAccount: {
    id: string;
    ownerUserId: string;
    displayName: string;
    slug: string;
    status: SellerAccountStatus;
  };
  images: Array<{
    id: string;
    storageKey: string;
    width: number;
    height: number;
    isPrimary: boolean;
  }>;
  contactMethods?: Array<{
    type: ListingContactType;
    enabled: boolean;
    valueOverride: string | null;
  }>;
  moderationActions?: Array<{
    id: string;
    action: ModerationActionType;
    adminUserId: string;
    reason: string | null;
    note: string | null;
    createdAt: Date;
    adminUser: { displayName: string } | null;
  }>;
  _count: { reports: number };
}

function localizedName(
  ref: { slug: string; translations: Array<{ locale: string; name: string }> },
  locale: string,
): string {
  return (
    ref.translations.find((translation) => translation.locale === locale)?.name ??
    ref.translations.find((translation) => translation.locale === 'en')?.name ??
    ref.slug
  );
}

export function toAdminListingItem(
  row: AdminListingRowInput,
  locale: string,
  urlFor: MediaUrlResolver,
  permittedActions: ModerationActionLabel[],
): AdminListingItemView {
  const thumbnail = row.images.find((image) => image.isPrimary) ?? row.images[0];
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    currency: row.currency,
    categoryName: localizedName(row.category, locale),
    provinceName: localizedName(row.province, locale),
    cityName: localizedName(row.city, locale),
    seller: {
      sellerAccountId: row.sellerAccount.id,
      ownerUserId: row.sellerAccount.ownerUserId,
      displayName: row.sellerAccount.displayName,
      slug: row.sellerAccount.slug,
      status: row.sellerAccount.status,
    },
    thumbnailUrl: thumbnail === undefined ? null : urlFor(thumbnail.storageKey),
    views: row.views,
    favoriteCount: row.favoriteCount,
    openReportCount: row._count.reports,
    version: row.version,
    rejectedReason: row.rejectedReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    permittedActions,
  };
}

export function toAdminListingDetail(
  row: AdminListingRowInput,
  locale: string,
  urlFor: MediaUrlResolver,
  permittedActions: ModerationActionLabel[],
): AdminListingDetailView {
  return {
    ...toAdminListingItem(row, locale, urlFor, permittedActions),
    description: row.description,
    condition: row.condition,
    pricingType: row.pricingType,
    negotiable: row.negotiable,
    contactMethods: (row.contactMethods ?? []).map(({ type, enabled, valueOverride }) => ({
      type,
      enabled,
      valueOverride,
    })),
    images: row.images.map((image) => ({
      id: image.id,
      url: urlFor(image.storageKey),
      width: image.width,
      height: image.height,
      isPrimary: image.isPrimary,
    })),
    moderationActions: (row.moderationActions ?? []).map((action) => ({
      id: action.id,
      action: action.action,
      adminUserId: action.adminUserId,
      adminDisplayName: action.adminUser?.displayName ?? null,
      reason: action.reason,
      note: action.note,
      createdAt: action.createdAt,
    })),
  };
}

// -----------------------------------------------------------------------------
// Report moderation
// -----------------------------------------------------------------------------

export interface AdminReportUserRef {
  id: string;
  displayName: string;
  status: UserStatus;
}

export interface AdminReportView {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  listing: AdminListingRefView | null;
  reporter: AdminReportUserRef;
  reportedUser: AdminReportUserRef | null;
  resolvedBy: { id: string; displayName: string } | null;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminReportRowInput {
  id: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  listing: { id: string; slug: string; title: string; status: ListingStatus } | null;
  reporter: { id: string; displayName: string; status: UserStatus };
  reportedUser: { id: string; displayName: string; status: UserStatus } | null;
  resolvedBy: { id: string; displayName: string } | null;
}

export function toAdminReportView(row: AdminReportRowInput): AdminReportView {
  return {
    id: row.id,
    reason: row.reason,
    description: row.description,
    status: row.status,
    listing:
      row.listing === null
        ? null
        : {
            id: row.listing.id,
            slug: row.listing.slug,
            title: row.listing.title,
            status: row.listing.status,
          },
    reporter: row.reporter,
    reportedUser: row.reportedUser,
    resolvedBy: row.resolvedBy,
    resolvedAt: row.resolvedAt,
    resolutionNote: row.resolutionNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Re-exported for queue filters that surface audit actions in the UI.
export type { AuditAction };
