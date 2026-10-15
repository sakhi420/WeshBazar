import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** Surface the backend `requestId` on fatal/error screens (§5 support tracing). */
  requestId?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error state (master prompt §19). Honest recovery UI: message, optional retry,
 * and the request id for support. Never swallow the error with fake data.
 */
export function ErrorState({
  title = 'مشکلی پیش آمد',
  description = 'اتصال را بررسی کنید و دوباره تلاش کنید.',
  requestId,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-border bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="size-6" aria-hidden />
      </span>
      <p className="text-card-title font-semibold text-foreground">{title}</p>
      <p className="max-w-prose text-ui text-muted-foreground">{description}</p>
      {requestId ? (
        <p className="bidi-ltr text-caption text-muted-foreground">
          شناسه پیگیری: <span className="font-mono">{requestId}</span>
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          تلاش دوباره
        </Button>
      ) : null}
    </div>
  );
}
