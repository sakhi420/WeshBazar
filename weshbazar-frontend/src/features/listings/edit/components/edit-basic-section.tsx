'use client';

/**
 * Edit section 1 — basic info (§42, mirrors the sell basic step §36):
 * category, title, description, condition and pricing. Fully controlled by
 * the edit view — the section only reports partial changes upwards, so the
 * diff builder keeps owning the "what actually changed" decision.
 */

import type { ListingCondition } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, INPUT_CLASS, fieldMessageId } from '@/features/auth/components';
import { formatCondition } from '../../format';
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '../../sell';
import { ChoiceButton } from '../../sell/components/steps/choice-button';
import type { PricingType } from '../../types';
import type { CategoryOption, EditListingForm } from '../model';

const TITLE_HINT = 'بین ۱۰ تا ۱۲۰ نویسه؛ فقط متن ساده.';
const DESCRIPTION_HINT = 'حداقل ۳۰ و حداکثر ۵٬۰۰۰ نویسه. وضعیت و جزئیات مهم را بنویسید.';
const PRICE_HINT = 'مبلغ را به افغانی وارد کنید؛ رقم فارسی هم پذیرفته می‌شود.';
const CATEGORY_HINT =
  'فقط زیردسته‌های نهایی قابل انتخاب‌اند؛ با تغییر دسته، ویژگی‌های همان دسته بارگیری می‌شوند.';

const CONDITION_VALUES: readonly ListingCondition[] = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'];

const PRICING_CHOICES: readonly { value: PricingType; label: string; description: string }[] = [
  { value: 'PAID', label: 'قیمت مشخص', description: 'مبلغ مورد نظر را وارد می‌کنید.' },
  { value: 'FREE', label: 'رایگان', description: 'کالا را بدون مبلغ واگذار می‌کنید.' },
  { value: 'CONTACT', label: 'توافقی', description: 'قیمت را در گفت‌وگو مشخص می‌کنید.' },
];

export type EditCategoriesStatus = 'pending' | 'error' | 'ready';

interface EditBasicSectionProps {
  form: EditListingForm;
  errors: Record<string, string>;
  categoryOptions: readonly CategoryOption[];
  /** Seeded category name — fallback option when the fetched list lacks it. */
  currentCategoryLabel: string;
  categoriesStatus: EditCategoriesStatus;
  onRetryCategories: () => void;
  onChange: (patch: Partial<EditListingForm>) => void;
}

export function EditBasicSection({
  form,
  errors,
  categoryOptions,
  currentCategoryLabel,
  categoriesStatus,
  onRetryCategories,
  onChange,
}: EditBasicSectionProps) {
  const hasCurrentOption = categoryOptions.some((option) => option.id === form.categoryId);

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-ui font-semibold text-foreground">مشخصات کالا</h2>
        <p className="text-meta text-muted-foreground">
          عنوان، توضیحات، وضعیت و قیمت — همان چیزهایی که خریدار اول از همه می‌بیند.
        </p>
      </header>

      <FormField
        id="edit-category"
        label="دستهٔ آگهی"
        hint={CATEGORY_HINT}
        error={errors.categoryId}
      >
        <select
          id="edit-category"
          value={form.categoryId}
          disabled={categoriesStatus !== 'ready'}
          onChange={(event) => {
            const nextId = event.target.value;
            if (nextId.length > 0) onChange({ categoryId: nextId });
          }}
          aria-invalid={errors.categoryId ? true : undefined}
          aria-describedby={fieldMessageId('edit-category', errors.categoryId, CATEGORY_HINT)}
          className={INPUT_CLASS}
        >
          {!hasCurrentOption && form.categoryId.length > 0 ? (
            <option value={form.categoryId}>{currentCategoryLabel}</option>
          ) : null}
          {categoryOptions.map((option) => (
            <option key={option.id} value={option.id} disabled={!option.selectable}>
              {option.label}
            </option>
          ))}
        </select>
      </FormField>

      {categoriesStatus === 'error' ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-meta text-danger">بارگیری فهرست دسته‌ها ناموفق بود.</p>
          <Button type="button" size="sm" variant="outline" onClick={onRetryCategories}>
            تلاش دوباره
          </Button>
        </div>
      ) : categoriesStatus === 'pending' ? (
        <p className="text-meta text-muted-foreground">در حال بارگیری فهرست دسته‌ها…</p>
      ) : null}

      <FormField id="edit-title" label="عنوان آگهی" hint={TITLE_HINT} error={errors.title}>
        <input
          id="edit-title"
          type="text"
          value={form.title}
          maxLength={TITLE_MAX_LENGTH}
          onChange={(event) => onChange({ title: event.target.value })}
          placeholder="مثلاً: موبایل سامسونگ A54 در حد نو"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={fieldMessageId('edit-title', errors.title, TITLE_HINT)}
          className={INPUT_CLASS}
        />
      </FormField>

      <FormField
        id="edit-description"
        label="توضیحات"
        hint={DESCRIPTION_HINT}
        error={errors.description}
      >
        <textarea
          id="edit-description"
          rows={6}
          value={form.description}
          maxLength={DESCRIPTION_MAX_LENGTH}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="وضعیت کالا، مدت استفاده، لوازم همراه و هر نکتهٔ مهم دیگر…"
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={fieldMessageId(
            'edit-description',
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
          aria-describedby={errors.condition ? 'edit-condition-error' : undefined}
          className="grid gap-2 sm:grid-cols-4"
        >
          {CONDITION_VALUES.map((value) => (
            <ChoiceButton
              key={value}
              active={form.condition === value}
              onClick={() => onChange({ condition: value })}
              label={formatCondition(value)}
            />
          ))}
        </div>
        {errors.condition ? (
          <p id="edit-condition-error" className="text-meta text-danger">
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
              active={form.pricingType === choice.value}
              onClick={() => onChange({ pricingType: choice.value })}
              label={choice.label}
              description={choice.description}
            />
          ))}
        </div>
      </fieldset>

      {form.pricingType === 'PAID' ? (
        <div className="space-y-3">
          <FormField id="edit-price" label="مبلغ (افغانی)" hint={PRICE_HINT} error={errors.price}>
            <input
              id="edit-price"
              type="text"
              inputMode="decimal"
              dir="ltr"
              value={form.price}
              onChange={(event) => onChange({ price: event.target.value })}
              placeholder="مثلاً ۴۵٬۰۰۰"
              aria-invalid={errors.price ? true : undefined}
              aria-describedby={fieldMessageId('edit-price', errors.price, PRICE_HINT)}
              className={cn(INPUT_CLASS, 'text-start')}
            />
          </FormField>
          <label className="flex min-h-touch w-fit cursor-pointer items-center gap-2 text-ui text-foreground">
            <input
              type="checkbox"
              checked={form.negotiable}
              onChange={(event) => onChange({ negotiable: event.target.checked })}
              className="size-4 accent-primary"
            />
            قیمت قابل مذاکره است
          </label>
        </div>
      ) : null}
    </section>
  );
}
