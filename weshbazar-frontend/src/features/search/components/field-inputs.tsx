'use client';

/**
 * Shared field controls for the filter surfaces (master prompt §21–22).
 * Native elements only — platform-correct mobile pickers, no extra deps.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const INPUT_CLASS =
  'h-control w-full rounded-control border border-input bg-background px-3 text-ui text-foreground outline-none transition-colors duration-small placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60';

interface FieldShellProps {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}

function FieldShell({ id, label, children, className }: FieldShellProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-ui font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

interface SelectInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: ReactNode;
}

export function SelectInput({ id, label, value, onChange, disabled, children }: SelectInputProps) {
  return (
    <FieldShell id={id} label={label}>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={INPUT_CLASS}
      >
        {children}
      </select>
    </FieldShell>
  );
}

interface TextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called on blur / Enter with the committed value. */
  onCommit: (value: string) => void;
  placeholder?: string;
}

export function TextInput({ id, label, value, onChange, onCommit, placeholder }: TextInputProps) {
  return (
    <FieldShell id={id} label={label}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onCommit(value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
        }}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </FieldShell>
  );
}

interface NumberInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Called on blur / Enter with the committed value. */
  onCommit: (value: string) => void;
  min?: number;
  placeholder?: string;
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  onCommit,
  min = 0,
  placeholder,
}: NumberInputProps) {
  return (
    <FieldShell id={id} label={label}>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        step={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => onCommit(value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') (event.target as HTMLInputElement).blur();
        }}
        placeholder={placeholder}
        className={INPUT_CLASS}
      />
    </FieldShell>
  );
}
