/**
 * MobileHeader — mobile header entry points (HF-TEST-001, HF-NAV-004).
 *
 * Verifies the mobile search entry now exists and links to /search.
 */

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
  it('exposes a keyword search field on mobile (HF-NAV-004)', () => {
    render(<MobileHeader />);
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
  });

  it('keeps the logo link and sell action', () => {
    render(<MobileHeader />);
    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/sell')).toBe(true);
  });
});