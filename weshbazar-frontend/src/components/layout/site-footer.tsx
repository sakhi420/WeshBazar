import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';

const marketplaceLinks = [
  { href: '/market', label: 'صفحه اصلی' },
  { href: '/search', label: 'جست‌وجوی آگهی‌ها' },
  { href: '/sell', label: 'ثبت آگهی' },
] as const;

const accountLinks = [
  { href: '/auth/login', label: 'ورود به حساب' },
  { href: '/favorites', label: 'علاقه‌مندی‌ها' },
  { href: '/my-listings', label: 'آگهی‌های من' },
  { href: '/account', label: 'حساب کاربری' },
] as const;

const helpLinks = [
  { href: '/about', label: 'درباره ما' },
  { href: '/help/safety', label: 'نکات ایمنی' },
  { href: '/help', label: 'مرکز راهنمایی' },
  { href: '/contact', label: 'تماس با ما' },
] as const;

const persianYear = new Intl.NumberFormat('fa-AF').format(new Date().getFullYear());

const footerLinkClass =
  'inline-flex min-h-7 items-center rounded-control text-ui text-white/80 transition-colors duration-small hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none';

export function SiteFooter() {
  return (
    <footer className="border-t border-primary-dark/30 bg-primary-dark text-white">
      <div className="container grid grid-cols-2 gap-x-5 gap-y-6 py-6 md:gap-x-8 md:gap-y-8 md:py-10 lg:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div className="col-span-2 space-y-2 md:space-y-3 lg:col-span-1 lg:space-y-4">
          <Link
            href="/market"
            aria-label="ویش‌بازار — صفحه اصلی"
            className="inline-flex rounded-control focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <BrandLogo variant="white" height={32} />
          </Link>
          <p className="max-w-md text-ui leading-6 text-white/80">
            بازار خرید و فروش افغانستان برای جست‌وجوی ساده، ثبت آگهی رایگان و تماس مستقیم با فروشنده.
          </p>
          <p className="hidden max-w-md text-ui leading-6 text-white/70 lg:block">
            برای تجربه بهتر، جست‌وجو را با شهر خود شروع کنید و قبل از معامله جزئیات آگهی را با دقت بررسی
            کنید.
          </p>
        </div>

        <nav aria-label="لینک‌های بازار" className="space-y-2 md:space-y-3 lg:space-y-3">
          <h2 className="text-ui font-semibold text-white md:text-section">بازار</h2>
          <ul className="space-y-1 text-ui lg:space-y-2 lg:text-body">
            {marketplaceLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="لینک‌های حساب" className="space-y-2 md:space-y-3 lg:space-y-3">
          <h2 className="text-ui font-semibold text-white md:text-section">حساب</h2>
          <ul className="space-y-1 text-ui lg:space-y-2 lg:text-body">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav
          aria-label="راهنما"
          className="col-span-2 space-y-2 md:space-y-3 lg:col-span-1 lg:space-y-3"
        >
          <h2 className="text-ui font-semibold text-white md:text-section">راهنما</h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-ui lg:block lg:space-y-2 lg:text-body">
            {helpLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={footerLinkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-1.5 py-3 text-center text-caption text-white/70 sm:flex-row sm:items-center sm:justify-between sm:text-start md:py-4 md:text-ui">
          <p translate="no">WeshBazar</p>
          <p>© {persianYear} همه حقوق برای ویش‌بازار محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
}
