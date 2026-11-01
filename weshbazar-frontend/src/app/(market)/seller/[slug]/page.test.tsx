/**
 * Contract regression test for the public seller page metadata (CONTRACT-001).
 * Pins that the canonical URL is built from the runtime `slug` field — the
 * backend presenter + OpenAPI expose `slug`, never `sellerSlug`.
 */

import type { PublicListingSummary } from '@/features/listings';
import type { PublicSellerProfile } from '@/features/sellers';
import type { CursorPage } from '@/lib/api';

jest.mock('@/features/sellers', () => ({
  fetchSellerProfileServer: jest.fn(),
  fetchSellerProfile: jest.fn(),
  fetchSellerListingsServer: jest.fn(),
}));

import { generateMetadata } from './page';
import { fetchSellerListingsServer, fetchSellerProfileServer } from '@/features/sellers';

const mockFetchSellerProfileServer = fetchSellerProfileServer as jest.Mock;
const mockFetchSellerListingsServer = fetchSellerListingsServer as jest.Mock;

const EMPTY_PAGE: CursorPage<PublicListingSummary> = { items: [], nextCursor: null, hasMore: false };

const PROFILE: PublicSellerProfile = {
  slug: 'ahmad-wesh',
  displayName: 'Ahmad Wesh',
  bio: 'Electronics seller based in Kabul.',
  memberSince: '2024-06-01T00:00:00.000Z',
  phoneVerified: true,
  activeListingCount: 4,
  avatarUrl: null,
};

describe('SellerPage generateMetadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchSellerListingsServer.mockResolvedValue(EMPTY_PAGE);
  });

  it('builds the canonical URL from the runtime `slug` field', async () => {
    mockFetchSellerProfileServer.mockResolvedValue(PROFILE);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'ahmad-wesh' }),
    });

    expect(metadata.alternates?.canonical).toBe('/seller/ahmad-wesh');
  });

  it('falls back to the route slug when the profile cannot be loaded', async () => {
    mockFetchSellerProfileServer.mockRejectedValue(new Error('boom'));

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'ahmad-wesh' }),
    });

    expect(metadata.alternates?.canonical).toBe('/seller/ahmad-wesh');
  });
});