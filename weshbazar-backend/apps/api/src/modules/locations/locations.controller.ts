/**
 * Public location API (spec §108): provinces and the cities of a province.
 * Anonymous; only ACTIVE provinces/cities are returned.
 */
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import { resolveLocale } from '../../common/utils/locale.utils';
import { PublicCitySummaryDto, PublicProvinceSummaryDto } from './dto/location-responses.dto';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Public()
  @Get('provinces')
  @ApiOperation({
    summary: 'List active provinces (localized names)',
    operationId: 'locations_listProvinces',
  })
  @ApiOkResponse({ type: [PublicProvinceSummaryDto] })
  listProvinces(@Query() query: LocaleQueryDto): ReturnType<LocationsService['listProvinces']> {
    return this.locations.listProvinces(resolveLocale(query.locale));
  }

  @Public()
  @Get('provinces/:provinceId/cities')
  @ApiOperation({
    summary: 'List active cities of an active province',
    operationId: 'locations_listCities',
  })
  @ApiOkResponse({ type: [PublicCitySummaryDto] })
  listCities(
    @Param('provinceId') provinceId: string,
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['listCities']> {
    return this.locations.listCities(provinceId, resolveLocale(query.locale));
  }
}
