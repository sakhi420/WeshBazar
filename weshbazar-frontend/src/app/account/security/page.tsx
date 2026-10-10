import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { SecurityView } from '@/features/account/components';

export const metadata: Metadata = {
  title: 'امنیت حساب',
  robots: { index: false, follow: false },
  alternates: { canonical: '/account/security' },
};

/**
 * Security page (master prompt §33): password, sessions, verification.
 * Private page — requires authentication; the session gate and the forms
 * live in the client view.
 */
export default function AccountSecurityPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">امنیت حساب</h1>
      <p className="mt-2 text-ui text-muted-foreground">
        رمز عبور، نشست‌های فعال و شمارهٔ تلفن خود را مدیریت کنید.
      </p>
      <div className="mt-6">
        <SecurityView />
      </div>
    </PageContainer>
  );
}
