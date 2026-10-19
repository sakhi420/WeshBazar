/**
 * useSearchSuggestions — live-preview hook (debounce + AbortController + gating).
 *
 * The listing fetch is mocked so these tests verify timing/cancellation behavior
 * without a network dependency.
 */

import { act, renderHook } from '@testing-library/react';
import { useSearchSuggestions } from './use-search-suggestions';

jest.mock('@/features/listings', () => ({
  fetchListings: jest.fn(),
}));

// eslint-disable-next-line import/first
import { fetchListings } from '@/features/listings';

const mockFetchListings = fetchListings as jest.Mock;

describe('useSearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces and fetches a live preview with a cancelable signal', async () => {
    mockFetchListings.mockResolvedValue({
      items: [{ slug: 'a', title: 'تویوتا' }],
      nextCursor: null,
      hasMore: false,
    });

    const { result } = renderHook(() => useSearchSuggestions('توی', true));

    expect(mockFetchListings).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(mockFetchListings).toHaveBeenCalledTimes(1);
    expect(mockFetchListings).toHaveBeenCalledWith(
      { q: 'توی', limit: 5 },
      expect.any(AbortSignal),
    );
    expect(result.current).toEqual({
      listings: [{ kind: 'listing', label: 'تویوتا', slug: 'a' }],
      loading: false,
    });
  });

  it('skips fetching for queries shorter than 2 characters or when disabled', async () => {
    const { rerender } = renderHook(
      ({ q, enabled }: { q: string; enabled: boolean }) => useSearchSuggestions(q, enabled),
      { initialProps: { q: 'ت', enabled: true } },
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockFetchListings).not.toHaveBeenCalled();

    // Two characters but gated off: still no request.
    rerender({ q: 'توی', enabled: false });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockFetchListings).not.toHaveBeenCalled();
  });

  it('cancels the previous in-flight request when the query changes', async () => {
    mockFetchListings.mockResolvedValue({
      items: [{ slug: 'a', title: 'آگهی' }],
      nextCursor: null,
      hasMore: false,
    });

    const { rerender } = renderHook(({ q }) => useSearchSuggestions(q, true), {
      initialProps: { q: 'توی' },
    });

    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(mockFetchListings).toHaveBeenCalledTimes(1);

    const firstSignal = mockFetchListings.mock.calls[0][1] as AbortSignal;

    act(() => {
      rerender({ q: 'تویوتا' });
    });
    expect(firstSignal.aborted).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(250);
    });
    expect(mockFetchListings).toHaveBeenCalledTimes(2);
    expect((mockFetchListings.mock.calls[1][1] as AbortSignal).aborted).toBe(false);
  });

  it('swallows fetch errors without throwing', async () => {
    mockFetchListings.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useSearchSuggestions('توی', true));

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toEqual({ listings: [], loading: false });
  });
});