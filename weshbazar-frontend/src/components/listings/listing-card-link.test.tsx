import { render, screen, fireEvent } from '@testing-library/react';
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

import { ListingCardLink } from './listing-card-link';
import { recordSearchEvent } from '@/features/search/telemetry';

/**
 * Regression for audit F-01: the card click telemetry lives in this client
 * wrapper because `ListingCard` is a Server Component and must never pass an
 * onClick across the server→client boundary (it broke `next build`).
 */
describe('ListingCardLink', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders a link to the listing', () => {
    render(
      <ListingCardLink href="/listing/foo" listingId="foo">
        <span>عنوان</span>
      </ListingCardLink>,
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/listing/foo');
  });

  it('records listing_card_opened telemetry on click', () => {
    render(
      <ListingCardLink href="/listing/foo" listingId="foo">
        <span>عنوان</span>
      </ListingCardLink>,
    );
    fireEvent.click(screen.getByRole('link'));
    expect(recordSearchEvent).toHaveBeenCalledWith({
      type: 'listing_card_opened',
      listingId: 'foo',
    });
  });
});