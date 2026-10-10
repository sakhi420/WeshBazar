import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { firstParamValue, sanitizeNextPath } from '@/features/auth';
import { AuthCard, LoginForm } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'ورود',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/login' },
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Login page (master prompt §25): phone + password sign-in.
 * `?next=` carries the sanitized return target; `?reset=1` marks a just-
 * completed password reset so the form greets the user.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const next = sanitizeNextPath(firstParamValue(params.next));
  const justReset = firstParamValue(params.reset) === '1';
  const registerHref =
    next === '/' ? '/auth/register' : `/auth/register?next=${encodeURIComponent(next)}`;

  return (
    <PageContainer>
      <AuthCard
        title="ورود"
        description="برای ثبت آگهی، ذخیرهٔ آگهی‌ها و مدیریت حساب وارد شوید."
        footer={
          <p>
            حساب کاربری ندارید؟{' '}
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href={registerHref}
            >
              ثبت‌نام کنید
            </Link>
          </p>
        }
      >
        <LoginForm next={next} justReset={justReset} />
      </AuthCard>
    </PageContainer>
  );
}
