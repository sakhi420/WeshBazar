import { MobileHeader } from '@/components/layout/mobile-header';
import { DesktopHeader } from '@/components/layout/desktop-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { BackToTop } from '@/components/layout/back-to-top';

/**
 * Marketplace route group shell (master prompt §101–104).
 * Owns the full app chrome — header, main, bottom nav, footer — for every
 * marketplace page (home feed, listings, categories, search, auth, account,
 * admin, sell, …). The welcome landing lives in its own `(welcome)` group with
 * a minimal, distinct chrome.
 */
export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
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
  );
}