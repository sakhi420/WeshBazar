import type { Metadata } from 'next';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeading } from '@/components/layout/page-heading';

export const metadata: Metadata = {
  title: 'درباره ما',
  alternates: { canonical: '/about' },
};

/**
 * About WeshBazar. Content is honest and derived from the product contract —
 * no invented phone numbers, addresses, certifications, or social accounts.
 */
export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeading
        title="دربارهٔ وش‌بازار"
        description="بازار آنلاین خرید و فروش اجناس نو و دست‌دوم در افغانستان."
      />
      <div className="mt-6 max-w-3xl space-y-4 text-body text-foreground">
        <p>
          وش‌بازار بستری ساده و رایگان برای خرید و فروش در افغانستان است. هدف ما این است که هر کسی
          بتواند بدون واسطه آگهی خود را ثبت کند، کالا یا خدمت مورد نیازش را جست‌وجو کند و مستقیماً
          با طرف مقابل در تماس باشد.
        </p>
        <p>
          ثبت آگهی در وش‌بازار رایگان است و جست‌وجو بر اساس شهر و دسته‌بندی انجام می‌شود تا نزدیک‌ترین
          و مرتبط‌ترین نتایج را ببینید. برای اطمینان بیشتر، پیش از هر معامله نکات ایمنی را مطالعه کنید
          و جزئیات آگهی را با دقت بررسی کنید.
        </p>
      </div>
    </PageContainer>
  );
}