/**
 * Audit log presenter (spec §62).
 *
 * Audit records are append-only and admin-readable only; the view exposes the
 * full record except that `metadata` is passed through as stored (writers must
 * never put secrets or credentials into metadata).
 */
import type { AuditLog } from '../../generated/prisma/client';
import type { AuditAction } from '../../generated/prisma/enums';

export interface AuditLogView {
  id: string;
  actorUserId: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export function toAuditLogView(row: AuditLog): AuditLogView {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}
