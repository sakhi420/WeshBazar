'use client';

/**
 * Edit section 2 — dynamic attributes (§42, mirrors the sell attributes step
 * §37). The schema arrives from the view (it already owns the query for the
 * diff builder), so this section stays presentational: pending → skeleton,
 * error → retry panel, empty schema → honest note, otherwise one
 * `AttributeField` per definition.
 */

import { SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import type { FilterSchemaField } from '@/features/categories';
import { AttributeField } from '../../sell/components/steps/attribute-field';
import type { AttributeValue, AttributeValues } from '../../types';

export type EditSchemaStatus = 'pending' | 'error' | 'ready';

interface EditAttributesSectionProps {
  fields: readonly FilterSchemaField[];
  values: AttributeValues;
  errors: Record<string, string>;
  status: EditSchemaStatus;
  requestId?: string;
  onRetry: () => void;
  onChange: (key: string, value: AttributeValue | undefined) => void;
}

export function EditAttributesSection({
  fields,
  values,
  errors,
  status,
  requestId,
  onRetry,
  onChange,
}: EditAttributesSectionProps) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-ui font-semibold text-foreground">ویژگی‌های کالا</h2>
        <p className="text-meta text-muted-foreground">
          این فیلدها بر اساس دستهٔ انتخاب‌شده ساخته می‌شوند و به دیده‌شدن آگهی شما کمک می‌کنند.
        </p>
      </header>

      {status === 'pending' ? (
        <div className="space-y-5" aria-hidden>
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-control w-full" />
            </div>
          ))}
        </div>
      ) : status === 'error' ? (
        <ErrorState
          requestId={requestId}
          description="بارگیری ویژگی‌های این دسته ناموفق بود. دوباره تلاش کنید."
          onRetry={onRetry}
        />
      ) : fields.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="ویژگی خاصی برای این دسته ثبت نشده است"
          description="می‌توانید بدون واردکردن ویژگی اضافه، تغییرات را ذخیره کنید."
        />
      ) : (
        <div className="space-y-5">
          {fields.map((field) => (
            <AttributeField
              key={field.field}
              field={field}
              value={values[field.field]}
              error={errors[field.field]}
              onChange={(value) => onChange(field.field, value)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
