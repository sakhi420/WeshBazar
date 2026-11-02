import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';

const persianYear = new Intl.NumberFormat('fa-AF').format(new Date().getFullYear());

const footerLinks = [
  { href: '/market', label: 'ورود به بازار' },
  { href: '/search', label: 'جست‌وجوی آگهی‌ها' },
  { href: '/sell', label: 'ثبت آگهی' },
  { href: '/auth/login', label: 'ورود به حساب' },
  { href: '/about', label: 'درباره ما' },
  { href: '/help/safety', label: 'نکات ایمنی' },
  { href: '/contact', label: 'تماس با ما' },
] as const;

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
        <div className="container flex flex-col gap-6 py-10">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between">
            <Link
              href="/"
              aria-label="ویش‌بازار"
              className="inline-flex rounded-control focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              <BrandLogo variant="white" height={30} />
            </Link>

            <p className="max-w-md text-center text-body leading-7 text-white/80">
              بازار آنلاین خرید و فروش در افغانستان؛ جست‌وجوی ساده، ثبت آگهی و تماس مستقیم با فروشنده.
            </p>
          </div>

          <nav aria-label="لینک‌های ویش‌بازار">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex rounded-control text-ui text-white/80 transition-colors duration-small hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-center text-caption text-white/60">
            © {persianYear} همه حقوق برای ویش‌بازار محفوظ است.
          </p>
        </div>
      </footer>
    </div>
  );
}