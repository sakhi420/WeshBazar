'use client';

/**
 * Dynamic attribute field (master prompt §136, §37) — renders one
 * `FilterSchemaField` with the control its schema type calls for. Labelable
 * controls use the shared `FormField`; group controls (BOOLEAN,
 * MULTI_SELECT) get a local fieldset because `<label for>` has no single
 * target there. Values are stored raw (numbers as text) and coerced by the
 * payload builder, so typing stays friction-free while the server keeps the
 * final say.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FormField, INPUT_CLASS, fieldMessageId } from '@/features/auth/components';
import { formatNumber } from '@/features/listings';
import type { AttributeValue } from '@/features/listings';
import type { FilterSchemaField } from '@/features/categories';

interface AttributeFieldProps {
  field: FilterSchemaField;
  value: AttributeValue | undefined;
  error?: string;
  onChange: (value: AttributeValue | undefined) => void;
}

export function AttributeField({ field, value, error, onChange }: AttributeFieldProps) {
  const id = `attr-${field.field}`;
  const hint = buildHint(field);
  const describedBy = fieldMessageId(id, error, hint);

  switch (field.type) {
    case 'LONG_TEXT':
      return (
        <FormField id={id} label={field.label} hint={hint} error={error}>
          <textarea
            id={id}
            rows={4}
            value={asText(value)}
            onChange={(event) => onChange(emptyToUndefined(event.target.value))}
            placeholder={field.placeholder ?? undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(INPUT_CLASS, 'h-auto py-2 leading-6')}
          />
        </FormField>
      );
    case 'INTEGER':
    case 'YEAR':
    case 'DECIMAL':
      return (
        <FormField id={id} label={field.label} hint={hint} error={error}>
          <input
            id={id}
            type="text"
            inputMode={field.type === 'DECIMAL' ? 'decimal' : 'numeric'}
            dir="ltr"
            value={asText(value)}
            onChange={(event) => onChange(emptyToUndefined(event.target.value))}
            placeholder={field.placeholder ?? undefined}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(INPUT_CLASS, 'text-start')}
          />
        </FormField>
      );
    case 'DATE':
      return (
        <FormField id={id} label={field.label} hint={hint} error={error}>
          <input
            id={id}
            type="date"
            dir="ltr"
            value={asText(value)}
            onChange={(event) => onChange(emptyToUndefined(event.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(INPUT_CLASS, 'text-start')}
          />
        </FormField>
      );
    case 'BOOLEAN':
      return (
        <GroupField id={id} label={field.label} hint={hint} error={error}>
          <ChoiceButton
            active={value === true}
            onClick={() => onChange(value === true ? undefined : true)}
          >
            بله
          </ChoiceButton>
          <ChoiceButton
            active={value === false}
            onClick={() => onChange(value === false ? undefined : false)}
          >
            نخیر
          </ChoiceButton>
        </GroupField>
      );
    case 'SELECT':
      return (
        <FormField id={id} label={field.label} hint={hint} error={error}>
          <select
            id={id}
            value={asText(value)}
            onChange={(event) => onChange(emptyToUndefined(event.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={INPUT_CLASS}
          >
            <option value="">انتخاب کنید…</option>
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      );
    case 'MULTI_SELECT': {
      const selected = Array.isArray(value) ? value : [];
      return (
        <GroupField id={id} label={field.label} hint={hint} error={error}>
          {field.options.map((option) => (
            <ChoiceButton
              key={option.value}
              active={selected.includes(option.value)}
              onClick={() => onChange(toggleOption(selected, option.value))}
            >
              {option.label}
            </ChoiceButton>
          ))}
        </GroupField>
      );
    }
    default:
      // Unknown schema types degrade to plain text so nothing is silently
      // hidden; the server engine remains the source of truth.
      return (
        <FormField id={id} label={field.label} hint={hint} error={error}>
          <input
            id={id}
            type="text"
            value={asText(value)}
            onChange={(event) => onChange(emptyToUndefined(event.target.value))}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={INPUT_CLASS}
          />
        </FormField>
      );
  }
}

/** Raw form value → display text (numbers become their digit string). */
function asText(value: AttributeValue | undefined): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function emptyToUndefined(raw: string): AttributeValue | undefined {
  return raw.trim().length === 0 ? undefined : raw;
}

function toggleOption(selected: string[], option: string): AttributeValue | undefined {
  const next = selected.includes(option)
    ? selected.filter((item) => item !== option)
    : [...selected, option];
  return next.length === 0 ? undefined : next;
}

/** Quiet helper text: required marker, unit, ranges and length limits. */
function buildHint(field: FilterSchemaField): string | undefined {
  const parts: string[] = [];
  if (field.required) parts.push('الزامی');
  if (field.unit !== null) parts.push(`واحد: ${field.unit}`);
  if (field.min !== null || field.max !== null) {
    const min = field.min !== null ? formatNumber(field.min) : '—';
    const max = field.max !== null ? formatNumber(field.max) : '—';
    parts.push(`محدودهٔ مجاز: ${min} تا ${max}`);
  }
  if (field.minLength !== null && field.maxLength !== null) {
    parts.push(
      `بین ${formatNumber(field.minLength)} تا ${formatNumber(field.maxLength)} نویسه`,
    );
  } else if (field.minLength !== null) {
    parts.push(`حداقل ${formatNumber(field.minLength)} نویسه`);
  } else if (field.maxLength !== null) {
    parts.push(`حداکثر ${formatNumber(field.maxLength)} نویسه`);
  }
  return parts.length === 0 ? undefined : parts.join(' — ');
}

interface GroupFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Fieldset shell for choice groups — mirrors the FormField error/hint ids. */
function GroupField({ id, label, hint, error, children }: GroupFieldProps) {
  const describedBy = fieldMessageId(id, error, hint);
  return (
    <fieldset className="space-y-1.5">
      <legend className="block text-ui font-medium text-foreground">{label}</legend>
      <div role="group" aria-describedby={describedBy} className="flex flex-wrap gap-2">
        {children}
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-meta text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-meta text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

interface ChoiceButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Toggle chip used by BOOLEAN (on/off) and MULTI_SELECT (membership). */
function ChoiceButton({ active, onClick, children }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-touch rounded-control border px-4 text-ui outline-none transition-colors duration-small focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active
          ? 'border-primary bg-primary-soft font-medium text-primary'
          : 'border-input bg-surface text-foreground hover:bg-muted/50',
      )}
    >
      {children}
    </button>
  );
}
