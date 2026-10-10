import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import { siteConfig } from '@/config/site';
import { brandAssets } from '@/config/brand';
import { DEFAULT_DIR, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { Providers } from './providers';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import './globals.css';

/**
 * Primary Persian font (master prompt §12). Self-hosting via next/font/local is
 * the eventual target; next/font/google is used until the Vazirmatn files are
 * vendored into the repo (see README decisions).
 */
const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  icons: {
    icon: [
      { url: brandAssets.favicon, type: 'image/svg+xml' },
      { url: brandAssets.favicon32, sizes: '32x32', type: 'image/png' },
    ],
    apple: { url: brandAssets.appIcon, sizes: '180x180', type: 'image/png' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0F766E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // fa-AF + RTL is the document default (§8). Components stay direction-aware.
    <html lang={DEFAULT_LOCALE} dir={DEFAULT_DIR} className={vazirmatn.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only fixed right-4 top-4 z-[70] rounded-control bg-surface px-4 py-3 text-ui font-medium text-foreground shadow-lg focus-visible:not-sr-only focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            رفتن به محتوای اصلی
          </a>
          <div className="flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
