/**
 * Categories feature — data access (master prompt §6).
 * All HTTP goes through the API boundary. Server Components use `serverGet`;
 * client components/hooks use the browser verbs. No raw fetch here.
 */

import { serverGet, get } from '@/lib/api';
import type { CategoryDetail, CategoryNode, CategorySummary, FilterSchemaField } from './types';

/** Server Component: fetch the visible category list. Throws ApiError on failure. */
export function fetchCategoriesServer(locale = 'fa-AF'): Promise<CategorySummary[]> {
  return serverGet<CategorySummary[]>('/categories', {
    query: { locale },
    revalidate: 300,
    tags: ['categories'],
  });
}

/** Server Component: fetch the category tree (roots with nested children). */
export function fetchCategoryTreeServer(locale = 'fa-AF'): Promise<CategoryNode[]> {
  return serverGet<CategoryNode[]>('/categories/tree', {
    query: { locale },
    revalidate: 300,
    tags: ['categories'],
  });
}

/** Browser: fetch the visible category list (for TanStack Query functions). */
export function fetchCategories(locale = 'fa-AF'): Promise<CategorySummary[]> {
  return get<CategorySummary[]>('/categories', { query: { locale } });
}

/** Server Component: category detail by slug (breadcrumb + direct children). */
export function fetchCategoryDetailServer(
  slug: string,
  locale = 'fa-AF',
): Promise<CategoryDetail> {
  return serverGet<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`, {
    query: { locale },
    revalidate: 300,
    tags: ['categories'],
  });
}

/** Browser: category detail by slug. */
export function fetchCategoryDetail(slug: string, locale = 'fa-AF'): Promise<CategoryDetail> {
  return get<CategoryDetail>(`/categories/${encodeURIComponent(slug)}`, { query: { locale } });
}

/** Server Component: effective filter schema for a category (by category id). */
export function fetchFilterSchemaServer(categoryId: string): Promise<FilterSchemaField[]> {
  return serverGet<FilterSchemaField[]>(
    `/categories/${encodeURIComponent(categoryId)}/filter-schema`,
    { revalidate: 300, tags: ['categories'] },
  );
}

/** Browser: effective filter schema for a category (by category id). */
export function fetchFilterSchema(categoryId: string): Promise<FilterSchemaField[]> {
  return get<FilterSchemaField[]>(`/categories/${encodeURIComponent(categoryId)}/filter-schema`);
}
