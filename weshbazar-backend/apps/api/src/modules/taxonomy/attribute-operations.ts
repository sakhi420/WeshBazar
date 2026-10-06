/**
 * Filter operations allowed per attribute type (spec §34).
 *
 * Discovery filters are whitelisted against these operations — arbitrary
 * attribute keys or operations must never be translated into SQL. The search
 * layer (Phase 9) consumes `isOperationAllowed` per filterable attribute;
 * the filter-schema API exposes `operationsFor(type)` so the frontend can
 * build the correct filter UI without hard-coding category structures.
 */
import type { AttributeType } from '../../generated/prisma/enums';

export const ATTRIBUTE_FILTER_OPERATORS: Record<AttributeType, readonly string[]> = {
  TEXT: ['eq', 'contains'],
  LONG_TEXT: ['contains'],
  INTEGER: ['eq', 'gte', 'lte', 'in'],
  DECIMAL: ['eq', 'gte', 'lte', 'in'],
  YEAR: ['eq', 'gte', 'lte', 'in'],
  BOOLEAN: ['eq'],
  SELECT: ['eq', 'in'],
  MULTI_SELECT: ['contains', 'in'],
  DATE: ['eq', 'gte', 'lte'],
};

export function operationsFor(type: AttributeType): string[] {
  return [...ATTRIBUTE_FILTER_OPERATORS[type]];
}

export function isOperationAllowed(type: AttributeType, operation: string): boolean {
  return ATTRIBUTE_FILTER_OPERATORS[type].includes(operation);
}
