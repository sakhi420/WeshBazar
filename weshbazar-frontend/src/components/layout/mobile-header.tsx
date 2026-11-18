import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { HeaderAuthActions } from '@/components/layout/header-auth-actions';

/**
 * Shared mobile app header.
 * Keep the same compact one-row chrome across every marketplace route.
 * Search remains available through the bottom navigation and page-specific
 * search controls instead of consuming a second row in the global header.
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface/90 shadow-soft backdrop-blur-md lg:hidden">
      <div className="flex h-header items-center justify-between px-4">
        <Link
          href="/market"
          aria-label="ویش‌بازار — صفحه اصلی"
          className="flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandLogo height={28} priority />
        </Link>

        <nav aria-label="اقدام‌های حساب" className="flex items-center gap-1">
          <Button asChild variant="accent" size="icon" aria-label="ثبت آگهی">
            <Link href="/sell">
              <Plus aria-hidden />
            </Link>
          </Button>
          <HeaderAuthActions />
        </nav>
      </div>
    </header>
  );
}
