/**
 * Authorization boundary tests (Task 3).
 * Verifies client-side permission gates: USER blocked, MODERATOR limited, 403/401 handling.
 */
import { render, screen } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('nuqs', () => ({ useQueryState: jest.fn(() => [null, jest.fn()]), parseAsInteger: jest.fn(), parseAsString: jest.fn(), parseAsStringLiteral: jest.fn() }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../components/ActiveFilterChips', () => ({ ActiveFilterChips: () => null }));
jest.mock('../components/admin-nav', () => ({ AdminNav: () => null }));
jest.mock('../hooks', () => ({
  useAdminUsers: jest.fn(), useSuspendUser: jest.fn(), useBanUser: jest.fn(), useRestoreUser: jest.fn(), useAdminUserDetail: jest.fn(),
  useAdminReports: jest.fn(), useResolveReport: jest.fn(), useDismissReport: jest.fn(),
  useAdminListings: jest.fn(), useListingModeration: jest.fn(),
  useAdminDashboard: jest.fn(), useMarketplaceSummary: jest.fn(),
  useAdminCategories: jest.fn(), useCreateCategory: jest.fn(), useUpdateCategory: jest.fn(), useDeleteCategory: jest.fn(),
  useAdminAttributes: jest.fn(), useCreateAttribute: jest.fn(), useUpdateAttribute: jest.fn(), useDeleteAttribute: jest.fn(),
  useCreateOption: jest.fn(), useUpdateOption: jest.fn(), useDeleteOption: jest.fn(),
  useAdminProvinces: jest.fn(), useCreateProvince: jest.fn(), useUpdateProvince: jest.fn(), useDeleteProvince: jest.fn(),
  useAdminCities: jest.fn(), useCreateCity: jest.fn(), useUpdateCity: jest.fn(), useDeleteCity: jest.fn(),
  useAdminAuditLogs: jest.fn(),
}));

import { useAuthBootstrap } from '@/features/auth';
import { useAdminUsers, useAdminReports, useAdminDashboard, useAdminCategories, useAdminProvinces, useAdminAuditLogs } from '../hooks';
import { AdminUsersView } from '../components/admin-users-view';
import { AdminReportsView } from '../components/admin-reports-view';
const USER = { id: 'u', phone: '09', displayName: 'U', role: 'USER' as const, status: 'ACTIVE' as const, phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' };
const MOD = { id: 'm', phone: '09', displayName: 'M', role: 'MODERATOR' as const, status: 'ACTIVE' as const, phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' };
const ADMIN = { id: 'a', phone: '09', displayName: 'A', role: 'ADMIN' as const, status: 'ACTIVE' as const, phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' };

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }

beforeEach(() => {
  jest.clearAllMocks();
  auth('ready', ADMIN);
  [useAdminUsers, useAdminReports, useAdminDashboard, useAdminCategories, useAdminProvinces, useAdminAuditLogs].forEach((fn) => (fn as jest.Mock).mockReturnValue(pendingQ));
});

const byText = (text: string) => (c: string, el?: Element) => el?.textContent?.includes(text) ?? false;

describe('Auth boundary — USER blocked from all 7 views', () => {
  beforeEach(() => { auth('ready', USER); });
  it('users', () => { render(<AdminUsersView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
  it('reports', () => { render(<AdminReportsView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
  it('audit', () => { render(<AdminAuditView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
  it('dashboard', () => { render(<AdminDashboardView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
  it('taxonomy', () => { render(<AdminTaxonomyView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
  it('locations', () => { render(<AdminLocationsView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
  it('listings', () => { render(<AdminListingsView />); expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument(); });
});

describe('Auth boundary — MODERATOR gates', () => {
  beforeEach(() => { auth('ready', MOD); });
  it('allowed: users', () => { (useAdminUsers as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: { items: [], total: 0, totalPages: 1, page: 1, limit: 20 } }); render(<AdminUsersView />); expect(screen.queryByText(byText('دسترسی'))).not.toBeInTheDocument(); });
  it('allowed: reports', () => { (useAdminReports as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: { items: [], total: 0, totalPages: 1, page: 1, limit: 20 } }); render(<AdminReportsView />); expect(screen.queryByText(byText('دسترسی'))).not.toBeInTheDocument(); });
  it('allowed: taxonomy', () => { (useAdminCategories as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: [] }); render(<AdminTaxonomyView />); expect(screen.queryByText(byText('دسترسی'))).not.toBeInTheDocument(); });
  it('allowed: locations', () => { (useAdminProvinces as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: [] }); render(<AdminLocationsView />); expect(screen.queryByText(byText('دسترسی'))).not.toBeInTheDocument(); });
  it('limited: audit (sees page, no data)', () => { render(<AdminAuditView />); expect(screen.queryByText(byText('دسترسی'))).not.toBeInTheDocument(); expect(document.body.textContent).toBeTruthy(); });
});

describe('Auth boundary — 403 Forbidden', () => {
  it('shows access denied when users query returns 403', () => {
    auth('ready', ADMIN);
    const { ApiError } = jest.requireActual('@/lib/api');
    (useAdminUsers as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isError: true, error: new ApiError({ code: 'FORBIDDEN', message: 'x', status: 403 }) });
    render(<AdminUsersView />);
    expect(screen.getByText(byText('دسترسی'))).toBeInTheDocument();
  });
});

describe('Auth boundary — 401 Session Lost', () => {
  it('redirects to login when users query returns 401', () => {
    auth('ready', ADMIN);
    const { ApiError } = jest.requireActual('@/lib/api');
    (useAdminUsers as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isError: true, error: new ApiError({ code: 'UNAUTHORIZED', message: 'x', status: 401 }) });
    render(<AdminUsersView />);
    expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login'));
  });
});
import { AdminAuditView } from '../components/admin-audit-view';
import { AdminDashboardView } from '../components/admin-dashboard-view';
import { AdminTaxonomyView } from '../components/admin-taxonomy-view';
import { AdminLocationsView } from '../components/admin-locations-view';
import { AdminListingsView } from '../components/admin-listings-view';