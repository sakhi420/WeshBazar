import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PageContainer } from '@/components/layout/page-container';
import { SellClientShell } from '@/features/listings/sell/components/sell-client-shell';

export const metadata: Metadata = {
  title: 'ثبت آگهی',
  robots: { index: false, follow: false },
};

/**
 * Sell flow shell (master prompt §34–§41). The provider keeps the draft
 * (localStorage-backed, owner-scoped per §437) and the queued photos alive
 * across step navigations; every page below mounts its own client step
 * behind a per-step guard.
 */
export default function SellLayout({ children }: { children: ReactNode }) {
  return (
    <SellClientShell>
      <PageContainer>{children}</PageContainer>
    </SellClientShell>
  );
}
