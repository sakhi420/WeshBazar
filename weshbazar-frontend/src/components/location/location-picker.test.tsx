import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const mockNuqsProvinceParam = { value: null as string | null };
jest.mock('nuqs', () => ({
  useQueryState: jest.fn((key: string) => {
    if (key === 'province') return [mockNuqsProvinceParam.value, jest.fn()];
    return [null, jest.fn()];
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

import { useQuery } from '@tanstack/react-query';
import { LocationPicker } from './location-picker';

const mockUseQuery = useQuery as jest.Mock;

let provincesResult: { data: unknown[]; isError: boolean; refetch: jest.Mock };
let citiesResult: { data: unknown[]; isError: boolean; refetch: jest.Mock };

const KABUL = { id: 'p-1', slug: 'kabul', name: 'کابل' };

function isProvincesKey(key: readonly unknown[]): boolean {
  return key[1] === 'provinces';
}

beforeEach(() => {
  jest.clearAllMocks();
  provincesResult = { data: [], isError: false, refetch: jest.fn() };
  citiesResult = { data: [], isError: false, refetch: jest.fn() };
  mockNuqsProvinceParam.value = null;
  mockUseQuery.mockImplementation(({ queryKey }: { queryKey: readonly unknown[] }) =>
    isProvincesKey(queryKey) ? provincesResult : citiesResult,
  );
});

/**
 * Regression for audit F-04: location loading failures must surface an inline
 * error + retry instead of silently rendering "انتخاب شهر".
 */
describe('LocationPicker (F-04 — error/retry + safe queryFn)', () => {
  it('shows an inline error and retry when provinces fail to load', () => {
    provincesResult.isError = true;

    render(<LocationPicker />);
    fireEvent.click(screen.getByRole('button', { name: /انتخاب شهر/ }));

    expect(screen.getByText('بارگذاری ولایت‌ها ناموفق بود')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
    expect(provincesResult.refetch).toHaveBeenCalled();
  });

  it('portals the open panel so header/hero overflow cannot clip it', () => {
    provincesResult.data = [KABUL];
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 20,
      y: 40,
      top: 40,
      left: 20,
      right: 180,
      bottom: 88,
      width: 160,
      height: 48,
      toJSON() {
        return {};
      },
    });

    render(<LocationPicker />);
    fireEvent.click(screen.getByRole('button', { name: /انتخاب شهر/ }));

    const listbox = screen.getByRole('listbox', { name: 'انتخاب ولایت و شهر' });
    expect(listbox.parentElement).toBe(document.body);
    expect(listbox).toHaveClass('fixed');
  });

  it('shows an inline error and retry when cities fail to load', () => {
    provincesResult.data = [KABUL];
    mockNuqsProvinceParam.value = 'kabul';
    citiesResult.isError = true;

    render(<LocationPicker />);
    fireEvent.click(screen.getByRole('button', { name: `موقعیت: ${KABUL.name} (همه)` }));

    expect(screen.getByText('بارگذاری شهرها ناموفق بود')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'تلاش دوباره' }));
    expect(citiesResult.refetch).toHaveBeenCalled();
  });
});