/**
 * DesktopHeader — desktop navigation destinations (HF-TEST-001, HF-NAV-002).
 *
 * The redundant category shortcut was removed from the desktop header (the home
 * carousel and mobile bottom nav now own category discovery). Verifies the sell
 * CTA stays on /sell and the header keeps logo / search / auth actions.
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
jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <div data-testid="search-field" />,
}));
jest.mock('@/components/layout/header-auth-actions', () => ({
  HeaderAuthActions: () => <div data-testid="auth-actions" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));

import { DesktopHeader } from './desktop-header';

describe('DesktopHeader', () => {
  it('no longer renders the redundant category button (HF-NAV-002)', () => {
    render(<DesktopHeader />);
    expect(screen.queryByRole('link', { name: 'دسته‌بندی‌ها' })).not.toBeInTheDocument();
  });

  it('keeps the sell CTA on /sell', () => {
    render(<DesktopHeader />);
    expect(screen.getByRole('link', { name: /ثبت آگهی/ })).toHaveAttribute('href', '/sell');
  });

  it('renders the logo link, search field and auth actions', () => {
    render(<DesktopHeader />);
    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/market');
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
    expect(screen.getByTestId('auth-actions')).toBeInTheDocument();
  });
});