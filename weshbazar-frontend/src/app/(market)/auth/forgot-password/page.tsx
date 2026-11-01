import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { AuthCard, ForgotForm } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'بازیابی رمز عبور',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/forgot-password' },
};

/**
 * Forgot-password page (master prompt §28, §303): recovery start.
 * Server Component — the anti-enumeration messaging lives in the client form.
 */
export default function ForgotPasswordPage() {
  return (
    <PageContainer>
      <AuthCard
        title="بازیابی رمز عبور"
        description="شمارهٔ تلفن حساب خود را وارد کنید تا کد بازیابی پیامک شود."
        footer={
          <p>
            رمز عبور را به خاطر دارید؟{' '}
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href="/auth/login"
            >
              وارد شوید
            </Link>
          </p>
        }
      >
        <ForgotForm />
      </AuthCard>
    </PageContainer>
  );
}
