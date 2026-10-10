'use client';

/**
 * Login form (master prompt §25) — phone + password sign-in.
 * On success: verified users go to `next`; unverified users continue to the
 * phone-verification step with the same target preserved. Error handling
 * follows frontend-error-map.md §3.2 (INVALID_CREDENTIALS, ACCOUNT_LOCKED,
 * ACCOUNT_NOT_ACTIVE, RATE_LIMITED, VALIDATION_ERROR).
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ApiError, ApiErrorCode, queryKeys } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { isPlausiblePhone, login, normalizePhone } from '@/features/auth';
import { FormError, FormNotice, bindFieldErrors } from './form-error';
import { FormField, fieldMessageId } from './form-field';
import { PhoneInput } from './phone-input';
import { PasswordField } from './password-field';

export interface LoginFormProps {
  /** Sanitized internal path to return to after sign-in. */
  next: string;
  /** True when arriving right after a completed password reset. */
  justReset?: boolean;
}

export function LoginForm({ next, justReset }: LoginFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setFieldErrors({});

    const normalized = normalizePhone(phone);
    const errors: Record<string, string> = {};
    if (!normalized) errors.phone = 'شمارهٔ تلفن را وارد کنید.';
    else if (!isPlausiblePhone(normalized)) errors.phone = 'شمارهٔ تلفن معتبر نیست.';
    if (!password) errors.password = 'رمز عبور را وارد کنید.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      const result = await login({ phone: normalized, password });
      // A sign-in may belong to a different user than whatever identity the
      // caches were filled under — drop all user-scoped caches before the app
      // refetches for the new session.
      queryClient.removeQueries({ queryKey: queryKeys.auth.all });
      queryClient.removeQueries({ queryKey: queryKeys.account.all });
      queryClient.removeQueries({ queryKey: queryKeys.favorites.all });
      const target = result.user.phoneVerified
        ? next
        : `/auth/verify?next=${encodeURIComponent(next)}`;
      router.replace(target);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case ApiErrorCode.INVALID_CREDENTIALS:
            setFormError('شمارهٔ تلفن یا رمز عبور نادرست است.');
            break;
          case ApiErrorCode.ACCOUNT_LOCKED:
            setFormError('حساب شما موقتاً قفل شده است. کمی بعد دوباره تلاش کنید.');
            break;
          case ApiErrorCode.ACCOUNT_NOT_ACTIVE:
            setFormError('حساب شما فعال نیست. برای پیگیری با پشتیبانی تماس بگیرید.');
            break;
          case ApiErrorCode.RATE_LIMITED:
            setFormError('تلاش‌های زیادی انجام شده است. کمی بعد دوباره امتحان کنید.');
            break;
          case ApiErrorCode.VALIDATION_ERROR: {
            const bound = bindFieldErrors(error);
            setFieldErrors(bound);
            if (Object.keys(bound).length === 0) {
              setFormError('اطلاعات واردشده معتبر نیست.');
            }
            break;
          }
          case ApiErrorCode.NETWORK:
            setFormError('اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
            break;
          default:
            setFormError('ورود انجام نشد. دوباره تلاش کنید.');
        }
      } else {
        setFormError('ورود انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {justReset ? <FormNotice>رمز عبور شما به‌روز شد. حالا وارد شوید.</FormNotice> : null}
      <FormError>{formError}</FormError>

      <FormField id="login-phone" label="شمارهٔ تلفن" error={fieldErrors.phone}>
        <PhoneInput
          id="login-phone"
          value={phone}
          onChange={setPhone}
          disabled={pending}
          invalid={Boolean(fieldErrors.phone)}
          describedBy={fieldMessageId('login-phone', fieldErrors.phone, undefined)}
          autoFocus
        />
      </FormField>

      <FormField id="login-password" label="رمز عبور" error={fieldErrors.password}>
        <PasswordField
          id="login-password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          disabled={pending}
          invalid={Boolean(fieldErrors.password)}
          describedBy={fieldMessageId('login-password', fieldErrors.password, undefined)}
        />
      </FormField>

      <div className="text-end">
        <Link
          href="/auth/forgot-password"
          className="text-ui text-primary underline-offset-4 hover:underline"
        >
          رمز عبور را فراموش کرده‌اید؟
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            در حال ورود…
          </>
        ) : (
          'ورود'
        )}
      </Button>
    </form>
  );
}
