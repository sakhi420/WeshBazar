/**
 * Admin report queue (spec §59, §106) — browse reports and record the
 * decision on each: resolve (acted on) or dismiss (no action).
 *
 * Everything runs through REPORT_REVIEW: moderators own this queue. The
 * commands only close the report itself; listing takedowns are separate
 * LISTING_ARCHIVE commands so the two decisions stay independently audited.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import type { PagePaginated } from '../../common/http/pagination';
import type { AdminReportView } from '../../common/presenters/admin.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { requestAuditContext } from '../audit/audit.service';
import { AdminReportsService } from './admin-reports.service';
import { AdminReportDto } from './dto/admin-responses.dto';
import { AdminReportsQueryDto, ResolveReportDto } from './dto/admin-reports.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/reports')
@RequirePermissions('REPORT_REVIEW')
export class AdminReportsController {
  constructor(private readonly reports: AdminReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Report queue (open reports FIFO; closed newest first)', operationId: 'admin_reports_queue' })
  @ApiOkResponse({ type: [AdminReportDto] })
  queue(@Query() query: AdminReportsQueryDto): Promise<PagePaginated<AdminReportView>> {
    return this.reports.queue(query);
  }

  @Post(':id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a report with the documented outcome', operationId: 'admin_reports_resolve' })
  @ApiOkResponse({ type: AdminReportDto })
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    // Placeholder so a missing body fails as VALIDATION_ERROR, not a crash.
    @Body() dto: ResolveReportDto = {},
    @Req() request: FastifyRequest,
  ): Promise<AdminReportView> {
    return this.reports.resolve(user.id, id, dto, requestAuditContext(request));
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Dismiss a report (no action taken)', operationId: 'admin_reports_dismiss' })
  @ApiOkResponse({ type: AdminReportDto })
  dismiss(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ResolveReportDto = {},
    @Req() request: FastifyRequest,
  ): Promise<AdminReportView> {
    return this.reports.dismiss(user.id, id, dto, requestAuditContext(request));
  }
}
