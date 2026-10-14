/**
 * HelpPage content tests (§4الف). Verifies the quick-start steps exist and the
 * steps that have routes link to the real pages.
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

import HelpPage from './page';

describe('HelpPage', () => {
  it('links routed quick-start steps to real pages', () => {
    render(<HelpPage />);
    expect(screen.getByRole('link', { name: /جست‌وجو کنید/ })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: /آگهی ثبت کنید/ })).toHaveAttribute('href', '/sell');
    expect(screen.getByRole('link', { name: /مدیریت کنید/ })).toHaveAttribute('href', '/my-listings');
  });

  it('keeps in-product steps as plain text', () => {
    render(<HelpPage />);
    expect(screen.getByText('جزئیات آگهی را بررسی کنید')).toBeInTheDocument();
    expect(screen.getByText('با فروشنده تماس بگیرید')).toBeInTheDocument();
  });
});