/**
 * Admin taxonomy management (spec §106): category CRUD, category attribute
 * CRUD and attribute option CRUD under the `/admin` namespace.
 *
 * Every route requires the CATEGORY_MANAGE permission (§61) instead of a raw
 * role string; UUID route params are validated by `ParseUUIDPipe` (malformed
 * ids never reach the DB).
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
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import {
  CreateAttributeDto,
  CreateOptionDto,
  UpdateAttributeDto,
  UpdateOptionDto,
} from './dto/attribute.dto';
import {
  AdminAttributeDto,
  AdminAttributeOptionDto,
  AdminCategoryDto,
} from './dto/taxonomy-responses.dto';
import { TaxonomyAdminService } from './taxonomy-admin.service';

/** Actor + request facts for the §62 audit row these commands write. */
function auditActor(user: AuthenticatedUser, request: FastifyRequest): AuditActor {
  return { actorUserId: user.id, ...requestAuditContext(request) };
}

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin')
@RequirePermissions('CATEGORY_MANAGE')
export class AdminTaxonomyController {
  constructor(private readonly taxonomyAdmin: TaxonomyAdminService) {}

  // --- Categories ---------------------------------------------------------------

  @Get('categories')
  @ApiOperation({ summary: 'List all categories (any status) with translation rows and counts', operationId: 'admin_taxonomy_listCategories' })
  @ApiOkResponse({ type: [AdminCategoryDto] })
  listCategories(
    @Query() query: LocaleQueryDto,
  ): ReturnType<TaxonomyAdminService['listCategories']> {
    return this.taxonomyAdmin.listCategories(resolveLocale(query.locale));
  }

  @Post('categories')
  @ApiOperation({
    summary: 'Create a category (slug generated from the English name when omitted)',
    operationId: 'admin_taxonomy_createCategory',
  })
  @ApiCreatedResponse({ type: AdminCategoryDto })
  createCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Body() dto: CreateCategoryDto,
    @Query() query: LocaleQueryDto,
  ): ReturnType<TaxonomyAdminService['createCategory']> {
    return this.taxonomyAdmin.createCategory(
      dto,
      resolveLocale(query.locale),
      auditActor(user, request),
    );
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Category detail (any status)', operationId: 'admin_taxonomy_getCategory' })
  @ApiOkResponse({ type: AdminCategoryDto })
  getCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: LocaleQueryDto,
  ): ReturnType<TaxonomyAdminService['getCategory']> {
    return this.taxonomyAdmin.getCategory(id, resolveLocale(query.locale));
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a category (parent moves are cycle-checked)', operationId: 'admin_taxonomy_updateCategory' })
  @ApiOkResponse({ type: AdminCategoryDto })
  updateCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCategoryDto,
    @Query() query: LocaleQueryDto,
  ): ReturnType<TaxonomyAdminService['updateCategory']> {
    return this.taxonomyAdmin.updateCategory(
      id,
      dto,
      resolveLocale(query.locale),
      auditActor(user, request),
    );
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category (blocked while children or listings exist)', operationId: 'admin_taxonomy_deleteCategory' })
  @ApiNoContentResponse()
  deleteCategory(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.taxonomyAdmin.deleteCategory(id, auditActor(user, request));
  }

  // --- Attributes -----------------------------------------------------------------

  @Get('categories/:id/attributes')
  @ApiOperation({ summary: 'List the attributes defined on a category (own rows, not inherited)', operationId: 'admin_taxonomy_listAttributes' })
  @ApiOkResponse({ type: [AdminAttributeDto] })
  listAttributes(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): ReturnType<TaxonomyAdminService['listAttributes']> {
    return this.taxonomyAdmin.listAttributes(id);
  }

  @Post('categories/:id/attributes')
  @ApiOperation({ summary: 'Create a category attribute', operationId: 'admin_taxonomy_createAttribute' })
  @ApiCreatedResponse({ type: AdminAttributeDto })
  createAttribute(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateAttributeDto,
  ): ReturnType<TaxonomyAdminService['createAttribute']> {
    return this.taxonomyAdmin.createAttribute(id, dto, auditActor(user, request));
  }

  @Patch('attributes/:id')
  @ApiOperation({ summary: 'Update an attribute (key/type changes blocked once listings use it)', operationId: 'admin_taxonomy_updateAttribute' })
  @ApiOkResponse({ type: AdminAttributeDto })
  updateAttribute(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAttributeDto,
  ): ReturnType<TaxonomyAdminService['updateAttribute']> {
    return this.taxonomyAdmin.updateAttribute(id, dto, auditActor(user, request));
  }

  @Delete('attributes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an attribute (blocked once listings use it)', operationId: 'admin_taxonomy_deleteAttribute' })
  @ApiNoContentResponse()
  deleteAttribute(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.taxonomyAdmin.deleteAttribute(id, auditActor(user, request));
  }

  // --- Attribute options ------------------------------------------------------------

  @Post('attributes/:id/options')
  @ApiOperation({ summary: 'Add an option to a SELECT/MULTI_SELECT attribute', operationId: 'admin_taxonomy_createOption' })
  @ApiCreatedResponse({ type: AdminAttributeOptionDto })
  createOption(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateOptionDto,
  ): ReturnType<TaxonomyAdminService['createOption']> {
    return this.taxonomyAdmin.createOption(id, dto, auditActor(user, request));
  }

  @Patch('options/:id')
  @ApiOperation({ summary: 'Update an option (value changes blocked once listings use it)', operationId: 'admin_taxonomy_updateOption' })
  @ApiOkResponse({ type: AdminAttributeOptionDto })
  updateOption(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOptionDto,
  ): ReturnType<TaxonomyAdminService['updateOption']> {
    return this.taxonomyAdmin.updateOption(id, dto, auditActor(user, request));
  }

  @Delete('options/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an option (deactivate instead once listings use it)', operationId: 'admin_taxonomy_deleteOption' })
  @ApiNoContentResponse()
  deleteOption(
    @CurrentUser() user: AuthenticatedUser,
    @Req() request: FastifyRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.taxonomyAdmin.deleteOption(id, auditActor(user, request));
  }
}
