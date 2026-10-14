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

import { MobileHeader } from './mobile-header';

describe('MobileHeader', () => {
  it('exposes a search entry linking to /search (HF-NAV-004)', () => {
    render(<MobileHeader />);
    expect(screen.getByRole('link', { name: 'جست‌وجو' })).toHaveAttribute('href', '/search');
  });

  it('keeps the logo link and sell action', () => {
    render(<MobileHeader />);
    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'جست‌وجو' })).toBeInTheDocument();
    expect(screen.getAllByRole('link').some((a) => a.getAttribute('href') === '/sell')).toBe(true);
  });
});