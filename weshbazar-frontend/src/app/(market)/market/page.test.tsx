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
      <h1>هر چی می‌خواهی، از همین‌جا پیدا کن</h1>
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


  it('uses real cursor metadata to make the 12 newest listings a clear preview', async () => {
    mockFetchListingsServer.mockResolvedValue({
      items: Array.from({ length: 12 }, (_, index) => ({ id: `l-${index + 1}` })),
      nextCursor: 'next-page',
      hasMore: true,
      total: 24,
    });

    const element = await HomePage();
    render(element);

    expect(screen.getByText('نمایش ۱۲ از ۲۴')).toBeInTheDocument();
    expect(screen.getByText(/از میان ۲۴ آگهی، ۱۲ مورد تازه در این پیش‌نمایش آمده است/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /دیدن همهٔ آگهی‌ها/ })).toHaveAttribute(
      'href',
      '/search?sort=newest',
    );
    expect(screen.getByRole('link', { name: /ادامهٔ دیدن آگهی‌ها/ })).toHaveAttribute(
      'href',
      '/search?sort=newest',
    );
  });

  it('does not promise more listings when the cursor page has no next page', async () => {
    mockFetchListingsServer.mockResolvedValue({
      items: [{ id: 'l-1' }, { id: 'l-2' }, { id: 'l-3' }],
      nextCursor: null,
      hasMore: false,
      total: 3,
    });

    const element = await HomePage();
    render(element);

    expect(screen.getByText('نمایش ۳ از ۳')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /دیدن همهٔ آگهی‌ها/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /ادامهٔ دیدن آگهی‌ها/ })).not.toBeInTheDocument();
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