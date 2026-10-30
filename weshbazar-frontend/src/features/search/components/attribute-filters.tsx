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
  translateAttributeLabel,
  translateAttributeUnit,
  translateAttributeValue,
  type FacetCount,
} from '@/features/listings';
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
import { recordSearchEvent } from '../telemetry';
import { NumberInput, SelectInput, TextInput } from './field-inputs';

type ControlKind = 'select' | 'multi' | 'boolean' | 'range' | 'text';

/**
 * Numeric family the backend emits for range-style filters. The contract uses
 * `INTEGER` / `DECIMAL` / `YEAR` (see docs/openapi.json FilterSchemaFieldDto),
 * never the literal `NUMBER` the old guard checked for — which silently dropped
 * year / km / m² / bedroom attributes from category filters.
 */
const RANGE_TYPES = new Set(['NUMBER', 'INTEGER', 'DECIMAL', 'YEAR']);

function pickControl(field: FilterSchemaField): ControlKind | null {
  const { operators, options, type } = field;
  if (!field.filterable || operators.length === 0) return null;
  if (type === 'BOOLEAN' && operators.includes('eq')) return 'boolean';
  if (
    type === 'SELECT' &&
    options.length > 0 &&
    (operators.includes('eq') || operators.includes('in'))
  ) {
    return 'select';
  }
  // MULTI_SELECT is multi-value: a real multi-select control producing `in:…`
  // (the backend accepts `in` — docs/openapi.json FilterOperatorDto).
  if (type === 'MULTI_SELECT' && options.length > 0 && operators.includes('in')) {
    return 'multi';
  }
  if (RANGE_TYPES.has(type) && (operators.includes('gte') || operators.includes('lte'))) return 'range';
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
  const [params, setParams] = useQueryStates(discoveryParamsParsers, { history: 'push', shallow: false });
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

    // Lightweight usage telemetry: an attribute facet was applied or removed.
    if (next.length !== expressions.length) {
      void recordSearchEvent({
        type: next.length > expressions.length ? 'filter_applied' : 'filter_removed',
        filterKey: fieldKey,
        filterValue: next[0]?.value,
      });
    }
  }

  return { expressions, replace };
}

function fieldLabel(field: FilterSchemaField): string {
  const label = translateAttributeLabel(field.field, field.label);
  const unit = translateAttributeUnit(field.unit);
  return unit ? `${label} (${unit})` : label;
}

/** Selectable option display text — stored slug translated, raw label as fallback. */
function optionText(option: { value: string; label: string }, type: string): string {
  const translated = translateAttributeValue(option.value, type);
  return translated === option.value ? option.label : translated;
}

/** Resolve a single option's match count from the facet payload (null if absent). */
function facetCountFor(
  counts: Record<string, FacetCount[]> | undefined,
  key: string,
  value: string,
): number | null {
  const entry = counts?.[key]?.find((item) => item.value === value);
  return entry ? entry.count : null;
}

const NUMBER_PATTERN = /^\d+(\.\d{1,2})?$/;

interface AttributeFilterFieldProps {
  field: FilterSchemaField;
  idPrefix: string;
  facetCounts?: Record<string, FacetCount[]>;
}

function AttributeFilterField({ field, idPrefix, facetCounts }: AttributeFilterFieldProps) {
  const kind = pickControl(field);
  if (kind === null) return null;
  const id = `${idPrefix}-filter-${field.field}`;
  if (kind === 'boolean') return <BooleanFilter field={field} id={id} />;
  if (kind === 'select') return <SelectFilter field={field} id={id} counts={facetCounts} />;
  if (kind === 'multi') return <MultiSelectFilter field={field} id={id} counts={facetCounts} />;
  if (kind === 'range') return <RangeFilter field={field} id={id} />;
  return <TextFilter field={field} id={id} />;
}

interface AttributeFiltersProps {
  fields: FilterSchemaField[];
  idPrefix: string;
  facetCounts?: Record<string, FacetCount[]>;
}

/** Renders every supported filterable field of the category schema. */
export function AttributeFilters({ fields, idPrefix, facetCounts }: AttributeFiltersProps) {
  const supported = fields.filter((field) => pickControl(field) !== null);
  if (supported.length === 0) return null;
  return (
    <fieldset className="space-y-4 border-t border-border pt-4">
      <legend className="text-ui font-medium text-foreground">ویژگی‌ها</legend>
      {supported.map((field) => (
        <AttributeFilterField
          key={field.field}
          field={field}
          idPrefix={idPrefix}
          facetCounts={facetCounts}
        />
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

function SelectFilter({
  field,
  id,
  counts,
}: {
  field: FilterSchemaField;
  id: string;
  counts?: Record<string, FacetCount[]>;
}) {
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
      {field.options.map((option) => {
        const count = facetCountFor(counts, field.field, option.value);
        const text = optionText(option, field.type);
        return (
          <option key={option.value} value={option.value}>
            {count === null ? text : `${text} (${count})`}
          </option>
        );
      })}
    </SelectInput>
  );
}

function MultiSelectFilter({
  field,
  id,
  counts,
}: {
  field: FilterSchemaField;
  id: string;
  counts?: Record<string, FacetCount[]>;
}) {
  const { expressions, replace } = useFieldExpressions(field.field);
  const operator: FilterOperator = field.operators.includes('in') ? 'in' : 'eq';
  const current = expressions.find((expression) => expression.operator === operator)?.value ?? '';
  const selected = new Set(current ? current.split(',') : []);

  function toggle(optionValue: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(optionValue);
    else next.delete(optionValue);
    // Preserve schema option order so the URL expression stays deterministic.
    const ordered = field.options
      .filter((option) => next.has(option.value))
      .map((option) => option.value);
    replace(
      ordered.length > 0
        ? [{ key: field.field, operator, value: ordered.join(',') }]
        : [],
    );
  }

  return (
    <fieldset>
      <legend className="text-ui font-medium text-foreground">{fieldLabel(field)}</legend>
      <div className="space-y-1">
        {field.options.map((option) => {
          const inputId = `${id}-${option.value}`;
          const checked = selected.has(option.value);
          const count = facetCountFor(counts, field.field, option.value);
          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className="flex min-h-11 cursor-pointer items-center gap-2.5 text-body text-foreground"
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={(event) => toggle(option.value, event.target.checked)}
                className="size-5 shrink-0 accent-primary"
              />
              {optionText(option, field.type)}
              {count !== null ? (
                <span className="text-caption text-muted-foreground">({count})</span>
              ) : null}
            </label>
          );
        })}
      </div>
    </fieldset>
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

  const fromNum = from.trim() === '' ? null : Number(from);
  const toNum = to.trim() === '' ? null : Number(to);
  const crossError =
    fromNum !== null &&
    toNum !== null &&
    Number.isFinite(fromNum) &&
    Number.isFinite(toNum) &&
    fromNum > toNum
      ? 'حداقل نمی‌تواند از حداکثر بزرگ‌تر باشد.'
      : null;
  const errorId = `${id}-range-error`;

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
            invalid={crossError !== null}
            describedBy={crossError ? errorId : undefined}
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
            invalid={crossError !== null}
            describedBy={crossError ? errorId : undefined}
          />
        ) : null}
      </div>
      {crossError ? (
        <p id={errorId} role="alert" className="text-caption text-danger">
          {crossError}
        </p>
      ) : null}
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
