import type { Metadata } from 'next';
import Link from 'next/link';
import { FolderTree } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';
import { fetchCategoryTreeServer } from '@/features/categories';
import type { CategoryNode } from '@/features/categories';
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
      <PageHeading
        title="دسته‌بندی‌ها"
        description="همهٔ دسته‌های آگهی را مرور کنید و مستقیم وارد دستهٔ دلخواه شوید."
      />

      {result.status === 'ok' ? (
        <section
          aria-label="فهرست دسته‌ها"
          className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {result.tree.map((node) => (
            <div key={node.id} className="rounded-surface border border-border bg-surface p-4">
              <Link
                href={`/category/${node.slug}`}
                className="inline-flex items-center gap-2 rounded-control text-card-title font-semibold text-foreground transition-colors duration-small hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <FolderTree className="size-5 shrink-0 text-primary" aria-hidden />
                {node.name}
              </Link>
              {node.children.length > 0 ? (
                <ul className="mt-3 space-y-1.5">
                  {node.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/category/${child.slug}`}
                        className="inline-flex rounded-control text-ui text-muted-foreground transition-colors duration-small hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

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