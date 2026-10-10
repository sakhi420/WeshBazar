'use client';

/**
 * Forgot-password form (master prompt §28, §303) — recovery start.
 *
 * Anti-enumeration: the success message is identical whether or not the phone
 * exists (the API response is intentionally generic). The user is then routed
 * to the reset step with the normalized phone prefilled.
 * Error handling follows frontend-error-map.md §3.2.
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, MessageSquareText } from 'lucide-react';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  isPlausiblePhone,
  normalizePhone,
  requestPasswordReset,
} from '@/features/auth';
import { FormError, FormNotice, bindFieldErrors } from './form-error';
import { FormField, fieldMessageId } from './form-field';
import { PhoneInput } from './phone-input';

export function ForgotForm() {
  const [phone, setPhone] = useState('');
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);
    setPhoneError(null);

    const normalized = normalizePhone(phone);
    if (!normalized) {
      setPhoneError('شمارهٔ تلفن را وارد کنید.');
      return;
    }
    if (!isPlausiblePhone(normalized)) {
      setPhoneError('شمارهٔ تلفن معتبر نیست.');
      return;
    }

    setPending(true);
    try {
      await requestPasswordReset(normalized);
      setSentTo(normalized);
    } catch (error) {
      if (error instanceof ApiError) {
        switch (error.code) {
          case ApiErrorCode.INVALID_PHONE_NUMBER:
            setPhoneError('شمارهٔ تلفن معتبر نیست.');
            break;
          case ApiErrorCode.RATE_LIMITED:
            setFormError('درخواست‌های زیادی ثبت شده است. کمی بعد دوباره امتحان کنید.');
            break;
          case ApiErrorCode.VALIDATION_ERROR: {
            const bound = bindFieldErrors(error);
            if (bound.phone) setPhoneError(bound.phone);
            if (Object.keys(bound).length === 0) {
              setFormError('اطلاعات واردشده معتبر نیست.');
            }
            break;
          }
          case ApiErrorCode.NETWORK:
            setFormError('اتصال به سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.');
            break;
          default:
            setFormError('ارسال کد بازیابی انجام نشد. دوباره تلاش کنید.');
        }
      } else {
        setFormError('ارسال کد بازیابی انجام نشد. دوباره تلاش کنید.');
      }
    } finally {
      setPending(false);
    }
  }

  // --- Sent: anti-enumeration-safe confirmation -------------------------------

  if (sentTo) {
    return (
      <div className="space-y-5">
        <p role="status" className="flex flex-col items-center gap-2 py-2 text-center text-ui text-foreground">
          <MessageSquareText aria-hidden className="size-10 text-primary" strokeWidth={1.6} />
          اگر این شماره در سیستم ثبت شده باشد، کد بازیابی پیامک خواهد شد.
        </p>
        <FormNotice>
          شماره:{' '}
          <span className="bidi-ltr font-medium" dir="ltr">
            {sentTo}
          </span>
        </FormNotice>
        <Button asChild size="lg" className="w-full">
          <Link href={`/auth/reset-password?phone=${encodeURIComponent(sentTo)}`}>
            وارد کردن کد و رمز جدید
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setSentTo(null);
            setFormError(null);
          }}
        >
          ویرایش شمارهٔ تلفن
        </Button>
      </div>
    );
  }

  // --- Phone entry ------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <FormError>{formError}</FormError>

      <FormField id="forgot-phone" label="شمارهٔ تلفن" error={phoneError ?? undefined}>
        <PhoneInput
          id="forgot-phone"
          value={phone}
          onChange={setPhone}
          disabled={pending}
          invalid={Boolean(phoneError)}
          describedBy={fieldMessageId('forgot-phone', phoneError ?? undefined, undefined)}
          autoFocus
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 aria-hidden className="animate-spin" />
            در حال ارسال…
          </>
        ) : (
          'ارسال کد بازیابی'
        )}
      </Button>
    </form>
  );
}
