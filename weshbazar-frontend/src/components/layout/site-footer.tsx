import Link from 'next/link';
import { BrandLogo } from '@/components/brand/brand-logo';

const marketplaceLinks = [
  { href: '/', label: 'صفحه اصلی' },
  { href: '/search', label: 'جست‌وجوی آگهی‌ها' },
  { href: '/sell', label: 'ثبت آگهی' },
] as const;

const accountLinks = [
  { href: '/auth/login', label: 'ورود به حساب' },
  { href: '/favorites', label: 'علاقه‌مندی‌ها' },
  { href: '/my-listings', label: 'آگهی‌های من' },
  { href: '/account', label: 'حساب کاربری' },
] as const;

const persianYear = new Intl.NumberFormat('fa-AF').format(new Date().getFullYear());

export function SiteFooter() {
  return (
    <footer className="border-t border-primary-dark/30 bg-primary-dark text-white">
      <div className="container grid gap-8 py-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-10">
        <div className="space-y-4">
          <Link
            href="/"
            aria-label="وش‌بازار — صفحه اصلی"
            className="inline-flex rounded-control focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
          >
            <BrandLogo variant="white" height={32} />
          </Link>
          <p className="max-w-md text-body text-white/80">
            بازار خرید و فروش افغانستان برای جست‌وجوی ساده، ثبت آگهی رایگان و تماس مستقیم با فروشنده.
          </p>
          <p className="max-w-md text-ui text-white/70">
            برای تجربه بهتر، جست‌وجو را با شهر خود شروع کنید و قبل از معامله جزئیات آگهی را با دقت بررسی
            کنید.
          </p>
        </div>

        <nav aria-label="لینک‌های بازار" className="space-y-3">
          <h2 className="text-section font-semibold text-white">بازار</h2>
          <ul className="space-y-2 text-body">
            {marketplaceLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-control text-white/80 transition-colors duration-small hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="لینک‌های حساب" className="space-y-3">
          <h2 className="text-section font-semibold text-white">حساب</h2>
          <ul className="space-y-2 text-body">
            {accountLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex rounded-control text-white/80 transition-colors duration-small hover:text-white focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-4 text-ui text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <p translate="no">WeshBazar</p>
          <p>© {persianYear} همه حقوق برای وش‌بازار محفوظ است.</p>
        </div>
      </div>
    </footer>
  );
}
