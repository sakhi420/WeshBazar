# فاز ۰ + فاز ۱ — تأیید محیط اجرا + رفع ناسازگاری‌های جزئی

> **تاریخ:** 2026-10-16
> **وضعیت:** ✅ PASS (هر دو فاز)
> **وابسته به:** `FRONTEND-DEEP-AUDIT-AND-ROADMAP.md` (§۵)

---

## فاز ۰ — تأیید محیط اجرا ✅

**هدف:** مطمئن شدن از اینکه app واقعاً در مرورگر بالا می‌آید و آگهی‌های واقعی نشان می‌دهد (نه ErrorState).

### شواهد (اجرای واقعی این جلسه)
| بررسی | نتیجه |
|---|---|
| فایل `.env.local` فرانت | موجود و پیکربندی‌شده (`NEXT_PUBLIC_API_BASE_URL=http://localhost:3000`) |
| فایل `.env` بک‌اند | موجود |
| پورت ۳۰۰۰ (بک‌اند NestJS) | **open=True** (در حال اجرا) |
| پورت ۳۰۰۱ (فرانت dev) | **open=True** (در حال اجرا) |
| node / npm | v24.21.0 / 11.19.0 |
| `GET /api/v1/categories` | 200، ۳۹ دسته (اول: حیوانات و زراعت) |
| `GET /api/v1/listings?sort=newest` | 200، ۴ آگهی واقعی |
| صفحهٔ اصلی `localhost:3001/` | **آگهی‌های واقعی نمایش داده شد** (آپارتمان ۲۵٬۰۰۰ افغانی، سامسونگ ۱۸٬۵۰۰، تویوتا ۱٬۴۵۰٬۰۰۰، آیفون ۴۲٬۰۰۰) + دسته‌ها + فیلد جست‌وجو + انتخاب شهر. **هیچ error/empty state نیست.** |

### کشف مهم (خارج از scope، اما علت اصلی «زشت به‌نظر رسیدن»)
- **هر ۴ آگهیِ seed تصویر ندارند:** `primaryImage=NULL` و `images.count=0`.
- نتیجه: تمام کارت‌های صفحهٔ اصلی placeholder «بدون تصویر» نشان می‌دهند → بازار خالی/تَنک به‌نظر می‌رسد.
- این **مشکل seed بک‌اند** است (نه باگ فرانت). فرانت درست رفتار می‌کند (placeholder صادقانه وقتی تصویر null است).
- AGENTS.md: «Do not modify backend unless a concrete contract bug is discovered» → seed بدون تصویر باگ قرارداد نیست. راهکار فرانت‌ساید: **بهبود طراحی placeholder «بدون تصویر» در فاز ۲** تا کارت‌ها حتی بدون تصویر جذاب و قصدی به‌نظر برسند.

### gate
- [x] صفحهٔ خانه آگهی‌های واقعی نشان می‌دهد (نه ErrorState) → **PASS**

---

## فاز ۱ — رفع ناسازگاری‌های جزئی (A1-A5) ✅

**هدف:** از بین بردن لکه‌های نهایی که درخشش را می‌گیرند.

### اصلاحات اعمال‌شده
| # | فایل:خط | تغییر | وضعیت |
|---|---|---|---|
| A1 | `features/reports/components/report-dialog.tsx:158` | `placeholder:text-muted` → `placeholder:text-muted-foreground` | ✅ |
| A2 | `features/listings/sell/components/steps/sell-step-contact.tsx:202` | `text-left` → `text-start` (align منطقی به‌جای فیزیکی) | ✅ |
| A3a | `features/admin/components/admin-dashboard-content.tsx:265` | `۷ روز اخیر:` → `{formatNumber(7)} روز اخیر:` | ✅ |
| A3b | `features/admin/components/admin-dashboard-content.tsx:279` | `۷ روز اخیر:` → `{formatNumber(7)} روز اخیر:` | ✅ |
| A5 | `lib/api/session-cookie.ts` | افزودن helper `isHttpsOrigin()` و پرچم `;Secure` شرطی در production (در dev localhost تغییر نمی‌کند تا سشن نشکند) | ✅ |

> A4 (`sell-image-tile.tsx:50` raw `<img>`) عمداً دست‌نخورده باقی ماند: برای object URLs توجیه‌شده است (comment eslint-disable دارد). ارزیابی‌اش به فاز ۵ (عملکرد/next/image) موکول شد.

### gate
- [x] `tsc --noEmit` → **`TSC_PHASE1_EXIT=0`** (بدون خطا، خروجی خالی)
- [x] dev server روی ۳۰۰۱ تغییرات را recompile کرد (سرور از قبل بالا بود)
- [x] هیچ فایل زیرساختی بازنویسی نشد — فقط ۴ فایل با ویرایش مکانیکی کم‌حجم

---

## نتیجه و گام بعدی

**فاز ۰ + ۱ موفق.** محیط اجرا تأیید شد (app کار می‌کند) و ۵ ناسازگاری جزئی رفع شد بدون واردکردن خطا.

**فاز بعدی (۲):** ریفاین بصری کارت آگهی و صفحهٔ اصلی — بیشترین اثر دیداری. نقطهٔ شروع: **بهبود placeholder «بدون تصویر»** (چون تمام آگهی‌های فعلی بدون تصویرند) + ریفاین hero/کارت‌ها تا صفحه از «درست» به «زیبا و صیقلی» (معیار V5) ارتقا یابد.
