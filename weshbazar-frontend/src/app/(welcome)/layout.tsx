import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';
import { EnterMarketCta } from '@/features/welcome/enter-market-cta';

const persianYear = new Intl.NumberFormat('fa-AF').format(new Date().getFullYear());

const footerLinks = [
  { href: '/search', label: 'جست‌وجوی آگهی‌ها' },
  { href: '/sell', label: 'ثبت آگهی' },
  { href: '/about', label: 'درباره ما' },
  { href: '/help/safety', label: 'نکات ایمنی' },
  { href: '/contact', label: 'تماس با ما' },
  { href: '/auth/login', label: 'ورود به حساب' },
] as const;

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-header border-b border-border/60 bg-white/85 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="ویش‌بازار — صفحه نخست"
            className="flex shrink-0 items-center rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandLogo height={30} priority />
          </Link>

          <div className="flex min-w-0 items-center gap-3">
            <p className="hidden items-center gap-1.5 text-caption font-medium text-muted-foreground md:inline-flex">
              بازار بزرگ آنلاین افغانستان
              <span aria-hidden className="text-accent">✦</span>
            </p>
            <EnterMarketCta
              variant="default"
              size="sm"
              className="min-h-11 shrink-0 gap-1.5 px-3.5 text-xs font-bold shadow-soft sm:px-4 sm:text-sm"
            >
              ورود به بازار
              <ArrowLeft aria-hidden className="size-3.5" />
            </EnterMarketCta>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="bg-primary-dark text-white">
        <div className="container py-8 sm:py-10">
          <div className="flex flex-col items-center justify-between gap-5 border-b border-white/10 pb-7 md:flex-row md:gap-8">
            <div className="flex flex-col items-center gap-3 md:items-start">
              <Link
                href="/"
                aria-label="ویش‌بازار"
                className="inline-flex rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <BrandLogo variant="white" height={30} />
              </Link>
              <p className="max-w-md text-center text-meta leading-7 text-white/65 md:text-start">
                بازار آنلاین خرید و فروش در افغانستان؛ آگهی‌ها را ببین و مستقیم با فروشنده در تماس شو.
              </p>
            </div>

            <EnterMarketCta
              variant="accent"
              size="lg"
              className="min-h-11 gap-2 px-5 font-bold"
            >
              ورود به بازار
              <ArrowLeft aria-hidden className="size-4" />
            </EnterMarketCta>
          </div>

          <nav aria-label="پیوندهای ویش‌بازار" className="py-6">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-9 items-center rounded-control text-meta text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-center text-caption text-white/45">
            © {persianYear} همه حقوق برای ویش‌بازار محفوظ است.
          </p>
        </div>
      </footer>
    </div>
  );
}
