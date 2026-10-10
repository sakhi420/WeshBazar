'use client';

/**
 * Sell step 2 — basic info (master prompt §36): title, description, condition
 * and pricing. Inputs bind straight to the persisted draft so a reload never
 * loses a keystroke; validation runs on submit and then live until the step
 * is left.
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, INPUT_CLASS, fieldMessageId } from '@/features/auth/components';
import type { ListingCondition } from '@/lib/api';
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  formatCondition,
  sellStepPath,
  validateDescription,
  validatePriceField,
  validateTitle,
  type PricingType,
  type SellDraft,
} from '@/features/listings';
import { SellGuard } from '../sell-guard';
import { SellStepActions, SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';
import { ChoiceButton } from './choice-button';

export function SellBasicStep() {
  return (
    <SellGuard step="basic">
      <BasicForm />
    </SellGuard>
  );
}

const TITLE_HINT = 'بین ۱۰ تا ۱۲۰ نویسه؛ فقط متن ساده.';
const DESCRIPTION_HINT = 'حداقل ۳۰ و حداکثر ۵٬۰۰۰ نویسه. وضعیت و جزئیات مهم را بنویسید.';
const PRICE_HINT = 'مبلغ را به افغانی وارد کنید؛ رقم فارسی هم پذیرفته می‌شود.';

const CONDITION_VALUES: readonly ListingCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

const PRICING_CHOICES: readonly { value: PricingType; label: string; description: string }[] = [
  { value: 'PAID', label: 'قیمت مشخص', description: 'مبلغ مورد نظر را وارد می‌کنید.' },
  { value: 'FREE', label: 'رایگان', description: 'کالا را بدون مبلغ واگذار می‌کنید.' },
  { value: 'CONTACT', label: 'توافقی', description: 'قیمت را در گفت‌وگو مشخص می‌کنید.' },
];

/** Field-key → Persian message, mirroring the backend content rules (§45). */
function validateBasic(draft: SellDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = validateTitle(draft.title);
  if (title !== null) errors.title = title;
  const description = validateDescription(draft.description);
  if (description !== null) errors.description = description;
  if (draft.condition === null) errors.condition = 'وضعیت کالا را انتخاب کنید.';
  const price = validatePriceField(draft.price, draft.pricingType);
  if (price !== null) errors.price = price;
  return errors;
}

function BasicForm() {
  const router = useRouter();
  const { draft, updateDraft } = useSell();
  const [attempted, setAttempted] = useState(false);
  const errors = attempted ? validateBasic(draft) : {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (Object.keys(validateBasic(draft)).length > 0) return;
    updateDraft({ completedStep: 'basic' });
    router.push(sellStepPath('attributes'));
  }

  return (
    <SellStepLayout
      step="basic"
      title="مشخصات کالا"
      description="عنوان، توضیحات، وضعیت و قیمت — همان چیزهایی که خریدار اول از همه می‌بیند."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <FormField id="sell-title" label="عنوان آگهی" hint={TITLE_HINT} error={errors.title}>
          <input
            id="sell-title"
            type="text"
            value={draft.title}
            maxLength={TITLE_MAX_LENGTH}
            onChange={(event) => updateDraft({ title: event.target.value })}
            placeholder="مثلاً: موبایل سامسونگ A54 در حد نو"
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={fieldMessageId('sell-title', errors.title, TITLE_HINT)}
            className={INPUT_CLASS}
          />
        </FormField>

        <FormField
          id="sell-description"
          label="توضیحات"
          hint={DESCRIPTION_HINT}
          error={errors.description}
        >
          <textarea
            id="sell-description"
            rows={6}
            value={draft.description}
            maxLength={DESCRIPTION_MAX_LENGTH}
            onChange={(event) => updateDraft({ description: event.target.value })}
            placeholder="وضعیت کالا، مدت استفاده، لوازم همراه و هر نکتهٔ مهم دیگر…"
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={fieldMessageId(
              'sell-description',
              errors.description,
              DESCRIPTION_HINT,
            )}
            className={cn(INPUT_CLASS, 'h-auto py-2 leading-7')}
          />
        </FormField>

        <fieldset className="space-y-2">
          <legend className="block text-ui font-medium text-foreground">وضعیت کالا</legend>
          <div
            role="radiogroup"
            aria-invalid={errors.condition ? true : undefined}
            aria-describedby={errors.condition ? 'sell-condition-error' : undefined}
            className="grid gap-2 sm:grid-cols-4"
          >
            {CONDITION_VALUES.map((value) => (
              <ChoiceButton
                key={value}
                active={draft.condition === value}
                onClick={() => updateDraft({ condition: value })}
                label={formatCondition(value)}
              />
            ))}
          </div>
          {errors.condition ? (
            <p id="sell-condition-error" className="text-meta text-danger">
              {errors.condition}
            </p>
          ) : null}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="block text-ui font-medium text-foreground">نحوهٔ قیمت‌گذاری</legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
            {PRICING_CHOICES.map((choice) => (
              <ChoiceButton
                key={choice.value}
                active={draft.pricingType === choice.value}
                onClick={() => updateDraft({ pricingType: choice.value })}
                label={choice.label}
                description={choice.description}
              />
            ))}
          </div>
        </fieldset>

        {draft.pricingType === 'PAID' ? (
          <div className="space-y-3">
            <FormField id="sell-price" label="مبلغ (افغانی)" hint={PRICE_HINT} error={errors.price}>
              <input
                id="sell-price"
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={draft.price}
                onChange={(event) => updateDraft({ price: event.target.value })}
                placeholder="مثلاً ۴۵٬۰۰۰"
                aria-invalid={errors.price ? true : undefined}
                aria-describedby={fieldMessageId('sell-price', errors.price, PRICE_HINT)}
                className={cn(INPUT_CLASS, 'text-start')}
              />
            </FormField>
            <label className="flex min-h-touch w-fit cursor-pointer items-center gap-2 text-ui text-foreground">
              <input
                type="checkbox"
                checked={draft.negotiable}
                onChange={(event) => updateDraft({ negotiable: event.target.checked })}
                className="size-4 accent-primary"
              />
              قیمت قابل مذاکره است
            </label>
          </div>
        ) : null}

        <SellStepActions>
          <Button asChild variant="outline">
            <Link href={sellStepPath('photos')}>
              <ChevronRight aria-hidden />
              بازگشت
            </Link>
          </Button>
          <Button type="submit">
            ادامه
            <ChevronLeft aria-hidden />
          </Button>
        </SellStepActions>
      </form>
    </SellStepLayout>
  );
}
