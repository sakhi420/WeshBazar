import { cn } from '@/lib/utils';
import { formatAttributeValue, translateAttributeLabel } from '@/features/listings';
import type { PublicAttribute } from '@/features/listings';

interface AttributeListProps {
  attributes: PublicAttribute[];
  className?: string;
}

/**
 * Dynamic specifications table (master prompt §58 block 6). Rows without a
 * displayable value are omitted; bad attribute data never crashes the page
 * (§57). Labels and values are localized via the attribute dictionary so no
 * raw English leaks through; values are bidi-isolated as they are often
 * Latin/numeric.
 */
export function AttributeList({ attributes, className }: AttributeListProps) {
  const rows = attributes
    .map((attribute) => ({
      key: attribute.key,
      label: translateAttributeLabel(attribute.key, attribute.label),
      value: formatAttributeValue(attribute),
    }))
    .filter((row) => row.value !== '');

  if (rows.length === 0) return null;

  return (
    <dl className={cn('overflow-hidden rounded-card border border-border bg-surface', className)}>
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0"
        >
          <dt className="shrink-0 text-ui text-muted-foreground">{row.label}</dt>
          <dd className="bidi-isolate text-end text-ui font-medium text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
