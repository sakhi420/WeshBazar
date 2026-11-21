/**
 * AboutPage content tests (§4ب). Verifies the mission/scope honesty and the
 * founder attribution + safety link.
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

import AboutPage from './page';

describe('AboutPage', () => {
  it('states the marketplace scope limits (no escrow/payment/delivery)', () => {
    render(<AboutPage />);
    expect(screen.getByText(/ویش‌بازار چه کاری انجام نمی‌دهد/)).toBeInTheDocument();
    expect(screen.getByText(/نگهداری پول/)).toBeInTheDocument();
  });

  it('attributes the founder', () => {
    render(<AboutPage />);
    expect(screen.getByText(/نثار احمد سخی نژاد/)).toBeInTheDocument();
  });

  it('links to the safety guide', () => {
    render(<AboutPage />);
    expect(screen.getByRole('link', { name: /نکات ایمنی/ })).toHaveAttribute('href', '/help/safety');
  });
});