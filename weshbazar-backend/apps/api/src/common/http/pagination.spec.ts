/**
 * Unit tests for the pagination contract helpers.
 */
import {
  clampLimit,
  clampPage,
  cursorPage,
  CursorPaginated,
  decodeCursor,
  encodeCursor,
  PagePaginated,
  pageMeta,
  pageResults,
} from './pagination';

describe('pagination helpers', () => {
  describe('encodeCursor / decodeCursor', () => {
    it('round-trips a cursor payload', () => {
      const cursor = encodeCursor({
        createdAt: new Date('2026-01-02T03:04:05.000Z'),
        id: 'abc-123',
      });

      expect(decodeCursor(cursor)).toEqual({
        createdAt: '2026-01-02T03:04:05.000Z',
        id: 'abc-123',
      });
    });

    it('produces URL-safe cursors', () => {
      const cursor = encodeCursor({ id: 'abc-123', n: 42 });
      expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('returns null for malformed cursors', () => {
      expect(decodeCursor('not-base64-json')).toBeNull();
      expect(decodeCursor(Buffer.from('[1,2,3]').toString('base64url'))).toBeNull();
      expect(decodeCursor(Buffer.from('"a string"').toString('base64url'))).toBeNull();
    });
  });

  describe('clampLimit', () => {
    it('falls back to the default for missing or invalid values', () => {
      expect(clampLimit(undefined)).toBe(24);
      expect(clampLimit(0)).toBe(24);
      expect(clampLimit(-5)).toBe(24);
      expect(clampLimit(Number.NaN)).toBe(24);
    });

    it('clamps to the maximum and truncates fractions', () => {
      expect(clampLimit(10)).toBe(10);
      expect(clampLimit(999)).toBe(60);
      expect(clampLimit(12.9)).toBe(12);
      expect(clampLimit(5, 24, 10)).toBe(5);
    });
  });

  describe('clampPage', () => {
    it('defaults to page 1 for invalid values', () => {
      expect(clampPage(undefined)).toBe(1);
      expect(clampPage(0)).toBe(1);
      expect(clampPage(-3)).toBe(1);
      expect(clampPage(4.7)).toBe(4);
    });
  });

  describe('pageMeta', () => {
    it('computes total pages', () => {
      expect(pageMeta(1, 20, 41)).toEqual({ page: 1, limit: 20, total: 41, totalPages: 3 });
      expect(pageMeta(1, 20, 0)).toEqual({ page: 1, limit: 20, total: 0, totalPages: 0 });
    });
  });

  describe('marker classes', () => {
    it('wraps cursor pages', () => {
      const result = cursorPage([1, 2], { nextCursor: 'abc', hasMore: true, limit: 2 });
      expect(result).toBeInstanceOf(CursorPaginated);
      expect(result.items).toEqual([1, 2]);
      expect(result.meta.nextCursor).toBe('abc');
    });

    it('wraps admin pages', () => {
      const result = pageResults(['a'], { page: 2, limit: 10, total: 11, totalPages: 2 });
      expect(result).toBeInstanceOf(PagePaginated);
      expect(result.items).toEqual(['a']);
      expect(result.meta.total).toBe(11);
    });
  });
});
