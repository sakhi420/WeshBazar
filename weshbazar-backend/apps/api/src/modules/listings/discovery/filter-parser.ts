/**
 * Discovery attribute-filter parsing and whitelisting (spec §34, §49, §79).
 *
 * Clients express dynamic filters as `key:operator:value` expressions
 * (`filter=ram:gte:8`, `filter=color:in:red,blue`). Nothing reaches the
 * search provider until it has been checked against the category's effective
 * attribute schema: the key must exist, be active, be filterable, the
 * operator must be allowed for the attribute type, and each value must coerce
 * to the type's stored shape. All violations are aggregated so the caller can
 * answer with one `VALIDATION_ERROR` listing every offending expression —
 * unknown filters are rejected, never silently dropped (§79).
 */
import type { AttributeType } from '../../../generated/prisma/enums';
import { isValidDate } from '../../taxonomy/attribute-validation';
import { isOperationAllowed } from '../../taxonomy/attribute-operations';
import type { EffectiveAttribute } from '../../taxonomy/attribute.types';
import type {
  AttributeCriterion,
  SearchFilterOperation,
} from '../../../providers/search/search.provider';

/** Mirrors the attribute key contract used across the taxonomy module. */
const ATTRIBUTE_KEY_PATTERN = /^[a-z][a-z0-9_]{0,49}$/;

const FILTER_OPERATIONS: readonly SearchFilterOperation[] = ['eq', 'contains', 'gte', 'lte', 'in'];

/** Upper bound for `in` lists — keeps query cost and URL size bounded (§79). */
export const MAX_IN_VALUES = 20;

export interface FilterParserIssue {
  expression: string;
  message: string;
}

export interface AttributeFilterResult {
  criteria: AttributeCriterion[];
  issues: FilterParserIssue[];
}

interface ParsedExpression {
  key: string;
  operation: SearchFilterOperation;
  values: string[];
}

type CoercedValues = { values: Array<string | number | boolean> } | { message: string };

/**
 * Parse raw filter expressions against the effective attributes of the
 * selected category. Returns whitelisted criteria plus every issue found.
 */
export function buildAttributeCriteria(
  expressions: readonly string[],
  attributes: readonly EffectiveAttribute[],
  maxFilters: number,
): AttributeFilterResult {
  const criteria: AttributeCriterion[] = [];
  const issues: FilterParserIssue[] = [];
  const seen = new Set<string>();
  const byKey = new Map(attributes.map((attribute) => [attribute.key, attribute]));

  for (const expression of expressions) {
    const trimmed = expression.trim();
    const parsed = parseExpression(trimmed);
    if ('message' in parsed) {
      issues.push({ expression: trimmed, message: parsed.message });
      continue;
    }

    const attribute = byKey.get(parsed.key);
    if (attribute === undefined) {
      issues.push({
        expression: trimmed,
        message: `"${parsed.key}" is not an attribute of the selected category.`,
      });
      continue;
    }
    if (!attribute.isActive) {
      issues.push({
        expression: trimmed,
        message: `Attribute "${parsed.key}" is no longer available for filtering.`,
      });
      continue;
    }
    if (!attribute.filterable) {
      issues.push({
        expression: trimmed,
        message: `Attribute "${parsed.key}" cannot be used as a filter.`,
      });
      continue;
    }
    if (!isOperationAllowed(attribute.type, parsed.operation)) {
      issues.push({
        expression: trimmed,
        message: `Operator "${parsed.operation}" is not allowed for attribute "${parsed.key}".`,
      });
      continue;
    }

    const coerced = coerceValues(attribute.type, parsed.values);
    if ('message' in coerced) {
      issues.push({ expression: trimmed, message: coerced.message });
      continue;
    }

    const signature = `${parsed.key}:${parsed.operation}:${JSON.stringify(coerced.values)}`;
    if (seen.has(signature)) {
      // Exact repeats are idempotent; they do not consume filter budget.
      continue;
    }
    if (criteria.length >= maxFilters) {
      issues.push({
        expression: trimmed,
        message: `At most ${maxFilters} attribute filters are allowed per request.`,
      });
      continue;
    }
    seen.add(signature);
    criteria.push({
      key: parsed.key,
      operation: parsed.operation,
      type: attribute.type,
      values: coerced.values,
    });
  }

  return { criteria, issues };
}

function parseExpression(expression: string): ParsedExpression | FilterParserIssue {
  const firstColon = expression.indexOf(':');
  const secondColon = firstColon === -1 ? -1 : expression.indexOf(':', firstColon + 1);
  if (firstColon <= 0 || secondColon === -1) {
    return { expression, message: 'Filters use the form key:operator:value.' };
  }

  const key = expression.slice(0, firstColon).trim();
  const operation = expression.slice(firstColon + 1, secondColon).trim();
  // The value keeps any further colons (e.g. contains values with times).
  const rawValue = expression.slice(secondColon + 1).trim();

  if (!ATTRIBUTE_KEY_PATTERN.test(key)) {
    return { expression, message: `"${key}" is not a valid attribute key.` };
  }
  if (!isFilterOperation(operation)) {
    return {
      expression,
      message: `Operator "${operation}" is not supported (${FILTER_OPERATIONS.join(', ')}).`,
    };
  }
  if (rawValue.length === 0) {
    return { expression, message: 'The filter value is empty.' };
  }

  const values =
    operation === 'in'
      ? [
          ...new Set(
            splitCsv(rawValue)
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        ]
      : [rawValue];
  if (values.length === 0) {
    return { expression, message: 'Operator "in" requires at least one value.' };
  }
  if (values.length > MAX_IN_VALUES) {
    return {
      expression,
      message: `Operator "in" accepts at most ${MAX_IN_VALUES} values.`,
    };
  }
  return { key, operation, values };
}

/** Coerce raw string values into the shape stored on `Listing.attributes`. */
function coerceValues(type: AttributeType, values: readonly string[]): CoercedValues {
  switch (type) {
    case 'INTEGER':
    case 'YEAR': {
      const numbers: number[] = [];
      for (const value of values) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || !Number.isSafeInteger(parsed)) {
          return { message: `"${value}" is not a whole number.` };
        }
        numbers.push(parsed);
      }
      return { values: numbers };
    }
    case 'DECIMAL': {
      const numbers: number[] = [];
      for (const value of values) {
        const parsed = Number(value);
        if (value.trim().length === 0 || !Number.isFinite(parsed)) {
          return { message: `"${value}" is not a number.` };
        }
        numbers.push(parsed);
      }
      return { values: numbers };
    }
    case 'BOOLEAN': {
      const booleans: boolean[] = [];
      for (const value of values) {
        const normalized = value.toLowerCase();
        if (normalized === 'true' || normalized === '1') {
          booleans.push(true);
        } else if (normalized === 'false' || normalized === '0') {
          booleans.push(false);
        } else {
          return { message: `"${value}" is not a boolean (use true or false).` };
        }
      }
      return { values: booleans };
    }
    case 'DATE': {
      for (const value of values) {
        // Same calendar-safe check the storage validator applies, so filter
        // values can never be shapes the listing payload would have rejected.
        if (!isValidDate(value)) {
          return { message: `"${value}" is not a date (expected YYYY-MM-DD).` };
        }
      }
      return { values: [...values] };
    }
    case 'TEXT':
    case 'LONG_TEXT':
    case 'SELECT':
    case 'MULTI_SELECT':
      // Stored as strings; equals/contains/in semantics apply as-is.
      return { values: [...values] };
  }
}

function isFilterOperation(value: string): value is SearchFilterOperation {
  return (FILTER_OPERATIONS as readonly string[]).includes(value);
}

function splitCsv(value: string): string[] {
  return value.split(',');
}
