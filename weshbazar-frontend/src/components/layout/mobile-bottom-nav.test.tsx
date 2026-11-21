/**
 * MobileBottomNav — primary tab rendering and active-route behavior.
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

  it('shows the five primary destinations with their correct routes', () => {
    authStub('anonymous');
    render(<MobileBottomNav />);

    expect(screen.getByRole('link', { name: 'خانه' })).toHaveAttribute('href', '/market');
    expect(screen.getByRole('link', { name: 'جستجو' })).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: 'دسته‌ها' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: 'علاقه‌ها' })).toHaveAttribute('href', '/favorites');
    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('href', '/auth/login');
    expect(screen.getAllByRole('link')).toHaveLength(5);
  });

  it('routes the account tab to /account when signed in', () => {
    authStub('ready', normalUser);
    render(<MobileBottomNav />);
    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('href', '/account');
  });

  it('keeps staff tools out of the primary tabs and marks account active on admin routes', () => {
    mockPathname = '/admin/listings';
    authStub('ready', adminUser);
    render(<MobileBottomNav />);

    expect(screen.getAllByRole('link')).toHaveLength(5);
    expect(screen.queryByRole('link', { name: 'مدیریت' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks category detail routes as part of the categories destination', () => {
    mockPathname = '/category/vehicles';
    authStub('anonymous');
    render(<MobileBottomNav />);

    expect(screen.getByRole('link', { name: 'دسته‌ها' })).toHaveAttribute('aria-current', 'page');
  });

  it('marks account subroutes as active', () => {
    mockPathname = '/my-listings';
    authStub('ready', normalUser);
    render(<MobileBottomNav />);

    expect(screen.getByRole('link', { name: 'حساب' })).toHaveAttribute('aria-current', 'page');
  });

  it('uses an equal five-column layout with full-width touch targets', () => {
    authStub('anonymous');
    render(<MobileBottomNav />);

    const nav = screen.getByRole('navigation', { name: 'ناوبری اصلی' });
    expect(nav.querySelector('ul')).toHaveClass('grid-cols-5');
    expect(screen.getByRole('link', { name: 'خانه' })).toHaveClass('w-full', 'min-h-11');
  });
});
