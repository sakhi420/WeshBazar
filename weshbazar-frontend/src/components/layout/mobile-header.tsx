import { Suspense } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { HeaderAuthActions } from '@/components/layout/header-auth-actions';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

/**
 * Mobile header (master prompt §101): top bar + always-visible keyword field.
 * The desktop header already owns search at `lg+`; this bar is `lg:hidden`.
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface/90 shadow-soft backdrop-blur-md lg:hidden">
      <div className="flex h-header items-center justify-between px-4">
        <Link
          href="/"
          aria-label="ویش‌بازار — صفحه اصلی"
          className="flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandLogo height={28} priority />
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="accent" size="icon" aria-label="ثبت آگهی">
            <Link href="/sell">
              <Plus aria-hidden />
            </Link>
          </Button>
          <HeaderAuthActions />
        </nav>
      </div>
      <div className="flex items-stretch gap-2 px-4 pb-3">
        <Suspense fallback={<div className="h-control-lg min-w-0 flex-1 rounded-control bg-muted/40" />}>
          <SearchField
            compact
            redirectToSearch
            className="min-w-0 flex-1"
            placeholder="چی می‌خواهی پیدا کنی؟"
          />
        </Suspense>
        <Suspense fallback={<div className="h-control-lg w-28 shrink-0 rounded-control bg-muted/40" />}>
          <LocationPicker inline redirectToSearch />
        </Suspense>
      </div>
    </header>
  );
}
