import type { Metadata } from 'next';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import {
  firstParamValue,
  isPlausiblePhone,
  normalizePhone,
} from '@/features/auth';
import { AuthCard, ResetForm } from '@/features/auth/components';

export const metadata: Metadata = {
  title: 'تعیین رمز عبور جدید',
  robots: { index: false, follow: false },
  alternates: { canonical: '/auth/reset-password' },
};

interface ResetPasswordPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Reset-password page (master prompt §29, §304): recovery completion.
 * `?phone=` (from the forgot step) is prefilled only when it looks like a
 * phone number; anything else is ignored and typed by the user.
 */
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const candidate = normalizePhone(firstParamValue(params.phone) ?? '');
  const initialPhone = isPlausiblePhone(candidate) ? candidate : '';

  return (
    <PageContainer>
      <AuthCard
        title="تعیین رمز عبور جدید"
        description="کد پیامک‌شده و رمز عبور جدید خود را وارد کنید."
        footer={
          <p>
            رمز عبور را به خاطر دارید؟{' '}
            <Link
              className="text-primary underline-offset-4 hover:underline"
              href="/auth/login"
            >
              بازگشت به ورود
            </Link>
          </p>
        }
      >
        <ResetForm initialPhone={initialPhone} />
      </AuthCard>
    </PageContainer>
  );
}
