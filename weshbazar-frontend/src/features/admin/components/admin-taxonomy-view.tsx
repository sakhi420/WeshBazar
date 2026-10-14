'use client';

/**
 * Admin taxonomy view (§47) — category CRUD + attribute/option management.
 *
 * Session-gated: guests → login, USER → access-denied, 403 → login.
 * Requires CATEGORY_MANAGE permission (ADMIN only).
 *
 * Layout: category list on the left, selected-category attributes + options
 * on the right. Destructive operations use ConfirmDialog.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FolderTree,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
} from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuthBootstrap } from '@/features/auth';
import { cn } from '@/lib/utils';
import { isForbiddenError, isSessionLostError } from '../errors';
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useAdminAttributes,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateOption,
  useUpdateOption,
  useDeleteOption,
} from '../hooks';
import { AdminAccessDenied } from './admin-access-denied';
import type { AdminCategoryItem, AdminAttributeItem, AdminAttributeOptionItem } from '../types';

// --- Constants ---------------------------------------------------------------

const ATTRIBUTE_TYPES = [
  { key: 'TEXT', label: 'متن' },
  { key: 'NUMBER', label: 'عدد' },
  { key: 'SELECT', label: 'انتخابی' },
  { key: 'MULTI_SELECT', label: 'چندانتخابی' },
  { key: 'BOOLEAN', label: 'بله/خیر' },
] as const;

const ATTR_TYPE_LABELS: Record<string, string> = {
  TEXT: 'متن',
  NUMBER: 'عدد',
  SELECT: 'انتخابی',
  MULTI_SELECT: 'چندانتخابی',
  BOOLEAN: 'بله/خیر',
};

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/taxonomy')}`;
// --- Category form data ------------------------------------------------------

interface CategoryFormData {
  nameFa: string;
  nameEn: string;
  slug: string;
  parentId: string | null;
}

function categoryToFormData(c: AdminCategoryItem): CategoryFormData {
  return { nameFa: c.name, nameEn: '', slug: c.slug, parentId: c.parentId };
}

// --- Attribute form data -----------------------------------------------------

interface AttributeFormData {
  key: string;
  label: string;
  type: string;
  required: boolean;
}

function attributeToFormData(a: AdminAttributeItem): AttributeFormData {
  return { key: a.key, label: a.label, type: a.type, required: a.required };
}

// --- Option form data --------------------------------------------------------

interface OptionFormData {
  value: string;
  label: string;
}

function optionToFormData(o: AdminAttributeOptionItem): OptionFormData {
  return { value: o.value, label: o.label };
}

// --- Main component ----------------------------------------------------------

export function AdminTaxonomyView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();

  // Session gate
  useEffect(() => {
    if (status === 'anonymous') router.replace(LOGIN_HREF);
  }, [status, router]);
  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  const enabled = status === 'ready' && user !== null && user.role === 'ADMIN';
  const categories = useAdminCategories(enabled);
  const denied = isForbiddenError(categories.error);
  const sessionLost = isSessionLostError(categories.error);

  // Selected category → load its attributes
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const attributes = useAdminAttributes(selectedCategoryId, enabled && selectedCategoryId !== null);

  // Selected attribute → show options panel (only for SELECT / MULTI_SELECT)
  const [selectedAttribute, setSelectedAttribute] = useState<AdminAttributeItem | null>(null);

  // Mutations — categories
  const createCategoryM = useCreateCategory();
  const updateCategoryM = useUpdateCategory();
  const deleteCategoryM = useDeleteCategory();

  // Mutations — attributes
  const createAttributeM = useCreateAttribute();
  const updateAttributeM = useUpdateAttribute();
  const deleteAttributeM = useDeleteAttribute();

  // Mutations — options
  const createOptionM = useCreateOption();
  const updateOptionM = useUpdateOption();
  const deleteOptionM = useDeleteOption();

  // --- Category form state ---------------------------------------------------
  const [showCategoryAdd, setShowCategoryAdd] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    nameFa: '',
    nameEn: '',
    slug: '',
    parentId: null,
  });

  // --- Attribute form state --------------------------------------------------
  const [showAttributeAdd, setShowAttributeAdd] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
  const [attributeForm, setAttributeForm] = useState<AttributeFormData>({
    key: '',
    label: '',
    type: 'TEXT',
    required: false,
  });

  // --- Option form state -----------------------------------------------------
  const [showOptionAdd, setShowOptionAdd] = useState(false);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState<OptionFormData>({ value: '', label: '' });

  // --- Delete confirmation state ----------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: 'category'; id: string; label: string }
    | { kind: 'attribute'; id: string; label: string }
    | { kind: 'option'; id: string; label: string }
    | null
  >(null);

  // Redirect on session lost
  useEffect(() => {
    if (sessionLost) gotoLogin();
  }, [sessionLost, gotoLogin]);

  // Reset attribute/option selection when category changes
  useEffect(() => {
    setSelectedAttribute(null);
  }, [selectedCategoryId]);
  // --- Helpers for form open/reset -------------------------------------------

  const openCategoryAdd = useCallback(() => {
    setShowCategoryAdd(true);
    setEditingCategoryId(null);
    setCategoryForm({ nameFa: '', nameEn: '', slug: '', parentId: null });
  }, []);

  const openCategoryEdit = useCallback((c: AdminCategoryItem) => {
    setShowCategoryAdd(false);
    setEditingCategoryId(c.id);
    setCategoryForm(categoryToFormData(c));
  }, []);

  const cancelCategoryForm = useCallback(() => {
    setShowCategoryAdd(false);
    setEditingCategoryId(null);
    setCategoryForm({ nameFa: '', nameEn: '', slug: '', parentId: null });
  }, []);

  const openAttributeAdd = useCallback(() => {
    setShowAttributeAdd(true);
    setEditingAttributeId(null);
    setAttributeForm({ key: '', label: '', type: 'TEXT', required: false });
  }, []);

  const openAttributeEdit = useCallback((a: AdminAttributeItem) => {
    setShowAttributeAdd(false);
    setEditingAttributeId(a.id);
    setAttributeForm(attributeToFormData(a));
  }, []);

  const cancelAttributeForm = useCallback(() => {
    setShowAttributeAdd(false);
    setEditingAttributeId(null);
    setAttributeForm({ key: '', label: '', type: 'TEXT', required: false });
  }, []);

  const openOptionAdd = useCallback(() => {
    setShowOptionAdd(true);
    setEditingOptionId(null);
    setOptionForm({ value: '', label: '' });
  }, []);

  const openOptionEdit = useCallback((o: AdminAttributeOptionItem) => {
    setShowOptionAdd(false);
    setEditingOptionId(o.id);
    setOptionForm(optionToFormData(o));
  }, []);

  const cancelOptionForm = useCallback(() => {
    setShowOptionAdd(false);
    setEditingOptionId(null);
    setOptionForm({ value: '', label: '' });
  }, []);

  // --- Submit handlers -------------------------------------------------------

  const submitCategory = useCallback(() => {
    const payload = {
      translations: [
        { locale: 'fa', name: categoryForm.nameFa.trim() },
        ...(categoryForm.nameEn.trim()
          ? [{ locale: 'en' as const, name: categoryForm.nameEn.trim() }]
          : []),
      ],
      parentId: categoryForm.parentId || undefined,
      slug: categoryForm.slug.trim() || undefined,
    };
    if (editingCategoryId) {
      updateCategoryM.mutate({ id: editingCategoryId, payload });
    } else {
      createCategoryM.mutate(payload);
    }
  }, [categoryForm, editingCategoryId, createCategoryM, updateCategoryM]);

  const submitAttribute = useCallback(() => {
    if (!selectedCategoryId) return;
    const payload = {
      key: attributeForm.key.trim(),
      label: attributeForm.label.trim(),
      type: attributeForm.type,
      required: attributeForm.required,
    };
    if (editingAttributeId) {
      updateAttributeM.mutate({ id: editingAttributeId, payload });
    } else {
      createAttributeM.mutate({ categoryId: selectedCategoryId, payload });
    }
  }, [selectedCategoryId, attributeForm, editingAttributeId, createAttributeM, updateAttributeM]);

  const submitOption = useCallback(() => {
    if (!selectedAttribute) return;
    const payload = { value: optionForm.value.trim(), label: optionForm.label.trim() };
    if (editingOptionId) {
      updateOptionM.mutate({ id: editingOptionId, payload });
    } else {
      createOptionM.mutate({ attributeId: selectedAttribute.id, payload });
    }
  }, [selectedAttribute, optionForm, editingOptionId, createOptionM, updateOptionM]);

  // --- Reset forms on mutation success ---------------------------------------

  useEffect(() => {
    if (createCategoryM.isSuccess || updateCategoryM.isSuccess) cancelCategoryForm();
  }, [createCategoryM.isSuccess, updateCategoryM.isSuccess, cancelCategoryForm]);

  useEffect(() => {
    if (createAttributeM.isSuccess || updateAttributeM.isSuccess) cancelAttributeForm();
  }, [createAttributeM.isSuccess, updateAttributeM.isSuccess, cancelAttributeForm]);

  useEffect(() => {
    if (createOptionM.isSuccess || updateOptionM.isSuccess) cancelOptionForm();
  }, [createOptionM.isSuccess, updateOptionM.isSuccess, cancelOptionForm]);
  // --- Render: session states ------------------------------------------------

  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable')
    return <ErrorState title="ارتباط با سرور برقرار نشد" onRetry={retry} />;
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  if (denied || (user && user.role === 'USER')) return <AdminAccessDenied />;

  // --- Derived data ----------------------------------------------------------

  const categoryList = categories.data ?? [];
  const attributeList = attributes.data ?? [];

  const parentCategoryOptions = categoryList
    .filter((c) => c.id !== editingCategoryId && c.id !== selectedCategoryId)
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <div className={cn('space-y-4', className)}>
      {/* Announce CRUD outcomes for assistive technology */}
      <div aria-live="polite" className="sr-only">
        {createCategoryM.isSuccess ? 'دسته‌بندی با موفقیت ایجاد شد.' :
         updateCategoryM.isSuccess ? 'دسته‌بندی با موفقیت ویرایش شد.' :
         deleteCategoryM.isSuccess ? 'دسته‌بندی با موفقیت حذف شد.' :
         createAttributeM.isSuccess ? 'ویژگی با موفقیت ایجاد شد.' :
         updateAttributeM.isSuccess ? 'ویژگی با موفقیت ویرایش شد.' :
         deleteAttributeM.isSuccess ? 'ویژگی با موفقیت حذف شد.' :
         createOptionM.isSuccess ? 'گزینه با موفقیت ایجاد شد.' :
         updateOptionM.isSuccess ? 'گزینه با موفقیت ویرایش شد.' :
         deleteOptionM.isSuccess ? 'گزینه با موفقیت حذف شد.' :
         ''}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {/* ---- Left panel: Categories ---------------------------------------- */}
        <div className="space-y-3 rounded-card border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-heading font-semibold text-foreground">
              <FolderTree className="size-5" aria-hidden />
              دسته‌بندی‌ها
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={openCategoryAdd}
              disabled={showCategoryAdd || editingCategoryId !== null}
            >
              <Plus className="size-4" aria-hidden /> افزودن
            </Button>
          </div>
          {/* Category inline form */}
          {(showCategoryAdd || editingCategoryId !== null) && (
            <div className="space-y-2 rounded-control border border-border p-3">
              <input
                type="text"
                value={categoryForm.nameFa}
                onChange={(e) => setCategoryForm((f) => ({ ...f, nameFa: e.target.value }))}
                placeholder="نام فارسی *"
                className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <input
                type="text"
                value={categoryForm.nameEn}
                onChange={(e) => setCategoryForm((f) => ({ ...f, nameEn: e.target.value }))}
                placeholder="نام انگلیسی (اختیاری)"
                dir="ltr"
                className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="اسلاگ (اختیاری، خودکار)"
                dir="ltr"
                className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {parentCategoryOptions.length > 0 && (
                <select
                  value={categoryForm.parentId ?? ''}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, parentId: e.target.value || null }))
                  }
                  className="rounded-input w-full border border-border bg-surface px-3 py-2 text-ui focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">بدون والد</option>
                  {parentCategoryOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={
                    !categoryForm.nameFa.trim() ||
                    createCategoryM.isPending ||
                    updateCategoryM.isPending
                  }
                  onClick={submitCategory}
                >
                  {createCategoryM.isPending || updateCategoryM.isPending
                    ? 'در حال انجام…'
                    : editingCategoryId
                      ? 'به‌روزرسانی'
                      : 'ایجاد'}
                </Button>
                <Button size="sm" variant="ghost" onClick={cancelCategoryForm}>
                  انصراف
                </Button>
              </div>
            </div>
          )}
          {/* Category list */}
          {categories.isPending ? (
            <TaxonomySkeleton count={5} />
          ) : categories.isError ? (
            <ErrorState
              title="دریافت دسته‌بندی‌ها ناموفق بود"
              onRetry={() => void categories.refetch()}
            />
          ) : categoryList.length === 0 ? (
            <EmptyState icon={FolderTree} title="هیچ دسته‌بندی‌ای وجود ندارد" />
          ) : (
            <ul className="space-y-1">
              {categoryList.map((c) => (
                <li key={c.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedCategoryId(c.id === selectedCategoryId ? null : c.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedCategoryId(c.id === selectedCategoryId ? null : c.id); } }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-control px-3 py-2 text-ui transition-colors cursor-pointer',
                      c.id === selectedCategoryId
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'hover:bg-muted/30',
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {c.id === selectedCategoryId ? (
                        <ChevronLeft className="size-4 shrink-0 rtl:rotate-180" />
                      ) : (
                        <ChevronRight className="size-4 shrink-0 rtl:rotate-180" />
                      )}
                      <span className="truncate">{c.name}</span>
                      {c.parentId && (
                        <span className="text-caption text-muted-foreground">(زیرمجموعه)</span>
                      )}
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label="ویرایش"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategoryEdit(c);
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ kind: 'category', id: c.id, label: c.name });
                        }}
                        className="hover:bg-destructive/10 hover:text-destructive rounded p-1 text-muted-foreground"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* ---- Right panel: Attributes + Options ----------------------------- */}
        <div className="space-y-4 lg:col-span-2">
          {!selectedCategoryId ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border bg-surface py-16">
              <FolderTree className="size-10 text-muted-foreground/40" aria-hidden />
              <p className="text-ui text-muted-foreground">
                یک دسته‌بندی را برای مدیریت ویژگی‌ها انتخاب کنید.
              </p>
            </div>
          ) : (
            <>
              {/* Attributes sub-panel */}
              <div className="space-y-3 rounded-card border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-ui font-semibold text-foreground">
                    <Tag className="size-4" aria-hidden /> ویژگی‌ها
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openAttributeAdd}
                    disabled={showAttributeAdd || editingAttributeId !== null}
                  >
                    <Plus className="size-4" aria-hidden /> افزودن ویژگی
                  </Button>
                </div>
                {/* Attribute inline form */}
                {(showAttributeAdd || editingAttributeId !== null) && (
                  <div className="space-y-2 rounded-control border border-border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input
                        type="text"
                        value={attributeForm.key}
                        onChange={(e) => setAttributeForm((f) => ({ ...f, key: e.target.value }))}
                        placeholder="کلید (مثلاً brand) *"
                        dir="ltr"
                        className="rounded-input border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <input
                        type="text"
                        value={attributeForm.label}
                        onChange={(e) => setAttributeForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="برچسب فارسی *"
                        className="rounded-input border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={attributeForm.type}
                        onChange={(e) => setAttributeForm((f) => ({ ...f, type: e.target.value }))}
                        className="rounded-input border border-border bg-surface px-3 py-2 text-ui focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {ATTRIBUTE_TYPES.map((t) => (
                          <option key={t.key} value={t.key}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <label className="flex cursor-pointer items-center gap-2 text-ui">
                        <input
                          type="checkbox"
                          checked={attributeForm.required}
                          onChange={(e) =>
                            setAttributeForm((f) => ({ ...f, required: e.target.checked }))
                          }
                          className="size-4 rounded border-border accent-primary"
                        />{' '}
                        الزامی
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={
                          !attributeForm.key.trim() ||
                          !attributeForm.label.trim() ||
                          createAttributeM.isPending ||
                          updateAttributeM.isPending
                        }
                        onClick={submitAttribute}
                      >
                        {createAttributeM.isPending || updateAttributeM.isPending
                          ? 'در حال انجام…'
                          : editingAttributeId
                            ? 'به‌روزرسانی'
                            : 'ایجاد'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelAttributeForm}>
                        انصراف
                      </Button>
                    </div>
                  </div>
                )}
                {/* Attribute list */}
                {attributes.isPending ? (
                  <TaxonomySkeleton count={3} />
                ) : attributes.isError ? (
                  <ErrorState
                    title="دریافت ویژگی‌ها ناموفق بود"
                    onRetry={() => void attributes.refetch()}
                  />
                ) : attributeList.length === 0 ? (
                  <p className="py-6 text-center text-caption text-muted-foreground">
                    هنوز ویژگی‌ای برای این دسته تعریف نشده.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {attributeList.map((a) => (
                      <div key={a.id}>
                        <div
                          className={cn(
                            'flex items-center justify-between rounded-control px-3 py-2 transition-colors',
                            selectedAttribute?.id === a.id ? 'bg-primary/10' : 'hover:bg-muted/30',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedAttribute(selectedAttribute?.id === a.id ? null : a)
                            }
                            className="flex flex-1 items-center gap-2 text-start text-ui"
                          >
                            <span className="font-medium">{a.label}</span>
                            <span className="text-caption text-muted-foreground">
                              ({ATTR_TYPE_LABELS[a.type] ?? a.type})
                            </span>
                            <span className="rounded-full bg-muted px-1.5 text-caption text-muted-foreground">
                              {a.key}
                            </span>
                            {a.required && (
                              <span className="text-destructive text-caption">*الزامی</span>
                            )}
                            {a.options.length > 0 && (
                              <span className="text-caption text-muted-foreground">
                                {a.options.length.toLocaleString('fa-IR')} گزینه
                              </span>
                            )}
                          </button>
                          <span className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              aria-label="ویرایش ویژگی"
                              onClick={() => openAttributeEdit(a)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label="حذف ویژگی"
                              onClick={() =>
                                setDeleteTarget({ kind: 'attribute', id: a.id, label: a.label })
                              }
                              className="hover:bg-destructive/10 hover:text-destructive rounded p-1 text-muted-foreground"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </span>
                        </div>
                        {/* Options expandable panel for SELECT/MULTI_SELECT */}
                        {selectedAttribute?.id === a.id &&
                          (a.type === 'SELECT' || a.type === 'MULTI_SELECT') && (
                            <div className="mr-4 mt-1 space-y-2 rounded-control border border-border bg-muted/20 p-3">
                              <div className="flex items-center justify-between">
                                <h4 className="flex items-center gap-2 text-caption font-semibold text-muted-foreground">
                                  <ClipboardList className="size-3.5" aria-hidden /> گزینه‌ها
                                </h4>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={openOptionAdd}
                                  disabled={showOptionAdd || editingOptionId !== null}
                                >
                                  <Plus className="size-3.5" aria-hidden /> افزودن گزینه
                                </Button>
                              </div>
                              {(showOptionAdd || editingOptionId !== null) && (
                                <div className="space-y-2 rounded-control border border-border bg-surface p-2">
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <input
                                      type="text"
                                      value={optionForm.value}
                                      onChange={(e) =>
                                        setOptionForm((f) => ({ ...f, value: e.target.value }))
                                      }
                                      placeholder="مقدار *"
                                      dir="ltr"
                                      className="rounded-input border border-border bg-surface px-2 py-1.5 text-caption placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    <input
                                      type="text"
                                      value={optionForm.label}
                                      onChange={(e) =>
                                        setOptionForm((f) => ({ ...f, label: e.target.value }))
                                      }
                                      placeholder="برچسب فارسی *"
                                      className="rounded-input border border-border bg-surface px-2 py-1.5 text-caption placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      disabled={
                                        !optionForm.value.trim() ||
                                        !optionForm.label.trim() ||
                                        createOptionM.isPending ||
                                        updateOptionM.isPending
                                      }
                                      onClick={submitOption}
                                    >
                                      {createOptionM.isPending || updateOptionM.isPending
                                        ? 'در حال انجام…'
                                        : editingOptionId
                                          ? 'به‌روزرسانی'
                                          : 'ایجاد'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={cancelOptionForm}>
                                      انصراف
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {a.options.length === 0 ? (
                                <p className="text-caption text-muted-foreground">
                                  گزینه‌ای تعریف نشده.
                                </p>
                              ) : (
                                <ul className="space-y-1">
                                  {a.options.map((o) => (
                                    <li
                                      key={o.id}
                                      className="flex items-center justify-between rounded px-2 py-1 text-caption hover:bg-muted/30"
                                    >
                                      <span>
                                        <span className="font-mono text-muted-foreground">
                                          {o.value}
                                        </span>{' '}
                                        <span className="text-muted-foreground">←</span> {o.label}
                                        {!o.isActive && (
                                          <span className="text-destructive ml-1">(غیرفعال)</span>
                                        )}
                                      </span>
                                      <span className="flex gap-1">
                                        <button
                                          aria-label="ویرایش گزینه"
                                          onClick={() => openOptionEdit(o)}
                                          className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                        >
                                          <Pencil className="size-3" />
                                        </button>
                                        <button
                                          aria-label="حذف گزینه"
                                          onClick={() =>
                                            setDeleteTarget({
                                              kind: 'option',
                                              id: o.id,
                                              label: o.label,
                                            })
                                          }
                                          className="hover:bg-destructive/10 hover:text-destructive rounded p-0.5 text-muted-foreground"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          switch (deleteTarget.kind) {
            case 'category':
              deleteCategoryM.mutate(deleteTarget.id);
              break;
            case 'attribute':
              deleteAttributeM.mutate(deleteTarget.id);
              break;
            case 'option':
              deleteOptionM.mutate(deleteTarget.id);
              break;
          }
          setDeleteTarget(null);
        }}
        title={
          deleteTarget?.kind === 'category'
            ? 'حذف دسته‌بندی؟'
            : deleteTarget?.kind === 'attribute'
              ? 'حذف ویژگی؟'
              : 'حذف گزینه؟'
        }
        description={
          deleteTarget
            ? `آیا از حذف «${deleteTarget.label}» اطمینان دارید؟ ${deleteTarget.kind === 'category' ? 'در صورت وجود زیرمجموعه یا آگهی، حذف مسدود خواهد شد.' : 'این عمل قابل بازگشت نیست.'}`
            : ''
        }
        confirmLabel="حذف"
        busy={deleteCategoryM.isPending || deleteAttributeM.isPending || deleteOptionM.isPending}
      />
    </div>
  );
}

// --- Helpers -----------------------------------------------------------------

function AdminSpinner({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function TaxonomySkeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
