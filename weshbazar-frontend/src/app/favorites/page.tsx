import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { FavoritesView } from '@/features/favorites/components';

export const metadata: Metadata = {
  title: 'علاقه‌مندی‌ها',
  robots: { index: false, follow: false },
  alternates: { canonical: '/favorites' },
};

/**
 * Favorites page (master prompt §30): saved listings.
 * Private page — requires authentication; the session gate and all list
 * interaction live in the client view.
 */
export default function FavoritesPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">علاقه‌مندی‌ها</h1>
      <p className="mt-2 text-ui text-muted-foreground">آگهی‌هایی که برای بعد ذخیره کرده‌اید.</p>
      <div className="mt-6">
        <FavoritesView />
      </div>
    </PageContainer>
  );
}
