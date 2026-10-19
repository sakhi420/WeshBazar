# STATUS — WeshBazar Frontend Execution

**آخرین به‌روزرسانی:** 2026-10-19

## فاز فعلی
- **فاز ۰ — قفل پایلاین و تمیزکاری** ✅ تکمیل شد
- **فاز ۱ — منطق بحرانی** ✅ تکمیل شد
- فاز بعدی: **فاز ۲ — بصری و WCAG**
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

## بلاکرها
- ندارد.

## گام بعدی
- **فاز ۲ — بصری و WCAG:** پالت grid دسته‌بندی، سایز Hero/تاخوردگی، وزن قلم semibold، بج قرمز «فروخته شد»، متن 11px، سایزهای تایپ دلخواه، قابلیت دیده‌شدن Sell CTA موبایل، کنتراست حاشیه ورودی، دکمه‌های icon admin.

## دستورات
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test`