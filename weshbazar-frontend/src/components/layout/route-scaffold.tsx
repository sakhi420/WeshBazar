import { Construction } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

interface RouteScaffoldProps {
  title: string;
  /** The route path, shown verbatim (bidi-isolated) for clarity. */
  route: string;
  /** One-line purpose from the master prompt page contract. */
  purpose?: string;
}

/**
 * Honest placeholder for routes that exist in the sitemap but are not built yet.
 * This is NOT fake content — it transparently states the page is pending and
 * records the contract route/purpose so the scaffold is navigable and truthful.
 */
export function RouteScaffold({ title, route, purpose }: RouteScaffoldProps) {
  return (
    <PageContainer>
      <PageHeading title={title} description={purpose} />
      <EmptyState
        className="mt-6"
        icon={Construction}
        title="این صفحه در مرحلهٔ بعدی ساخته می‌شود"
        description="زیرساخت پروژه آماده است؛ پیاده‌سازی این صفحه بر اساس قرارداد صفحه در مستند اصلی انجام خواهد شد."
      />
      <p className="bidi-ltr mt-4 text-center text-caption text-muted-foreground">
        route: <span className="font-mono">{route}</span>
      </p>
    </PageContainer>
  );
}
