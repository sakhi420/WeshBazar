/**
 * Admin listing moderation (spec §58, §59, §106) — the queue, the detail
 * read and the four moderation commands.
 *
 * Reads and the queue need LISTING_REVIEW (the review workflow); each
 * command carries its own permission via `@RequirePermissions`, so ARCHIVE
 * and RESTORE stay admin-only while moderators keep approve/reject (§59).
 * Commands delegate to `ListingsService` — the state machine, moderation
 * record and audit row all commit there, atomically.
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
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import type { PagePaginated } from '../../common/http/pagination';
import type {
  AdminListingDetailView,
  AdminListingItemView,
} from '../../common/presenters/admin.presenter';
import type { OwnerListing } from '../../common/presenters/listing.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { resolveLocale } from '../../common/utils/locale.utils';
import { requestAuditContext } from '../audit/audit.service';
import { OwnerListingDto } from '../listings/dto/listing-responses.dto';
import { ListingsService } from '../listings/listings.service';
import { AdminListingsService } from './admin-listings.service';
import { AdminListingDetailDto, AdminListingItemDto } from './dto/admin-responses.dto';
import {
  AdminListingsQueryDto,
  ModerationNoteDto,
  RejectListingDto,
} from './dto/admin-listings.dto';

@ApiTags('admin')
@ApiBearerAuth('access-token')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(
    private readonly adminListings: AdminListingsService,
    private readonly listings: ListingsService,
  ) {}

  @Get()
  @RequirePermissions('LISTING_REVIEW')
  @ApiOperation({
    summary: 'Moderation queue (default PENDING_REVIEW FIFO; reported=true for open reports)',
    operationId: 'admin_listings_queue',
  })
  @ApiOkResponse({ type: [AdminListingItemDto] })
  queue(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AdminListingsQueryDto,
  ): Promise<PagePaginated<AdminListingItemView>> {
    return this.adminListings.queue(query, user.role, resolveLocale(query.locale));
  }

  @Get(':id')
  @RequirePermissions('LISTING_REVIEW')
  @ApiOperation({
    summary: 'Listing detail any state, with moderation trail',
    operationId: 'admin_listings_detail',
  })
  @ApiOkResponse({ type: AdminListingDetailDto })
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: LocaleQueryDto,
  ): Promise<AdminListingDetailView> {
    return this.adminListings.detail(id, user.role, resolveLocale(query.locale));
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LISTING_REVIEW')
  @ApiOperation({
    summary: 'Approve a pending listing and publish it',
    operationId: 'admin_listings_approve',
  })
  @ApiOkResponse({ type: OwnerListingDto })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    // Placeholder so a missing body fails as VALIDATION_ERROR, not a crash.
    @Body() dto: ModerationNoteDto = {},
    @Query() query: LocaleQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<OwnerListing> {
    return this.listings.approve(user.id, id, resolveLocale(query.locale), {
      note: dto.note ?? null,
      ...requestAuditContext(request),
    });
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LISTING_REJECT')
  @ApiOperation({
    summary: 'Reject a pending listing with a machine-readable reason',
    operationId: 'admin_listings_reject',
  })
  @ApiOkResponse({ type: OwnerListingDto })
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectListingDto = {} as RejectListingDto,
    @Query() query: LocaleQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<OwnerListing> {
    return this.listings.reject(
      user.id,
      id,
      { reason: dto.reason, note: dto.note ?? null },
      resolveLocale(query.locale),
      requestAuditContext(request),
    );
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LISTING_ARCHIVE')
  @ApiOperation({
    summary: 'Take down a live listing (admin archive)',
    operationId: 'admin_listings_archive',
  })
  @ApiOkResponse({ type: OwnerListingDto })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ModerationNoteDto = {},
    @Query() query: LocaleQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<OwnerListing> {
    return this.listings.archiveByAdmin(user.id, id, resolveLocale(query.locale), {
      note: dto.note ?? null,
      ...requestAuditContext(request),
    });
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('LISTING_ARCHIVE')
  @ApiOperation({
    summary: 'Restore an archived listing with a fresh runway',
    operationId: 'admin_listings_restore',
  })
  @ApiOkResponse({ type: OwnerListingDto })
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ModerationNoteDto = {},
    @Query() query: LocaleQueryDto,
    @Req() request: FastifyRequest,
  ): Promise<OwnerListing> {
    return this.listings.restoreByAdmin(user.id, id, resolveLocale(query.locale), {
      note: dto.note ?? null,
      ...requestAuditContext(request),
    });
  }
}
