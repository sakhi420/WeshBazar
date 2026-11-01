import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminDashboardView } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'پنل مدیریت',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin' },
};

/**
 * Admin dashboard (master prompt §43): moderation/admin overview. Private —
 * requires a moderator/admin session; the session gate, role check and the
 * data views live in the client island below (the backend stays
 * authoritative, §42).
 */
export default function AdminDashboardPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">پنل مدیریت</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        نمای کلی بازار، وضعیت آگهی‌ها و صف‌های بررسی.
      </p>
      <div className="mt-6">
        <AdminDashboardView />
      </div>
    </PageContainer>
  );
}
