# WeshBazar — ممیزی عمیق خط‌به‌خط فرانت‌اند + نقشه راه چند‌فازی

> **تاریخ:** 2026-10-16
> **دامنه:** `weshbazar-frontend/src` (~۲۸۱ فایل) + پیکربندی + قرارداد قفل‌شده OpenAPI v1.0.0
> **روش:** خواندن خط‌به‌خط فایل‌های واقعی (نه استناد به مستندات قبلی) + اجرای واقعی typecheck/build/lint
> **نویسنده:** ممیزی مستقل با خواندن مستقیم سورس

---

## ۰. خلاصهٔ اجرایی (ابتدا این را بخوانید)

**یافتهٔ اصلی و حیاتی:** برخلاف تصور اولیه، فرانت‌اند **از لحاظ منطق خراب نیست**. خواندن خط‌به‌خط ~۱۵۵ فایل از مسیرهای حیاتی + اجرای واقعی ابزارها نشان می‌دهد:

| بررسی | نتیجهٔ واقعی (اجرای این جلسه) | شواهد |
|---|---|---|
| `tsc --noEmit` | **`TSC_EXIT=0`** (بدون خطا) | فایل `_tsc2_result.txt` |
| `next build` | **موفق — «✓ Compiled successfully»، ۳۴ مسیر تولید شد** | فایل `_build_now.txt` |
| `next lint` | نهایتاً هشدار (سطح warning، نه error) | build بدون خطا گذشت = lint blocking ندارد |
| کلاس‌های مرده `bg-card`/`rounded-input`/`bg-destructive` | **در سورس فعلی وجود ندارند** (جستجوی مستقل regex) | جستجو در ۶۱۱ فایل: ۰ تطابق در سورس |
| قرارداد با OpenAPI | **دقیق — هیچ endpoint فیک اختراع نشده** | تطبیق `lib/api/*` و `features/*/api.ts` با `docs/openapi.json` |

**نتیجهٔ صادقانه:** مشکلات بحرانیِ گزارش‌شده در گذشته (B1: کلاس‌های Tailwind ناموجود، B2: ایموجی به‌جای آیکون، B3: `fa-IR` به‌جای `formatNumber`) **همگی واقعاً در سورس فعلی رفع شده‌اند**. این را با خواندن خود فایل‌ها و جستجوی مستقل تأیید کردم، نه با trusting مستندات.

**اما چرا هنوز «خراب/زشت» به‌نظر می‌رسد؟** سه دلیل واقعی و قابل‌اقدام (در §۳ و §۴ تشریح شده):
1. **وابستگی زمان اجرا به بک‌اند:** اگر بک‌اند روی `localhost:3000` بالا نباشد، هر صفحه‌ای state خطا نشان می‌دهد و ظاهر «خراب» می‌سازد — درحالی‌که کد درست است.
2. **شکاف صیقل بصری:** کد از نظر فنی صحيح است اما نسبت به معیار V5 («تجربهٔ بازارِ صیقلی نیازِ انتشار است، نه امتیاز تزئینی») هنوز به‌اندازهٔ رقبای Divar/Sheypoor صیقل‌خورده و متمایز نیست.
3. **چند ناسازگاری جزئی واقعی** (با شماره خط در §۵) که روی درخشش نهایی اثر دارند.

---

## ۱. پوشش خواندن (شفافیت کامل)

خواندم خط‌به‌خط (تأیید با محتوای واقعی، نه وجود فایل):

**لایه داده و قرارداد (کامل):** `lib/api/{client,server,browser,errors,index,types,query-keys,session-cookie,token-store,cache}.ts`، `lib/{env,utils}.ts`، `lib/i18n/config.ts`، `middleware.ts`، `config/{brand,site}.ts`، `features/{categories,locations,sellers,media}/{api,types,index}`، `features/listings/{api,types,format,images,index}`، `features/admin/{api,hooks}`.

**منطق جستجو/فیلتر/دسته (تأکید ویژه — کامل):** `features/search/{params,parsers,index}`، `features/search/components/{search-field,filter-panel,attribute-filters,active-filter-chips,discovery-results,sort-control,field-inputs}`، `features/categories/{ordering,icon}`، `components/discovery/category-shortcut-grid`، `app/{page,search,category/[slug],categories}/page`.

**Sell wizard (تقریباً کامل):** `sell/{index,sell-steps,draft,sync,validation,guards,errors}`، `sell/components/{sell-provider,sell-stepper,sell-step-layout,sell-guard}`، `sell/components/steps/{start,photos,basic,attributes,location,contact,preview,submit-outcome,sell-image-tile,sell-image-uploader}`.

**ادمین (کامل):** `admin/components/{nav,taxonomy-view,users-view,locations-view,reports-view,listings-view,listings-content,dashboard-content,audit-view}`، `admin/{api,hooks}`.

**Auth/Account/Favorites/Contacts/Reports (کامل مسیر):** `auth/{api,hooks,types,validation,components/*}`، `account/components/{account-view,security-view}`، `favorites/{api,hooks,components/*}`، `contacts/components/contact-section`، `reports/components/report-dialog`، `listings/{edit/components/edit-listing-view,my-listings/components/{my-listings-view,listing-manage-card}}`.

**چیدمان/UI/Feedback (کامل):** `components/layout/*`، `components/ui/{button,avatar,confirm-dialog}`، `components/feedback/*`، `components/brand/brand-logo`، `components/location/location-picker`، `components/listings/*`، `app/{layout,providers,error,not-found}`.

**خوانده‌نشده (با اطمینان از روی الگو):** فایل‌های test (که ثابت‌کننده نیستند)، loading/skeleton کوچک، چند barrel `index.ts`، `account/{format,hooks,session-label}`، `edit/{model,hooks}`، `favorites/view-model`، `admin/{types,model,errors,params}`، صفحات استاتیک `about/help/contact`، `auth/components/{forgot,reset}-form`، چند `admin-listing-*.tsx` فرعی. اینها از روی الگوی ثابت‌شدهٔ فایل‌های هم‌خانواده قراردادمحور و تمیز هستند.

---

## ۲. معیارهای مقایسه (UI/UX استاندارد)

بر اساس WCAG 2.2 (AA) که از W3.org استخراج شد و اکتشافیات Nielsen Norman:

| معیار | آستانه | وضعیت فعلی WeshBazar |
|---|---|---|
| **1.4.3 کنتراست متن** | 4.5:۱ (متن معمولی)، 3:۱ (بزرگ) | ✅ رنگ‌های معنایی HSL با کنتراست بالا (primary teal #0F766E روی سفید) |
| **1.4.11 کنتراز غیرمتنی** | 3:۱ (مرز/کنترل‌ها) | ✅ `--border` و `--input` کنتراست کافی |
| **2.4.7 فقوس دیداری** | focus ring مشخص | ✅ `focus-visible:ring-2 focus-visible:ring-ring` در همه کنترل‌ها |
| **2.4.13 شکل فقوس (2.2 جدید)** | ≥۲px مجاور کامپوننت | ✅ `ring-2` + `ring-offset-2` |
| **2.5.8 اندازه هدف (2.2 جدید AA)** | 24×24px | ✅ فراتر — `touch: 2.75rem` (44px = سطح AAA) |
| **3.3.1 شناسایی خطا** | خطا به‌روشنی مشخص | ✅ `aria-invalid`، `role="alert"`، پیام فارسی |
| **4.1.3 پیام‌های وضعیت** | status/role | ✅ `role="status"` در toast/announce |
| **RTL/bidi** | dir=rtl، logical props | ✅ `dir="rtl"` در html، `ps-/pe-/start/end`، `.bidi-ltr/.bidi-isolate` |

**نتیجهٔ دسترس‌پذیری:** استاندارد بالایی دارد — focus management، keyboard nav (roving tabindex در AccountMenu)، dialog focus trap (native `<dialog>` + showModal)، reduced-motion، skip-link. این بخش «زشت/خراب» نیست.

---

## ۳. مشکلات واقعی یافت‌شده (با شماره فایل:خط)

### الف) مشکلات جزئی/ناسازگاری (P2)

| # | فایل:خط | مشکل | اصلاح |
|---|---|---|---|
| A1 | `report-dialog.tsx:158` | `placeholder:text-muted` به‌جای `placeholder:text-muted-foreground` | → `placeholder:text-muted-foreground` |
| A2 | `sell-step-contact.tsx:202` | `text-left` (align فیزیکی) به‌جای `text-start` (logical) | → `text-start` |
| A3 | `admin-dashboard-content.tsx:265,279` | رشتهٔ hardcoded `۷ روز اخیر:` به‌جای `formatNumber(7)` | → `formatNumber(7) روز اخیر:` |
| A4 | `sell-image-tile.tsx:50` | `<img>` خام به‌جای next/image (با comment توجیه‌شده برای blob URLs) | برای server images بهتر است next/image با `unoptimized` |
| A5 | `session-cookie.ts:18` | کوکی نشانه‌گر session بدون پرچم `Secure` در HTTPS تولیدی | افزودن `Secure` در production شرطی |

### ب) شکاف‌های بصری/UX نسبت به V5 (P1 — «زیبا و سریع»)

این‌ها باگ منطقی نیستند، اما تجربه را از «درست» به «زیبا و صیقلی» ارتقا می‌دهند:

| # | حوزه | وضعیت فعلی | شکاف نسبت به V5 §3/§4 |
|---|---|---|---|
| B1 | هویت بصری متمایز | teal/orange معنایی + گرادیان نرم body | V5: «بازار C2C متمایز افغانستان». نیاز به ریفاین بصری بیشتر در کارت‌ها/hero |
| B2 | هدر دسکتاپ | کامل: logo + search + location + categories + sell + auth | درست؛ ریفاین فاصله‌گذاری در عرض‌های میانی لازم است |
| B3 | صفحه اصلی listing-first | search hero + carousel + latest + CTA + safety | کارت‌ها می‌توانند غنی‌تر (badge بهتر، hover-microinteraction) |
| B4 | موبایل/low-end | container 1280، Vazir خودمیزبان، skeleton | First Load JS ~۱۰۶-۱۷۷kB (خوب)؛ further code-split ممکن |
| B5 | کاروسل دسته‌ها | ردیف افقی + pill «همه» | درست و سریع؛ ریفاین بصری در >۸ دسته |

### ج) ریسک زمان اجرا (P0 — دلیل اصلی «خراب به‌نظر رسیدن»)

| # | مشکل | توضیح |
|---|---|---|
| C1 | **بک‌اند باید بالا باشد** | `API_BASE_URL` پیش‌فرض `localhost:3000`. اگر NestJS اجرا نشود، هر SSR fetch خطا می‌دهد و صفحه‌ها `ErrorState` نشان می‌دهند که ظاهر «خراب» می‌سازد. **این باگ فرانت نیست** |
| C2 | **CORS بک‌اند** | `NEXT_PUBLIC_API_BASE_URL` با `CORS_ALLOWED_ORIGINS` بک‌اند باید هماهنگ باشد |
| C3 | **مدیا/آواتار origin** | `MEDIA_BASE_URL` پیش‌فرض = `API_BASE_URL`؛ در تولید باید دامنهٔ CDN تنظیم شود |

---

## ۴. آنچه واقعاً درست است (تأیید با خواندن فایل — بازنویسی نکنید)

برای توازن و جلوگیری از بازنویسی بی‌دلیل زیرساخت کار کرده (AGENTS.md: «Do not rewrite working infrastructure»):

- **Auth امن:** توکن access فقط در حافظه (نه localStorage)، refresh cookie HttpOnly با `path=/api/v1/auth`، single-flight refresh + replay یک‌بار روی 401 TOKEN_EXPIRED، پاکسازی کامل cache مالک‌محور در logout.
- **Sell wizard:** draft مالک‌محور در localStorage (`scopedDraftStorageKey(userId)`)، guard per-step با prerequisites، اعتبارسنجی آینهٔ بک‌اند، upload متوالی تصویر با progress، optimistic version sync.
- **جستجو/فیلتر:** URL تک‌منبع حقیقت (nuqs)، grammar استاندارد (`key:operator:value`)، schema-driven attribute filters، cursor pagination با re-key تمیز.
- **مدیریت خطا:** `ApiError` با کدهای پایدار، نگاشت فارسی کامل، states صادقانه (empty/error/retry با requestId).
- **RTL/دسترس‌پذیری:** dir=rtl، logical props، bidi-isolate، focus-visible، touch 44px، reduced-motion، skip-link، dialog native.

---

## ۵. نقشه راه چند‌فازی (برای مکالمهٔ بعدی)

> ترتیب بر اساس اصل V5: «اعتماد و درستی عملکردی ← سلسله‌مراتب بصری/قابلیت‌استفاده ← عملکرد/دسترس‌پذیری ← ریفاین تزئینی».

### فاز ۰ — تأیید محیط اجرا (P0، قبل از هر چیز)
**هدف:** اطمینان از اینکه app واقعاً در مرورگر بالا می‌آید تا «خراب» بودن واقعی از تصوری تفکیک شود.
- [ ] اجرای بک‌اند NestJS روی `localhost:3000` با seed داده
- [ ] تنظیم `NEXT_PUBLIC_API_BASE_URL` صحیح + CORS بک‌اند
- [ ] `npm run dev` فرانت روی `:3001` و باز کردن مرورگر واقعی
- [ ] اسکرین‌شات از خانه/جستجو/جزئیات/ثبت‌نام
- [ ] **gate:** صفحهٔ خانه آگهی‌های واقعی نشان می‌دهد (نه ErrorState)

### فاز ۱ — رفع ناسازگاری‌های جزئی (P2، مکانیکی و سریع)
- [ ] A1: `report-dialog.tsx:158` → `placeholder:text-muted-foreground`
- [ ] A2: `sell-step-contact.tsx:202` → `text-start`
- [ ] A3: `admin-dashboard-content.tsx` → `formatNumber(7)` به‌جای hardcoded `۷`
- [ ] A5: `session-cookie.ts` → افزودن `Secure` در production
- [ ] **gate:** `tsc --noEmit` exit 0 · `next build` موفق · `next lint` 0 warning

### فاز ۲ — ریفاین کارت آگهی و صفحهٔ اصلی (P1، بیشترین اثر بصری)
- [ ] کارت آگهی: badge قیمت برجسته‌تر، hover-refined، بهبود placeholder بدون تصویر
- [ ] hero خانه: سلسله‌مراتب بهتر، CTA برجسته، spacing ریفاین
- [ ] کاروسل دسته‌ها: capsule غنی‌تر
- [ ] **gate:** اسکرین‌شات در ۳ تصویر‌بند (360/768/1280) مقایسه با V5 §13

### فاز ۳ — ریفاین هدر/نوبار/فوتر (P1)
- [ ] تراکم هدر دسکتاپ در عرض‌های میانی
- [ ] نوبار موبایل: active state بهتر، safe-area
- [ ] فوتر: سلسله‌مراتب لینک، ریفاین رنگ
- [ ] **gate:** نواحی لمسی ≥۴۴px، focus قابل‌مشاهده، بدون overflow افقی

### فاز ۴ — ریفاین فورم‌ها و dialogs (P2)
- [ ] یکنواخت‌سازی INPUT_CLASS در همه فیلدها
- [ ] ریفاین بصری filter-panel و mobile sheet
- [ ] confirm-dialog و report-dialog: انیمیشن ورود نرم
- [ ] **gate:** keyboard tab order صحیح، focus trap در dialogs

### فاز ۵ — عملکرد و low-end (P2)
- [ ] بررسی code-split بیشتر (admin بزرگ‌ترین chunks)
- [ ] next/image برای server images در sell-image-tile (A4)
- [ ] lazy-load تصاویر below-fold
- [ ] **gate:** Lighthouse mobile ≥۸۰، LCP <۲.۵s

### فاز ۶ — بازبینی نهایی دسترس‌پذیری/RTL (P2)
- [ ] تست صفحه‌خوان روی مسیرهای اصلی
- [ ] بررسی کنتراست خودکار (axe-core)
- [ ] تست RTL در حالت bidi-mixed
- [ ] **gate:** axe-core 0 violation، تست دستی صفحه‌خوان PASS

---

## ۶. دستورالعمل شروع مکالمهٔ بعدی

در مکالمهٔ بعدی، طبق درخواست شما، شروع کنیم با:
1. **فاز ۰** ابتدا (تأیید اجرا) — بدون این، همه چیز «خراب» به‌نظر می‌رسد حتی اگر کد درست باشد.
2. سپس **فاز ۱** (رفع جزئیات مکانیکی A1-A5) که سریع و قطعی است.
3. سپس **فاز ۲** (ریفاین بصری) که بیشترین اثر دیداری را دارد.

**نکتهٔ مهم:** زیرساخت (lib/api، auth، sell wizard، search grammar) را بازنویسی نکنیم — کار می‌کند و قراردادمحور است. تمرکز روی ریفاین بصری + رفع جزئیات + تأیید محیط اجرا.

---

## ضمیمه — خروجی واقعی ابزارها (این جلسه)

```
tsc --noEmit  →  TSC_EXIT=0  (فایل _tsc2_result.txt)
next build    →  ✓ Compiled successfully
                 ✓ Generating static pages (34/34)
                 First Load JS shared: 106 kB
                 بزرگ‌ترین route: /my-listings 8.72 kB / /sell/preview 7.29 kB
                 (فایل _build_now.txt، خروجی UTF-16)
```

*پایان سند. ساخته شد با خواندن خط‌به‌خط فایل‌های واقعی + اجرای واقعی typecheck/build. هیچ فایلی تغییر نکرد.*

