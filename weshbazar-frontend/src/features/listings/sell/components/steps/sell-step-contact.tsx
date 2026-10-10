'use client';

/**
 * Sell step 5 — contact methods (master prompt §39, §53). The backend replaces
 * the complete contact configuration, so every enabled row is validated and
 * the step PATCHes `contactMethods` together with `expectedVersion`. An
 * unverified account phone is flagged here because the submit step fails
 * with PHONE_NOT_VERIFIED otherwise.
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Loader2, MessageCircle, Phone, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FormError,
  FormField,
  FormNotice,
  INPUT_CLASS,
  bindFieldErrors,
  fieldMessageId,
} from '@/features/auth/components';
import { useAuthBootstrap } from '@/features/auth';
import {
  contactMethodsFromDraft,
  describeSellError,
  fetchMyListing,
  mergeOwnerListing,
  sellStepPath,
  shouldRefreshOwnerListing,
  syncOwnerListing,
  updateListing,
  validateContactConfig,
} from '@/features/listings';
import { SellGuard } from '../sell-guard';
import { SellStepActions, SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';
import { MethodRow } from './contact-method-row';

export function SellContactStep() {
  return (
    <SellGuard step="contact">
      <ContactForm />
    </SellGuard>
  );
}

const INCOMPLETE_ERROR = 'sell-flow-incomplete';
const OVERRIDE_HINT = 'خالی بگذارید تا از شمارهٔ تأییدشدهٔ حساب استفاده شود.';
const TELEGRAM_HINT = 'با حرف شروع می‌شود و ۵ تا ۳۲ نویسه دارد؛ مثل @weshbazar';

function ContactForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthBootstrap();
  const { draft, replaceDraft, updateContact } = useSell();
  const [attempted, setAttempted] = useState(false);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clientErrors = attempted ? validateContactConfig(draft.contact) : {};
  // Server field details (contactMethods.PHONE, …) win over client messages
  // until the next submit clears them.
  const mergedError = (key: string): string | undefined => apiFieldErrors[key] ?? clientErrors[key];

  const mutation = useMutation({
    mutationFn: () => {
      const { listingId, listingVersion } = draft;
      if (listingId === null) throw new Error(INCOMPLETE_ERROR);
      return updateListing(listingId, {
        contactMethods: contactMethodsFromDraft(draft.contact),
        expectedVersion: listingVersion ?? undefined,
      });
    },
    onSuccess: (listing) => {
      syncOwnerListing(queryClient, listing);
      replaceDraft(mergeOwnerListing({ ...draft, completedStep: 'contact' }, listing));
      router.push(sellStepPath('preview'));
    },
    onError: async (error) => {
      if (error instanceof Error && error.message === INCOMPLETE_ERROR) {
        setFormError('گام‌های قبلی کامل نیست؛ ابتدا موقعیت آگهی را ذخیره کنید.');
        return;
      }
      setApiFieldErrors(bindFieldErrors(error));
      if (shouldRefreshOwnerListing(error) && draft.listingId !== null) {
        try {
          const fresh = await fetchMyListing(draft.listingId);
          syncOwnerListing(queryClient, fresh);
          replaceDraft(mergeOwnerListing({ ...draft, listingVersion: fresh.version }, fresh));
        } catch {
          // Keep the original conflict message; a retry surfaces it again.
        }
      }
      setFormError(describeSellError(error));
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setApiFieldErrors({});
    setFormError(null);
    if (Object.keys(validateContactConfig(draft.contact)).length > 0) return;
    mutation.mutate();
  }

  const groupError = mergedError('contactMethods');

  return (
    <SellStepLayout
      step="contact"
      title="راه‌های تماس"
      description="خریداران از این راه‌ها با شما تماس می‌گیرند. حداقل یک راه باید فعال بماند."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {user !== null && !user.phoneVerified ? (
          <FormNotice>
            شمارهٔ تلفن حساب شما هنوز تأیید نشده است؛ برای ثبت نهایی آگهی، ابتدا آن را از بخش «حساب
            کاربری» تأیید کنید.
          </FormNotice>
        ) : null}

        {groupError ? <FormError>{groupError}</FormError> : null}

        <MethodRow
          icon={<Phone aria-hidden className="size-4" />}
          title="تماس تلفنی"
          description="تماس مستقیم با شمارهٔ تأییدشدهٔ حساب"
          checked={draft.contact.phoneEnabled}
          onToggle={(enabled) => updateContact({ phoneEnabled: enabled })}
        >
          <FormField
            id="contact-phone"
            label="شمارهٔ جایگزین"
            optional
            hint={OVERRIDE_HINT}
            error={mergedError('contactMethods.PHONE')}
          >
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={draft.contact.phoneOverride}
              onChange={(event) => updateContact({ phoneOverride: event.target.value })}
              placeholder="07XX XXX XXX"
              aria-invalid={mergedError('contactMethods.PHONE') ? true : undefined}
              aria-describedby={fieldMessageId(
                'contact-phone',
                mergedError('contactMethods.PHONE'),
                OVERRIDE_HINT,
              )}
              className={cn(INPUT_CLASS, 'text-start')}
            />
          </FormField>
        </MethodRow>

        <MethodRow
          icon={<MessageCircle aria-hidden className="size-4" />}
          title="واتساپ"
          description="پیام در واتساپ"
          checked={draft.contact.whatsappEnabled}
          onToggle={(enabled) => updateContact({ whatsappEnabled: enabled })}
        >
          <FormField
            id="contact-whatsapp"
            label="شمارهٔ جایگزین"
            optional
            hint={OVERRIDE_HINT}
            error={mergedError('contactMethods.WHATSAPP')}
          >
            <input
              id="contact-whatsapp"
              type="tel"
              inputMode="tel"
              dir="ltr"
              value={draft.contact.whatsappOverride}
              onChange={(event) => updateContact({ whatsappOverride: event.target.value })}
              placeholder="07XX XXX XXX"
              aria-invalid={mergedError('contactMethods.WHATSAPP') ? true : undefined}
              aria-describedby={fieldMessageId(
                'contact-whatsapp',
                mergedError('contactMethods.WHATSAPP'),
                OVERRIDE_HINT,
              )}
              className={cn(INPUT_CLASS, 'text-start')}
            />
          </FormField>
        </MethodRow>

        <MethodRow
          icon={<Send aria-hidden className="size-4" />}
          title="تلگرام"
          description="پیام در تلگرام با نام کاربری شما"
          checked={draft.contact.telegramEnabled}
          onToggle={(enabled) => updateContact({ telegramEnabled: enabled })}
        >
          <FormField
            id="contact-telegram"
            label="نام کاربری تلگرام"
            hint={TELEGRAM_HINT}
            error={mergedError('contactMethods.TELEGRAM')}
          >
            <input
              id="contact-telegram"
              type="text"
              dir="ltr"
              autoCapitalize="none"
              autoCorrect="off"
              value={draft.contact.telegramHandle}
              onChange={(event) => updateContact({ telegramHandle: event.target.value })}
              placeholder="@weshbazar"
              aria-invalid={mergedError('contactMethods.TELEGRAM') ? true : undefined}
              aria-describedby={fieldMessageId(
                'contact-telegram',
                mergedError('contactMethods.TELEGRAM'),
                TELEGRAM_HINT,
              )}
              className={cn(INPUT_CLASS, 'text-start')}
            />
          </FormField>
        </MethodRow>

        {formError ? <FormError>{formError}</FormError> : null}

        <SellStepActions>
          <Button asChild variant="outline">
            <Link href={sellStepPath('location')}>
              <ChevronRight aria-hidden />
              بازگشت
            </Link>
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 aria-hidden className="animate-spin" />
                در حال ذخیره…
              </>
            ) : (
              <>
                ادامه
                <ChevronLeft aria-hidden />
              </>
            )}
          </Button>
        </SellStepActions>
      </form>
    </SellStepLayout>
  );
}
