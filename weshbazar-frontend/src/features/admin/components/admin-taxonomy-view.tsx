'use client';

/**
 * Admin taxonomy view — category CRUD with inline add/edit forms.
 *
 * Session-gated exactly like the dashboard (§43): guests are routed to login
 * with `next` preserved. A signed-in USER lands on the honest access-denied
 * surface. A stale-role 403 or dead session routes back to login (§42).
 */
 
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FolderTree, Plus, Pencil, Trash2, X } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { Button } from '@/components/ui/button';
import { useAuthBootstrap } from '@/features/auth';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isForbiddenError, isSessionLostError } from '../errors';
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks';
import { AdminAccessDenied } from './admin-access-denied';
import type { AdminCategoryItem } from '../types';

const LOGIN_HREF = `/auth/login?next=${encodeURIComponent('/admin/taxonomy')}`;

interface CategoryFormData {
  nameFa: string;
  nameEn: string;
  slug: string;
}

function categoryToFormData(cat: AdminCategoryItem): CategoryFormData {
  return { nameFa: cat.name, nameEn: '', slug: cat.slug };
}

export function AdminTaxonomyView({ className }: { className?: string }) {
  const router = useRouter();
  const { status, user, retry } = useAuthBootstrap();

  useEffect(() => { if (status === 'anonymous') router.replace(LOGIN_HREF); }, [status, router]);
  const gotoLogin = useCallback(() => router.replace(LOGIN_HREF), [router]);

  const enabled = status === 'ready' && user !== null && user.role !== 'USER';
  const categories = useAdminCategories(enabled);
  const denied = isForbiddenError(categories.error);
  const sessionLost = isSessionLostError(categories.error);

  const createM = useCreateCategory();
  const updateM = useUpdateCategory();
  const deleteM = useDeleteCategory();

  // Form state
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>({ nameFa: '', nameEn: '', slug: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => { if (sessionLost) gotoLogin(); }, [sessionLost, gotoLogin]);

  // Reset form on success
  useEffect(() => {
    if (createM.isSuccess) { setShowAdd(false); setForm({ nameFa: '', nameEn: '', slug: '' }); }
  }, [createM.isSuccess]);
  useEffect(() => {
    if (updateM.isSuccess) { setEditingId(null); setForm({ nameFa: '', nameEn: '', slug: '' }); }
  }, [updateM.isSuccess]);
  useEffect(() => {
    if (deleteM.isSuccess) setDeleteConfirmId(null);
  }, [deleteM.isSuccess]);

  const isBusy = createM.isPending || updateM.isPending || deleteM.isPending;

  const handleCreate = () => {
    if (!form.nameFa.trim()) return;
    createM.mutate({
      translations: [
        { locale: 'fa', name: form.nameFa.trim() },
        { locale: 'en', name: form.nameEn.trim() || form.nameFa.trim() },
      ],
      slug: form.slug.trim() || undefined,
    });
  };

  const handleUpdate = (id: string) => {
    if (!form.nameFa.trim()) return;
    updateM.mutate({
      id,
      payload: {
        translations: [
          { locale: 'fa', name: form.nameFa.trim() },
          ...(form.nameEn.trim() ? [{ locale: 'en' as const, name: form.nameEn.trim() }] : []),
        ],
        slug: form.slug.trim() || undefined,
      },
    });
  };

  const startEdit = (cat: AdminCategoryItem) => {
    setEditingId(cat.id);
    setShowAdd(false);
    setForm(categoryToFormData(cat));
  };

  if (status === 'checking') return <AdminSpinner label="در حال بررسی نشست…" />;
  if (status === 'unreachable') return <ErrorState title="ارتباط با سرور برقرار نشد" description="اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید." onRetry={retry} />;
  if (status === 'anonymous') return <AdminSpinner label="در حال انتقال به صفحهٔ ورود…" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;
  if (denied) return <AdminAccessDenied />;

  const items = categories.data ?? [];
  const mutationError = createM.error ?? updateM.error ?? deleteM.error;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-ui font-semibold">{items.length.toLocaleString('fa-IR')} دسته‌بندی</h3>
        {!showAdd && !editingId && (
          <Button size="sm" onClick={() => { setShowAdd(true); setForm({ nameFa: '', nameEn: '', slug: '' }); }}>
            <Plus className="size-4" /> دستهٔ جدید
          </Button>
        )}
      </div>

      {/* Mutation error */}
      {mutationError && (
        <div className="rounded-card border border-danger/30 bg-danger/5 p-3 text-ui text-danger">
          {mutationError instanceof ApiError ? mutationError.message : 'عملیات ناموفق بود.'}
          <button type="button" className="ms-3 underline" onClick={() => { createM.reset(); updateM.reset(); deleteM.reset(); }}>بستن</button>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <CategoryForm form={form} setForm={setForm} busy={isBusy} onSubmit={handleCreate}
          onCancel={() => { setShowAdd(false); setForm({ nameFa: '', nameEn: '', slug: '' }); }}
          submitLabel="ایجاد دسته" />
      )}

      {/* List */}
      {categories.isPending ? <TaxonomySkeleton /> :
       categories.isError ? <ErrorState requestId={categories.error instanceof ApiError ? categories.error.requestId : undefined} title="دریافت دسته‌بندی‌ها ناموفق بود" onRetry={() => void categories.refetch()} /> :
       items.length === 0 && !showAdd ? <EmptyState icon={FolderTree} title="دسته‌بندی‌ای ثبت نشده" action={<Button size="sm" onClick={() => setShowAdd(true)}>ایجاد اولین دسته</Button>} /> :
       <div className="rounded-card border border-border bg-surface">
         <ul className="divide-y divide-border">
           {items.map((c) => (
             <li key={c.id}>
               {editingId === c.id ? (
                 <div className="px-4 py-3">
                   <CategoryForm form={form} setForm={setForm} busy={isBusy} onSubmit={() => handleUpdate(c.id)}
                     onCancel={() => { setEditingId(null); setForm({ nameFa: '', nameEn: '', slug: '' }); }}
                     submitLabel="ذخیره" />
                 </div>
               ) : (
                 <div className="flex items-center justify-between gap-3 px-4 py-3">
                   <div className="min-w-0">
                     <span className="text-ui font-medium">{c.name}</span>
                     <span className="mx-2 text-caption text-muted-foreground" dir="ltr">{c.slug}</span>
                     {c.parentId && <span className="text-caption text-muted-foreground">(زیرمجموعه)</span>}
                   </div>
                   <div className="flex shrink-0 items-center gap-1">
                     <button type="button" disabled={isBusy} onClick={() => startEdit(c)}
                       className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption text-muted-foreground hover:bg-muted/30 transition-colors"
                       title="ویرایش">
                       <Pencil className="size-3.5" /> ویرایش
                     </button>
                     {deleteConfirmId === c.id ? (
                       <span className="inline-flex items-center gap-1">
                         <button type="button" disabled={isBusy} onClick={() => deleteM.mutate(c.id)}
                           className="rounded-control px-2 py-1 text-caption text-danger hover:bg-danger/10 transition-colors">
                           مطمئنی؟
                         </button>
                         <button type="button" onClick={() => setDeleteConfirmId(null)}
                           className="rounded-control p-1 text-muted-foreground hover:text-foreground transition-colors">
                           <X className="size-3.5" />
                         </button>
                       </span>
                     ) : (
                       <button type="button" disabled={isBusy} onClick={() => setDeleteConfirmId(c.id)}
                         className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-caption text-danger hover:bg-danger/10 transition-colors"
                         title="حذف">
                         <Trash2 className="size-3.5" /> حذف
                       </button>
                     )}
                   </div>
                 </div>
               )}
             </li>
           ))}
         </ul>
       </div>}
    </div>
  );
}

// --- Inline form ------------------------------------------------------------

function CategoryForm({
  form, setForm, busy, onSubmit, onCancel, submitLabel,
}: {
  form: CategoryFormData;
  setForm: (f: CategoryFormData) => void;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3">
      <input type="text" value={form.nameFa} onChange={(e) => setForm({ ...form, nameFa: e.target.value })}
        placeholder="نام فارسی" className="w-full rounded-input border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      <input type="text" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
        placeholder="نام انگلیسی (اختیاری)" className="w-full rounded-input border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" dir="ltr" />
      <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
        placeholder="اسلاگ (اختیاری، خودکار)" className="w-full rounded-input border border-border bg-surface px-3 py-2 text-ui placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" dir="ltr" />
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={!form.nameFa.trim() || busy} onClick={onSubmit}>
          {busy ? 'در حال انجام…' : submitLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>انصراف</Button>
      </div>
    </div>
  );
}

// --- Helpers ---------------------------------------------------------------

function AdminSpinner({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 py-16 text-ui text-muted-foreground"><Loader2 aria-hidden className="size-4 animate-spin" />{label}</div>;
}

function TaxonomySkeleton() {
  return <div className="space-y-3" aria-hidden>{Array.from({ length: 5 }, (_, i) => (
    <div key={i} className="rounded-card border border-border bg-surface p-4 space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div>
  ))}</div>;
}