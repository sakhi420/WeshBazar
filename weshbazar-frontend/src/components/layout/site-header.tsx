import Link from 'next/link';
import { Search, Plus, User } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { Button } from '@/components/ui/button';

/**
 * Public app header (master prompt §37 AppShell/Header).
 * Server Component — no interactivity beyond navigation, so no client boundary.
 * RTL: the logo sits at the inline-start, actions at the inline-end.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-header border-b border-border bg-surface">
      <div className="container flex h-header items-center justify-between gap-3">
        <Link
          href="/"
          aria-label="وش‌بازار — صفحه اصلی"
          className="flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <BrandLogo height={30} priority />
        </Link>

        {/* Search entry — the search page owns the full input + URL state (§25/§27). */}
        <Link
          href="/search"
          className="flex h-control min-w-0 flex-1 items-center gap-2 rounded-control border border-input bg-background px-3 text-muted-foreground transition-colors duration-small hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Search className="size-4 shrink-0" aria-hidden />
          <span className="truncate text-ui">جست‌وجو در وش‌بازار</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1">
          <Button asChild variant="accent" size="sm" className="hidden xs:inline-flex">
            <Link href="/sell">
              <Plus aria-hidden />
              <span>ثبت آگهی</span>
            </Link>
          </Button>
          <Button asChild variant="ghost" size="icon" aria-label="حساب کاربری">
            <Link href="/auth/login">
              <User aria-hidden />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
