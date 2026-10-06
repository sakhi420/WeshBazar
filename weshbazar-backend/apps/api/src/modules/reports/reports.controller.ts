/**
 * Report submission API (spec §56, §108): `POST /listings/:id/reports`.
 *
 * Authentication is required (global JWT guard); the verified-phone gate and
 * the per-user rate limit live in the service so they apply regardless of
 * transport.
 */
import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ReportView } from '../../common/presenters/report.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ReportDto } from './dto/report-responses.dto';
import { SubmitReportDto } from './dto/report.dto';
import { ReportsService } from './reports.service';

@ApiTags('listings')
@ApiBearerAuth('access-token')
@Controller('listings')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post(':id/reports')
  @ApiOperation({
    summary: 'Report a listing (verified phone required, one open report per listing)',
    operationId: 'listings_reports_submit',
  })
  @ApiCreatedResponse({ type: ReportDto })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    // Placeholder so a missing body fails as VALIDATION_ERROR, not a crash.
    @Body() dto: SubmitReportDto = {} as SubmitReportDto,
  ): Promise<ReportView> {
    return this.reports.submit(user.id, id, dto);
  }
}
