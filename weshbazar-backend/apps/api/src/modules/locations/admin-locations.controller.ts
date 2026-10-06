/**
 * Admin location management (spec §106): province CRUD and city CRUD under
 * `/admin`. All routes require the LOCATION_MANAGE permission (§61); UUID
 * route params are checked by `ParseUUIDPipe`.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { resolveLocale } from '../../common/utils/locale.utils';
import { requestAuditContext, type AuditActor } from '../audit/audit.service';
import {
  CreateCityDto,
  CreateProvinceDto,
  UpdateCityDto,
  UpdateProvinceDto,
} from './dto/location.dto';
import { AdminCityDto, AdminProvinceDto } from './dto/location-responses.dto';
import { LocationsService } from './locations.service';

/** Actor + request facts for the §62 audit row these commands write. */
function auditActor(user: AuthenticatedUser, request: FastifyRequest): AuditActor {
  return { actorUserId: user.id, ...requestAuditContext(request) };
}

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@RequirePermissions('LOCATION_MANAGE')
export class AdminLocationsController {
  constructor(private readonly locations: LocationsService) {}

  // --- Provinces -------------------------------------------------------------------

  @Get('provinces')
  @ApiOperation({ summary: 'List all provinces (any status) with translations and city counts', operationId: 'admin_locations_listProvinces' })
  @ApiOkResponse({ type: [AdminProvinceDto] })
  listProvinces(
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['listProvincesAdmin']> {
    return this.locations.listProvincesAdmin(resolveLocale(query.locale));
  }

  @Post('provinces')
  @ApiOperation({
    summary: 'Create a province (slug generated from the English name when omitted)',
    operationId: 'admin_locations_createProvince',
  })
  @ApiCreatedResponse({ type: AdminProvinceDto })
  createProvince(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Body() dto: CreateProvinceDto,
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['createProvince']> {
    return this.locations.createProvince(
      dto,
      resolveLocale(query.locale),
      auditActor(user, request),
    );
  }

  @Patch('provinces/:id')
  @ApiOperation({ summary: 'Update a province', operationId: 'admin_locations_updateProvince' })
  @ApiOkResponse({ type: AdminProvinceDto })
  updateProvince(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProvinceDto,
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['updateProvince']> {
    return this.locations.updateProvince(
      id,
      dto,
      resolveLocale(query.locale),
      auditActor(user, request),
    );
  }

  @Delete('provinces/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a province (blocked while cities or listings exist)', operationId: 'admin_locations_deleteProvince' })
  @ApiNoContentResponse()
  deleteProvince(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.locations.deleteProvince(id, auditActor(user, request));
  }

  // --- Cities ------------------------------------------------------------------------

  @Get('provinces/:provinceId/cities')
  @ApiOperation({ summary: 'List all cities of a province (any status)', operationId: 'admin_locations_listCities' })
  @ApiOkResponse({ type: [AdminCityDto] })
  listCities(
    @Param('provinceId', new ParseUUIDPipe()) provinceId: string,
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['listCitiesAdmin']> {
    return this.locations.listCitiesAdmin(provinceId, resolveLocale(query.locale));
  }

  @Post('provinces/:provinceId/cities')
  @ApiOperation({
    summary: 'Create a city in a province (slug generated from the English name when omitted)',
    operationId: 'admin_locations_createCity',
  })
  @ApiCreatedResponse({ type: AdminCityDto })
  createCity(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('provinceId', new ParseUUIDPipe()) provinceId: string,
    @Body() dto: CreateCityDto,
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['createCity']> {
    return this.locations.createCity(
      provinceId,
      dto,
      resolveLocale(query.locale),
      auditActor(user, request),
    );
  }

  @Patch('cities/:id')
  @ApiOperation({ summary: 'Update a city', operationId: 'admin_locations_updateCity' })
  @ApiOkResponse({ type: AdminCityDto })
  updateCity(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCityDto,
    @Query() query: LocaleQueryDto,
  ): ReturnType<LocationsService['updateCity']> {
    return this.locations.updateCity(
      id,
      dto,
      resolveLocale(query.locale),
      auditActor(user, request),
    );
  }

  @Delete('cities/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a city (blocked while listings exist)', operationId: 'admin_locations_deleteCity' })
  @ApiNoContentResponse()
  deleteCity(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.locations.deleteCity(id, auditActor(user, request));
  }
}
