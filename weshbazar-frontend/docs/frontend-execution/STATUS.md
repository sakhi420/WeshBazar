# STATUS — WeshBazar Frontend Execution

**آخرین به‌روزرسانی:** 2026-10-19

## فاز فعلی
- **فاز ۰** ✅ · **فاز ۱** ✅ · **فاز ۲** ✅ · **فاز ۳** ✅ · **فاز ۴ — دسترس‌پذیری** ✅ · **فاز ۵ (ویژوال) — بهبود ظاهر** ✅
- فاز بعدی: **فاز ۶ — E2E و انتشار**
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

## کار انجام‌شده در فاز ۳ (بهبود UX)
- ✅ F-14: فیلتر/مرتب‌سازی → `history:'replace'` (فقط `q` push می‌ماند).
- ✅ F-17: اسپینر داخل dropdown سگستion هنگام loading.
- ✅ F-18: حذف لینک تکراری «همهٔ آگهی‌های {دسته}».
- ✅ F-21: دکمه‌های image-tile → 44px (`size-11`).
- ✅ F-22: هم‌سازی skeleton خانه با گرید واقعی (`grid-cols-2 lg:3 xl:4`).

## کار انجام‌شده در فاز ۴ (دسترس‌پذیری)
- ✅ F-09: دکمه‌های admin → 44px (`size-11`).
- ✅ F-10: admin-nav → `nav` ساده + `aria-current="page"` (حذف سوءاستفادهٔ tablist).
- ✅ F-19: `ml-`/`mr-` → `ms-`/`me-` (admin + ActiveFilterChips).
- ✅ F-33: skip link `right-4` → `end-4`.
- ✅ F-20(a): توکن `--input` → `215 16% 47%` (#64748B، کنتراست ≥3:1).

## به‌تعویق‌افتاده
- ⏸ **F-07** (وزن 600): فایل فونت ۶۰۰ در repo نیست؛ نیاز به Vazir-SemiBold یا مهاجرت به Vazirmatn + تست چشمی 390px.
- ⏸ **F-20(b)** (آیکون‌های معنادار `text-muted` → `text-muted-foreground`) — جزئی.
- ⏸ **F-16** (CTA تماس مستقیم sticky bar) — تصمیم محصولی (reveal behind-the-click).
- ⏸ **F-23/F-24/F-25** (فوتر موبایل / OfflineBanner / ToastRegion) — اختیاری.
- 🔜 **راستی‌آزمایی manual:** کیبوردِ تب در روت‌های اصلی · axe (Playwright) · اسکرین‌شات 320/390/768/1440 — به اجرای مرورگر نیاز دارد.

## بلاکرها
- F-07 فونت ۶۰۰ (دارایی گمشده) — سایر موارد بدون بلاکر.

## گام بعدی
- **فاز ۵ — عملکرد و SEO:** اصلاح `sizes` گالری، راستی‌آزمایی JSON-LD، Lighthouse (perf ≥90 / a11y ≥95 / BP ≥95).

## دستورات
- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test`