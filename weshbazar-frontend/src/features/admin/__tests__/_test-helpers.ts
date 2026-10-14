/**
 * Shared test helpers for admin component tests.
 */
import type { UserSummary } from '@/features/auth';
import { ApiError } from '@/lib/api';

// ---- Auth mocks ------------------------------------------------------------

export interface AuthState {
  status: 'checking' | 'ready' | 'anonymous' | 'unreachable';
  user: UserSummary | null;
  retry: () => void;
}

export const mockUser = (overrides?: Partial<UserSummary>): UserSummary => ({
  id: 'u-1',
  phone: '09123456789',
  displayName: 'تست ادمین',
  role: 'ADMIN',
  status: 'ACTIVE',
  phoneVerified: true,
  phoneVerifiedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

export const mockAuth = (overrides?: Partial<AuthState>): AuthState => ({
  status: 'ready',
  user: mockUser(),
  retry: jest.fn(),
  ...overrides,
});

// ---- Query result factories ------------------------------------------------

export const emptyPage = { items: [], total: 0, totalPages: 0, page: 1, limit: 20 };

export const pendingQuery = { isPending: true, isError: false, isSuccess: false, isFetching: false, isPlaceholderData: false, data: undefined, error: null, refetch: jest.fn() };

export const errorQuery = (code = 'INTERNAL_ERROR', status = 500) => ({
  isPending: false, isError: true, isSuccess: false, isFetching: false, isPlaceholderData: false,
  data: undefined,
  error: new ApiError({ code, message: 'Server error', status }),
  refetch: jest.fn(),
});

export const forbiddenQuery = () => errorQuery('FORBIDDEN', 403);

export const sessionLostQuery = () => errorQuery('UNAUTHORIZED', 401);

// ---- Router mock -----------------------------------------------------------

export const mockRouter = () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn(), prefetch: jest.fn() });

// ---- Mutation mock ---------------------------------------------------------

export const idleMutation = () => ({
  isPending: false, isSuccess: false, isError: false,
  mutate: jest.fn(), reset: jest.fn(), error: null,
});