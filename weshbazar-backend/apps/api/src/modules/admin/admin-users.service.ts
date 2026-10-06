/**
 * Admin user management (spec §60, §106).
 *
 * The three commands — suspend, ban, restore — share one contract:
 *
 *   - Only role USER accounts are moderatable; staff accounts are never
 *     targets, so moderation can't be turned against other staff and no
 *     request payload can escalate or lower a role.
 *   - State changes go through the command itself, never a status field:
 *     each command validates the current status and rejects illegal
 *     transitions with MODERATION_ACTION_NOT_ALLOWED.
 *   - The user row, the mirrored SellerAccount status, session revocation
 *     and the audit row commit atomically (same pattern as listing
 *     moderation).
 *
 * Documented behavior for existing content while an account is suspended or
 * banned: listings are never deleted or archived by user moderation.
 * Discovery hides them automatically because every public query filters
 * `sellerAccount.status = ACTIVE`; restoring the account makes its content
 * visible again.
 *
 * Sessions are revoked at suspend/ban time with the `ADMIN_ACTION` reason;
 * restore deliberately does not resurrect them — the account signs in again.
 */
import { Injectable } from '@nestjs/common';
import {
  clampLimit,
  clampPage,
  pageMeta,
  pageResults,
  type PagePaginated,
} from '../../common/http/pagination';
import { AppException } from '../../common/errors/app.exception';
import {
  toAdminUserDetailView,
  toAdminUserView,
  type AdminUserDetailView,
  type AdminUserView,
} from '../../common/presenters/admin.presenter';
import { isUuid } from '../../common/utils/uuid.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AdminActionContext } from './admin.types';
import { BanUserDto, SuspendUserDto } from './dto/admin-users.dto';
import type { AdminUsersQueryDto } from './dto/admin-users.dto';

/** User row + seller account + the seller's active-listing count. */
const USER_WITH_SELLER_INCLUDE = {
  sellerAccount: {
    select: {
      id: true,
      slug: true,
      displayName: true,
      status: true,
      _count: { select: { listings: { where: { deletedAt: null, status: 'ACTIVE' } } } },
    },
  },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof USER_WITH_SELLER_INCLUDE }>;

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Paginated search over phone, normalized phone and display name. */
  async search(query: AdminUsersQueryDto): Promise<PagePaginated<AdminUserView>> {
    const page = clampPage(query.page);
    const limit = clampLimit(query.limit, 50, 100);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role !== undefined ? { role: query.role } : {}),
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.q !== undefined
        ? {
            OR: [
              { phone: { contains: query.q } },
              { phoneNormalized: { contains: query.q } },
              { displayName: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: USER_WITH_SELLER_INCLUDE,
      }),
    ]);

    return pageResults(rows.map(toAdminUserView), pageMeta(page, limit, total));
  }

  /** Detail with listing counts by status and report counters. */
  async detail(userId: string): Promise<AdminUserDetailView> {
    if (!isUuid(userId)) {
      throw new AppException('USER_NOT_FOUND');
    }
    const row = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_WITH_SELLER_INCLUDE,
    });
    if (!row || row.deletedAt !== null) {
      throw new AppException('USER_NOT_FOUND');
    }

    const [byStatus, openReportsAbout, reportsSubmitted] = await Promise.all([
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { deletedAt: null, sellerAccount: { ownerUserId: userId } },
        _count: { _all: true },
      }),
      this.prisma.report.count({
        where: { reportedUserId: userId, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
      this.prisma.report.count({ where: { reporterUserId: userId } }),
    ]);

    return toAdminUserDetailView(row, {
      listingsByStatus: Object.fromEntries(
        byStatus.map((group) => [group.status, group._count._all]),
      ),
      openReportsAbout,
      reportsSubmitted,
    });
  }

  /** ACTIVE|SUSPENDED → SUSPENDED with an optional expiry (§60). */
  async suspend(
    actorUserId: string,
    targetUserId: string,
    dto: SuspendUserDto,
    context: AdminActionContext = {},
  ): Promise<AdminUserView> {
    const until = dto.until === undefined ? null : new Date(dto.until);
    if (until !== null && until.getTime() <= Date.now()) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [{ field: 'until', messages: ['`until` must be in the future.'] }],
        },
      });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const target = await this.loadTarget(tx, targetUserId);
      if (target.status !== 'ACTIVE' && target.status !== 'SUSPENDED') {
        throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
      }

      await tx.user.update({
        where: { id: target.id },
        data: { status: 'SUSPENDED', suspensionReason: dto.reason, suspendedUntil: until },
      });
      await tx.sellerAccount.updateMany({
        where: { ownerUserId: target.id },
        data: { status: 'SUSPENDED' },
      });
      const revoked = await tx.refreshSession.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'ADMIN_ACTION' },
      });
      await this.audit.record(
        {
          actorUserId,
          action: 'USER_SUSPENDED',
          entityType: 'User',
          entityId: target.id,
          metadata: {
            from: target.status,
            reason: dto.reason,
            suspendedUntil: until === null ? null : until.toISOString(),
            revokedSessions: revoked.count,
          },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null,
        },
        tx,
      );

      return this.reload(tx, target.id);
    });

    return toAdminUserView(updated);
  }

  /** ACTIVE|SUSPENDED → BANNED; indefinite and re-restorable (§60). */
  async ban(
    actorUserId: string,
    targetUserId: string,
    dto: BanUserDto,
    context: AdminActionContext = {},
  ): Promise<AdminUserView> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const target = await this.loadTarget(tx, targetUserId);
      if (target.status !== 'ACTIVE' && target.status !== 'SUSPENDED') {
        throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
      }

      await tx.user.update({
        where: { id: target.id },
        data: { status: 'BANNED', suspensionReason: dto.reason, suspendedUntil: null },
      });
      await tx.sellerAccount.updateMany({
        where: { ownerUserId: target.id },
        data: { status: 'BANNED' },
      });
      const revoked = await tx.refreshSession.updateMany({
        where: { userId: target.id, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'ADMIN_ACTION' },
      });
      await this.audit.record(
        {
          actorUserId,
          action: 'USER_BANNED',
          entityType: 'User',
          entityId: target.id,
          metadata: {
            from: target.status,
            reason: dto.reason,
            revokedSessions: revoked.count,
          },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null,
        },
        tx,
      );

      return this.reload(tx, target.id);
    });

    return toAdminUserView(updated);
  }

  /** SUSPENDED|BANNED → ACTIVE; clears suspension facts (§60). */
  async restore(
    actorUserId: string,
    targetUserId: string,
    context: AdminActionContext = {},
  ): Promise<AdminUserView> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const target = await this.loadTarget(tx, targetUserId);
      if (target.status !== 'SUSPENDED' && target.status !== 'BANNED') {
        throw new AppException('MODERATION_ACTION_NOT_ALLOWED');
      }

      await tx.user.update({
        where: { id: target.id },
        data: { status: 'ACTIVE', suspensionReason: null, suspendedUntil: null },
      });
      await tx.sellerAccount.updateMany({
        where: { ownerUserId: target.id },
        data: { status: 'ACTIVE' },
      });
      await this.audit.record(
        {
          actorUserId,
          action: 'USER_RESTORED',
          entityType: 'User',
          entityId: target.id,
          metadata: { from: target.status },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null,
        },
        tx,
      );

      return this.reload(tx, target.id);
    });

    return toAdminUserView(updated);
  }

  // --- Private helpers ------------------------------------------------------------

  /**
   * Load a moderatable target. Staff accounts are immune — without this,
   * user moderation would be a route to taking over the platform's own
   * operators (and §59 forbids escalation through requests).
   */
  private async loadTarget(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<{ id: string; status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' | 'DEACTIVATED' }> {
    if (!isUuid(userId)) {
      throw new AppException('USER_NOT_FOUND');
    }
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, status: true, deletedAt: true },
    });
    if (!target || target.deletedAt !== null) {
      throw new AppException('USER_NOT_FOUND');
    }
    if (target.role !== 'USER') {
      throw new AppException('USER_MODERATION_FORBIDDEN');
    }
    return { id: target.id, status: target.status };
  }

  private reload(tx: Prisma.TransactionClient, userId: string): Promise<UserRow> {
    return tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: USER_WITH_SELLER_INCLUDE,
    });
  }
}
