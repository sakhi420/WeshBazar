import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import { siteConfig } from '@/config/site';
import { brandAssets } from '@/config/brand';
import { DEFAULT_DIR, DEFAULT_LOCALE } from '@/lib/i18n/config';
import { Providers } from './providers';
import { MobileHeader } from '@/components/layout/mobile-header';
import { DesktopHeader } from '@/components/layout/desktop-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { BackToTop } from '@/components/layout/back-to-top';
import './globals.css';

/**
 * Primary Persian font (master prompt §12). Self-hosted Vazir via next/font/local.
 * Weights: 300 (Light), 400 (Regular), 500 (Medium), 700 (Bold).
 */
const vazir = localFont({
  src: [
    { path: './fonts/Vazir-Light.woff2', weight: '300', style: 'normal' },
    { path: './fonts/Vazir.woff2', weight: '400', style: 'normal' },
    { path: './fonts/Vazir-Medium.woff2', weight: '500', style: 'normal' },
    { path: './fonts/Vazir-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-vazir',
  display: 'swap',
  preload: true,
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
    <html lang={DEFAULT_LOCALE} dir={DEFAULT_DIR} className={vazir.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <Providers>
          <a
            href="#main"
            className="sr-only fixed end-4 top-4 z-[70] rounded-control bg-surface px-4 py-3 text-ui font-medium text-foreground shadow-lg focus-visible:not-sr-only focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            رفتن به محتوای اصلی
          </a>
          <div className="flex min-h-dvh flex-col">
            <MobileHeader />
            <DesktopHeader />
            <main id="main" className="flex-1 pb-bottom-nav lg:pb-0">
              {children}
            </main>
            <MobileBottomNav />
            <SiteFooter />
            <BackToTop />
          </div>
        </Providers>
      </body>
    </html>
  );
}
