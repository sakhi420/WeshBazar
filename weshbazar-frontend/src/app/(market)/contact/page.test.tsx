/**
 * ContactPage content tests. Verifies the real, owner-provided support
 * channels render as correct mailto/tel links.
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

import ContactPage from './page';

describe('ContactPage', () => {
  it('shows the support email as a mailto link', () => {
    render(<ContactPage />);
    expect(screen.getByRole('link', { name: /sakhinezhad@gmail\.com/ })).toHaveAttribute(
      'href',
      'mailto:sakhinezhad@gmail.com',
    );
  });

  it('shows the support phone as a tel link', () => {
    render(<ContactPage />);
    expect(screen.getByRole('link', { name: /0701063679/ })).toHaveAttribute(
      'href',
      'tel:0701063679',
    );
  });
});
