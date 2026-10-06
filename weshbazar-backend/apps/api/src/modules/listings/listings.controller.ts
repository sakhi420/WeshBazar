/**
 * Seller listing API (spec §107, §157).
 *
 * Every route is world-writable only through explicit commands — there is no
 * endpoint that assigns a raw `status`; the state machine lives in the
 * service (see `listings.service.ts`). Public discovery reads
 * (`GET /listings`, `GET /listings/:slug`) live in `discovery.controller.ts`;
 * the owner single-listing read lives at `GET /me/listings/:id` so the public
 * `/:slug` route can own the bare path.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import type { CursorPaginated } from '../../common/http/pagination';
import type { ListingRevisionView, OwnerListing } from '../../common/presenters/listing.presenter';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { resolveLocale } from '../../common/utils/locale.utils';
import {
  CreateListingDto,
  ListingCommandDto,
  RevisionsQueryDto,
  UpdateListingDto,
} from './dto/listing.dto';
import { ListingRevisionDto, OwnerListingDto } from './dto/listing-responses.dto';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@ApiBearerAuth('access-token')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a listing draft', operationId: 'listings_create' })
  @ApiCreatedResponse({ type: OwnerListingDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    // A missing body must fail as VALIDATION_ERROR (400), not a 500 — the
    // pipe validates this placeholder against the required fields.
    @Body() dto: CreateListingDto = {} as CreateListingDto,
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.createDraft(user.id, dto, resolveLocale(query.locale));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a listing (material changes may re-enter review)', operationId: 'listings_update' })
  @ApiOkResponse({ type: OwnerListingDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateListingDto = {},
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.updateForOwner(user.id, id, dto, resolveLocale(query.locale));
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit the listing for review (publishes under auto-approve)', operationId: 'listings_submit' })
  @ApiOkResponse({ type: OwnerListingDto })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ListingCommandDto = {},
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.submitForReview(user.id, id, dto, resolveLocale(query.locale));
  }

  @Post(':id/mark-sold')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an active listing as sold', operationId: 'listings_markSold' })
  @ApiOkResponse({ type: OwnerListingDto })
  markSold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ListingCommandDto = {},
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.markSold(user.id, id, dto, resolveLocale(query.locale));
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive an active listing', operationId: 'listings_archive' })
  @ApiOkResponse({ type: OwnerListingDto })
  archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ListingCommandDto = {},
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.archive(user.id, id, dto, resolveLocale(query.locale));
  }

  @Post(':id/renew')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renew an active listing or republish an archived one', operationId: 'listings_renew' })
  @ApiOkResponse({ type: OwnerListingDto })
  renew(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ListingCommandDto = {},
    @Query() query: LocaleQueryDto,
  ): Promise<OwnerListing> {
    return this.listings.renew(user.id, id, dto, resolveLocale(query.locale));
  }

  @Get(':id/revisions')
  @ApiOperation({ summary: 'Listing revision history (newest first)', operationId: 'listings_listRevisions' })
  @ApiOkResponse({ type: [ListingRevisionDto] })
  listRevisions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() query: RevisionsQueryDto,
  ): Promise<CursorPaginated<ListingRevisionView>> {
    return this.listings.listRevisions(user.id, id, query);
  }
}
