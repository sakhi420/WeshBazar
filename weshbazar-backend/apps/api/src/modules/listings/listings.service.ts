/**
 * Listing lifecycle core (spec §38–§47, §70, §81, §107, §157).
 *
 * This service is the only writer of `Listing.status`: every state change is
 * an explicit command (submit / approve / reject / mark-sold / archive /
 * renew) whose target status comes from `resolveListingTransition`
 * (listing-state.ts). No request payload is ever assigned to `status`
 * directly — the Phase 7 acceptance criterion.
 *
 * Phase 14 adds the two system-initiated commands used by the jobs module
 * (`expireOverdueListings`, `archiveStaleDraftListings`, §69/§70/§164). They
 * share the same conditional-update + revision mechanics as human commands,
 * but the actor is the system: the revision changeType is SYSTEM,
 * `createdByUserId` stays null, and no ModerationAction/AuditLog rows are
 * written — both tables require a human admin actor.
 *
 * Concurrency model (§43, §81): every mutation is a conditional update
 * guarded by the row `version`; a lost race surfaces as
 * `LISTING_VERSION_CONFLICT` instead of silently overwriting. Each
 * successful mutation appends a `ListingRevision` at the new version
 * (append-only, gap-free because of @@unique([listingId, version])).
 *
 * Slug allocation follows the seller-account pattern: a plain-connection
 * retry loop (never inside a transaction — PostgreSQL aborts a transaction
 * after a failed statement, which would taint subsequent retries).
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception';
import { isUniqueViolation } from '../../common/errors/prisma-errors';
import {
  clampLimit,
  cursorPage,
  decodeCursor,
  encodeCursor,
  type CursorPaginated,
} from '../../common/http/pagination';
import {
  toListingRevisionView,
  toOwnerListing,
  toOwnerListingSummary,
  type ListingRevisionView,
  type MediaUrlResolver,
  type OwnerListing,
  type OwnerListingSummary,
} from '../../common/presenters/listing.presenter';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import type { Locale } from '../../common/utils/locale.utils';
import { slugSuffix, slugify } from '../../common/utils/slug.utils';
import { isUuid } from '../../common/utils/uuid.utils';
import type { AppConfig } from '../../config/config.types';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, type Listing } from '../../generated/prisma/client';
import type { AttributeType, ListingRevisionChangeType } from '../../generated/prisma/enums';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { AuditService } from '../audit/audit.service';
import { LocationsService } from '../locations/locations.service';
import { SellerAccountsService } from '../sellers/seller-accounts.service';
import { LISTING_ROW_INCLUDE } from './listing-row-include';
import type { NormalizedAttributes } from '../taxonomy/attribute.types';
import { TaxonomyService } from '../taxonomy/taxonomy.service';
import {
  DEFAULT_CONTACT_METHODS,
  normalizeContactMethods,
  orderContactMethods,
  type ContactMethodInput,
  type ContactMethodValue,
} from './contact-methods';
import {
  CreateListingDto,
  ListingCommandDto,
  OwnerListingsQueryDto,
  RevisionsQueryDto,
  UpdateListingDto,
} from './dto/listing.dto';
import {
  IMAGE_MUTABLE_STATUSES,
  MATERIAL_CHANGE_FIELDS,
  resolveListingTransition,
} from './listing-state';
import { normalizeSearchText } from './search-text';

/** Mirrors the schema default; AFN is the only launch currency (§38). */
const DEFAULT_CURRENCY = 'AFN';

/** Attempts before giving up on a unique slug (~2^-24 collision per try). */
const MAX_SLUG_ATTEMPTS = 5;

/** Moderation note cap (shared by approve/reject/archive/restore, §58). */
const MODERATION_NOTE_MAX = 500;

/**
 * Context every moderation command accepts (spec §58, §62): the optional
 * human note that lands on the `ModerationAction` row plus the request
 * provenance stored with the audit record.
 */
export interface ModerationContext {
  note?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Result of one bounded system-job pass (spec §69, §164): how many candidate
 * rows the pass read and how many actually transitioned. The jobs module
 * logs these counts; a re-run is safe because both numbers shrink to zero
 * once the backlog is drained.
 */
export interface SystemJobOutcome {
  scanned: number;
  updated: number;
}

/** HTML tag detection — plain text only (§46); `<3` or `a < b` pass. */
const HTML_TAG = /<\s*\/?\s*[a-zA-Z][^>]*>/;

/** Control characters that corrupt storage and rendering. */
// eslint-disable-next-line no-control-regex -- matching control characters is the point.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Shared row shape — defined in `listing-row-include.ts` (cycle-free import). */
export { LISTING_ROW_INCLUDE };

type ListingRow = Prisma.ListingGetPayload<{ include: typeof LISTING_ROW_INCLUDE }>;

/**
 * Type alias (not interface) so the shape satisfies Prisma's JSON index
 * signatures without casts — interfaces lack implicit index signatures.
 */
export type ListingAttributeReference = {
  key: string;
  type: AttributeType;
  required: boolean;
};

interface ListingContent {
  title: string;
  description: string;
  pricingType: Listing['pricingType'];
  price: number | null;
  currency: string;
}

interface FieldIssue {
  field: string;
  messages: string[];
}

interface CreateListingRowInput extends ListingContent {
  sellerAccountId: string;
  categoryId: string;
  provinceId: string;
  cityId: string;
  negotiable: boolean;
  condition: Listing['condition'];
  attributes: NormalizedAttributes;
  attributeSchemaReference: ListingAttributeReference[];
  contactMethods: ContactMethodValue[];
  createdByUserId: string;
}

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);
  private readonly limits: AppConfig['listing'];
  private readonly rateLimit: AppConfig['rateLimit'];

  /**
   * Owner presenters receive image URLs through this resolver so listing
   * presentation never hard-codes a storage scheme (§64).
   */
  private readonly mediaUrl: MediaUrlResolver = (storageKey) =>
    this.storage.getPublicUrl(storageKey);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxonomy: TaxonomyService,
    private readonly locations: LocationsService,
    private readonly sellerAccounts: SellerAccountsService,
    private readonly rateLimitService: RateLimitService,
    private readonly audit: AuditService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.limits = configService.get('listing', { infer: true });
    this.rateLimit = configService.get('rateLimit', { infer: true });
  }

  // --- Seller commands -----------------------------------------------------------

  /**
   * Create a DRAFT (§45). Draft creation requires an active seller account;
   * the verified-phone gate applies at submission (publishing) time only.
   */
  async createDraft(userId: string, dto: CreateListingDto, locale: Locale): Promise<OwnerListing> {
    this.rateLimitService.enforce(
      'listing:create:user',
      userId,
      this.rateLimit.listingCreatePerWindow,
    );

    const seller = await this.sellerAccounts.ensureForOwner(userId);
    if (seller.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }

    await this.taxonomy.assertCategoryUsableForListing(dto.categoryId);
    const { normalized, reference } = await this.resolveListingAttributes(
      dto.categoryId,
      dto.attributes ?? {},
    );
    await this.locations.assertLocationUsable(dto.provinceId, dto.cityId);

    const content = this.validateContent({
      title: dto.title,
      description: dto.description,
      pricingType: dto.pricingType ?? 'PAID',
      price: dto.price ?? null,
      currency: dto.currency ?? DEFAULT_CURRENCY,
    });

    // §53: omitted configuration defaults to PHONE + WHATSAPP enabled (both
    // reveal the seller's verified phone); provided entries are validated and
    // normalized by the contact-method engine.
    const contactMethods = this.prepareContactReplacement(
      dto.contactMethods ?? DEFAULT_CONTACT_METHODS,
    );

    const row = await this.createWithUniqueSlug({
      ...content,
      condition: dto.condition,
      negotiable: dto.negotiable ?? true,
      sellerAccountId: seller.id,
      categoryId: dto.categoryId,
      provinceId: dto.provinceId,
      cityId: dto.cityId,
      attributes: normalized,
      attributeSchemaReference: reference,
      contactMethods,
      createdByUserId: userId,
    });
    return toOwnerListing(row, locale, this.mediaUrl);
  }

  /**
   * Edit a listing. Material edits of an ACTIVE listing in a
   * REVIEW_REQUIRED category route back through PENDING_REVIEW (§42); the
   * merged state (patch over stored values) is always revalidated so a
   * listing can never be saved in a state that violates current rules.
   */
  async updateForOwner(
    userId: string,
    listingId: string,
    dto: UpdateListingDto,
    locale: Locale,
  ): Promise<OwnerListing> {
    const row = await this.loadOwnedRow(userId, listingId);
    this.assertVersion(row.version, dto.expectedVersion);

    const categoryId = dto.categoryId ?? row.categoryId;
    const provinceId = dto.provinceId ?? row.provinceId;
    const cityId = dto.cityId ?? row.cityId;

    const moderationMode =
      categoryId === row.categoryId
        ? row.category.moderationMode
        : await this.loadModerationMode(categoryId);

    const materialChanges = MATERIAL_CHANGE_FIELDS.some((field) => dto[field] !== undefined);
    const targetStatus = resolveListingTransition({
      action: 'EDIT',
      status: row.status,
      moderationMode,
      materialChanges,
    });
    if (targetStatus === null) {
      throw new AppException('LISTING_EDIT_NOT_ALLOWED');
    }

    if (categoryId !== row.categoryId) {
      await this.taxonomy.assertCategoryUsableForListing(categoryId);
    }
    if (provinceId !== row.provinceId || cityId !== row.cityId) {
      await this.locations.assertLocationUsable(provinceId, cityId);
    }

    const content = this.validateContent({
      title: dto.title ?? row.title,
      description: dto.description ?? row.description,
      pricingType: dto.pricingType ?? row.pricingType,
      price: dto.price !== undefined ? dto.price : row.price === null ? null : Number(row.price),
      currency: dto.currency ?? row.currency,
    });

    const attributesChanged = dto.attributes !== undefined || categoryId !== row.categoryId;
    let attributes = row.attributes as NormalizedAttributes;
    let reference: ListingAttributeReference[] | undefined;
    if (attributesChanged) {
      const resolved = await this.resolveListingAttributes(
        categoryId,
        dto.attributes ?? (row.attributes as Record<string, unknown>),
      );
      attributes = resolved.normalized;
      reference = resolved.reference;
    }

    // Contact configuration is a material change (§42): the payload replaces
    // the stored set and the replacement commits with the version bump.
    const contactReplacement =
      dto.contactMethods === undefined ? null : this.prepareContactReplacement(dto.contactMethods);

    const nextVersion = row.version + 1;
    const previousStatus = row.status;
    const nextAttributes = attributesChanged ? (attributes as Prisma.InputJsonValue) : undefined;

    const data: Prisma.ListingUpdateManyMutationInput = {
      status: targetStatus,
      searchText: normalizeSearchText(`${content.title}\n${content.description}`),
      ...(dto.title !== undefined ? { title: content.title } : {}),
      ...(dto.description !== undefined ? { description: content.description } : {}),
      ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
      ...(dto.pricingType !== undefined ? { pricingType: content.pricingType } : {}),
      ...(dto.price !== undefined ? { price: content.price } : {}),
      ...(dto.currency !== undefined ? { currency: content.currency } : {}),
      ...(dto.negotiable !== undefined ? { negotiable: dto.negotiable } : {}),
      ...(categoryId !== row.categoryId ? { categoryId } : {}),
      ...(provinceId !== row.provinceId ? { provinceId } : {}),
      ...(cityId !== row.cityId ? { cityId } : {}),
      ...(nextAttributes !== undefined ? { attributes: nextAttributes } : {}),
      // A rejected listing that is edited returns to DRAFT; the stale
      // rejection note no longer describes the current content.
      ...(previousStatus === 'REJECTED' ? { rejectedReason: null, rejectedNote: null } : {}),
    };

    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data,
      changeType: 'UPDATE',
      snapshot: this.buildSnapshot({
        ...row,
        ...content,
        status: targetStatus,
        version: nextVersion,
        categoryId,
        provinceId,
        cityId,
        attributes,
        contactMethods: contactReplacement ?? row.contactMethods,
        ...(previousStatus === 'REJECTED' ? { rejectedReason: null } : {}),
      }),
      attributeSchemaReference: reference,
      ...(contactReplacement !== null
        ? {
            syncContactMethods: (tx: Prisma.TransactionClient) =>
              this.syncContactMethods(tx, row.id, contactReplacement),
          }
        : {}),
      createdByUserId: userId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  /**
   * Submit a DRAFT/REJECTED listing for review (or straight to ACTIVE under
   * AUTO_APPROVE). Everything is revalidated at submit time because a draft
   * may have been edited long ago (§45).
   */
  async submitForReview(
    userId: string,
    listingId: string,
    dto: ListingCommandDto,
    locale: Locale,
  ): Promise<OwnerListing> {
    const row = await this.loadOwnedRow(userId, listingId);
    this.assertVersion(row.version, dto.expectedVersion);

    // Fresh eligibility check — the access token may carry a stale claim for
    // up to its TTL, and publishing is the sensitive transition (§45).
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, deletedAt: true, phoneVerifiedAt: true },
    });
    if (!user || user.deletedAt !== null) {
      throw new AppException('UNAUTHORIZED');
    }
    if (user.status !== 'ACTIVE' || row.sellerAccount.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }
    if (user.phoneVerifiedAt === null) {
      throw new AppException('PHONE_NOT_VERIFIED');
    }

    const targetStatus = resolveListingTransition({
      action: 'SUBMIT',
      status: row.status,
      moderationMode: row.category.moderationMode,
    });
    if (targetStatus === null) {
      throw new AppException('LISTING_INVALID_TRANSITION');
    }

    await this.taxonomy.assertCategoryUsableForListing(row.categoryId);
    await this.locations.assertLocationUsable(row.provinceId, row.cityId);
    this.validateContent({
      title: row.title,
      description: row.description,
      pricingType: row.pricingType,
      price: row.price === null ? null : Number(row.price),
      currency: row.currency,
    });
    const { normalized, reference } = await this.resolveListingAttributes(
      row.categoryId,
      row.attributes as Record<string, unknown>,
    );

    await this.assertPublishAllowance(row.sellerAccountId, targetStatus);

    const now = new Date();
    const nextVersion = row.version + 1;
    const publishedAt = targetStatus === 'ACTIVE' ? now : row.publishedAt;
    const expiresAt =
      targetStatus === 'ACTIVE' ? this.addDays(now, this.limits.expiresAfterDays) : row.expiresAt;

    // Under AUTO_APPROVE the submission itself publishes the listing; a
    // single SUBMIT revision (snapshot shows ACTIVE) documents that, since
    // @@unique([listingId, version]) forbids a separate APPROVE revision.
    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: {
        status: targetStatus,
        attributes: normalized,
        rejectedReason: null,
        rejectedNote: null,
        ...(targetStatus === 'ACTIVE' ? { publishedAt: now, expiresAt } : {}),
      },
      changeType: 'SUBMIT',
      snapshot: this.buildSnapshot({
        ...row,
        status: targetStatus,
        version: nextVersion,
        attributes: normalized,
        publishedAt,
        expiresAt,
        rejectedReason: null,
      }),
      attributeSchemaReference: reference,
      createdByUserId: userId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  /** ACTIVE → SOLD. */
  async markSold(
    userId: string,
    listingId: string,
    dto: ListingCommandDto,
    locale: Locale,
  ): Promise<OwnerListing> {
    return this.runOwnedCommand(userId, listingId, dto, locale, {
      action: 'MARK_SOLD',
      changeType: 'MARK_SOLD',
      buildData: (now) => ({ status: 'SOLD', soldAt: now }),
      applySnapshot: (row, version) => ({ ...row, status: 'SOLD', version }),
    });
  }

  /** ACTIVE → ARCHIVED. */
  async archive(
    userId: string,
    listingId: string,
    dto: ListingCommandDto,
    locale: Locale,
  ): Promise<OwnerListing> {
    return this.runOwnedCommand(userId, listingId, dto, locale, {
      action: 'ARCHIVE',
      changeType: 'ARCHIVE',
      buildData: (now) => ({ status: 'ARCHIVED', archivedAt: now }),
      applySnapshot: (row, version) => ({ ...row, status: 'ARCHIVED', version }),
    });
  }

  /**
   * Renewal (§70): ACTIVE listings extend their expiry runway; ARCHIVED
   * listings republish by returning to DRAFT for a fresh review cycle (the
   * only legal way out of ARCHIVED, §40).
   */
  async renew(
    userId: string,
    listingId: string,
    dto: ListingCommandDto,
    locale: Locale,
  ): Promise<OwnerListing> {
    const row = await this.loadOwnedRow(userId, listingId);
    this.assertVersion(row.version, dto.expectedVersion);

    const targetStatus = resolveListingTransition({ action: 'RENEW', status: row.status });
    if (targetStatus === null) {
      throw new AppException('LISTING_INVALID_TRANSITION');
    }

    const now = new Date();
    const nextVersion = row.version + 1;

    if (row.status === 'ACTIVE') {
      // Extend from now (not from the old expiry) — republishing early can
      // never stack runway.
      const expiresAt = this.addDays(now, this.limits.expiresAfterDays);
      const updated = await this.commitTransition({
        listingId: row.id,
        currentVersion: row.version,
        data: { expiresAt },
        changeType: 'RENEW',
        snapshot: this.buildSnapshot({ ...row, version: nextVersion, expiresAt }),
        createdByUserId: userId,
      });
      return toOwnerListing(updated, locale, this.mediaUrl);
    }

    // ARCHIVED → DRAFT republish flow.
    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: { status: 'DRAFT', archivedAt: null, expiresAt: null },
      changeType: 'RESTORE',
      snapshot: this.buildSnapshot({
        ...row,
        status: 'DRAFT',
        version: nextVersion,
        expiresAt: null,
      }),
      createdByUserId: userId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  // --- Owner reads ---------------------------------------------------------------

  async listForOwner(
    userId: string,
    query: OwnerListingsQueryDto,
    locale: Locale,
  ): Promise<CursorPaginated<OwnerListingSummary>> {
    const limit = clampLimit(query.limit, 24, 60);
    const cursor = this.decodeListingCursor(query.cursor);

    // Reads never create a seller account; a user without one has no
    // listings by definition.
    const seller = await this.prisma.sellerAccount.findUnique({
      where: { ownerUserId: userId },
      select: { id: true },
    });
    if (!seller) {
      return cursorPage([], { nextCursor: null, hasMore: false, limit });
    }

    const where: Prisma.ListingWhereInput = {
      sellerAccountId: seller.id,
      deletedAt: null,
      ...(query.status !== undefined ? { status: query.status } : {}),
    };
    if (cursor !== null) {
      where.OR = [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ];
    }

    const rows = await this.prisma.listing.findMany({
      where,
      include: LISTING_ROW_INCLUDE,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = page.at(-1);
    return cursorPage(
      page.map((row) => toOwnerListingSummary(row, locale, this.mediaUrl)),
      {
        nextCursor:
          hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null,
        hasMore,
        limit,
      },
    );
  }

  async getForOwner(userId: string, listingId: string, locale: Locale): Promise<OwnerListing> {
    return toOwnerListing(await this.loadOwnedRow(userId, listingId), locale, this.mediaUrl);
  }

  /** Revision history, newest first (spec §44). */
  async listRevisions(
    userId: string,
    listingId: string,
    query: RevisionsQueryDto,
  ): Promise<CursorPaginated<ListingRevisionView>> {
    await this.loadOwnedRow(userId, listingId);
    const limit = clampLimit(query.limit, 50, 100);
    const cursorVersion = this.decodeRevisionCursor(query.cursor);

    const rows = await this.prisma.listingRevision.findMany({
      where: {
        listingId,
        ...(cursorVersion !== null ? { version: { lt: cursorVersion } } : {}),
      },
      orderBy: { version: 'desc' },
      take: limit + 1,
    });
    const page = rows.slice(0, limit);
    const hasMore = rows.length > limit;
    const last = page.at(-1);
    return cursorPage(page.map(toListingRevisionView), {
      nextCursor: hasMore && last ? encodeCursor({ version: last.version }) : null,
      hasMore,
      limit,
    });
  }

  // --- Image-change registration (spec §42, §63, §107) ----------------------------

  /**
   * Media pre-flight: ownership plus gallery mutability. The owner may change
   * images in every editable state and additionally in PENDING_REVIEW — see
   * `IMAGE_MUTABLE_STATUSES` for why.
   */
  async assertImageMutableForOwner(userId: string, listingId: string): Promise<void> {
    const row = await this.loadOwnedRow(userId, listingId);
    if (!IMAGE_MUTABLE_STATUSES.includes(row.status)) {
      throw new AppException('LISTING_EDIT_NOT_ALLOWED');
    }
  }

  /**
   * Records that the gallery changed and applies the §42 material-change
   * policy (images are a material change): an ACTIVE listing re-enters
   * PENDING_REVIEW where the category requires review and stays ACTIVE under
   * AUTO_APPROVE; a REJECTED listing returns to DRAFT (the rejection no
   * longer describes the content); PENDING_REVIEW stays pending so the rest
   * of a multi-image batch keeps flowing. One retry absorbs a concurrent
   * writer (e.g. a parallel upload).
   */
  async registerImageChange(userId: string, listingId: string): Promise<void> {
    try {
      await this.commitImageChange(userId, listingId);
    } catch (error) {
      if (!(AppException.isAppException(error) && error.code === 'LISTING_VERSION_CONFLICT')) {
        throw error;
      }
      await this.commitImageChange(userId, listingId);
    }
  }

  private async commitImageChange(userId: string, listingId: string): Promise<void> {
    const row = await this.loadOwnedRow(userId, listingId);
    if (!IMAGE_MUTABLE_STATUSES.includes(row.status)) {
      throw new AppException('LISTING_EDIT_NOT_ALLOWED');
    }

    const targetStatus =
      row.status === 'PENDING_REVIEW'
        ? 'PENDING_REVIEW'
        : resolveListingTransition({
            action: 'EDIT',
            status: row.status,
            moderationMode: row.category.moderationMode,
            materialChanges: true,
          });
    if (targetStatus === null) {
      throw new AppException('LISTING_EDIT_NOT_ALLOWED');
    }

    const nextVersion = row.version + 1;
    await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: {
        status: targetStatus,
        ...(row.status === 'REJECTED' ? { rejectedReason: null, rejectedNote: null } : {}),
      },
      changeType: 'UPDATE',
      snapshot: this.buildSnapshot({
        ...row,
        status: targetStatus,
        version: nextVersion,
        ...(row.status === 'REJECTED' ? { rejectedReason: null } : {}),
      }),
      createdByUserId: userId,
    });
  }

  // --- Moderation commands (HTTP surface in the admin module, Phase 11) ----------

  /** PENDING_REVIEW → ACTIVE. Admin-side: no ownership check. */
  async approve(
    actorUserId: string,
    listingId: string,
    locale: Locale,
    context: ModerationContext = {},
  ): Promise<OwnerListing> {
    const note = this.validateModerationNote(context.note);

    const row = await this.findRow(listingId);
    const targetStatus = resolveListingTransition({ action: 'APPROVE', status: row.status });
    if (targetStatus === null) {
      throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
    }

    // Marketplace invariant: approval must not push a seller past the
    // active-listing cap either.
    await this.assertPublishAllowance(row.sellerAccountId, 'ACTIVE');

    const now = new Date();
    const nextVersion = row.version + 1;
    const expiresAt = this.addDays(now, this.limits.expiresAfterDays);
    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: {
        status: 'ACTIVE',
        publishedAt: now,
        expiresAt,
        rejectedReason: null,
        rejectedNote: null,
      },
      changeType: 'APPROVE',
      snapshot: this.buildSnapshot({
        ...row,
        status: 'ACTIVE',
        version: nextVersion,
        publishedAt: now,
        expiresAt,
        rejectedReason: null,
      }),
      moderationWrites: (tx) =>
        this.writeModerationRecord(tx, {
          action: 'APPROVE',
          audit: { action: 'LISTING_APPROVED', metadata: { from: row.status, to: 'ACTIVE' } },
          listingId: row.id,
          actorUserId,
          note,
          context,
        }),
      createdByUserId: actorUserId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  /** PENDING_REVIEW → REJECTED with a machine-readable reason (§44 trace). */
  async reject(
    actorUserId: string,
    listingId: string,
    input: { reason: string; note?: string | null },
    locale: Locale,
    context: ModerationContext = {},
  ): Promise<OwnerListing> {
    const reason = input.reason.trim();
    if (reason.length === 0 || reason.length > 64) {
      throw new AppException('VALIDATION_ERROR', {
        details: { errors: [{ field: 'reason', messages: ['Reason must be 1–64 characters.'] }] },
      });
    }
    const note = this.validateModerationNote(input.note);

    const row = await this.findRow(listingId);
    const targetStatus = resolveListingTransition({ action: 'REJECT', status: row.status });
    if (targetStatus === null) {
      throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
    }

    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: { status: 'REJECTED', rejectedReason: reason, rejectedNote: note },
      changeType: 'REJECT',
      snapshot: this.buildSnapshot({
        ...row,
        status: 'REJECTED',
        version: row.version + 1,
        rejectedReason: reason,
      }),
      moderationWrites: (tx) =>
        this.writeModerationRecord(tx, {
          action: 'REJECT',
          audit: {
            action: 'LISTING_REJECTED',
            metadata: { from: row.status, to: 'REJECTED', reason },
          },
          listingId: row.id,
          actorUserId,
          reason,
          note,
          context,
        }),
      createdByUserId: actorUserId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  /**
   * ACTIVE → ARCHIVED as a moderation takedown (§58 ADMIN_ARCHIVE, §106).
   * Owner-visible state is the same ARCHIVED status; the ModerationAction and
   * audit rows are what distinguish an admin takedown from an owner archive.
   */
  async archiveByAdmin(
    actorUserId: string,
    listingId: string,
    locale: Locale,
    context: ModerationContext = {},
  ): Promise<OwnerListing> {
    const note = this.validateModerationNote(context.note);

    const row = await this.findRow(listingId);
    const targetStatus = resolveListingTransition({ action: 'ADMIN_ARCHIVE', status: row.status });
    if (targetStatus === null) {
      throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
    }

    const now = new Date();
    const nextVersion = row.version + 1;
    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: { status: 'ARCHIVED', archivedAt: now },
      changeType: 'ARCHIVE',
      snapshot: this.buildSnapshot({ ...row, status: 'ARCHIVED', version: nextVersion }),
      moderationWrites: (tx) =>
        this.writeModerationRecord(tx, {
          action: 'ARCHIVE',
          audit: {
            action: 'LISTING_ARCHIVED_BY_ADMIN',
            metadata: { from: row.status, to: 'ARCHIVED' },
          },
          listingId: row.id,
          actorUserId,
          note,
          context,
        }),
      createdByUserId: actorUserId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  /**
   * ARCHIVED → ACTIVE: reverses a takedown/archive and republishes with a
   * fresh runway (§58 ADMIN_RESTORE). The publish cap is re-checked exactly
   * like approval so a restore can never overshoot the seller's allowance.
   */
  async restoreByAdmin(
    actorUserId: string,
    listingId: string,
    locale: Locale,
    context: ModerationContext = {},
  ): Promise<OwnerListing> {
    const note = this.validateModerationNote(context.note);

    const row = await this.findRow(listingId);
    const targetStatus = resolveListingTransition({ action: 'ADMIN_RESTORE', status: row.status });
    if (targetStatus === null) {
      throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
    }

    await this.assertPublishAllowance(row.sellerAccountId, 'ACTIVE');

    const now = new Date();
    const nextVersion = row.version + 1;
    const expiresAt = this.addDays(now, this.limits.expiresAfterDays);
    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: { status: 'ACTIVE', archivedAt: null, expiresAt },
      changeType: 'RESTORE',
      snapshot: this.buildSnapshot({ ...row, status: 'ACTIVE', version: nextVersion, expiresAt }),
      moderationWrites: (tx) =>
        this.writeModerationRecord(tx, {
          action: 'RESTORE',
          audit: {
            action: 'LISTING_RESTORED_BY_ADMIN',
            metadata: { from: row.status, to: 'ACTIVE' },
          },
          listingId: row.id,
          actorUserId,
          note,
          context,
        }),
      createdByUserId: actorUserId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  /** Admin single-listing read: any state, no ownership check (§106). */
  async getForAdmin(listingId: string, locale: Locale): Promise<OwnerListing> {
    return toOwnerListing(await this.findRow(listingId), locale, this.mediaUrl);
  }

  // --- System commands (scheduled jobs, Phase 14, spec §69, §70, §164) ----------

  /**
   * ACTIVE → ARCHIVED for every listing whose runway has ended (spec §70).
   *
   * System-initiated twin of the owner `archive` command: candidates are
   * selected by the jobs module in bounded batches and each transition goes
   * through the same conditional update + revision append as human commands.
   * The revision is marked SYSTEM with a null actor; no ModerationAction or
   * audit row is written because those tables require an admin actor (§58).
   *
   * Idempotent: a re-run after a successful pass finds no remaining
   * candidates, and a row that raced out of ACTIVE is skipped, not retried.
   */
  async expireOverdueListings(
    batchSize: number,
    now: Date = new Date(),
  ): Promise<SystemJobOutcome> {
    return this.runSystemArchivePass(
      {
        action: 'EXPIRE',
        where: { status: 'ACTIVE', expiresAt: { lte: now } },
        orderBy: { expiresAt: 'asc' },
      },
      batchSize,
      now,
    );
  }

  /**
   * DRAFT → ARCHIVED for drafts nobody touched for
   * `LISTING.staleDraftArchiveAfterDays` (spec §69, §164). The owner can
   * republish from ARCHIVED through the regular renew flow.
   */
  async archiveStaleDraftListings(
    batchSize: number,
    now: Date = new Date(),
  ): Promise<SystemJobOutcome> {
    const cutoff = this.addDays(now, -this.limits.staleDraftArchiveAfterDays);
    return this.runSystemArchivePass(
      {
        action: 'ARCHIVE_STALE_DRAFT',
        where: { status: 'DRAFT', updatedAt: { lt: cutoff } },
        orderBy: { updatedAt: 'asc' },
      },
      batchSize,
      now,
    );
  }

  /**
   * Shared bounded pass: read up to `batchSize` candidates, then archive each
   * row that is still in the expected state. Rows whose state moved on since
   * the batch read (a concurrent owner action, another instance) are skipped
   * silently — the next pass simply finds fewer candidates.
   */
  private async runSystemArchivePass(
    input: {
      action: 'EXPIRE' | 'ARCHIVE_STALE_DRAFT';
      where: Prisma.ListingWhereInput;
      orderBy: Prisma.ListingOrderByWithRelationInput;
    },
    batchSize: number,
    now: Date,
  ): Promise<SystemJobOutcome> {
    const rows = await this.prisma.listing.findMany({
      where: { ...input.where, deletedAt: null },
      include: LISTING_ROW_INCLUDE,
      orderBy: input.orderBy,
      take: batchSize,
    });

    let updated = 0;
    for (const row of rows) {
      if (await this.commitSystemArchive(row, input.action, now)) {
        updated += 1;
      }
    }
    return { scanned: rows.length, updated };
  }

  /**
   * Commits one system archive with the same conditional-update mechanics as
   * `commitTransition` (id + version + deletedAt null; zero rows = the
   * candidate was already handled → skip), plus the current status in the
   * guard so a row that raced out of the expected state is never overwritten.
   * The revision at version+1 records changeType SYSTEM and a null actor.
   */
  private async commitSystemArchive(
    row: ListingRow,
    action: 'EXPIRE' | 'ARCHIVE_STALE_DRAFT',
    now: Date,
  ): Promise<boolean> {
    const targetStatus = resolveListingTransition({ action, status: row.status });
    if (targetStatus === null) {
      // Stale candidate (state moved on since the batch read) — nothing to do.
      return false;
    }

    const nextVersion = row.version + 1;
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.listing.updateMany({
        where: { id: row.id, version: row.version, status: row.status, deletedAt: null },
        data: { status: targetStatus, archivedAt: now, version: { increment: 1 } },
      });
      if (result.count === 0) {
        return false;
      }
      await tx.listingRevision.create({
        data: {
          listingId: row.id,
          version: nextVersion,
          changeType: 'SYSTEM',
          snapshot: this.buildSnapshot({ ...row, status: targetStatus, version: nextVersion }),
          createdByUserId: null,
        },
      });
      return true;
    });
  }

  // --- Private helpers ------------------------------------------------------------

  /** Shared single-command flow: load → version guard → transition → commit. */
  private async runOwnedCommand(
    userId: string,
    listingId: string,
    dto: ListingCommandDto,
    locale: Locale,
    command: {
      action: 'MARK_SOLD' | 'ARCHIVE';
      changeType: ListingRevisionChangeType;
      buildData: (now: Date) => Prisma.ListingUpdateManyMutationInput;
      applySnapshot: (row: ListingRow, version: number) => ListingRow;
    },
  ): Promise<OwnerListing> {
    const row = await this.loadOwnedRow(userId, listingId);
    this.assertVersion(row.version, dto.expectedVersion);

    const targetStatus = resolveListingTransition({ action: command.action, status: row.status });
    if (targetStatus === null) {
      throw new AppException('LISTING_INVALID_TRANSITION');
    }

    const now = new Date();
    const nextVersion = row.version + 1;
    const updated = await this.commitTransition({
      listingId: row.id,
      currentVersion: row.version,
      data: command.buildData(now),
      changeType: command.changeType,
      snapshot: this.buildSnapshot(command.applySnapshot(row, nextVersion)),
      createdByUserId: userId,
    });
    return toOwnerListing(updated, locale, this.mediaUrl);
  }

  private async findRow(listingId: string): Promise<ListingRow> {
    if (!isUuid(listingId)) {
      throw new AppException('LISTING_NOT_FOUND');
    }
    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: LISTING_ROW_INCLUDE,
    });
    if (!row || row.deletedAt !== null) {
      throw new AppException('LISTING_NOT_FOUND');
    }
    return row;
  }

  private async loadOwnedRow(userId: string, listingId: string): Promise<ListingRow> {
    const row = await this.findRow(listingId);
    if (row.sellerAccount.ownerUserId !== userId) {
      throw new AppException('LISTING_NOT_OWNED');
    }
    return row;
  }

  private async loadModerationMode(
    categoryId: string,
  ): Promise<ListingRow['category']['moderationMode']> {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { moderationMode: true },
    });
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    return category.moderationMode;
  }

  private assertVersion(currentVersion: number, expectedVersion: number | undefined): void {
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      throw new AppException('LISTING_VERSION_CONFLICT');
    }
  }

  /** Trims and length-checks a moderation note; null when absent/empty. */
  private validateModerationNote(note: string | null | undefined): string | null {
    const trimmed = note?.trim() ?? null;
    if (trimmed !== null && trimmed.length === 0) {
      return null;
    }
    if (trimmed !== null && trimmed.length > MODERATION_NOTE_MAX) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [
            {
              field: 'note',
              messages: [`Note must be at most ${MODERATION_NOTE_MAX} characters.`],
            },
          ],
        },
      });
    }
    return trimmed;
  }

  /**
   * Writes the §58 moderation trail inside the transition transaction: the
   * `ModerationAction` row (queue/history) and the append-only `AuditLog`
   * entry (§62). Both commit exactly when the state change commits.
   */
  private async writeModerationRecord(
    tx: Prisma.TransactionClient,
    input: {
      listingId: string;
      actorUserId: string;
      action: 'APPROVE' | 'REJECT' | 'ARCHIVE' | 'RESTORE';
      reason?: string | null;
      note: string | null;
      context: ModerationContext;
      audit: {
        action:
          | 'LISTING_APPROVED'
          | 'LISTING_REJECTED'
          | 'LISTING_ARCHIVED_BY_ADMIN'
          | 'LISTING_RESTORED_BY_ADMIN';
        metadata: Prisma.InputJsonObject;
      };
    },
  ): Promise<void> {
    await tx.moderationAction.create({
      data: {
        listingId: input.listingId,
        adminUserId: input.actorUserId,
        action: input.action,
        reason: input.reason ?? null,
        note: input.note,
      },
    });
    await this.audit.record(
      {
        actorUserId: input.actorUserId,
        action: input.audit.action,
        entityType: 'Listing',
        entityId: input.listingId,
        metadata: {
          ...input.audit.metadata,
          ...(input.note !== null ? { note: input.note } : {}),
        },
        ipAddress: input.context.ipAddress ?? null,
        userAgent: input.context.userAgent ?? null,
      },
      tx,
    );
  }

  private async assertPublishAllowance(
    sellerAccountId: string,
    targetStatus: Listing['status'],
  ): Promise<void> {
    if (targetStatus === 'ACTIVE') {
      const active = await this.prisma.listing.count({
        where: { sellerAccountId, status: 'ACTIVE', deletedAt: null },
      });
      if (active >= this.limits.maxActivePerUser) {
        throw new AppException('LISTING_LIMIT_REACHED', {
          details: { scope: 'ACTIVE', limit: this.limits.maxActivePerUser },
        });
      }
    }
    if (targetStatus === 'PENDING_REVIEW') {
      const pending = await this.prisma.listing.count({
        where: { sellerAccountId, status: 'PENDING_REVIEW', deletedAt: null },
      });
      if (pending >= this.limits.maxPendingPerUser) {
        throw new AppException('LISTING_LIMIT_REACHED', {
          details: { scope: 'PENDING_REVIEW', limit: this.limits.maxPendingPerUser },
        });
      }
    }
  }

  /**
   * Validate the merged content against configurable quality rules (§46):
   * lengths, plain text, and pricing semantics (PAID > 0, FREE null,
   * CONTACT anything).
   */
  private validateContent(input: ListingContent): ListingContent {
    const issues: FieldIssue[] = [];
    const title = input.title.trim();
    const description = input.description.trim();

    if (title.length < this.limits.minTitleLength || title.length > this.limits.maxTitleLength) {
      issues.push({
        field: 'title',
        messages: [
          `Title must be between ${this.limits.minTitleLength} and ${this.limits.maxTitleLength} characters.`,
        ],
      });
    }
    if (
      description.length < this.limits.minDescriptionLength ||
      description.length > this.limits.maxDescriptionLength
    ) {
      issues.push({
        field: 'description',
        messages: [
          `Description must be between ${this.limits.minDescriptionLength} and ${this.limits.maxDescriptionLength} characters.`,
        ],
      });
    }
    if (HTML_TAG.test(title)) {
      issues.push({ field: 'title', messages: ['Plain text only — HTML markup is not allowed.'] });
    }
    if (HTML_TAG.test(description)) {
      issues.push({
        field: 'description',
        messages: ['Plain text only — HTML markup is not allowed.'],
      });
    }
    if (CONTROL_CHARS.test(title) || CONTROL_CHARS.test(description)) {
      issues.push({
        field: 'description',
        messages: ['Text contains unsupported control characters.'],
      });
    }

    const { price, pricingType } = input;
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      issues.push({ field: 'price', messages: ['Price must be a non-negative amount.'] });
    }
    if (pricingType === 'PAID' && (price === null || price === 0)) {
      issues.push({
        field: 'price',
        messages: ['Price is required and must be greater than zero for PAID listings.'],
      });
    }
    if (pricingType === 'FREE' && price !== null) {
      issues.push({ field: 'price', messages: ['FREE listings must not include a price.'] });
    }

    if (issues.length > 0) {
      throw new AppException('VALIDATION_ERROR', { details: { errors: issues } });
    }
    return { ...input, title, description };
  }

  private async resolveListingAttributes(
    categoryId: string,
    payload: Record<string, unknown>,
  ): Promise<{ normalized: NormalizedAttributes; reference: ListingAttributeReference[] }> {
    if (Object.keys(payload).length > this.limits.maxAttributes) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [
            {
              field: 'attributes',
              messages: [`Provide at most ${this.limits.maxAttributes} attributes.`],
            },
          ],
        },
      });
    }
    const normalized = await this.taxonomy.validateForCategory(categoryId, payload);
    const effective = await this.taxonomy.resolveEffectiveAttributes(categoryId);
    const reference = effective.map((attribute) => ({
      key: attribute.key,
      type: attribute.type,
      required: attribute.required,
    }));
    return { normalized, reference };
  }

  /**
   * Validates a seller-supplied contact configuration (§53). Reports every
   * issue at once (like the attribute engine) and returns the normalized
   * replacement set; an empty set is allowed — the seller simply exposes no
   * contact method on that listing.
   */
  private prepareContactReplacement(inputs: readonly ContactMethodInput[]): ContactMethodValue[] {
    const { methods, issues } = normalizeContactMethods(inputs);
    if (issues.length > 0) {
      throw new AppException('VALIDATION_ERROR', { details: { errors: issues } });
    }
    return methods;
  }

  /**
   * Applies a replacement set to `ListingContactMethod` inside the ongoing
   * transition transaction: stale types are removed, the rest upserted. Runs
   * after the version guard so the configuration, the row flip and the
   * revision snapshot commit atomically (§42).
   */
  private async syncContactMethods(
    tx: Prisma.TransactionClient,
    listingId: string,
    methods: readonly ContactMethodValue[],
  ): Promise<void> {
    const keep = methods.map((method) => method.type);
    await tx.listingContactMethod.deleteMany({
      where: { listingId, ...(keep.length > 0 ? { type: { notIn: [...keep] } } : {}) },
    });
    for (const method of methods) {
      await tx.listingContactMethod.upsert({
        where: { listingId_type: { listingId, type: method.type } },
        create: {
          listingId,
          type: method.type,
          enabled: method.enabled,
          valueOverride: method.valueOverride,
        },
        update: { enabled: method.enabled, valueOverride: method.valueOverride },
      });
    }
  }

  /**
   * Conditional update + revision append in one transaction (§43). The
   * version guard makes the write atomic against concurrent mutations; the
   * revision insert is protected by @@unique([listingId, version]).
   */
  private async commitTransition(input: {
    listingId: string;
    currentVersion: number;
    data: Prisma.ListingUpdateManyMutationInput;
    changeType: ListingRevisionChangeType;
    snapshot: Prisma.InputJsonObject;
    attributeSchemaReference?: ListingAttributeReference[];
    /** Related-row writes that must commit atomically with the version bump. */
    syncContactMethods?: (tx: Prisma.TransactionClient) => Promise<void>;
    /** Moderation trail (ModerationAction + audit) written with the same bump. */
    moderationWrites?: (tx: Prisma.TransactionClient) => Promise<void>;
    createdByUserId: string;
  }): Promise<ListingRow> {
    return this.prisma.$transaction(async (tx) => {
      const result = await tx.listing.updateMany({
        where: { id: input.listingId, version: input.currentVersion, deletedAt: null },
        data: { ...input.data, version: { increment: 1 } },
      });
      if (result.count === 0) {
        // Lost a race between load and write (or the row was soft-deleted).
        throw new AppException('LISTING_VERSION_CONFLICT');
      }
      await input.syncContactMethods?.(tx);
      await input.moderationWrites?.(tx);
      await tx.listingRevision.create({
        data: {
          listingId: input.listingId,
          version: input.currentVersion + 1,
          changeType: input.changeType,
          snapshot: input.snapshot,
          ...(input.attributeSchemaReference !== undefined
            ? { attributeSchemaReference: input.attributeSchemaReference }
            : {}),
          createdByUserId: input.createdByUserId,
        },
      });
      return tx.listing.findUniqueOrThrow({
        where: { id: input.listingId },
        include: LISTING_ROW_INCLUDE,
      });
    });
  }

  /**
   * Slug allocation (spec §12): `<slugified-title>-<random>`, always with
   * the random suffix (e.g. `iphone-13-pro-max-a83kd2`); Persian titles that
   * cannot transliterate fall back to `listing-<random>`. Runs on a plain
   * connection — retries are impossible inside a transaction.
   */
  private async createWithUniqueSlug(input: CreateListingRowInput): Promise<ListingRow> {
    const base = slugify(input.title) || 'listing';
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = `${base}-${slugSuffix()}`;
      try {
        return await this.prisma.listing.create({
          data: {
            sellerAccountId: input.sellerAccountId,
            categoryId: input.categoryId,
            provinceId: input.provinceId,
            cityId: input.cityId,
            slug,
            title: input.title,
            description: input.description,
            price: input.price,
            currency: input.currency,
            pricingType: input.pricingType,
            negotiable: input.negotiable,
            condition: input.condition,
            status: 'DRAFT',
            attributes: input.attributes,
            searchText: normalizeSearchText(`${input.title}\n${input.description}`),
            contactMethods: { create: input.contactMethods },
            revisions: {
              create: {
                version: 1,
                changeType: 'CREATE',
                snapshot: this.buildSnapshot({
                  status: 'DRAFT',
                  version: 1,
                  title: input.title,
                  description: input.description,
                  price: input.price,
                  currency: input.currency,
                  pricingType: input.pricingType,
                  negotiable: input.negotiable,
                  condition: input.condition,
                  categoryId: input.categoryId,
                  provinceId: input.provinceId,
                  cityId: input.cityId,
                  attributes: input.attributes,
                  contactMethods: input.contactMethods,
                  publishedAt: null,
                  expiresAt: null,
                  rejectedReason: null,
                }),
                attributeSchemaReference: input.attributeSchemaReference,
                createdByUserId: input.createdByUserId,
              },
            },
          },
          include: LISTING_ROW_INCLUDE,
        });
      } catch (error) {
        // Lost a slug race between generation and insert — next candidate.
        if (isUniqueViolation(error, 'Listing_slug')) {
          continue;
        }
        throw error;
      }
    }
    this.logger.error(`Could not allocate a unique listing slug for title "${input.title}".`);
    throw new AppException('INTERNAL_ERROR');
  }

  private buildSnapshot(row: {
    status: Listing['status'];
    version: number;
    title: string;
    description: string;
    price: unknown;
    currency: string;
    pricingType: Listing['pricingType'];
    negotiable: boolean;
    condition: Listing['condition'];
    categoryId: string;
    provinceId: string;
    cityId: string;
    attributes: unknown;
    contactMethods?: ReadonlyArray<ContactMethodValue>;
    publishedAt: Date | null;
    expiresAt: Date | null;
    rejectedReason: string | null;
  }): Prisma.InputJsonObject {
    return {
      status: row.status,
      version: row.version,
      title: row.title,
      description: row.description,
      // Money as string: JSON numbers cannot round-trip Decimal safely.
      price: row.price === null || row.price === undefined ? null : String(Number(row.price)),
      currency: row.currency,
      pricingType: row.pricingType,
      negotiable: row.negotiable,
      condition: row.condition,
      categoryId: row.categoryId,
      provinceId: row.provinceId,
      cityId: row.cityId,
      attributes: row.attributes ?? {},
      contactMethods: orderContactMethods(row.contactMethods ?? []).map(
        ({ type, enabled, valueOverride }) => ({ type, enabled, valueOverride }),
      ),
      publishedAt: row.publishedAt === null ? null : row.publishedAt.toISOString(),
      expiresAt: row.expiresAt === null ? null : row.expiresAt.toISOString(),
      rejectedReason: row.rejectedReason,
    };
  }

  private decodeListingCursor(cursor: string | undefined): { createdAt: Date; id: string } | null {
    if (cursor === undefined) {
      return null;
    }
    const parsed = decodeCursor(cursor);
    const createdAtValue = parsed?.createdAt;
    const createdAt = typeof createdAtValue === 'string' ? new Date(createdAtValue) : null;
    const id = typeof parsed?.id === 'string' && isUuid(parsed.id) ? parsed.id : null;
    if (createdAt === null || Number.isNaN(createdAt.getTime()) || id === null) {
      throw new AppException('VALIDATION_ERROR', {
        details: { errors: [{ field: 'cursor', messages: ['The pagination cursor is invalid.'] }] },
      });
    }
    return { createdAt, id };
  }

  private decodeRevisionCursor(cursor: string | undefined): number | null {
    if (cursor === undefined) {
      return null;
    }
    const parsed = decodeCursor(cursor);
    const version = parsed?.version;
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
      throw new AppException('VALIDATION_ERROR', {
        details: { errors: [{ field: 'cursor', messages: ['The pagination cursor is invalid.'] }] },
      });
    }
    return version;
  }

  private addDays(base: Date, days: number): Date {
    return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  }
}
