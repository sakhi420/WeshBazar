'use client';

/**
 * Edit section 4 — contact methods (§42, mirrors the sell contact step §39).
 *
 * Two honesty rules drive this section: an unverified account phone is
 * flagged before the server rejects the save (PHONE_NOT_VERIFIED), and when
 * the loaded record does not carry the stored contact configuration the
 * seller is told that configuring the section replaces the current setup —
 * the diff builder only sends the section once it was genuinely edited.
 */

import { MessageCircle, Phone, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FormError,
  FormField,
  FormNotice,
  INPUT_CLASS,
  fieldMessageId,
} from '@/features/auth/components';
import type { ContactConfig } from '../../sell';
import { MethodRow } from '../../sell/components/steps/contact-method-row';

const OVERRIDE_HINT = 'خالی بگذارید تا از شمارهٔ تأییدشدهٔ حساب استفاده شود.';
const TELEGRAM_HINT = 'با حرف شروع می‌شود و ۵ تا ۳۲ نویسه دارد؛ مثل @weshbazar';

interface EditContactSectionProps {
  contact: ContactConfig;
  /** Seeded server configuration; null when the record did not carry it. */
  seedContact: ContactConfig | null;
  /** True while the working copy genuinely differs from the seed (§42). */
  dirty: boolean;
  errors: Record<string, string>;
  phoneVerified: boolean;
  onChange: (patch: Partial<ContactConfig>) => void;
}

export function EditContactSection({
  contact,
  seedContact,
  dirty,
  errors,
  phoneVerified,
  onChange,
}: EditContactSectionProps) {
  const groupError = errors.contactMethods;

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-ui font-semibold text-foreground">راه‌های تماس</h2>
        <p className="text-meta text-muted-foreground">
          خریداران از این راه‌ها با شما تماس می‌گیرند. حداقل یک راه باید فعال بماند.
        </p>
      </header>

      {!phoneVerified ? (
        <FormNotice>
          شمارهٔ تلفن حساب شما هنوز تأیید نشده است؛ برای ذخیرهٔ تغییرات راه‌های تماس، ابتدا آن را از
          بخش «حساب کاربری» تأیید کنید.
        </FormNotice>
      ) : null}

      {seedContact === null ? (
        <FormNotice>
          {dirty
            ? 'تنظیمات فعلی راه‌های تماس همراه این آگهی بارگیری نشد؛ با ذخیرهٔ این بخش، تنظیمات جدید جایگزین تنظیمات فعلی می‌شود.'
            : 'تنظیمات فعلی راه‌های تماس همراه این آگهی بارگیری نشد؛ تا وقتی این بخش را تغییر ندهید، تنظیمات فعلی دست‌نخورده می‌ماند.'}
        </FormNotice>
      ) : null}

      {groupError ? <FormError>{groupError}</FormError> : null}

      <MethodRow
        icon={<Phone aria-hidden className="size-4" />}
        title="تماس تلفنی"
        description="تماس مستقیم با شمارهٔ تأییدشدهٔ حساب"
        checked={contact.phoneEnabled}
        onToggle={(enabled) => onChange({ phoneEnabled: enabled })}
      >
        <FormField
          id="edit-contact-phone"
          label="شمارهٔ جایگزین"
          optional
          hint={OVERRIDE_HINT}
          error={errors['contactMethods.PHONE']}
        >
          <input
            id="edit-contact-phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={contact.phoneOverride}
            onChange={(event) => onChange({ phoneOverride: event.target.value })}
            placeholder="07XX XXX XXX"
            aria-invalid={errors['contactMethods.PHONE'] ? true : undefined}
            aria-describedby={fieldMessageId(
              'edit-contact-phone',
              errors['contactMethods.PHONE'],
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
        checked={contact.whatsappEnabled}
        onToggle={(enabled) => onChange({ whatsappEnabled: enabled })}
      >
        <FormField
          id="edit-contact-whatsapp"
          label="شمارهٔ جایگزین"
          optional
          hint={OVERRIDE_HINT}
          error={errors['contactMethods.WHATSAPP']}
        >
          <input
            id="edit-contact-whatsapp"
            type="tel"
            inputMode="tel"
            dir="ltr"
            value={contact.whatsappOverride}
            onChange={(event) => onChange({ whatsappOverride: event.target.value })}
            placeholder="07XX XXX XXX"
            aria-invalid={errors['contactMethods.WHATSAPP'] ? true : undefined}
            aria-describedby={fieldMessageId(
              'edit-contact-whatsapp',
              errors['contactMethods.WHATSAPP'],
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
        checked={contact.telegramEnabled}
        onToggle={(enabled) => onChange({ telegramEnabled: enabled })}
      >
        <FormField
          id="edit-contact-telegram"
          label="نام کاربری تلگرام"
          hint={TELEGRAM_HINT}
          error={errors['contactMethods.TELEGRAM']}
        >
          <input
            id="edit-contact-telegram"
            type="text"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            value={contact.telegramHandle}
            onChange={(event) => onChange({ telegramHandle: event.target.value })}
            placeholder="@weshbazar"
            aria-invalid={errors['contactMethods.TELEGRAM'] ? true : undefined}
            aria-describedby={fieldMessageId(
              'edit-contact-telegram',
              errors['contactMethods.TELEGRAM'],
              TELEGRAM_HINT,
            )}
            className={cn(INPUT_CLASS, 'text-start')}
          />
        </FormField>
      </MethodRow>
    </section>
  );
}
