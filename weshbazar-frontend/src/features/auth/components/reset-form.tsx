'use client';

/**
 * Reset-password form (master prompt §29, §304) — recovery completion.
 *
 * Public flow: no session required. Fields per the frozen contract
 * (ResetPasswordDto): phone, code (SMS OTP), newPassword — plus the local
 * confirmation field (strength + mismatch handled here; the backend stays
 * authoritative). On 204 the user is sent to login with a success notice.
 * Error handling follows frontend-error-map.md §3.2 (OTP_* and
 * PASSWORD_RESET_TOKEN_* codes, each with a recovery path).
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  OTP_MIN_DIGITS,
  isPlausiblePhone,
  normalizePhone,
  passwordGuides,
  passwordIssues,
  resetPassword,
} from '@/features/auth';
import { FormError, FormNotice, bindFieldErrors } from './form-error';
import { FormField, fieldMessageId } from './form-field';
import { OtpInput } from './otp-input';
import { PasswordField } from './password-field';
import { PhoneInput } from './phone-input';

export interface ResetFormProps {
  /** Phone passed from the forgot-password step (may be empty). */
  initialPhone: string;
}

export function ResetForm({ initialPhone }: ResetFormProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [needsNewCode, setNeedsNewCode] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setFieldErrors({});
    setNeedsNewCode(false);

    const normalized = normalizePhone(phone);
    const errors: Record<string, string> = {};
    if (!normalized) errors.phone = 'شمارهٔ تلفن را وارد کنید.';
    else if (!isPlausiblePhone(normalized)) errors.phone = 'شمارهٔ تلفن معتبر نیست.';
    if (code.length < OTP_MIN_DIGITS) errors.code = 'کد تأیید را کامل وارد کنید.';
    const passwordProblem = passwordIssues(newPassword);
    if (passwordProblem.length > 0) errors.newPassword = passwordProblem.join(' ');
    if (confirm !== newPassword) errors.confirm = 'تکرار رمز عبور مطابقت ندارد.';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setPending(true);
    try {
      await resetPassword({ phone: normalized, code, newPassword });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case ApiErrorCode.OTP_INVALID:
            setFieldErrors({ code: 'کد واردشده نادرست است.' });
            break;
          case ApiErrorCode.OTP_EXPIRED:
            setFieldErrors({ code: 'عمر این کد به پایان رسیده است.' });
            setNeedsNewCode(true);
            break;
          case ApiErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED:
            setFormError('تعداد تلاش‌های مجاز تمام شده است.');
            setNeedsNewCode(true);
            break;
          case ApiErrorCode.PASSWORD_RESET_TOKEN_INVALID:
            setFormError('این درخواست بازیابی معتبر نیست. دوباره کد بگیرید.');
            setNeedsNewCode(true);
            break;
          case ApiErrorCode.PASSWORD_RESET_TOKEN_EXPIRED:
            setFormError('اعتبار درخواست بازیابی به پایان رسیده است. دوباره کد بگیرید.');
            setNeedsNewCode(true);
            break;
          case ApiErrorCode.WEAK_PASSWORD:
            setFieldErrors({
              newPassword: `رمز عبور شرایط امنیتی را برآورده نمی‌کند. ${passwordGuides().join(' ')}`,
            });
            break;
          case ApiErrorCode.INVALID_PHONE_NUMBER:
            setFieldErrors({ phone: 'شمارهٔ تلفن معتبر نیست.' });
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
            setFormError('تغییر رمز عبور انجام نشد. دوباره تلاش کنید.');
        }
      } else {
        setFormError('تغییر رمز عبور انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  // --- Done ---------------------------------------------------------------------

  if (done) {
    return (
      <div className="space-y-5">
        <p role="status" className="flex flex-col items-center gap-2 py-2 text-center text-ui text-foreground">
          <CheckCircle2 aria-hidden className="size-10 text-success" strokeWidth={1.6} />
          رمز عبور شما با موفقیت تغییر کرد.
        </p>
        <Button size="lg" className="w-full" onClick={() => router.replace('/auth/login?reset=1')}>
          ورود با رمز جدید
        </Button>
      </div>
    );
  }

  // --- Code + new password --------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError>{formError}</FormError>
      {needsNewCode ? (
        <FormNotice>
          برای دریافت کد جدید{' '}
          <Link
            className="text-primary underline-offset-4 hover:underline"
            href="/auth/forgot-password"
          >
            از اینجا
          </Link>{' '}
          اقدام کنید.
        </FormNotice>
      ) : null}

      <FormField id="reset-phone" label="شمارهٔ تلفن" error={fieldErrors.phone}>
        <PhoneInput
          id="reset-phone"
          value={phone}
          onChange={setPhone}
          disabled={pending}
          invalid={Boolean(fieldErrors.phone)}
          describedBy={fieldMessageId('reset-phone', fieldErrors.phone, undefined)}
        />
      </FormField>

      <FormField id="reset-code" label="کد تأیید" error={fieldErrors.code}>
        <OtpInput
          id="reset-code"
          value={code}
          onChange={setCode}
          disabled={pending}
          invalid={Boolean(fieldErrors.code)}
          describedBy={fieldMessageId('reset-code', fieldErrors.code, undefined)}
        />
      </FormField>

      <FormField
        id="reset-password"
        label="رمز عبور جدید"
        error={fieldErrors.newPassword}
        hint={passwordGuides().join(' ')}
      >
        <PasswordField
          id="reset-password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          disabled={pending}
          invalid={Boolean(fieldErrors.newPassword)}
          describedBy={fieldMessageId(
            'reset-password',
            fieldErrors.newPassword,
            passwordGuides().join(' '),
          )}
        />
      </FormField>

      <FormField id="reset-confirm" label="تکرار رمز عبور جدید" error={fieldErrors.confirm}>
        <PasswordField
          id="reset-confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={pending}
          invalid={Boolean(fieldErrors.confirm)}
          describedBy={fieldMessageId('reset-confirm', fieldErrors.confirm, undefined)}
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            در حال ذخیره…
          </>
        ) : (
          'تغییر رمز عبور'
        )}
      </Button>

      <p className="text-center text-ui text-muted-foreground">
        کد را دریافت نکردید؟{' '}
        <Link
          className="text-primary underline-offset-4 hover:underline"
          href="/auth/forgot-password"
        >
          ارسال دوباره
        </Link>
      </p>
    </form>
  );
}
