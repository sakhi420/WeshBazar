'use client';

/**
 * Register form (master prompt §26) — account creation.
 * displayName is optional per the contract (phone + password are required).
 * After success the user continues to phone verification with `next` kept.
 * Error handling follows frontend-error-map.md §3.2 (PHONE_ALREADY_REGISTERED
 * offers a login link, WEAK_PASSWORD renders policy guidance inline).
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { ApiError, ApiErrorCode, clearUserScopedCaches, queryKeys } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  isPlausiblePhone,
  normalizePhone,
  passwordGuides,
  passwordIssues,
  register,
} from '@/features/auth';
import { FormError, FormNotice, bindFieldErrors } from './form-error';
import { FormField, INPUT_CLASS, fieldMessageId } from './form-field';
import { PhoneInput } from './phone-input';
import { PasswordField } from './password-field';

export interface RegisterFormProps {
  /** Sanitized internal path to continue to after verification. */
  next: string;
}

export function RegisterForm({ next }: RegisterFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [suggestLogin, setSuggestLogin] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setFieldErrors({});
    setSuggestLogin(false);

    const normalized = normalizePhone(phone);
    const trimmedName = displayName.trim();
    const errors: Record<string, string> = {};
    if (!normalized) errors.phone = 'شمارهٔ تلفن را وارد کنید.';
    else if (!isPlausiblePhone(normalized)) errors.phone = 'شمارهٔ تلفن معتبر نیست.';
    const passwordProblem = passwordIssues(password);
    if (passwordProblem.length > 0) errors.password = passwordProblem.join(' ');
    if (confirm !== password) errors.confirm = 'تکرار رمز عبور مطابقت ندارد.';
    if (trimmedName.length === 1) errors.displayName = 'نام نمایشی باید حداقل ۲ نویسه باشد.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      const result = await register({
        phone: normalized,
        password,
        ...(trimmedName ? { displayName: trimmedName } : {}),
      });
      // Registration replaces any previously cached identity — reflect it into
      // the auth cache immediately so the header updates without a reload.
      queryClient.setQueryData(queryKeys.auth.me, { user: result.user, session: null });
      queryClient.removeQueries({ queryKey: queryKeys.auth.sessions });
      clearUserScopedCaches(queryClient);
      router.replace(`/auth/verify?next=${encodeURIComponent(next)}`);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case ApiErrorCode.PHONE_ALREADY_REGISTERED:
            setFieldErrors({ phone: 'این شمارهٔ تلفن قبلاً ثبت شده است.' });
            setSuggestLogin(true);
            break;
          case ApiErrorCode.INVALID_PHONE_NUMBER:
            setFieldErrors({ phone: 'شمارهٔ تلفن معتبر نیست.' });
            break;
          case ApiErrorCode.WEAK_PASSWORD:
            setFieldErrors({
              password: `رمز عبور شرایط امنیتی را برآورده نمی‌کند. ${passwordGuides().join(' ')}`,
            });
            break;
          case ApiErrorCode.RATE_LIMITED:
            setFormError('درخواست‌های زیادی ثبت شده است. کمی بعد دوباره امتحان کنید.');
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
            setFormError('ثبت‌نام انجام نشد. دوباره تلاش کنید.');
        }
      } else {
        setFormError('ثبت‌نام انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError>{formError}</FormError>
      {suggestLogin ? (
        <FormNotice>
          قبلاً حساب دارید؟{' '}
          <Link className="text-primary underline-offset-4 hover:underline" href="/auth/login">
            وارد شوید
          </Link>
        </FormNotice>
      ) : null}

      <FormField
        id="register-name"
        label="نام نمایشی"
        optional
        error={fieldErrors.displayName}
      >
        <input
          id="register-name"
          type="text"
          autoComplete="name"
          maxLength={80}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={pending}
          aria-invalid={Boolean(fieldErrors.displayName) || undefined}
          aria-describedby={fieldMessageId('register-name', fieldErrors.displayName, undefined)}
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField id="register-phone" label="شمارهٔ تلفن" error={fieldErrors.phone}>
        <PhoneInput
          id="register-phone"
          value={phone}
          onChange={setPhone}
          disabled={pending}
          invalid={Boolean(fieldErrors.phone)}
          describedBy={fieldMessageId('register-phone', fieldErrors.phone, undefined)}
        />
      </FormField>

      <FormField
        id="register-password"
        label="رمز عبور"
        error={fieldErrors.password}
        hint={passwordGuides().join(' ')}
      >
        <PasswordField
          id="register-password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={pending}
          invalid={Boolean(fieldErrors.password)}
          describedBy={fieldMessageId(
            'register-password',
            fieldErrors.password,
            passwordGuides().join(' '),
          )}
        />
      </FormField>

      <FormField id="register-confirm" label="تکرار رمز عبور" error={fieldErrors.confirm}>
        <PasswordField
          id="register-confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={pending}
          invalid={Boolean(fieldErrors.confirm)}
          describedBy={fieldMessageId('register-confirm', fieldErrors.confirm, undefined)}
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            در حال ثبت‌نام…
          </>
        ) : (
          'ثبت‌نام'
        )}
      </Button>
    </form>
  );
}
