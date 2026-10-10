import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Add vertical breathing room between stacked sections (§16 section gaps). */
  as?: 'div' | 'section';
}

/**
 * Constrained centered content container for public pages (§13). Uses the
 * responsive page padding token: 16px mobile / 20px tablet / 24px desktop.
 */
export function PageContainer({ children, className, as = 'div' }: PageContainerProps) {
  const Tag = as;
  return <Tag className={cn('container w-full py-section-y', className)}>{children}</Tag>;
}
