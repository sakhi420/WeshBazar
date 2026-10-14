/**
 * AdminUsersView — 5-state component tests (§46, §128).
 *
 * States: checking→spinner | anonymous→redirect | unreachable→retry
 *         USER→access denied | ready+data→table rows
 *
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';

// ---- Mutable references for per-test mock overrides -------------------------
const idleMut = () => ({ isPending: false, isSuccess: false, isError: false, mutate: jest.fn(), reset: jest.fn(), error: null });
const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };

const routerReplace = jest.fn();
const retryFn = jest.fn();
const setPage = jest.fn();

// ---- Module mocks -----------------------------------------------------------
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('nuqs', () => ({
  useQueryState: jest.fn(() => [null, setPage]),
  parseAsInteger: jest.fn(),
  parseAsString: jest.fn(),
}));
jest.mock('@/features/auth', () => {
  const actual = jest.requireActual('@/features/auth');
  return { ...actual, useAuthBootstrap: jest.fn() };
});
jest.mock('../hooks', () => ({
  useAdminUsers: jest.fn(),
  useSuspendUser: jest.fn(),
  useBanUser: jest.fn(),
  useRestoreUser: jest.fn(),
  useAdminUserDetail: jest.fn(),
}));

import { AdminUsersView } from '../components/admin-users-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminUsers, useSuspendUser, useBanUser, useRestoreUser, useAdminUserDetail } from '../hooks';

// ---- Helpers ----------------------------------------------------------------
function authStub(status: string, user: unknown = null) {
  (useAuthBootstrap as jest.Mock).mockReturnValue({ status, user, retry: retryFn });
}
function stubUsers(q: unknown) { (useAdminUsers as jest.Mock).mockReturnValue(q); }
function stubMut(fn: jest.Mock, overrides?: Record<string, unknown>) { fn.mockReturnValue({ ...idleMut(), ...overrides }); }

beforeEach(() => {
  jest.clearAllMocks();
  authStub('checking');
  stubUsers(pendingQ);
  stubMut(useSuspendUser as jest.Mock);
  stubMut(useBanUser as jest.Mock);
  stubMut(useRestoreUser as jest.Mock);
  (useAdminUserDetail as jest.Mock).mockReturnValue(pendingQ);
});

// ---- Tests ------------------------------------------------------------------
describe('AdminUsersView', () => {
  it('1. checking → renders spinner', () => {
    authStub('checking');
    render(<AdminUsersView />);
    expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument();
  });

  it('2. anonymous → redirects to login', () => {
    authStub('anonymous');
    render(<AdminUsersView />);
    expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login'));
  });

  it('3. unreachable → shows error with retry', () => {
    authStub('unreachable');
    render(<AdminUsersView />);
    expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /تلاش/i });
    fireEvent.click(btn);
    expect(retryFn).toHaveBeenCalled();
  });

  it('4. USER role → renders access denied', () => {
    authStub('ready', { id: 'u-1', phone: '0912', displayName: 'User', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' });
    render(<AdminUsersView />);
    expect(screen.getByText(/دسترسی/i)).toBeInTheDocument();
  });

  it('5. ready + data → renders table with user row', () => {
    authStub('ready', { id: 'u-1', phone: '0912', displayName: 'Admin', role: 'ADMIN', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    const item = { id: 'a', displayName: 'کاربر تست', phone: '0912', role: 'ADMIN', status: 'ACTIVE' as const, phoneVerified: true, activeListings: 2, createdAt: '2026-01-01T00:00:00Z' };
    stubUsers({ ...pendingQ, isPending: false, isSuccess: true, data: { items: [item], total: 1, totalPages: 1, page: 1, limit: 20 } });
    render(<AdminUsersView />);
    expect(screen.getByText('کاربر تست')).toBeInTheDocument();
    expect(screen.getByText('مدیر')).toBeInTheDocument();
  });
});