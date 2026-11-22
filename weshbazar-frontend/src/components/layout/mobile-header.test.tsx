/**
 * MobileHeader — shared compact app chrome and contextual search shortcut.
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

import { MobileHeader } from './mobile-header';

describe('MobileHeader', () => {
  beforeEach(() => {
    mockUsePathname.mockReset();
  });

  it('keeps the homepage header minimal because the hero owns search', () => {
    mockUsePathname.mockReturnValue('/market');
    render(<MobileHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/market');
    expect(screen.queryByRole('link', { name: 'جستجو' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ثبت آگهی' })).toHaveAttribute('href', '/sell');
    expect(screen.getByTestId('auth-actions')).toBeInTheDocument();
  });

  it('shows a compact search shortcut on internal routes, not a second search row', () => {
    mockUsePathname.mockReturnValue('/listing/some-item');
    const { container } = render(<MobileHeader />);

    expect(screen.getByRole('link', { name: 'جستجو' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'ثبت آگهی' })).toHaveAttribute('href', '/sell');
    expect(screen.queryByPlaceholderText('چی می‌خواهی پیدا کنی؟')).not.toBeInTheDocument();

    const header = container.querySelector('header');
    expect(header?.children).toHaveLength(1);
    expect(header?.firstElementChild).toHaveClass('h-header');
  });
});
