import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';
import { HeaderAuthActions } from '@/components/layout/header-auth-actions';

/**
 * Mobile header (master prompt §101): 56px top bar.
 * Logo at inline-start, sell CTA + auth actions at inline-end.
 * Visible only on screens < 768px (lg:hidden).
 */
export function MobileHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface/80 shadow-soft backdrop-blur-md lg:hidden">
      <div className="flex h-header items-center justify-between px-4">
        <Link
          href="/"
          aria-label="وش‌بازار — صفحه اصلی"
          className="flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandLogo height={28} priority />
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="جست‌وجو">
            <Link href="/search">
              <Search aria-hidden />
            </Link>
          </Button>
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