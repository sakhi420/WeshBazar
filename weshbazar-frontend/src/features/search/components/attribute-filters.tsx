'use client';

/**
 * Schema-driven attribute filters (master prompt §22, §117–118).
 *
 * Built strictly from the category's effective `filter-schema`: only fields
 * whose type + operators are supported get a control. Values live in URL
 * `filter[]` expressions (`key:operator:value`, frontend-api-contract §7.1).
 * Unsupported field types (e.g. DATE) are skipped rather than half-rendered.
 */

import { useEffect, useState } from 'react';
import { useQueryStates } from 'nuqs';
import type { FilterSchemaField } from '@/features/categories';
import {
  MAX_FILTER_EXPRESSIONS,
  parseFilterExpression,
  parseFilterExpressions,
  sanitizeFilterValue,
  serializeFilterExpression,
  type FilterExpression,
  type FilterOperator,
} from '@/features/search';
import { discoveryParamsParsers } from '@/features/search/parsers';
import { NumberInput, SelectInput, TextInput } from './field-inputs';

type ControlKind = 'select' | 'boolean' | 'range' | 'text';

function pickControl(field: FilterSchemaField): ControlKind | null {
  const { operators, options, type } = field;
  if (!field.filterable || operators.length === 0) return null;
  if (type === 'BOOLEAN' && operators.includes('eq')) return 'boolean';
  if (
    (type === 'SELECT' || type === 'MULTI_SELECT') &&
    options.length > 0 &&
    (operators.includes('eq') || operators.includes('in'))
  ) {
    return 'select';
  }
  if (type === 'NUMBER' && (operators.includes('gte') || operators.includes('lte'))) return 'range';
  if (
    (type === 'TEXT' || type === 'LONG_TEXT') &&
    (operators.includes('contains') || operators.includes('eq'))
  ) {
    return 'text';
  }
  return null;
}

/** URL-bound state for one attribute: its expressions + a replace helper. */
function useFieldExpressions(fieldKey: string) {
  const [params, setParams] = useQueryStates(discoveryParamsParsers, { history: 'push' });
  const filters = params.filter;
  const expressions = parseFilterExpressions(filters).filter(
    (expression) => expression.key === fieldKey,
  );

  function replace(next: FilterExpression[]) {
    const others = (filters ?? []).filter(
      (raw) => parseFilterExpression(raw)?.key !== fieldKey,
    );
    const merged = [...others, ...next.map(serializeFilterExpression)].slice(
      0,
      MAX_FILTER_EXPRESSIONS,
    );
    void setParams({ filter: merged.length > 0 ? merged : null });
  }

  return { expressions, replace };
}

function fieldLabel(field: FilterSchemaField): string {
  return field.unit ? `${field.label} (${field.unit})` : field.label;
}

const NUMBER_PATTERN = /^\d+(\.\d{1,2})?$/;

interface AttributeFilterFieldProps {
  field: FilterSchemaField;
  idPrefix: string;
}

function AttributeFilterField({ field, idPrefix }: AttributeFilterFieldProps) {
  const kind = pickControl(field);
  if (kind === null) return null;
  const id = `${idPrefix}-filter-${field.field}`;
  if (kind === 'boolean') return <BooleanFilter field={field} id={id} />;
  if (kind === 'select') return <SelectFilter field={field} id={id} />;
  if (kind === 'range') return <RangeFilter field={field} id={id} />;
  return <TextFilter field={field} id={id} />;
}

interface AttributeFiltersProps {
  fields: FilterSchemaField[];
  idPrefix: string;
}

/** Renders every supported filterable field of the category schema. */
export function AttributeFilters({ fields, idPrefix }: AttributeFiltersProps) {
  const supported = fields.filter((field) => pickControl(field) !== null);
  if (supported.length === 0) return null;
  return (
    <fieldset className="space-y-4 border-t border-border pt-4">
      <legend className="text-ui font-medium text-foreground">ویژگی‌ها</legend>
      {supported.map((field) => (
        <AttributeFilterField key={field.field} field={field} idPrefix={idPrefix} />
      ))}
    </fieldset>
  );
}

function BooleanFilter({ field, id }: { field: FilterSchemaField; id: string }) {
  const { expressions, replace } = useFieldExpressions(field.field);
  const current = expressions.find((expression) => expression.operator === 'eq')?.value ?? '';
  return (
    <SelectInput
      id={id}
      label={fieldLabel(field)}
      value={current}
      onChange={(value) =>
        replace(value ? [{ key: field.field, operator: 'eq', value }] : [])
      }
    >
      <option value="">همه</option>
      <option value="true">بله</option>
      <option value="false">نخیر</option>
    </SelectInput>
  );
}

function SelectFilter({ field, id }: { field: FilterSchemaField; id: string }) {
  const { expressions, replace } = useFieldExpressions(field.field);
  const operator: FilterOperator = field.operators.includes('eq') ? 'eq' : 'in';
  const current = expressions.find((expression) => expression.operator === operator)?.value ?? '';
  return (
    <SelectInput
      id={id}
      label={fieldLabel(field)}
      value={current}
      onChange={(value) =>
        replace(value ? [{ key: field.field, operator, value }] : [])
      }
    >
      <option value="">همه</option>
      {field.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </SelectInput>
  );
}

function RangeFilter({ field, id }: { field: FilterSchemaField; id: string }) {
  const { expressions, replace } = useFieldExpressions(field.field);
  const gte = expressions.find((expression) => expression.operator === 'gte')?.value ?? '';
  const lte = expressions.find((expression) => expression.operator === 'lte')?.value ?? '';
  const [from, setFrom] = useState(gte);
  const [to, setTo] = useState(lte);

  useEffect(() => setFrom(gte), [gte]);
  useEffect(() => setTo(lte), [lte]);

  function commit(operator: FilterOperator, raw: string) {
    const cleaned = raw.trim();
    const kept = expressions.filter((expression) => expression.operator !== operator);
    if (cleaned && NUMBER_PATTERN.test(cleaned)) {
      replace([...kept, { key: field.field, operator, value: cleaned }]);
    } else {
      replace(kept);
    }
  }

  const supportsGte = field.operators.includes('gte');
  const supportsLte = field.operators.includes('lte');

  return (
    <div className="space-y-1.5">
      <p className="text-ui font-medium text-foreground">{fieldLabel(field)}</p>
      <div className="grid grid-cols-2 gap-2">
        {supportsGte ? (
          <NumberInput
            id={`${id}-from`}
            label="از"
            value={from}
            onChange={setFrom}
            onCommit={(value) => commit('gte', value)}
            placeholder="حداقل"
          />
        ) : null}
        {supportsLte ? (
          <NumberInput
            id={`${id}-to`}
            label="تا"
            value={to}
            onChange={setTo}
            onCommit={(value) => commit('lte', value)}
            placeholder="حداکثر"
          />
        ) : null}
      </div>
    </div>
  );
}

function TextFilter({ field, id }: { field: FilterSchemaField; id: string }) {
  const { expressions, replace } = useFieldExpressions(field.field);
  const operator: FilterOperator = field.operators.includes('contains') ? 'contains' : 'eq';
  const current = expressions.find((expression) => expression.operator === operator)?.value ?? '';
  const [value, setValue] = useState(current);

  useEffect(() => setValue(current), [current]);

  function commit(raw: string) {
    const cleaned = sanitizeFilterValue(raw);
    const kept = expressions.filter((expression) => expression.operator !== operator);
    if (!cleaned || cleaned === current) {
      if (!cleaned) replace(kept);
      return;
    }
    replace([...kept, { key: field.field, operator, value: cleaned }]);
  }

  return (
    <TextInput
      id={id}
      label={fieldLabel(field)}
      value={value}
      onChange={setValue}
      onCommit={commit}
      placeholder={field.placeholder ?? 'مقدار…'}
    />
  );
}
