'use client';

/**
 * Password change (master prompt §33) — current + new + confirm.
 *
 * Client checks are early guards mirroring the backend policy
 * (`passwordIssues`, new ≠ current, confirm match); the server stays
 * authoritative (CURRENT_PASSWORD_INCORRECT / WEAK_PASSWORD /
 * VALIDATION_ERROR per frontend-error-map.md §3.2). On success every other
 * session is revoked server-side — the hook refetches the sessions list.
 */

import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { passwordGuides, passwordIssues } from '@/features/auth';
import {
  FormError,
  FormField,
  FormNotice,
  PasswordField,
  bindFieldErrors,
  fieldMessageId,
} from '@/features/auth/components';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { useChangePassword } from '../hooks';

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function SecurityPasswordSection({ onSessionLost }: { onSessionLost: () => void }) {
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (changePassword.isPending) return;

    const errors: FieldErrors = {};
    if (!currentPassword) {
      errors.currentPassword = 'رمز عبور فعلی را وارد کنید.';
    }
    const issues = passwordIssues(newPassword);
    if (issues.length > 0) {
      errors.newPassword = issues.join(' ');
    } else if (newPassword === currentPassword) {
      errors.newPassword = 'رمز عبور جدید باید با رمز فعلی متفاوت باشد.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'تکرار رمز عبور جدید را وارد کنید.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'تکرار رمز عبور با رمز جدید یکسان نیست.';
    }

    setFieldErrors(errors);
    setFormError(null);
    setSuccess(false);
    if (Object.keys(errors).length > 0) return;

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setFieldErrors({});
          setSuccess(true);
        },
        onError: (error) => {
          if (!(error instanceof ApiError)) {
            setFormError('تغییر رمز عبور ناموفق بود. دوباره تلاش کنید.');
            return;
          }
          if (error.status === 401 || error.isSessionTerminal) {
            onSessionLost();
            return;
          }
          switch (error.code) {
            case ApiErrorCode.CURRENT_PASSWORD_INCORRECT:
              setFieldErrors({ currentPassword: 'رمز عبور فعلی نادرست است.' });
              break;
            case ApiErrorCode.WEAK_PASSWORD:
              setFieldErrors({
                newPassword: 'رمز عبور جدید معیارهای امنیتی را برآورده نمی‌کند.',
              });
              break;
            case ApiErrorCode.VALIDATION_ERROR: {
              const map = bindFieldErrors(error);
              setFieldErrors({
                currentPassword: map.currentPassword,
                newPassword: map.newPassword,
              });
              break;
            }
            case ApiErrorCode.RATE_LIMITED:
              setFormError('درخواست‌های زیادی ثبت شده است. کمی بعد دوباره امتحان کنید.');
              break;
            case ApiErrorCode.NETWORK:
              setFormError('اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
              break;
            default:
              setFormError('تغییر رمز عبور ناموفق بود. دوباره تلاش کنید.');
          }
        },
      },
    );
  }

  const pending = changePassword.isPending;

  return (
    <section
      aria-labelledby="security-password"
      className="rounded-card border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id="security-password" className="text-card-title font-semibold text-foreground">
        رمز عبور
      </h2>
      <p className="mt-1 text-meta text-muted-foreground">
        با تغییر رمز عبور، دستگاه‌های دیگر از حساب شما خارج می‌شوند.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
        {success ? (
          <FormNotice>رمز عبور تغییر کرد و سایر دستگاه‌ها از حساب خارج شدند.</FormNotice>
        ) : null}
        <FormError>{formError}</FormError>

        <FormField
          id="security-current-password"
          label="رمز عبور فعلی"
          error={fieldErrors.currentPassword}
        >
          <PasswordField
            id="security-current-password"
            value={currentPassword}
            onChange={(value) => {
              setCurrentPassword(value);
              clearFieldError('currentPassword');
            }}
            autoComplete="current-password"
            disabled={pending}
            invalid={Boolean(fieldErrors.currentPassword)}
            describedBy={fieldMessageId(
              'security-current-password',
              fieldErrors.currentPassword,
              undefined,
            )}
          />
        </FormField>

        <FormField
          id="security-new-password"
          label="رمز عبور جدید"
          hint={passwordGuides().join(' ')}
          error={fieldErrors.newPassword}
        >
          <PasswordField
            id="security-new-password"
            value={newPassword}
            onChange={(value) => {
              setNewPassword(value);
              clearFieldError('newPassword');
            }}
            autoComplete="new-password"
            disabled={pending}
            invalid={Boolean(fieldErrors.newPassword)}
            describedBy={fieldMessageId(
              'security-new-password',
              fieldErrors.newPassword,
              passwordGuides().join(' '),
            )}
          />
        </FormField>

        <FormField
          id="security-confirm-password"
          label="تکرار رمز عبور جدید"
          error={fieldErrors.confirmPassword}
        >
          <PasswordField
            id="security-confirm-password"
            value={confirmPassword}
            onChange={(value) => {
              setConfirmPassword(value);
              clearFieldError('confirmPassword');
            }}
            autoComplete="new-password"
            disabled={pending}
            invalid={Boolean(fieldErrors.confirmPassword)}
            describedBy={fieldMessageId(
              'security-confirm-password',
              fieldErrors.confirmPassword,
              undefined,
            )}
          />
        </FormField>

        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 aria-hidden className="animate-spin" />
              در حال ذخیره…
            </>
          ) : (
            'تغییر رمز عبور'
          )}
        </Button>
      </form>
    </section>
  );
}
