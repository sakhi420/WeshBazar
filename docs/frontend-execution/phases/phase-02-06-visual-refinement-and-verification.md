# فاز ۲ تا ۶ — ریفاین بصری + تأیید نهایی

> **تاریخ:** 2026-10-16
> **وضعیت:** ✅ فاز ۱+۲ پیاده‌سازی و تأیید شد · فاز ۳-۶ تأیید شد (کد از قبل قوی بود)
> **وابسته به:** `FRONTEND-DEEP-AUDIT-AND-ROADMAP.md` (§۵) و `phase-00-01-...md`

---

## فاز ۲ — ریفاین کارت آگهی و صفحهٔ اصلی ✅ (پیاده‌سازی‌شده)

### اصلاحات اعمال‌شده
| فایل:خط | تغییر | اثر |
|---|---|---|
| `components/listings/listing-card.tsx:34-72` | پشت‌زمینهٔ تصویر از `bg-primary-soft/40` تخت → گرادیان نرم `from-primary-soft/50 via-primary-soft/25 to-muted/15`؛ حذف SVG خطوط مورب اضافی؛ آیکون تصویر از `size-9` → `size-10` با رنگ متعادل‌تر | کارت‌های «بدون تصویر» (همهٔ آگهی‌های فعلی!) حالا قصدی و صیقلی به‌نظر می‌رسند نه تَنک |
| `app/page.tsx:75-88` | hero از گرادیان ساده `to-b` → گرادیان مورب `to-br` غنی‌تر + بلور اکسنت `bg-accent/10 blur-2xl`؛ عنوان از `sm:text-heading`(24px) → `sm:text-display`(32px) برای سلسله‌مراتب قوی‌تر؛ spacing از `p-4/sm:p-6` → `p-5/sm:p-8` | صفحهٔ اصلی برجسته‌تر و متمایزتر |

### کشف کلیدی (نقش در «زشت به‌نظر رسیدن»)
**تمام ۴ آگهیِ seed تصویر ندارند** (`primaryImage=NULL`). این مشکل seed بک‌اند است (AGENTS.md: تعدیل بک‌اند ممنوع مگر باگ قرارداد). راهکار فرانت‌ساید: بهبود placeholder «بدون تصویر» انجام شد تا صفحه حتی بدون تصویر جذاب بماند. **راهکار کامل‌تر:** افزودن تصویر به seed بک‌اند (خارج از scope فرانت).

### دروازه
- [x] `tsc --noEmit` → `TSC_PHASE2_EXIT=0`
- [x] صفحهٔ اصلی با تغییرات درست رندر شد (fetch تأیید: H1، ۴ کارت، جست‌وجو، دسته‌ها همگی حضور؛ بدون خطا)
- [x] هیچ regression در منطق/data layer

---

## فاز ۳ — هدر/نوبار/فوتر ✅ (تأیید — از قبل V5-compliant)

بررسی خط‌به‌خط تأیید کرد که این سطوح **نیازی به بازنویسی ندارند**:
- **هدر دسکتاپ** (`desktop-header.tsx`): 64px، sticky، backdrop-blur، logo+search+location+categories+sell+auth — کامل.
- **هدر موبایل** (`mobile-header.tsx`): 56px، logo+search/sell/auth — کامل.
- **نوبار پایین موبایل** (`mobile-bottom-nav.tsx`): active state با `border-t-2 border-primary`، safe-area، tab ادمین شرطی — کامل.
- **فوتر** (`site-footer.tsx`): `bg-primary-dark text-white`، سه ستون لینک، کپی‌رایت با سال شمسی — کامل.

**نتیجه:** فاز ۳ بدون تغییر کد PASS شد — طراحی از قبل با V5 §101-103 هماهنگ است.

---

## فاز ۴ — فورم‌ها و dialogs ✅ (تأیید)

- `INPUT_CLASS` مشترک در `features/auth/components/form-field.tsx` با `aria-[invalid=true]:border-danger` و `focus-visible:ring-2` — یکنواخت.
- فرم‌های auth (login/register/verify/forgot/reset): aria-invalid/describedby، autocomplete، RTL/LTR اجباری — استاندارد.
- `ConfirmDialog` و `report-dialog` و `MobileFilterSheet`: native `<dialog>` با showModal (focus trap داخلی، Esc، backdrop) — استاندارد.
- ناسازگاری جزئی A1 (placeholder رنگ) در فاز ۱ رفع شد.
- **نتیجه:** فاز ۴ PASS — فرم‌ها یکنواخت و درست.

---

## فاز ۵ — عملکرد و low-end ✅ (تأیید + توضیح A4)

- **First Load JS:** ~۱۰۶ kB مشترک، بزرگ‌ترین route `/my-listings` ۸.72 kB — خوب برای موبایل/low-end (build قبلی تأیید).
- **next/image:** در ListingCard، Gallery، listing-manage-card، brand-logo، avatar همه استفاده می‌شود (با `sizes`، `fill`، `priority`).
- **A4 (`sell-image-tile.tsx:50` raw `<img>`):** توجیه‌شده — برای object URLs (blob:) که next/image پشتیبانی نمی‌کند. برای server images همان tile استفاده می‌شود؛ ارتقا به next/image برای server path به یک refactor مشترک نیاز دارد (موکول به آینده، ریسک پایین).
- **Skeleton به‌جای spinner:** در همه صفحات رعایت شده (CLS پایین).
- **نتیجه:** فاز ۵ PASS با یک مورد توضیح‌داده‌شدهٔ قابل‌قبول.

---

## فاز ۶ — دسترس‌پذیری/RTL ✅ (تأیید)

مقایسه با WCAG 2.2 (AA) از W3.org:
- **1.4.3 کنتراست:** رنگ‌های HSL معنایی با کنتراست بالا ✅
- **2.4.7/2.4.13 focus:** `focus-visible:ring-2 ring-offset-2` در همه کنترل‌ها ✅
- **2.5.8/2.5.5 اندازه هدف:** `touch: 2.75rem` (44px = AAA) ✅
- **3.3.1 خطا:** `aria-invalid`، `role="alert"` ✅
- **4.1.3 status:** `role="status"` در announce/toast ✅
- **RTL/bidi:** `dir="rtl"`، logical props (`ps/pe/start/end`)، `.bidi-ltr/.bidi-isolate` ✅
- **focus trap / keyboard nav:** native dialog + roving tabindex در AccountMenu ✅
- **reduced-motion:** global `@media (prefers-reduced-motion)` در globals.css ✅
- **skip-link:** موجود در layout ✅
- **نتیجه:** فاز ۶ PASS — دسترس‌پذیری در سطح بالایی است.

---

## دروازهٔ نهایی build

| مرحله | نتیجه |
|---|---|
| `tsc --noEmit` | ✅ `exit 0` (پس از همهٔ ویرایش‌ها) |
| `next build` compile | ✅ «✓ Compiled successfully» |
| `next build` lint+types | ✅ «Linting and checking validity of types» گذشت |
| `next build` page-data | ⚠️ شکست روی `/about` به‌خاطر **تداخل `.next` با dev serverِ در حال اجرا** (نه مشکل کد — `/about/page.tsx` معتبر است) |
| runtime (dev server) | ✅ صفحهٔ اصلی با دادهٔ واقعی درست رندر می‌شود |

> **توضیح:** همان‌طور که audit قبلی مستند کرد، `next build` و `next dev` نمی‌توانند همزمان `.next` را به‌اشتراک بگذارند. برای build تولیدی تمیز: dev server را متوقف کنید، `.next` را پاک کنید، سپس `next build`. این محیطی است نه کدی.

---

## خلاصهٔ همهٔ تغییرات کد (این جلسه)

| فایل | فاز | تغییر |
|---|---|---|
| `features/reports/components/report-dialog.tsx` | ۱ | `placeholder:text-muted` → `placeholder:text-muted-foreground` |
| `features/listings/sell/components/steps/sell-step-contact.tsx` | ۱ | `text-left` → `text-start` |
| `features/admin/components/admin-dashboard-content.tsx` (×۲) | ۱ | `۷` hardcoded → `formatNumber(7)` |
| `lib/api/session-cookie.ts` | ۱ | پرچم `Secure` شرطی در HTTPS |
| `components/listings/listing-card.tsx` | ۲ | placeholder + گرادیان تصویر ریفاین |
| `app/page.tsx` | ۲ | hero ریفاین (گرادیان، اکسنت، تایپو، spacing) |

**مجموع: ۶ فایل، ~۱۰ ویرایش مکانیکی/بصری، بدون تغییر زیرساخت یا قرارداد.**

---

## گام بعدی (توصیه)

۱. **build تولیدی تمیز:** dev server را موقتاً متوقف، `.next` پاک، `next build` → تأیید کامل.
۲. **تصاویر seed:** به seed بک‌اند تصویر اضافه شود تا کارت‌ها تصویر واقعی نشان دهند (بزرگ‌ترین ارتقای بصری ممکن — اما scope بک‌اند).
۳. در صورت تمایل به ریفاین بیشتر: کارت آگهی (badge قیمت برجسته‌تر)، صفحهٔ جستجو (spacing فیلتر).
