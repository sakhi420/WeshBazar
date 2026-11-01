'use client';

import Link from 'next/link';
import { type ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import {
  INTRO_COOKIE_MAX_AGE,
  INTRO_COOKIE_NAME,
  INTRO_COOKIE_VALUE,
  MARKET_PATH,
} from './constants';

type ButtonVariant = ComponentProps<typeof Button>['variant'];
type ButtonSize = ComponentProps<typeof Button>['size'];

interface EnterMarketCtaProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}

/**
 * The single "enter the marketplace" action. On click it records the versioned
 * first-party intro cookie (a non-sensitive browser preference) and navigates
 * to the marketplace. Reused by the welcome header, hero and final CTA so the
 * cookie behaviour is identical everywhere.
 */
export function EnterMarketCta({
  variant = 'default',
  size = 'lg',
  className,
  children,
}: EnterMarketCtaProps) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link
        href={MARKET_PATH}
        onClick={() => {
          document.cookie = `${INTRO_COOKIE_NAME}=${INTRO_COOKIE_VALUE}; path=/; max-age=${INTRO_COOKIE_MAX_AGE}; samesite=lax`;
        }}
      >
        {children}
      </Link>
    </Button>
  );
}