/**
 * Wizard progress stepper (master prompt §138).
 *
 * Presentational: receives the current step key and renders the six flow
 * steps with a «گام X از ۶» announcement. Completed steps show a check,
 * the current step is highlighted and carries `aria-current="step"`.
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FLOW_STEP_COUNT,
  FLOW_STEP_KEYS,
  flowStepPosition,
  formatNumber,
  sellStepLabel,
  type SellStepKey,
} from '@/features/listings';

interface SellStepperProps {
  current: SellStepKey;
  className?: string;
}

export function SellStepper({ current, className }: SellStepperProps) {
  const position = flowStepPosition(current);
  // The start picker and the submit outcome are outside the numbered flow.
  if (position === null) return null;

  return (
    <nav aria-label="مراحل ثبت آگهی" className={cn('w-full', className)}>
      <p className="text-caption text-muted-foreground">
        گام {formatNumber(position)} از {formatNumber(FLOW_STEP_COUNT)}
      </p>
      <ol className="mt-2 flex items-start gap-1">
        {FLOW_STEP_KEYS.map((key, index) => {
          const stepNumber = index + 1;
          const done = stepNumber < position;
          const active = stepNumber === position;
          return (
            <li
              key={key}
              aria-current={active ? 'step' : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-1"
            >
              <span
                aria-hidden
                className={cn(
                  'flex size-7 items-center justify-center rounded-full border text-caption font-medium',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'border-border bg-muted/40 text-muted-foreground',
                )}
              >
                {done ? <Check className="size-3.5" /> : formatNumber(stepNumber)}
              </span>
              <span
                className={cn(
                  'w-full truncate text-center text-caption',
                  active ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {sellStepLabel(key)}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
