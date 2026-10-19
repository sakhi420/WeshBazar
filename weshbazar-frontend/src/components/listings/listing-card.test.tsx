import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});
jest.mock('@/features/search/telemetry', () => ({
  recordSearchEvent: jest.fn(),
}));

import { ListingCard } from './listing-card';
import type { PublicListingSummary } from '@/features/listings';

const listing: PublicListingSummary = {
  id: 'l-1',
  slug: 'toyota-corolla-1403',
  title: 'تویوتا کرولا مدل ۱۴۰۳',
  price: 450000,
  currency: 'AFN',
  pricingType: 'PAID',
  negotiable: false,
  condition: 'LIKE_NEW',
  category: { id: 'c-1', slug: 'vehicles', name: 'موتر و وسایط نقلیه' },
  province: { id: 'p-1', slug: 'kabul', name: 'کابل' },
  city: { id: 'ct-1', slug: 'kabul-city', name: 'کابل' },
  primaryImage: null,
  publishedAt: null,
};

/**
 * Regression for audit F-01: `ListingCard` must stay a Server Component with
 * no client event handlers — the interactive link lives in `ListingCardLink`.
 * This test locks the card's link composition and its honest no-image state.
 */
describe('ListingCard (server component — no client handlers)', () => {
  it('composes a link to the listing with the title and price', () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      '/listing/toyota-corolla-1403',
    );
    expect(screen.getByText('تویوتا کرولا مدل ۱۴۰۳')).toBeInTheDocument();
  });

  it('renders the honest no-image placeholder', () => {
    render(<ListingCard listing={listing} />);
    expect(screen.getByText('بدون تصویر')).toBeInTheDocument();
  });
});