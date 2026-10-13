'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, FolderTree } from 'lucide-react';
import { ErrorState } from '@/components/feedback/error-state';
import { EmptyState } from '@/components/feedback/empty-state';
import { queryKeys, get, ApiError } from '@/lib/api';
import { useAuthBootstrap } from '@/features/auth';
import { AdminAccessDenied } from './admin-access-denied';

interface CategoryItem { id: string; name: string; slug: string; parentId: string | null; }

export function AdminTaxonomyView() {
  const { status, user } = useAuthBootstrap();
  const enabled = status === 'ready' && user !== null && user.role !== 'USER';

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: () => get<CategoryItem[]>('/admin/categories'),
    enabled,
  });

  if (status === 'checking') return <Loader2 className="mx-auto mt-8 size-6 animate-spin text-muted-foreground" />;
  if (!user || user.role === 'USER') return <AdminAccessDenied />;

  const categories = data ?? [];

  return (
    <div className="space-y-4">
      {isLoading ? <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" /> :
       isError ? <ErrorState requestId={error instanceof ApiError ? error.requestId : undefined} onRetry={() => void refetch()} /> :
       categories.length === 0 ? <EmptyState icon={FolderTree} title="دسته‌بندی‌ای ثبت نشده" /> :
       <div className="rounded-card border border-border bg-surface">
         <ul className="divide-y divide-border">
           {categories.map((c) => (
             <li key={c.id} className="flex items-center justify-between px-4 py-3">
               <span className="text-ui font-medium">{c.name}</span>
               <span className="text-caption text-muted-foreground" dir="ltr">{c.slug}</span>
             </li>
           ))}
         </ul>
       </div>}
    </div>
  );
}