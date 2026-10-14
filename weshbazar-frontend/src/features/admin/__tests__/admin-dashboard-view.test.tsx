/**
 * AdminDashboardView — 5-state component tests (§43).
 */
import { render, screen, fireEvent } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../hooks', () => ({ useAdminDashboard: jest.fn(), useMarketplaceSummary: jest.fn(() => ({ isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() })) }));

import { AdminDashboardView } from '../components/admin-dashboard-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminDashboard } from '../hooks';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
beforeEach(() => { jest.clearAllMocks(); auth('checking'); (useAdminDashboard as jest.Mock).mockReturnValue(pendingQ); });

describe('AdminDashboardView', () => {
  it('1. checking → spinner', () => { auth('checking'); render(<AdminDashboardView />); expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument(); });
  it('2. anonymous → redirects', () => { auth('anonymous'); render(<AdminDashboardView />); expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login')); });
  it('3. unreachable → error + retry', () => { auth('unreachable'); render(<AdminDashboardView />); expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /تلاش/i })); expect(retryFn).toHaveBeenCalled(); });
  it('4. USER → access denied', () => { auth('ready', { id: 'u', phone: '09', displayName: 'U', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' }); render(<AdminDashboardView />); expect(document.body.textContent).toContain('دسترسی'); });
  it('5. ready + data → renders dashboard content', () => {
    auth('ready', { id: 'u', phone: '09', displayName: 'A', role: 'ADMIN', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    (useAdminDashboard as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: { generatedAt: '2026-01-01T00:00:00Z', users: { total: 100, active: 80, suspended: 10, banned: 5, newLast7Days: 3 }, listings: { byStatus: { ACTIVE: 400, DRAFT: 20 }, newLast7Days: 15, publishedLast7Days: 10, soldLast7Days: 5 }, reports: { open: 5, underReview: 3, createdLast7Days: 7 } } });
    render(<AdminDashboardView />);
    expect(document.body.textContent).toContain('۱۰۰');
  });
});