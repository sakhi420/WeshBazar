import { cn } from '@/lib/utils';

interface PageHeadingProps {
  /** The page H1 (§20 requires a clear H1 or equivalent on every page). */
  title: string;
  description?: string;
  /** Optional inline-end actions (e.g. a primary action button). */
  actions?: React.ReactNode;
  className?: string;
}

/** Page heading block: H1 + optional lede + inline-end actions. */
export function PageHeading({ title, description, actions, className }: PageHeadingProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-heading font-bold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-ui text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
