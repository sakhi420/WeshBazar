'use client';

/**
 * Password field (master prompt §135) — LTR-forced entry with an explicit
 * show/hide toggle. The toggle is a real button with an aria-label and an
 * aria-pressed state; the input keeps autocomplete hints for password managers.
 */

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { INPUT_CLASS } from './form-field';

export interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** `current-password` on login, `new-password` on register/reset (§7). */
  autoComplete: 'current-password' | 'new-password';
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  placeholder?: string;
}

export function PasswordField({
  id,
  value,
  onChange,
  autoComplete,
  disabled,
  invalid,
  describedBy,
  autoFocus,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        dir="ltr"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={cn(INPUT_CLASS, 'pe-11 text-start')}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'پنهان‌کردن رمز عبور' : 'نمایش رمز عبور'}
        aria-pressed={visible}
        disabled={disabled}
        className="absolute inset-y-0 end-0 inline-flex w-11 items-center justify-center rounded-control text-muted-foreground transition-colors duration-micro hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" strokeWidth={1.8} />
        ) : (
          <Eye aria-hidden className="size-4" strokeWidth={1.8} />
        )}
      </button>
    </div>
  );
}
