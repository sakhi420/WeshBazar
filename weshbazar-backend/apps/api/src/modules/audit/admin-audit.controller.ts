/**
 * Admin audit log search (spec §62, §106): read-only, append-only data.
 * There is deliberately no write or delete route — only the application
 * writes audit rows, through `AuditService`.
 */
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { PagePaginated } from '../../common/http/pagination';
import type { AuditLogView } from '../../common/presenters/audit.presenter';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit.dto';
import { AuditLogDto } from './dto/audit-responses.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@RequirePermissions('AUDIT_READ')
export class AdminAuditController {
  constructor(private readonly audit: AuditService) {}

  @Get('audit-logs')
  @ApiOperation({ summary: 'Search the audit trail (newest first; exact-match filters)', operationId: 'admin_audit_list' })
  @ApiOkResponse({ type: [AuditLogDto] })
  list(@Query() query: AuditLogQueryDto): Promise<PagePaginated<AuditLogView>> {
    return this.audit.search(query);
  }
}
