/**
 * AdminTaxonomyView — 5-state component tests (§47).
 */
import { render, screen, fireEvent } from '@testing-library/react';

const pendingQ = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };
const idleMut = () => ({ isPending: false, isSuccess: false, isError: false, mutate: jest.fn(), reset: jest.fn(), error: null });
const routerReplace = jest.fn();
const retryFn = jest.fn();

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: routerReplace }) }));
jest.mock('@/features/auth', () => { const a = jest.requireActual('@/features/auth'); return { ...a, useAuthBootstrap: jest.fn() }; });
jest.mock('../hooks', () => ({
  useAdminCategories: jest.fn(), useCreateCategory: jest.fn(), useUpdateCategory: jest.fn(), useDeleteCategory: jest.fn(),
  useAdminAttributes: jest.fn(() => ({ ...pendingQ, data: [] })), useCreateAttribute: jest.fn(), useUpdateAttribute: jest.fn(), useDeleteAttribute: jest.fn(),
  useCreateOption: jest.fn(), useUpdateOption: jest.fn(), useDeleteOption: jest.fn(),
}));

import { AdminTaxonomyView } from '../components/admin-taxonomy-view';
import { useAuthBootstrap } from '@/features/auth';
import { useAdminCategories, useAdminAttributes, useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateAttribute, useUpdateAttribute, useDeleteAttribute, useCreateOption, useUpdateOption, useDeleteOption } from '../hooks';

function auth(s: string, u: unknown = null) { (useAuthBootstrap as jest.Mock).mockReturnValue({ status: s, user: u, retry: retryFn }); }
function mutStub(fn: jest.Mock) { fn.mockReturnValue(idleMut()); }

beforeEach(() => {
  jest.clearAllMocks();
  auth('checking');
  (useAdminCategories as jest.Mock).mockReturnValue(pendingQ);
  (useAdminAttributes as jest.Mock).mockReturnValue({ ...pendingQ, data: [] });
  [useCreateCategory, useUpdateCategory, useDeleteCategory, useCreateAttribute, useUpdateAttribute, useDeleteAttribute, useCreateOption, useUpdateOption, useDeleteOption].forEach(mutStub);
});

describe('AdminTaxonomyView', () => {
  it('1. checking → spinner', () => { auth('checking'); render(<AdminTaxonomyView />); expect(screen.getByText(/بررسی نشست|در حال انتقال/i)).toBeInTheDocument(); });
  it('2. anonymous → redirects', () => { auth('anonymous'); render(<AdminTaxonomyView />); expect(routerReplace).toHaveBeenCalledWith(expect.stringContaining('/auth/login')); });
  it('3. unreachable → error + retry', () => { auth('unreachable'); render(<AdminTaxonomyView />); expect(screen.getByText(/ارتباط|برقرار نشد/i)).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: /تلاش/i })); expect(retryFn).toHaveBeenCalled(); });
  it('4. USER → access denied', () => { auth('ready', { id: 'u', phone: '09', displayName: 'U', role: 'USER', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01' }); render(<AdminTaxonomyView />); expect(screen.getByText(/دسترسی/i)).toBeInTheDocument(); });
  it('5. ready + data → renders category panel', () => {
    auth('ready', { id: 'a', phone: '09', displayName: 'A', role: 'ADMIN', status: 'ACTIVE', phoneVerified: true, phoneVerifiedAt: null, createdAt: '2026-01-01T00:00:00Z' });
    (useAdminCategories as jest.Mock).mockReturnValue({ ...pendingQ, isPending: false, isSuccess: true, data: [{ id: 'c1', name: 'الکترونیک', slug: 'electronics', parentId: null, status: 'ACTIVE', sortOrder: 0, createdAt: '2026-01-01' }] });
    render(<AdminTaxonomyView />);
    expect(screen.getByText('دسته‌بندی‌ها')).toBeInTheDocument();
    expect(screen.getByText('الکترونیک')).toBeInTheDocument();
  });
});