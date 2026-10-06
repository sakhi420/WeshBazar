/**
 * Audit trail service (spec §62).
 *
 * Admin/security-sensitive actions write immutable `AuditLog` rows here.
 * Two write paths exist on purpose:
 *
 *   - `record()` is strict and accepts a transaction writer — moderation
 *     commands embed it in the transaction that performs the change, so the
 *     audit row exists if and only if the action committed.
 *   - `recordBestEffort()` never throws — used by authentication flows whose
 *     primary outcome (sign-in, password change) must not fail because the
 *     audit insert did. Failures are logged loudly.
 *
 * Writers must never place secrets, tokens, passwords or OTP codes into
 * `metadata`; this service stores metadata as-is.
 */
import { Injectable, Logger } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import {
  clampLimit,
  clampPage,
  pageMeta,
  pageResults,
  type PagePaginated,
} from '../../common/http/pagination';
import { toAuditLogView, type AuditLogView } from '../../common/presenters/audit.presenter';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import type { AuditAction } from '../../generated/prisma/enums';
import type { AuditLogQueryDto } from './dto/audit.dto';

/** Minimal writer surface: the service itself or an ongoing transaction. */
type AuditWriter = Pick<PrismaService, 'auditLog'>;

export interface AuditRecordInput {
  /** Null for system/anonymous events (e.g. replay detection before auth). */
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonObject;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Actor identity + request facts for an audited command, passed from
 * controllers (authenticated user + `requestAuditContext`). Kept as one
 * object so command signatures stay readable.
 */
export interface AuditActor {
  actorUserId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Request-derived audit fields; never includes headers beyond ip/user-agent. */
export function requestAuditContext(request: FastifyRequest): {
  ipAddress: string | null;
  userAgent: string | null;
} {
  const userAgent = request.headers['user-agent'];
  return {
    ipAddress: typeof request.ip === 'string' ? request.ip : null,
    userAgent: typeof userAgent === 'string' ? userAgent : null,
  };
}

function truncate(value: string | null | undefined, maxLength: number): string | null {
  if (value === undefined || value === null || value.length === 0) {
    return null;
  }
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Strict write; pass the ongoing transaction to stay atomic with it. */
  async record(input: AuditRecordInput, writer: AuditWriter = this.prisma): Promise<void> {
    await writer.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType.slice(0, 50),
        entityId: input.entityId ?? null,
        metadata: input.metadata ?? {},
        ipAddress: truncate(input.ipAddress, 64),
        userAgent: truncate(input.userAgent, 512),
      },
    });
  }

  /** Never-throwing variant for authentication/security flows. */
  async recordBestEffort(input: AuditRecordInput): Promise<void> {
    try {
      await this.record(input);
    } catch (error) {
      this.logger.warn(
        `Audit write failed for ${input.action} (${input.entityType} ${
          input.entityId ?? '-'
        }): ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /** Admin audit search (spec §106): newest first, filters exact-match. */
  async search(query: AuditLogQueryDto): Promise<PagePaginated<AuditLogView>> {
    const page = clampPage(query.page);
    const limit = clampLimit(query.limit, 50, 100);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.action !== undefined ? { action: query.action } : {}),
      ...(query.entityType !== undefined ? { entityType: query.entityType } : {}),
      ...(query.entityId !== undefined ? { entityId: query.entityId } : {}),
      ...(query.actorUserId !== undefined ? { actorUserId: query.actorUserId } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return pageResults(rows.map(toAuditLogView), pageMeta(page, limit, total));
  }
}
