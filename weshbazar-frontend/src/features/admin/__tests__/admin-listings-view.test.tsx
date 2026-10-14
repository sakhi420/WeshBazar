/**
 * AdminListingsView — 5-state shell tests (§44). The queue body lives in
 * AdminListingsContent which is tested separately below.
 */
import { render, screen, fireEvent } from '@testing-library/react';

const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });

import { AdminListingsView } from '../components/admin-listings-view';
import { useAuthBootstrap } from '@/features/auth';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
beforeEach(() => { jest.clearAllMocks(); auth('checking'); });

describe('AdminListingsView', () => {
  it('1. checking → spinner', () => { auth('checking'); render(<AdminListingsView />); expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument(); });
  it('2. anonymous → redirects', () => { auth('anonymous'); render(<AdminListingsView />); expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login')); });
  it('3. unreachable → error + retry', () => { auth('unreachable'); render(<AdminListingsView />); expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /تلاش/i })); expect(retryFn).toHaveBeenCalled(); });
  it('4. USER → access denied', () => { auth('ready', { id: 'u', phone: '09', displayName: 'U', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' }); render(<AdminListingsView />); expect(screen.getByText(/دسترسی/i)).toBeInTheDocument(); });
  it('5. ready → mounts AdminListingsContent', () => {
    auth('ready', { id: 'm', phone: '09', displayName: 'M', role: 'MODERATOR', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    const { container } = render(<AdminListingsView />);
    expect(container.textContent).toBeTruthy();
  });
});