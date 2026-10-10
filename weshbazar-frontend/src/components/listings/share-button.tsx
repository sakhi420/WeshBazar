'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  title: string;
  /** Absolute canonical URL to share. */
  url: string;
  className?: string;
}

type ShareState = 'idle' | 'copied' | 'error';

/**
 * Share action (master prompt §23): Web Share API where available, otherwise
 * copy the canonical link. Dismissing the native sheet (AbortError) is not a
 * failure and does not trigger the copy fallback.
 */
export function ShareButton({ title, url, className }: ShareButtonProps) {
  const [state, setState] = useState<ShareState>('idle');
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    };
  }, []);

  function scheduleReset() {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setState('idle'), 2500);
  }

  async function handleShare() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setState('copied');
      scheduleReset();
    } catch {
      setState('error');
      scheduleReset();
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleShare()}
      className={cn('min-h-11', className)}
    >
      {state === 'copied' ? (
        <Check aria-hidden />
      ) : state === 'error' ? (
        <Copy aria-hidden />
      ) : (
        <Share2 aria-hidden />
      )}
      {state === 'copied' ? 'لینک کپی شد' : state === 'error' ? 'کپی لینک ناموفق بود' : 'اشتراک‌گذاری'}
    </Button>
  );
}
