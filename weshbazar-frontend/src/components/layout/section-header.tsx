import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  id?: string;
  title: string;
  icon?: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable section heading with optional icon and trailing action link (§149).
 */
export function SectionHeader({ id, title, icon: Icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <h2 id={id} className="flex items-center gap-2 text-section font-semibold">
        {Icon ? <Icon className="size-5 text-primary" aria-hidden /> : null}
        {title}
      </h2>
      {action}
    </div>
  );
}