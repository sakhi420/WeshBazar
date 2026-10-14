import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminAuditView } from '@/features/admin/components/admin-audit-view';

export const metadata: Metadata = {
  title: 'گزارش رویدادها',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/audit' },
};

export default function AdminAuditPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">گزارش رویدادها</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        تاریخچهٔ تمام اقدامات مدیریتی در سیستم.
      </p>
      <div className="mt-6">
        <AdminAuditView />
      </div>
    </PageContainer>
  );
}