import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    ...rest
  }: {
    href: string;
    children?: ReactNode;
    [key: string]: unknown;
  }) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  };
});
jest.mock('@/features/categories', () => ({
  fetchCategoriesServer: jest.fn(),
  orderHomeCategories: jest.fn((items: unknown[]) => items),
}));
jest.mock('@/features/listings', () => ({
  fetchListingsServer: jest.fn(),
}));
jest.mock('@/components/listings/listing-grid', () => ({
  ListingGrid: () => <div data-testid="listing-grid" />,
}));
jest.mock('@/components/discovery/category-shortcut-grid', () => ({
  CategoryShortcutGrid: () => <div data-testid="category-grid" />,
}));
jest.mock('@/features/search/components/search-field', () => ({
  SearchField: () => <div data-testid="search-field" />,
}));
jest.mock('@/components/location/location-picker', () => ({
  LocationPicker: () => <div data-testid="location-picker" />,
}));
jest.mock('@/components/discovery/home-search-panel', () => ({
  HomeSearchPanel: () => (
    <div>
      <h1>بازار خرید و فروش در افغانستان</h1>
      <div data-testid="search-field" />
      <div data-testid="location-picker" />
    </div>
  ),
}));

import HomePage from './page';
import { fetchCategoriesServer } from '@/features/categories';
import { fetchListingsServer } from '@/features/listings';

const mockFetchCategoriesServer = fetchCategoriesServer as jest.Mock;
const mockFetchListingsServer = fetchListingsServer as jest.Mock;

const CATEGORIES = [{ id: 'c-1', slug: 'vehicles', name: 'موتر و وسایط نقلیه' }];

/**
 * Regression for audit F-02: a failed feed fetch must render the error state,
 * never masquerade as "no listings yet".
 */
describe('HomePage (F-02 — honest error vs empty states)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchCategoriesServer.mockResolvedValue(CATEGORIES);
  });

  it('renders the error state when the listings fetch fails', async () => {
    mockFetchListingsServer.mockRejectedValue(new Error('network down'));

    const element = await HomePage();
    render(element);

    expect(screen.getByText('آگهی‌ها بارگذاری نشد')).toBeInTheDocument();
    expect(screen.queryByText('هنوز آگهی‌ای ثبت نشده است')).not.toBeInTheDocument();
  });

  it('renders the empty state for a genuine empty feed', async () => {
    mockFetchListingsServer.mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    });

    const element = await HomePage();
    render(element);

    expect(screen.getByText('هنوز آگهی‌ای ثبت نشده است')).toBeInTheDocument();
    expect(screen.queryByText('آگهی‌ها بارگذاری نشد')).not.toBeInTheDocument();
  });


  it('makes the 12 newest listings a clear preview with two paths to the full list', async () => {
    mockFetchListingsServer.mockResolvedValue({
      items: Array.from({ length: 12 }, (_, index) => ({ id: `l-${index + 1}` })),
      nextCursor: 'next-page',
      hasMore: true,
      total: 24,
    });

    const element = await HomePage();
    render(element);

    expect(screen.getByText('۱۲ آگهی تازه')).toBeInTheDocument();
    expect(screen.getByText(/پیش‌نمایشی از ۱۲ آگهی تازه است/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مشاهده همه آگهی‌ها/ })).toHaveAttribute(
      'href',
      '/search?sort=newest',
    );
    expect(screen.getByRole('link', { name: /رفتن به فهرست کامل/ })).toHaveAttribute(
      'href',
      '/search?sort=newest',
    );
  });

  it('keeps both the keyword field and the city control on the homepage', async () => {
    mockFetchListingsServer.mockResolvedValue({
      items: [{ id: 'l-1' }],
      nextCursor: null,
      hasMore: false,
      total: 1,
    });

    const element = await HomePage();
    render(element);

    expect(screen.getByTestId('search-field')).toBeInTheDocument();
    expect(screen.getByTestId('location-picker')).toBeInTheDocument();
  });
});