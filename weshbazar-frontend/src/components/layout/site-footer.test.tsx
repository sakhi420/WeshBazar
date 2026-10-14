/**
 * SiteFooter — link-group rendering (HF-TEST-001, HF-FTR-002).
 *
 * Verifies the three navigation groups and that the help/safety/contact links
 * point at the pages that now exist.
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

import { SiteFooter } from './site-footer';

describe('SiteFooter', () => {
  it('renders the بازار, حساب and راهنما groups', () => {
    render(<SiteFooter />);
    expect(screen.getByText('بازار')).toBeInTheDocument();
    expect(screen.getByText('حساب')).toBeInTheDocument();
    expect(screen.getByText('راهنما')).toBeInTheDocument();
  });

  it('anchors the help links to real pages (HF-FTR-002)', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'درباره ما' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'نکات ایمنی' })).toHaveAttribute('href', '/help/safety');
    expect(screen.getByRole('link', { name: 'مرکز راهنمایی' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'تماس با ما' })).toHaveAttribute('href', '/contact');
  });

  it('keeps the existing marketplace links intact', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('link', { name: 'جست‌وجوی آگهی‌ها' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'ثبت آگهی' })).toHaveAttribute('href', '/sell');
  });
});