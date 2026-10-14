import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminLocationsView } from '@/features/admin/components/admin-locations-view';

export const metadata: Metadata = {
  title: 'مدیریت مکان‌ها',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/locations' },
};

export default function AdminLocationsPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">مکان‌ها</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        مدیریت ولایت، شهرها و موقعیت‌های جغرافیایی.
      </p>
      <div className="mt-6">
        <AdminLocationsView />
      </div>
    </PageContainer>
  );
}