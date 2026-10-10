'use client';

/**
 * Radio-style choice card shared by the sell basic step and the edit page
 * (§14 touch size, §36, §42): label + optional description with an aria
 * radio state. Extracted so both surfaces render the identical control.
 */

import { cn } from '@/lib/utils';

interface ChoiceButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  description?: string;
}

export function ChoiceButton({ active, onClick, label, description }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={cn(
        'flex min-h-control items-start gap-2 rounded-control border px-3 py-2 text-start outline-none transition-colors duration-small focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        active ? 'border-primary bg-primary-soft' : 'border-input bg-surface hover:bg-muted/50',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
          active ? 'border-primary' : 'border-muted-foreground',
        )}
      >
        {active ? <span className="size-2 rounded-full bg-primary" /> : null}
      </span>
      <span className="min-w-0">
        <span
          className={cn('block text-ui', active ? 'font-medium text-primary' : 'text-foreground')}
        >
          {label}
        </span>
        {description ? (
          <span className="mt-0.5 block text-meta text-muted-foreground">{description}</span>
        ) : null}
      </span>
    </button>
  );
}
