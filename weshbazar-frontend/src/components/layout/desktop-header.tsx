import { Suspense } from 'react';
import Link from 'next/link';
import { Grid3X3, Plus } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { HeaderAuthActions } from '@/components/layout/header-auth-actions';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

/**
 * Desktop header (master prompt §102): 64px full top bar.
 * Logo + wide search + location picker + category link + sell CTA + auth actions.
 * Visible only on screens >= 768px (hidden lg:flex).
 */
export function DesktopHeader() {
  return (
    <header className="sticky top-0 z-header hidden border-b border-border bg-surface/80 shadow-soft backdrop-blur-md lg:flex">
      <div className="container flex h-[4rem] items-center gap-3">
        <Link
          href="/"
          aria-label="ویش‌بازار — صفحه اصلی"
          className="me-4 flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandLogo height={34} priority />
        </Link>

        <Suspense fallback={null}>
          <SearchField className="min-w-0 max-w-xl flex-1" redirectToSearch />
        </Suspense>

        <Suspense fallback={null}>
          <LocationPicker inline redirectToSearch />
        </Suspense>

        <Button asChild variant="ghost" size="sm" className="shrink-0">
          <Link href="/categories">
            <Grid3X3 aria-hidden />
            <span>دسته‌ها</span>
          </Link>
        </Button>

        <Button asChild variant="accent" size="sm">
          <Link href="/sell">
            <Plus aria-hidden />
            <span>ثبت آگهی</span>
          </Link>
        </Button>

        <HeaderAuthActions />
      </div>
    </header>
  );
}