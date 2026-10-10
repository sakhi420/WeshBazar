import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { EmptyState } from '@/components/feedback/empty-state';
import { Button } from '@/components/ui/button';

/**
 * Honest access gate for the admin area (master prompt §42): hidden UI is
 * not security — a signed-in USER (or a stale-role session the backend 403s)
 * gets a clear dead end instead of a redirect loop.
 */
export function AdminAccessDenied() {
  return (
    <EmptyState
      icon={ShieldAlert}
      title="دسترسی به پنل مدیریت ندارید"
      description="این بخش فقط برای مدیران و ناظران در دسترس است. اگر فکر می‌کنید اشتباهی رخ داده، دوباره وارد حساب خود شوید."
      action={
        <Button asChild variant="outline" size="sm">
          <Link href="/account">بازگشت به حساب من</Link>
        </Button>
      }
    />
  );
}
