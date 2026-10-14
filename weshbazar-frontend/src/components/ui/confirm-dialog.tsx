'use client';

/**
 * ConfirmDialog — destructive-action confirmation modal (master prompt §128).
 *
 * Uses native <dialog> with showModal() (built-in focus trap, Escape close,
 * inert backdrop). Geometry follows WeshBazar design tokens (§14).
 */

import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  /** Control open/close from the parent. */
  open: boolean;
  /** Called when the user closes the dialog without confirming. */
  onClose: () => void;
  /** Called when the user clicks the confirm/destructive button. */
  onConfirm: () => void;
  /** Modal heading — a short, actionable question. */
  title: string;
  /** Body copy explaining what will happen. */
  description: string;
  /** Label for the destructive confirmation button. */
  confirmLabel?: string;
  /** When true the confirm button shows a spinner and is disabled. */
  busy?: boolean;
  /** Additional class on the dialog element. */
  className?: string;
}

/**
 * A generic confirmation modal for destructive admin actions:
 *   - suspend/ban user
 *   - delete category
 *   - delete province/city
 *   - delete attribute/option
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ConfirmDialog open={open} onClose={() => setOpen(false)}
 *     onConfirm={() => deleteM.mutate(id)}
 *     title="حذف دسته‌بندی؟"
 *     description="این عمل قابل بازگشت نیست."
 *     confirmLabel="حذف"
 *     busy={deleteM.isPending} />
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'تأیید',
  busy = false,
  className,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    if (open) {
      if (!el.open) el.showModal();
    } else {
      if (el.open) el.close();
    }
  }, [open]);

  // The dialog fires a "close" event when Escape is pressed — treat as cancel.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;

    function handleClose() {
      if (open) onClose();
    }

    el.addEventListener('close', handleClose);
    return () => el.removeEventListener('close', handleClose);
  }, [open, onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onClick={(event) => {
        // Close only on backdrop clicks
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        'fixed inset-0 m-auto h-fit max-h-[85dvh] w-[calc(100%-2rem)] max-w-md rounded-card border border-border bg-surface p-0 shadow-lg backdrop:bg-black/50',
        'open:flex open:flex-col',
        className,
      )}
    >
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
          <AlertTriangle className="size-5 text-danger" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 id="confirm-dialog-title" className="text-ui font-semibold text-foreground">
            {title}
          </h2>
          <p id="confirm-dialog-description" className="mt-1 text-meta text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={onClose}
        >
          انصراف
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={busy}
          onClick={onConfirm}
        >
          {busy ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              در حال انجام…
            </>
          ) : (
            confirmLabel
          )}
        </Button>
      </div>
    </dialog>
  );
}