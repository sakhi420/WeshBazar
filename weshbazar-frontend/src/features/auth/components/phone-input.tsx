'use client';

/**
 * Phone input (master prompt §133) — Latin digits, LTR-forced field inside the
 * RTL layout, tel keypad on mobile. Value stays raw; the submit path applies
 * `normalizePhone` before sending.
 */

import { cn } from '@/lib/utils';
import { INPUT_CLASS } from './form-field';

export interface PhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}

export function PhoneInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  autoFocus,
}: PhoneInputProps) {
  return (
    <input
      id={id}
      type="tel"
      inputMode="tel"
      dir="ltr"
      autoComplete="tel"
      placeholder="07XX XXX XXX"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      autoFocus={autoFocus}
      className={cn(INPUT_CLASS, 'text-start')}
    />
  );
}
