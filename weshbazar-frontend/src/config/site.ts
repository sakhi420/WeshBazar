import { SITE_URL } from '@/lib/env';

/**
 * Static site metadata (master prompt §34 SEO). Persian/Dari copy is the
 * product default. Keep brand-safe: never redraw or approximate the logo here.
 */
export const siteConfig = {
  name: 'ویش‌بازار',
  nameLatin: 'WeshBazar',
  description:
    'بازار آنلاین خرید و فروش اجناس نو و دست‌دوم در افغانستان. جست‌وجو، ثبت آگهی رایگان و تماس مستقیم با فروشنده.',
  url: SITE_URL,
  locale: 'fa-AF',
} as const;
