'use client';

/**
 * OTP code input (master prompt §134) — digit-only, numeric keypad on mobile,
 * `one-time-code` autocomplete so the SMS suggestion can fill it. Persian and
 * Arabic-Indic digits are normalized to Latin; the component owns the digit
 * filtering so parents receive an always-clean string.
 */

import { cn } from '@/lib/utils';
import { OTP_MAX_DIGITS, stripToDigits } from '@/features/auth/validation';
import { INPUT_CLASS } from './form-field';

export interface OtpInputProps {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
}

export function OtpInput({
  id,
  value,
  onChange,
  disabled,
  invalid,
  describedBy,
  autoFocus,
}: OtpInputProps) {
  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      dir="ltr"
      placeholder="––––––"
      maxLength={OTP_MAX_DIGITS}
      value={value}
      onChange={(event) => onChange(stripToDigits(event.target.value, OTP_MAX_DIGITS))}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      autoFocus={autoFocus}
      className={cn(INPUT_CLASS, 'text-center text-body font-medium tracking-[0.4em]')}
    />
  );
}
