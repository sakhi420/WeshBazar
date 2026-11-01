import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminReportsView } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'گزارش‌ها',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/reports' },
};

export default function AdminReportsPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">گزارش‌های کاربران</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        صف بررسی گزارش‌های ثبت‌شده روی آگهی‌ها.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminReportsView />
        </Suspense>
      </div>
    </PageContainer>
  );
}