# ویش‌بازار — ممیزی جامع فرانت‌اند و نقشه‌راه فازبندی‌شده

**تاریخ:** 2026-10-19
**مکمل به:** `audit/04_reactive_remediation_spec.md` (2026-10-11) — این سند آن را به‌روز می‌کند و ادامه می‌دهد
**دامنه:** تمام فایل‌های `weshbazar-frontend` (۲۵ فایل سورس + ۴۰ فایل تست + ۲۳ فایل پیکربندی)
**مبنای قرارداد:** Master Prompt V5 (`WeshBazar_Frontend_Master_Prompt_V5_EN(1).md`) + `weshbazar-backend/docs/openapi.json` + `AGENTS.md`

---

## ۱. خلاصهٔ اجرایی

کل کد فرانت‌اند **فایل‌به‌فایل** خوانده شد و چهار چک واقعی اجرا گردید (typecheck، jest، lint، production build). نتیجه:

**نکتهٔ کلیدی:** معماری کلی فرانت‌اند **سالم و قابل‌اعتماد** است — مرز API متمرکز و سخت‌گیرانه، ایزولاسیون نشست/پیش‌نویس بین حساب‌ها، مدیریت نسخه (optimistic version guard)، حالت‌های صادقانهٔ خالی/خطا، و RTL با properties منطقی تقریباً همه‌جا رعایت شده است. **اما** یک باگ P0 پیدا شد که **build تولید را شکسته** بود و صفحهٔ اصلی (مهم‌ترین صفحه) را در حالت dev هم از رندر بازداشت — دقیقاً همان «خرابی منطقی کل فرانت» که حس می‌شد:

| # | یافتهٔ مهم‌ترین | وضعیت |
|---|---|---|
| F-01 | `ListingCard` (کامپوننت سرور) هندلر `onClick` را به `next/link` (کامپوننت کلاینت) می‌فرستد → `next build` روی `/` شکست می‌خورد و صفحهٔ اصلی در dev هم خطای RSC می‌دهد | **در همین ممیزی رفع و با build موفق (36/36) تأیید شد** |
| F-02 | صفحهٔ اصلی: خطای شبکه (سرور آفلاین) را به‌جای ErrorState، پیام دروغین «هنوز آگهی‌ای ثبت نشده است» نشان می‌دهد | باز — فاز ۱ |
| F-03 | دو نوار جست‌وجوی هم‌زمان در صفحهٔ /search (هدر + بدنه) | باز — فاز ۱ |
| F-05 | رنگ‌های قوس‌کمانی (blue/green/purple/pink/red/…) در گرید دسته‌بندی‌ها — نقض پالت قفل‌شدهٔ برند §10 | باز — فاز ۲ |
| F-06 | هیرو بزرگ گرادیانی صفحهٔ اصلی — نقض §16/§55 (آگهی‌ها باید زود دیده شوند) | باز — فاز ۲ |

**شواهد پایلاین (اجرا شده):**

| چک | نتیجه |
|---|---|
| `npx tsc --noEmit` | ✅ 0 خطا |
| `npx jest` | ✅ 40 سویت / 292 تست — همه سبز (17.9 ثانیه) |
| `npx next lint` | ✅ هیچ هشدار/خطایی |
| `npx next build` (قبل از F-01) | ❌ شکست: `Event handlers cannot be passed to Client Component props` در پیش‌رندر `/` |
| `npx next build` (بعد از F-01) | ✅ موفق — 36/36 صفحه؛ First Load JS: مشترک 106 kB، صفحهٔ اصلی 164 kB |

**تعداد یافته‌ها:** 1×P0 (رفع‌شده و تأییدشده) + 13×P1 + 14×P2 + 8×P3 = 36 یافته.

**نمرهٔ تخمینی دریل V5.4 (100 امتیازی) برای صفحهٔ اصلی قبل از اصلاحات:** ≈ 76/100 (زیر هدف 88). بعد از فاز ۲ و ۳: تخمین ≈ 90+/100. جزئیات در بخش ۵.

---

## ۲. روش‌شناسی و منابع مقایسه

1. **خواندن تک‌تک فایل‌ها:** فهرست کامل در پیوست A. هیچ فایل سورس بدون خواندن کامل بررسی نشد (فقط 5 فایل فونت woff2 باینری هستند).
2. **اجرای واقعی:** چهار دستور پایلاین بالا روی خود رپوزیتوری اجرا شدند (خروجی‌ها در پیوست C).
3. **مقایسهٔ قرارداد API:** همهٔ endpointهای مصرف‌شده در فرانت‌اند با `weshbazar-backend/docs/openapi.json` (70 مسیر) تطبیق داده شدند — **هیچ endpoint ساختگی پیدا نشد** (فقط 2 کامنت منسوخ که ادعای اشتباه دارند؛ F-26).
4. **مقایسهٔ UI/UX با استانداردها:**
   - **WCAG 2.2 (W3C):** quickref رسمی از w3.org دریافت و بررسی شد؛ معیارهای جدید 2.2 (2.4.11، 2.5.7، 2.5.8، 3.2.6، 3.3.7، 3.3.8) + معیارهای AA مرتبط (1.4.3، 1.4.11، 2.1.1، 4.1.2) به‌کار رفت.
   - **Master Prompt V5:** بخش‌های §0، V5.0–V5.4، §10–§16 (هویت بصری/توکن‌ها)، §20–§51 (قراردادهای صفحه)، §55–§61 (آناتومی)، §100–§154 (قراردادهای کامپوننت)، §450–§459 (Visual QA)، §1632 (چک‌لیست نهایی) به‌طور کامل خوانده شدند.
   - **Baymard / NN/g / الگوهای بازار (Divar/OLX/eBay):** صفحات Baymard و NN/g دسترسی رباتیک مسدود داشتند (404 در fetch)؛ بنابراین مقایسه بر مبنای (الف) پژوهش‌های نقل‌شده در خود Master Prompt §3 (نوارهای فیلتر قابل‌چشم‌چینی و قابل‌حذف، فیلترهای کلیدی اول، الگوی متفاوت دسکتاپ/موبایل، برجسته‌بودن جست‌وجو) و (ب) دانش استاندارد صنعت انجام شد. این محدودیت در سند نهایی نیز ذکر می‌شود.
5. **توجه مهم دربارۀ تست‌ها:** سبز بودن 292 تست به‌خودی‌خود سالم‌بودن UI را اثبات نمی‌کند (تست‌ها بیشتر روی منطق خالص و رفتار کامپوننت‌های ایزوله هستند و build/RSC و ظاهر رندر‌شده را نمی‌سنجند) — باگ F-01 نمونهٔ دقیق همین مسئله است: همهٔ تست‌ها سبز بودند درحالی‌که build می‌شکست.

---
## ۳. یافته‌ها (به‌ترتیب شدت)

### P0 — مسدودکنندهٔ build/ریلیز

#### F-01 ✅ (رفع‌شده در همین ممیزی — build تأیید شد)
- **فایل:** `src/components/listings/listing-card.tsx` (خطوط 32–38 پیش از اصلاح)
- **ریشه:** `ListingCard` **کامپوننت سرور** است (دستور `'use client'` ندارد) اما هندلر `onClick` درون‌خطی (تلیمتری `listing_card_opened`) را به `next/link` می‌فرستد. `Link` یک client component است و ارسال event handler از server به client در RSC مجاز نیست → خطای سریال‌سازی: `Event handlers cannot be passed to Client Component props`.
- **چرا فقط بعضی صفحه‌ها می‌شکستند:** در /search، /category، /favorites، /listing گرید از درون کامپوننت‌های **کلاینت** (`DiscoveryResults`، `FavoritesView`) رندر می‌شود، پس کل درخت card در realm کلاینت است و onClick قانونی بود. اما در **صفحهٔ اصلی** (Server Component) `ListingGrid`→`ListingCard` سمت سرور رندر می‌شوند → مرز server→client شکسته می‌شد. به همین دلیل «بیشتر فرانت» کار می‌کرد ولی خانه (و build) خراب بود.
- **اصلاح اعمال‌شده:** اکسترکت لینک به client wrapper جدید `src/components/listings/listing-card-link.tsx` (Link + onClick با import استاتیک تلیمتری)؛ `ListingCard` همان کامپوننت سرور ماند.
- **تأیید:** `next build` بعد از اصلاح: موفق، 36/36 صفحه.
- **باقی‌مانده (فاز ۰/۱):** تست رگرسیو — smoke رندر `/` (Playwright یا تست RSC) تا این کلاس خطا بازنگردد.

### P1 — باگ‌های منطقی و نقض‌های جدی دیزاین

#### F-02 — صفحهٔ اصلی: خطای شبکه → ادعای دروغین «دادهٔ خالی»
- **فایل:** `src/app/page.tsx` — `loadCategories` (~خط 50) و `loadLatestListings` (~خط 66)
- **کد:** `if (error instanceof ApiError && error.isNetworkError) return { status: 'empty' };`
- **مسئله:** وقتی بک‌اند آفلاین است، کاربر می‌بیند: «هنوز آگهی‌ای ثبت نشده است — اولین آگهی را شما ثبت کنید!» — ادعای دروغ دربارهٔ بازار. نقض صریح §0 («هرگز خطا را پنهان نکن») و §17–19 (حالت خطای صادقانه).
- **اصلاح (فاز ۱):** network error → `status:'error'` + ErrorState با تلاش دوباره (الگوی درست `categories/page.tsx`). + تست: mock شکست شبکه → انتظار ErrorState.

#### F-03 — جست‌وجوی دوتایی در /search
- **فایل‌ها:** `src/components/layout/desktop-header.tsx:27-29` + `src/app/search/page.tsx:79-81`
- **مسئله:** هدر دسکتاپ **همیشه** `SearchField` رندر می‌کند و صفحهٔ /search هم `SearchField` خودش را دارد (هر دو به `q` یکسان در nuqs). در دسکتاپ دو نوار جست‌وجوی یکسان دیده می‌شود. نقض §20 (تکرار اکشن اصلی در چند ناحیه) و الگوی NN/g (یک جست‌وجوی برجسته). **یافتهٔ قبلی audit-04 (C1) — هنوز رفع نشده.**
- **اصلاح (فاز ۱):** حذف `SearchField` از بدنهٔ /search؛ هدر کافی است. (آناتومی §56 «compact search control» را می‌خواهد؛ اگر بعداً تصمیم گرفتید در بدنه بماند، هدر در /search باید پنهان شود — ولی حذف بدنه سادتر است.)

#### F-04 — LocationPicker: شکست خاموش + assertion غیرصفر
- **فایل‌ها:** `src/components/location/location-picker.tsx:38-43` (`fetchCities(activeProvince!.id)`)، `features/search/components/filter-panel.tsx:83-88`، `features/search/components/active-filter-chips.tsx:76-81`
- **مسئلهٔ ۱ (UX):** اگر fetch ولایت‌ها fail شود، هیچ حالت خطا/تلاش دوباره‌ای نیست؛ برچسب همیشه «انتخاب شهر» می‌ماند. نقض §17–19. **یافتهٔ قبلی B1 — رفع نشده.**
- **مسئلهٔ ۲ (robustness):** `provinceObj!.id` — با هر race، queryFn می‌تواند روی null خطا بدهد. **یافتهٔ قبلی B2.**
- **اصلاح (فاز ۱):** state خطا + retry برای ولایت‌ها/شهرها؛ حذف `!` و guard داخل queryFn. + تست failure.

#### F-05 — گرید دسته‌بندی: پالت قوس‌کمانی (مهم‌ترین دلیل «زشت» بودن خانه)
- **فایل:** `src/components/discovery/category-shortcut-grid.tsx:24-38`
- **کد:** `vehicles: 'bg-blue-100 text-blue-600'`، `mobiles: 'bg-green-100 …'`، `electronics: 'bg-purple-100 …'`، `fashion: 'bg-pink-100 …'`، `kids: 'bg-cyan-100 …'`، `books: 'bg-yellow-100 …'`، `sports: 'bg-red-100 …'`، `animals: 'bg-lime-100 …'`، `jobs: 'bg-indigo-100 …'` و… (13 رنگ)
- **نقض‌ها:** §10 (پالت قفل teal/orange/خنثی؛ «آبی هویت اصلی نیست»)، §11 (توکن معنایی به‌جای رنگ خام)، دریل V5.4 (color/brand consistency 8/100).
- **اثر:** ردیف 13 آیکون رنگی روی صفحهٔ اصلی — دقیقاً الگوی «استارتر/ساستی» که §0 از ساختنش منع کرده.
- **اصلاح (فاز ۲):** طراحی موحّد: دایرهٔ `bg-primary-soft` + آیکون `text-primary` برای همهٔ دسته‌ها (آیکون‌ها همان map `categoryIcon`؛ فقط رنگ یکنواخت). برجسته‌سازی «همه» با `accent`. این تغییر به‌تنهایی بزرگ‌ترین جهش بصری خانه است.
#### F-06 — هیرو صفحهٔ اصلی oversized؛ آگهی‌ها از fold خارج
- **فایل:** `src/app/page.tsx:81-102`
- **مسئله:** کارت گرادیانی با H1 `text-3xl/4xl` + زیرنویس + 2 اورب blur تزئینی + جست‌وجو/مکان. در 390×844 بیشتر از نیمی fold اول را می‌گیرد؛ آگهی‌ها زیر fold می‌روند.
- **نقض‌ها:** §16 («هیرو/بنر بزرگ و فاصلهٔ خالی بزرگ اجتناب شود؛ fold اول = جست‌وجو و کشف») و §55 (آناتومی: 1) هدر، 2) جست‌وجوی 48px، 3) مکان، 4) یک ردیف دسته‌ها، 5) **آگهی‌ها زود**).
- **اصلاح (فاز ۲):** نوار search-first فشرده (جست‌وجو 48px + مکان در یک ردیف؛ H1 کوچک یا حذف؛ دسته‌ها بلافاصله؛ گرید آگهی در fold اول). اورب‌ها و `animate-fade-up` حذف (F-30). مستندسازی قبل/بعد با اسکرین‌شات 390×844.

#### F-07 — وزن 600 (semibold) فونت نیست → رندر سنتتیک
- **فایل‌ها:** `src/app/layout.tsx:18-28` (فونت‌ها: Vazir 300/400/500/700)؛ ده‌ها کامپوننت `font-semibold` دارند
- **مسئله:** بدون فایل وزن 600، مرورگر faux bold می‌سازد که در متون دری تار است. §12 وزن‌های 400/500/600/700 را می‌خواهد.
- **اصلاح (فاز ۲):** پیشنهاد: جابه‌جایی کامل به **Vazirmatn** (وزن 600 دارد و با نام متغیر `--font-vazirmatn` هم‌خوان است — F-29) با weight‌های 400/500/600/700؛ یا افزودن Vazir-SemiBold. تست چشمی قلم در 390px الزامی است.

#### F-08 — بج «فروخته شد» قرمز
- **فایل:** `src/components/listings/listing-card.tsx:78` — `bg-danger/90`
- **مسئله:** SOLD حالت خنثی است نه خطا؛ قرمزِ danger (§10) رزروی خطاهاست. الگوی Divar: sold با overlay خنثی تیره.
- **اصلاح (فاز ۲):** بج `bg-foreground/80` (تیرهٔ خنثی) با متن روشن.

#### F-09 — پنل مدیریت: target size زیر حد WCAG 2.2
- **فایل‌ها:** `admin-taxonomy-view.tsx` (دکمه‌های ویرایش/حذف `p-0.5` + آیکون size-3/4 → target ≈ 16–20px)، `admin-locations-view.tsx` (همین الگو)
- **نقض:** WCAG 2.2 **2.5.8 Target Size (Minimum)** (24px) — **fail**؛ و §14 (مبنای اپ 44px).
- **اصلاح (فاز ۳/۴):** حداقل `size-9` (36px) برای عبور از WCAG؛ ترجیحاً 44px هم‌تراز با مبنای اپ.

#### F-10 — پنل مدیریت: ARIA tablist روی لینک‌ها
- **فایل:** `src/features/admin/components/admin-nav.tsx:28-47`
- **مسئله:** `role="tablist"/"tab"` + `aria-selected` روی لینک‌های ناوبری — بدون tabpanel و بدون الگوهای کیبوردِ tab → نقض 1.3.1/4.1.2.
- **اصلاح (فاز ۴):** `nav` ساده + `aria-current="page"` روی لینک فعال.

#### F-11 — متن 11px (زیر مقیاس تایپ §12)
- **فایل‌ها:** `category-shortcut-grid.tsx:62,72` (`text-[11px]`)، `listing-card.tsx:94` (بج «قابل مذاکره» `text-[11px]`)
- **اصلاح (فاز ۲):** `text-caption` (12/18).

#### F-12 — CTA «ثبت آگهی» هدر موبایل در 320px پنهان
- **فایل:** `src/components/layout/mobile-header.tsx:30` — `hidden xs:inline-flex`
- **نقض:** §13 («در 320px اکشن ضروری پنهان نباشد»).
- **اصلاح (فاز ۲):** نمایش CTA در همهٔ عرض‌ها (icon فشرده).

#### F-13 — برچسب bottom nav «نشان‌ها» ناهم‌خوان
- **فایل:** `src/components/layout/mobile-bottom-nav.tsx:13`
- **مسئله:** همه‌جا «علاقه‌مندی‌ها» است؛ فقط bottom nav «نشان‌ها» (نقض یکپارچگی 3.2.4).
- **اصلاح (فاز ۱):** «علاقه‌مندی‌ها» (یا «علاقه‌مندی»).
### P2 — UX و انطباق با استانداردها

#### F-14 — فیلترها history:'push' → آلودگی stack پس/جلو
- **فایل‌ها:** `filter-panel.tsx`، `active-filter-chips.tsx`، `sort-control.tsx` (همه `history:'push'`)
- **مسئله:** هر تغییر فیلتر یک entry history می‌سازد؛ برگشت به نتیجهٔ قبلی چند Back می‌خواهد. الگوی توصیه‌شده (nuqs/Baymard): keyword=push؛ فیلتر/مرتب‌سازی=**replace**. **یافتهٔ قبلی A5 — رفع نشده.**
- **اصلاح (فاز ۳):** `history:'replace'` برای province/city/minPrice/maxPrice/condition/filter/sort.

#### F-15 — مقادیر arbitrary تایپ به‌جای توکن
- **فایل‌ها:** `listing-card.tsx:88` (قیمت `text-[1.25rem]`)، `page.tsx:89` (H1 `lg:text-[2.5rem]`)
- **نقض:** §11/§12 — تایپ از scale (12…32). قیمت کارت نیاز به tier مشخص دارد (§452 «clear product price hierarchy»).
- **اصلاح (فاز ۲):** جایگزینی با tierهای scale یا افزودن توکن `price` (موجه — مستند شود).

#### F-16 — نوار تماس sticky موبایل: 2 تاپ تا تماس
- **فایل:** `src/components/listings/mobile-contact-bar.tsx`
- **مسئله:** «تماس با فروشنده» فقط scroll به سکتور تماس می‌کند؛ بعد باید reveal زده شود. الگوی Divar/OLX: CTA مستقیم‌تر.
- **اصلاح (فاز ۳، بهبود اختیاری — تصمیم محصولی):** reveal خودکارِ اولین روش فعال در sticky bar (با idempotency key) یا تماس مستقیم بعد از reveal. دقت: قرارداد فعلی reveal را behind-the-click نگه می‌دارد.

#### F-17 — سگستion بدون نشانهٔ بارگذاری
- **فایل:** `search-field.tsx` + `use-search-suggestions.ts` (`loading` برمی‌گردد ولی نشانگر ندارد)
- **اصلاح (فاز ۳):** skeleton/spinner کوچک داخل dropdown هنگام loading.

#### F-18 — لینک تکراری در صفحهٔ آگهی
- **فایل:** `src/app/listing/[slug]/page.tsx:145-151` — «همهٔ آگهی‌های {دسته}» زیر breadcrumb که خودش لینک دسته است.
- **اصلاح (فاز ۳):** حذف لینک دوم.

#### F-19 — properties فیزیکی (ml/mr) در پنل مدیریت
- **فایل‌ها:** `ActiveFilterChips.tsx:33` (`ml-0.5`)، `admin-locations-view.tsx:309-311` (`ml-2`, `ml-1`)، `admin-taxonomy-view.tsx:644` (`mr-4`) و `:721` (`ml-1`)
- **نقض:** §8 (logical properties) — در RTL جهت فاصله برعکس می‌شود.
- **اصلاح (فاز ۴، RTL sweep):** `ms-*/me-*`.

#### F-20 — کنتراست: `text-muted` (≈2.54:1) و مرز input (≈1.38:1)
- **فایل‌ها:** `--muted` (globals.css) به‌عنوان رنگ آیکون معنادار (ImageOff placeholders در admin/my-listings، آیکون جست‌وجوی admin)؛ `border-input` (= `--input: 214 32% 91%` ≈ #E2E8F0) در **همهٔ inputها** (`form-field.tsx` INPUT_CLASS، `field-inputs.tsx` INPUT_CLASS، `search-field.tsx:240`، `sort-control.tsx:42`، `report-dialog.tsx:158`، `admin-users-view.tsx:162`)
- **نقض:** WCAG **1.4.11** Non-text Contrast (3:1 برای مرز input و آیکون معنادار) — **هر دو fail**. (متن‌های اصلی OK: primary 5.4:1، muted-foreground 4.76:1.)
- **اصلاح (فاز ۴):** (الف) تیره‌کردن token `--input` تا کنتراست ≥3:1 (مثلاً 215 20% 65% ≈ #94A3B8 یا ملایم‌تر 215 16% 75% + border 1.5px)؛ (ب) آیکون‌های معنادار → `text-muted-foreground`.

#### F-21 — دکمه‌های image-tile در sell: 36px (زیر مبنای 44px اپ)
- **فایل:** `sell-image-tile.tsx:115` (`size-9`)
- **وضعیت:** WCAG 24px را می‌گذرد ولی مبنای پروژه 44px است (§14)؛ 4 دکمهٔ 36px در tile کوچک = crowding.
- **اصلاح (فاز ۳):** `size-10` + بازچینی، یا 44px.

#### F-22 — skeleton خانه با گرید واقعی هم‌خوان نیست (پرش بصری/CLS)
- **فایل:** `src/app/loading.tsx:11` — `grid-cols-2 xs:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6` ولی گرید واقعی `listing-grid.tsx` است: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **اصلاح (فاز ۳):** هم‌سازی breakpoints و ارتفاع skeleton با خروجی نهایی.

#### F-23 — فوتر سنگین
- **فایل:** `src/components/layout/site-footer.tsx` — 4 ستون + بلوک برند؛ §55 «فوتر کامل ولی فشرده»؛ در موبایل ≈900px ارتفاع.
- **اصلاح (فاز ۳، اختیاری):** collapse ستون‌ها در موبایل.

#### F-24 — بدون OfflineBanner
- **مسئله:** قرارداد §125 (OfflineBanner) و state §350 (offline) تعریف شده ولی پیاده نیست.
- **اصلاح (فاز ۳/۴):** نوار نازک هنگام `navigator.onLine === false` (listener‌های online/offline).

#### F-25 — بدون ToastRegion
- **مسئله:** قرارداد §126 تعریف شده ولی پیاده نیست؛ فیدبک‌ها inline هستند (برای بیشتر موارد درست است) ولی رویدادهای cross-cutting (مثلاً نشست منقضی) toast می‌خواهند.
- **اصلاح (فاز ۴، اختیاری):** toast region خودساختهٔ ساده — **بدون dependency جدید** (سیاست §4).
### P3 — مستندسازی، یکپارچگی، مرمت‌های کوچک

#### F-26 — کامنت‌های منسوخ دربارهٔ قرارداد
- **فایل‌ها:** `src/features/sellers/types.ts:4-6` و `src/app/seller/[slug]/page.tsx:50-53`
- **مسئله:** ادعای «`/sellers/{slug}/listings` در قرارداد نیست» — درحالی‌که در `openapi.json` **است** (کد درست، کامنت غلط).
- **اصلاح (فاز ۱):** به‌روزرسانی کامنت‌ها.

#### F-27 — README منسوخ
- **فایل:** `weshbazar-frontend/README.md` — اشاره به «Master Prompt V4»، ادعای «صفحات stub هستند» (همه پیاده‌اند)، ارجاع به `docs/implementation-status.md` که **وجود ندارد**.
- **اصلاح (فاز ۱/۲):** بازنویسی مختصر + ایجاد `docs/frontend-execution/STATUS.md`.

#### F-28 — لاگ‌های تست قدیمی در ریشه
- **فایل‌ها:** `test-errors.txt`، `test-out.txt`، `test-out2.txt`، `test-results.txt` (شکست‌های قدیمی admin که الان پاس‌اند — گمراه‌کننده) + فایل‌های موقت این ممیزی (`jest-out*.txt`، `build-out*.txt`، `tsc-out.txt`).
- **اصلاح (فاز ۰):** حذف همه.

#### F-29 — نام‌گذاری فونت (Vazir در متغیر Vazirmatn)
- **فایل‌ها:** `layout.tsx` (`variable: '--font-vazirmatn'` + فونت Vazir)، `tailwind.config.ts:118` (fallback `'Vazirmatn'`).
- **اصلاح (فاز ۲):** با انتخاب F-07 هم‌خوان شود.

#### F-30 — عناصر تزئینی در خلاف §15/§16
- **فایل:** `page.tsx:81-87` (اورب‌های blur-3xl + `animate-fade-up`)، `page.tsx:163` (اورب سکتور CTA)
- **اصلاح (فاز ۲):** حذف در طراحی دوبارهٔ هیرو/CTA.

#### F-31 — `RouteScaffold` کد مرده
- **فایل:** `src/components/layout/route-scaffold.tsx` — هیچ صفحه‌ای از آن استفاده نمی‌کند (فقط README به آن اشاره دارد).
- **اصلاح (فاز ۱):** حذف.

#### F-32 — `gpt.md` (تحلیل کسب‌وکار) در ریشهٔ فرانت
- **اصلاح (فاز ۱/۲):** انتقال به `docs/` ریشهٔ اصلی.

#### F-33 — skip link با `right-4` فیزیکی
- **فایل:** `src/app/layout.tsx:61` — در RTL تصادفی درست است ولی §8 logical خواسته.
- **اصلاح (فاز ۴، RTL sweep):** `end-4`.

---

## ۴. مقایسه با استانداردهای UI/UX (جزئیات)

### ۴.۱ WCAG 2.2 (Quickref رسمی W3C — دریافت و بررسی شد)

| معیار | وضعیت فعلی | شواهد |
|---|---|---|
| **2.5.8** Target Size (Minimum) — جدید 2.2 | ❌ fail | دکمه‌های آیکون‌تنها admin (≈16–20px، F-09)؛ دکمهٔ حذف chipهای admin (`p-0.5`، F-09). بقیهٔ اپ ≥36px (عبور از حد 24px) |
| **2.4.11** Focus Not Obscured (Minimum) — جدید 2.2 | ⚠️ بعلاوهٔ قابل‌قبول، تأیید browser لازم | `pb-bottom-nav` روی main فضا را نگه می‌دارد؛ sticky contact bar هم بالا است — ولی باید با Tab واقعی در مرورگر در 390px راستی‌آزمایی شود (فاز ۴) |
| **3.2.6** Consistent Help — جدید 2.2 | ✅ N/A | سیستم help یکپارچه ندارد؛ صفحه‌های help ثابت‌اند |
| **3.3.7** Redundant Entry — جدید 2.2 | ✅ pass | شماره در forgot→reset با `?phone=` پر می‌شود؛ `next` در flow احراز هویت حفظ می‌شود |
| **3.3.8** Accessible Authentication — جدید 2.2 | ✅ pass | ورود با رمز + OTP SMS؛ هیچ «یادآوری واقعیت شخصی» (security question) نیست |
| **1.4.3** Contrast (Minimum) 4.5:1 | ✅ mostly pass | primary 5.4:1، muted-foreground 4.76:1، متن‌های footer روی تیره OK. `text-muted` (2.54:1) فقط روی آیکون‌هاست (→ 1.4.11) |
| **1.4.11** Non-text Contrast 3:1 | ❌ fail | مرز همهٔ inputها (`border-input` ≈1.38:1، F-20)؛ آیکون‌های معنادار `text-muted` (F-20) |
| **2.1.1** Keyboard | ✅ pass | فرم‌ها native؛ dialogها native `<dialog>` (focus trap داخلی)؛ منوی حساب با roving focus (ArrowUp/Down/Home/End)؛ combobox جست‌وجو با `aria-activedescendant` |
| **2.4.7** Focus Visible | ✅ pass | `focus-visible:ring-2` تقریباً همه‌جا |
| **1.3.1 / 4.1.2** Name, Role, Value | ⚠️ یک نقض | سوءاستفادهٔ tablist در admin-nav (F-10). بقیهٔ نقش‌ها درست (radiogroup, switch, menu, dialog, tab در sell stepper به‌صورت aria-current) |
| **2.5.7** Dragging Movements — جدید 2.2 | ✅ N/A | هیچ تعامل drag-only ندارد (reorder تصاویر با دکمه است) |
| **3.2.4** Consistent Identification | ⚠️ جزئی | برچسب «نشان‌ها» در مقابل «علاقه‌مندی‌ها» (F-13) |
| **1.4.10** Reflow | ✅ pass | چیدمان‌ها fluid با breakpoints استاندارد؛ جدول admin با overflow-x-auto |

### ۴.۲ الگوهای Baymard / NN/g (بر مبنای پژوهش‌های نقل‌شده در spec §3 + دانش استاندارد صنعت)

| الگو | وضعیت | شواهد |
|---|---|---|
| فیلترهای اعمال‌شده at-a-glance + قابل حذف + clear-all | ✅ pass | `ActiveFilterChips` + «پاک کردن همه» |
| فیلترهای کلیدی اول، بقیه جمع‌شونده | ✅ pass | مکان/قیمت/وضعیت اول در panel |
| الگوی متفاوت دسکتاپ (rail) / موبایل (sheet) | ✅ pass | `FilterPanelDesktop` + `MobileFilterSheet` (dialog تمام‌قد با footer Apply/Reset) |
| بازیابی zero-result چندسطحی | ✅ **بهتر از متوسط صنعت** | `buildZeroResultRecovery`: گسترش دسته → حذف فیلترها → حذف keyword → clear-all (spec §21 + Baymard) |
| شمارش نتایج صادقانه | ✅ pass | «بیش از N آگهی» وقتی `hasMore` و backend total نمی‌دهد (قرارداد، documented) |
| یک جست‌وجوی برجسته | ❌ fail در /search | جست‌وجوی دوتایی (F-03) |
| ثبات stack پس/جلو هنگام فیلتر | ❌ fail | history push (F-14) |
| prominent location context (Divar/OLX) | ✅ pass | LocationPicker در هدر دسکتاپ + هیرو خانه + فیلتر |
| Thumb zone / bottom nav | ✅ pass | bottom nav 64px + safe-area؛ sticky CTA بالای nav |

### ۴.۳ بنچمارک بازار (Divar/OLX — الگوهای انتقال‌پذیر)
- قیمت + مکان + زمان روی کارت: ✅ (فقط «فروخته شد» قرمز است — F-08)
- کشف دسته با ردیف compact: ✅ (فقط رنگ قوس‌کمانی — F-05)
- contact مستقیم‌تر روی موبایل: ⚠️ (F-16 — بهبود اختیاری با ملاحظات قرارداد)
- فشرده‌بودن fold اول: ❌ (F-06)

### ۴.۴ دریل بصری V5.4 (برآورد امتیاز صفحهٔ اصلی)

| رکن (از 100) | قبل از اصلاح | بعد از فاز ۲+۳ (برآورد) |
|---|---|---|
| hierarchy و fold اول (15) | 10 | 14 |
| shell/هدر/فوتر (15) | 13 | 14 |
| تایپوگرافی و RTL (12) | 9 (faux semibold) | 11 |
| فاصله/حداکثر/rhythm (12) | 9 | 11 |
| کارت و تصویر (12) | 8 (sold قرمز، 11px) | 11 |
| وضوح جست‌وجو/فیلتر (12) | 10 | 11 |
| رنگ/برند (8) | 4 (قوس‌کمانی) | 7 |
| responsive (8) | 7 | 8 |
| حالت‌ها/a11y (6) | 4 (input contrast، target size) | 5 |
| **جمع** | **≈76** | **≈92** |
---

## ۵. نقشه‌راه فازبندی‌شده (برای مکالمهٔ بعدی)

> ترتیب بر مبنای V5.1 spec است (ابتدا درستی منطقی، سپس دیزاین، سپس a11y/performance/ریلیز). هر فاز **gate** دارد و فاز بعدی فقط بعد از عبور gate شروع می‌شود.

### فاز ۰ — قفل پایلاین و تمیزکاری (≈0.5 روز)
- نگهداری F-01 (رفع‌شده در ممیزی) + **تست رگرسیو** smoke رندر `/` (Playwright: GET `/` → 200 + وجود «آخرین آگهی‌ها»).
- حذف لاگ‌های قدیمی (F-28).
- ایجاد `docs/frontend-execution/STATUS.md` (فاز فعلی، gateها، بلاکرها، دستور بعدی — الگوی V5.0).
**Gate:** `tsc` 0 · `jest` ≥292 سبز · `lint` 0 · `next build` 36/36 · smoke `/` سبز.

### فاز ۱ — منطق بحرانی (≈1 روز)
- F-02: حالت خطای صادقانهٔ خانه هنگام network error (+تست mock شبکه).
- F-03: حذف جست‌وجوی تکراری از بدنهٔ /search.
- F-04: خطا/retry در LocationPicker + حذف `!` در 3 فایل (+تست failure).
- F-13: یکپارچه‌سازی برچسب «علاقه‌مندی‌ها».
- F-26/F-27: به‌روزرسانی کامنت‌های sellers + بازنویسی README.
- F-31/F-32: حذف RouteScaffold؛ انتقال gpt.md به docs.
**Gate:** تست‌ها سبز · روال دستی جست‌وجو+فیلتر در 390 و 1280 · آفلاین‌کردن بک‌اند → خانه ErrorState (نه «خالی»).

### فاز ۲ — سیستم دیزاین و برند (≈1.5 روز) — **بزرگ‌ترین جهش بصری**
- F-05: گرید دسته‌ها → توکن‌های برند (primary-soft/primary برای همه؛ «همه» با accent) + اسکرین‌شات قبل/بعد.
- F-06 + F-30: بازطراحی fold اول خانه بر اساس آناتومی §55 (search-first strip؛ حذف هیرو/اورب/fade-up؛ H1 کوچک یا حذف) — آگهی‌ها باید در fold اول 390×844 باشند.
- F-07 + F-29: فونت → Vazirmatn (400/500/600/700) یا افزودن SemiBold؛ هم‌نام‌کردن متغیر؛ تست چشمی قلم.
- F-08: بج sold خنثی.
- F-11 + F-15: رفع متن‌های 11px و arbitrary؛ tier قیمت (یا توکن `price`).
- F-12: CTA ثبت آگهی در 320px.
**Gate (دریل V5.4):** امتیاز خانه ≥88/100 با اسکرین‌شات 320/390/768/1440 · چک‌لیست بصری §450–459 · `grep` بدون رنگ raw-palette.
### فاز ۳ — بهبود UX (≈1 روز)
- F-14: `history:'replace'` برای پارامترهای فیلتر/مرتب‌سازی (فقط `q` push می‌ماند).
- F-16: تصمیم محصولی + CTA تماس مستقیم‌تر در sticky bar (اختیاری؛ اگر قرارداد reveal behind-the-click حفظ شود، حداقل «نمایش تماس» مستقیم).
- F-17: loading indicator در سگستion.
- F-18: حذف لینک تکراری در صفحهٔ آگهی.
- F-21: target size دکمه‌های image-tile → 44px.
- F-22: هم‌سازی skeleton خانه با گرید واقعی.
- F-23/F-24: (اختیاری) فوتر موبایل فشرده + OfflineBanner.
**Gate:** تست دستی back/forward: ۵ تغییر فیلتر → ۱ Back به نتیجهٔ قبل · اسکرین‌شات sell wizard در 390px.

### فاز ۴ — دسترس‌پذیری WCAG 2.2 (≈1 روز)
- F-09: همهٔ targetها ≥44px (admin taxonomy/locations، chipهای admin).
- F-10: admin-nav → nav ساده + `aria-current="page"`.
- F-20: کنتراست مرز input (token `--input` تا ≥3:1) + آیکون‌های معنادار → `muted-foreground`.
- F-19 + F-33: RTL sweep (جست‌وجوی `ml-|mr-|pl-|pr-|left-|right-` در کل src → logical properties).
- راستی‌آزمایی کیبورد کامل: Tab در /، /search، /listing، /sell/*، /admin؛ focus-visible؛ focus trap در dialogها؛ 2.4.11 (focus نه‌مخفی‌شده) با مرورگر در 390px.
- (اختیاری) F-25: ToastRegion.
- اجرای axe (Playwright + axe-core یا بررسی دستی browser) روی 6 روت اصلی.
**Gate:** صفر finding با شدت critical/serious در axe · چک‌لیست §370–381 spec سبز · رکورد اسکرین‌شات/ویدیوی کیبورد.

### فاز ۵ — عملکرد و SEO (≈0.5 روز)
- LCP خانه/جزئیات: اصلاح `sizes` گالری (الان `(max-width:1024px) 100vw, 60vw` — در 1024–1280px دقیق نیست)؛ `priority`/preload فونت (دارند).
- CLS: هم‌خوانی skeleton (فاز ۳) + رزرو فضای فونت (display swap — OK).
- راستی‌آزمایی JSON-LD (Google Rich Results) برای /listing.
- Lighthouse mobile: performance ≥90، a11y ≥95، best-practices ≥95 روی / و یک /listing نمونه.
**Gate:** گزارش Lighthouse در `docs/frontend-execution/artifacts/`.

### فاز ۶ — E2E و ممیزی نهایی ریلیز (≈1 روز)
- Playwright smoke (dependency فقط test): خانه، جست‌وجو+فیلتر+حذف chip، جزئیات+reveal تماس+favorite، sell wizard کامل، ورود/ثبت/OTP، my-listings (mark-sold/archive).
- **آزمون ایزولاسیون حساب (V5.3):** حساب A → پیش‌نویس sell → logout → حساب B: B نباید پیش‌نویس A را ببیند؛ A بعد از re-login پیش‌نویس خودش را ببیند.
- اسکرین‌شات‌های الزامی V5.4: 320/390/768/1280/1440 برای خانه، جست‌وجو (فیلتر باز/بسته)، جزئیات، auth، sell.
- به‌روزرسانی `STATUS.md` + گزارش هر فاز در `docs/frontend-execution/phases/`.
**Gate (ریلیز):** دریل V5.4 خانه ≥88 · چک‌لیست §1632 تک‌تک سبز یا مستند NOT-RUN · هیچ P0/P1 باز نمانده.

### ترتیب و وابستگی
```
فاز ۰ → فاز ۱ → فاز ۲ → فاز ۳ → فاز ۴ → فاز ۵ → فاز ۶
 (پایلاین) (منطق)  (دیزاین) (UX)  (a11y)  (perf) (ریلیز)
```
فاز ۳ و ۲ برای یک نفر به ترتیب بالا کم‌ریسک‌تر است (دیزاین قبل از UX polish).
---

## ۶. پیوست A — پوشش فایل‌های خوانده‌شده

- **ریشهٔ فرانت (14):** package.json، next.config.mjs، tailwind.config.ts، tsconfig.json، postcss.config.mjs، jest.config.mjs، jest.setup.ts، components.json، .eslintrc.json، .prettierrc، .env.example، .env.local، README.md
- **src/app (10):** layout، providers، page، loading، error، not-found، robots، sitemap، globals.css + 5 فونت woff2 (باینری)
- **src/app روت‌ها (35):** about، account (+security)، admin (layout + 7)، auth (5)، categories، category/[slug] (+loading)، contact، favorites، help (+safety)، listing/[slug] (+loading)، my-listings، search (+loading)، sell (layout + 8 + [id]/edit)، seller/[slug] (+loading)
- **src/components (32):** brand (1)، layout (12)، feedback (3)، listings (10 + 1 جدید)، location (1)، discovery (1)، ui (3)، auth (1)
- **src/features (103):** auth (7+10)، categories (4)، listings (6 + edit 8 + my-listings 5 + sell 22)، search (8+7)، sellers (3)، favorites (4+2)، reports (4+1)، locations (3)، media (4)، contacts (3+1)، account (5+5)، admin (6+17+helper)، attribution (3)
- **src/lib (14):** env، utils، i18n/config، api/ (11)
- **src/middleware.ts** + **40 فایل تست** (همه اجرا شده: 292 تست سبز)
- **مستندات مرجع:** Master Prompt V5 (2154 خط، کامل خوانده شد)، backend openapi.json (70 مسیر)، frontend-api-contract.md، frontend-error-map.md، audit/04 (موجود از قبل)

## ۷. پیوست B — راستی‌آزمایی قرارداد API

- **همهٔ** endpointهای مصرف‌شده در فرانت‌اند در `openapi.json` موجودند؛ **هیچ endpoint ساختگی نیست** (رعایت AGENTS.md).
- envelope + دو pagination (cursor/page) مطابق قرارداد؛ error mapping روی `code` (نه message).
- یک انحراف مستندسازی: کامنت‌های منسوخ sellers (F-26) — کد درست است، کامنت غلط.

## ۸. پیوست C — دستورات اجراشده در این ممیزی

| دستور | نتیجه |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 — بدون خطا |
| `npx jest` | ✅ 40/40 سویت، 292/292 تست (17.9s) |
| `npx next lint` | ✅ «No ESLint warnings or errors» |
| `npx next build` (اول) | ❌ شکست در پیش‌رندر `/` — F-01 |
| `npx next build` (بعد از F-01) | ✅ 36/36 صفحه — First Load JS: shared 106kB، `/` 164kB، `/sell/[id]/edit` 164kB، middleware 32.1kB |

---
*سند: `AUDIT-2026-10-19-full-frontend-review.md` — مکالمهٔ بعدی با «شروع فاز ۰» اجرا می‌شود.*