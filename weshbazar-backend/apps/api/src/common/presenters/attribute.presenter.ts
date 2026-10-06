/**
 * Presenters for admin category-attribute payloads (spec §29, §106).
 *
 * The public attribute view is served through the category filter schema;
 * these shapes are for the management API only, so they include every
 * editable field plus stable identifiers.
 */
import type { CategoryAttribute, CategoryAttributeOption } from '../../generated/prisma/client';

export type AttributeWithOptions = CategoryAttribute & { options: CategoryAttributeOption[] };

export interface AdminAttributeOption {
  id: string;
  attributeId: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
}

export interface AdminAttribute {
  id: string;
  categoryId: string;
  key: string;
  label: string;
  type: CategoryAttribute['type'];
  required: boolean;
  filterable: boolean;
  searchable: boolean;
  unit: string | null;
  placeholder: string | null;
  minValue: number | null;
  maxValue: number | null;
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  sortOrder: number;
  isActive: boolean;
  options: AdminAttributeOption[];
  createdAt: Date;
  updatedAt: Date;
}

export function toAdminAttributeOption(row: CategoryAttributeOption): AdminAttributeOption {
  return {
    id: row.id,
    attributeId: row.attributeId,
    value: row.value,
    label: row.label,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export function toAdminAttribute(row: AttributeWithOptions): AdminAttribute {
  return {
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
    options: [...row.options]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.value.localeCompare(b.value))
      .map(toAdminAttributeOption),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
