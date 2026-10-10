'use client';

/**
 * Sell step 3 — dynamic attributes (master prompt §37): the category's
 * effective filter schema rendered as form fields. A category without
 * attribute definitions is a valid empty step (§32) — the seller may
 * continue without inventing values.
 */

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ApiError, queryKeys } from '@/lib/api';
import { fetchFilterSchema } from '@/features/categories';
import {
  sellStepPath,
  validateAttributeValues,
  type AttributeValue,
} from '@/features/listings';
import { SellGuard } from '../sell-guard';
import { SellStepActions, SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';
import { AttributeField } from './attribute-field';

export function SellAttributesStep() {
  return (
    <SellGuard step="attributes">
      <AttributesForm />
    </SellGuard>
  );
}

function AttributesForm() {
  const router = useRouter();
  const { draft, updateDraft } = useSell();
  const [attempted, setAttempted] = useState(false);

  const categoryId = draft.categoryId;
  const schemaQuery = useQuery({
    queryKey: queryKeys.categories.filterSchema(categoryId ?? 'none'),
    queryFn: () => (categoryId === null ? Promise.resolve([]) : fetchFilterSchema(categoryId)),
    enabled: categoryId !== null,
    staleTime: 5 * 60_000,
  });

  const fields = useMemo(() => schemaQuery.data ?? [], [schemaQuery.data]);
  const ready = !schemaQuery.isPending && !schemaQuery.isError;
  // Validation only after the schema is on screen — never against a partial
  // field list, which would silently pass required fields.
  const errors = attempted && ready ? validateAttributeValues(draft.attributes, fields) : {};

  function changeValue(key: string, value: AttributeValue | undefined) {
    const next = { ...draft.attributes };
    if (value === undefined) {
      delete next[key];
    } else {
      next[key] = value;
    }
    updateDraft({ attributes: next });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    setAttempted(true);
    if (Object.keys(validateAttributeValues(draft.attributes, fields)).length > 0) return;
    updateDraft({ completedStep: 'attributes' });
    router.push(sellStepPath('location'));
  }

  return (
    <SellStepLayout
      step="attributes"
      title="ویژگی‌های کالا"
      description="این فیلدها بر اساس دستهٔ انتخاب‌شده ساخته می‌شوند و به دیده‌شدن آگهی شما کمک می‌کنند."
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {schemaQuery.isPending ? (
          <div className="space-y-5" aria-hidden>
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-control w-full" />
              </div>
            ))}
          </div>
        ) : schemaQuery.isError ? (
          <ErrorState
            requestId={
              schemaQuery.error instanceof ApiError ? schemaQuery.error.requestId : undefined
            }
            description="بارگیری ویژگی‌های این دسته ناموفق بود. دوباره تلاش کنید."
            onRetry={() => void schemaQuery.refetch()}
          />
        ) : fields.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="ویژگی خاصی برای این دسته ثبت نشده است"
            description="می‌توانید بدون واردکردن ویژگی اضافه ادامه دهید."
          />
        ) : (
          fields.map((field) => (
            <AttributeField
              key={field.field}
              field={field}
              value={draft.attributes[field.field]}
              error={errors[field.field]}
              onChange={(value) => changeValue(field.field, value)}
            />
          ))
        )}

        {ready ? (
          <SellStepActions>
            <Button asChild variant="outline">
              <Link href={sellStepPath('basic')}>
                <ChevronRight aria-hidden />
                بازگشت
              </Link>
            </Button>
            <Button type="submit">
              ادامه
              <ChevronLeft aria-hidden />
            </Button>
          </SellStepActions>
        ) : null}
      </form>
    </SellStepLayout>
  );
}
