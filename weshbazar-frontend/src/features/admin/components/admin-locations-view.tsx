'use client';
/**
 * Admin locations view — province + city CRUD with two-panel layout.
 *
 * Session-gated: guests → login, USER → access-denied, 403 → login.
 * Requires LOCATION_MANAGE permission (ADMIN only).
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Plus, Pencil, Trash2, Map } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthBootstrap } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isForbiddenError, isSessionLostError } from '../errors';
import {
  useAdminProvinces,
  useAdminCities,
  useCreateProvince,
  useUpdateProvince,
  useDeleteProvince,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from '../hooks';
import { AdminAccessDenied } from './admin-access-denied';
import type { AdminProvinceItem, AdminCityItem } from '../types';
const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/locations')}`;
interface LocationFormData {
  code: string;
  nameFa: string;
  nameEn: string;
  slug: string;
}
function provinceToFormData(p: AdminProvinceItem): LocationFormData {
  return {
    code: p.code,
    nameFa: p.name,
    nameEn: p.translations.find((t) => t.locale === 'en')?.name ?? '',
    slug: p.slug,
  };
}
function cityToFormData(c: AdminCityItem): LocationFormData {
  return {
    code: '',
    nameFa: c.name,
    nameEn: c.translations.find((t) => t.locale === 'en')?.name ?? '',
    slug: c.slug,
  };
}
export function AdminLocationsView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();
  useEffect(() => {
    if (status === 'anonymous') router.replace(LOGIN_HREF);
  }, [status, router]);
  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);
  const enabled = status === 'ready' && user !== null && user.role === 'ADMIN';
  const provinces = useAdminProvinces(enabled);
  const denied = isForbiddenError(provinces.error);
  const sessionLost = isSessionLostError(provinces.error);
  // Selected province → load its cities
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cities = useAdminCities(selectedId, enabled && selectedId !== null);
  // Mutations
  const createProvinceM = useCreateProvince();
  const updateProvinceM = useUpdateProvince();
  const deleteProvinceM = useDeleteProvince();
  const createCityM = useCreateCity();
  const updateCityM = useUpdateCity();
  const deleteCityM = useDeleteCity();
  // Province form
  const [showProvinceAdd, setShowProvinceAdd] = useState(false);
  const [editingProvinceId, setEditingProvinceId] = useState<string | null>(null);
  const [provinceForm, setProvinceForm] = useState<LocationFormData>({
    code: '',
    nameFa: '',
    nameEn: '',
    slug: '',
  });
  // City form
  const [showCityAdd, setShowCityAdd] = useState(false);
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [cityForm, setCityForm] = useState<LocationFormData>({
    code: '',
    nameFa: '',
    nameEn: '',
    slug: '',
  });
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<
    { type: 'province'; id: string } | { type: 'city'; id: string } | null
  >(null);
  useEffect(() => {
    if (sessionLost) gotoLogin();
  }, [sessionLost, gotoLogin]);
  // Reset forms on success
  useEffect(() => {
    if (createProvinceM.isSuccess) {
      setShowProvinceAdd(false);
      resetProvinceForm();
    }
  }, [createProvinceM.isSuccess]);
  useEffect(() => {
    if (updateProvinceM.isSuccess) {
      setEditingProvinceId(null);
      resetProvinceForm();
    }
  }, [updateProvinceM.isSuccess]);
  useEffect(() => {
    if (createCityM.isSuccess) {
      setShowCityAdd(false);
      resetCityForm();
    }
  }, [createCityM.isSuccess]);
  useEffect(() => {
    if (updateCityM.isSuccess) {
      setEditingCityId(null);
      resetCityForm();
    }
  }, [updateCityM.isSuccess]);
  function resetProvinceForm() {
    setProvinceForm({ code: '', nameFa: '', nameEn: '', slug: '' });
  }
  function resetCityForm() {
    setCityForm({ code: '', nameFa: '', nameEn: '', slug: '' });
  }
  const isBusy =
    createProvinceM.isPending ||
    updateProvinceM.isPending ||
    deleteProvinceM.isPending ||
    createCityM.isPending ||
    updateCityM.isPending ||
    deleteCityM.isPending;
  // Province handlers
  function handleProvinceCreate() {
    if (!provinceForm.code.trim() || !provinceForm.nameFa.trim()) return;
    createProvinceM.mutate({
      code: provinceForm.code.trim(),
      translations: [
        { locale: 'fa', name: provinceForm.nameFa.trim() },
        { locale: 'en', name: provinceForm.nameEn.trim() || provinceForm.nameFa.trim() },
      ],
      slug: provinceForm.slug.trim() || undefined,
    });
  }
  function handleProvinceUpdate(id: string) {
    if (!provinceForm.nameFa.trim()) return;
    updateProvinceM.mutate({
      id,
      payload: {
        code: provinceForm.code.trim() || undefined,
        slug: provinceForm.slug.trim() || undefined,
        translations: [
          { locale: 'fa', name: provinceForm.nameFa.trim() },
          { locale: 'en', name: provinceForm.nameEn.trim() || provinceForm.nameFa.trim() },
        ],
      },
    });
  }
  // City handlers
  function handleCityCreate() {
    if (!selectedId || !cityForm.nameFa.trim()) return;
    createCityM.mutate({
      provinceId: selectedId,
      payload: {
        translations: [
          { locale: 'fa', name: cityForm.nameFa.trim() },
          { locale: 'en', name: cityForm.nameEn.trim() || cityForm.nameFa.trim() },
        ],
        slug: cityForm.slug.trim() || undefined,
      },
    });
  }
  function handleCityUpdate(id: string) {
    if (!cityForm.nameFa.trim()) return;
    updateCityM.mutate({
      id,
      payload: {
        slug: cityForm.slug.trim() || undefined,
        translations: [
          { locale: 'fa', name: cityForm.nameFa.trim() },
          { locale: 'en', name: cityForm.nameEn.trim() || cityForm.nameFa.trim() },
        ],
      },
    });
  }
  // --- Render ---------------------------------------------------------------
  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable')
    return (
      <ErrorState
        title="ارتباط با سرور برقرار نشد"
        description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید."
        onRetry={retry}
      />
    );
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحه ورود…" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;
  if (denied) return <AdminAccessDenied />;
  const provinceItems = provinces.data ?? [];
  return (
    <div className={cn('space-y-6', className)}>
      {/* Announce CRUD outcomes for assistive technology */}
      <div aria-live="polite" className="sr-only">
        {createProvinceM.isSuccess ? 'ولایت با موفقیت ایجاد شد.' :
         updateProvinceM.isSuccess ? 'ولایت با موفقیت ویرایش شد.' :
         deleteProvinceM.isSuccess ? 'ولایت با موفقیت حذف شد.' :
         createCityM.isSuccess ? 'شهر با موفقیت ایجاد شد.' :
         updateCityM.isSuccess ? 'شهر با موفقیت ویرایش شد.' :
         deleteCityM.isSuccess ? 'شهر با موفقیت حذف شد.' :
         ''}
      </div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-section font-bold text-foreground">مکان‌ها</h2>
          <p className="mt-1 text-meta text-muted-foreground">مدیریت ولایت ‌ها و شهرها</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        {/* Provinces Panel */}
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-ui font-semibold text-foreground">ولایت ‌ها</h3>
            <Button
              size="sm"
              variant="outline"
              disabled={isBusy}
              onClick={() => {
                setShowProvinceAdd(!showProvinceAdd);
                setEditingProvinceId(null);
                resetProvinceForm();
              }}
            >
              <Plus className="size-3.5" /> افزودن
            </Button>
          </div>
          {showProvinceAdd && (
            <LocationForm
              form={provinceForm}
              setForm={setProvinceForm}
              busy={isBusy}
              onSubmit={handleProvinceCreate}
              onCancel={() => {
                setShowProvinceAdd(false);
                resetProvinceForm();
              }}
              showCode
              submitLabel="ایجاد ولایت "
            />
          )}
          {provinces.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : provinces.isError ? (
            <ErrorState
              requestId={
                provinces.error instanceof ApiError ? provinces.error.requestId : undefined
              }
              title="دریافت ولایت ‌ها ناموفق بود"
              onRetry={() => void provinces.refetch()}
            />
          ) : provinceItems.length === 0 ? (
            <EmptyState icon={MapPin} title="هیچ ولایت ی ثبت نشده" />
          ) : (
            <ul className="space-y-1">
              {provinceItems.map((p) => (
                <li key={p.id}>
                  {editingProvinceId === p.id ? (
                    <LocationForm
                      form={provinceForm}
                      setForm={setProvinceForm}
                      busy={isBusy}
                      onSubmit={() => handleProvinceUpdate(p.id)}
                      onCancel={() => {
                        setEditingProvinceId(null);
                        resetProvinceForm();
                      }}
                      showCode
                      submitLabel="ذخیره"
                    />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedId(p.id);
                        setShowCityAdd(false);
                        setEditingCityId(null);
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedId(p.id); setShowCityAdd(false); setEditingCityId(null); } }}
                      className={cn(
                        'flex w-full items-center justify-between rounded-control px-3 py-2 text-right transition-colors cursor-pointer',
                        selectedId === p.id
                          ? 'bg-primary-soft text-primary'
                          : 'hover:bg-primary-soft/50',
                      )}
                    >
                      <div className="min-w-0">
                        <span className="text-ui font-medium">{p.name}</span>
                        <span className="ml-2 text-caption text-muted-foreground">{p.code}</span>
                        <span className="ml-1 text-caption text-muted-foreground">
                          ({p.cityCount} شهر)
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProvinceId(p.id);
                            setProvinceForm(provinceToFormData(p));
                            setShowProvinceAdd(false);
                          }}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                          title="ویرایش"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({ type: 'province', id: p.id });
                          }}
                          className="rounded p-1 text-danger hover:bg-danger/10"
                          title="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Cities Panel */}
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-ui font-semibold text-foreground">
              {selectedId ? 'شهرها' : 'یک ولایت انتخاب کنید'}
            </h3>
            {selectedId && (
              <Button
                size="sm"
                variant="outline"
                disabled={isBusy}
                onClick={() => {
                  setShowCityAdd(!showCityAdd);
                  setEditingCityId(null);
                  resetCityForm();
                }}
              >
                <Plus className="size-3.5" /> افزودن
              </Button>
            )}
          </div>
          {!selectedId ? (
            <EmptyState
              icon={Map}
              title="ولایتی انتخاب نشده"
              description="برای مشاهدهٔ شهرها یک ولایت رااز سمت راست انتخاب کنید."
            />
          ) : showCityAdd ? (
            <LocationForm
              form={cityForm}
              setForm={setCityForm}
              busy={isBusy}
              onSubmit={handleCityCreate}
              onCancel={() => {
                setShowCityAdd(false);
                resetCityForm();
              }}
              submitLabel="ایجاد شهر"
            />
          ) : cities.isPending ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : cities.isError ? (
            <ErrorState
              requestId={cities.error instanceof ApiError ? cities.error.requestId : undefined}
              title="دریافت شهرها ناموفق بود"
              onRetry={() => void cities.refetch()}
            />
          ) : (cities.data ?? []).length === 0 ? (
            <EmptyState icon={MapPin} title="هیچ شهری ثبت نشده" />
          ) : (
            <ul className="space-y-1">
              {(cities.data ?? []).map((c) => (
                <li key={c.id}>
                  {editingCityId === c.id ? (
                    <LocationForm
                      form={cityForm}
                      setForm={setCityForm}
                      busy={isBusy}
                      onSubmit={() => handleCityUpdate(c.id)}
                      onCancel={() => {
                        setEditingCityId(null);
                        resetCityForm();
                      }}
                      submitLabel="ذخیره"
                    />
                  ) : (
                    <div className="flex items-center justify-between rounded-control px-3 py-2">
                      <span className="text-ui">{c.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setEditingCityId(c.id);
                            setCityForm(cityToFormData(c));
                          }}
                          className="rounded p-1 text-muted-foreground hover:text-foreground"
                          title="ویرایش"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => setDeleteTarget({ type: 'city', id: c.id })}
                          className="rounded p-1 text-danger hover:bg-danger/10"
                          title="حذف"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'province') deleteProvinceM.mutate(deleteTarget.id);
          else deleteCityM.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        title={deleteTarget?.type === 'province' ? 'حذف ولایت ؟' : 'حذف شهر؟'}
        description={
          deleteTarget?.type === 'province'
            ? 'در صورت وجود شهر یا آگهی در این ولایت ، حذف مسدود خواهد شد.'
            : 'در صورت وجود آگهی در این شهر، حذف مسدود خواهد شد.'
        }
        confirmLabel="حذف"
        busy={deleteProvinceM.isPending || deleteCityM.isPending}
      />
    </div>
  );
}
// --- Inline form ------------------------------------------------------------
function LocationForm({
  form,
  setForm,
  busy,
  onSubmit,
  onCancel,
  submitLabel,
  showCode = false,
}: {
  form: LocationFormData;
  setForm: (f: LocationFormData) => void;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  showCode?: boolean;
}) {
  return (
    <div className="mb-2 space-y-2 rounded-control border border-border p-3">
      {showCode && (
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="کد ولایت (مثلاً AF-KAB)"
          className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          dir="ltr"
        />
      )}
      <input
        type="text"
        value={form.nameFa}
        onChange={(e) => setForm({ ...form, nameFa: e.target.value })}
        placeholder="نام فارسی"
        className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <input
        type="text"
        value={form.nameEn}
        onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
        placeholder="نام انگلیسی (اختیاری)"
        className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        dir="ltr"
      />
      <input
        type="text"
        value={form.slug}
        onChange={(e) => setForm({ ...form, slug: e.target.value })}
        placeholder="اسلاگ (اختیاری، خودکار)"
        className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        dir="ltr"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!form.nameFa.trim() || busy} onClick={onSubmit}>
          {busy ? 'در حال انجام…' : submitLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          انصراف
        </Button>
      </div>
    </div>
  );
}
// --- Helpers ----------------------------------------------------------------
function AdminSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  );
}
