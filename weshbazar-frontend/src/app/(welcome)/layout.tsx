import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';

const persianYear = new Intl.NumberFormat('fa-AF').format(new Date().getFullYear());

/**
 * Welcome landing shell — deliberately lighter than the marketplace chrome.
 * Header keeps the reference top bar (logo right, tagline left); footer is a
 * simple 3-part brand footer with a dynamic copyright year (§4, §6).
 */
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-header border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="ویش‌بازار — صفحه نخست"
            className="flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <BrandLogo height={30} priority />
          </Link>

          <p className="hidden items-center gap-1 text-caption font-medium text-muted-foreground sm:inline-flex">
            بازار بزرگ آنلاین افغانستان <span aria-hidden>💛</span>
          </p>
        </div>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="bg-primary-dark text-white">
        <div className="container grid gap-6 py-10 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-10">
          <Link
            href="/"
            aria-label="ویش‌بازار"
            className="inline-flex justify-self-center rounded-control focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none md:justify-self-start"
          >
            <BrandLogo variant="white" height={30} />
          </Link>

          <p className="max-w-md text-center text-body leading-7 text-white/80 md:mx-auto">
            بازار آنلاین خرید و فروش در افغانستان؛ جست‌وجوی ساده، ثبت آگهی و تماس مستقیم با فروشنده.
          </p>

          <p className="text-center text-caption text-white/60 md:text-end">
            © {persianYear} همه حقوق برای ویش‌بازار محفوظ است.
          </p>
        </div>
      </footer>
    </div>
  );
}