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

  it('ready as USER → account + logout, no admin link', () => {
    authStub('ready', { ...baseUser, displayName: 'مریم' });
    render(<HeaderAuthActions />);
    expect(screen.getByText('مریم')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مریم/ })).toHaveAttribute('href', '/account');
    expect(screen.queryByLabelText('پنل مدیریت')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'خروج از حساب' })).toBeInTheDocument();
  });

  it('ready as ADMIN → shows the admin panel link', () => {
    authStub('ready', { ...baseUser, displayName: 'احمد', role: 'ADMIN' });
    render(<HeaderAuthActions />);
    expect(screen.getByRole('link', { name: 'پنل مدیریت' })).toHaveAttribute('href', '/admin');
  });

  it('logout → calls performLogout', () => {
    authStub('ready', { ...baseUser, displayName: 'مریم' });
    render(<HeaderAuthActions />);
    fireEvent.click(screen.getByRole('button', { name: 'خروج از حساب' }));
    expect(performLogout).toHaveBeenCalled();
  });

  it('anonymous → shows the login link', () => {
    authStub('anonymous');
    render(<HeaderAuthActions />);
    expect(screen.getByRole('link', { name: 'ورود به حساب' })).toHaveAttribute('href', '/auth/login');
  });
});