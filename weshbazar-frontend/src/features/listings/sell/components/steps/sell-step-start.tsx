'use client';

/**
 * Sell start (§34) — pick the leaf category that drives the whole wizard.
 *
 * The flat category list is drilled down (roots → children) so any tree
 * depth works; only leaves (`hasChildren === false`) are selectable because
 * the backend rejects non-leaf categories (CATEGORY_NOT_LEAF). Tapping a
 * leaf selects it and advances straight to the photos step.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronLeft, FolderTree } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { cn } from '@/lib/utils';
import { ApiError, queryKeys } from '@/lib/api';
import { fetchCategories, type CategorySummary } from '@/features/categories';
import { sellStepPath } from '@/features/listings';
import { DraftRecoveryBanner } from '../draft-recovery-banner';
import { SellGuard } from '../sell-guard';
import { SellStepLayout } from '../sell-step-layout';
import { useSell } from '../sell-provider';

export function SellStartStep() {
  return (
    <SellGuard step="start">
      <StartPicker />
    </SellGuard>
  );
}

function StartPicker() {
  const router = useRouter();
  const { draft, updateDraft } = useSell();
  const [path, setPath] = useState<CategorySummary[]>([]);
  const [pathInitialized, setPathInitialized] = useState(false);

  const result = useQuery({
    queryKey: queryKeys.categories.list,
    queryFn: () => fetchCategories(),
    staleTime: 5 * 60_000,
  });

  const categories = useMemo(() => result.data ?? [], [result.data]);

  // Drill to the current category's parent once so a returning seller sees
  // the selected leaf in place instead of a reset tree.
  useEffect(() => {
    if (pathInitialized || categories.length === 0) return;
    setPathInitialized(true);
    if (draft.categoryId === null) return;
    const byId = new Map(categories.map((category) => [category.id, category]));
    const chain: CategorySummary[] = [];
    let node: CategorySummary | undefined = byId.get(draft.categoryId);
    while (node !== undefined && chain.length < 10) {
      chain.unshift(node);
      node = node.parentId !== null ? byId.get(node.parentId) : undefined;
    }
    setPath(chain.slice(0, Math.max(0, chain.length - 1)));
  }, [pathInitialized, categories, draft.categoryId]);

  const currentParentId = path.length === 0 ? null : (path[path.length - 1]?.id ?? null);
  const visible = categories.filter((category) => category.parentId === currentParentId);

  const pick = (category: CategorySummary) => {
    if (category.hasChildren) {
      setPath((current) => [...current, category]);
      return;
    }
    updateDraft({
      categoryId: category.id,
      categoryName: category.name,
      completedStep: 'start',
    });
    router.push(sellStepPath('photos'));
  };

  return (
    <SellStepLayout
      step="start"
      title="دستهٔ کالا را انتخاب کنید"
      description="دستهٔ درست، ویژگی‌ها و جایگاه آگهی شما را در جست‌وجو تعیین می‌کند."
    >
      <DraftRecoveryBanner />

      {result.isPending ? (
        <div className="space-y-2" aria-hidden>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-control w-full" />
          ))}
        </div>
      ) : result.isError ? (
        <ErrorState
          requestId={result.error instanceof ApiError ? result.error.requestId : undefined}
          description="بارگیری دسته‌بندی‌ها ناموفق بود. دوباره تلاش کنید."
          onRetry={() => void result.refetch()}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="دسته‌ای در دسترس نیست"
          description="در حال حاضر دسته‌بندی فعالی برای ثبت آگهی وجود ندارد؛ کمی بعد دوباره سر بزنید."
        />
      ) : (
        <div className="space-y-3">
          <nav aria-label="مسیر دسته‌بندی" className="flex flex-wrap items-center gap-1">
            <PathButton active={path.length === 0} onClick={() => setPath([])}>
              همه
            </PathButton>
            {path.map((node, index) => (
              <span key={node.id} className="flex items-center gap-1">
                <ChevronLeft aria-hidden className="size-3.5 text-muted-foreground" />
                <PathButton
                  active={index === path.length - 1}
                  onClick={() => setPath(path.slice(0, index + 1))}
                >
                  {node.name}
                </PathButton>
              </span>
            ))}
          </nav>

          <ul className="overflow-hidden rounded-card border border-border bg-card">
            {visible.map((category) => {
              const selected = category.id === draft.categoryId;
              return (
                <li key={category.id} className="border-b border-border last:border-b-0">
                  <button
                    type="button"
                    onClick={() => pick(category)}
                    className="flex min-h-control w-full items-center justify-between gap-2 px-4 py-3 text-start text-ui outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className={cn('min-w-0', selected ? 'font-medium text-primary' : 'text-foreground')}>
                      {category.name}
                    </span>
                    {category.hasChildren ? (
                      <ChevronLeft aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                    ) : selected ? (
                      <Check aria-hidden className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                </li>
              );
            })}
            {visible.length === 0 ? (
              <li className="px-4 py-6 text-center text-ui text-muted-foreground">
                زیردسته‌ای برای این بخش ثبت نشده است.
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </SellStepLayout>
  );
}

function PathButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-control px-2 py-1 text-meta outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/50',
      )}
    >
      {children}
    </button>
  );
}
