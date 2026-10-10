'use client';

/**
 * Edit Listing view (§42) — the seller's single-page editor at
 * `/sell/[id]/edit`.
 *
 * Design contract (mirrors the frozen backend):
 * - The form is seeded once from the owner record; the *seed* keeps tracking
 *   the query data, so a conflict refetch only moves the diff baseline and
 *   never clobbers what the seller has typed.
 * - Saving PATCHes only the genuinely changed fields (`buildEditPatch`):
 *   every provided material field pushes an ACTIVE listing back into review,
 *   so untouched fields must never ride along. `expectedVersion` guards the
 *   write; conflicts re-read the record and ask for a retry.
 * - DRAFT and REJECTED listings additionally offer «ارسال برای بررسی»
 *   (disabled while unsaved changes exist, with an inline confirm).
 * - Gallery operations are immediate (§63–§67) and can move the status
 *   (images are a material change) — the view then switches to a locked
 *   notice while the gallery itself stays editable.
 */

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2, PackageOpen, Save, Send } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { PageHeading } from '@/components/layout/page-heading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ApiError, queryKeys } from '@/lib/api';
import { useAuthBootstrap } from '@/features/auth';
import { FormError, FormNotice, bindFieldErrors } from '@/features/auth/components';
import { fetchCategories, fetchFilterSchema } from '@/features/categories';
import { formatOwnerStatus, formatOwnerStatusHint } from '../../format';
import { listingLifecycle } from '../../my-listings/view-model';
import {
  describeSellError,
  validateAttributeValues,
  validateContactConfig,
  validateDescription,
  validatePriceField,
  validateTitle,
  type ContactConfig,
} from '../../sell';
import type { AttributeValue, OwnerListing, OwnerListingStatus } from '../../types';
import { useOwnerListingEditor, useSaveListingEdit, useSubmitListingEdit } from '../hooks';
import {
  buildCategoryOptions,
  buildEditPatch,
  canMutateListingImages,
  isContactDirty,
  readContactConfig,
  seedEditForm,
  toAttributeValues,
  type EditListingForm,
} from '../model';
import { EditAttributesSection, type EditSchemaStatus } from './edit-attributes-section';
import { EditBasicSection, type EditCategoriesStatus } from './edit-basic-section';
import { EditContactSection } from './edit-contact-section';
import { EditLocationSection } from './edit-location-section';
import { EditPhotosSection } from './edit-photos-section';

const STATUS_BADGE_CLASSES: Record<OwnerListingStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PENDING_REVIEW: 'border border-warning/30 bg-warning/10 text-foreground',
  ACTIVE: 'bg-primary-soft text-primary',
  REJECTED: 'border border-danger/30 bg-danger/5 text-danger',
  SOLD: 'bg-muted text-muted-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

/** Post-save copy per state-machine outcome (§42). */
function describeSaveOutcome(previous: OwnerListingStatus, next: OwnerListingStatus): string {
  if (next === 'PENDING_REVIEW') {
    return 'تغییرات ثبت شد؛ آگهی برای بازبینی دوباره به صف بررسی رفت.';
  }
  if (previous === 'REJECTED' && next === 'DRAFT') {
    return 'تغییرات ذخیره شد؛ آگهی به پیش‌نویس بازگشت و می‌توانید آن را برای بررسی ارسال کنید.';
  }
  return 'تغییرات ذخیره شد.';
}

/** Why the content form is locked for this status (honest, per-state copy). */
function lockedNotice(status: OwnerListingStatus): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'این آگهی در انتظار بررسی است؛ تا پایان بازبینی امکان ویرایش محتوای آن وجود ندارد. گالری تصاویر همچنان قابل تغییر است.';
    case 'SOLD':
      return 'آگهی‌های فروخته‌شده قابل ویرایش نیستند.';
    case 'ARCHIVED':
      return 'آگهی بایگانی‌شده قابل ویرایش نیست؛ برای ویرایش، ابتدا آن را از «آگهی‌های من» بازنشر کنید.';
    default:
      return 'این آگهی در وضعیت فعلی قابل ویرایش نیست.';
  }
}

interface EditListingViewProps {
  listingId: string;
}

export function EditListingView({ listingId }: EditListingViewProps) {
  const router = useRouter();
  const { status: authStatus, user, retry } = useAuthBootstrap();

  // No session → sign-in required first, exactly like My Listings (§31).
  useEffect(() => {
    if (authStatus === 'anonymous') {
      router.replace(`/auth/login?next=${encodeURIComponent(`/sell/${listingId}/edit`)}`);
    }
  }, [authStatus, router, listingId]);

  const listingQuery = useOwnerListingEditor(listingId, authStatus === 'ready');
  const listing = listingQuery.data ?? null;

  // The seed follows the query data; the working form is seeded once per id,
  // so conflict refetches move the diff baseline and keep the user's edits.
  const derived = useMemo(() => (listing === null ? null : seedEditForm(listing)), [listing]);
  const [form, setForm] = useState<EditListingForm | null>(null);
  const seededForRef = useRef<string | null>(null);
  useEffect(() => {
    if (derived !== null && seededForRef.current !== listingId) {
      seededForRef.current = listingId;
      setForm(derived.form);
    }
  }, [derived, listingId]);
  const seed = derived?.seed ?? null;

  const [attempted, setAttempted] = useState(false);
  const [apiFieldErrors, setApiFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  const categoryId = form?.categoryId ?? '';
  const schemaQuery = useQuery({
    queryKey: queryKeys.categories.filterSchema(categoryId.length > 0 ? categoryId : 'none'),
    queryFn: () => (categoryId.length === 0 ? Promise.resolve([]) : fetchFilterSchema(categoryId)),
    enabled: categoryId.length > 0,
    staleTime: 5 * 60_000,
  });
  const fields = useMemo(() => schemaQuery.data ?? [], [schemaQuery.data]);
  const schemaStatus: EditSchemaStatus = schemaQuery.isPending
    ? 'pending'
    : schemaQuery.isError
      ? 'error'
      : 'ready';

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60_000,
  });
  const categoryOptions = useMemo(
    () => buildCategoryOptions(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const categoriesStatus: EditCategoriesStatus = categoriesQuery.isPending
    ? 'pending'
    : categoriesQuery.isError
      ? 'error'
      : 'ready';

  const saveEdit = useSaveListingEdit();
  const submitEdit = useSubmitListingEdit();

  // Diff against the seed — null while the schema is loading (a partial field
  // list would mis-prune the attributes and could wipe stored values).
  const pendingPatch = useMemo(
    () =>
      form !== null && seed !== null && schemaStatus === 'ready'
        ? buildEditPatch(form, seed, fields)
        : null,
    [form, seed, fields, schemaStatus],
  );
  const isDirty = pendingPatch !== null;
  const contactDirty = form !== null && seed !== null && isContactDirty(form.contact, seed.contact);

  function collectErrors(): Record<string, string> {
    if (form === null) return {};
    const errors: Record<string, string> = {};
    const title = validateTitle(form.title);
    if (title !== null) errors.title = title;
    const description = validateDescription(form.description);
    if (description !== null) errors.description = description;
    if (form.condition === null) errors.condition = 'وضعیت کالا را انتخاب کنید.';
    const price = validatePriceField(form.price, form.pricingType);
    if (price !== null) errors.price = price;
    if (form.categoryId.length === 0) errors.categoryId = 'دستهٔ آگهی را انتخاب کنید.';
    if (form.provinceId.length === 0) errors.provinceId = 'ولایت را انتخاب کنید.';
    else if (form.cityId.length === 0) errors.cityId = 'شهر را انتخاب کنید.';
    if (schemaStatus === 'ready') {
      Object.assign(errors, validateAttributeValues(form.attributes, fields));
    }
    if (contactDirty) {
      Object.assign(errors, validateContactConfig(form.contact));
    }
    return errors;
  }

  // Server field details win over client messages until the next submit;
  // dotted keys (`attributes.color`, `contactMethods.PHONE`) also bind the
  // bare field key where a control reads it directly.
  const mergedErrors = (() => {
    const merged: Record<string, string> = attempted ? collectErrors() : {};
    for (const [key, value] of Object.entries(apiFieldErrors)) {
      merged[key] = value;
      const dot = key.indexOf('.');
      if (dot > 0) {
        const bare = key.slice(dot + 1);
        if (merged[bare] === undefined) merged[bare] = value;
      }
    }
    return merged;
  })();

  function changeForm(patch: Partial<EditListingForm>) {
    setForm((current) => (current === null ? current : { ...current, ...patch }));
    setSuccessMessage(null);
  }

  function changeAttribute(key: string, value: AttributeValue | undefined) {
    setForm((current) => {
      if (current === null) return current;
      const attributes = { ...current.attributes };
      if (value === undefined) delete attributes[key];
      else attributes[key] = value;
      return { ...current, attributes };
    });
    setSuccessMessage(null);
  }

  function changeContact(patch: Partial<ContactConfig>) {
    setForm((current) =>
      current === null ? current : { ...current, contact: { ...current.contact, ...patch } },
    );
    setSuccessMessage(null);
  }

  function handleSave() {
    if (form === null || seed === null || saveEdit.isPending || submitEdit.isPending) return;
    setAttempted(true);
    setApiFieldErrors({});
    setFormError(null);
    setSuccessMessage(null);
    if (schemaStatus !== 'ready') {
      setFormError('ویژگی‌های دسته در حال بارگیری است؛ چند لحظه بعد دوباره تلاش کنید.');
      return;
    }
    if (Object.keys(collectErrors()).length > 0) return;
    if (pendingPatch === null) {
      setFormError('تغییری برای ذخیره وجود ندارد.');
      return;
    }
    const sent = pendingPatch;
    const previousStatus = seed.status;
    saveEdit.mutate(
      { listingId, payload: sent },
      {
        onSuccess: (saved) => {
          setAttempted(false);
          setApiFieldErrors({});
          setFormError(null);
          setSuccessMessage(describeSaveOutcome(previousStatus, saved.status));
          // Re-align normalization-sensitive inputs with server truth so the
          // next diff starts from a clean baseline (trimmed price, normalized
          // phone overrides, canonical telegram handle).
          setForm((current) => {
            if (current === null) return current;
            const next: EditListingForm = { ...current };
            if (sent.contactMethods !== undefined) {
              next.contact = readContactConfig(saved) ?? current.contact;
            }
            if (sent.price !== undefined && saved.pricingType === 'PAID' && saved.price !== null) {
              next.price = String(saved.price);
            }
            if (sent.attributes !== undefined) {
              next.attributes = toAttributeValues(saved.attributes);
            }
            return next;
          });
        },
        onError: (error) => {
          setApiFieldErrors(bindFieldErrors(error));
          setFormError(describeSellError(error));
        },
      },
    );
  }

  function handleSubmitToReview() {
    if (seed === null || submitEdit.isPending || saveEdit.isPending) return;
    setConfirmingSubmit(false);
    setFormError(null);
    setApiFieldErrors({});
    setSuccessMessage(null);
    submitEdit.mutate(
      { listingId, expectedVersion: seed.version },
      {
        onSuccess: (submitted) => {
          setSuccessMessage(
            submitted.status === 'ACTIVE'
              ? 'آگهی شما منتشر شد.'
              : submitted.status === 'PENDING_REVIEW'
                ? 'آگهی شما برای بررسی ارسال شد.'
                : 'وضعیت آگهی به‌روزرسانی شد.',
          );
        },
        onError: (error) => setFormError(describeSellError(error)),
      },
    );
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    handleSave();
  }

  if (authStatus === 'checking') {
    return <CenterLoader>در حال بررسی نشست…</CenterLoader>;
  }

  if (authStatus === 'unreachable') {
    return (
      <ErrorState
        title="ارتباط با سرور برقرار نشد"
        description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        onRetry={retry}
      />
    );
  }

  if (authStatus === 'anonymous') {
    // The effect above is redirecting to login.
    return <CenterLoader>در حال انتقال به صفحهٔ ورود…</CenterLoader>;
  }

  if (listingQuery.isPending || (listingQuery.isSuccess && form === null)) {
    return (
      <div className="space-y-6" aria-hidden>
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (listingQuery.isError) {
    const notFound =
      listingQuery.error instanceof ApiError && listingQuery.error.code === 'LISTING_NOT_FOUND';
    if (notFound) {
      return (
        <EmptyState
          icon={PackageOpen}
          title="آگهی موردنظر پیدا نشد"
          description="ممکن است حذف شده باشد یا نشانی صفحه ناقص باشد."
          action={
            <Button asChild variant="accent">
              <Link href="/my-listings">آگهی‌های من</Link>
            </Button>
          }
        />
      );
    }
    return (
      <ErrorState
        requestId={
          listingQuery.error instanceof ApiError ? listingQuery.error.requestId : undefined
        }
        description="بارگیری اطلاعات آگهی ناموفق بود. دوباره تلاش کنید."
        onRetry={() => void listingQuery.refetch()}
      />
    );
  }

  if (listing === null || seed === null || form === null) return null;

  const statusHint = formatOwnerStatusHint(seed.status);
  const contentEditable = listingLifecycle(seed.status).canEdit;
  const anyPending = saveEdit.isPending || submitEdit.isPending;
  const canOfferSubmit = seed.status === 'DRAFT' || seed.status === 'REJECTED';

  return (
    <div className="space-y-6">
      <PageHeading
        title="ویرایش آگهی"
        description="فقط فیلدهای تغییریافته ذخیره می‌شوند؛ تغییرات مهم، آگهی فعال را به بازبینی می‌فرستند."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link href="/my-listings">
              <ChevronRight aria-hidden />
              آگهی‌های من
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={seed.status} />
        {statusHint ? <p className="text-meta text-muted-foreground">{statusHint}</p> : null}
      </div>

      {seed.status === 'REJECTED' ? <RejectionNotice listing={listing} /> : null}

      {successMessage ? <SuccessBanner>{successMessage}</SuccessBanner> : null}

      {!contentEditable ? (
        <div className="space-y-6">
          <FormNotice>{lockedNotice(seed.status)}</FormNotice>
          {formError ? <FormError>{formError}</FormError> : null}
          {canMutateListingImages(seed.status) ? (
            <EditPhotosSection
              listingId={listing.id}
              images={listing.images}
              status={seed.status}
            />
          ) : null}
          <Button asChild variant="outline">
            <Link href="/my-listings">
              <ChevronRight aria-hidden />
              بازگشت به آگهی‌های من
            </Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-8" noValidate>
          <SectionDivider>
            <EditBasicSection
              form={form}
              errors={mergedErrors}
              categoryOptions={categoryOptions}
              currentCategoryLabel={seed.categoryName}
              categoriesStatus={categoriesStatus}
              onRetryCategories={() => void categoriesQuery.refetch()}
              onChange={changeForm}
            />
          </SectionDivider>

          <SectionDivider>
            <EditAttributesSection
              fields={fields}
              values={form.attributes}
              errors={mergedErrors}
              status={schemaStatus}
              requestId={
                schemaQuery.error instanceof ApiError ? schemaQuery.error.requestId : undefined
              }
              onRetry={() => void schemaQuery.refetch()}
              onChange={changeAttribute}
            />
          </SectionDivider>

          <SectionDivider>
            <EditLocationSection
              provinceId={form.provinceId}
              cityId={form.cityId}
              provinceLabel={listing.province.name}
              cityLabel={listing.city.name}
              errors={mergedErrors}
              onChange={changeForm}
            />
          </SectionDivider>

          <SectionDivider>
            <EditContactSection
              contact={form.contact}
              seedContact={seed.contact}
              dirty={contactDirty}
              errors={mergedErrors}
              phoneVerified={user !== null && user.phoneVerified}
              onChange={changeContact}
            />
          </SectionDivider>

          <SectionDivider>
            <EditPhotosSection
              listingId={listing.id}
              images={listing.images}
              status={seed.status}
            />
          </SectionDivider>

          {formError ? <FormError>{formError}</FormError> : null}

          <div className="sticky bottom-0 z-10 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                {canOfferSubmit ? (
                  confirmingSubmit ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-ui text-foreground">آگهی برای بررسی ارسال شود؟</p>
                      <Button
                        type="button"
                        variant="accent"
                        disabled={anyPending}
                        onClick={handleSubmitToReview}
                      >
                        {submitEdit.isPending ? (
                          <Loader2 aria-hidden className="animate-spin" />
                        ) : (
                          <Send aria-hidden />
                        )}
                        تأیید و ارسال
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={anyPending}
                        onClick={() => setConfirmingSubmit(false)}
                      >
                        انصراف
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={anyPending || isDirty}
                        onClick={() => setConfirmingSubmit(true)}
                      >
                        <Send aria-hidden />
                        ارسال برای بررسی
                      </Button>
                      {isDirty ? (
                        <p className="text-meta text-muted-foreground">
                          برای ارسال، ابتدا تغییرات را ذخیره کنید.
                        </p>
                      ) : null}
                    </div>
                  )
                ) : schemaStatus === 'pending' ? (
                  <p className="text-meta text-muted-foreground">در حال بارگیری ویژگی‌های دسته…</p>
                ) : schemaStatus === 'error' ? (
                  <p className="text-meta text-danger">
                    بارگیری ویژگی‌ها ناموفق بود؛ از بخش «ویژگی‌های کالا» دوباره تلاش کنید.
                  </p>
                ) : isDirty ? (
                  <p className="text-meta text-muted-foreground">تغییرات ذخیره‌نشده دارید.</p>
                ) : (
                  <p className="text-meta text-muted-foreground">همهٔ تغییرات ذخیره شده است.</p>
                )}
              </div>

              <Button type="submit" disabled={anyPending || !isDirty || schemaStatus !== 'ready'}>
                {saveEdit.isPending ? (
                  <>
                    <Loader2 aria-hidden className="animate-spin" />
                    در حال ذخیره…
                  </>
                ) : (
                  <>
                    <Save aria-hidden />
                    ذخیرهٔ تغییرات
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

/** Separator wrapper so the edit sections read as distinct blocks. */
function SectionDivider({ children }: { children: ReactNode }) {
  return <div className="border-t border-border pt-6">{children}</div>;
}

function StatusBadge({ status }: { status: OwnerListingStatus }) {
  return (
    <span
      className={cn(
        'rounded-control px-2 py-0.5 text-caption font-medium',
        STATUS_BADGE_CLASSES[status] ?? 'bg-muted text-muted-foreground',
      )}
    >
      {formatOwnerStatus(status)}
    </span>
  );
}

/** Why the last submit was rejected — shown above the editor for REJECTED. */
function RejectionNotice({ listing }: { listing: OwnerListing }) {
  const reason = listing.rejectedReason ?? listing.rejectedNote;
  return (
    <div role="alert" className="space-y-1 rounded-card border border-danger/30 bg-danger/5 p-4">
      <p className="text-ui font-medium text-danger">این آگهی رد شده است.</p>
      {reason ? <p className="text-ui leading-6 text-foreground">{reason}</p> : null}
      <p className="text-meta text-muted-foreground">
        پس از اصلاح موارد، تغییرات را ذخیره کنید و آگهی را برای بررسی دوباره ارسال کنید.
      </p>
    </div>
  );
}

function SuccessBanner({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-control border border-primary/30 bg-primary-soft px-3 py-2 text-ui text-foreground"
    >
      {children}
    </div>
  );
}

function CenterLoader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {children}
    </div>
  );
}
