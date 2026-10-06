/**
 * Public discovery API (spec §49, §52, §108): `GET /listings` and
 * `GET /listings/:slug`. Anonymous and rate-limited per client IP (§79).
 *
 * Route ownership: the public detail owns the bare `/:slug` path; the owner
 * single-listing read lives at `GET /me/listings/:id` so ids never collide
 * with public slugs.
 */
import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '../../common/decorators/public.decorator';
import { LocaleQueryDto } from '../../common/dto/locale-query.dto';
import type { CursorPaginated } from '../../common/http/pagination';
import type {
  PublicListingDetail,
  PublicListingSummary,
} from '../../common/presenters/public-listing.presenter';
import { resolveLocale } from '../../common/utils/locale.utils';
import { DiscoveryService } from './discovery/discovery.service';
import { PublicListingDetailDto, PublicListingSummaryDto } from './dto/discovery-responses.dto';
import { ListingDiscoveryQueryDto } from './dto/discovery.dto';

@ApiTags('listings')
@Controller('listings')
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Search active listings (q, category, province, city, price, condition, sort, attribute filters)',
    operationId: 'listings_discovery_list',
  })
  @ApiOkResponse({ type: [PublicListingSummaryDto] })
  list(
    @Req() request: FastifyRequest,
    @Query() query: ListingDiscoveryQueryDto,
  ): Promise<CursorPaginated<PublicListingSummary>> {
    return this.discovery.search(request.ip, query, resolveLocale(query.locale));
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Public listing detail by slug (ACTIVE or SOLD only)', operationId: 'listings_discovery_detail' })
  @ApiOkResponse({ type: PublicListingDetailDto })
  detail(
    @Req() request: FastifyRequest,
    @Param('slug') slug: string,
    @Query() query: LocaleQueryDto,
  ): Promise<PublicListingDetail> {
    return this.discovery.getPublicBySlug(
      slug,
      { clientIp: request.ip, userAgent: request.headers['user-agent'] ?? null },
      resolveLocale(query.locale),
    );
  }
}
