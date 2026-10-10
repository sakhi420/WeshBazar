/**
 * Form field shell (master prompt §137) — label + control + hint/error
 * grouping used by every auth form. Presentational only: it renders the
 * passed-in control and wires the described-by id conventions.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Shared input geometry — token-based, matching the filter field controls. */
export const INPUT_CLASS =
  'h-control w-full rounded-control border border-input bg-background px-3 text-ui text-foreground outline-none transition-colors duration-small placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger';

/** Id used for the described-by wiring of error / hint text. */
export function fieldMessageId(id: string, error: string | undefined, hint: string | undefined) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Renders a quiet «(اختیاری)» marker next to the label. */
  optional?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ id, label, hint, error, optional, children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-ui font-medium text-foreground">
        {label}
        {optional ? (
          <span className="ms-1 text-meta font-normal text-muted-foreground">(اختیاری)</span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-meta text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-meta text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
