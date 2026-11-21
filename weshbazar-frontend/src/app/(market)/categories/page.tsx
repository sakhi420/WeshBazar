import type { Metadata } from 'next';
import { FolderTree } from 'lucide-react';
import { CategoriesBrowser } from '@/components/discovery/categories-browser';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';
import { fetchCategoryTreeServer } from '@/features/categories';
import { ApiError } from '@/lib/api';

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها',
  alternates: { canonical: '/categories' },
};

// Category data changes rarely; mirror the home feed's cache policy.
export const revalidate = 300;

type TreeResult =
  | { status: 'ok'; tree: CategoryNode[] }
  | { status: 'empty' }
  | { status: 'error'; requestId?: string };

async function loadTree(): Promise<TreeResult> {
  try {
    const tree = await fetchCategoryTreeServer();
    if (!Array.isArray(tree) || tree.length === 0) return { status: 'empty' };
    return { status: 'ok', tree };
  } catch (error) {
    return {
      status: 'error',
      requestId: error instanceof ApiError ? error.requestId : undefined,
    };
  }
}

/**
 * Category index (HF-NAV-001/002): a real category browser reached by both the
 * desktop header category button and the mobile bottom-nav «دسته‌ها» tab.
 * Renders the root tree with direct sub-category links into /category/[slug].
 */
export default async function CategoriesPage() {
  const result = await loadTree();

  return (
    <PageContainer>
      {result.status === 'ok' ? <CategoriesBrowser tree={result.tree} /> : null}

      {result.status === 'empty' ? (
        <EmptyState
          icon={FolderTree}
          title="هنوز دسته‌بندی‌ای وجود ندارد"
          description="به‌محض فعال شدن دسته‌بندی‌ها از سوی مدیران، اینجا نمایش داده می‌شوند."
          className="mt-6"
        />
      ) : null}

      {result.status === 'error' ? (
        <ErrorState
          title="دسته‌بندی‌ها بارگذاری نشد"
          description="در حال حاضر امکان دریافت دسته‌بندی‌ها از سرور وجود ندارد. کمی بعد دوباره تلاش کنید."
          requestId={result.requestId}
          className="mt-6"
        />
      ) : null}
    </PageContainer>
  );
}