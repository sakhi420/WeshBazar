/**
 * Shared shell for wizard steps (master prompt §20, §34–§41): the progress
 * stepper plus the page H1, and a consistent action row for «بازگشت» /
 * «ادامه». Pages compose their own form between the two.
 */

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { PageHeading } from '@/components/layout/page-heading';
import type { SellStepKey } from '@/features/listings';
import { SellStepper } from './sell-stepper';

interface SellStepLayoutProps {
  step: SellStepKey;
  title: string;
  description?: string;
  children: ReactNode;
}

export function SellStepLayout({ step, title, description, children }: SellStepLayoutProps) {
  return (
    <div className="space-y-6">
      <SellStepper current={step} />
      <PageHeading title={title} description={description} />
      {children}
    </div>
  );
}

/**
 * Step action row: stacked full-width on mobile (thumb reach), back at the
 * inline start and the primary action at the inline end on wider screens.
 */
export function SellStepActions({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {children}
    </div>
  );
}
