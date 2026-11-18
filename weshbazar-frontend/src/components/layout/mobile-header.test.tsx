/**
 * MobileHeader — shared compact app chrome on every marketplace route.
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
  it('renders the same compact one-row header without a duplicate search row', () => {
    const { container } = render(<MobileHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/market');
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href') === '/sell')).toBe(true);
    expect(screen.getByTestId('auth-actions')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('چی می‌خواهی پیدا کنی؟')).not.toBeInTheDocument();
    expect(screen.queryByText('انتخاب شهر')).not.toBeInTheDocument();

    const header = container.querySelector('header');
    expect(header?.children).toHaveLength(1);
    expect(header?.firstElementChild).toHaveClass('h-header');
  });
});
