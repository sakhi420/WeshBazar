'use client';

/**
 * Phone number (master prompt §33) — current number, verification state and
 * the two-step change flow: password + new number → OTP sent to the new
 * number → verify. Data comes from the shared auth snapshot, so a successful
 * change re-renders with the new number immediately.
 *
 * There is no cancel endpoint — the challenge simply expires; «ویرایش شماره»
 * mirrors that locally by returning to the start step. Resending reuses the
 * start call (the backend enforces its cooldown via OTP_RESEND_TOO_SOON).
 */

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CircleAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  OTP_CODE_LENGTH,
  OTP_MIN_DIGITS,
  cooldownFromRetryAfter,
  formatCountdown,
  isPlausiblePhone,
  normalizePhone,
  secondsUntil,
  toPersianDigits,
  useAuthBootstrap,
} from '@/features/auth';
import type { MeResponse } from '@/features/auth';
import {
  FormError,
  FormField,
  FormNotice,
  OtpInput,
  PasswordField,
  PhoneInput,
  bindFieldErrors,
  fieldMessageId,
} from '@/features/auth/components';
import { ApiError, ApiErrorCode, queryKeys } from '@/lib/api';
import { startPhoneChange, verifyPhoneChange } from '../api';

const VERIFY_HREF = `/auth/verify?next=${encodeURIComponent('/account/security')}`;

interface FieldErrors {
  password?: string;
  newPhone?: string;
}

export function SecurityPhoneSection({ onSessionLost }: { onSessionLost: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuthBootstrap();

  const [step, setStep] = useState<'start' | 'verify'>('start');
  const [password, setPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState('');
  const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [codeError, setCodeError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  // One-second countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function handleApiFailure(error: unknown, fallback: string): string | null {
    // Returns the form-level message, or null when the error was handled
    // inline / by signing out.
    if (!(error instanceof ApiError)) return fallback;
    if (error.status === 401 || error.isSessionTerminal) {
      onSessionLost();
      return null;
    }
    switch (error.code) {
      case ApiErrorCode.NETWORK:
        return 'اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.';
      case ApiErrorCode.RATE_LIMITED:
        return 'درخواست‌های زیادی ثبت شده است. کمی بعد دوباره امتحان کنید.';
      default:
        return fallback;
    }
  }

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const errors: FieldErrors = {};
    if (!password) errors.password = 'رمز عبور را وارد کنید.';
    const normalized = normalizePhone(newPhone);
    if (!isPlausiblePhone(normalized)) errors.newPhone = 'شمارهٔ تلفن معتبر نیست.';

    setFieldErrors(errors);
    setFormError(null);
    setResendNote(null);
    setSuccess(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      const result = await startPhoneChange({ password, newPhone: normalized });
      setMaskedPhone(result.newPhone);
      const wait = secondsUntil(result.resendAvailableAt);
      setCooldown(wait > 0 ? wait : 60);
      setCode('');
      setCodeError(null);
      setStep('verify');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.isSessionTerminal) {
          onSessionLost();
        } else if (error.code === ApiErrorCode.CURRENT_PASSWORD_INCORRECT) {
          setFieldErrors({ password: 'رمز عبور نادرست است.' });
        } else if (error.code === ApiErrorCode.PHONE_UNCHANGED) {
          setFieldErrors({ newPhone: 'شمارهٔ جدید با شمارهٔ فعلی یکسان است.' });
        } else if (error.code === ApiErrorCode.PHONE_ALREADY_REGISTERED) {
          setFieldErrors({ newPhone: 'این شماره قبلاً ثبت شده است.' });
        } else if (error.code === ApiErrorCode.INVALID_PHONE_NUMBER) {
          setFieldErrors({ newPhone: 'شمارهٔ تلفن معتبر نیست.' });
        } else if (error.code === ApiErrorCode.VALIDATION_ERROR) {
          const map = bindFieldErrors(error);
          setFieldErrors({ password: map.password, newPhone: map.newPhone });
        } else if (error.code === ApiErrorCode.OTP_RESEND_TOO_SOON) {
          setCooldown(cooldownFromRetryAfter(error.retryAfterSeconds));
          setFormError('برای ارسال دوبارهٔ کد کمی صبر کنید.');
        } else if (error.code === ApiErrorCode.OTP_DELIVERY_FAILED) {
          setFormError('ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.');
        } else {
          setFormError(handleApiFailure(error, 'ارسال کد ناموفق بود. دوباره تلاش کنید.'));
        }
      } else {
        setFormError('ارسال کد ناموفق بود. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (code.length < OTP_MIN_DIGITS) {
      setCodeError('کد تأیید را کامل وارد کنید.');
      return;
    }
    setCodeError(null);
    setFormError(null);
    setPending(true);
    try {
      const result = await verifyPhoneChange(code);
      queryClient.setQueryData<MeResponse>(queryKeys.auth.me, (previous) =>
        previous ? { ...previous, user: result.user } : previous,
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.profile });
      setSuccess('شمارهٔ تلفن شما با موفقیت تغییر کرد.');
      setStep('start');
      setPassword('');
      setNewPhone('');
      setCode('');
      setMaskedPhone(null);
      setCooldown(0);
      setResendNote(null);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.isSessionTerminal) {
          onSessionLost();
        } else if (error.code === ApiErrorCode.OTP_INVALID) {
          setCodeError('کد واردشده نادرست است.');
        } else if (error.code === ApiErrorCode.OTP_EXPIRED) {
          setCodeError('عمر این کد به پایان رسیده است. کد جدید بگیرید.');
          setCooldown(0);
        } else if (error.code === ApiErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED) {
          setFormError('تعداد تلاش‌های مجاز تمام شده است. کد جدید بگیرید.');
          setCooldown(0);
        } else {
          setFormError(handleApiFailure(error, 'تغییر شماره انجام نشد. دوباره تلاش کنید.'));
        }
      } else {
        setFormError('تغییر شماره انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    if (resending || pending || cooldown > 0) return;
    setResending(true);
    setResendNote(null);
    setFormError(null);
    setCodeError(null);
    try {
      const result = await startPhoneChange({ password, newPhone: normalizePhone(newPhone) });
      setMaskedPhone(result.newPhone);
      const wait = secondsUntil(result.resendAvailableAt);
      setCooldown(wait > 0 ? wait : 60);
      setResendNote('کد تأیید جدید پیامک شد.');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.isSessionTerminal) {
          onSessionLost();
        } else if (error.code === ApiErrorCode.OTP_RESEND_TOO_SOON) {
          setCooldown(cooldownFromRetryAfter(error.retryAfterSeconds));
        } else if (error.code === ApiErrorCode.OTP_DELIVERY_FAILED) {
          setFormError('ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.');
        } else {
          setFormError(handleApiFailure(error, 'ارسال دوبارهٔ کد انجام نشد.'));
        }
      } else {
        setFormError('ارسال دوبارهٔ کد انجام نشد.');
      }
    } finally {
      setResending(false);
    }
  }

  function backToStart() {
    setStep('start');
    setCode('');
    setCodeError(null);
    setFormError(null);
    setResendNote(null);
    setCooldown(0);
  }

  function clearFieldError(key: keyof FieldErrors) {
    setFieldErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));
  }

  return (
    <section
      aria-labelledby="security-phone"
      className="rounded-card border border-border bg-surface p-4 sm:p-5"
    >
      <h2 id="security-phone" className="text-card-title font-semibold text-foreground">
        شمارهٔ تلفن
      </h2>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-control border border-border px-3 py-2.5">
          <span className="text-ui text-muted-foreground">شمارهٔ فعلی</span>
          <span className="flex items-center gap-2">
            <span dir="ltr" className="bidi-ltr text-ui font-medium text-foreground">
              {user?.phone ?? ''}
            </span>
            {user?.phoneVerified ? (
              <span className="inline-flex items-center gap-1 rounded-control bg-success/10 px-2 py-0.5 text-caption font-medium text-success">
                <BadgeCheck aria-hidden className="size-3.5" />
                تأییدشده
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-control bg-warning/10 px-2 py-0.5 text-caption font-medium text-warning">
                <CircleAlert aria-hidden className="size-3.5" />
                تأییدنشده
              </span>
            )}
          </span>
        </div>

        {!user?.phoneVerified && success === null ? (
          <FormNotice>
            شمارهٔ تلفن شما هنوز تأیید نشده است.{' '}
            <Link
              href={VERIFY_HREF}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              تأیید شمارهٔ تلفن
            </Link>
          </FormNotice>
        ) : null}

        {success ? <FormNotice>{success}</FormNotice> : null}
        <FormError>{formError}</FormError>
        {resendNote ? <FormNotice>{resendNote}</FormNotice> : null}

        {step === 'start' ? (
          <form onSubmit={handleStart} noValidate className="space-y-4">
            <FormField
              id="security-phone-password"
              label="رمز عبور"
              hint="برای تغییر شماره، رمز عبور فعلی لازم است."
              error={fieldErrors.password}
            >
              <PasswordField
                id="security-phone-password"
                value={password}
                onChange={(value) => {
                  setPassword(value);
                  clearFieldError('password');
                }}
                autoComplete="current-password"
                disabled={pending}
                invalid={Boolean(fieldErrors.password)}
                describedBy={fieldMessageId(
                  'security-phone-password',
                  fieldErrors.password,
                  'برای تغییر شماره، رمز عبور فعلی لازم است.',
                )}
              />
            </FormField>

            <FormField
              id="security-new-phone"
              label="شمارهٔ تلفن جدید"
              hint="کد تأیید به این شماره پیامک می‌شود."
              error={fieldErrors.newPhone}
            >
              <PhoneInput
                id="security-new-phone"
                value={newPhone}
                onChange={(value) => {
                  setNewPhone(value);
                  clearFieldError('newPhone');
                }}
                disabled={pending}
                invalid={Boolean(fieldErrors.newPhone)}
                describedBy={fieldMessageId(
                  'security-new-phone',
                  fieldErrors.newPhone,
                  'کد تأیید به این شماره پیامک می‌شود.',
                )}
              />
            </FormField>

            <Button type="submit" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 aria-hidden className="animate-spin" />
                  در حال ارسال کد…
                </>
              ) : (
                'ارسال کد تأیید'
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} noValidate className="space-y-4">
            <FormNotice>
              کد {toPersianDigits(OTP_CODE_LENGTH)} رقمی پیامک‌شده به{' '}
              <span dir="ltr" className="bidi-ltr font-medium">
                {maskedPhone ?? ''}
              </span>{' '}
              را وارد کنید.
            </FormNotice>

            <FormField id="security-phone-code" label="کد تأیید" error={codeError ?? undefined}>
              <OtpInput
                id="security-phone-code"
                value={code}
                onChange={(digits) => {
                  setCode(digits);
                  if (codeError) setCodeError(null);
                }}
                disabled={pending || resending}
                invalid={Boolean(codeError)}
                describedBy={fieldMessageId(
                  'security-phone-code',
                  codeError ?? undefined,
                  undefined,
                )}
                autoFocus
              />
            </FormField>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={pending || resending} className="flex-1">
                {pending ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    در حال تأیید…
                  </>
                ) : (
                  'تأیید و تغییر شماره'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={backToStart}
                disabled={pending || resending}
              >
                ویرایش شماره
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={pending || resending || cooldown > 0}
            >
              {resending ? (
                <>
                  <Loader2 aria-hidden className="animate-spin" />
                  در حال ارسال…
                </>
              ) : cooldown > 0 ? (
                `ارسال دوباره تا ${formatCountdown(cooldown)}`
              ) : (
                'ارسال دوبارهٔ کد'
              )}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
