import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { firstParamValue, sanitizeNextPath } from '@/features/auth';
import { AuthCard, VerifyForm } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'تأیید شمارهٔ تلفن',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/verify' },
};

interface VerifyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Phone verification page (master prompt §27): SMS OTP entry after register.
 * The form bootstraps the session from the refresh cookie; without a
 * refreshable session it redirects to login with `next` preserved.
 */
export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const params = await searchParams;
  const next = sanitizeNextPath(firstParamValue(params.next));
  const loginHref = `/auth/login?next=${encodeURIComponent(
    `/auth/verify?next=${encodeURIComponent(next)}`,
  )}`;

  return (
    <PageContainer>
      <AuthCard
        title="تأیید شمارهٔ تلفن"
        description="برای فعال شدن حساب، کد پیامک‌شده را وارد کنید."
        footer={
          <p>
            حساب دیگری دارید؟{' '}
            <Link className="text-primary underline-offset-4 hover:underline" href={loginHref}>
              ورود با حساب دیگر
            </Link>
          </p>
        }
      >
        <VerifyForm next={next} />
      </AuthCard>
    </PageContainer>
  );
}
