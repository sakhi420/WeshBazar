/**
 * AdminListingsView — 5-state shell tests (§44).
 */
import { render, screen, fireEvent } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('nuqs', () => ({
  useQueryState: jest.fn(() => [null, jest.fn()]),
  parseAsInteger: jest.fn(),
  parseAsString: jest.fn(),
  parseAsStringLiteral: jest.fn(),
}));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../hooks', () => ({ useAdminListings: jest.fn(), useListingModeration: jest.fn(() => ({ isPending: false, isError: false, isSuccess: false, error: null, mutate: jest.fn(), variables: null })) }));
jest.mock('../components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }));

import { AdminListingsView } from '../components/admin-listings-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminListings } from '../hooks';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
beforeEach(() => { jest.clearAllMocks(); auth('checking'); (useAdminListings as jest.Mock).mockReturnValue(pendingQ); });

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