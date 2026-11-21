import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AccountView } from '@/features/account/components';

export const metadata: Metadata = {
  title: 'حساب کاربری',
  robots: { index: false, follow: false },
  alternates: { canonical: '/account' },
};

/**
 * Private account dashboard. Authentication, profile data and editing stay
 * inside AccountView; this server page only provides the shared page frame.
 */
export default function AccountPage() {
  return (
    <PageContainer>
      <AccountView />
    </PageContainer>
  );
}
