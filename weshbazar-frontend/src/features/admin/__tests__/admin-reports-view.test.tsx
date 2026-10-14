/**
 * AdminReportsView — 5-state component tests (§45).
 */
import { render, screen, fireEvent } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('nuqs', () => ({ useQueryState: jest.fn(() => [null, jest.fn()]), parseAsInteger: jest.fn(), parseAsStringLiteral: jest.fn() }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../hooks', () => ({ useAdminReports: jest.fn(), useResolveReport: jest.fn(() => ({ isPending: false, isSuccess: false, isError: false, error: null, mutate: jest.fn(), reset: jest.fn() })), useDismissReport: jest.fn(() => ({ isPending: false, isSuccess: false, isError: false, error: null, mutate: jest.fn(), reset: jest.fn() })) }));
jest.mock('../components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }));

import { AdminReportsView } from '../components/admin-reports-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminReports } from '../hooks';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
beforeEach(() => { jest.clearAllMocks(); auth('checking'); (useAdminReports as jest.Mock).mockReturnValue(pendingQ); });

describe('AdminReportsView', () => {
  it('1. checking → spinner', () => { auth('checking'); render(<AdminReportsView />); expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument(); });
  it('2. anonymous → redirects', () => { auth('anonymous'); render(<AdminReportsView />); expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login')); });
  it('3. unreachable → error + retry', () => { auth('unreachable'); render(<AdminReportsView />); expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /تلاش/i })); expect(retryFn).toHaveBeenCalled(); });
  it('4. USER → access denied', () => { auth('ready', { id: 'u', phone: '09', displayName: 'U', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' }); render(<AdminReportsView />); expect(document.body.textContent).toContain('دسترسی'); });
  it('5. ready + data → renders report cards', () => {
    auth('ready', { id: 'u', phone: '09', displayName: 'M', role: 'MODERATOR', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    (useAdminReports as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: { items: [{ id: 'r', reason: 'SPAM', status: 'OPEN', description: '', listing: { title: 'آگهی تست' }, reporter: { displayName: 'گزارش‌دهنده' }, createdAt: '2026-01-01T00:00:00Z' }], total: 1, totalPages: 1, page: 1, limit: 20 } });
    render(<AdminReportsView />);
    expect(document.body.textContent).toContain('هرزنامه');
    expect(document.body.textContent).toContain('آگهی تست');
  });
});