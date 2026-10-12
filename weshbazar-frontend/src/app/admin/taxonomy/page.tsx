import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { AdminTaxonomyView } from '@/features/admin/components';

export const metadata: Metadata = {
  title: 'دسته‌بندی‌ها و ویژگی‌ها',
  robots: { index: false, follow: false },
};

export default function AdminTaxonomyPage() {
  return (
    <PageContainer>
      <h1 className="text-heading font-bold text-foreground">مدیریت دسته‌بندی‌ها</h1>
      <p className="mt-2 text-ui text-muted-foreground">دسته‌بندی‌ها و ویژگی‌های سفارشی هر دسته.</p>
      <div className="mt-6"><AdminTaxonomyView /></div>
    </PageContainer>
  );
}