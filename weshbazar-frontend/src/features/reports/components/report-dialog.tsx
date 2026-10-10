'use client';

import { useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CheckCircle2, Flag, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { formatNumber } from '@/features/listings';
import { REPORT_REASON_OPTIONS, submitListingReport } from '@/features/reports';
import type { ReportReason } from '@/features/reports';

const MAX_DESCRIPTION_LENGTH = 1000;

interface ReportDialogProps {
  listingId: string;
  className?: string;
}

/**
 * Report flow (master prompt §23 block 10, §2/§3). Native <dialog> modal with
 * reason radios + optional description (≤1000 per SubmitReportDto). Backend
 * outcomes are mapped by stable error code: REPORT_ALREADY_OPEN and
 * CANNOT_REPORT_OWN_LISTING stay inline; 401 routes to login with `next`.
 */
export function ReportDialog({ listingId, className }: ReportDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function openDialog() {
    setReason(null);
    setDescription('');
    setError(null);
    setDone(false);
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitListingReport(listingId, {
        reason,
        description: description.trim() ? description : undefined,
      });
      setDone(true);
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 401) {
          closeDialog();
          router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (caught.code === ApiErrorCode.PHONE_NOT_VERIFIED) {
          setError('برای ثبت گزارش، ابتدا شمارهٔ موبایل خود را در حساب کاربری تأیید کنید.');
          return;
        }
        if (caught.code === 'REPORT_ALREADY_OPEN') {
          setError('شما پیش‌تر این آگهی را گزارش کرده‌اید و گزارش شما در حال بررسی است.');
          return;
        }
        if (caught.code === 'CANNOT_REPORT_OWN_LISTING') {
          setError('نمی‌توانید آگهی خودتان را گزارش کنید.');
          return;
        }
        if (caught.code === ApiErrorCode.VALIDATION_ERROR) {
          setError('توضیحات گزارش معتبر نیست؛ لطفاً آن را بازنویسی کنید.');
          return;
        }
      }
      setError('ثبت گزارش ناموفق بود. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openDialog} className={className}>
        <Flag aria-hidden />
        گزارش آگهی
      </Button>

      <dialog
        ref={dialogRef}
        aria-labelledby="report-dialog-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) closeDialog();
        }}
        className="fixed inset-0 m-auto h-fit max-h-[85dvh] w-[min(28rem,calc(100%-2rem))] overflow-y-auto rounded-surface border border-border bg-surface p-0 text-foreground shadow-lg backdrop:bg-foreground/40"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 id="report-dialog-title" className="text-card-title font-semibold">
            گزارش آگهی
          </h2>
          <Button type="button" variant="ghost" size="icon" onClick={closeDialog} aria-label="بستن">
            <X aria-hidden />
          </Button>
        </div>

        {done ? (
          <div className="space-y-3 px-4 py-6 text-center">
            <CheckCircle2 className="mx-auto size-8 text-success" aria-hidden />
            <p className="text-ui font-semibold text-foreground">گزارش شما ثبت شد</p>
            <p className="text-meta text-muted-foreground">
              تیم بررسی ما گزارش شما را بررسی می‌کند. سپاس از همکاری شما.
            </p>
            <Button type="button" onClick={closeDialog} className="w-full">
              بستن
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4">
            <fieldset>
              <legend className="text-ui font-medium text-foreground">دلیل گزارش</legend>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-control border border-border px-3 text-ui has-[:checked]:border-primary has-[:checked]:bg-primary-soft"
                  >
                    <input
                      type="radio"
                      name="report-reason"
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => setReason(option.value)}
                      className="size-4 accent-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="report-description" className="text-ui font-medium text-foreground">
                توضیحات <span className="text-muted-foreground">(اختیاری)</span>
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={MAX_DESCRIPTION_LENGTH}
                rows={3}
                placeholder="جزئیاتی که به بررسی کمک می‌کند…"
                className="mt-2 w-full rounded-control border border-input bg-surface p-3 text-ui text-foreground outline-none transition-colors duration-small placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="mt-1 text-end text-caption text-muted">
                {formatNumber(description.length)} / {formatNumber(MAX_DESCRIPTION_LENGTH)}
              </p>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-control border border-danger/30 bg-danger/10 px-3 py-2 text-meta text-danger"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={!reason || submitting}>
              {submitting ? <Loader2 className="animate-spin" aria-hidden /> : <Flag aria-hidden />}
              ثبت گزارش
            </Button>
            <p className="text-caption text-muted-foreground">
              گزارش‌های نادرست یا تکراری ممکن است نادیده گرفته شوند.
            </p>
          </form>
        )}
      </dialog>
    </>
  );
}
