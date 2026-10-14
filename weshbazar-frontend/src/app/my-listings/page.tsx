import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { MyListingsView } from '@/features/listings/my-listings/components';

export const metadata: Metadata = {
  title: 'آگهی‌های من',
  robots: { index: false, follow: false },
  alternates: { canonical: '/my-listings' },
};

/**
 * My Listings page (master prompt §31): seller listing management.
 * Private page — requires authentication; the session gate, status tabs and
 * lifecycle actions live in the client view.
 */
export default function MyListingsPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">آگهی‌های من</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        آگهی‌های خود را مدیریت کنید: تمدید، فروخته‌شد و بایگانی.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <MyListingsView />
        </Suspense>
      </div>
    </PageContainer>
  );
}
