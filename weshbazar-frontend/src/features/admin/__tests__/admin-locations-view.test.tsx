/**
 * AdminLocationsView — 5-state component tests (§48).
 */
import { render, screen, fireEvent } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const idleMut = () => ({ isPending: false, isSuccess: false, isError: false, mutate: jest.fn(), reset: jest.fn(), error: null });
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../hooks', () => ({
  useAdminProvinces: jest.fn(), useCreateProvince: jest.fn(), useUpdateProvince: jest.fn(), useDeleteProvince: jest.fn(),
  useAdminCities: jest.fn(), useCreateCity: jest.fn(), useUpdateCity: jest.fn(), useDeleteCity: jest.fn(),
}));

import { AdminLocationsView } from '../components/admin-locations-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminProvinces, useCreateProvince, useUpdateProvince, useDeleteProvince, useCreateCity, useUpdateCity, useDeleteCity } from '../hooks';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
function mutStub(fn: jest.Mock) { fn.mockReturnValue(idleMut()); }

beforeEach(() => {
  jest.clearAllMocks();
  auth('checking');
  (useAdminProvinces as jest.Mock).mockReturnValue(pendingQ);
  [useCreateProvince as jest.Mock, useUpdateProvince as jest.Mock, useDeleteProvince as jest.Mock, useCreateCity as jest.Mock, useUpdateCity as jest.Mock, useDeleteCity as jest.Mock].forEach(mutStub);
});

describe('AdminLocationsView', () => {
  it('1. checking → spinner', () => { auth('checking'); render(<AdminLocationsView />); expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument(); });
  it('2. anonymous → redirects', () => { auth('anonymous'); render(<AdminLocationsView />); expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login')); });
  it('3. unreachable → error + retry', () => { auth('unreachable'); render(<AdminLocationsView />); expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /تلاش/i })); expect(retryFn).toHaveBeenCalled(); });
  it('4. USER → access denied', () => { auth('ready', { id: 'u', phone: '09', displayName: 'U', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' }); render(<AdminLocationsView />); expect(screen.getByText(/دسترسی/i)).toBeInTheDocument(); });
  it('5. ready + data → renders province list', () => {
    auth('ready', { id: 'a', phone: '09', displayName: 'A', role: 'ADMIN', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    (useAdminProvinces as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: [{ id: 'p1', name: 'کابل', slug: 'kabul', status: 'ACTIVE', sortOrder: 0, createdAt: '2026-01-01' }] });
    render(<AdminLocationsView />);
    expect(screen.getByText('مکان‌ها')).toBeInTheDocument();
    expect(screen.getByText('کابل')).toBeInTheDocument();
  });
});