# STATUS — WeshBazar Frontend Execution

**آخرین به‌روزرسانی:** 2026-10-19

## فاز فعلی
- **فاز ۰ — قفل پایلاین** ✅ · **فاز ۱ — منطق بحرانی** ✅ · **فاز ۲ — سیستم دیزاین و برند** ✅
- فاز بعدی: **فاز ۳ — بهبود UX**
- ممیزی جامع: `AUDIT-2026-10-19-full-frontend-review.md`

## gateهای تکمیل‌شده (فاز ۰+۱)
- [x] `tsc --noEmit` → 0 خطا
- [x] `jest` → 44 سویت / 300 تست
- [x] `next lint` → بدون هشدار
- [x] `next build` → 36/36 صفحه

## کار انجام‌شده در فاز ۰
- ✅ F-01: انتقال onClick کارت به client boundary (`listing-card-link.tsx`) + 2 تست رگرسیو.
- ✅ F-28: حذف لاگ‌های قدیمی تست/بیلد.

## کار انجام‌شده در فاز ۱ (منطق بحرانی)
- ✅ F-02: خانه — شکست شبکه → `ErrorState` (نه «خالی») + تست رگرسیو `app/page.test.tsx`.
- ✅ F-03: حذف SearchField تکراری در بدنهٔ `/search`.
- ✅ F-04: LocationPicker + filter-panel + active-filter-chips — حالت خطا/retry و حذف `!` غیرصفر + تست failure `location-picker.test.tsx`.
- ✅ F-13: برچسب «علاقه‌مندی‌ها» در bottom-nav (+ آپدیت تست).
- ✅ F-26: اصلاح کامنت‌های منسوخ endpoint فروشنده (`types.ts`، `seller/[slug]/page.tsx`).
- ✅ F-27: بازنویسی `README.md`.
- ✅ F-31: حذف `RouteScaffold` مرده.
- ✅ F-32: انتقال `gpt.md` به `docs/`.

## کار انجام‌شده در فاز ۲ (دیزاین/برند)
- ✅ F-05: گرید دسته‌بندی یکپارچهٔ teal؛ «همه» با accent.
- ✅ F-06/F-30: هیرو فشردهٔ search-first (حذف گرادیان/اورب/animate-fade-up؛ H1 کوچک).
- ✅ F-08: بج «فروخته شد» → `bg-foreground/80` (خنثی).
- ✅ F-11: متن 11px → `text-caption`.
- ✅ F-12: CTA «ثبت آگهی» موبایل همیشه نمایان (+ aria-label).
- ✅ F-15: سایز تایپ دلخواه → توکن (`text-section`/`text-heading`).
- ✅ F-29: نام متغیر فونت `--font-vazir`.

## به‌تعویق‌افتاده
- ⏸ **F-07** (وزن 600): فایل فونت ۶۰۰ در repo نیست؛ نیاز به Vazir-SemiBold یا مهاجرت به Vazirmatn + تست چشمی 390px.
- ⏸ **F-09** (target size دکمه‌های admin) → فاز ۳/۴.
- ⏸ **F-20** (کنتراست مرز input/آیکون) → فاز ۴.

## بلاکرها
- F-07 فونت ۶۰۰ (دارایی گمشده) — سایر موارد بدون بلاکر.

## گام بعدی
- **فاز ۳ — بهبود UX:** F-14 (history push فیلترها)، F-16 (نوار تماس sticky)، F-17 (نشانه بارگذاری suggestion)، F-18 (لینک تکراری)، F-21 (image-tile 44px)، F-22 (هم‌سازی skeleton)، F-23 (فوتر فشرده).

## دستورات
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test`