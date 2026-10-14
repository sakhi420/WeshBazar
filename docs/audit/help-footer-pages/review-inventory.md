# Review Inventory

بررسی‌شده در تاریخ 2026-10-14. سطح: بازبینی کد + build/test — نه بازبینی دستی بصری.

## فایل‌های بررسی‌شده

| فایل | مسیر | نوع | وضعیت بررسی |
| --- | --- | --- | --- |
| فوتر | `src/components/layout/site-footer.tsx` | Server | ✅ خوانده شد |
| صفحه درباره | `src/app/about/page.tsx` | Server | ✅ خوانده شد |
| صفحه مرکز راهنمایی | `src/app/help/page.tsx` | Server | ✅ خوانده شد |
| صفحه نکات ایمنی | `src/app/help/safety/page.tsx` | Server | ✅ خوانده شد |
| صفحه تماس | `src/app/contact/page.tsx` | Server | ✅ خوانده شد |
| گزارش آگهی | `src/features/reports/components/report-dialog.tsx` | Client | ✅ وجود تأیید شد |
| تماس با فروشنده | `src/features/contacts/components/contact-section.tsx` | Client | ✅ وجود تأیید شد |

## لینک‌های فوتر (وضعیت واقعی)

| متن | `href` | صفحهٔ مقصد | وضعیت |
| --- | --- | --- | --- |
| درباره ما | `/about` | `src/app/about/page.tsx` | ✅ موجود |
| نکات ایمنی | `/help/safety` | `src/app/help/safety/page.tsx` | ✅ موجود |
| مرکز راهنمایی | `/help` | `src/app/help/page.tsx` | ✅ موجود |
| تماس با ما | `/contact` | `src/app/contact/page.tsx` | ✅ موجود |

«راهنما» عنصر `h2` (عنوان گروه) است، نه لینک — `href` ندارد.

## قابلیت‌های تأییدشده

| قابلیت | مکانیزم | منبع |
| --- | --- | --- |
| گزارش آگهی | `ReportDialog` با دلایل (کلاه‌برداری، سرقتی، کالای ممنوع، اسپم، گمراه‌کننده، تکراری، توهین‌آمیز، سایر) | `report-dialog.tsx`؛ قرارداد `.devin/rules/api-contract.md` |
| تماس با فروشنده | روش‌های تماس `PHONE` / `WHATSAPP` / `TELEGRAM` | `contact-section.tsx`؛ قرارداد API |
| احراز هویت | شمارهٔ تلفن + تأیید OTP | قرارداد API |

## تست‌ها

| مورد | وضعیت |
| --- | --- |
| تست اختصاصی برای ۴ صفحهٔ اطلاعاتی | ❌ موجود نیست (صفحات Server و محتوایی‌اند) |
| تست فوتر (لینک‌ها) | ✅ `site-footer.test.tsx` (تأیید چهار لینک راهنما) |
| اجرای کل تست‌ها | ✅ 30 سوئیت، 257 تست پاس |
| build تولید استاتیک | ✅ 34 صفحه (شامل ۴ صفحهٔ اطلاعاتی) |

## وابستگی‌ها

- `PageContainer`, `PageHeading` (اجزای مشترک layout) — استفاده‌شده در هر ۴ صفحه.
- `content` هیچ خطای نمایش/بارگذاری مستقل ندارد (تماماً ثابت و Server).