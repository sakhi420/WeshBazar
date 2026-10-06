/**
 * Listing reports (spec §56–§57).
 *
 * Reports are gated by authentication, a FRESH verified-phone check (token
 * claims can be stale for up to their TTL), a per-user rate limit and
 * duplicate prevention backed by the partial unique index
 * `Report_reporter_user_listing_open_key` — at most one unresolved report per
 * reporter+listing, enforced by PostgreSQL, not by application races.
 *
 * Duplicate attempts are logged; together with the rate limiter this is the
 * §57 abuse-protection layer for the open MVP.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception';
import { isUniqueViolation } from '../../common/errors/prisma-errors';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import { toReportView, type ReportView } from '../../common/presenters/report.presenter';
import type { AppConfig } from '../../config/config.types';
import { PrismaService } from '../../database/prisma.service';
import { ListingStatsService } from '../analytics/listing-stats.service';
import { SubmitReportDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly rateLimit: AppConfig['rateLimit'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
    private readonly stats: ListingStatsService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.rateLimit = configService.get('rateLimit', { infer: true });
  }

  async submit(userId: string, listingId: string, dto: SubmitReportDto): Promise<ReportView> {
    this.rateLimitService.enforce('report:create:user', userId, this.rateLimit.reportPerWindow);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, deletedAt: true, phoneVerifiedAt: true },
    });
    if (!user || user.deletedAt !== null) {
      throw new AppException('UNAUTHORIZED');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppException('ACCOUNT_NOT_ACTIVE');
    }
    if (user.phoneVerifiedAt === null) {
      throw new AppException('PHONE_NOT_VERIFIED');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        status: true,
        deletedAt: true,
        sellerAccount: { select: { status: true, ownerUserId: true } },
      },
    });
    if (!listing || listing.deletedAt !== null) {
      throw new AppException('LISTING_NOT_FOUND');
    }
    // Reviewing your own content is moderation's job, not a report.
    if (listing.sellerAccount.ownerUserId === userId) {
      throw new AppException('CANNOT_REPORT_OWN_LISTING');
    }
    // Only states the reporter could see publicly are reportable (§110);
    // moderation state never leaks through this endpoint.
    if (
      listing.sellerAccount.status !== 'ACTIVE' ||
      (listing.status !== 'ACTIVE' && listing.status !== 'SOLD')
    ) {
      throw new AppException('LISTING_NOT_FOUND');
    }

    const description = dto.description?.trim();
    const report = await this.prisma.$transaction(async (tx) => {
      try {
        const created = await tx.report.create({
          data: {
            reporterUserId: userId,
            listingId: listing.id,
            // Feeds the Phase 11 "suspicious users" queue (§59).
            reportedUserId: listing.sellerAccount.ownerUserId,
            reason: dto.reason,
            description: description === undefined || description.length === 0 ? null : description,
            status: 'OPEN',
          },
        });
        await this.stats.record(listing.id, 'reports', created.createdAt, tx);
        return created;
      } catch (error) {
        if (isUniqueViolation(error, 'Report_reporter_user_listing_open_key')) {
          // §57 abuse logging: repeat reports for one listing are the earliest
          // signal of a reporting flood.
          this.logger.warn(`Duplicate open report by user ${userId} for listing ${listing.id}.`);
          throw new AppException('REPORT_ALREADY_OPEN');
        }
        throw error;
      }
    });
    return toReportView(report);
  }
}
