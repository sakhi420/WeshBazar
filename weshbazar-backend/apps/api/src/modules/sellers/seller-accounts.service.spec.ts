/**
 * Unit tests for the public seller-listings feed (owner decision D1).
 *
 * Covers the three contract edges that are pure logic and mockable without a
 * database: invalid slug → 404, malformed cursor → validation error, and a
 * moderated/inactive seller staying indistinguishable from a missing one.
 * Also pins the pagination wiring (newest-first, take=limit+1).
 */
import type { Locale } from '../../common/utils/locale.utils';
import type { PrismaService } from '../../database/prisma.service';
import type { StorageProvider } from '../../providers/storage/storage.provider';
import { SellerAccountsService } from './seller-accounts.service';

const LOCALE: Locale = 'fa';

function activeSeller(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'seller-id',
    slug: 'active-seller',
    status: 'ACTIVE',
    owner: { status: 'ACTIVE', deletedAt: null },
    ...overrides,
  };
}

function makeService(options: { findUnique?: jest.Mock; findMany?: jest.Mock } = {}) {
  const findUnique = options.findUnique ?? jest.fn();
  const findMany = options.findMany ?? jest.fn();
  const prisma = {
    sellerAccount: { findUnique },
    listing: { findMany },
  } as unknown as PrismaService;
  const storage = {
    getPublicUrl: jest.fn(() => 'https://cdn.example/media/x.jpg'),
  } as unknown as StorageProvider;

  return { service: new SellerAccountsService(prisma, storage), findUnique, findMany };
}

describe('SellerAccountsService.getPublicListingsBySlug', () => {
  it('returns SELLER_ACCOUNT_NOT_FOUND for an invalid slug', async () => {
    const { service } = makeService();

    await expect(service.getPublicListingsBySlug('Not A Slug!', {}, LOCALE)).rejects.toMatchObject({
      code: 'SELLER_ACCOUNT_NOT_FOUND',
    });
  });

  it('throws VALIDATION_ERROR for a malformed cursor', async () => {
    const { service } = makeService({ findUnique: jest.fn().mockResolvedValue(activeSeller()) });

    await expect(
      service.getPublicListingsBySlug('active-seller', { cursor: '!!bad!!' }, LOCALE),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('hides a moderated/inactive seller as SELLER_ACCOUNT_NOT_FOUND', async () => {
    const { service } = makeService({
      findUnique: jest.fn().mockResolvedValue(activeSeller({ status: 'REJECTED' })),
    });

    await expect(service.getPublicListingsBySlug('active-seller', {}, LOCALE)).rejects.toMatchObject({
      code: 'SELLER_ACCOUNT_NOT_FOUND',
    });
  });

  it('paginates newest-first with take=limit+1 over the active seller', async () => {
    const findUnique = jest.fn().mockResolvedValue(activeSeller());
    const findMany = jest.fn().mockResolvedValue([]);
    const { service } = makeService({ findUnique, findMany });

    const page = await service.getPublicListingsBySlug('active-seller', { limit: 24 }, LOCALE);

    expect(page.items).toEqual([]);
    expect(page.meta).toEqual({ nextCursor: null, hasMore: false, limit: 24 });

    const args = (
      findMany.mock.calls[0] as unknown as [
        {
          where: { sellerAccountId: string; deletedAt: null };
          orderBy: Array<{ createdAt: string; id: string }>;
          take: number;
        },
      ]
    )[0];
    expect(args.where).toMatchObject({ sellerAccountId: 'seller-id', deletedAt: null });
    expect(args.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
    expect(args.take).toBe(25);
  });
});