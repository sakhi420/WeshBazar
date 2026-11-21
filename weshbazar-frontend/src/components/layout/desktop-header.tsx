'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Plus } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { HeaderAuthActions } from '@/components/layout/header-auth-actions';
import { LocationPicker } from '@/components/location/location-picker';
import { SearchField } from '@/features/search/components/search-field';

/**
 * Desktop header.
 *
 * The homepage owns its search experience in the hero, so its header only
 * carries global navigation and actions. Other marketplace routes keep the
 * compact header search and location controls.
 */
export function DesktopHeader() {
  const pathname = usePathname();
  const isMarketplaceHome = pathname === '/market';

  return (
    <header className="sticky top-0 z-header hidden border-b border-border bg-surface/85 shadow-soft backdrop-blur-md lg:flex">
      <div className="container flex h-[4rem] items-center gap-3">
        <Link
          href="/market"
          aria-label="ویش‌بازار — صفحه اصلی"
          className="me-4 flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandLogo height={34} priority />
        </Link>

        {isMarketplaceHome ? (
          <div aria-hidden className="flex-1" />
        ) : (
          <>
            <Suspense fallback={null}>
              <SearchField className="min-w-0 max-w-xl flex-1" redirectToSearch />
            </Suspense>

            <Suspense fallback={null}>
              <LocationPicker inline redirectToSearch />
            </Suspense>
          </>
        )}

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
