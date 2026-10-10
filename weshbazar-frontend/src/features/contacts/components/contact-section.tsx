'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Check, Copy, Loader2, MessageCircle, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { CONTACT_METHODS, revealContact } from '@/features/contacts';
import { buildContactHref, formatContactMethod } from '@/features/listings';
import type {
  ContactMethodType,
  ContactTarget,
  PublicContact,
  PublicListingStatus,
} from '@/features/listings';

interface ContactSectionProps {
  listingId: string;
  status: PublicListingStatus;
  contact: PublicContact;
  className?: string;
}

const METHOD_ICONS: Record<ContactMethodType, typeof Phone> = {
  PHONE: Phone,
  WHATSAPP: MessageCircle,
  TELEGRAM: Send,
};

/**
 * Contact reveal flow (master prompt §23 block 9, §36; frontend-api-contract
 * §8). Values are never embedded in the page — each method is revealed on
 * demand via POST /listings/{id}/contact with an Idempotency-Key. Guest users
 * are routed to login preserving `next`; PHONE_NOT_VERIFIED stays inline.
 */
export function ContactSection({ listingId, status, contact, className }: ContactSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [revealed, setRevealed] = useState<Partial<Record<ContactMethodType, ContactTarget>>>({});
  const [pending, setPending] = useState<ContactMethodType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedMethod, setCopiedMethod] = useState<ContactMethodType | null>(null);
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    };
  }, []);

  const methods = CONTACT_METHODS.filter((method) => contact.methods.includes(method));
  const isClosed = status !== 'ACTIVE';
  const canReveal = !isClosed && contact.available && methods.length > 0;
  const hasRevealed = CONTACT_METHODS.some((method) => Boolean(revealed[method]));

  async function handleReveal(method: ContactMethodType) {
    if (pending !== null || revealed[method]) return;
    setPending(method);
    setError(null);
    try {
      const target = await revealContact(listingId, method);
      setRevealed((current) => ({ ...current, [method]: target }));
    } catch (caught) {
      if (caught instanceof ApiError) {
        if (caught.status === 401) {
          router.push(`/auth/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        if (caught.code === ApiErrorCode.PHONE_NOT_VERIFIED) {
          setError('برای مشاهدهٔ اطلاعات تماس، ابتدا شمارهٔ موبایل خود را در حساب کاربری تأیید کنید.');
          return;
        }
        if (caught.code === 'LISTING_NOT_ACTIVE') {
          setError('این آگهی دیگر فعال نیست و راه ارتباطی آن بسته شده است.');
          return;
        }
      }
      setError('نمایش اطلاعات تماس ناموفق بود. لطفاً دوباره تلاش کنید.');
    } finally {
      setPending(null);
    }
  }

  async function handleCopy(method: ContactMethodType, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedMethod(method);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopiedMethod(null), 2000);
    } catch {
      setError('کپی کردن نشد؛ لطفاً مقدار را دستی یادداشت کنید.');
    }
  }

  if (!canReveal && !hasRevealed) {
    return (
      <div
        className={cn(
          'rounded-control border border-dashed border-border bg-surface px-4 py-6 text-center',
          className,
        )}
      >
        <p className="text-ui text-muted-foreground">
          {isClosed
            ? 'این آگهی فروخته شده است؛ راه‌های تماس بسته شده‌اند.'
            : 'راه‌های تماس برای این آگهی در دسترس نیست.'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {error ? (
        <p
          role="alert"
          className="rounded-control border border-danger/30 bg-danger/10 px-3 py-2 text-meta text-danger"
        >
          {error}
        </p>
      ) : null}

      {CONTACT_METHODS.map((method) => {
        const target = revealed[method];
        if (!target) return null;
        const href = buildContactHref(method, target.value);
        const Icon = METHOD_ICONS[method];
        const isCopied = copiedMethod === method;
        return (
          <div key={method} className="rounded-control border border-primary/30 bg-primary-soft/50 p-3">
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
              {formatContactMethod(method)}
            </p>
            <p className="bidi-ltr mt-1 text-body font-semibold text-foreground">{target.value}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void handleCopy(method, target.value)}
              >
                {isCopied ? <Check aria-hidden /> : <Copy aria-hidden />}
                {isCopied ? 'کپی شد' : 'کپی'}
              </Button>
              {href ? (
                <Button asChild size="sm">
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    <Icon aria-hidden />
                    {method === 'PHONE' ? 'تماس' : method === 'WHATSAPP' ? 'واتساپ' : 'تلگرام'}
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        );
      })}

      {methods.map((method) => {
        if (revealed[method]) return null;
        const Icon = METHOD_ICONS[method];
        const isPending = pending === method;
        return (
          <Button
            key={method}
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending !== null || !canReveal}
            onClick={() => void handleReveal(method)}
          >
            {isPending ? <Loader2 className="animate-spin" aria-hidden /> : <Icon aria-hidden />}
            نمایش {formatContactMethod(method)}
          </Button>
        );
      })}
    </div>
  );
}
