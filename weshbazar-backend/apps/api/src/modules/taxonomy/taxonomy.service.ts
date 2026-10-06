/**
 * Taxonomy service (spec §27–§35).
 *
 * Public, read-only category access: flat list, tree, detail by slug, and the
 * filter-schema API. Also hosts the dynamic attribute engine glue —
 * resolution of effective (inherited) attributes, payload validation against
 * the `Listing.attributes` contract, and usage detection that protects
 * historical listings from attribute redefinition (spec §33).
 *
 * Visibility rule for every public read: a category is visible only when it
 * and ALL of its ancestors are ACTIVE. Anything else is reported as
 * `CATEGORY_NOT_FOUND` so moderation state never leaks.
 */
import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import {
  toPublicCategoryDetail,
  toPublicCategoryNode,
  toPublicCategorySummary,
  type CategoryWithTranslations,
  type PublicCategoryDetail,
  type PublicCategoryNode,
  type PublicCategorySummary,
} from '../../common/presenters/category.presenter';
import type { Locale } from '../../common/utils/locale.utils';
import { isUuid } from '../../common/utils/uuid.utils';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { operationsFor } from './attribute-operations';
import type { EffectiveAttribute, NormalizedAttributes } from './attribute.types';
import { validateAttributeValues } from './attribute-validation';

/** A single field of the category filter/attribute schema (spec §35). */
export interface FilterSchemaField {
  field: string;
  label: string;
  type: string;
  unit: string | null;
  placeholder: string | null;
  required: boolean;
  filterable: boolean;
  options: Array<{ value: string; label: string }>;
  min: number | null;
  max: number | null;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  operators: string[];
}

const CATEGORY_INCLUDE = { translations: true } as const;

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Public reads -------------------------------------------------------------

  async listCategories(locale: Locale): Promise<PublicCategorySummary[]> {
    const visible = await this.loadVisibleCategories();
    const withChildren = new Set(
      visible.filter((category) => category.parentId !== null).map((c) => c.parentId as string),
    );
    return visible.map((category) =>
      toPublicCategorySummary(category, locale, withChildren.has(category.id)),
    );
  }

  async getTree(locale: Locale): Promise<PublicCategoryNode[]> {
    const visible = await this.loadVisibleCategories();
    const byId = new Map(visible.map((category) => [category.id, category]));
    const nodeById = new Map<string, PublicCategoryNode>();
    const sorted = sortCategories(visible);

    // Build children bottom-up so each parent node owns fully built subtrees.
    for (const category of [...sorted].reverse()) {
      const children = sorted
        .filter((candidate) => candidate.parentId === category.id)
        .map((child) => nodeById.get(child.id))
        .filter((node): node is PublicCategoryNode => node !== undefined);
      nodeById.set(category.id, toPublicCategoryNode(category, locale, children));
    }
    return sorted
      .filter((category) => category.parentId === null || !byId.has(category.parentId))
      .map((category) => nodeById.get(category.id))
      .filter((node): node is PublicCategoryNode => node !== undefined);
  }

  async getBySlug(slug: string, locale: Locale): Promise<PublicCategoryDetail> {
    const visible = await this.loadVisibleCategories();
    const category = visible.find((candidate) => candidate.slug === slug);
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const byId = new Map(visible.map((row) => [row.id, row]));
    const ancestors: CategoryWithTranslations[] = [];
    let cursor = category.parentId;
    while (cursor !== null) {
      const ancestor = byId.get(cursor);
      if (!ancestor) {
        // Parent chain is broken by an inactive/archived ancestor.
        throw new AppException('CATEGORY_NOT_FOUND');
      }
      ancestors.unshift(ancestor);
      cursor = ancestor.parentId;
    }
    const children = sortCategories(visible.filter((row) => row.parentId === category.id));
    return toPublicCategoryDetail(category, ancestors, children, locale);
  }

  /**
   * Resolve a category slug for discovery (spec §49, §110): the returned
   * subtree contains the category and every visible descendant, so filtering
   * by a parent category also covers its children. Returns null for unknown
   * or hidden categories — discovery answers with an empty feed, not a 404.
   */
  async resolveVisibleSubtreeBySlug(
    slug: string,
  ): Promise<{ id: string; subtreeIds: string[] } | null> {
    const visible = await this.loadVisibleCategories();
    const root = visible.find((category) => category.slug === slug);
    if (!root) {
      return null;
    }
    const childrenByParent = new Map<string, string[]>();
    for (const category of visible) {
      if (category.parentId === null) {
        continue;
      }
      const siblings = childrenByParent.get(category.parentId) ?? [];
      siblings.push(category.id);
      childrenByParent.set(category.parentId, siblings);
    }
    const subtreeIds: string[] = [];
    const queue: string[] = [root.id];
    while (queue.length > 0) {
      const id = queue.pop();
      if (id === undefined) {
        break;
      }
      subtreeIds.push(id);
      queue.push(...(childrenByParent.get(id) ?? []));
    }
    return { id: root.id, subtreeIds };
  }

  /**
   * The frontend obtains the attribute/filter definition for a category from
   * here instead of hard-coding structures (spec §35). Inherited attributes
   * are included; inactive attributes and options are not. Labels are the
   * attribute's own (not localized) label.
   */
  async getFilterSchema(categoryId: string): Promise<FilterSchemaField[]> {
    await this.assertCategoryPubliclyVisible(categoryId);
    const effective = await this.resolveEffectiveAttributes(categoryId);
    return effective
      .filter((attribute) => attribute.isActive)
      .map((attribute) => this.toFilterSchemaField(attribute));
  }

  // --- Effective attributes & validation (used by listings, spec §32) ------------

  /**
   * Resolve the effective attribute schema: own attributes merged over the
   * ancestor chain, root first, with the deepest definition winning per key.
   * Inactive attributes are included (marked `isActive: false`) so callers
   * can distinguish "unknown" from "no longer allowed".
   */
  async resolveEffectiveAttributes(categoryId: string): Promise<EffectiveAttribute[]> {
    const chain = await this.loadCategoryChain(categoryId);
    const rows = await this.prisma.categoryAttribute.findMany({
      where: { categoryId: { in: chain.map((category) => category.id) } },
      include: { options: { orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }] } },
    });

    const merged: EffectiveAttribute[] = [];
    const positionByKey = new Map<string, number>();
    for (const category of chain) {
      const attributes = rows
        .filter((row) => row.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));
      for (const row of attributes) {
        const effective: EffectiveAttribute = {
          id: row.id,
          categoryId: row.categoryId,
          key: row.key,
          label: row.label,
          type: row.type,
          required: row.required,
          filterable: row.filterable,
          searchable: row.searchable,
          unit: row.unit,
          placeholder: row.placeholder,
          minValue: row.minValue === null ? null : Number(row.minValue),
          maxValue: row.maxValue === null ? null : Number(row.maxValue),
          minLength: row.minLength,
          maxLength: row.maxLength,
          pattern: row.pattern,
          sortOrder: row.sortOrder,
          isActive: row.isActive,
          options: row.options.map((option) => ({
            value: option.value,
            label: option.label,
            isActive: option.isActive,
            sortOrder: option.sortOrder,
          })),
        };
        const position = positionByKey.get(row.key);
        if (position === undefined) {
          positionByKey.set(row.key, merged.length);
          merged.push(effective);
        } else {
          // Deeper definition overrides the inherited one in place.
          merged[position] = effective;
        }
      }
    }
    return merged;
  }

  /**
   * Validate a `Listing.attributes` payload against the category's effective
   * schema (spec §32). Returns the normalized values or throws
   * `REQUIRED_ATTRIBUTE_MISSING` / `INVALID_ATTRIBUTE_VALUE` with
   * `details.errors`.
   */
  async validateForCategory(
    categoryId: string,
    payload: Record<string, unknown>,
  ): Promise<NormalizedAttributes> {
    if (!isUuid(categoryId)) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!category) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }

    const effective = await this.resolveEffectiveAttributes(categoryId);
    const { normalized, issues } = validateAttributeValues(effective, payload);
    if (issues.length > 0) {
      const onlyRequired = issues.every((issue) => issue.rule === 'REQUIRED');
      throw new AppException(
        onlyRequired ? 'REQUIRED_ATTRIBUTE_MISSING' : 'INVALID_ATTRIBUTE_VALUE',
        {
          details: { errors: issues },
        },
      );
    }
    return normalized;
  }

  /**
   * Guard for listing creation: the category must exist, be ACTIVE, and have
   * no ACTIVE children (listings belong in leaf categories only).
   */
  async assertCategoryUsableForListing(categoryId: string): Promise<void> {
    if (!isUuid(categoryId)) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, status: true },
    });
    if (!category || category.status === 'ARCHIVED') {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    if (category.status !== 'ACTIVE') {
      throw new AppException('CATEGORY_INACTIVE');
    }
    const activeChildren = await this.prisma.category.count({
      where: { parentId: categoryId, status: 'ACTIVE' },
    });
    if (activeChildren > 0) {
      throw new AppException('CATEGORY_NOT_LEAF');
    }
  }

  // --- Usage detection (spec §33 evolution rule) ---------------------------------

  /** True when any listing in the category subtree carries the attribute key. */
  async isAttributeInUse(categoryId: string, key: string): Promise<boolean> {
    return this.hasListingUsage(categoryId, key, null);
  }

  /** True when any listing in the subtree uses the option value for the key. */
  async isOptionValueInUse(categoryId: string, key: string, value: string): Promise<boolean> {
    return this.hasListingUsage(categoryId, key, value);
  }

  private async hasListingUsage(
    categoryId: string,
    key: string,
    optionValue: string | null,
  ): Promise<boolean> {
    const condition =
      optionValue === null
        ? Prisma.sql`l."attributes" ? ${key}`
        : Prisma.sql`(l."attributes" ->> ${key} = ${optionValue}
            OR (l."attributes" -> ${key}) @> jsonb_build_array(${optionValue}::text))`;
    const rows = await this.prisma.$queryRaw<Array<{ one: number }>>(Prisma.sql`
      WITH RECURSIVE subtree AS (
        SELECT "id" FROM "Category" WHERE "id" = CAST(${categoryId} AS uuid)
        UNION ALL
        SELECT c."id" FROM "Category" c INNER JOIN subtree s ON c."parentId" = s."id"
      )
      SELECT 1 AS one
      FROM "Listing" l
      WHERE l."categoryId" IN (SELECT "id" FROM subtree)
        AND ${condition}
      LIMIT 1
    `);
    return rows.length > 0;
  }

  // --- Internals -----------------------------------------------------------------

  private async loadVisibleCategories(): Promise<CategoryWithTranslations[]> {
    const active = await this.prisma.category.findMany({
      where: { status: 'ACTIVE' },
      include: CATEGORY_INCLUDE,
    });
    const byId = new Map(active.map((category) => [category.id, category]));
    return sortCategories(active.filter((category) => hasVisibleChain(category, byId)));
  }

  private async assertCategoryPubliclyVisible(categoryId: string): Promise<void> {
    if (!isUuid(categoryId)) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const chain = await this.loadCategoryChain(categoryId, { allowMissing: true });
    if (chain.length === 0 || chain.some((category) => category.status !== 'ACTIVE')) {
      // Missing, archived, or hidden by an inactive ancestor.
      throw new AppException('CATEGORY_NOT_FOUND');
    }
  }

  /**
   * Load the ancestor chain of a category, root first, target last. Missing
   * or archived links make the category invisible (same as not existing).
   */
  private async loadCategoryChain(
    categoryId: string,
    options: { allowMissing?: boolean } = {},
  ): Promise<CategoryWithTranslations[]> {
    const chain: CategoryWithTranslations[] = [];
    const visited = new Set<string>();
    let cursor: string | null = categoryId;
    while (cursor !== null) {
      if (visited.has(cursor)) {
        // Corrupt hierarchy data — treat as not found rather than looping.
        if (options.allowMissing) {
          return [];
        }
        throw new AppException('CATEGORY_CYCLE_DETECTED');
      }
      visited.add(cursor);
      const category: CategoryWithTranslations | null = await this.prisma.category.findUnique({
        where: { id: cursor },
        include: CATEGORY_INCLUDE,
      });
      if (!category || category.status === 'ARCHIVED') {
        if (options.allowMissing) {
          return [];
        }
        throw new AppException('CATEGORY_NOT_FOUND');
      }
      chain.unshift(category);
      cursor = category.parentId;
    }
    return chain;
  }

  private toFilterSchemaField(attribute: EffectiveAttribute): FilterSchemaField {
    return {
      field: attribute.key,
      label: attribute.label,
      type: attribute.type,
      unit: attribute.unit,
      placeholder: attribute.placeholder,
      required: attribute.required,
      filterable: attribute.filterable,
      options: attribute.options
        .filter((option) => option.isActive)
        .map((option) => ({ value: option.value, label: option.label })),
      min: attribute.minValue,
      max: attribute.maxValue,
      minLength: attribute.minLength,
      maxLength: attribute.maxLength,
      pattern: attribute.pattern,
      operators: attribute.filterable ? operationsFor(attribute.type) : [],
    };
  }
}

function sortCategories(rows: readonly CategoryWithTranslations[]): CategoryWithTranslations[] {
  return [...rows].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id),
  );
}

function hasVisibleChain(
  category: CategoryWithTranslations,
  byId: ReadonlyMap<string, CategoryWithTranslations>,
): boolean {
  let cursor = category.parentId;
  const visited = new Set<string>();
  while (cursor !== null) {
    if (visited.has(cursor)) {
      return false;
    }
    visited.add(cursor);
    const parent = byId.get(cursor);
    if (!parent) {
      return false;
    }
    cursor = parent.parentId;
  }
  return true;
}
