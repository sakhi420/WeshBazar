/**
 * Buyer → seller contact action (spec §54, §160).
 *
 * The endpoint is anonymous — "ensure buyer can contact seller without
 * requiring registration" — and hides every contact value behind an explicit
 * action so clicks are measurable and traffic is rate-limited per IP. The
 * four gates mirror the spec order: active listing, enabled method, eligible
 * seller account, then the click is recorded.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../../common/errors/app.exception';
import { RateLimitService } from '../../common/rate-limit/rate-limit.service';
import type { AppConfig } from '../../config/config.types';
import { PrismaService } from '../../database/prisma.service';
import type { ListingContactType } from '../../generated/prisma/enums';
import { CONTACT_CLICK_COUNTERS, ListingStatsService } from '../analytics/listing-stats.service';
import { resolveContactValue } from '../listings/contact-methods';
import { isExpiredActiveListing } from '../listings/listing-visibility';

/** Sanitized contact target — the only place a contact value is revealed. */
export interface ContactTargetView {
  method: ListingContactType;
  value: string;
}

@Injectable()
export class ContactsService {
  private readonly rateLimit: AppConfig['rateLimit'];

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
    private readonly stats: ListingStatsService,
    configService: ConfigService<AppConfig, true>,
  ) {
    this.rateLimit = configService.get('rateLimit', { infer: true });
  }

  async reveal(
    listingId: string,
    method: ListingContactType,
    clientIp: string,
  ): Promise<ContactTargetView> {
    this.rateLimitService.enforce('contact:create:ip', clientIp, this.rateLimit.contactPerWindow);

    const row = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        deletedAt: true,
        sellerAccount: {
          select: {
            status: true,
            owner: { select: { phoneNormalized: true, phoneVerifiedAt: true } },
          },
        },
        contactMethods: { select: { type: true, enabled: true, valueOverride: true } },
      },
    });
    // Listings hidden from discovery (deleted, suspended seller) never
    // reveal contact data — the caller cannot even learn they exist.
    if (!row || row.deletedAt !== null || row.sellerAccount.status !== 'ACTIVE') {
      throw new AppException('LISTING_NOT_FOUND');
    }
    // §70/§164: an expired ACTIVE listing is unreachable for buyers even
    // before the expiration job flips it to ARCHIVED.
    if (row.status !== 'ACTIVE' || isExpiredActiveListing(row, new Date())) {
      throw new AppException('LISTING_NOT_ACTIVE');
    }

    // Only a verified phone may back PHONE/WHATSAPP fallbacks (§53).
    const owner = row.sellerAccount.owner;
    const sellerPhone = owner.phoneVerifiedAt === null ? null : owner.phoneNormalized;
    const value = resolveContactValue(method, row.contactMethods, sellerPhone);
    if (value === null) {
      throw new AppException('CONTACT_METHOD_NOT_FOUND');
    }

    // §72: the click lands in today's (UTC) analytic row for the listing.
    await this.stats.record(row.id, CONTACT_CLICK_COUNTERS[method]);
    return { method, value };
  }
}
