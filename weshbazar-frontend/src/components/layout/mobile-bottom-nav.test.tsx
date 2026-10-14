/**
 * MobileBottomNav — primary tab rendering (HF-TEST-001, §103).
 *
 * Verifies the tab destinations (incl. the /categories fix), the auth-aware
 * account tab, and the admin tab gating.
 */

import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

let mockPathname = '/';

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));
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

import { MobileBottomNav } from './mobile-bottom-nav';

function authStub(status: string, user: unknown = null) {
  (useAuth as jest.Mock).mockReturnValue({ status, user });
}

const adminUser = { id: 'u-1', phone: '0912', displayName: 'احمد', role: 'ADMIN' };
const normalUser = { id: 'u-2', phone: '0913', displayName: 'مریم', role: 'USER' };

describe('MobileBottomNav', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
  });

  it('links the «دسته‌ها» tab to /categories (HF-NAV-001)', () => {
    authStub('anonymous');
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'دسته‌ها' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: 'خانه' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'جستجو' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'نشان‌ها' })).toHaveAttribute('href', '/favorites');
  });

  it('account tab → /auth/login for a guest', () => {
    authStub('anonymous');
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('href', '/auth/login');
  });

  it('account tab → /account when signed in', () => {
    authStub('ready', normalUser);
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('href', '/account');
  });

  it('shows the admin tab for staff', () => {
    authStub('ready', adminUser);
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'مدیریت' })).toHaveAttribute('href', '/admin');
  });

  it('hides the admin tab for non-staff', () => {
    authStub('ready', normalUser);
    render(<MobileBottomNav />);
    expect(screen.queryByRole('link', { name: 'مدیریت' })).not.toBeInTheDocument();
  });

  it('marks the active tab (HF-A11Y non-color indicator)', () => {
    mockPathname = '/categories';
    authStub('anonymous');
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'دسته‌ها' })).toHaveClass('border-primary');
  });
});