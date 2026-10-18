# WeshBazar — Runbook تحویل به بازار‌یاب

> وضعیت: فازهای ۰–۳ + پراکسی CORS تحویل‌شده. این سند برای «دستِ بازار‌یاب» است:
> مسیرها کجاست، هر شاخص کجا اندازه‌گیری می‌شود، و تحویلِ «سبز و مطمئن» چگونه
> راستی‌آزمایی می‌شود (فاز ۵).

---

## ۱. راه‌اندازی

| کار | دستور |
| --- | --- |
| بک‌اند (dev) | `npm run dev` (ریشهٔ `weshbazar-backend`) |
| فرانت (dev) | `npm run dev` (در `weshbazar-frontend`) |
| typecheck بک‌اند | `npm run typecheck` |
| typecheck فرانت | `npm run typecheck` (در `weshbazar-frontend`) |
| تست واحد بک‌اند | `npm run test --workspace @weshbazar/api` |
| تست واحد فرانت | `npm test` (در `weshbazar-frontend`) |
| تست integration | `npm run test:integration --workspace @weshbazar/api` (نیاز به Postgres روشن) |
| تست e2e | `npm run test:e2e --workspace @weshbazar/api` (نیاز به Postgres روشن) |
| تست امنیتی | `npm run test:security --workspace @weshbazar/api` |
| تولید OpenAPI | `npm run openapi:generate --workspace @weshbazar/api` |

> پراکسی: فرانت از طریق Next.js `rewrites()` همهٔ `/api/v1/*` را هم‌منشأ به بک‌اند
> می‌فرستد (بدون CORS). متغیر `NEXT_PUBLIC_API_BASE_URL` در `.env.local` خالی است.

---

## ۲. نقشهٔ مسیرها

### عمومی (ناشناس)
| مسیر | کار |
| --- | --- |
| `/` | فید آگهی‌های ACTIVE |
| `/search?q=…` | جست‌وجو (SSR صفحهٔ اول + فیلتر/دسته/استان) |
| `/categories` و `/category/[slug]` | مرور دسته‌ها |
| `/listing/[slug]` | جزئیات آگهی + بخش تماس مرحله‌ای |
| `/seller/[slug]` | فروشگاه لایو فروشنده (فاز ۲) |
| `/help`, `/about`, `/contact` | صفحات ثابت |

### خریدار
| مسیر | کار |
| --- | --- |
| `/auth/register` → `/auth/verify` | ثبت با OTP موبایل |
| `/auth/login` | ورود |
| `/favorites` | علاقه‌مندی‌ها |
| `/account`, `/account/security` | حساب کاربری |

### فروشنده
| مسیر | کار |
| --- | --- |
| `/sell/basic` → `/sell/photos` → `/sell/location` → `/sell/contact` → `/sell/attributes` → `/sell/preview` → `/sell/submit` | جریان انتشار آگهی |
| `/sell/[id]/edit` | ویرایش آگهی |
| `/my-listings` | مدیریت آگهی‌های من |
| `/seller/[slug]` | فروشگاه عمومی فروشنده |

### ادمین
| مسیر | کار |
| --- | --- |
| `/admin` | داشبورد (شمارنده‌ها) |
| `/admin/listings` | صف بازبینی (تأیید/رد) |
| `/admin/users`، `/admin/reports`، `/admin/taxonomy`، `/admin/locations`، `/admin/audit` | مدیریت بازار |

---

## ۳. قیف (Funnel) و جای اندازه‌گیری

| مرحله | شاخص | کجا اندازه می‌گیریم |
| --- | --- | --- |
| **جذب** | منشأ ورود (`ref`/`utm_source`) | `weshbazar_referral` در sessionStorage → ضمیمهٔ `?ref=` به `POST /listings/{id}/contact` → لاگ pino (بدون دیتابیس) |
| **بازدید** | بازدید لایف‌تایم + روزانه | `Listing.views` + `ListingDailyStat.views` (ضدتکرار SHA-256 §73) |
| **قصد تماس** | کلیک تماس/واتس‌اپ/تلگرام | `ListingDailyStat.phoneClicks / whatsappClicks / telegramClicks` |
| **علاقه** | ذخیره در علاقه‌مندی | `Listing.favoriteCount` + `ListingDailyStat.favoriteAdds` |
| **گزارش** | گزارش‌های ثبت‌شده | `ListingDailyStat.reports` |
| **تقاضای پنهان** | کوئری‌های صفر-نتیجه | `POST /search/zero-results` → رویداد `search.zero_result` در pino |
| **سلامت بازار** | شمارنده‌های کلان | `GET /admin/analytics/dashboard` + `GET /admin/analytics/summary` (نیاز به `ANALYTICS_READ`) |
| **دید فروشنده** | خلاصهٔ آگهی‌های خودش | `GET /me/analytics/summary` + `GET /me/analytics/seller/series` |

> نکتهٔ صادقانه: قیفِ کامل «onboarding → publish» (نرخ فعال‌سازی فروشنده) هنوز به‌صورت
> شمارندهٔ اختصاصی ابزار نشده (در ROADMAP فاز ۳ «به تعویق» است)؛ در حال حاضر سیگنال
> «انتشار» از روی شمارش `Listing.status` در داشبورد ادمین دیده می‌شود.

---

## ۴. چک‌لیست Smoke test — ۶ سفر حیاتی

پیش‌شرط: هر دو سرور روشن + Postgres روشن + (برای تماس/انتشار) یک کاربر ثبت‌شده.

### J1 — کشف
1. `/` را باز کن → گرید آگهی رندر شود، هیچ شماره‌ای فاش نشود.
2. `/search?q=iphon` → نتیجهٔ سروررندر + «X آگهی پیدا شد».
3. کوئری بی‌نتیجه (مثل `zzzz`) → EmptyState؛ در لاگ بک‌اند رویداد `search.zero_result` ظاهر شود.

### J2 — جزئیات
1. یک آگهی ACTIVE را باز کن (`/listing/[slug]`).
2. عنوان/قیمت/صفات (دری) + تصاویر نمایش داده شوند.
3. View Source → `JSON-LD` (Product/Offer) + تگ‌های OG موجود باشند.
4. بازدید بدون تکرار شمارش شود (§73 ضدتکرار).

### J3 — تماس (بدون افشای شماره)
1. روی «نمایش تماس» کلیک کن → مهمان به `/auth/login?next=…` هدایت شود.
2. پس از ورود، reveal انجام شود → شماره/واتس‌اپ/تلگرام نمایش یابد.
3. در لاگ بک‌اند `?ref=…` (اگر از لینک ارجاعی آمده) روی همان درخواست دیده شود.

### J4 — ثبت
1. `/auth/register` → موبایل + OTP → `/auth/verify` → موفق.
2. کوکی `weshbazar_session` ست شود؛ ورود خودکار.

### J5 — انتشار
1. `/sell/basic` تا `/sell/submit` را کامل کن → آگهی به `PENDING_REVIEW` رود.
2. در `/admin/listings` تأیید کن → آگهی `ACTIVE` شود.
3. در `/listing/[slug]` و `/seller/[slug]` (فروشگاه فروشنده) ظاهر شود.

### J6 — مدیریت
1. `/my-listings` → آگهی را ویرایش (`/sell/[id]/edit`)، سپس علامت «فروخته‌شده» بزن.
2. صفحهٔ عمومی: SOLD صادقانه نمایش یابد؛ (بایگانی → آگهی عمومی 404).

---

## ۵. مانیتورینگ و سلامت

- **Liveness**: `GET /health/live` → `{ status: "ok", uptimeSeconds, timestamp }` (هرگز DB را لمس نمی‌کند).
- **Readiness**: `GET /health/ready` → چک DB؛ در قطعی `503 SERVICE_UNAVAILABLE` با `checks.database`.
- **لاگ**: pino — در prod خط JSON (stdout)، در dev `pino-pretty`؛ ردچسب‌کردنِ `authorization`/`cookie`؛ هر درخواست `requestId` دارد؛ نویز health probes سرکوب شده.
- **رویدادهای کلیدی در لاگ**: `search.zero_result` (تقاضای پنهان)، error envelope با `code`.
- **داشبورد ادمین**: `/admin/analytics/dashboard` (کاربران/آگهی به تفکیک وضعیت/گزارش‌ها) + `/admin/analytics/summary` (سری روزانه + جمع درگیری).

---

## ۶. ماتریس تست و وضعیت CI

| لایه | وضعیت | یادداشت |
| --- | --- | --- |
| typecheck بک‌اند | ✅ سبز | `tsc --noEmit` |
| تست واحد بک‌اند | ✅ سبز (۲۰۸/۲۰۸) | بدون نیاز به DB |
| نوع‌چک/تست فرانت | ✅ سبز (۲۷۳/۲۷۳) | jest |
| lint بک‌اند | ✅ سبز | `npx eslint` (type-aware) |
| integration / e2e / security | ⏳ نیاز به Postgres روشن | اسکریپت‌ها موجودند |
| `next build` | ⏳ در CI | rewrite‌ها + sitemap/robots را end-to-end ثابت می‌کند |

---

## ۷. چک‌لیست تحویل نهایی
- [x] تست‌ها سبز (بک‌اند ۲۰۸ / فرانت ۲۷۳)
- [x] SEO فعال + sold صادقانه
- [x] زیرساخت SMS آماده (منتظر سرویس مخابرات)
- [x] فروشگاه فروشنده + انتساب ref/utm + تلمتری صفر-نتیجه
- [ ] `next build` اجرا در CI/shell سالم
- [ ] integration/e2e/security با Postgres روشن