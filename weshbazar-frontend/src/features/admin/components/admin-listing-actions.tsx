'use client';

/**
 * Permission-aware moderation actions for one queue row (§144–147 contract
 * spirit): renders exactly the commands the backend put in `permittedActions`
 * — hidden UI is not security, the server re-checks every command (§42).
 * Reject opens an inline reason form; archive asks an inline confirmation;
 * approve and restore are immediate.
 */

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Archive, Check, Loader2, RotateCcw, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  MODERATION_NOTE_MAX_LENGTH,
  REJECTION_REASON_OPTIONS,
  formatModerationAction,
  isPubliclyViewable,
} from '../model';
import type { AdminListingItem, ModerationAction } from '../types';

export interface ModerationRequest {
  action: ModerationAction;
  reason?: string;
  note?: string;
}

interface AdminListingActionsProps {
  listing: AdminListingItem;
  /** This row's in-flight action, if any. */
  pending: ModerationAction | null;
  /** True while any moderation mutation runs — every control locks. */
  locked: boolean;
  onAction: (request: ModerationRequest) => void;
}

/** Canonical render order — `permittedActions` decides what actually shows. */
const ACTION_ORDER: readonly ModerationAction[] = ['APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE'];

const ACTION_ICONS: Record<ModerationAction, LucideIcon> = {
  APPROVE: Check,
  REJECT: X,
  ARCHIVE: Archive,
  RESTORE: RotateCcw,
};

export function AdminListingActions({
  listing,
  pending,
  locked,
  onAction,
}: AdminListingActionsProps) {
  const [confirmingArchive, setConfirmingArchive] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [reasonError, setReasonError] = useState(false);

  const actions = ACTION_ORDER.filter((action) => listing.permittedActions.includes(action));

  if (rejecting) {
    const submit = (event: FormEvent) => {
      event.preventDefault();
      if (!reason) {
        setReasonError(true);
        return;
      }
      setRejecting(false);
      setReasonError(false);
      const trimmedNote = note.trim();
      onAction({ action: 'REJECT', reason, note: trimmedNote ? trimmedNote : undefined });
      setReason('');
      setNote('');
    };

    return (
      <form onSubmit={submit} className="space-y-2">
        <div>
          <label
            htmlFor={`reject-reason-${listing.id}`}
            className="text-caption text-muted-foreground"
          >
            دلیل رد (الزامی)
          </label>
          <select
            id={`reject-reason-${listing.id}`}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setReasonError(false);
            }}
            className="mt-1 h-control w-full rounded-control border border-border bg-surface px-3 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64"
          >
            <option value="">انتخاب دلیل…</option>
            {REJECTION_REASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {reasonError ? (
            <p className="mt-1 text-caption text-danger">دلیل رد را انتخاب کنید.</p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor={`reject-note-${listing.id}`}
            className="text-caption text-muted-foreground"
          >
            توضیح برای فروشنده (اختیاری)
          </label>
          <textarea
            id={`reject-note-${listing.id}`}
            value={note}
            maxLength={MODERATION_NOTE_MAX_LENGTH}
            rows={2}
            onChange={(event) => setNote(event.target.value)}
            className="mt-1 w-full rounded-control border border-border bg-surface p-2 text-ui outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" size="sm" variant="destructive" disabled={locked}>
            {pending === 'REJECT' ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <X aria-hidden />
            )}
            ثبت رد
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={locked}
            onClick={() => {
              setRejecting(false);
              setReasonError(false);
            }}
          >
            انصراف
          </Button>
        </div>
      </form>
    );
  }

  if (confirmingArchive) {
    return (
      <div role="group" aria-label="تأیید عمل" className="flex flex-wrap items-center gap-2">
        <p className="w-full text-ui text-foreground sm:w-auto">
          آگهی از دسترس خارج شود؟ بعداً می‌توانید بازگردانی کنید.
        </p>
        <Button
          size="sm"
          variant="destructive"
          disabled={locked}
          onClick={() => {
            setConfirmingArchive(false);
            onAction({ action: 'ARCHIVE' });
          }}
        >
          {pending === 'ARCHIVE' ? <Loader2 className="animate-spin" aria-hidden /> : null}
          تأیید
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={locked}
          onClick={() => setConfirmingArchive(false)}
        >
          انصراف
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const Icon = ACTION_ICONS[action];
        const isPending = pending === action;
        const icon = isPending ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : (
          <Icon aria-hidden />
        );

        if (action === 'REJECT') {
          return (
            <Button
              key={action}
              size="sm"
              variant="outline"
              disabled={locked}
              onClick={() => setRejecting(true)}
            >
              {icon}
              {formatModerationAction(action)}
            </Button>
          );
        }
        if (action === 'ARCHIVE') {
          return (
            <Button
              key={action}
              size="sm"
              variant="ghost"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              disabled={locked}
              onClick={() => setConfirmingArchive(true)}
            >
              {icon}
              {formatModerationAction(action)}
            </Button>
          );
        }
        return (
          <Button
            key={action}
            size="sm"
            variant={action === 'APPROVE' ? 'default' : 'outline'}
            disabled={locked}
            onClick={() => onAction({ action })}
          >
            {icon}
            {formatModerationAction(action)}
          </Button>
        );
      })}
      {isPubliclyViewable(listing.status) ? (
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/listing/${listing.slug}`}>مشاهده آگهی</Link>
        </Button>
      ) : null}
    </div>
  );
}
