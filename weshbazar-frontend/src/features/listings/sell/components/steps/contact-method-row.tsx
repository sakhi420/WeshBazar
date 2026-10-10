'use client';

/**
 * One contact method row (§39, §53; shared with the edit page §42): icon +
 * title + direction-aware switch, with the optional override slot rendered
 * below while the method is enabled.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MethodRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onToggle: (enabled: boolean) => void;
  children?: ReactNode;
}

export function MethodRow({
  icon,
  title,
  description,
  checked,
  onToggle,
  children,
}: MethodRowProps) {
  return (
    <div className="bg-card rounded-card border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
            {icon}
          </span>
          <div className="min-w-0">
            <p className="text-ui font-medium text-foreground">{title}</p>
            <p className="text-meta text-muted-foreground">{description}</p>
          </div>
        </div>
        <Switch checked={checked} label={title} onChange={onToggle} />
      </div>
      {checked && children ? (
        <div className="mt-3 border-t border-border pt-3">{children}</div>
      ) : null}
    </div>
  );
}

/** Direction-aware switch: thumb travels toward the inline end when on. */
export function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 outline-none transition-colors duration-small focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'justify-end bg-primary' : 'justify-start bg-muted',
      )}
    >
      <span aria-hidden className="size-6 rounded-full bg-surface shadow-sm" />
    </button>
  );
}
