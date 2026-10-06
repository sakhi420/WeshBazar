/**
 * Swagger response shapes for analytics (spec §71–§72, §106, §162).
 * Mirrors `common/presenters/analytics.presenter.ts` — swagger-only.
 */
import { ApiProperty } from '@nestjs/swagger';

export class DailyCountDto {
  @ApiProperty({ example: '2026-10-04' })
  date!: string;

  @ApiProperty({ example: 12 })
  count!: number;
}

export class DailyStatPointDto {
  @ApiProperty({ example: '2026-10-04' })
  date!: string;

  @ApiProperty({ example: 120 })
  views!: number;

  @ApiProperty({ example: 4 })
  phoneClicks!: number;

  @ApiProperty({ example: 2 })
  whatsappClicks!: number;

  @ApiProperty({ example: 0 })
  telegramClicks!: number;

  @ApiProperty({ example: 3 })
  favoriteAdds!: number;

  @ApiProperty({ example: 1 })
  reports!: number;
}

export class EngagementTotalsDto {
  @ApiProperty()
  views!: number;

  @ApiProperty()
  phoneClicks!: number;

  @ApiProperty()
  whatsappClicks!: number;

  @ApiProperty()
  telegramClicks!: number;

  @ApiProperty()
  favoriteAdds!: number;

  @ApiProperty()
  reports!: number;
}

export class AdminDashboardUsersDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  suspended!: number;

  @ApiProperty()
  banned!: number;

  @ApiProperty()
  newLast7Days!: number;
}

export class AdminDashboardListingsDto {
  @ApiProperty({
    example: { DRAFT: 3, PENDING_REVIEW: 1, ACTIVE: 20, REJECTED: 0, SOLD: 4, ARCHIVED: 2 },
  })
  byStatus!: Record<string, number>;

  @ApiProperty()
  newLast7Days!: number;

  @ApiProperty()
  publishedLast7Days!: number;

  @ApiProperty()
  soldLast7Days!: number;
}

export class AdminDashboardReportsDto {
  @ApiProperty()
  open!: number;

  @ApiProperty()
  underReview!: number;

  @ApiProperty()
  createdLast7Days!: number;
}

export class AdminDashboardDto {
  @ApiProperty({ format: 'date-time' })
  generatedAt!: Date;

  @ApiProperty({ type: AdminDashboardUsersDto })
  users!: AdminDashboardUsersDto;

  @ApiProperty({ type: AdminDashboardListingsDto })
  listings!: AdminDashboardListingsDto;

  @ApiProperty({ type: AdminDashboardReportsDto })
  reports!: AdminDashboardReportsDto;
}

export class MarketplaceSummaryListingsDto {
  @ApiProperty({ type: [DailyCountDto] })
  created!: DailyCountDto[];

  @ApiProperty({ type: [DailyCountDto] })
  published!: DailyCountDto[];

  @ApiProperty()
  totalCreated!: number;

  @ApiProperty()
  totalPublished!: number;
}

export class MarketplaceSummaryUsersDto {
  @ApiProperty({ type: [DailyCountDto] })
  registered!: DailyCountDto[];

  @ApiProperty()
  totalRegistered!: number;
}

export class MarketplaceEngagementDto {
  @ApiProperty({ type: [DailyStatPointDto] })
  daily!: DailyStatPointDto[];

  @ApiProperty({ type: EngagementTotalsDto })
  totals!: EngagementTotalsDto;
}

export class MarketplaceSummaryDto {
  @ApiProperty({ example: '2026-09-05' })
  from!: string;

  @ApiProperty({ example: '2026-10-04' })
  to!: string;

  @ApiProperty({ type: MarketplaceSummaryListingsDto })
  listings!: MarketplaceSummaryListingsDto;

  @ApiProperty({ type: MarketplaceSummaryUsersDto })
  users!: MarketplaceSummaryUsersDto;

  @ApiProperty({ type: MarketplaceEngagementDto })
  engagement!: MarketplaceEngagementDto;
}

export class SellerSummaryListingsDto {
  @ApiProperty({
    example: { DRAFT: 1, PENDING_REVIEW: 0, ACTIVE: 4, REJECTED: 1, SOLD: 2, ARCHIVED: 0 },
  })
  byStatus!: Record<string, number>;

  @ApiProperty()
  total!: number;
}

export class SellerSummaryLifetimeDto {
  @ApiProperty()
  views!: number;

  @ApiProperty()
  favoriteCount!: number;
}

export class SellerTopListingDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SOLD', 'ARCHIVED'] })
  status!: string;

  @ApiProperty()
  lifetimeViews!: number;

  @ApiProperty()
  rangeViews!: number;
}

export class SellerSummaryDto {
  @ApiProperty({ example: '2026-09-05' })
  from!: string;

  @ApiProperty({ example: '2026-10-04' })
  to!: string;

  @ApiProperty({ type: SellerSummaryListingsDto })
  listings!: SellerSummaryListingsDto;

  @ApiProperty({ type: SellerSummaryLifetimeDto })
  lifetime!: SellerSummaryLifetimeDto;

  @ApiProperty({ type: MarketplaceEngagementDto })
  rangeEngagement!: MarketplaceEngagementDto;

  @ApiProperty({ type: [SellerTopListingDto] })
  topListings!: SellerTopListingDto[];
}
