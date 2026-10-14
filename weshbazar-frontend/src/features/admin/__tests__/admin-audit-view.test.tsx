/**
 * AdminAuditView — 5-state component tests (§51).
 */
import { render, screen, fireEvent } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('nuqs', () => ({ useQueryState: jest.fn(() => [null, jest.fn()]), parseAsInteger: jest.fn(), parseAsString: jest.fn() }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../hooks', () => ({ useAdminAuditLogs: jest.fn() }));
jest.mock('../components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }));

import { AdminAuditView } from '../components/admin-audit-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminAuditLogs } from '../hooks';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
beforeEach(() => { jest.clearAllMocks(); auth('checking'); (useAdminAuditLogs as jest.Mock).mockReturnValue(pendingQ); });

describe('AdminAuditView', () => {
  it('1. checking → spinner', () => { auth('checking'); render(<AdminAuditView />); expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument(); });
  it('2. anonymous → redirects', () => { auth('anonymous'); render(<AdminAuditView />); expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login')); });
  it('3. unreachable → error + retry', () => { auth('unreachable'); render(<AdminAuditView />); expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /تلاش/i })); expect(retryFn).toHaveBeenCalled(); });
  it('4. USER → access denied', () => { auth('ready', { id: 'u', phone: '09', displayName: 'U', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' }); render(<AdminAuditView />); expect(document.body.textContent).toContain('دسترسی'); });
  it('5. ready + data → renders audit table', () => {
    auth('ready', { id: 'u', phone: '09', displayName: 'A', role: 'ADMIN', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    (useAdminAuditLogs as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: { items: [{ id: 'a1', action: 'USER_SUSPENDED', entityType: 'User', entityId: 'u1', actorUserId: 'm1', createdAt: '2026-01-01T00:00:00Z' }], total: 1, totalPages: 1, page: 1, limit: 20 } });
    render(<AdminAuditView />);
    expect(document.body.textContent).toContain('تعلیق کاربر');
  });
});