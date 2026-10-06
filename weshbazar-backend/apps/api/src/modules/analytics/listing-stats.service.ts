/**
 * Listing analytics counters (spec §72).
 *
 * MVP analytics are aggregated per listing per UTC day — no raw event stream.
 * `ListingDailyStat` is the home for contact clicks, favorite adds and
 * submitted reports; `Listing.views` / `Listing.favoriteCount` remain the fast
 * counters read by feed and owner views. The day boundary is always UTC (the
 * database session is pinned to UTC in `PrismaService`), so "today" never
 * depends on the server locale.
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/** Counter columns of `ListingDailyStat` that events may increment (§72). */
export const LISTING_EVENT_COUNTERS = [
  'views',
  'phoneClicks',
  'whatsappClicks',
  'telegramClicks',
  'favoriteAdds',
  'reports',
] as const;

export type ListingEventCounter = (typeof LISTING_EVENT_COUNTERS)[number];

/** Contact method → its click counter column. */
export const CONTACT_CLICK_COUNTERS = {
  PHONE: 'phoneClicks',
  WHATSAPP: 'whatsappClicks',
  TELEGRAM: 'telegramClicks',
} as const satisfies Record<string, ListingEventCounter>;

/** Midnight UTC of the day `at` falls on — the `(listingId, date)` key. */
export function utcDay(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()));
}

/**
 * Minimal writer surface: the service itself or an ongoing transaction —
 * callers embed stat bumps in the transaction that owns the event.
 */
type StatsWriter = Pick<PrismaService, 'listingDailyStat'>;

@Injectable()
export class ListingStatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records one event: upserts today's row and increments the counter
   * atomically (a single statement, so concurrent events cannot lose counts).
   */
  async record(
    listingId: string,
    counter: ListingEventCounter,
    at: Date = new Date(),
    writer: StatsWriter = this.prisma,
  ): Promise<void> {
    const date = utcDay(at);
    await writer.listingDailyStat.upsert({
      where: { listingId_date: { listingId, date } },
      create: { listingId, date, [counter]: 1 },
      update: { [counter]: { increment: 1 } },
    });
  }
}
