/**
 * Presenters for the public category API and the admin category management
 * payloads (spec §27, §28).
 *
 * Localized names resolve through `pickTranslation` (requested locale →
 * English → first available), so raw translation rows never leak.
 */
import type { Category, CategoryTranslation } from '../../generated/prisma/client';
import { pickTranslation, type Locale } from '../utils/locale.utils';

export type CategoryWithTranslations = Category & { translations: CategoryTranslation[] };

/** Compact category reference used inside ancestor/child lists. */
export interface CategoryNameRef {
  id: string;
  slug: string;
  name: string;
}

export interface PublicCategorySummary extends CategoryNameRef {
  iconKey: string | null;
  parentId: string | null;
  sortOrder: number;
  hasChildren: boolean;
}

export interface PublicCategoryNode extends PublicCategorySummary {
  children: PublicCategoryNode[];
}

export interface PublicCategoryDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  iconKey: string | null;
  parent: CategoryNameRef | null;
  ancestors: CategoryNameRef[];
  children: PublicCategorySummary[];
}

export interface AdminCategoryTranslation {
  locale: string;
  name: string;
  description: string | null;
}

export interface AdminCategory {
  id: string;
  slug: string;
  parentId: string | null;
  status: Category['status'];
  sortOrder: number;
  iconKey: string | null;
  moderationMode: Category['moderationMode'];
  name: string;
  translations: AdminCategoryTranslation[];
  attributeCount: number;
  childCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function toCategoryNameRef(row: CategoryWithTranslations, locale: Locale): CategoryNameRef {
  const translation = pickTranslation(row.translations, locale);
  return { id: row.id, slug: row.slug, name: translation?.name ?? row.slug };
}

export function toPublicCategorySummary(
  row: CategoryWithTranslations,
  locale: Locale,
  hasChildren = false,
): PublicCategorySummary {
  return {
    ...toCategoryNameRef(row, locale),
    iconKey: row.iconKey,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    hasChildren,
  };
}

export function toPublicCategoryNode(
  row: CategoryWithTranslations,
  locale: Locale,
  children: PublicCategoryNode[],
): PublicCategoryNode {
  return { ...toPublicCategorySummary(row, locale, children.length > 0), children };
}

export function toPublicCategoryDetail(
  row: CategoryWithTranslations,
  ancestors: CategoryWithTranslations[],
  children: CategoryWithTranslations[],
  locale: Locale,
): PublicCategoryDetail {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    name: translation?.name ?? row.slug,
    description: translation?.description ?? null,
    iconKey: row.iconKey,
    parent:
      ancestors.length > 0 ? toCategoryNameRef(ancestors[ancestors.length - 1], locale) : null,
    ancestors: ancestors.map((ancestor) => toCategoryNameRef(ancestor, locale)),
    children: children.map((child) => toPublicCategorySummary(child, locale)),
  };
}

export function toAdminCategory(
  row: CategoryWithTranslations,
  locale: Locale,
  counts: { attributes: number; children: number },
): AdminCategory {
  const translation = pickTranslation(row.translations, locale);
  return {
    id: row.id,
    slug: row.slug,
    parentId: row.parentId,
    status: row.status,
    sortOrder: row.sortOrder,
    iconKey: row.iconKey,
    moderationMode: row.moderationMode,
    name: translation?.name ?? row.slug,
    translations: [...row.translations]
      .sort((a, b) => a.locale.localeCompare(b.locale))
      .map((item) => ({ locale: item.locale, name: item.name, description: item.description })),
    attributeCount: counts.attributes,
    childCount: counts.children,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
