/**
 * Admin report queue + resolution (spec §59, §106).
 *
 * Resolve and dismiss are the only report commands; both are legal from
 * OPEN/UNDER_REVIEW and stamp the resolver, timestamp and an optional note.
 * Anything else — including a second decision on the same report — fails
 * with REPORT_NOT_OPEN, so the recorded outcome can never be overwritten.
 *
 * Resolving a report does NOT touch the listing: takedowns are separate
 * listing-moderation commands, keeping the report decision and the content
 * decision independently auditable.
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
import { toAdminReportView, type AdminReportView } from '../../common/presenters/admin.presenter';
import { isUuid } from '../../common/utils/uuid.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { AuditService } from '../audit/audit.service';
import type { AdminActionContext } from './admin.types';
import type { AdminReportsQueryDto, ResolveReportDto } from './dto/admin-reports.dto';

const REPORT_INCLUDE = {
  listing: { select: { id: true, slug: true, title: true, status: true } },
  reporter: { select: { id: true, displayName: true, status: true } },
  reportedUser: { select: { id: true, displayName: true, status: true } },
  resolvedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.ReportInclude;

@Injectable()
export class AdminReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * The report queue. Open work (no status filter, or a status filter that
   * still means "open") is FIFO; narrowing to RESOLVED/DISMISSED flips to
   * newest-first so recent decisions read naturally.
   */
  async queue(query: AdminReportsQueryDto): Promise<PagePaginated<AdminReportView>> {
    const page = clampPage(query.page);
    const limit = clampLimit(query.limit, 50, 100);
    const closed = query.status === 'RESOLVED' || query.status === 'DISMISSED';
    const direction = closed ? 'desc' : 'asc';

    const where: Prisma.ReportWhereInput = {
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.reason !== undefined ? { reason: query.reason } : {}),
      ...(query.reportedUserId !== undefined ? { reportedUserId: query.reportedUserId } : {}),
      ...(query.listingId !== undefined ? { listingId: query.listingId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        include: REPORT_INCLUDE,
        orderBy: [{ createdAt: direction }, { id: direction }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return pageResults(rows.map(toAdminReportView), pageMeta(page, limit, total));
  }

  /** OPEN|UNDER_REVIEW → RESOLVED with the documented outcome. */
  resolve(
    actorUserId: string,
    reportId: string,
    dto: ResolveReportDto,
    context: AdminActionContext = {},
  ): Promise<AdminReportView> {
    return this.decide(actorUserId, reportId, 'RESOLVED', dto.note, context);
  }

  /** OPEN|UNDER_REVIEW → DISMISSED (no action taken). */
  dismiss(
    actorUserId: string,
    reportId: string,
    dto: ResolveReportDto,
    context: AdminActionContext = {},
  ): Promise<AdminReportView> {
    return this.decide(actorUserId, reportId, 'DISMISSED', dto.note, context);
  }

  // --- Private helpers ------------------------------------------------------------

  private async decide(
    actorUserId: string,
    reportId: string,
    target: 'RESOLVED' | 'DISMISSED',
    rawNote: string | undefined,
    context: AdminActionContext,
  ): Promise<AdminReportView> {
    if (!isUuid(reportId)) {
      throw new AppException('REPORT_NOT_FOUND');
    }
    const note = rawNote === undefined || rawNote.length === 0 ? null : rawNote;

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.report.findUnique({
        where: { id: reportId },
        select: { id: true, status: true },
      });
      if (!current) {
        throw new AppException('REPORT_NOT_FOUND');
      }
      if (current.status !== 'OPEN' && current.status !== 'UNDER_REVIEW') {
        throw new AppException('REPORT_NOT_OPEN');
      }

      await tx.report.update({
        where: { id: current.id },
        data: {
          status: target,
          resolvedByUserId: actorUserId,
          resolvedAt: new Date(),
          resolutionNote: note,
        },
      });
      await this.audit.record(
        {
          actorUserId,
          action: target === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_DISMISSED',
          entityType: 'Report',
          entityId: current.id,
          metadata: {
            from: current.status,
            to: target,
            ...(note !== null ? { note } : {}),
          },
          ipAddress: context.ipAddress ?? null,
          userAgent: context.userAgent ?? null,
        },
        tx,
      );

      return tx.report.findUniqueOrThrow({ where: { id: current.id }, include: REPORT_INCLUDE });
    });

    return toAdminReportView(updated);
  }
}
