'use client';

/**
 * Sell flow client shell (master prompt §34–§41, §437).
 *
 * Bridges the auth context into the SellProvider so the draft is always scoped
 * to the current user. Without this, a shared device could leak drafts
 * between accounts after logout/login.
 */
import type { ReactNode } from 'react';
import { SellProvider } from '@/features/listings/sell/components/sell-provider';
import { useAuthBootstrap } from '@/features/auth';

export function SellClientShell({ children }: { children: ReactNode }) {
  const { user } = useAuthBootstrap();
  return <SellProvider userId={user?.id ?? null}>{children}</SellProvider>;
}