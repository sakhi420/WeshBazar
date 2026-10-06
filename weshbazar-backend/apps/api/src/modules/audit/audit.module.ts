/**
 * Audit module (spec §62): append-only trail for admin/security-sensitive
 * actions. Exported so moderation commands can write audit rows inside their
 * transactions.
 */
import { Module } from '@nestjs/common';
import { AdminAuditController } from './admin-audit.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [AdminAuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
