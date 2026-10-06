/**
 * Refresh-session lifecycle: creation, rotation, revocation, reuse detection.
 *
 * Security model (spec §20):
 * - Only HMAC hashes of refresh tokens are stored.
 * - Every sign-in starts a session `familyId`; rotations keep the same family.
 * - Presenting an already-rotated (or replayed) token revokes the WHOLE family
 *   and forces re-authentication (SESSION_REUSE_DETECTED).
 * - Deliberately revoked tokens (logout, password change, …) answer with
 *   SESSION_REVOKED instead — they are not replay evidence.
 */
import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AppException } from '../../common/errors/app.exception';
import type { RefreshSession, User } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TokenService } from './token.service';

/** Revocation reasons that mark a token as "already rotated" → replay evidence. */
const REPLAY_REVOCATION_REASONS = new Set(['ROTATION', 'REUSE_DETECTED']);

export interface SessionContext {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

export interface IssuedSession {
  sessionId: string;
  familyId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface RotatedSession {
  sessionId: string;
  user: User;
  issued: IssuedSession;
}

function truncate(value: string | undefined, maxLength: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Create the first session of a new family (sign-in / registration). */
  async create(
    userId: string,
    context: SessionContext,
    familyId: string = randomUUID(),
  ): Promise<IssuedSession> {
    const { token, tokenHash } = this.tokens.issueRefreshToken();
    const expiresAt = new Date(Date.now() + this.tokens.refreshTokenTtlSeconds * 1000);

    const session = await this.prisma.refreshSession.create({
      data: {
        userId,
        familyId,
        tokenHash,
        expiresAt,
        ipAddress: truncate(context.ipAddress, 64),
        userAgent: truncate(context.userAgent, 512),
        deviceName: truncate(context.deviceName, 120),
      },
      select: { id: true },
    });

    return { sessionId: session.id, familyId, refreshToken: token, expiresAt };
  }

  /**
   * Rotate a refresh token: validate the presented token, revoke it as
   * "ROTATION" and issue its successor inside the same transaction.
   */
  async rotate(rawToken: string, context: SessionContext): Promise<RotatedSession> {
    const now = new Date();
    const tokenHash = this.tokens.hashRefreshToken(rawToken);
    const current = await this.prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!current) {
      throw new AppException('REFRESH_TOKEN_INVALID');
    }

    if (current.revokedAt !== null) {
      if (current.revokedReason !== null && REPLAY_REVOCATION_REASONS.has(current.revokedReason)) {
        const revokedFamilySessions = await this.revokeFamily(
          current.familyId,
          now,
          'REUSE_DETECTED',
        );
        this.logger.warn(
          `Refresh token replay detected (user ${current.userId}, family ${current.familyId}); family revoked.`,
        );
        await this.recordReuseDetected(current, context, 'replayed_token', revokedFamilySessions);
        throw new AppException('SESSION_REUSE_DETECTED');
      }
      throw new AppException('SESSION_REVOKED');
    }

    if (current.expiresAt.getTime() <= now.getTime()) {
      throw new AppException('REFRESH_TOKEN_INVALID', {
        message: 'The refresh session has expired. Please sign in again.',
      });
    }

    const { user } = current;
    if (user.deletedAt !== null || user.status !== 'ACTIVE') {
      await this.prisma.refreshSession.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'ACCOUNT_INACTIVE' },
      });
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }

    const { token, tokenHash: nextTokenHash } = this.tokens.issueRefreshToken();
    const expiresAt = new Date(now.getTime() + this.tokens.refreshTokenTtlSeconds * 1000);

    const nextSessionId = await this.prisma.$transaction(async (tx) => {
      // Conditional revoke: the winner of a concurrent double-refresh claims
      // the row; the loser sees count 0 and is treated as a replay.
      const claimed = await tx.refreshSession.updateMany({
        where: { id: current.id, revokedAt: null },
        data: { revokedAt: now, revokedReason: 'ROTATION', lastUsedAt: now },
      });
      if (claimed.count === 0) {
        return null;
      }
      const created = await tx.refreshSession.create({
        data: {
          userId: current.userId,
          familyId: current.familyId,
          tokenHash: nextTokenHash,
          expiresAt,
          ipAddress: truncate(context.ipAddress, 64) ?? current.ipAddress,
          userAgent: truncate(context.userAgent, 512) ?? current.userAgent,
          deviceName: truncate(context.deviceName, 120) ?? current.deviceName,
        },
        select: { id: true },
      });
      await tx.refreshSession.update({
        where: { id: current.id },
        data: { replacedBySessionId: created.id },
      });
      return created.id;
    });

    if (nextSessionId === null) {
      const revokedFamilySessions = await this.revokeFamily(
        current.familyId,
        now,
        'REUSE_DETECTED',
      );
      this.logger.warn(
        `Concurrent refresh rotation detected (user ${current.userId}, family ${current.familyId}); family revoked.`,
      );
      await this.recordReuseDetected(
        current,
        context,
        'concurrent_rotation',
        revokedFamilySessions,
      );
      throw new AppException('SESSION_REUSE_DETECTED');
    }

    return {
      sessionId: nextSessionId,
      user,
      issued: {
        sessionId: nextSessionId,
        familyId: current.familyId,
        refreshToken: token,
        expiresAt,
      },
    };
  }

  /** Revoke one session owned by `userId`; returns false when it was already revoked. */
  async revokeForUser(sessionId: string, userId: string, reason: string): Promise<boolean> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count > 0;
  }

  /** Load a session enforcing ownership; SESSION_NOT_FOUND otherwise. */
  async ensureOwned(sessionId: string, userId: string): Promise<RefreshSession> {
    const session = await this.prisma.refreshSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new AppException('SESSION_NOT_FOUND');
    }
    return session;
  }

  /** Revoke every active session of a user (optionally keeping one alive). */
  async revokeAllForUser(
    userId: string,
    reason: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const result = await this.prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId !== undefined ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokedReason: reason },
    });
    return result.count;
  }

  /** Revoke every not-yet-revoked session of a family (reuse response). */
  async revokeFamily(
    familyId: string,
    now: Date = new Date(),
    reason = 'REUSE_DETECTED',
  ): Promise<number> {
    const result = await this.prisma.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
    return result.count;
  }

  /**
   * §62 security trail for token replay. Best-effort on purpose: the reuse
   * response (family revocation + SESSION_REUSE_DETECTED) must not change
   * because the audit insert failed. No token material enters metadata.
   */
  private recordReuseDetected(
    session: RefreshSession,
    context: SessionContext,
    trigger: 'replayed_token' | 'concurrent_rotation',
    revokedFamilySessions: number,
  ): Promise<void> {
    return this.audit.recordBestEffort({
      actorUserId: session.userId,
      action: 'SECURITY_REFRESH_REUSE_DETECTED',
      entityType: 'RefreshSession',
      entityId: session.id,
      metadata: { familyId: session.familyId, trigger, revokedFamilySessions },
      ipAddress: context.ipAddress ?? null,
      userAgent: context.userAgent ?? null,
    });
  }

  /** Active (non-revoked, non-expired) sessions, newest first. */
  listActive(userId: string): Promise<RefreshSession[]> {
    return this.prisma.refreshSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
