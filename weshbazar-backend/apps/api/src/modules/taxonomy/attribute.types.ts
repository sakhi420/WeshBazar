/**
 * Domain types for the dynamic category attribute engine (spec §29–§34).
 *
 * `EffectiveAttribute` is the resolved schema for one category: attributes of
 * the category itself merged with all inherited attributes from its ancestor
 * chain (deepest definition wins per key).
 */
import type { AttributeType } from '../../generated/prisma/enums';

export interface AttributeOptionRecord {
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export interface EffectiveAttribute {
  id: string;
  /** Category the attribute is defined on (may be an ancestor). */
  categoryId: string;
  key: string;
  label: string;
  type: AttributeType;
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
  options: AttributeOptionRecord[];
}

/** Machine-readable failure classes for attribute validation (spec §32). */
export type AttributeValidationRule =
  | 'UNKNOWN_KEY'
  | 'INACTIVE_ATTRIBUTE'
  | 'REQUIRED'
  | 'TYPE'
  | 'LENGTH'
  | 'PATTERN'
  | 'RANGE'
  | 'INVALID_OPTION'
  | 'INACTIVE_OPTION';

export interface AttributeValidationIssue {
  field: string;
  rule: AttributeValidationRule;
  message: string;
}

/** Attribute values as persisted inside `Listing.attributes`. */
export type NormalizedAttributes = Record<string, string | number | boolean | string[]>;
