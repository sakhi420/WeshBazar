'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SHOW_AFTER_SCROLL = 400;

/**
 * Floating "back to top" affordance (P3-001). Appears once the user scrolls
 * past the first viewport and returns them to the top without losing state.
 * Kept mounted (hidden via opacity + pointer-events, then made unreachable
 * with tabIndex=-1) so layout and focus stay stable across the toggle.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > SHOW_AFTER_SCROLL);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <Button
      variant="secondary"
      size="icon"
      aria-label="بازگشت به بالای صفحه"
      tabIndex={visible ? undefined : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        'fixed end-4 bottom-20 z-header rounded-card shadow-lg transition-opacity duration-small lg:bottom-6',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <ArrowUp aria-hidden />
    </Button>
  );
}