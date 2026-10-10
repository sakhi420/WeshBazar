import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Empty state (master prompt §18). Honest, non-fabricated messaging with an
 * optional recovery action. Never invent fake content to fill a list.
 */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <p className="text-card-title font-semibold text-foreground">{title}</p>
      {description ? <p className="max-w-prose text-ui text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
