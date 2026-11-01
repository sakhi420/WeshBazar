import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { firstParamValue, sanitizeNextPath } from '@/features/auth';
import { AuthCard, RegisterForm } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'ثبت‌نام',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/register' },
};

interface RegisterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Register page (master prompt §26): account creation.
 * `?next=` carries the sanitized return target through verification.
 */
export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const next = sanitizeNextPath(firstParamValue(params.next));
  const loginHref =
    next === '/' ? '/auth/login' : `/auth/login?next=${encodeURIComponent(next)}`;

  return (
    <PageContainer>
      <AuthCard
        title="ثبت‌نام"
        description="حساب خود را بسازید و همین حالا آگهی ثبت کنید."
        footer={
          <p>
            قبلاً حساب دارید؟{' '}
            <Link className="text-primary underline-offset-4 hover:underline" href={loginHref}>
              وارد شوید
            </Link>
          </p>
        }
      >
        <RegisterForm next={next} />
      </AuthCard>
    </PageContainer>
  );
}
