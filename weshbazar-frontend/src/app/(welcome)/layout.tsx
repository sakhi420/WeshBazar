import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { EnterMarketCta } from '@/features/welcome/enter-market-cta';

const navItems = [
  { href: '#features', label: 'امکانات' },
  { href: '#how', label: 'روش کار' },
  { href: '#safety', label: 'ایمنی معامله' },
] as const;

const marketLinks = [
  { href: '/market', label: 'بازار' },
  { href: '/categories', label: 'دسته‌ها' },
  { href: '/search', label: 'جست‌وجو' },
  { href: '/sell', label: 'ثبت آگهی' },
] as const;

const helpLinks = [
  { href: '/help', label: 'مرکز راهنمایی' },
  { href: '/help/safety', label: 'نکات ایمنی' },
  { href: '/about', label: 'درباره ما' },
  { href: '/contact', label: 'تماس با ما' },
] as const;

const persianYear = new Intl.NumberFormat('fa-AF').format(new Date().getFullYear());

const linkBase =
  'inline-flex rounded-control text-white/75 transition-colors duration-small hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none';

/**
 * Welcome landing shell — deliberately lighter than the marketplace chrome,
 * with a minimal sticky header and a compact brand footer (§1, §4, §8).
 */
export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-header border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="ویش‌بازار — صفحه نخست"
            className="flex shrink-0 items-center rounded-control focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <BrandLogo height={30} priority />
          </Link>

          <nav aria-label="ناوبری صفحه" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-control px-3 py-2 text-ui text-muted-foreground transition-colors duration-small hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <EnterMarketCta variant="default" size="sm" className="font-semibold">
            ورود به ویش‌بازار
            <ArrowLeft aria-hidden />
          </EnterMarketCta>
        </div>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="bg-primary-dark text-white">
        <div className="container flex flex-col gap-8 py-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm space-y-4">
            <Link
              href="/"
              aria-label="ویش‌بازار"
              className="inline-flex rounded-control focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <BrandLogo variant="white" height={30} />
            </Link>
            <p className="text-ui leading-7 text-white/75">
              بازار آنلاین خرید و فروش در افغانستان؛ جست‌وجوی ساده، ثبت آگهی و تماس مستقیم با
              فروشنده.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8">
            <nav aria-label="لینک‌های بازار" className="space-y-3">
              <h2 className="text-ui font-semibold text-white">بازار</h2>
              <ul className="space-y-2">
                {marketLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkBase}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label="راهنما" className="space-y-3">
              <h2 className="text-ui font-semibold text-white">راهنما</h2>
              <ul className="space-y-2">
                {helpLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkBase}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="container flex flex-col gap-1 py-4 text-caption text-white/60 sm:flex-row sm:items-center sm:justify-between">
            <p translate="no">WeshBazar</p>
            <p>© {persianYear} همه حقوق برای ویش‌بازار محفوظ است.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}