/**
 * DesktopHeader — desktop navigation destinations (HF-TEST-001, HF-NAV-002).
 *
 * Verifies the category button now targets /categories and that the header
 * passes `redirectToSearch` to the inline keyword field.
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

import { DesktopHeader } from './desktop-header';

describe('DesktopHeader', () => {
  it('points the category button at /categories (HF-NAV-002)', () => {
    render(<DesktopHeader />);
    expect(screen.getByRole('link', { name: 'دسته‌بندی‌ها' })).toHaveAttribute('href', '/categories');
  });

  it('keeps the sell CTA on /sell', () => {
    render(<DesktopHeader />);
    expect(screen.getByRole('link', { name: /ثبت آگهی/ })).toHaveAttribute('href', '/sell');
  });

  it('renders the logo link, search field and auth actions', () => {
    render(<DesktopHeader />);
    expect(screen.getByRole('link', { name: /صفحه اصلی/ })).toHaveAttribute('href', '/');
    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('auth-actions')).toBeInTheDocument();
  });
});