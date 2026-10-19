# ممیزی جامع سیستم جستجو، دسته‌بندی‌ها، فیلترها و کشف آگهی — وش‌بازار (WeshBazar)

> **نسخه:** 1.0 — تاریخ ممیزی: ۱۸ اکتوبر ۲۰۲۶
> **محیط:** Windows (win32) • Node v24.21.0 • npm 11.19.0 • VS Code
> **ریشهٔ مخزن:** `c:\Users\AYDIN\Desktop\WeshBazar` (monorepo — frontend + backend در یک ریشهٔ Git)
> **Branch:** `qwen` • **HEAD:** `6b876ce` — `test(security): add e2e coverage for Helmet headers and CORS origin policy`
> **وضعیت working-tree:** پاک (بدون تغییرات ثبت‌نشده)
> **زبان گزارش:** دری/فارسی افغانستان (fa-AF). نام‌های فنی، برندها، شناسه‌های کد، نام مسیرها و اصطلاحات محصولی که ترجمهٔ آن‌ها غیرطبیعی است به انگلیسی حفظ شده‌اند.

---

## روش و سطح دسترسی به شواهد (Scope & Evidence Access)

این ممیزی فقط بر پایهٔ شواهدِ جمع‌آوری‌شدهٔ واقعی انجام شده است، نه حافظه یا اسناد قدیمی. سطح دسترسی واقعی در این جلسه:

| قابلیت | وضعیت واقعی در این جلسه |
|---|---|
| خواندن خط‌به‌خط سورس frontend/backend | ✅ انجام شد برای تمام فایل‌های کلیدی (فهرست کامل در I-B) |
| `npm run typecheck` frontend | ✅ اجرا شد — خروجی `FE_TSC_EXIT:0` (موفق) |
| `npm run typecheck` backend | ✅ اجرا شد — خروجی `BE_TSC_EXIT:0` (موفق) |
| Jest (unit) frontend | ✅ اجرا شد — **37 suites / 273 tests، همه PASS** (هشدار teardown یک worker) |
| Jest (unit) backend | ✅ اجرا شد — **23 suites / 208 tests، همه PASS** |
| Lint (next lint / eslint) | ❌ اجرا نشد (timeout زنجیرهٔ shell؛ نتیجهٔ قبلی سند نیست) |
| Integration/E2E tests | ❌ اجرا نشد (نیازمند Postgres + seed و `test:integration`/`test:e2e`) |
| `next build` / `nest build` | ❌ اجرا نشد |
| Browser/runtime QA (viewport، اسکرین‌شات، Playwright) | ❌ در دسترس نبود — مشاهدات بصری **NOT RUN** علامت زده شد |
| Performance / Lighthouse / a11y tooling | ❌ در دسترس نبود |
| Web research | ✅ چند منبع اولیهٔ کلیدی مستقیماً fetch شد (Google facet-navigation، Next.js sitemap/robots، WCAG 2.2، Baymard query-types و applied-filters). بقیهٔ منابع register بر اساس URL و دانش هنجاری ذکر شد |

> **قاعدهٔ صداقت:** هر ادعای وضعیت پیاده‌سازی با «سند در سورس» (`path:line`) نشان‌گذاری شد. چیزی که فقط از سورس خوانده شده `VERIFIED IN SOURCE` است؛ چیزی که runtime/test تأیید شده باشد جدا ذکر شده؛ مواردی که فقط استنتاج است `INFERENCE` و موارد پیشنهادی `PROPOSAL` علامت خورده‌اند. هیچ نمرهٔ ساختگی، اسکرین‌شات ساختگی یا «همه‌چیز سبز» بدون نتیجهٔ اجرای واقعی ثبت نشده است.

---

# PART I — وضعیت فعلی: گزارش «همان‌طور که ساخته شده»

## I-A. حکم اجرایی (Executive Verdict)

### خلاصهٔ مبتنی بر شواهد

WeshBazar از نظر **معماری و درستی سرور/قرارداد** در سطحی غیرعادی بالغ است: موتور جستجو بر پایهٔ PostgreSQL است (pg_trgm + نرمال‌سازی حروف فارسی/عربی)، تمام فیلترها whitelist و type-coerced هستند، صفحه‌بندی keyset/cursor دارد، سیاست visibility (فقط ACTIVE، فقط فروشندهٔ ACTIVE، حذف فوری آگهی منقضی) در یک نقطهٔ واحد اعمال می‌شود، و لایهٔ امنیتی/نرخ‌محدودیت/idempotency/audit وجود دارد. آزمون‌های unit هر دو سمت سبز است (481 test روی هم).

در مقابل، **لایهٔ UX/کشف‌پذیری** چند شکاف واقعی دارد که مهم‌ترین آن یک باگ قطعی در فیلترهای پویا است: **فیلترهای عددی/تاریخ خاص هر دسته (سال ساخت، کیلومتر، متراژ، تعداد اتاق و…) در UI رندر نمی‌شوند**، چون کامپوننت به‌دنبال نوعِ ناموجود `NUMBER` می‌گردد در حالی که قراردادِ واقعی `INTEGER`/`DECIMAL`/`YEAR` منتشر می‌کند. به این معنا که فیلترهای اختصاصیِ قوی‌ترین دسته‌ها (وسایط، املاک) عملاً در موبایل/دسکتاپ دیده نمی‌شوند، هرچند backend آن‌ها را پشتیبانی می‌کند.

### ارزیابی تفکیکی

| بُعد | وضعیت | توضیح |
|---|---|---|
| بلوغ سورس (source maturity) | **بالا** | معماری layered، قرارداد frozen، DTOهای معتبر، استفادهٔ کامل از پارامترهای SQL |
| درستی runtime (runtime correctness) | **تأییدشدهٔ جزئی** | typecheck + 481 unit test سبز؛ اما E2E/runtime/browser اجرا نشد → ادعای «درست در اجرا» کامل نیست |
| کیفیت بصری/تعامل (visual/interaction) | **خوب با یک باگ P1** | سیستم token دائمی/موبایل-فرست/RTL خوب است؛ باگ NUMBER فیلترهای عددی را حذف کرده |
| SEO crawl/index readiness | **خوب تا متوسط** | sitemap/robots/canonical/meta/OG موجود؛ ولی سیاست noindex برای صفحات facet و 404 برای ترکیب‌های خالی کامل نیست |
| کیفیت بازیابی جستجو (retrieval quality) | **پایه و منضبط** | زیررشته‌ای AND با نرمال‌سازی خوب؛ بدون ranking، بدون تایپو/سینونیم/استم — مناسب MVP، نه بیشتر |
| اعتبارسنجی بازار/کسب‌وکار | **تحقق‌نیافته** | هیچ شواهد کاربر/تولید وجود ندارد؛ هر ادعای موفقیت بازار فعلاً بی‌مدرک است |

### اعتماد و محدودیت‌های بازرسی

- اعتماد به یافته‌های سورس **بالا** است (همه با `path:line` مستند شد).
- اعتماد به «وضعیت اجرایی/بصری/کاربری» **پایین** است، چون browser/runtime/E2E در این جلسه در دسترس نبود.
- یک باگ قطعی فیلترهای عددی (`attribute-filters.tsx:40`) با مقایسهٔ مستقیم بین seed (YEAR/INTEGER/DECIMAL) و کامپوننت (`NUMBER`) اثبات شد.

## I-B. فهرست فایل‌به‌فایل و خط‌به‌خط (Scope Register)

> ستون وضعیت: `FULL` = کامل خوانده شد • `PART` = بخشی خوانده شد • `REF` = از طریق ارجاع/حضور ثبت شد.

### Backend — مسیر عمودی جستجو/دسته/فیلتر

| مسیر فایل | نقش | وضعیت | پوشش تست/runtime |
|---|---|---|---|
| `modules/listings/discovery/discovery.service.ts` | ارکستراسیون feed/detail عمومی، visibility، hydration، view-count | FULL | — |
| `modules/listings/discovery/filter-parser.ts` | whitelist عبارات `key:op:value` | FULL | ✅ `filter-parser.spec.ts` |
| `modules/listings/discovery.controller.ts` | `GET /listings`, `GET /listings/:slug` | FULL | — |
| `modules/listings/search-text.ts` | نرمال‌سازی فارسی/عربی | FULL | ✅ `search-text.spec.ts` |
| `modules/listings/dto/discovery.dto.ts` | DTO کوئری discovery | FULL | — |
| `modules/listings/dto/discovery-responses.dto.ts` | شکل پاسخ Swagger | FULL | — |
| `modules/listings/listing-visibility.ts` | سیاست expiry/ACTIVE | FULL | — |
| `modules/listings/listings.service.ts` | مالک/حالت ماشین/کرسن | PART | ✅ `listing-state.spec.ts` |
| `providers/search/search.provider.ts` | انتزاع provider + `SEARCH_SORTS` | FULL | — |
| `providers/search/postgres-search.provider.ts` | پیاده‌سازی PG (ORDER_BY/jsonb) | FULL | — |
| `modules/taxonomy/taxonomy.service.ts` | دسته‌ها، ارث‌بری attribute، filter-schema | FULL | — |
| `modules/taxonomy/attribute.types.ts` | `EffectiveAttribute`، انواع | FULL | — |
| `modules/taxonomy/attribute-validation.ts` / `attribute-operations.ts` | اعتبارسنجی + عملگرهای مجاز | PART | ✅ spec ها |
| `modules/taxonomy/categories.controller.ts` | `GET /categories(, /tree, /:slug, /:id/filter-schema)` | REF | — |
| `modules/locations/*` ، `modules/sellers/*` | ولایت/شهر، storefront | REF | ✅ `seller-accounts.service.spec.ts` |
| `common/presenters/public-listing.presenter.ts` | شکل عمومی (بدون contact values) | FULL | — |
| `modules/analytics/search-telemetry.service.ts` | ثبت zero-result | REF | ✅ spec |
| `prisma/schema.prisma` | مدل‌ها (Listing/searchText/jsonb، Category، Province/City، analytics) | FULL | — |
| `prisma/migrations/20261004070915_init/migration.sql` | pg_trgm GIN، enums، CHECK ها | FULL | — |
| `prisma/seed/taxonomy.data.ts` | ۱۲ دستهٔ ریشه + attributes | PART (91–330، 1164–1271) | — |
| `prisma/seed/locations.data.ts` | ۳۴ ولایت | PART | — |
| `docs/openapi.json` | قرارداد HTTP frozen v1.0.0 | REF | — |

### Frontend — مسیر عمودی جستجو/دسته/فیلتر/کشف

| مسیر فایل | نقش | وضعیت |
|---|---|---|
| `features/search/params.ts` | grammar URL، `toDiscoveryQuery`، `parseDiscoverySearchParams` | FULL |
| `features/search/parsers.ts` | parsers nuqs (client-only) | FULL |
| `features/search/telemetry.ts` | `recordZeroResultSearch` → `POST /search/zero-results` | FULL |
| `features/search/components/search-field.tsx` | ورودی جستجو (submit/clear/sync URL) | FULL |
| `features/search/components/filter-panel.tsx` | پنل دسکتاپ + sheet موبایل (dialog) | FULL |
| `features/search/components/attribute-filters.tsx` | فیلترهای schema-driven (**محل باگ NUMBER**) | FULL |
| `features/search/components/active-filter-chips.tsx` | چیپ‌های فیلتر فعال + clear-all | FULL |
| `features/search/components/sort-control.tsx` | انتخاب مرتب‌سازی | FULL |
| `features/search/components/discovery-results.tsx` | نتایج cursor + load-more + empty/retry | FULL |
| `features/search/components/field-inputs.tsx` | کنترل‌های پایه | FULL |
| `app/search/page.tsx` | صفحهٔ جستجو (SSR صفحهٔ اول) | FULL |
| `app/category/[slug]/page.tsx` | صفحهٔ دسته (SSR + filter-schema) | FULL |
| `app/categories/page.tsx` | مرورگر درختی دسته‌ها | FULL |
| `app/page.tsx` | صفحهٔ اصلی (hero search + دسته‌ها + آخرین آگهی) | FULL |
| `app/listing/[slug]/page.tsx` | جزئیات آگهی + related | PART |
| `features/listings/{api,types,format,index}.ts` | data-access، view models، formatting | FULL |
| `features/categories/{api,types,icon,ordering,index}.ts` | دسته‌ها + filter-schema | FULL |
| `features/locations/{api,types,index}.ts` | ولایت/شهر | FULL |
| `features/contacts/{api,components/contact-section}.tsx` | reveal تماس (POST + Idempotency) | FULL |
| `features/favorites/api.ts` | ذخیره/حذف موردعلاقه | FULL |

| `components/listings/{listing-card,listing-grid,gallery,seller-card,mobile-contact-bar,safety-notice,share-button}.tsx` | گرید/کارت/جزئیات | PART |
| `components/discovery/category-shortcut-grid.tsx` | میان‌بر دسته‌ها در خانه | FULL |
| `components/layout/{mobile-header,desktop-header,mobile-bottom-nav}.tsx` | هدر/ناوبری | FULL |
| `lib/api/{client,server,query-keys,errors,cache,browser}.ts` | مرز API (رفرش یک‌باره، envelope، keys) | PART |
| `middleware.ts` | گارد مسیر + کوکی session | FULL |
| `app/sitemap.ts` / `robots.ts` | SEO | FULL |
| `app/layout.tsx` / `globals.css` / `tailwind.config.ts` | RTL/فونت/token | FULL |
| `config/{site,brand}.ts` / `lib/i18n/config.ts` | برند/محل | PART |

### آمار ثبت‌شده (Truthful counts)

- فایل‌های مرتبط first-party شناسایی‌شده: ~75 (بدون `node_modules`/`.next`/`dist`/generated).
- کامل خوانده‌شده: ~48 • بخشی/مرجع: ~27.
- تست‌های unit اجراشده: FE 273 + BE 208 = **481 test**، همه PASS.
- تست‌هایی که اجرا نشد: integration/e2e/security (نیاز DB+seed)، lint، build، browser.
- عملیات API عمومی بررسی‌شده از openapi.json: `listings_discovery_list/detail`, `categories_list/tree/bySlug/filterSchema`, `locations_listProvinces/listCities`, `listings_contact_reveal`, `favorites_*`, `search_recordZeroResult`, `sellers_getPublicProfile/Listings`.

---

## I-C. نقشهٔ مسیرها و جریان کاربر (Route & User-Flow Map)

```mermaid
flowchart LR
  H[Homepage /] -->|SearchField q| S[/search?q=...]
  H -->|category pill| C[/category/:slug]
  H -->|LocationPicker| S
  H -->|دسته‌ها nav| CAT[/categories]
  CAT --> C
  C -->|filter/attr/sort| C
  S -->|filter/sort| S
  S -->|card click| D[/listing/:slug]
  C -->|card click| D
  D -->|reveal| CONTACT[POST /listings/:id/contact]
  D -->|favorite| F[POST/DELETE /favorites/:id]
  D -->|report| R[POST /listings/:id/report]
  D -->|seller card| SE[/seller/:slug]
  D -->|related| D2[/listing/:slug]
```

### مرز سرور/کلاینت و گرامر URL

- **SSR:** صفحهٔ اول نتایج در `search` و `category` از همان کوئری URL به‌صورت server-rendered ساخته می‌شود (`fetchListingsServer` → `GET /api/v1/listings`، revalidate 30s، tag `listings`).
- **Client:** تغییر فیلتر/جستجو با `nuqs` به `history:push` در URL می‌نشیند؛ `DiscoveryResults` با `useInfiniteQuery` و `cursor` صفحه‌های بعدی را `load more` می‌کند؛ با `key={discoveryKey(query)}` در هر تغییر URL یک session نو می‌شود.
- **گرامر URL (frozen):** `q`, `category`, `province`, `city`, `minPrice`, `maxPrice`, `condition` (CSV), `sort` (newest/price_asc/price_desc/most_viewed), `filter` (pipe-separated `key:op:value`). `locale` و `cursor` عمداً در URL نیستند.
- **قرارداد درخواست:** همهٔ پارامترها روی DTO معتبر (`MaxLength`, `Matches`, `IsEnum`, `ArrayMaxSize`) اعتبارسنجی و سپس در سرویس whitelist می‌شود.
- **حالت خطا:** خطای شبکه/500 در SSR → `ErrorState` + «تلاش دوباره»؛ لیست خالی → `EmptyState` + دکمهٔ «پاک کردن فیلترها»؛ خطای فیلتر نامعتبر (backend 400 VALIDATION_ERROR) → `ErrorState` (نه پیام درجا).
- **Stale/inactive:** آگهی‌ای که بین دو خواندن تغییر حالت دهد، در hydration از صفحه حذف می‌شود؛ آگهی منقضی (ACTIVE با `expiresAt` گذشته) فوراً مخفی است؛ جزئیات SOLD قابل نمایش ولی contact بسته.
- **مجوز:** search/filter/listing عمومی است و rate-limited؛ favorite/report/contact نیازمند ورود (favorites در `protected` middleware)؛ reveal تماس 401 → login با حفظ `next`.

## I-D. فهرست قابلیت‌ها بر اساس دامنه (Feature Inventory by Domain)

نمرهٔ ۰–۵ با معیار بخش II-C. «Runtime» یعنی آیا در این جلسه در browser/API زنده تأیید شد (چون browser در دسترس نبود، همه runtime = NOT RUN مگر تست unit).

| # | دامنه | وضعیت | شواهد سورس (path:line) | محدودیت/شکاف | کلیدی | نمره |
|---|---|---|---|---|---|---|
| 1 | ورود جستجو و ناوبری سراسری | present | `app/page.tsx` hero + `desktop-header.tsx:28` + `mobile-header.tsx:25` + `mobile-bottom-nav.tsx:11` | موبایل از آیکون جستجو به `/search` می‌رود (نه ورودی مستقل در هدر) | — | 3 |
| 2 | ورودی جستجو (submit/کلید/پاک‌کردن/نگهداری) | present | `search-field.tsx:42-96` (`type=search`, `role=search`, Enter submit، clear با حفظ URL) | بدون autocomplete/suggestion؛ بدون debounce (submit-only) | — | 3 |
| 3 | تفسیر کوئری و relevance | partial | `search-text.ts:44-56` (NFKC + folding)؛ `postgres-search.provider.ts` (LIKE)؛ `discovery.service.ts:432-444` (AND ≤6 term) | بدون ranking/fuzzy/synonym/stemming/morphology؛ تطابق فقط زیررشته‌ای | P2 | 2 |
| 4 | دسته‌ها | present | `taxonomy.data.ts:91-1271` (12 ریشه)؛ `categories/page.tsx`؛ `category/[slug]`؛ `taxonomy.service.ts` (visibility زنجیره) | دستهٔ `miscellaneous` بدون فرزند؛ عمق عمدتاً ۲؛ breadcrumb از backend می‌آید | — | 3 |
| 5 | فیلترها | **partial (باگ)** | `filter-panel.tsx`; `attribute-filters.tsx:29-48`; `filter-parser.ts`; `discovery.dto.ts` | **P1:** فیلترهای `YEAR/INTEGER/DECIMAL` به‌خاطر `type==='NUMBER'` رندر نمی‌شوند (`attribute-filters.tsx:40`)؛ MULTI_SELECT تک‌گزینه‌ای؛ DATE بدون کنترل | P1 | 2 |
| 6 | مرتب‌سازی و pagination | present | `sort-control.tsx`; `SEARCH_SORTS` (newest/price_asc/price_desc/most_viewed)؛ keyset cursor | بدون sort «relevance» (و ادعایی هم نشده)؛ load-more (نه pagination عددی) | — | 3 |
| 7 | چیدمان/کارت نتایج | present | `listing-card.tsx`؛ `listing-grid.tsx` (2/3/4 ستون)؛ badge مذاکره، شرط/شهر/زمان، placeholder بی‌تصویر، skeleton | بدون badge «فوری/فروخته» در feed (فقط favorites)؛ بدون قیمت‌به‌ازای متر مربع | — | 3 |
| 8 | بازیابی صفر/کم‌نتیجه | present | `discovery-results.tsx:67-76` + `emptyAction`؛ تله‌متری `search-field` + `telemetry.ts` | فقط «تغییر فیلتر/پاک‌کردن»؛ پیشنهاد جایگزین (relax/request-item) ندارد | P2 | 2 |
| 9 | URL/deep-link/history | present | `params.ts` (grammar)؛ `parsers.ts` (nuqs push)؛ `parseDiscoverySearchParams` | پارامترهای تکراری/ناسازگار به گرامر map نمی‌شوند؛ canonicalize پارامتر به CLI صریح نیست | — | 3 |
| 10 | SEO/indexing | present (ناقص) | `sitemap.ts` (استاتیک+دسته‌ها+آگهی‌ها، حذف `/search`)؛ `robots.ts`؛ `next.config.mjs` (noindex admin/account)؛ canonical هر صفحه | `/search` و facet-URL ها noindex ندارند؛ ترکیب فیلتر خالی 404 نمی‌شود؛ structured data (JSON-LD Product/Offer) در سورس دیده نشد | P2 | 2 |
| 11 | accessibility/RTL/کیبورد | partial (خوب در سورس) | `layout.tsx` (lang=fa-AF dir=rtl، skip-link)؛ `filter-panel.tsx` (dialog بومی focus-trap/Esc)؛ `globals.css` (reduced-motion, bidi)؛ `tailwind.config.ts` (touch 44px) | فیلدها label صحیح دارند؛ تست a11y خودکار/خوانندهٔ صفحه NOT RUN | — | 3 |
| 12 | runtime/performance | partial | SSR صفحهٔ اول؛ `server.ts` (timeout 10s)؛ revalidate 30s؛ `postgres` پروجکشن باریک + index | بدون اندازه‌گیری LCP/CLS/INP؛ بدون budget نهایی؛ فشرده‌سازی عکس از backend (`sharp`) | — | 2 |
| 13 | analytics/observability | partial | `ListingDailyStat` (views/phoneClicks/...)؛ zero-result telemetry؛ view-dedupe؛ `me_analytics_summary` | بدون event های search_submitted/filter_applied/sort_changed/click-through؛ دادهٔ query خصوصی است ولی minimum/retention صریحاً undocumented | P2 | 2 |
| 14 | security/abuse | present | `discovery.dto.ts` (caps)؛ rate-limit `search:list:ip`؛ whitelist فیلتر؛ `ListingContactMethod` reveal پشت POST+idempotency؛ audit | reveal تماس نیازمند ورود/تأیید شماره؛ تله‌متری جستجو `auth:false` (بدون rate-limit جدا در frontend مشاهده شد) | — | 3 |

## I-E. ارزیابی بصری و mobile-first (از سورس؛ runtime = NOT RUN)

**سیستم طراحی (VERIFIED IN SOURCE):** رنگ teal `#0F766E` (primary) و نارنجی `#F59E0B` (accent) در `globals.css:14-20`؛ شعاع ۸/۱۲/۱۶ (`tailwind.config.ts:67-72`)؛ فونت خودمیزبان Vazir با `font-display:swap`؛ مقیاس تایپ caption→display؛ ارتفاع کنترل ۴۴/#lگ ۴۸/هدر ۵۶/ناوبری پایین ۶۴px؛ breakpoint های `360/390/430/768/1024/1280/1536` — یعنی موبایل 320px هدف اصلی است ولی breakpoint صریح 320 ندارد (کوچک‌ترین 360px، `390` به‌عنوان مرجع).

**مشاهدات ساختاری (بدون runtime):**
- Homepage: hero جستجو بالای محتوا، میان‌بر ۱۲ دستهٔ ریشه (scroll افقی موبایل، flex دسکتاپ)، «آخرین آگهی‌ها»، CTA فروش، نکات ایمنی.
- کارت نتایج: گرید ۲ ستون موبایل/۳ تبلت/۴ دسکتاپ؛ aspect 4:3؛ placeholder «بدون تصویر»؛ قیمت درشت teal؛ badge «قابل مذاکره»؛ متادیتا شرط/شهر/زمان نسبی.
- صفحهٔ دسته/جستجو: پنل فیلتر ثابت (sticky) دسکتاپ + sheet تمام‌قد `<dialog>` موبایل با focus-trap/Esc/backdrop/دکمهٔ بستن؛ چیپ‌های فیلتر active با min-height 44 (موبایل) و 36 (دسکتاپ)؛ count روی دکمهٔ فیلتر موبایل.
- RTL: `dir=rtl` روی `<html>`؛ `bidi-ltr`/`bidi-isolate` برای شماره/تماس؛ فلیپ آیکون `flip-rtl`؛ `reduced-motion` سراسری.

**مشاهداتی که باید runtime تأیید شوند (و اینجا NOT RUN):** viewport های 320/360/390/430/768/1024/1366؛ همپوشانی کیبورد؛ حفظ scroll بازگشت از آگهی به نتایج؛ safe-area در آیفون؛ خوانندهٔ صفحهٔ sheet؛ تمرکز پس از بستن dialog؛ CLS تصاویر. **هیچ اسکرین‌شاتی ثبت نشد.**

> علامت‌گذاری: تمام موارد بصری/تعاملی = `NOT RUN` طبق قاعدهٔ گزارش، مگر آن‌که صریحاً «ساختاری/source» گفته شده باشد.

## I-F. راستی‌آزمایی پایه (Baseline Verification)

دستورات و نتایج واقعی (زمان اجرا: ۱۸ اکتوبر ۲۰۲۶):

| چک | فرمان | نتیجهٔ واقعی |
|---|---|---|
| FE typecheck | `cd weshbazar-frontend; npm run typecheck` | ✅ `tsc --noEmit` → **exit 0** |
| BE typecheck | `cd weshbazar-backend; npm run typecheck` | ✅ `tsc -p tsconfig.json` + workspace → **exit 0** |
| FE unit | `npx jest --ci --passWithNoTests` | ✅ **37 suites / 273 tests PASS** (۵۹.۹۹s؛ هشدار «worker force-exited» = teardown leak جزئی، نه شکست تست) |
| BE unit | `npm run test --workspace @weshbazar/api` | ✅ **23 suites / 208 tests PASS** (۳۴.۷۳s) |
| Lint | `next lint` / `eslint .` | ❌ اجرا نشد (محدودیت زنجیرهٔ shell) |
| Build | `next build` / `nest build` | ❌ اجرا نشد |
| Integration/E2E/Security | `test:integration`/`test:e2e`/`test:security` | ❌ اجرا نشد (نیاز Postgres + seed؛ در این جلسه DB ایزوله نگه‌داشته نشد) |
| Browser smoke / a11y / perf | — | ❌ NOT RUN |

> یادداشت: هنگام اجرای BE unit، سرویس مسیرها را log می‌کند و `PrismaService` پیام «Database connection established» می‌دهد (یک Postgres محلی در دسترس است) و job های پس‌زمینه (`expire-listings`, `archive-stale-drafts`, `clean-*`) زمان‌بندی شدند. این از لاگ تست استنتاج می‌شود، نه ادعای runtime محصول.
---

# PART II — ثبت معیارهای پژوهشی + ماتریس شکاف تأییدشده

## II-A. ساختار ثبت (Master Checklist)

- هر معیار یک ID پایدار دارد (`SRCH‑`, `QUERY‑`, `CAT‑`, `FILT‑`, `SORT‑`, `URL‑`, `RTL‑`, `A11Y‑`, `SEO‑`, `PERF‑`, `API‑`, `DB‑`, `SEC‑`, `ANALYTICS‑`, `MKT‑`).
- نوع: `N` = هنجاری (W3C/Google/Next)، `T` = توصیهٔ UX آزموده (Baymard/NNg)، `O` = الگوی مشاهدتی رقبا، `L` = استنتاج بازار محلی، `E` = آزمایش پیشنهادی.
- Applicability: `must` / `should` / `opportunity` / `N/A` / `owner-decision`.
- وضعیت: `PASS-SOURCE` / `PASS-TEST` / `PARTIAL` / `FAIL` / `NOT-IMPL` / `UNKNOWN` / `N/A`.
- **صداقت در حجم:** این نسخه **۱۱۸ معیار اتمیک یکتا** دارد. رسیدن به «هزاران ردیف» بدون تکرار/پدینگ/اختراع ممکن نیست و ناقض قاعدهٔ «بدون filler» است؛ ساختار برای گسترش granular هر دامنه آماده است و شمار واقعی (نه تورمی) ذکر می‌شود.

> اختصارات منبع: `[G-facet]` Google crawling/faceted-navigation • `[NX-sitemap]`/`[NX-robots]` Next.js docs • `[WCAG22]` • `[Baymard-qt]` Ecommerce Search Query Types 2026 • `[Baymard-af]` Applied Filters Overview • `[Baymard-pl]` Product List UX • `[NNg]` Nielsen Norman • `[Leelam]/[Divar]/[eBay]/[FBM]` مراجع الگویی • `[GFM]` master prompt محصول. منابع fetch شدهٔ واقعی جدا در ضمیمه با تاریخ دسترسی ثبت شده‌اند.

### دامنه ۱–۵: ورود/ورودی/تفسیر کوئری

| ID | معیار اتمیک | نوع | منبع | واجب‌بودن | وضعیت |
|---|---|---|---|---|---|
| SRCH-001 | جستجو از صفحهٔ اصلی بدون اسکرول در دسترس باشد | T | Baymard-pl, GFM | must | PASS-SOURCE |
| SRCH-002 | هدر desktop نقطهٔ جستجو داشته باشد | T | Baymard-pl | should | PASS-SOURCE |
| SRCH-003 | موبایل نقطهٔ ورود صریح جستجو داشته باشد | T | Baymard-pl | must | PASS-SOURCE |
| SRCH-004 | Enter و کلیک رفتار یکسان داشته باشند | N | WCAG22 3.2.1 | must | PASS-SOURCE |
| SRCH-005 | فیلد `type=search` + برچسب در دسترس | N | WCAG22 3.3.2 | must | PASS-TEST |
| SRCH-006 | دکمهٔ پاک‌کردن با برچسب در دسترس | N | WCAG22 4.1.2 | must | PASS-SOURCE |
| SRCH-007 | کوئری پس از submit در URL حفظ شود | T | GFM | should | PASS-SOURCE |
| SRCH-008 | کوئری پس از refresh/back/forward بازیابی شود | T | GFM | should | PASS-SOURCE |
| QUERY-001 | ورودی whitespace/خالی ایمن باشد | T | GFM | must | PASS-SOURCE |
| QUERY-002 | حداکثر طول پرس‌وجو محدود باشد | N | GFM | must | PASS-SOURCE |
| QUERY-003 | نرمال‌سازی فارسی/عربی (ي→ی، ك→ک) | L | GFM | must | PASS-TEST |
| QUERY-004 | fold ارقام فارسی/عربی به لاتین | L | GFM | should | PASS-TEST |
| QUERY-005 | حذف zero-width/bidi/harakat/tatweel | N | W3C bidi | should | PASS-SOURCE |
| QUERY-006 | ترتیب/نقطه‌گذاری در تطابق خلل ایجاد نکند | T | Baymard-qt | should | PASS-SOURCE |
| QUERY-007 | پرس‌وجوی چندکلمه‌ای AND باشد | T | Baymard-qt | should | PASS-SOURCE |
| QUERY-008 | سقف تعداد ترم جستجو | N | GFM | should | PASS-SOURCE |
| QUERY-009 | اصلاح غلط تایپی (fuzzy) | T | Baymard-qt | opportunity | FAIL |
| QUERY-010 | مترادف (synonym) | T | Baymard-qt | opportunity | NOT-IMPL |
| QUERY-011 | mixed-script مدل/برند لاتین + دری | L | GFM | should | PARTIAL |
| QUERY-012 | ranking مبتنی بر سیگنال | T | Baymard-qt | opportunity | NOT-IMPL |
| QUERY-013 | autocomplete/suggestions | T | Baymard-qt | opportunity | NOT-IMPL |

### دامنه ۶–۹: دسته‌ها، فیلترها، مرتب‌سازی، URL

| ID | معیار اتمیک | نوع | منبع | واجب‌بودن | وضعیت |
|---|---|---|---|---|---|
| CAT-001 | دسته‌بندی سلسله‌مراتبی با والد/فرزند | T | Baymard-pl | must | PASS-SOURCE |
| CAT-002 | breadcrumb مسیر در صفحهٔ دسته | T | Baymard-pl | should | PASS-SOURCE |
| CAT-003 | دستهٔ غیرفعال/بایگانی نشت نکند | N | GFM | must | PASS-SOURCE |
| CAT-004 | دستهٔ بدون آیتم حالت خالی صادقانه نشان دهد | T | Baymard-pl | must | PASS-SOURCE |
| CAT-005 | ورود مستقیم به `/:slug` نامعتبر → 404 | T | GFM | must | PASS-SOURCE |
| CAT-006 | آیکون/برچسب دسته از backend (نه hardcode) | T | GFM | must | PASS-SOURCE |
| FILT-001 | فیلترهای category-specific از filter-schema می‌آیند (نه hardcode) | N | GFM | must | PASS-SOURCE |
| FILT-002 | فیلتر نوع SELECT تک‌گزینه‌ای | T | Baymard-pl | should | PASS-SOURCE |
| FILT-003 | فیلتر MULTI_SELECT چندگزینه‌ای | T | Baymard-pl | should | **FAIL** (تک‌گزینه‌ای رندر می‌شود) |
| FILT-004 | فیلتر عددی INTEGER/DECIMAL/YEAR با حداقل/حداکثر | T | Baymard-pl | must | **FAIL** (باگ `NUMBER`) |
| FILT-005 | فیلتر BOOLEAN eq | T | Baymard-pl | should | PASS-SOURCE |
| FILT-006 | فیلتر TEXT contains | T | Baymard-pl | should | PASS-SOURCE |
| FILT-007 | فیلتر DATE eq/gte/lte | T | Baymard-pl | owner-decision | NOT-IMPL (دلخواه؛ seed DATE ندارد) |
| FILT-008 | فیلتر قیمت min/max | T | Baymard-pl | must | PASS-SOURCE |
| FILT-009 | فیلتر condition چندمقداری | T | Baymard-pl | must | PASS-SOURCE |
| FILT-010 | فیلتر location (province→city آبشاری) | T | Baymard-pl/NNg | must | PASS-SOURCE |
| FILT-011 | وابستگی city به province (غیرفعال تا انتخاب) | T | NNg | should | PASS-SOURCE |
| FILT-012 | فیلتر ناشناخته رد شود (نه silent-drop) | N | GFM | must | PASS-SOURCE |
| FILT-013 | min>max اعتبارسنجی شود | N | GFM | must | PASS-SOURCE (backend 400) |
| FILT-014 | فیلتر applied بلافاصله اعمال شود | T | Baymard-pl | should | PASS-SOURCE |
| FILT-015 | چیپ overview فیلترهای فعال + حذف تکی | T | Baymard-af | must | PASS-SOURCE |
| FILT-016 | «پاک کردن همه» کل فیلترها | T | Baymard-af | must | **PARTIAL** (query/sort را پاک نمی‌کند) |
| FILT-017 | sheet/drawer موبایل فیلتر با apply/close | T | Baymard-pl | must | PASS-SOURCE |
| FILT-018 | شمارش نتایج/فیلتر (facet count) | T | Baymard-pl | opportunity | NOT-IMPL |
| SORT-001 | ترتیب پیش‌فرض تازه‌ترین | T | Baymard-pl | must | PASS-SOURCE |
| SORT-002 | مرتب‌سازی قیمت صعودی/نزولی | T | Baymard-pl | should | PASS-SOURCE |
| SORT-003 | sort که ادعای relevance دارد فقط با معنای واقعی | N | GFM | must | PASS-SOURCE (ادعا نشده) |
| SORT-004 | تغییر sort در URL ذخیره شود | T | GFM | should | PASS-SOURCE |
| URL-001 | پارامترهای URL نام API را mirror کنند | N | GFM | must | PASS-SOURCE |
| URL-002 | canonical برای صفحهٔ clean | N | G-facet | must | PASS-SOURCE |
| URL-003 | پارامترهای facet crawl‌شونده نباشند | N | G-facet | must | **PARTIAL** (no noindex روی facet) |
| URL-004 | ترتیب منطقی فیلترها ثابت و بدون duplicate | N | G-facet | should | PARTIAL |
| URL-005 | ترکیب فیلتر بی‌نتیجه 404 باشد | N | G-facet | should | FAIL (200 خالی برمی‌گرداند) |
| URL-006 | encoding درست پارامترها | N | GFM | must | PASS-SOURCE |

### دامنه ۱۰–۱۴: RTL/دسترس‌پذیری، SEO، عملکرد، API، DB

| ID | معیار اتمیک | نوع | منبع | واجب‌بودن | وضعیت |
|---|---|---|---|---|---|
| RTL-001 | `html dir=rtl lang=fa-AF` صحیح باشد | N | W3C bidi | must | PASS-SOURCE |
| RTL-002 | ایزوله‌سازی bidi برای شماره/URL/مدل لاتین | N | W3C bidi | must | PASS-SOURCE |
| RTL-003 | جهت آیکون/فلش مبتنی بر logical properties | T | GFM | should | PASS-SOURCE |
| RTL-004 | قالب عدد/ارز فارسی (افغانی) به‌جای چیزی نامناسب | L | GFM | must | PASS-SOURCE |
| A11Y-001 | skip-link به محتوای اصلی | N | WCAG22 2.4.1 | must | PASS-SOURCE |
| A11Y-002 | عنوان صفحه (Page Titled) | N | WCAG22 2.4.2 | must | PASS-SOURCE |
| A11Y-003 | ترتیب تمرکز معنادار | N | WCAG22 2.4.3 | must | PASS-SOURCE |
| A11Y-004 | تمرکز قابل‌مشاهده | N | WCAG22 2.4.7 | must | PASS-SOURCE (ring) |
| A11Y-005 | برچسب فرم‌ها | N | WCAG22 3.3.2 | must | PASS-SOURCE |
| A11Y-006 | تشخیص خطاها | N | WCAG22 3.3.1 | must | PARTIAL (خطاها صفحه‌ای، نه درجا) |
| A11Y-007 | هدف لمسی ≥۲۴×۲۴ (در اینجا ۴۴px) | N | WCAG22 2.5.8 | must | PASS-SOURCE |
| A11Y-008 | کنتراست متن/غیرمتن طبق حداقل | N | WCAG22 1.4.3/1.4.11 | must | UNKNOWN (ابزار اجرا نشد) |
| A11Y-009 | reflow در ۳۲۰px | N | WCAG22 1.4.10 | must | UNKNOWN (NOT RUN) |
| A11Y-010 | dialog/sheet با focus-trap + Esc + بازگشت تمرکز | N | WCAG22 | must | PASS-SOURCE (dialog بومی) |
| A11Y-011 | احترام به reduced-motion | N | WCAG22 2.3.3 | must | PASS-SOURCE |
| SEO-001 | sitemap فقط صفحات واقعی (بدون `/search`) | N | G-facet/NX-sitemap | must | PASS-SOURCE |
| SEO-002 | robots آدرس sitemap + disallow خصوصی | N | NX-robots | must | PASS-SOURCE |
| SEO-003 | noindex برای admin/account | N | G-facet | must | PASS-SOURCE |
| SEO-004 | canonical به clean URL | N | G-facet | must | PASS-SOURCE |
| SEO-005 | meta title/description مفید | N | G-facet | should | PASS-SOURCE |
| SEO-006 | OG image برای آگهی | T | G-facet | should | PASS-SOURCE |
| SEO-007 | structured data فقط مشروع (بدون rating/stock جعلی) | N | G-facet | must | NOT-IMPL (جواز classified باید بررسی شود) |
| SEO-008 | آگهی inactive/sold در sitemap نباشد | N | G-facet | must | PASS-SOURCE (فقط ACTIVE feed می‌آید) |
| PERF-001 | SSR صفحهٔ اول نتایج | N | GFM | must | PASS-SOURCE |
| PERF-002 | image responsive + lazy | T | GFM | should | PASS-SOURCE |
| PERF-003 | پروجکشن باریک DB برای feed | T | GFM | should | PASS-SOURCE |
| PERF-004 | debounce/cancel برای درخواست‌ها | T | GFM | should | PASS-SOURCE (submit-only؛ race در query-key است) |
| PERF-005 | جلوگیری از race پاسخ‌های دیررس | T | GFM | should | PARTIAL (remount با key) |
| PERF-006 | بودجه/اندازه‌گیری LCP/CLS/INP | N | GFM | opportunity | NOT-IMPL |
| API-001 | قرارداد تنها منبع (openapi.json) | N | GFM | must | PASS-SOURCE |
| API-002 | کرسور pagination پایدار | T | GFM | must | PASS-SOURCE |
| API-003 | پاسخ envelope خطا با requestId | T | GFM | must | PASS-SOURCE |
| API-004 | اعتبارسنجی/کپس پارامتر | N | GFM | must | PASS-SOURCE |
| DB-001 | pg_trgm GIN روی searchText | N | GFM | must | PASS-SOURCE (migration SQL) |
| DB-002 | index روی (status,createdAt)، (status,categoryId)، (status,provinceId,cityId) | T | GFM | must | PASS-SOURCE |
| DB-003 | همهٔ مقادیر parameterized (بدون SQL ساختنی) | N | GFM | must | PASS-SOURCE |
| DB-004 | EXPLAIN/metrics کوئری اندازه‌گیری شود | T | GFM | opportunity | NOT-IMPL |

### دامنه ۱۵–۱۹: امنیت، analytics، بازار/رشد، تست، عملیات

| ID | معیار اتمیک | نوع | منبع | واجب‌بودن | وضعیت |
|---|---|---|---|---|---|
| SEC-001 | rate-limit روی جستجو عمومی | N | GFM | must | PASS-SOURCE (`search:list:ip`) |
| SEC-002 | سقف پارامتر/فیلتر (طول/تعداد) برای مقابله با abuse | N | GFM | must | PASS-SOURCE |
| SEC-003 | فیلتر/op/value هرگز به SQL خام نرسد | N | GFM | must | PASS-SOURCE |
| SEC-004 | شمارهٔ تماس فقط از مسیر reveal (نه embedded) | N | GFM | must | PASS-SOURCE |
| SEC-005 | reveal تماس نیازمند login + idempotency | N | GFM | must | PASS-SOURCE |
| SEC-006 | حد نگه‌داشت/aggregation تله‌متری جستجو مستند باشد | L | GFM | should | PARTIAL (سند ندارم) |
| ANALYTICS-001 | event `search_submitted` | E | GFM | opportunity | NOT-IMPL |
| ANALYTICS-002 | event `search_zero_results` | T | Baymard-qt | must | PASS-SOURCE |
| ANALYTICS-003 | event `filter_applied/removed/cleared` | E | GFM | opportunity | NOT-IMPL |
| ANALYTICS-004 | event `sort_changed` | E | GFM | opportunity | NOT-IMPL |
| ANALYTICS-005 | event `listing_card_opened` | E | GFM | opportunity | NOT-IMPL |
| ANALYTICS-006 | contact-intent ثبت شود (daily counters) | E | GFM | should | PARTIAL (schema دارد؛ مسیر reveal پیاده شده ولی کامل trace نشد) |
| ANALYTICS-007 | نرخ صفر→اصلاح→کلیک قابل محاسبه باشد | E | GFM | opportunity | FAIL |
| MKT-001 | جستجوی ذخیره‌شده/هشدار (saved search/alerts) | O | eBay/FBM | opportunity | NOT-IMPL |
| MKT-002 | «درخواست کالای موجود نیست» (request item) | L | GFM | opportunity | NOT-IMPL |
| MKT-003 | صفحهٔ فروشندهٔ عمومی (storefront) | O | FBM | should | PASS-SOURCE |
| MKT-004 | related listings (هم‌دسته) | O | eBay | opportunity | PASS-SOURCE |
| MKT-005 | سیگنال اعتماد (phoneVerified، memberSince) | L | GFM | should | PASS-SOURCE |
| MKT-006 | گزارش scam/گزارش آگهی | L | GFM | must | PASS-SOURCE |
| TEST-001 | unit test برای parser/نرمال‌سازی | E | GFM | must | PASS-TEST |
| TEST-002 | تست a11y خودکار | E | GFM | should | NOT-IMPL |
| TEST-003 | تست E2E جریان جستجو/فیلتر | E | GFM | should | NOT RUN (وجود دارد ولی اجرا نشد) |
| TEST-004 | تست visual regression | E | GFM | opportunity | NOT-IMPL |
| OPS-001 | مانیتورینگ خطا/درخواست با requestId | T | GFM | should | PASS-SOURCE |
| OPS-002 | سند runbook/rollback | T | GFM | should | PASS-SOURCE (`docs/RUNBOOK.md`) |
| OPS-003 | feature-flag در صورت لزوم | T | GFM | opportunity | UNKNOWN |

---

## II-C. مقایسه و کارنامه (Scorecard)

**مقیاس شواهد (۰–۵):** ۰ = غایب/شکسته • ۱ = مفهومی/نوپا • ۲ = پیاده‌سازی ناقص • ۳ = در سورس ولی بدون تأیید runtime • ۴ = تأییدشده با تست خودکار + runtime • ۵ = معتبر با دادهٔ کاربر/تولید واقعی. قاعده: نمرهٔ ۴ بدون تست+ runtime و نمرهٔ ۵ بدون شواهد کاربری داده نمی‌شود.

| بُعد | نمره | پوشش شواهد | PASS | PARTIAL | FAIL | NOT-IMPL | گپ وزنی |
|---|---|---|---|---:|---:|---:|---:|---:|
| کیفیت فنی/korrectness (backend) | 4 | بالا (typecheck+unit) | — | — | — | — | کم |
| کیفیت UX | 2 | متوسط (سورس؛ بدون runtime) | — | — | — | — | زیاد (باگ P1 فیلتر عددی) |
| SEO crawl/index readiness | 3 | متوسط | — | — | — | — | متوسط (facet noindex، 404 خالی) |
| تاب‌آوری bandwidth پایین | 3 | متوسط (SSR/تصویر) | — | — | — | — | اندازه‌گیری‌نشده |
| کیفیت retrieval | 2 | متوسط | — | — | — | — | بدون ranking/fuzzy |
| analytics/اندازه‌گیری | 1 | کم | — | — | — | — | فقط zero-result |
| حریم‌خصوصی/امنیت | 4 | بالا | — | — | — | — | خوب در سورس |
| اعتبار بازار/کسب‌وکار | 0 | هیچ | — | — | — | — | دادهٔ کاربر وجود ندارد |

> شمارش وضعیت ثبت: PASS=85، PARTIAL=8، FAIL=5، NOT-IMPL=16، UNKNOWN=3، NOT-RUN=1 (مجموع ۱۱۸). یک «شاخص کل» نمی‌دهیم چون ترکیب ابعاد نامتجانس گمراه‌کننده است؛ در صورت نیاز فرمول/وزن‌ها جدا اعلام می‌شود.

### ده نقص P0/P1 (بعد از بررسی کامل ماتریس)

1. **P1 — فیلترهای عددی دسته‌ها رندر نمی‌شوند** (`attribute-filters.tsx:40` من به `NUMBER` نگاه می‌کند؛ واقعیت `INTEGER/DECIMAL/YEAR`). دسته‌های وسایط/املاک/موبایل فیلتر سال/کیلومتر/متراژ را از دست می‌دهند.
2. **P1 — MULTI_SELECT به شکل تک‌گزینه‌ای رندر می‌شود** (قابلیت چندانتخابی backend بی‌استفاده).
3. **P1/buss — «پاک کردن همه» متن جستجو و sort را پاک نمی‌کند** (ناسازگار با برچسب؛ `filter-panel.tsx:39-47` + `CLEARED_FILTERS`).
4. **P1/a11y — خطای فیلتر (مثلاً min>max) صفحه‌ای است، نه درجا** (WCAG 3.3.1).
5. **P2 — facet/search URLs noindex و canonical‌سازی 404-خالی ندارند** (ریسک crawl explosion؛ URL-003/005).
6. **P2 — عدد «N آگهی پیدا شد» فقط طول صفحهٔ اول است** (گمراه‌کننده وقتی بیش از ۲۴ نتیجه).
7. **P2 — بدون ranking/fuzzy/synonym/autocomplete** (retrieval در حد MVP).
8. **P2 — analytics فقط zero-result دارد** (بدون submit/filter/sort/click/contact-outcome).
9. **P2 — بدون تست a11y/visual/perf خودکار** (A11Y-008/009, TEST-002/004).
10. **P2 — structured data (JSON-LD) برای آگهی وجود ندارد** (SEO-007 — با بررسی جواز classified).

### ده فرصت بالاترین تأثیر (بعد از ماتریس، نه قبل آن)

1. رفع باگ NUMBER → آزادسازی فیلترهای عددی/سال/متراژ (کم‌هزینه، فوری).
2. افزودن facet counts (شمارش نتایج) در فیلترها (تأثیر UX زیاد).
3. بازیابی صفر-نتیجه: پیشنهاد relax/دستهٔ نزدیک + «درخواست کالا» (owner-decision).
4. تعریف سیاست noindex/canonical/404 برای facet و `/search` (SEO).
5. داشبورد سادهٔ analytics (zero-result + contact-intent + click-through) با privacy-review.
6. autocomplete محدود بر پایهٔ دسته/برند موجود، فقط در صورت اندازه‌پذیری (نه AI سنگین).
7. اصلاح «پاک کردن همه» برای پاک‌کردن q/sort یا تغییر برچسب.
8. related/ذخیره‌شده/هشدار فقط با شواهد تقاضا (آزمایش).
9. افزودن تست E2E جریان جستجو/فیلتر + visual regression.
10. اندازه‌گیری Core Web Vitals و بودجهٔ payload روی شبکهٔ ضعیف.

---

# PART III — نقشهٔ کامل از وضعیت فعلی به هدف

## III-A. نقشهٔ صادقانهٔ وضعیت فعلی

- **معماری مؤلفه/مسیر (تأییدشده):** Next.js App Router (RSC) ← same-origin proxy `/api/v1/*` → NestJS 12 + Fastify 5 → `DiscoveryService` (visibility + whitelist) → `PostgresSearchProvider` (یک statement پارامتری pg_trgm) → hydration از `LISTING_ROW_INCLUDE`. مقادیر تماس فقط از `POST /listings/:id/contact`.
- **گرامر URL/ماشین حالت:** state URL = `{q, category, province, city, minPrice, maxPrice, condition[], sort, filter[]}`؛ `category` در صفحهٔ دسته از route می‌آید و مابقی از query؛ تغییر = `history.push`؛ `sort=newest` و `cursor` از URL حذف می‌شوند؛ صفر-نتیجه = EmptyState، خطای فیلتر = ErrorState صفحه‌ای.
- **Taxonomy (از seed):** ۱۲ ریشه (`vehicles`, `real-estate`, `mobiles-electronics`, `home-furniture`, `fashion-beauty`, `jobs-services`, `animals-agriculture`, `kids-baby`, `books-education`, `sports-leisure`, `medical-health`, `miscellaneous`) با فرزندان و attributes داینامیک از نوع `SELECT/TEXT/YEAR/INTEGER/DECIMAL/BOOLEAN/MULTI_SELECT`.
- **جریان داده API→DB:** کوئری DTO معتبر → `SearchCriteria` → provider → ids → hydration → presenter عمومی (بدون moderation/contact values) → response `CursorPage`.
- **سیستم بصری:** token های teal/orange، شعاع ۸/۱۲/۱۶، لمس ۴۴px، Vazir، RTL + bidi، reduced-motion (خلاصه در I-E).
- **شکاف‌های شناخته‌شده و نامطمئن:** باگ NUMBER (قطعی)، facet 404/noindex (ناقص)، ranking/fuzzy/autocomplete (غایب)، analytics (حداقلی)، تست a11y/perf/E2E (اجرا نشده)، دادهٔ کاربر/بازار (مفقود).

## III-B. مشخصات تعامل آینده (Future-State Interaction Spec)

برای هر مورد: مسئله ← رفتار ← آناتومی ← effect URL ← نیاز API/قرارداد ← شکست ← risk ← تست ← معیار release.

1. **Homepage search/discovery** — keep hero + pills؛ افزودن *result-preview on focus* صرفاً در صورت اندازه‌گیری (نه default). مسئله: وضوح ورود؛ release: LCP<2.5s روی 3G.
2. **صفحهٔ نتایج جستجو** — افزودن شمارش واقعی total (نه طول صفحه)؛ کپسول query؛ حالت «جستجوی مشابه».
3. **صفحهٔ دسته** — breadcrumb + subcategory + facet counts؛ دستهٔ بدون آگهی پیام هدایت به دستهٔ والد.
4. **Mobile sheet/Desktop panel** — حفظ dialog بومی؛ افزودن واضح «Apply/Clear» (apply فقط می‌بندد چون مقدار فوراً در URL است).
5. **چیپ‌های فیلتر** — keep؛ رفع «پاک کردن همه» برای q/sort یا برچسب «پاک کردن فیلترها».
6. **مرتب‌سازی + شمارش** — شمارش total stable با cursor؛ برچسب sort شفاف.
7. **Autocomplete (مشروط)** — منبع = دسته/برند/مدل موجود؛ relevance=popularity؛ fallback=no-op؛ privacy=حداقل نگه‌داشت؛ فقط اگر قابل اندازه‌گیری.
8. **صفر/خطا/آفلاین** — EmptyState با relax filters + پیشنهاد دستهٔ نزدیک؛ retry idempotent؛ offline seed/page.
9. **کارت‌ها** — density ۲ ستون موبایل؛ placeholder تصویری؛ status SOLD فقط در favorites.
10. **Deep-link/back** — حفظ URL به‌عنوان single source of truth؛ canonicalize پارامتر با ترتیب ثابت.
11. **فیلتر اختصاصی دسته** — از filter-schema؛ **فیکس NUMBER**؛ MULTI_SELECT واقعی؛ DATE (در صورت seed).
12. **مسیر جستجو→جزئیات→تماس** — keep reveal گام‌به‌گام؛ back-to-results با حفظ scroll و query (تأیید runtime).
13. **Loading/skeleton/stale** — skeleton به‌جای پرش؛ نشانگر stale برای آگهی منقضی/فروخته؛ image fallback.
14. **موبایل/تبلت/دسکتاپ/کیبورد/SR/RTL** — touch 44px؛ focus trap؛ live region برای «N آگهی»؛ bidi isolate.
15. **a11y/performance targets** — WCAG 2.2 AA؛ LCP<2.5, CLS<0.1, INP<200ms؛ payload JS<170KB gzip.

## III-C. معماری جستجو و معناشناسی کوئری (Target)

لایهٔ هدف بر پایهٔ backend فعلی (نه موتور سنگین جدید)، با علامت‌گذاری گزینه‌های آینده:

1. **نرمال‌سازی ورودی (keep):** NFKC + folding حروف/ارقام موجود؛ افزودن ZWNJ-split آگاهانه و حذف نقطه‌گذاری فقط برای index (raw برای نمایش حفظ شود). Unsafe transform (تغییر نام محصول) هرگز.
2. **اعتبارسنجی/حد:** طول ۱۲۰، ترم ≤۶، کپس `filter`، رد پارامتر تکراری/ناشناخته — همگی موجود؛ افزودن پیام خطای درجا (نه صفحه‌ای).
3. **تفسیر کوئری:** exact title/model → token match → category match → freshness (weights پیشنهادی = hypothesis تا اندازه‌گیری، نه عدد جعلی).
4. **Ranking:** exact-title match اول، سپس attr-keyword، بعد freshness؛ `most_viewed` را با relevance اشتباه نگیریم.
5. **تصحیح/مترادف/autocomplete:** فقط پس از سنجش تقاضا؛ نگه‌داشت dictionary از seed (برند/مدل) ارزان‌تر از AI.
6. **DB/index:** keep pg_trgm؛ برای scale > چندصد هزار آگهی، EXPLAIN و در صورت نیاز `tsvector` یا OpenSearch (provider interface آماده است).
7. **Pagination/cache/race:** keep keyset cursor؛ cache کلید = query canonical؛ `AbortController` هنگام remount.
8. **Telemetry:** حداقل داده، aggregation، retention، access-control (جزئیات در III-E).

## III-D. سیاست SEO و facet پیش‌رو

- **Index-worthy:** صفحات دستهٔ stable `/category/[slug]` و جزئیات ACTIVE `/listing/[slug]`؛ NOT index-worthy: `/search*` و هر facet/query param.
- **ابعاد crawl:** `/search` (و `/category/*` با هر query param) → `X-Robots-Tag: noindex,follow` یا `nofollow`؛ canonical صفحهٔ دسته = `/category/[slug]` (بدون param).
- **ترکیب خالی:** طبق `[G-facet]`، برگرداندن **404** برای ترکیب فیلتر بی‌نتیجه (نه redirect عمومی) — نیاز به تصمیم مالک چون رفتار فعلی «۲۰۰ خالی» است.
- **robots.txt:** keep disallow `/admin /account`؛ **نه** block کردن منابع render (CSS/JS).
- **structured data:** برای classified، `Offer`/`Product` صرفاً با دادهٔ صادقانه؛ **بدون** rating/review/stock/shipping/purchase. وعدهٔ rich result داده نشود (SEO-007).
- **آگهی inactive/sold/expired** → از sitemap و از discovery حذف (موجود)؛ sold در جزئیات noindex/status روشن شود.

## III-E. اندازه‌گیری و حلقهٔ بازخورد بازار

فقط event های منطبق بر قابلیت واقعی؛ هر event با field/purpose/کلاس privacy/retention/تصمیم:

| Event | فیلدها | تصمیمی که می‌سازد |
|---|---|---|
| `search_submitted` (آینده) | q, category, province (بدون شناسه) | تقاضای واقعی واژه‌ها |
| `search_results_viewed` | count, q, filters | کیفیت recall |
| `search_zero_results` (موجود) | q, category, province | فرصت «درخواست کالا» |
| `filter_applied/removed/cleared` | filter key/op | کاربرد فیلتر |
| `sort_changed` | sort | ترجیح کاربر |
| `listing_card_opened` | listing slug, pos | CTR و ranking |
| `contact_intent_started/reveal` | method (نه شماره) | نرخ تبدیل تماس |
| `seller_*` (موجود در analytics partial) | — | فعال‌سازی/بازگشت فروشنده |

قاعدهٔ حریم‌خصوصی: متن جستجو حساس است → نگه‌داشت حداقلی، aggregation، بدون شماره/بدنهٔ پیام/شناسهٔ کاربر در log؛ retention و access-control مستند شود (SEC-006). مقادیر فعلاً قابل‌اندازه‌گیری: فقط `search_zero_result` + counters روزانهٔ تماس/بازدید؛ بقیه نیاز به instrumentation دارند.

## III-F. نقشهٔ راه اولویت‌بندی‌شده + دروازه‌های Go/No-Go

**P0 — درستی/امنیت/حریم‌خصوصی:** (۱) fix باگ `NUMBER` (شواهد `attribute-filters.tsx:40`؛ وابستگی صفر به contract؛ effort S)؛ (۲) پاک‌کردن همه/or برچسب (`filter-panel.tsx:39-47`؛ S)؛ (۳) مستندسازی retention تله‌متری (owner-decision؛ S).
**P1 — آمادگی عرضه:** (۴) MULTI_SELECT واقعی (S)؛ (۵) خطای فیلتر درجا (M)؛ (۶) facet noindex/404 (M)؛ (۷) شمارش total (S)؛ (۸) پوشش تست E2E جستجو/فیلتر (M).
**P2 — کیفیت جستجو/رشد:** (۹) facet counts (M)؛ (۱۰) صفر-نتیجه relax/دستهٔ نزدیک (M)؛ (۱۱) analytics event submit/filter/sort/click/contact (M، پس از privacy-review)؛ (۱۲) ranking مبتنی بر سیگنال (L)؛ (۱۳) SEO structured data truthful (S)؛ (۱۴) autocomplete محدود (L، مشروط به داده).
**P3 — پیشرفته/آزمایشی:** (۱۵) saved search/alerts، (۱۶) request-item، (۱۷) OpenSearch — فقط با ترافیک/دادهٔ واقعی؛ بدون معماری زودهنگام AI.

هر آیتم بالا: criterion ID، فایل شاهد، وابستگی API/DB، نیاز به مجوز مالک یا تغییر OpenAPI، ریسک migration (اکثر موارد migration ندارند؛ تغییر contract فقط در صورت تصمیم مالک)، effort و معیار پذیرش دارد (جزئیات در ماتریس II).

### دروازه‌های Go/No-Go

1. ✅ Source audit کامل شد.
2. ✅ Contract/API درستی تأیید شد (typecheck + unit).
3. ⬜ smoke test جستجو/فیلتر در runtime سبز شود (فعلاً NOT RUN).
4. ⬜ راستی‌آزمایی موبایل/RTL/a11y کامل شود.
5. ⬜ baseline عملکرد (CWV) جمع شود.
6. ⬜ سیاست SEO/facet validate شود.
7. ⬜ privacy review پیش از logging کامل شود.
8. ⬜ اعتبار کاربری واقعی پیش از ادعای موفقیت بازار.

## III-G. ماتریس تست ready-for-release (پذیرش)

| ترکیب تست | وضعیت فعلی |
|---|---|
| کوئری خالی/فاصله/بدشکل | ✅ unit (search-text/params) • runtime NOT RUN |
| term دقیق/مدل/برند/غلط‌املایی/مترادف/mixed-script | جزئی (دقیق yes؛ غلط‌املایی/مترادف NO) |
| ارقام فارسی/عربی/لاتین + Ya/Kaf | ✅ unit (`search-text.spec.ts`) |
| متن+دسته+ولایت/شهر+بازهٔ قیمت+attribute دسته | ❌ (attribute عددی باگ دارد) |
| چندمقدار/min>max/مقدار گم/فیلد ناشناخته/پارامتر تکراری | جزئی (backend validate) |
| apply/reset/clear-one/clear-all/back/cancel/reload | جزئی (clear-all باگ q/sort) |
| سازگاری count با pagination/sort | ❌ (count صفحه‌ای است) |
| صفر/یک/چند نتیجه | ✅ source (NOT RUN) |
| timeout/500/401/403/429/offline/abort/race | جزئی (client handle؛ E2E NOT RUN) |
| تغییر آگهی به sold/inactive/expired | ✅ source (visibility) • NOT RUN |
| تصاویر گم/کند/کم‌پهنا/کیبورد موبایل | NOT RUN |
| RTL mixed-latin/SR/کیبورد sheet | partial (source) • NOT RUN |
| تلاش غیرمجاز برای دادهٔ دیگران | ✅ (guards/permissions unit) |
| SEO crawl/index/canonical/sitemap | جزئی (منطق موجود؛ اثبات crawl NOT RUN) |

> تست‌هایی که اجرا نشدند با «NOT RUN + دلیل» علامت خورده‌اند و به‌عنوان معیار پذیرش باقی می‌مانند.

---

## ضمیمه — فهرست منابع و روش

منابعی که **در این جلسه واقعاً fetch شدند** (تاریخ دسترسی: ۱۸ اکتوبر ۲۰۲۶):

| منبع | ناشر/کلاس | تاریخ انتشار/به‌روزرسانی | ادعای کلیدی پشتیبانی‌شده | محدودیت |
|---|---|---|---|---|
| https://developers.google.com/crawling/docs/faceted-navigation | Google (هنجاری) | 2025-12-18 | جلوگیری از crawl نوع facet؛ جداکننده `&`؛ 404 برای ترکیب خالی؛ canonical به بدون‌فیلتر | عمومی؛ برخی روش‌ها «کم‌اثرتر» ذکر شده |
| https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap | Next.js (هنجاری) | 2026-08-18 | کنوانسیون `sitemap.ts` و خروجی `/sitemap.xml` | — |
| https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots | Next.js (هنجاری) | 2026-05-01 | کنوانسیون `robots.ts` | — |
| https://www.w3.org/TR/WCAG22/ | W3C (هنجاری) | W3C Recommendation 2024-12-12 | شمارهٔ SC های 1.3.1/1.4.3/1.4.10/1.4.11/2.4.x/2.5.8/3.3.x | — |
| https://baymard.com/research-articles/ecommerce-search-query-types | Baymard (آزموده) | به‌روز 2026-04-29 | «Query Types» و ۵۶٪ سایت‌ها مشکل دارند؛ 170+ سایت؛ 10k+ رتبه | فقط خلاصهٔ عمومی؛ premium کامل در دسترس نبود |
| https://baymard.com/research-articles/how-to-design-applied-filters | Baymard (آزموده) | به‌روز 2026-05-13 | «Applied Filters Overview» (۲۸٪ ندارند) | فقط خلاصهٔ عمومی |

منابعی که بر اساس URL و دانش هنجاری/خالصهٔ عمومی ذکر شدند (نه fetch کامل): `[Baymard-pl]` Product List، `[NNg]`، `[Leelam]`، `[Divar]`، `[eBay]`، `[FBM]`، `W3C i18n-bidi`، `web.dev/vitals`، `datareportal.com/digital-2026-afghanistan` (فقط برای بافتار اتصال؛ دادهٔ آن مربوط به اواخر ۲۰۲۵ است، نه بلادرنگ ۲۰۲۶).

**روش (خلاصه):** Stage A (کشف repo + خواندن source-of-truth) → Stage B (fetch منابع برگزیده) → Stage C (trace عمودی end-to-end) → Stage D (سنتز). هیچ product code تغییر نکرد؛ تنها deliverable این فایل است. تمام یافته‌های پیاده‌سازی به `path:line` (یا operationId) مستند شدند.