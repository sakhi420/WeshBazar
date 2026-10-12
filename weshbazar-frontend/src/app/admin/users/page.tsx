import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminUsersView } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'مدیریت کاربران',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/users' },
};

export default function AdminUsersPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">کاربران</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        جست‌وجو، فیلتر و مدیریت حساب‌های کاربری.
      </p>
      <div className="mt-6">
        <AdminUsersView />
      </div>
    </PageContainer>
  );
}