import type { DiscoveryQuery } from '@/features/listings';
import {
  buildZeroResultRecovery,
  discoveryHref,
  formatResultCount,
} from './zero-result';

describe('discoveryHref', () => {
  it('returns the bare path for an empty query', () => {
    expect(discoveryHref('/search', {})).toBe('/search');
  });

  it('serializes every frozen wire parameter', () => {
    const query: DiscoveryQuery = {
      q: 'تویوتا',
      category: 'vehicles',
      province: 'kabul',
      city: 'kabul-city',
      minPrice: 100,
      maxPrice: 5000,
      condition: ['NEW', 'GOOD'],
      sort: 'price_asc',
      filter: ['year:gte:2015', 'km:lte:100000'],
    };
    const href = discoveryHref('/search', query);
    const url = new URL(href, 'https://weshbazar.test');
    expect(url.pathname).toBe('/search');
    expect(url.searchParams.get('q')).toBe('تویوتا');
    expect(url.searchParams.get('category')).toBe('vehicles');
    expect(url.searchParams.get('province')).toBe('kabul');
    expect(url.searchParams.get('city')).toBe('kabul-city');
    expect(url.searchParams.get('minPrice')).toBe('100');
    expect(url.searchParams.get('maxPrice')).toBe('5000');
    expect(url.searchParams.get('condition')).toBe('NEW,GOOD');
    expect(url.searchParams.get('sort')).toBe('price_asc');
    expect(url.searchParams.get('filter')).toBe('year:gte:2015|km:lte:100000');
  });
});

describe('formatResultCount', () => {
  it('reports an exact count when the page is complete', () => {
    expect(formatResultCount(3, false)).toBe('3 آگهی پیدا شد');
  });

  it('reports "more than N" when more pages remain', () => {
    expect(formatResultCount(24, true)).toBe('بیش از 24 آگهی پیدا شد');
  });

  it('prefers the exact total when the server provides one', () => {
    expect(formatResultCount(24, true, 137)).toBe('137 آگهی پیدا شد');
    expect(formatResultCount(3, false, 3)).toBe('3 آگهی پیدا شد');
  });
});

describe('buildZeroResultRecovery — search surface', () => {
  const ctx = { basePath: '/search', categoryOwnedByRoute: false };

  it('collapses to a single clear-all for a keyword-only query', () => {
    const actions = buildZeroResultRecovery({ q: 'تویوتا' }, ctx);
    expect(actions).toEqual([{ label: 'پاک کردن همهٔ فیلترها', href: '/search' }]);
  });

  it('offers keep-keyword, drop-keyword and clear-all when facets are active', () => {
    const query: DiscoveryQuery = { q: 'تویوتا', province: 'kabul', minPrice: 100 };
    const actions = buildZeroResultRecovery(query, ctx);

    expect(actions.map((a) => a.label)).toEqual([
      'حذف فیلترها و نگه‌داشتن جست‌وجو',
      'جست‌وجو بدون کلیدواژه',
      'پاک کردن همهٔ فیلترها',
    ]);
    expect(actions[0]!.href).toBe(discoveryHref('/search', { q: 'تویوتا' }));
    expect(actions[1]!.href).toBe(
      discoveryHref('/search', { province: 'kabul', minPrice: 100 }),
    );
    expect(actions[2]!.href).toBe('/search');
  });

  it('allows browsing a category without the keyword on the search surface', () => {
    const actions = buildZeroResultRecovery({ q: 'موبایل', category: 'electronics' }, ctx);
    expect(actions.map((a) => a.label)).toEqual([
      'جست‌وجو بدون کلیدواژه',
      'پاک کردن همهٔ فیلترها',
    ]);
    expect(actions[0]!.href).toBe(discoveryHref('/search', { category: 'electronics' }));
  });
});

describe('buildZeroResultRecovery — category surface', () => {
  const ctx = { basePath: '/category/vehicles', categoryOwnedByRoute: true };

  it('widens to all categories and offers clear-all for a keyword-only query', () => {
    const actions = buildZeroResultRecovery({ q: 'موبایل' }, ctx);
    expect(actions.map((a) => a.label)).toEqual([
      'دیدن در همهٔ دسته‌ها',
      'پاک کردن همهٔ فیلترها',
    ]);
    expect(actions[0]!.href).toBe(discoveryHref('/search', { q: 'موبایل' }));
    expect(actions[1]!.href).toBe('/category/vehicles');
  });

  it('never carries the route-owned category into a URL', () => {
    const actions = buildZeroResultRecovery(
      { q: 'موبایل', minPrice: 100, category: 'vehicles' },
      ctx,
    );
    for (const action of actions) {
      expect(action.href).not.toContain('category=vehicles');
    }
    expect(actions.map((a) => a.label)).toEqual([
      'دیدن در همهٔ دسته‌ها',
      'حذف فیلترها و نگه‌داشتن جست‌وجو',
      'جست‌وجو بدون کلیدواژه',
      'پاک کردن همهٔ فیلترها',
    ]);
    expect(actions[1]!.href).toBe(discoveryHref('/category/vehicles', { q: 'موبایل' }));
    expect(actions[2]!.href).toBe(discoveryHref('/category/vehicles', { minPrice: 100 }));
  });
});