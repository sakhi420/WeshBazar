/**
 * HeaderAuthActions — auth-state rendering (HF-TEST-001, §7, §101).
 *
 * States: checking → spinner | ready+user → account + logout (+admin)
 *         anonymous → login link.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

const performLogout = jest.fn();

jest.mock('@/components/auth/auth-provider', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null }),
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

import { HeaderAuthActions } from './header-auth-actions';

function authStub(status: string, user: unknown = null) {
  (useAuth as jest.Mock).mockReturnValue({ status, user, performLogout });
}

const baseUser = {
  id: 'u-1',
  phone: '0912',
  role: 'USER',
  status: 'ACTIVE',
  phoneVerified: true,
  phoneVerifiedAt: null,
  createdAt: '2026-01-01',
} as const;

describe('HeaderAuthActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('checking → shows a loading indicator and no actions', () => {
    authStub('checking');
    render(<HeaderAuthActions />);
    expect(screen.getByLabelText(/در حال بررسی وضعیت حساب/)).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('ready as USER → account menu (account, listings, favorites) without admin', () => {
    authStub('ready', { ...baseUser, displayName: 'مریم' });
    render(<HeaderAuthActions />);
    fireEvent.click(screen.getByRole('button', { name: /مریم/ }));
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'));
    expect(hrefs).toContain('/account');
    expect(hrefs).toContain('/my-listings');
    expect(hrefs).toContain('/favorites');
    expect(hrefs).not.toContain('/admin');
    expect(screen.getByRole('button', { name: /خروج/ })).toBeInTheDocument();
  });

  it('ready as ADMIN → menu includes the admin panel link', () => {
    authStub('ready', { ...baseUser, displayName: 'احمد', role: 'ADMIN' });
    render(<HeaderAuthActions />);
    fireEvent.click(screen.getByRole('button', { name: /احمد/ }));
    expect(screen.getByRole('link', { name: /پنل مدیریت/ })).toHaveAttribute('href', '/admin');
  });

  it('logout → calls performLogout', () => {
    authStub('ready', { ...baseUser, displayName: 'مریم' });
    render(<HeaderAuthActions />);
    fireEvent.click(screen.getByRole('button', { name: /مریم/ }));
    fireEvent.click(screen.getByRole('button', { name: /خروج/ }));
    expect(performLogout).toHaveBeenCalled();
  });

  it('anonymous → shows separate log-in and sign-up links', () => {
    authStub('anonymous');
    render(<HeaderAuthActions />);
    expect(screen.getByRole('link', { name: /ورود/ })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: /ثبت/ })).toHaveAttribute('href', '/auth/register');
  });
});