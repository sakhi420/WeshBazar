/**
 * Unit tests for the listing analytics counters (spec §72).
 *
 * The UTC day boundary is the point of `utcDay`: "today" must not depend on
 * the server locale, and every event must upsert exactly one row per
 * (listing, UTC day) with an atomic increment.
 */
import type { PrismaService } from '../../database/prisma.service';
import { CONTACT_CLICK_COUNTERS, ListingStatsService, utcDay } from './listing-stats.service';

function createWriter(): { writer: object; upsert: jest.Mock } {
  const upsert = jest.fn().mockResolvedValue({});
  return { writer: { listingDailyStat: { upsert } }, upsert };
}

describe('utcDay', () => {
  it('returns midnight UTC of the same UTC day', () => {
    expect(utcDay(new Date('2026-10-04T23:59:59.999Z')).toISOString()).toBe(
      '2026-10-04T00:00:00.000Z',
    );
  });

  it('uses the UTC calendar for instants that cross local midnight', () => {
    // 2026-10-05 00:30 in Kabul (+04:30) is still 2026-10-04 in UTC.
    expect(utcDay(new Date('2026-10-05T00:30:00+04:30')).toISOString()).toBe(
      '2026-10-04T00:00:00.000Z',
    );
  });
});

describe('ListingStatsService', () => {
  it('upserts the (listingId, date) row and increments one counter', async () => {
    const { writer, upsert } = createWriter();
    const service = new ListingStatsService(writer as unknown as PrismaService);

    await service.record('listing-1', 'phoneClicks', new Date('2026-10-04T10:20:30.000Z'));

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith({
      where: {
        listingId_date: { listingId: 'listing-1', date: new Date('2026-10-04T00:00:00.000Z') },
      },
      create: {
        listingId: 'listing-1',
        date: new Date('2026-10-04T00:00:00.000Z'),
        phoneClicks: 1,
      },
      update: { phoneClicks: { increment: 1 } },
    });
  });

  it('writes through an explicit transaction writer when provided', async () => {
    const { writer, upsert } = createWriter();
    const service = new ListingStatsService({} as unknown as PrismaService);

    await service.record(
      'listing-1',
      'favoriteAdds',
      new Date(),
      writer as unknown as PrismaService,
    );

    expect(upsert).toHaveBeenCalledTimes(1);
  });

  it('maps every contact method to its click counter column', () => {
    expect(CONTACT_CLICK_COUNTERS).toEqual({
      PHONE: 'phoneClicks',
      WHATSAPP: 'whatsappClicks',
      TELEGRAM: 'telegramClicks',
    });
  });
});
