/**
 * Public search-telemetry API (owner decision D3): `POST /search/zero-results`.
 * Anonymous and rate-limited per client IP.
 */
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import { SearchTelemetryService } from './search-telemetry.service';
import { SearchZeroResultDto, SearchZeroResultResponseDto } from './dto/zero-result.dto';

@ApiTags('search-telemetry')
@Controller('search')
export class SearchTelemetryController {
  constructor(private readonly telemetry: SearchTelemetryService) {}

  @Public()
  @Post('zero-results')
  @ApiOperation({
    summary: 'Record a zero-result search intent (lightweight telemetry)',
    operationId: 'search_recordZeroResult',
  })
  @ApiCreatedResponse({ type: SearchZeroResultResponseDto })
  recordZeroResult(
    @Req() request: FastifyRequest,
    @Body() dto: SearchZeroResultDto,
  ): SearchZeroResultResponseDto {
    this.telemetry.recordZeroResult(dto, request.ip);
    return { recorded: true };
  }
}