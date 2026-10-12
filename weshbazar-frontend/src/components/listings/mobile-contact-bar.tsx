'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileContactBarProps {
  priceLabel: string;
  isSold?: boolean;
  contactSectionId?: string;
}

/**
 * Sticky bottom bar on mobile that shows price + scrolls to contact section.
 * Only rendered on < lg screens.
 */
export function MobileContactBar({ priceLabel, isSold, contactSectionId = 'listing-contact-section' }: MobileContactBarProps) {
  function scrollToContact() {
    const el = document.getElementById(contactSectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return (
    <div className="lg:hidden sticky bottom-bottom-nav z-30 -mx-4 border-t border-border bg-surface px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-card-title font-bold text-foreground">{priceLabel}</p>
        {!isSold ? (
          <Button size="sm" onClick={scrollToContact}>
            <Phone aria-hidden />
            تماس با فروشنده
          </Button>
        ) : null}
      </div>
    </div>
  );
}