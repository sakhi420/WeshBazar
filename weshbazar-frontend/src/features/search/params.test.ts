/**
 * Behavior tests for the discovery URL grammar (master prompt §21, §123).
 * These pure functions decide what ends up on the wire to the frozen
 * `GET /listings` contract, so malformed URLs must never leak invalid params
 * and contract caps (4 conditions, 32 expressions) must be enforced.
 */

import {
  countActiveFilters,
  MAX_FILTER_EXPRESSIONS,
  parseDiscoverySearchParams,
  parseFilterExpression,
  parseFilterExpressions,
  sanitizeFilterValue,
  serializeFilterExpression,
  toDiscoveryQuery,
} from './params';

describe('parseDiscoverySearchParams', () => {
  it('trims keywords and drops blank ones', () => {
    expect(parseDiscoverySearchParams({ q: '  iphone  ' }).q).toBe('iphone');
    expect(parseDiscoverySearchParams({ q: '   ' }).q).toBeUndefined();
  });

  it('keeps only known sort values', () => {
    expect(parseDiscoverySearchParams({ sort: 'price_asc' }).sort).toBe('price_asc');
    expect(parseDiscoverySearchParams({ sort: 'relevance' }).sort).toBeUndefined();
  });

  it('splits comma-joined conditions and drops unknown enum values', () => {
    const state = parseDiscoverySearchParams({ condition: 'NEW,bogus,GOOD' });
    expect(state.condition).toEqual(['NEW', 'GOOD']);
  });

  it('splits pipe-joined filter expressions', () => {
    const state = parseDiscoverySearchParams({ filter: 'brand:eq:toyota|year:gte:2015' });
    expect(state.filter).toEqual(['brand:eq:toyota', 'year:gte:2015']);
  });

  it('accepts repeated searchParams arrays too', () => {
    const state = parseDiscoverySearchParams({ condition: ['NEW', 'FAIR'] });
    expect(state.condition).toEqual(['NEW', 'FAIR']);
  });

  it('rejects non-numeric and negative price bounds', () => {
    expect(parseDiscoverySearchParams({ minPrice: 'abc' }).minPrice).toBeUndefined();
    expect(parseDiscoverySearchParams({ minPrice: '-5' }).minPrice).toBeUndefined();
    expect(parseDiscoverySearchParams({ maxPrice: '1500' }).maxPrice).toBe(1500);
  });
});

describe('toDiscoveryQuery', () => {
  it('omits defaults so the request stays minimal', () => {
    const query = toDiscoveryQuery({ sort: 'newest', q: '', condition: [] });
    expect(query).toEqual({});
  });

  it('passes non-default sort through', () => {
    expect(toDiscoveryQuery({ sort: 'price_desc' }).sort).toBe('price_desc');
  });

  it('caps conditions at the contract maximum of 4', () => {
    const query = toDiscoveryQuery({
      condition: ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'NEW'],
    });
    expect(query.condition).toHaveLength(4);
  });

  it('caps filter expressions at 32 and drops empty ones', () => {
    const many = Array.from({ length: 40 }, (_, i) => `f${i}:eq:v`);
    const query = toDiscoveryQuery({ filter: [...many, ''] });
    expect(query.filter).toHaveLength(MAX_FILTER_EXPRESSIONS);
    expect(query.filter?.every((item) => item.length > 0)).toBe(true);
  });

  it('applies route overrides (category page pins its own category)', () => {
    const query = toDiscoveryQuery({ category: 'stale' }, { category: 'phones' });
    expect(query.category).toBe('phones');
  });
});

describe('filter expressions (key:operator:value)', () => {
  it('round-trips through serialize/parse', () => {
    const expression = { key: 'storage', operator: 'in' as const, value: '64,128' };
    expect(parseFilterExpression(serializeFilterExpression(expression))).toEqual(expression);
  });

  it('only treats the first two colons as structural', () => {
    const parsed = parseFilterExpression('notes:eq:a:b:c');
    expect(parsed).toEqual({ key: 'notes', operator: 'eq', value: 'a:b:c' });
  });

  it('returns null for malformed input instead of throwing', () => {
    expect(parseFilterExpression('no-colons')).toBeNull();
    expect(parseFilterExpression(':eq:x')).toBeNull();
    expect(parseFilterExpression('key:eq:')).toBeNull();
    expect(parseFilterExpression('key:sneaky:x')).toBeNull();
  });

  it('parseFilterExpressions drops junk and keeps valid entries', () => {
    expect(parseFilterExpressions(['brand:eq:toyota', 'junk', 'year:gte:2020'])).toHaveLength(2);
  });

  it('sanitizeFilterValue removes the URL pipe separator from user input', () => {
    expect(sanitizeFilterValue('a|b|c')).toBe('a b c');
  });
});

describe('countActiveFilters', () => {
  it('counts each active facet (mobile badge)', () => {
    expect(
      countActiveFilters({
        province: 'kabul',
        city: null,
        minPrice: 100,
        maxPrice: null,
        condition: ['NEW', 'GOOD'],
        filter: ['brand:eq:toyota'],
      }),
    ).toBe(5);
  });

  it('counts nothing when all facets are empty', () => {
    expect(countActiveFilters({ q: 'phone', sort: 'newest' })).toBe(0);
  });
});
