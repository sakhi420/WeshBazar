'use client';

/**
 * Draft recovery banner (master prompt §139, §34).
 *
 * Shown on the sell start page when a locally stored draft holds unfinished
 * work: «ادامهٔ پیشنویس» jumps to the next unfinished step, «شروع دوباره»
 * discards it, and the close button hides the notice while keeping the draft.
 */

import Link from 'next/link';
import { History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { resumeStepKey, sellStepLabel, sellStepPath } from '@/features/listings';
import { useSell } from './sell-provider';

export function DraftRecoveryBanner() {
  const { restored, draft, resetDraft, dismissRestored } = useSell();
  if (!restored) return null;

  const resumeKey = resumeStepKey(draft.completedStep);
  const categoryNote = draft.categoryName !== null ? `دستهٔ «${draft.categoryName}» — ` : '';

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-primary/20 bg-primary-soft p-4"
    >
      <div className="flex min-w-0 items-start gap-2">
        <History aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-ui font-medium text-foreground">پیش‌نویس ناتمامی دارید</p>
          <p className="mt-0.5 text-meta text-muted-foreground">
            {categoryNote}ادامه از گام «{sellStepLabel(resumeKey)}»
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link href={sellStepPath(resumeKey)} onClick={dismissRestored}>
            ادامهٔ پیش‌نویس
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={resetDraft}>
          شروع دوباره
        </Button>
        <Button variant="ghost" size="icon" aria-label="بستن پیام" onClick={dismissRestored}>
          <X aria-hidden className="size-4" />
        </Button>
      </div>
    </div>
  );
}
