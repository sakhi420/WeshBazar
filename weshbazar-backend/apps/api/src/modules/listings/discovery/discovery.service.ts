/**
 * Public discovery service (spec §47–§52, §79, §110).
 *
 * Orchestrates the anonymous feed and detail reads:
 *
 *   - visibility policy lives HERE, not in the search provider: the feed is
 *     ACTIVE listings of ACTIVE sellers only (§110), the detail additionally
 *     exposes SOLD and hides everything else as `LISTING_NOT_FOUND`; expired
 *     ACTIVE listings (§70) are hidden immediately — both in the feed query
 *     and at hydration — without waiting for the expiration job;
 *   - client criteria are resolved against taxonomy/locations (unknown slugs
 *     answer with an empty feed; attribute filters must reference filterable
 *     attributes of the selected category, else VALIDATION_ERROR §79);
 *   - the search provider returns ordered ids only; full rows are hydrated
 *     through the shared listing include, and rows that changed state in
 *     between silently drop out of the page.
 */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../../common/errors/app.exception';
import {
  clampLimit,
  cursorPage,
  decodeCursor,
  encodeCursor,
  type CursorPaginated,
} from '../../../common/http/pagination';
import type { MediaUrlResolver } from '../../../common/presenters/listing.presenter';
import {
  toPublicListingDetail,
  toPublicListingSummary,
  type PublicAttributeView,
  type PublicContactView,
  type PublicListingDetail,
  type PublicListingSummary,
  type PublicSellerRef,
} from '../../../common/presenters/public-listing.presenter';
import { RateLimitService } from '../../../common/rate-limit/rate-limit.service';
import type { Locale } from '../../../common/utils/locale.utils';
import { isUuid } from '../../../common/utils/uuid.utils';
import type { AppConfig } from '../../../config/config.types';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { ListingStatsService } from '../../analytics/listing-stats.service';
import { ViewDedupeService } from '../../analytics/view-dedupe.service';
import {
  SEARCH_PROVIDER,
  type AttributeCriterion,
  type FacetCount,
  type SearchCriteria,
  type SearchCursor,
  type SearchProvider,
  type SearchSort,
} from '../../../providers/search/search.provider';
import {
  STORAGE_PROVIDER,
  type StorageProvider,
} from '../../../providers/storage/storage.provider';
import { LocationsService } from '../../locations/locations.service';
import { ListingDiscoveryQueryDto } from '../dto/discovery.dto';
import { isExpiredActiveListing, publiclyVisibleActiveListingWhere } from '../listing-visibility';
import { LISTING_ROW_INCLUDE } from '../listings.service';
import { normalizeSearchText } from '../search-text';
import { TaxonomyService } from '../../taxonomy/taxonomy.service';
import { buildAttributeCriteria } from './filter-parser';

/** Spec §47: multi-word queries are AND over a bounded term list. */
const MAX_SEARCH_TERMS = 6;

/** Matches values this service itself puts into price cursors. */
const PRICE_CURSOR_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

/** Detail rows add the seller safe-profile facts and enabled contact methods. */
const DETAIL_ROW_INCLUDE = {
  ...LISTING_ROW_INCLUDE,
  sellerAccount: {
    select: {
      slug: true,
      displayName: true,
      status: true,
      owner: { select: { createdAt: true, phoneVerifiedAt: true, avatarKey: true } },
    },
  },
  contactMethods: { where: { enabled: true }, orderBy: { type: 'asc' } },
} satisfies Prisma.ListingInclude;

/** Client identity for §73 view counting; raw IPs are never persisted. */
export interface ViewClient {
  clientIp: string;
  userAgent: string | null;
}

type FeedRow = Prisma.ListingGetPayload<{ include: typeof LISTING_ROW_INCLUDE }>;
type DetailRow = Prisma.ListingGetPayload<{ include: typeof DETAIL_ROW_INCLUDE }>;

/** A discovery query resolved onto provider criteria (no ordering/pagination). */
interface ResolvedCriteria {
  categoryId: string | null;
  criteria: Omit<SearchCriteria, 'sort' | 'cursor' | 'limit'>;
}

@Injectable()
export class DiscoveryService {
  private readonly limits: AppConfig['listing'];
  private readonly rateLimit: AppConfig['rateLimit'];
  private readonly mediaUrl: MediaUrlResolver = (storageKey: string) =>
    this.storage.getPublicUrl(storageKey);

  constructor(
    private readonly prisma: PrismaService,
    private readonly taxonomy: TaxonomyService,
    private readonly locations: LocationsService,
    private readonly rateLimitService: RateLimitService,
    private readonly viewDedupe: ViewDedupeService,
    private readonly stats: ListingStatsService,
    @Inject(SEARCH_PROVIDER) private readonly searchProvider: SearchProvider,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.limits = configService.get('listing', { infer: true });
    this.rateLimit = configService.get('rateLimit', { infer: true });
  }

  /**
   * Public feed (spec §49–§51). Every branch that cannot match — unknown or
   * inactive category/province/city slugs — answers with an empty page rather
   * than an error, so filters behave as filters (§110).
   */
  async search(
    clientIp: string,
    query: ListingDiscoveryQueryDto,
    locale: Locale,
  ): Promise<CursorPaginated<PublicListingSummary>> {
    this.rateLimitService.enforce('search:list:ip', clientIp, this.rateLimit.searchPerWindow);

    const limit = clampLimit(query.limit, 24, 60);
    const sort = query.sort ?? 'newest';
    const cursor = this.decodeSearchCursor(query.cursor, sort);

    const resolved = await this.resolveCriteria(query);
    if (resolved === null) {
      return emptyFeed(limit);
    }

    const page = await this.searchProvider.search({
      ...resolved.criteria,
      sort,
      cursor,
      limit,
    });

    const rows = page.ids.length === 0 ? [] : await this.loadFeedRows(page.ids);
    const byId = new Map(rows.map((row) => [row.id, row]));
    const items = page.ids
      .map((id) => byId.get(id))
      .filter((row): row is FeedRow => row !== undefined)
      .map((row) => toPublicListingSummary(row, locale, this.mediaUrl));

    return cursorPage(items, {
      nextCursor:
        page.hasMore && page.nextCursor !== null ? this.encodeSearchCursor(page.nextCursor) : null,
      hasMore: page.hasMore,
      limit,
      total: page.total,
    });
  }

  /**
   * Resolve a discovery query onto provider criteria (everything except
   * ordering/pagination). Returns null when a category/province/city slug is
   * unknown (the caller maps that to its own empty result); throws for invalid
   * input (minPrice > maxPrice, filter without category, city without province,
   * or an attribute reference the category does not allow).
   */
  private async resolveCriteria(query: ListingDiscoveryQueryDto): Promise<ResolvedCriteria | null> {
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw invalidQuery('minPrice', 'minPrice cannot be greater than maxPrice.');
    }

    let categoryId: string | null = null;
    let categoryIds: string[] | null = null;
    if (query.category !== undefined) {
      const resolved = await this.taxonomy.resolveVisibleSubtreeBySlug(query.category);
      if (resolved === null) {
        return null;
      }
      categoryId = resolved.id;
      categoryIds = resolved.subtreeIds;
    }

    let attributes: AttributeCriterion[] = [];
    if (query.filter !== undefined && query.filter.length > 0) {
      if (categoryId === null) {
        throw invalidQuery('filter', 'Attribute filters require a category parameter.');
      }
      const effective = await this.taxonomy.resolveEffectiveAttributes(categoryId);
      const parsed = buildAttributeCriteria(query.filter, effective, this.limits.maxFilters);
      if (parsed.issues.length > 0) {
        throw new AppException('VALIDATION_ERROR', {
          details: {
            errors: parsed.issues.map((issue) => ({
              field: 'filter',
              messages: [issue.message],
            })),
          },
        });
      }
      attributes = parsed.criteria;
    }

    let provinceId: string | null = null;
    if (query.province !== undefined) {
      const province = await this.locations.resolveProvinceBySlug(query.province);
      if (province === null) {
        return null;
      }
      provinceId = province.id;
    }
    let cityId: string | null = null;
    if (query.city !== undefined) {
      if (provinceId === null) {
        throw invalidQuery('city', 'The city filter requires a province parameter.');
      }
      const city = await this.locations.resolveCityBySlug(query.city, provinceId);
      if (city === null) {
        return null;
      }
      cityId = city.id;
    }

    return {
      categoryId,
      criteria: {
        statuses: ['ACTIVE'],
        sellerStatuses: ['ACTIVE'],
        excludeExpiredActive: true,
        categoryIds,
        provinceId,
        cityId,
        minPrice: query.minPrice ?? null,
        maxPrice: query.maxPrice ?? null,
        conditions:
          query.condition !== undefined && query.condition.length > 0 ? query.condition : null,
        attributes,
        terms: searchTerms(query.q),
      },
    };
  }

  /**
   * Facet counts for the filter panel (FILT-018): the static `condition` facet
   * plus every SELECT/MULTI_SELECT attribute of the selected category, each
   * counted with its own filter removed so users can see what selecting an
   * option would leave. Capped at `maxFilters` attribute facets per request.
   */
  async facets(
    clientIp: string,
    query: ListingDiscoveryQueryDto,
  ): Promise<Record<string, FacetCount[]>> {
    this.rateLimitService.enforce('search:list:ip', clientIp, this.rateLimit.searchPerWindow);

    const resolved = await this.resolveCriteria(query);
    if (resolved === null) {
      return {};
    }

    const result: Record<string, FacetCount[]> = {};
    result.condition = await this.searchProvider.countConditionFacets(resolved.criteria);

    if (resolved.categoryId !== null) {
      const effective = await this.taxonomy.resolveEffectiveAttributes(resolved.categoryId);
      const facetFields = effective.filter(
        (attribute) =>
          attribute.isActive &&
          attribute.filterable &&
          (attribute.type === 'SELECT' || attribute.type === 'MULTI_SELECT'),
      );
      for (const field of facetFields.slice(0, this.limits.maxFilters)) {
        result[field.key] = await this.searchProvider.countAttributeFacets(
          resolved.criteria,
          field.key,
          field.type === 'MULTI_SELECT' ? 'MULTI_SELECT' : 'SELECT',
        );
      }
    }

    return result;
  }

  /**
   * Public detail (spec §52). ACTIVE and SOLD listings are reachable (§110);
   * every other state — plus listings whose seller is not ACTIVE or whose
   * ACTIVE runway has expired (§70) — is reported as `LISTING_NOT_FOUND` so
   * moderation and expiry state never leak.
   *
   * ACTIVE views are counted after the visibility checks pass and only for
   * listings an anonymous visitor can already see (§73); counting is
   * best-effort and never fails the read.
   */
  async getPublicBySlug(
    slug: string,
    client: ViewClient,
    locale: Locale,
  ): Promise<PublicListingDetail> {
    this.rateLimitService.enforce(
      'search:detail:ip',
      client.clientIp,
      this.rateLimit.searchPerWindow,
    );

    const row = await this.prisma.listing.findUnique({
      where: { slug },
      include: DETAIL_ROW_INCLUDE,
    });
    if (
      !row ||
      row.deletedAt !== null ||
      (row.status !== 'ACTIVE' && row.status !== 'SOLD') ||
      isExpiredActiveListing(row, new Date()) ||
      row.sellerAccount.status !== 'ACTIVE'
    ) {
      throw new AppException('LISTING_NOT_FOUND');
    }

    if (row.status === 'ACTIVE') {
      await this.countView(row.id, client);
    }

    const methods = row.contactMethods.map((method) => method.type);
    const contact: PublicContactView = {
      // Sold items no longer take contacts; values stay behind Phase 10.
      available: row.status === 'ACTIVE' && methods.length > 0,
      methods,
    };
    const seller: PublicSellerRef = {
      slug: row.sellerAccount.slug,
      displayName: row.sellerAccount.displayName,
      memberSince: row.sellerAccount.owner.createdAt,
      phoneVerified: row.sellerAccount.owner.phoneVerifiedAt !== null,
      avatarUrl: row.sellerAccount.owner.avatarKey
        ? this.mediaUrl(row.sellerAccount.owner.avatarKey)
        : null,
    };
    const attributes = await this.publicAttributes(row);
    return toPublicListingDetail(row, locale, this.mediaUrl, { attributes, seller, contact });
  }

  /**
   * §73 view counting: policy first (dedupe + per-client budget — cheap,
   * in-memory), then the fast `Listing.views` counter and today's
   * `ListingDailyStat` row in one transaction. Failures are swallowed: a
   * missed count must never surface on a public read (§74 separation).
   */
  private async countView(listingId: string, client: ViewClient): Promise<void> {
    const counted = this.viewDedupe.shouldCount({
      listingId,
      clientIp: client.clientIp,
      userAgent: client.userAgent,
    });
    if (!counted) {
      return;
    }
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.listing.update({ where: { id: listingId }, data: { views: { increment: 1 } } });
        await this.stats.record(listingId, 'views', new Date(), tx);
      });
    } catch {
      // Best-effort analytics: swallow and serve the listing anyway.
    }
  }

  /**
   * Hydrate feed rows; the provider returned ordered ids only. Visibility
   * and seller eligibility are re-checked here (including the §70 expiry
   * cutoff) — a listing that changed state between the two reads silently
   * drops out of the page.
   */
  private async loadFeedRows(ids: readonly string[]): Promise<FeedRow[]> {
    return this.prisma.listing.findMany({
      where: {
        id: { in: [...ids] },
        deletedAt: null,
        sellerAccount: { status: 'ACTIVE' },
        ...publiclyVisibleActiveListingWhere(new Date()),
      },
      include: LISTING_ROW_INCLUDE,
    });
  }

  /**
   * Attribute labels come from the category's effective schema. Keys whose
   * definition has been removed still render (label falls back to the key)
   * so historical listings never lose information.
   */
  private async publicAttributes(row: DetailRow): Promise<PublicAttributeView[]> {
    const stored = (row.attributes ?? {}) as Record<string, unknown>;
    const keys = Object.keys(stored);
    if (keys.length === 0) {
      return [];
    }
    const effective = await this.taxonomy.resolveEffectiveAttributes(row.categoryId);
    const views: PublicAttributeView[] = [];
    const remaining = new Set(keys);
    for (const attribute of effective) {
      if (!remaining.has(attribute.key)) {
        continue;
      }
      remaining.delete(attribute.key);
      const value = stored[attribute.key];
      if (isPublicAttributeValue(value)) {
        views.push({ key: attribute.key, label: attribute.label, type: attribute.type, value });
      }
    }
    for (const key of remaining) {
      const value = stored[key];
      if (isPublicAttributeValue(value)) {
        views.push({ key, label: key, type: null, value });
      }
    }
    return views;
  }

  /**
   * Decode the opaque cursor for the active sort. A malformed cursor, or one
   * issued for a different sort, is a client error — mirrors the owner feed.
   */
  private decodeSearchCursor(cursor: string | undefined, sort: SearchSort): SearchCursor | null {
    if (cursor === undefined) {
      return null;
    }
    const parsed = decodeCursor(cursor);
    const id = typeof parsed?.id === 'string' && isUuid(parsed.id) ? parsed.id : null;
    if (id === null || parsed?.sort !== sort) {
      throw invalidCursor();
    }
    switch (sort) {
      case 'newest': {
        const createdAt = typeof parsed?.createdAt === 'string' ? new Date(parsed.createdAt) : null;
        if (createdAt === null || Number.isNaN(createdAt.getTime())) {
          throw invalidCursor();
        }
        return { sort, id, createdAt };
      }
      case 'price_asc':
      case 'price_desc': {
        if (parsed?.priceNull === true) {
          return { sort, id, priceNull: true };
        }
        if (typeof parsed?.price !== 'string' || !PRICE_CURSOR_PATTERN.test(parsed.price)) {
          throw invalidCursor();
        }
        return { sort, id, price: parsed.price };
      }
      case 'most_viewed': {
        const views = parsed?.views;
        if (typeof views !== 'number' || !Number.isInteger(views) || views < 0) {
          throw invalidCursor();
        }
        return { sort, id, views };
      }
    }
  }

  private encodeSearchCursor(cursor: SearchCursor): string {
    switch (cursor.sort) {
      case 'newest': {
        const { createdAt } = cursor;
        if (!(createdAt instanceof Date)) {
          throw invalidCursor();
        }
        return encodeCursor({ sort: cursor.sort, id: cursor.id, createdAt });
      }
      case 'price_asc':
      case 'price_desc': {
        if (cursor.priceNull === true) {
          return encodeCursor({ sort: cursor.sort, id: cursor.id, priceNull: true });
        }
        if (typeof cursor.price !== 'string') {
          throw invalidCursor();
        }
        return encodeCursor({ sort: cursor.sort, id: cursor.id, price: cursor.price });
      }
      case 'most_viewed': {
        const { views } = cursor;
        if (typeof views !== 'number') {
          throw invalidCursor();
        }
        return encodeCursor({ sort: cursor.sort, id: cursor.id, views });
      }
    }
  }
}

/** Spec §47: fold the raw query the same way the stored `searchText` was. */
function searchTerms(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }
  const normalized = normalizeSearchText(raw);
  if (normalized.length === 0) {
    return [];
  }
  return normalized
    .split(' ')
    .filter((term) => term.length > 0)
    .slice(0, MAX_SEARCH_TERMS);
}

function emptyFeed(limit: number): CursorPaginated<PublicListingSummary> {
  return cursorPage([], { nextCursor: null, hasMore: false, limit, total: 0 });
}

function invalidQuery(field: string, message: string): AppException {
  return new AppException('VALIDATION_ERROR', {
    details: { errors: [{ field, messages: [message] }] },
  });
}

function invalidCursor(): AppException {
  return invalidQuery('cursor', 'The pagination cursor is invalid.');
}

function isPublicAttributeValue(value: unknown): value is string | number | boolean | string[] {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (Array.isArray(value) && value.every((entry) => typeof entry === 'string'))
  );
}
