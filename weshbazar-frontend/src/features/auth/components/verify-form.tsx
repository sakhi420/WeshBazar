'use client';

/**
 * Phone verification form (master prompt §27) — OTP entry after register.
 *
 * Session handling: the access token lives in memory only, so a reload here
 * re-bootstraps the session from the HttpOnly refresh cookie (§7). Users with
 * no refreshable session are routed to login with `next` preserved.
 *
 * Error handling follows frontend-error-map.md §3.2: OTP_INVALID → re-enter,
 * OTP_EXPIRED → resend enabled, OTP_MAX_ATTEMPTS_EXCEEDED → resend required,
 * OTP_RESEND_TOO_SOON → cooldown from Retry-After.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ApiError, queryKeys } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  OTP_CODE_LENGTH,
  OTP_MIN_DIGITS,
  cooldownFromRetryAfter,
  formatCountdown,
  resendPhoneVerification,
  secondsUntil,
  toPersianDigits,
  useAuthBootstrap,
  verifyPhone,
} from '@/features/auth';
import { FormError, FormNotice } from './form-error';
import { OtpInput } from './otp-input';

export interface VerifyFormProps {
  /** Sanitized internal path to continue to after verification. */
  next: string;
}

export function VerifyForm({ next }: VerifyFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { status, user, retry } = useAuthBootstrap();

  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);

  const loginHref = `/auth/login?next=${encodeURIComponent(
    `/auth/verify?next=${encodeURIComponent(next)}`,
  )}`;

  // No session → sign-in required before a phone can be verified.
  useEffect(() => {
    if (status === 'anonymous') router.replace(loginHref);
  }, [status, loginHref, router]);

  // One-second countdown for the resend button.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const alreadyVerified = user?.phoneVerified === true;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      const result = await verifyPhone(code);
      queryClient.setQueryData(queryKeys.auth.me, result);
      setVerified(true);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case 'OTP_INVALID':
            setCodeError('کد واردشده نادرست است.');
            break;
          case 'OTP_EXPIRED':
            setCodeError('عمر این کد به پایان رسیده است. کد جدید بگیرید.');
            setCooldown(0);
            break;
          case 'OTP_MAX_ATTEMPTS_EXCEEDED':
            setFormError('تعداد تلاش‌های مجاز تمام شده است. کد جدید بگیرید.');
            setCooldown(0);
            break;
          case 'RATE_LIMITED':
            setFormError('درخواست‌های زیادی ثبت شده است. کمی بعد دوباره امتحان کنید.');
            break;
          case 'NETWORK':
            setFormError('اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
            break;
          default:
            if (error.status === 401) {
              router.replace(loginHref);
              break;
            }
            setFormError('تأیید انجام نشد. دوباره تلاش کنید.');
        }
      } else {
        setFormError('تأیید انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setResendNote(null);
    setFormError(null);
    try {
      const result = await resendPhoneVerification();
      if (result.phoneVerified) {
        setVerified(true);
        return;
      }
      const wait = secondsUntil(result.resendAvailableAt);
      setCooldown(wait > 0 ? wait : 60);
      setResendNote('کد تأیید جدید پیامک شد.');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'OTP_RESEND_TOO_SOON') {
          setCooldown(cooldownFromRetryAfter(error.retryAfterSeconds));
        } else if (error.code === 'OTP_DELIVERY_FAILED') {
          setFormError('ارسال پیامک ناموفق بود. کمی بعد دوباره تلاش کنید.');
        } else if (error.status === 401) {
          router.replace(loginHref);
        } else {
          setFormError('ارسال دوبارهٔ کد انجام نشد.');
        }
      } else {
        setFormError('ارسال دوبارهٔ کد انجام نشد.');
      }
    } finally {
      setResending(false);
    }
  }

  // --- Session bootstrap states ----------------------------------------------

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-ui text-muted-foreground">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        در حال بررسی نشست…
      </div>
    );
  }

  if (status === 'unreachable') {
    return (
      <div className="space-y-4">
        <FormError>ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.</FormError>
        <Button type="button" variant="outline" className="w-full" onClick={retry}>
          تلاش دوباره
        </Button>
      </div>
    );
  }

  if (status === 'anonymous') {
    // The effect above is redirecting to login.
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-ui text-muted-foreground">
        <Loader2 aria-hidden className="size-4 animate-spin" />
        در حال انتقال به صفحهٔ ورود…
      </div>
    );
  }

  // --- Verified ---------------------------------------------------------------

  if (verified || alreadyVerified) {
    return (
      <div className="space-y-5 text-center">
        <p
          role="status"
          className="flex flex-col items-center gap-2 text-ui text-foreground"
        >
          <CheckCircle2 aria-hidden className="size-10 text-success" strokeWidth={1.6} />
          شمارهٔ تلفن شما تأیید شد.
        </p>
        <Button type="button" size="lg" className="w-full" onClick={() => router.replace(next)}>
          ادامه
        </Button>
      </div>
    );
  }

  // --- Code entry -------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormNotice>
        کد {toPersianDigits(OTP_CODE_LENGTH)} رقمی پیامک‌شده به{' '}
        <span className="bidi-ltr font-medium" dir="ltr">
          {user?.phone ?? ''}
        </span>{' '}
        را وارد کنید.
      </FormNotice>
      <FormError>{formError}</FormError>
      {resendNote ? <FormNotice>{resendNote}</FormNotice> : null}

      <div className="space-y-1.5">
        <label htmlFor="verify-code" className="block text-ui font-medium text-foreground">
          کد تأیید
        </label>
        <OtpInput
          id="verify-code"
          value={code}
          onChange={setCode}
          disabled={pending || resending}
          invalid={Boolean(codeError)}
          describedBy={codeError ? 'verify-code-error' : undefined}
          autoFocus
        />
        {codeError ? (
          <p id="verify-code-error" className="text-meta text-danger">
            {codeError}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending || resending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            در حال تأیید…
          </>
        ) : (
          'تأیید شماره'
        )}
      </Button>

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
  );
}
