/**
 * Taxonomy admin service (spec §106): category CRUD, category attribute CRUD
 * and attribute option CRUD.
 *
 * Lifecycle rules (spec §33):
 *   - Categories are never deleted while they have children or listings;
 *     those attempts surface as `CATEGORY_HAS_CHILDREN` / `CATEGORY_HAS_LISTINGS`.
 *   - Attribute `key` and `type` are immutable once any listing uses them
 *     (`ATTRIBUTE_IN_USE`); labels, hints and ordering stay editable.
 *   - Option `value` is immutable once any listing uses it; label/order/active
 *     flags stay editable, and retiring an option is done by deactivating it.
 *
 * Slug allocation retries on collision. Each attempt runs in its own
 * transaction — together with its audit row: PostgreSQL aborts a transaction
 * after any failed statement (25P02), so the P2002 catch retries the whole
 * `$transaction` call rather than a statement inside one.
 */
import { Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app.exception';
import { isUniqueViolation } from '../../common/errors/prisma-errors';
import {
  toAdminAttribute,
  toAdminAttributeOption,
  type AdminAttribute,
  type AdminAttributeOption,
  type AttributeWithOptions,
} from '../../common/presenters/attribute.presenter';
import {
  toAdminCategory,
  type AdminCategory,
  type CategoryWithTranslations,
} from '../../common/presenters/category.presenter';
import type { Locale } from '../../common/utils/locale.utils';
import { slugSuffix, slugify } from '../../common/utils/slug.utils';
import { normalizeTranslations, type TranslationInput } from '../../common/utils/translation.utils';
import { isUuid } from '../../common/utils/uuid.utils';
import { assertNoIssues, assertValidSlugInput } from '../../common/validation/field-issues';
import type { FieldValidationIssue } from '../../common/validation/validation.pipe';
import { PrismaService } from '../../database/prisma.service';
import type {
  AttributeType,
  AuditAction,
  CategoryStatus,
  ModerationMode,
} from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import type { CategoryAttribute, CategoryAttributeOption } from '../../generated/prisma/client';
import { AuditService, type AuditActor } from '../audit/audit.service';
import { TaxonomyService } from './taxonomy.service';

const CATEGORY_INCLUDE = { translations: true } as const;

/** Collision retries before giving up on a generated category slug. */
const SLUG_RETRIES = 4;

// --- Input shapes (mirrored by the DTOs) ----------------------------------------

export interface CreateCategoryInput {
  parentId?: string | null;
  slug?: string;
  status?: CategoryStatus;
  sortOrder?: number;
  iconKey?: string | null;
  moderationMode?: ModerationMode;
  translations: TranslationInput[];
}

export interface UpdateCategoryInput {
  parentId?: string | null;
  slug?: string;
  status?: CategoryStatus;
  sortOrder?: number;
  iconKey?: string | null;
  moderationMode?: ModerationMode;
  translations?: TranslationInput[];
}

interface AttributeInput {
  key?: string;
  label?: string;
  type?: AttributeType;
  required?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  unit?: string | null;
  placeholder?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  minLength?: number | null;
  maxLength?: number | null;
  pattern?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateAttributeInput extends AttributeInput {
  key: string;
  label: string;
  type: AttributeType;
}

export type UpdateAttributeInput = AttributeInput;

interface OptionInput {
  value?: string;
  label?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateOptionInput extends OptionInput {
  value: string;
  label: string;
}

export type UpdateOptionInput = OptionInput;

// --- Cross-field coherence ------------------------------------------------------

const VALUE_BOUND_TYPES: ReadonlySet<AttributeType> = new Set(['INTEGER', 'DECIMAL', 'YEAR']);
const LENGTH_BOUND_TYPES: ReadonlySet<AttributeType> = new Set(['TEXT', 'LONG_TEXT']);
const OPTION_TYPES: ReadonlySet<AttributeType> = new Set(['SELECT', 'MULTI_SELECT']);

interface AttributeConstraints {
  type: AttributeType;
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
}

/**
 * Constraint fields only make sense for certain attribute types; keep the
 * stored schema coherent so validation and filter building stay predictable.
 */
function coherenceIssues(state: AttributeConstraints): FieldValidationIssue[] {
  const issues: FieldValidationIssue[] = [];
  const reject = (field: string, message: string): void => {
    issues.push({ field, messages: [message] });
  };

  if (state.minValue !== null && !VALUE_BOUND_TYPES.has(state.type)) {
    reject('minValue', `minValue is not supported for ${state.type} attributes.`);
  }
  if (state.maxValue !== null && !VALUE_BOUND_TYPES.has(state.type)) {
    reject('maxValue', `maxValue is not supported for ${state.type} attributes.`);
  }
  if (state.minLength !== null && !LENGTH_BOUND_TYPES.has(state.type)) {
    reject('minLength', `minLength is not supported for ${state.type} attributes.`);
  }
  if (state.maxLength !== null && !LENGTH_BOUND_TYPES.has(state.type)) {
    reject('maxLength', `maxLength is not supported for ${state.type} attributes.`);
  }
  if (state.pattern !== null && !LENGTH_BOUND_TYPES.has(state.type)) {
    reject('pattern', `pattern is not supported for ${state.type} attributes.`);
  }
  if (state.minLength !== null && state.minLength < 0) {
    reject('minLength', 'minLength must be zero or greater.');
  }
  if (state.maxLength !== null && state.maxLength < 0) {
    reject('maxLength', 'maxLength must be zero or greater.');
  }
  if (state.minValue !== null && state.maxValue !== null && state.minValue > state.maxValue) {
    reject('maxValue', 'maxValue must be greater than or equal to minValue.');
  }
  if (state.minLength !== null && state.maxLength !== null && state.minLength > state.maxLength) {
    reject('maxLength', 'maxLength must be greater than or equal to minLength.');
  }
  if (state.pattern !== null) {
    try {
      new RegExp(state.pattern);
    } catch {
      reject('pattern', 'pattern must be a valid regular expression.');
    }
  }
  return issues;
}

/** Use the incoming value when present (including explicit `null`), else the fallback. */
function pick<T>(incoming: T | undefined, fallback: T): T {
  return incoming === undefined ? fallback : incoming;
}

@Injectable()
export class TaxonomyAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taxonomy: TaxonomyService,
    private readonly audit: AuditService,
  ) {}

  // --- Categories ---------------------------------------------------------------

  async listCategories(locale: Locale): Promise<AdminCategory[]> {
    const rows = await this.prisma.category.findMany({
      include: {
        translations: true,
        _count: { select: { attributes: true, children: true } },
      },
    });
    return rows
      .sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug) || a.id.localeCompare(b.id),
      )
      .map((row) =>
        toAdminCategory(row, locale, {
          attributes: row._count.attributes,
          children: row._count.children,
        }),
      );
  }

  async getCategory(id: string, locale: Locale): Promise<AdminCategory> {
    const row = await this.getCategoryRow(id);
    return this.toAdminCategoryWithCounts(row, locale);
  }

  async createCategory(
    input: CreateCategoryInput,
    locale: Locale,
    actor: AuditActor,
  ): Promise<AdminCategory> {
    if (input.parentId !== undefined && input.parentId !== null) {
      await this.assertParentAssignable(input.parentId);
    }
    const translations = normalizeTranslations(input.translations, 'en');

    assertValidSlugInput(input.slug);
    const englishName = translations.find((row) => row.locale === 'en')?.name ?? '';
    const base = input.slug ?? (slugify(englishName) || 'category');

    let attempt = 0;
    for (;;) {
      const slug = attempt === 0 ? base : `${base}-${slugSuffix()}`;
      try {
        const created = await this.prisma.$transaction(async (tx) => {
          const row = await tx.category.create({
            data: {
              slug,
              parentId: input.parentId ?? null,
              status: input.status ?? 'ACTIVE',
              sortOrder: input.sortOrder ?? 0,
              iconKey: input.iconKey ?? null,
              moderationMode: input.moderationMode ?? 'REVIEW_REQUIRED',
              translations: { create: translations },
            },
            include: CATEGORY_INCLUDE,
          });
          await this.recordAudit(tx, actor, 'CATEGORY_CREATED', row.id, { slug: row.slug });
          return row;
        });
        return toAdminCategory(created, locale, { attributes: 0, children: 0 });
      } catch (error) {
        if (!isUniqueViolation(error, 'Category_slug')) {
          throw error;
        }
        if (input.slug !== undefined || attempt >= SLUG_RETRIES) {
          throw new AppException('CATEGORY_SLUG_TAKEN', { cause: error });
        }
        attempt += 1;
      }
    }
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
    locale: Locale,
    actor: AuditActor,
  ): Promise<AdminCategory> {
    const existing = await this.getCategoryRow(id);

    if (input.parentId !== undefined && input.parentId !== existing.parentId) {
      if (input.parentId !== null) {
        await this.assertParentAssignable(input.parentId, id);
      }
    }
    const translations =
      input.translations !== undefined ? normalizeTranslations(input.translations) : null;
    assertValidSlugInput(input.slug);

    const data: Prisma.CategoryUncheckedUpdateInput = {
      ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.iconKey !== undefined ? { iconKey: input.iconKey } : {}),
      ...(input.moderationMode !== undefined ? { moderationMode: input.moderationMode } : {}),
      ...(translations !== null
        ? {
            translations: {
              upsert: translations.map((translation) => ({
                where: { categoryId_locale: { categoryId: id, locale: translation.locale } },
                create: {
                  locale: translation.locale,
                  name: translation.name,
                  description: translation.description,
                },
                update: { name: translation.name, description: translation.description },
              })),
            },
          }
        : {}),
    };

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.category.update({
          where: { id },
          data,
          include: CATEGORY_INCLUDE,
        });
        await this.recordAudit(tx, actor, 'CATEGORY_UPDATED', row.id, {
          slug: row.slug,
          changed: changedFields(input),
        });
        return row;
      });
      return this.toAdminCategoryWithCounts(updated, locale);
    } catch (error) {
      if (isUniqueViolation(error, 'Category_slug')) {
        throw new AppException('CATEGORY_SLUG_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async deleteCategory(id: string, actor: AuditActor): Promise<void> {
    const existing = await this.getCategoryRow(id);
    await this.prisma.$transaction(async (tx) => {
      const [children, listings] = await Promise.all([
        tx.category.count({ where: { parentId: id } }),
        tx.listing.count({ where: { categoryId: id } }),
      ]);
      if (children > 0) {
        throw new AppException('CATEGORY_HAS_CHILDREN');
      }
      if (listings > 0) {
        throw new AppException('CATEGORY_HAS_LISTINGS');
      }
      await tx.category.delete({ where: { id } });
      await this.recordAudit(tx, actor, 'CATEGORY_DELETED', id, { slug: existing.slug });
    });
  }

  // --- Attributes ---------------------------------------------------------------

  async listAttributes(categoryId: string): Promise<AdminAttribute[]> {
    await this.assertCategoryExists(categoryId);
    const rows = await this.prisma.categoryAttribute.findMany({
      where: { categoryId },
      include: { options: true },
      orderBy: [{ sortOrder: 'asc' }, { key: 'asc' }],
    });
    return rows.map(toAdminAttribute);
  }

  async createAttribute(
    categoryId: string,
    input: CreateAttributeInput,
    actor: AuditActor,
  ): Promise<AdminAttribute> {
    await this.assertCategoryExists(categoryId);
    assertNoIssues(
      coherenceIssues({
        type: input.type,
        minValue: input.minValue ?? null,
        maxValue: input.maxValue ?? null,
        minLength: input.minLength ?? null,
        maxLength: input.maxLength ?? null,
        pattern: input.pattern ?? null,
      }),
    );

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const row = await tx.categoryAttribute.create({
          data: {
            categoryId,
            key: input.key,
            label: input.label,
            type: input.type,
            required: input.required ?? false,
            filterable: input.filterable ?? false,
            searchable: input.searchable ?? false,
            unit: input.unit ?? null,
            placeholder: input.placeholder ?? null,
            minValue: input.minValue ?? null,
            maxValue: input.maxValue ?? null,
            minLength: input.minLength ?? null,
            maxLength: input.maxLength ?? null,
            pattern: input.pattern ?? null,
            sortOrder: input.sortOrder ?? 0,
            isActive: input.isActive ?? true,
          },
          include: { options: true },
        });
        await this.recordAudit(tx, actor, 'ATTRIBUTE_CREATED', row.id, {
          categoryId,
          key: row.key,
        });
        return row;
      });
      return toAdminAttribute(created);
    } catch (error) {
      if (isUniqueViolation(error, 'CategoryAttribute_categoryId_key')) {
        throw new AppException('ATTRIBUTE_KEY_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async updateAttribute(
    id: string,
    input: UpdateAttributeInput,
    actor: AuditActor,
  ): Promise<AdminAttribute> {
    const existing = await this.getAttributeRow(id);
    const nextKey = pick(input.key, existing.key);
    const nextType = pick(input.type, existing.type);

    if (nextKey !== existing.key || nextType !== existing.type) {
      const inUse = await this.taxonomy.isAttributeInUse(existing.categoryId, existing.key);
      if (inUse) {
        throw new AppException('ATTRIBUTE_IN_USE');
      }
    }

    assertNoIssues(
      coherenceIssues({
        type: nextType,
        minValue: pick(input.minValue, numeric(existing.minValue)),
        maxValue: pick(input.maxValue, numeric(existing.maxValue)),
        minLength: pick(input.minLength, existing.minLength),
        maxLength: pick(input.maxLength, existing.maxLength),
        pattern: pick(input.pattern, existing.pattern),
      }),
    );

    const data: Prisma.CategoryAttributeUncheckedUpdateInput = {
      ...(input.key !== undefined ? { key: input.key } : {}),
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.required !== undefined ? { required: input.required } : {}),
      ...(input.filterable !== undefined ? { filterable: input.filterable } : {}),
      ...(input.searchable !== undefined ? { searchable: input.searchable } : {}),
      ...(input.unit !== undefined ? { unit: input.unit } : {}),
      ...(input.placeholder !== undefined ? { placeholder: input.placeholder } : {}),
      ...(input.minValue !== undefined ? { minValue: input.minValue } : {}),
      ...(input.maxValue !== undefined ? { maxValue: input.maxValue } : {}),
      ...(input.minLength !== undefined ? { minLength: input.minLength } : {}),
      ...(input.maxLength !== undefined ? { maxLength: input.maxLength } : {}),
      ...(input.pattern !== undefined ? { pattern: input.pattern } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    };

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.categoryAttribute.update({
          where: { id },
          data,
          include: { options: true },
        });
        await this.recordAudit(tx, actor, 'ATTRIBUTE_UPDATED', row.id, {
          categoryId: existing.categoryId,
          key: row.key,
          changed: changedFields(input),
        });
        return row;
      });
      return toAdminAttribute(updated);
    } catch (error) {
      if (isUniqueViolation(error, 'CategoryAttribute_categoryId_key')) {
        throw new AppException('ATTRIBUTE_KEY_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async deleteAttribute(id: string, actor: AuditActor): Promise<void> {
    const existing = await this.getAttributeRow(id);
    const inUse = await this.taxonomy.isAttributeInUse(existing.categoryId, existing.key);
    if (inUse) {
      throw new AppException('ATTRIBUTE_IN_USE');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.categoryAttribute.delete({ where: { id } });
      await this.recordAudit(tx, actor, 'ATTRIBUTE_DELETED', id, {
        categoryId: existing.categoryId,
        key: existing.key,
      });
    });
  }

  // --- Attribute options ----------------------------------------------------------

  async createOption(
    attributeId: string,
    input: CreateOptionInput,
    actor: AuditActor,
  ): Promise<AdminAttributeOption> {
    const attribute = await this.getAttributeRow(attributeId);
    this.assertOptionCapable(attribute);

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const row = await tx.categoryAttributeOption.create({
          data: {
            attributeId,
            value: input.value,
            label: input.label,
            sortOrder: input.sortOrder ?? 0,
            isActive: input.isActive ?? true,
          },
        });
        await this.recordAudit(tx, actor, 'ATTRIBUTE_OPTION_CREATED', row.id, {
          attributeId,
          value: row.value,
        });
        return row;
      });
      return toAdminAttributeOption(created);
    } catch (error) {
      if (isUniqueViolation(error, 'CategoryAttributeOption_attributeId_value')) {
        throw new AppException('ATTRIBUTE_OPTION_VALUE_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async updateOption(
    id: string,
    input: UpdateOptionInput,
    actor: AuditActor,
  ): Promise<AdminAttributeOption> {
    const existing = await this.getOptionRow(id);

    if (input.value !== undefined && input.value !== existing.value) {
      const inUse = await this.taxonomy.isOptionValueInUse(
        existing.attribute.categoryId,
        existing.attribute.key,
        existing.value,
      );
      if (inUse) {
        throw new AppException('ATTRIBUTE_IN_USE');
      }
    }

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        const row = await tx.categoryAttributeOption.update({
          where: { id },
          data: {
            ...(input.value !== undefined ? { value: input.value } : {}),
            ...(input.label !== undefined ? { label: input.label } : {}),
            ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
            ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
          },
        });
        await this.recordAudit(tx, actor, 'ATTRIBUTE_OPTION_UPDATED', row.id, {
          attributeId: existing.attributeId,
          value: row.value,
          changed: changedFields(input),
        });
        return row;
      });
      return toAdminAttributeOption(updated);
    } catch (error) {
      if (isUniqueViolation(error, 'CategoryAttributeOption_attributeId_value')) {
        throw new AppException('ATTRIBUTE_OPTION_VALUE_TAKEN', { cause: error });
      }
      throw error;
    }
  }

  async deleteOption(id: string, actor: AuditActor): Promise<void> {
    const existing = await this.getOptionRow(id);
    const inUse = await this.taxonomy.isOptionValueInUse(
      existing.attribute.categoryId,
      existing.attribute.key,
      existing.value,
    );
    if (inUse) {
      throw new AppException('ATTRIBUTE_IN_USE');
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.categoryAttributeOption.delete({ where: { id } });
      await this.recordAudit(tx, actor, 'ATTRIBUTE_OPTION_DELETED', id, {
        attributeId: existing.attributeId,
        value: existing.value,
      });
    });
  }

  // --- Internals ------------------------------------------------------------------

  /**
   * §62: the audit row is written inside the caller's transaction, so it
   * exists if and only if the taxonomy change committed.
   */
  private recordAudit(
    tx: Prisma.TransactionClient,
    actor: AuditActor,
    action: AuditAction,
    entityId: string,
    metadata: Prisma.InputJsonObject,
  ): Promise<void> {
    return this.audit.record(
      {
        actorUserId: actor.actorUserId,
        action,
        entityType: auditEntityType(action),
        entityId,
        metadata,
        ipAddress: actor.ipAddress ?? null,
        userAgent: actor.userAgent ?? null,
      },
      tx,
    );
  }

  private async getCategoryRow(id: string): Promise<CategoryWithTranslations> {
    if (!isUuid(id)) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const row = await this.prisma.category.findUnique({
      where: { id },
      include: CATEGORY_INCLUDE,
    });
    if (!row) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    return row;
  }

  private async getAttributeRow(id: string): Promise<AttributeWithOptions> {
    if (!isUuid(id)) {
      throw new AppException('ATTRIBUTE_NOT_FOUND');
    }
    const row = await this.prisma.categoryAttribute.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!row) {
      throw new AppException('ATTRIBUTE_NOT_FOUND');
    }
    return row;
  }

  private async getOptionRow(
    id: string,
  ): Promise<CategoryAttributeOption & { attribute: CategoryAttribute }> {
    if (!isUuid(id)) {
      throw new AppException('ATTRIBUTE_OPTION_NOT_FOUND');
    }
    const row = await this.prisma.categoryAttributeOption.findUnique({
      where: { id },
      include: { attribute: true },
    });
    if (!row) {
      throw new AppException('ATTRIBUTE_OPTION_NOT_FOUND');
    }
    return row;
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
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
  }

  private assertOptionCapable(attribute: CategoryAttribute): void {
    if (!OPTION_TYPES.has(attribute.type)) {
      throw new AppException('VALIDATION_ERROR', {
        details: {
          errors: [
            {
              field: 'attributeId',
              messages: [
                `Options can only be added to SELECT or MULTI_SELECT attributes (this attribute is ${attribute.type}).`,
              ],
            },
          ],
        },
      });
    }
  }

  /**
   * A category may be placed under `parentId` when the parent exists, is not
   * archived, and the ancestor chain starting there does not loop back to the
   * category being moved (`movingId`) or into itself.
   */
  private async assertParentAssignable(
    parentId: string,
    movingId: string | null = null,
  ): Promise<void> {
    if (!isUuid(parentId)) {
      throw new AppException('CATEGORY_NOT_FOUND');
    }
    const visited = new Set<string>();
    let cursor: string | null = parentId;
    while (cursor !== null) {
      if (cursor === movingId || visited.has(cursor)) {
        throw new AppException('CATEGORY_CYCLE_DETECTED');
      }
      visited.add(cursor);
      const parent: { parentId: string | null; status: CategoryStatus } | null =
        await this.prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true, status: true },
        });
      if (!parent || parent.status === 'ARCHIVED') {
        throw new AppException('CATEGORY_NOT_FOUND');
      }
      cursor = parent.parentId;
    }
  }

  private async toAdminCategoryWithCounts(
    row: CategoryWithTranslations,
    locale: Locale,
  ): Promise<AdminCategory> {
    const [attributes, children] = await Promise.all([
      this.prisma.categoryAttribute.count({ where: { categoryId: row.id } }),
      this.prisma.category.count({ where: { parentId: row.id } }),
    ]);
    return toAdminCategory(row, locale, { attributes, children });
  }
}

function numeric(value: { toString(): string } | null): number | null {
  return value === null ? null : Number(value.toString());
}

/** Present (non-undefined) input keys — the audit "what changed" summary. */
function changedFields(input: object): string[] {
  const record = input as Record<string, unknown>;
  return Object.keys(input).filter((key) => record[key] !== undefined);
}

/** Stable, human-readable entity names for taxonomy audit rows (§62). */
function auditEntityType(action: AuditAction): string {
  if (action.startsWith('ATTRIBUTE_OPTION_')) {
    return 'CategoryAttributeOption';
  }
  if (action.startsWith('ATTRIBUTE_')) {
    return 'CategoryAttribute';
  }
  return 'Category';
}
