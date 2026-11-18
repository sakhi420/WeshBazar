/**
 * MobileHeader — mobile header entry points.
 * The market homepage supplies its own prominent search panel; other routes
 * retain the compact global search row.
 */

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockUsePathname = jest.fn();

jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

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
    return <a href={href} {...rest}>{children}</a>;
  };
});
jest.mock('@/components/layout/header-auth-actions', () => ({
  HeaderAuthActions: () => <div data-testid="auth-actions" />,
}));
jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <div data-testid="search-field" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

import { MobileHeader } from './mobile-header';

describe('MobileHeader', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it('omits the duplicate search row on the marketplace homepage', () => {
    mockUsePathname.mockReturnValue('/market');
    render(<MobileHeader />);

    expect(screen.queryByTestId('search-field')).not.toBeInTheDocument();
    expect(screen.queryByTestId('location-picker')).not.toBeInTheDocument();
  });

  it('keeps the global search row on other mobile routes', () => {
    mockUsePathname.mockReturnValue('/search');
    render(<MobileHeader />);

    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
  });

  it('keeps the logo link and sell action', () => {
    mockUsePathname.mockReturnValue('/market');
    render(<MobileHeader />);

    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/market');
    expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/sell')).toBe(true);
  });
});
