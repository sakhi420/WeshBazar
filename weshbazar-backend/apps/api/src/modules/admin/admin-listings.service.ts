/**
 * Admin listing-moderation queue + reads (spec §59, §106).
 *
 * The queue is page/limit paginated (admin surfaces need total counts) and
 * surfaces the actions the calling principal may perform on each row — a
 * moderator sees only review/reject, an admin also archive/restore (§59).
 * `permittedModerationActions` derives that list from the state machine and
 * the permission map, so the two can never drift apart.
 *
 * The commands themselves live in `ListingsService` (approve/reject/
 * archiveByAdmin/restoreByAdmin); this service only reads.
 */
import { Injectable, Inject } from '@nestjs/common';
import {
  clampLimit,
  clampPage,
  pageMeta,
  pageResults,
  type PagePaginated,
} from '../../common/http/pagination';
import { AppException } from '../../common/errors/app.exception';
import { hasPermission, type Permission } from '../../common/authz/permissions';
import {
  toAdminListingDetail,
  toAdminListingItem,
  type AdminListingDetailView,
  type AdminListingItemView,
  type ModerationActionLabel,
} from '../../common/presenters/admin.presenter';
import type { MediaUrlResolver } from '../../common/presenters/listing.presenter';
import { isUuid } from '../../common/utils/uuid.utils';
import type { Locale } from '../../common/utils/locale.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { ListingStatus, UserRole } from '../../generated/prisma/enums';
import { STORAGE_PROVIDER, type StorageProvider } from '../../providers/storage/storage.provider';
import { resolveListingTransition, type ListingAction } from '../listings/listing-state';
import { AdminListingsQueryDto } from './dto/admin-listings.dto';

/** Seller facts on every admin row — derived from listing state + permissions. */
const MODERATION_COMMANDS: ReadonlyArray<{
  label: ModerationActionLabel;
  action: ListingAction;
  permission: Permission;
}> = [
  { label: 'APPROVE', action: 'APPROVE', permission: 'LISTING_REVIEW' },
  { label: 'REJECT', action: 'REJECT', permission: 'LISTING_REJECT' },
  { label: 'ARCHIVE', action: 'ADMIN_ARCHIVE', permission: 'LISTING_ARCHIVE' },
  { label: 'RESTORE', action: 'ADMIN_RESTORE', permission: 'LISTING_ARCHIVE' },
];

/** Row shape for both the queue and the detail read. */
const ADMIN_LISTING_INCLUDE = {
  category: { include: { translations: true } },
  province: { include: { translations: true } },
  city: { include: { translations: true } },
  sellerAccount: {
    select: { id: true, ownerUserId: true, displayName: true, slug: true, status: true },
  },
  images: {
    where: { deletedAt: null },
    orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  },
  _count: { select: { reports: { where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } } },
} satisfies Prisma.ListingInclude;

const ADMIN_LISTING_DETAIL_INCLUDE = {
  ...ADMIN_LISTING_INCLUDE,
  contactMethods: { orderBy: { type: 'asc' } },
  moderationActions: {
    orderBy: { createdAt: 'desc' },
    include: { adminUser: { select: { displayName: true } } },
  },
} satisfies Prisma.ListingInclude;

/**
 * Actions the role may perform in the row's current state. Both filters must
 * pass: the state machine decides what is legal, the permission map decides
 * who may do it (§59 — no action is offered that would 403).
 */
export function permittedModerationActions(
  status: ListingStatus,
  role: UserRole,
): ModerationActionLabel[] {
  return MODERATION_COMMANDS.filter(
    (command) =>
      hasPermission(role, command.permission) &&
      resolveListingTransition({ action: command.action, status }) !== null,
  ).map((command) => command.label);
}

@Injectable()
export class AdminListingsService {
  private readonly mediaUrl: MediaUrlResolver = (storageKey) =>
    this.storage.getPublicUrl(storageKey);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /**
   * The moderation queue. Defaults to PENDING_REVIEW (FIFO — the review
   * backlog); `reported=true` switches to listings with open reports across
   * statuses, also FIFO. `sort` overrides both.
   */
  async queue(
    query: AdminListingsQueryDto,
    role: UserRole,
    locale: Locale,
  ): Promise<PagePaginated<AdminListingItemView>> {
    const page = clampPage(query.page);
    const limit = clampLimit(query.limit, 50, 100);

    const status = query.status ?? (query.reported === true ? undefined : 'PENDING_REVIEW');
    const backlog = query.reported === true || status === 'PENDING_REVIEW';
    const sort = query.sort ?? (backlog ? 'oldest' : 'newest');
    const direction = sort === 'oldest' ? 'asc' : 'desc';

    const where: Prisma.ListingWhereInput = {
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
      ...(query.reported === true
        ? { reports: { some: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } }
        : {}),
      ...(query.reported === false
        ? { reports: { none: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } } }
        : {}),
      ...(query.categoryId !== undefined ? { categoryId: query.categoryId } : {}),
      ...(query.sellerAccountId !== undefined ? { sellerAccountId: query.sellerAccountId } : {}),
      ...(query.q !== undefined ? { title: { contains: query.q, mode: 'insensitive' } } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        include: ADMIN_LISTING_INCLUDE,
        orderBy: [{ createdAt: direction }, { id: direction }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return pageResults(
      rows.map((row) =>
        toAdminListingItem(
          row,
          locale,
          this.mediaUrl,
          permittedModerationActions(row.status, role),
        ),
      ),
      pageMeta(page, limit, total),
    );
  }

  /** Any state, no ownership check; includes the moderation trail (§106). */
  async detail(listingId: string, role: UserRole, locale: Locale): Promise<AdminListingDetailView> {
    if (!isUuid(listingId)) {
      throw new AppException('LISTING_NOT_FOUND');
    }
    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: ADMIN_LISTING_DETAIL_INCLUDE,
    });
    if (!row || row.deletedAt !== null) {
      throw new AppException('LISTING_NOT_FOUND');
    }

    return toAdminListingDetail(
      row,
      locale,
      this.mediaUrl,
      permittedModerationActions(row.status, role),
    );
  }
}
