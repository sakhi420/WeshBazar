import type { Metadata } from 'next';
import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'صفحه پیدا نشد',
  robots: { index: false, follow: false },
};

/** Global 404 (master prompt §50). Honest, RTL, with a clear way back. */
export default function NotFound() {
  return (
    <PageContainer>
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
          <FileQuestion className="size-8" aria-hidden />
        </span>
        <p className="bidi-ltr text-display font-bold text-muted-foreground">۴۰۴</p>
        <h1 className="text-heading font-bold text-foreground">صفحه پیدا نشد</h1>
        <p className="max-w-prose text-ui text-muted-foreground">
          این آگهی یا صفحه ممکن است حذف شده، فروخته شده، یا نشانی آن تغییر کرده باشد.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/market">بازگشت به صفحه اصلی</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">جست‌وجوی آگهی‌ها</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
