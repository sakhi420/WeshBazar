'use client';

/**
 * Favorite button (master prompt §112, §30) — saved/unsaved mutation control.
 *
 * States are explicit: checking (session bootstrap), busy (ids/toggle in
 * flight), saved, unsaved, failed (transient). Guests are routed to login with
 * `next` preserved; the network-failure case announces and invites a retry.
 * The button is icon-only on cards (`overlay`) and labeled on the detail page
 * (`inline`); state changes are announced to screen readers.
 */

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { ApiError, ApiErrorCode } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthBootstrap } from '@/features/auth';
import { useFavoriteIds, useFavoriteToggle } from '@/features/favorites';
import {
  favoriteAnnouncement,
  favoriteAriaLabel,
  favoriteErrorAnnouncement,
  favoriteInlineLabel,
} from '@/features/favorites';

export interface FavoriteButtonProps {
  listingId: string;
  /** `overlay` — floating control over a card image; `inline` — detail-page action. */
  variant?: 'overlay' | 'inline';
  className?: string;
}

export function FavoriteButton({ listingId, variant = 'overlay', className }: FavoriteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useAuthBootstrap();
  const idsQuery = useFavoriteIds(status === 'ready');
  const mutation = useFavoriteToggle();

  const [announcement, setAnnouncement] = useState('');
  const [failed, setFailed] = useState(false);
  const announceTimer = useRef<number | null>(null);
  const failTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
      if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    };
  }, []);

  function announce(text: string) {
    setAnnouncement(text);
    if (announceTimer.current !== null) window.clearTimeout(announceTimer.current);
    announceTimer.current = window.setTimeout(() => setAnnouncement(''), 4000);
  }

  function failWithAnnouncement() {
    setFailed(true);
    announce(favoriteErrorAnnouncement());
    if (failTimer.current !== null) window.clearTimeout(failTimer.current);
    failTimer.current = window.setTimeout(() => setFailed(false), 2500);
  }

  const isFavorited = idsQuery.data?.includes(listingId) ?? false;
  const isReady = status === 'ready';
  const busy = status === 'checking' || (isReady && idsQuery.isPending) || mutation.isPending;
  const disabled = status === 'checking' || (isReady && idsQuery.isPending);
  const isOverlay = variant === 'overlay';
  const loginHref = `/auth/login?next=${encodeURIComponent(pathname)}`;

  function handleClick() {
    if (busy) return;
    if (status === 'anonymous' || status === 'unreachable') {
      if (status === 'anonymous') router.push(loginHref);
      else failWithAnnouncement();
      return;
    }
    if (idsQuery.isError) {
      // State unknown — retry the ids walk instead of guessing.
      void idsQuery.refetch();
      return;
    }
    const nextSaved = !isFavorited;
    mutation.mutate(
      { listingId, nextSaved },
      {
        onSuccess: () => {
          setFailed(false);
          announce(favoriteAnnouncement(nextSaved));
        },
        onError: (error) => {
          if (error instanceof ApiError) {
            if (error.status === 401) {
              router.push(loginHref);
              return;
            }
            // Conflict codes converge server-side — report the real end state.
            if (error.code === ApiErrorCode.FAVORITE_ALREADY_EXISTS) {
              announce(favoriteAnnouncement(true));
              return;
            }
            if (error.code === ApiErrorCode.FAVORITE_NOT_FOUND) {
              announce(favoriteAnnouncement(false));
              return;
            }
          }
          failWithAnnouncement();
        },
      },
    );
  }

  return (
    <>
      <Button
        type="button"
        size={isOverlay ? 'icon' : 'default'}
        variant="outline"
        aria-pressed={isFavorited}
        aria-label={isOverlay ? favoriteAriaLabel(isFavorited) : undefined}
        aria-busy={busy || undefined}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          isOverlay
            ? 'rounded-full border-border bg-surface/90 shadow-sm backdrop-blur'
            : 'min-h-11',
          failed && 'border-danger/50 text-danger',
          className,
        )}
      >
        {busy ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Heart aria-hidden className={isFavorited ? 'fill-danger text-danger' : undefined} />
        )}
        {isOverlay ? null : favoriteInlineLabel(isFavorited)}
      </Button>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
