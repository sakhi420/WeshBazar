/**
 * Pure attribute validation engine (spec §32).
 *
 * Given the effective attribute schema of a category and a submitted payload,
 * it enforces — in order — unknown keys, inactive attributes, required
 * fields, types, numeric ranges, string lengths, regex patterns, and
 * select/multi-select option validity (including inactive options).
 *
 * The function is intentionally pure (no database access) so the complete
 * rule set is covered by fast unit tests; the service layer resolves the
 * effective schema and persists the normalized result.
 */
import type {
  AttributeValidationIssue,
  EffectiveAttribute,
  NormalizedAttributes,
} from './attribute.types';

export interface AttributeValidationResult {
  /** Values that passed validation, ready to be persisted. */
  normalized: NormalizedAttributes;
  /** All rule violations; empty when the payload is fully valid. */
  issues: AttributeValidationIssue[];
}

const YEAR_MIN = 1900;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateAttributeValues(
  effective: readonly EffectiveAttribute[],
  payload: Record<string, unknown>,
  now: Date = new Date(),
): AttributeValidationResult {
  const normalized: NormalizedAttributes = {};
  const issues: AttributeValidationIssue[] = [];

  const byKey = new Map(effective.map((attribute) => [attribute.key, attribute]));
  const provided = new Set<unknown>(Object.keys(payload));
  const failed = new Set<string>();

  const fail = (field: string, rule: AttributeValidationIssue['rule'], message: string): void => {
    issues.push({ field, rule, message });
    failed.add(field);
  };

  for (const [key, raw] of Object.entries(payload)) {
    const attribute = byKey.get(key);
    if (!attribute) {
      fail(key, 'UNKNOWN_KEY', `Unknown attribute "${key}" for this category.`);
      continue;
    }
    if (!attribute.isActive) {
      fail(key, 'INACTIVE_ATTRIBUTE', `The attribute "${attribute.label}" is no longer in use.`);
      continue;
    }
    if (raw === null) {
      // An explicit null equals "not provided"; the required pass decides.
      continue;
    }
    const value = validateValue(attribute, raw, fail, now);
    if (value !== undefined) {
      normalized[key] = value;
    }
  }

  for (const attribute of effective) {
    if (!attribute.isActive || !attribute.required) {
      continue;
    }
    const raw = payload[attribute.key];
    const missing =
      !provided.has(attribute.key) ||
      raw === null ||
      raw === undefined ||
      (typeof raw === 'string' && raw.trim().length === 0) ||
      (Array.isArray(raw) && raw.length === 0);
    if (missing && !failed.has(attribute.key)) {
      fail(attribute.key, 'REQUIRED', `The attribute "${attribute.label}" is required.`);
    }
  }

  return { normalized, issues };
}

type FailFn = (field: string, rule: AttributeValidationIssue['rule'], message: string) => void;

/** Validate one provided value; returns the normalized value or undefined. */
function validateValue(
  attribute: EffectiveAttribute,
  raw: unknown,
  fail: FailFn,
  now: Date,
): string | number | boolean | string[] | undefined {
  const label = attribute.label;

  switch (attribute.type) {
    case 'TEXT':
    case 'LONG_TEXT': {
      if (typeof raw !== 'string') {
        fail(attribute.key, 'TYPE', `"${label}" must be text.`);
        return undefined;
      }
      const value = raw.trim();
      if (attribute.minLength !== null && value.length < attribute.minLength) {
        fail(
          attribute.key,
          'LENGTH',
          `"${label}" must be at least ${attribute.minLength} characters.`,
        );
        return undefined;
      }
      if (attribute.maxLength !== null && value.length > attribute.maxLength) {
        fail(
          attribute.key,
          'LENGTH',
          `"${label}" must be at most ${attribute.maxLength} characters.`,
        );
        return undefined;
      }
      if (attribute.pattern !== null && !matchesPattern(attribute.pattern, value)) {
        fail(attribute.key, 'PATTERN', `"${label}" does not have the expected format.`);
        return undefined;
      }
      return value;
    }

    case 'INTEGER':
    case 'YEAR': {
      if (typeof raw !== 'number' || !Number.isInteger(raw)) {
        fail(attribute.key, 'TYPE', `"${label}" must be a whole number.`);
        return undefined;
      }
      if (attribute.type === 'YEAR') {
        const maxYear = now.getFullYear() + 1;
        if (raw < YEAR_MIN || raw > maxYear) {
          fail(
            attribute.key,
            'RANGE',
            `"${label}" must be a year between ${YEAR_MIN} and ${maxYear}.`,
          );
          return undefined;
        }
      }
      if (!withinRange(raw, attribute.minValue, attribute.maxValue)) {
        fail(attribute.key, 'RANGE', rangeMessage(label, attribute));
        return undefined;
      }
      return raw;
    }

    case 'DECIMAL': {
      if (typeof raw !== 'number' || !Number.isFinite(raw)) {
        fail(attribute.key, 'TYPE', `"${label}" must be a number.`);
        return undefined;
      }
      if (!withinRange(raw, attribute.minValue, attribute.maxValue)) {
        fail(attribute.key, 'RANGE', rangeMessage(label, attribute));
        return undefined;
      }
      return raw;
    }

    case 'BOOLEAN': {
      if (typeof raw !== 'boolean') {
        fail(attribute.key, 'TYPE', `"${label}" must be true or false.`);
        return undefined;
      }
      return raw;
    }

    case 'DATE': {
      if (typeof raw !== 'string' || !isValidDate(raw)) {
        fail(attribute.key, 'TYPE', `"${label}" must be a valid date (YYYY-MM-DD).`);
        return undefined;
      }
      return raw;
    }

    case 'SELECT': {
      if (typeof raw !== 'string') {
        fail(attribute.key, 'TYPE', `"${label}" must be one of the allowed options.`);
        return undefined;
      }
      if (!validateOption(attribute, raw, fail)) {
        return undefined;
      }
      return raw;
    }

    case 'MULTI_SELECT': {
      if (!Array.isArray(raw)) {
        fail(attribute.key, 'TYPE', `"${label}" must be a list of allowed options.`);
        return undefined;
      }
      const values: string[] = [];
      let failedElement = false;
      for (const element of raw) {
        if (typeof element !== 'string') {
          fail(attribute.key, 'TYPE', `"${label}" must contain only option values.`);
          failedElement = true;
          break;
        }
        if (!validateOption(attribute, element, fail)) {
          failedElement = true;
          break;
        }
        if (!values.includes(element)) {
          values.push(element);
        }
      }
      return failedElement ? undefined : values;
    }

    default:
      return undefined;
  }
}

function validateOption(attribute: EffectiveAttribute, value: string, fail: FailFn): boolean {
  const option = attribute.options.find((candidate) => candidate.value === value);
  if (!option) {
    fail(
      attribute.key,
      'INVALID_OPTION',
      `"${value}" is not an allowed value for "${attribute.label}".`,
    );
    return false;
  }
  if (!option.isActive) {
    fail(
      attribute.key,
      'INACTIVE_OPTION',
      `"${value}" is no longer an available value for "${attribute.label}".`,
    );
    return false;
  }
  return true;
}

function withinRange(value: number, min: number | null, max: number | null): boolean {
  if (min !== null && value < min) {
    return false;
  }
  if (max !== null && value > max) {
    return false;
  }
  return true;
}

function rangeMessage(label: string, attribute: EffectiveAttribute): string {
  if (attribute.minValue !== null && attribute.maxValue !== null) {
    return `"${label}" must be between ${attribute.minValue} and ${attribute.maxValue}.`;
  }
  if (attribute.minValue !== null) {
    return `"${label}" must be at least ${attribute.minValue}.`;
  }
  return `"${label}" must be at most ${attribute.maxValue}.`;
}

function matchesPattern(pattern: string, value: string): boolean {
  try {
    return new RegExp(pattern).test(value);
  } catch {
    // Invalid stored patterns fail closed: a pattern that cannot compile must
    // not accept arbitrary values (admins are warned at write time).
    return false;
  }
}

/**
 * Calendar-safe ISO date check shared with the discovery filter parser:
 * the pattern alone would accept rollover dates (`2025-02-30`), so the value
 * must round-trip through `Date` unchanged to count as stored shape.
 */
export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
