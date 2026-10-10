import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AccountView } from '@/features/account/components';

export const metadata: Metadata = {
  title: 'حساب کاربری',
  robots: { index: false, follow: false },
  alternates: { canonical: '/account' },
};

/**
 * Account page (master prompt §32): profile and account navigation.
 * Private page — requires authentication; the session gate and profile
 * interaction live in the client view.
 */
export default function AccountPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">حساب کاربری</h1>
      <p className="mt-2 text-ui text-muted-foreground">پروفایل و میان‌برهای حساب شما.</p>
      <div className="mt-6">
        <AccountView />
      </div>
    </PageContainer>
  );
}
