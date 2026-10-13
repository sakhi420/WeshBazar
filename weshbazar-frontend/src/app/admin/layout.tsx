import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminNav } from '@/features/admin/components/admin-nav';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Shared admin shell: renders the section‑wide navigation tabs above
 * every admin page. Individual pages provide their own PageContainer,
 * title and description so each surface keeps its unique identity.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}