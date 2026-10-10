import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminListingsView } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'بازبینی آگهی‌ها',
  robots: { index: false, follow: false },
  alternates: { canonical: '/admin/listings' },
};

/**
 * Admin listings queue (master prompt §44): the moderation queue with the
 * four commands (approve / reject / archive / restore). Private — requires a
 * moderator/admin session; the session gate, role check and the data views
 * live in the client island below (the backend stays authoritative, §42).
 */
export default function AdminListingsPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">بازبینی آگهی‌ها</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        صف بررسی، تأیید یا رد آگهی‌ها و بایگانی‌کردن موارد نامناسب.
      </p>
      <div className="mt-6">
        <AdminListingsView />
      </div>
    </PageContainer>
  );
}
