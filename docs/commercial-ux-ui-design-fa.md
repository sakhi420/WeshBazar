# WeshBazar — مشخصات جامع UX/UI و تجربهٔ محصول تجاری

> **نوع سند:** طراحی تجربه و رابط (Design Only — بدون پیاده‌سازی)  
> **زبان رابط:** دری افغانستان · **جهت:** RTL · **مخاطبان:** خریدار، فروشندهٔ عادی، فروشندهٔ تجاری، مدیر سیستم، مدیر مالی، مدیر محتوا/ناظر  
> **مرجع حقیقت:** Backend/قراردادهای موجود + فایل‌های واقعی Frontend (این سند بر پایهٔ ممیزی زندهٔ `weshbazar-frontend` نوشته شده است)  
> **یادداشت صادقانه دربارهٔ طول:** این سند کامل و عمیق است ولی عمداً از تکرار و padding پرهیز می‌کند؛ تعداد خط‌ها معیار صحت نیست. هیچ قابلیت جعلی به‌عنوان «موجود» معرفی نمی‌شود.

---

## A. خلاصهٔ اجرایی

Frontend فعلی WeshBazar یک بازار آگهی کامل RTL/دری دارد (خانه/جستجو/دسته‌ها/جزئیات آگهی/فروشگاه فروشنده/ثبت و مدیریت آگهی/حساب/پنل admin). اما **هیچ صفحهٔ تجاری (plan/پرداخت/اعتبار/Promotion/Refund/پنل مالی) وجود ندارد** — چون Backend تجاری نیز هنوز پیاده نشده است (مطابق `commercialization-master-plan-fa.md`). بنابراین این سند تجربهٔ «هستهٔ موجود» را حفظ و توصیف می‌کند و لایهٔ تجاری جدید را به‌صورت Gap/طرح (وابسته به Backend مصوّب) مشخص می‌کند.

مهم‌ترین کمبودها: (۱) نبود هرگونه UI تجاری؛ (۲) نبود تمایز نقش مالی در پنل admin؛ (۳) نبود حالت‌های مالی (PAID≠FULLLED، اعتبار vs پول، SENT≠ناموفق) در UI؛ (۴) نبود Design System روایی برای جدول‌های اداری/مالی.

اولویت‌ها: Design System مشترک → صفحات عمومی/فروشنده → لایهٔ تجاری (plan/پرداخت/اعتبار/Promotion) → پنل Finance → پنل Admin/Moderator → Responsive/Accessibility.

---

## B. ممیزی Repository و محصول (Frontend)

### B.1 صفحات و Routeهای فعلی (از فایل‌سیستم واقعی)

| Route (Next App Router) | هدف | نقش |
|---|---|---|
| `(welcome)` | صفحهٔ ورود/خوش‌آمد | Guest |
| `(market)/` | فید آگهی‌های ACTIVE | Guest/Buyer |
| `(market)/search` | جستجو + فیلتر/مرتب‌سازی | Guest/Buyer |
| `(market)/categories` , `category/[slug]` | مرور دسته‌ها | Guest/Buyer |
| `(market)/listing/[slug]` | جزئیات آگهی + تماس | Guest/Buyer |
| `(market)/seller/[slug]` | پروفایل عمومی/فروشگاه فروشنده | Guest/Buyer |
| `(market)/favorites` | علاقه‌مندی‌ها | Buyer |
| `(market)/account` , `account/security` | حساب و امنیت | Buyer/Seller |
| `(market)/auth/{register,verify,login,forgot-password,reset-password}` | احراز هویت | Guest |
| `(market)/sell/*` (basic→submit) + `sell/[id]/edit` | جادوگر انتشار آگهی | Seller |
| `(market)/my-listings` | مدیریت آگهی‌های من | Seller |
| `(market)/admin/*` (dashboard,listings,users,reports,taxonomy,locations,audit) | پنل مدیریت | Admin/Moderator |
| `(market)/about` , `contact` , `help/safety` | صفحات ایستا | Guest |

### B.2 Layoutها / کامپوننت‌ها / Design Tokens

- **Layout:** `layout.tsx` (lang `fa-AF`, dir `rtl`, skip-link «رفتن به محتوای اصلی»، themeColor `#0F766E`)؛ گروه‌بندی `(welcome)` و `(market)`.
- **Design Tokens (واقعی، از `tailwind.config.ts` + `globals.css`):** رنگ‌های semantic HSL — `primary #0F766E` (teal)، `primary-dark #0B2F2B`، `primary-soft #E6F5F3`، `accent #F59E0B` (نارنجی)، `foreground #0B2F2B`، `secondary #64748B`، `muted #94A3B8`، `border #E2E8F0`، `background #F8FAFC`، `surface #FFFFFF`، `success/danger/warning/info`، `whatsapp #25D366`. Radius (control 8 / card 12 / surface 16)؛ type scale (caption 12 → display 32)؛ spacing (touch 44px, control 44px, header 56px, bottom-nav 64px)؛ shadow (soft/card/lift/glow)؛ zIndex (header/drawer/modal/toast)؛ motion (micro 120ms → dialog 200ms).
- **فونت:** Vazir خودمیزبان (300/400/500/700) با variable `--font-vazir`.
- **کامپوننت‌ها:** `components/ui` (shadcn primitives)، `components/{brand, discovery, feedback, layout, listings, location, auth}`؛ `features/{account,admin,attribution,auth,categories,contacts,favorites,listings,locations,media,reports,search,sellers,welcome}`.
- **i18n:** `lib/i18n/config.ts` فقط `fa-AF` (`DEFAULT_DIR=rtl`)؛ معماری آمادهٔ افزودن `ps`/`en` بدون بازنویسی.

### B.3 نقش‌ها و مجوزها (واقعی)

`UserRole = USER | MODERATOR | ADMIN` (schema Prisma)؛ permission map در `common/authz/permissions.ts` (12 permission موجود؛ هیچ permission مالی نیست). Finance/Commercial نقش **وجود ندارد** (Gap).

### B.4 قابلیت واقعی در برابر طراحی‌شده

| قابلیت | وضعیت |
|---|---|
| خانه/جستجو/دسته/جزئیات/فروشگاه/علاقه‌مندی/ثبت آگهی/مدیریت آگهی/پنل admin | موجود (کد) |
| Plan/Payment/Credit/Promotion/Refund/Subscription/Finance/CommercialException UI | **وجود ندارد** (Backend هم ندارد) |

---

## C. تحقیق مرجع (Reference Research)

| منبع | الگوی قابل اقتباس | چرا | جای استفاده | نباید کپی شود | تغییر برای افغانستان/دری |
|---|---|---|---|---|---|
| eBay Seller Hub | یک داشبورد مبتنی بر وظیفه (task-based) با «کاری که باید انجام دهی» در بالا | وضوح اقدام | Seller Dashboard | تراکم بالای ماژول‌ها | متن دری، RTL |
| Etsy Shop Manager | ناوبری جانبی ساده و تمرکز بر آمار واقعی فروشگاه | سادگی | Commercial Seller + Storefront | پیچیدگی ویزاردهای متعدد | — |
| Baymard | فرم پرداخت/مدرک کم‌خطا، Account self-service، مدیریت خطا | کاهش خطا | Payment submission/Refund | — | برچسب AFN، مرجع انتقال |
| WCAG 2.2 | Contrast/focus/target/keyboard | استفاده همگانی | همهٔ صفحات | — | RTL ترتیب Tab |
| NN/g | Empty states معنا‌دار، جدول داده، بازیابی خطا | صفحات خالی قابلاستفاده | داشبوردها/جدول‌ها | — | متن دری |
| Divar/Sheypoor | سادگی ثبت آگهی و تماس مستقیم | رفتار کاربر منطقه | ثبت آگهی/تماس | اعتمادسازی ضعیف احتمالی | برند WeshBazar |

---

## D. معماری اطلاعات (Information Architecture) و Route Map

### D.1 ساختار ناوبری مبتنی بر نقش

- **Guest/Buyer:** ناوبری عمومی (خانه، جستجو، دسته‌ها، علاقه‌مندی‌ها، ورود/ثبت). بدون پنل پیچیده.
- **Seller (عادی):** «آگهی‌های من» + «ثبت آگهی» + «حساب». 
- **Commercial Seller:** موارد Seller + «تجاری» (اشتراک/اعتبار/Promotion/سفارش/بازپرداخت).
- **Finance:** فضای کاری جدا «مالی» (سفارش/پرداخت/بازپرداخت/گزارش/استثنا).
- **Admin:** پنل مدیریت (کاربران/فروشندگان/آگهی/گزارش/پلن/خدمات تجاری/audit).
- **Moderator:** فقط صف بررسی آگهی/گزارش با مجوز واقعی (بدون مالی).

### D.2 Route Map پیشنهادی (تجاری — هماهنگ با `/api/commercial/v1`؛ Gap تا Backend مصوب)

| مقصد | Route پیشنهادی | نقش |
|---|---|---|
| پلن‌ها/مقایسه | `/commercial/plans` | Seller |
| جزئیات خرید | `/commercial/checkout/[plan]` | Seller |
| ارسال مدرک پرداخت | `/commercial/orders/[id]/pay` | Seller |
| جزئیات سفارش | `/commercial/orders/[id]` | Seller |
| تاریخچه سفارش | `/commercial/orders` | Seller |
| اشتراک من | `/commercial/subscription` | Seller |
| اعتبار و تاریخچه | `/commercial/credits` | Seller |
| ارتقای آگهی | `/commercial/promote/[listingId]` | Seller |
| بازپرداخت | `/commercial/refunds` | Seller |
| **مالی** | `/finance/*` | Finance |
| **تجاری admin** | `/admin/commercial/*` | Admin |

> این Routeها **نمونه** هستند؛ در فاز پیاده‌سازی با معماری واقعی Next.js و Routeهای موجود تطبیق داده می‌شوند و هیچ Route موجودی بدون دلیل تغییر نمی‌کند.

---

## G. مشخصات Design System

### G.1 رنگ (از `globals.css` — بدون تغییر برند)

| Token | HSL | HEX | کاربرد |
|---|---|---|---|
| `primary` | 175 77% 26% | #0F766E | اقدام اصلی، لینک، state فعال |
| `primary-dark` | 173 62% 11% | #0B2F2B | متن، سطوح تیره |
| `primary-soft` | 172 43% 93% | #E6F5F3 | پس‌زمینهٔ ملایم |
| `accent` | 38 92% 50% | #F59E0B | فروش/اقدام تأکیدی (Sell/Post) |
| `foreground` | 173 62% 11% | #0B2F2B | متن اصلی |
| `secondary/muted` | #64748B / #94A3B8 | — | متن ثانوی/کمک |
| `border` | #E2E8F0 | — | مرزبندی |
| `background/surface` | #F8FAFC / #FFFFFF | — | پس‌زمینه/کارت |
| `success/danger/warning/info` | #15803D/#DC2626/#B45309/#0369A1 | — | وضعیت semantic |
| `whatsapp` | #25D366 | — | نشان واتساپ |

قاعده: موفقیت سبز، هشدار کهربایی، خطا قرمز (فقط برای خطای واقعی)، اطلاعات آبی. رنگ هرگز تنها نشانهٔ وضعیت نیست (همیشه متن همراه).

### G.2 Typography (Vazir 300/400/500/700)

سلسله‌مراتب فعلی: `caption 12 / meta 13 / ui 14 / body 16 / card-title 18 / section 20 / heading 24 / display-mobile 28 / display 32` (با line-height تعریف‌شده). تیتر کوتاه؛ اعداد/مبلغ با `ui/body`؛ متن دری (نه فارسی ایران، نه ترجمهٔ ماشینی)؛ اعداد مطابق سیاست واحد (پیشنهاد: لاتین برای مبلغ برای جلوگیری از ابهام).

### G.3 Spacing / Layout / Components / Motion

مقیاس واقعی: `page-x 16px`، `section-y 28px`، `card-gap 12px`، `touch/control 44px`، `header 56px`، `bottom-nav 64px`؛ container `1280px`. Radius `control 8 / card 12 / surface 16`. Shadow `soft/card/lift/glow`. Motion `micro 120ms → dialog 200ms`.

**کامپوننت‌های مشترک (نه موازی):** Buttons, Inputs, Select, SearchField, Tabs, Breadcrumb, Card, ListingCard, SellerCard, StatusBadge, Alert, Dialog, Drawer, Tooltip, Dropdown, Table, Pagination, Filter, DateFilter, EmptyState, Skeleton, ErrorState, FileUpload, ImagePreview, Timeline, ActivityLog, CreditBalance, PaymentSummary, ConfirmDialog. برای هر یک: هدف/ظاهر/اندازه/حالت/موبایل/RTL/دسترس‌پذیری/دادهٔ لازم تعریف می‌شود (در فاز پیاده‌سازی باز می‌شود).

### G.4 اصول بصری

Clean/minimal، سلسله‌مراتب قوی، whitespace حساب‌شده، مرز ملایم، سایهٔ مهارشده؛ بدون gradient افراطی، Badge‌های فراوان، رنگ تصادفی، یا CTAهای هم‌سطح متعدد. زیبایی از نظم/تناسب/تایپوگرافی/وضوح تعامل.

---

## E. فهرست کامل صفحات (Page Inventory)

برای هر صفحه: هدف/مخاطب/Layout/محتوای اصلی/اجزاء/اقدامات/داده/API/حالت/موبایل/دسترس‌پذیری. در اینجا فشرده، در فاز پیاده‌سازی باز می‌شود.

| # | صفحه | مخاطب | داده/API (وضعیت) | حالت‌های حیاتی | Gap |
|---|---|---|---|---|---|
| 1 | خانه/فید | Guest | `GET /listings` (موجود) | loading/empty/error | — |
| 2 | جستجو/فیلتر | Guest | `GET /listings` + filter-schema | empty («X آگهی پیدا شد») | — |
| 3 | دسته‌ها | Guest | `GET /categories` | — | — |
| 4 | جزئیات آگهی | Guest | `GET /listing/[slug]` + contact | sold/expired/404 | — |
| 5 | فروشگاه عمومی | Guest | `GET /sellers/[slug]` + listings | empty store | — |
| 6 | علاقه‌مندی | Buyer | favorites API | empty | — |
| 7 | حساب/امنیت | Buyer/Seller | `GET/PATCH /me` | — | — |
| 8 | ورود/ثبت/تأیید | Guest | auth API | OTP cooldown/expiry | — |
| 9 | ثبت آگهی (ویزارد) | Seller | `POST /listings` (چندمرحله) | draft حفظ | — |
| 10 | آگهی‌های من | Seller | `GET /me/listings` (status) | هر tab وضعیت خود | — |
| 11 | پلن‌ها | Seller | `GET /commercial/v1/plans` (Gap) | مقایسهٔ Business/Business Plus | Backend |
| 12 | ارتقای آگهی | Seller | `Promotion` (Gap) | غیرواجد = پنهان/غیرفعال | Backend |
| 13 | سفارش/پرداخت مدرک | Seller | `PurchaseOrder/PaymentSubmission` (Gap) | PENDING/EXPIRED | Backend |
| 14 | اعتبار | Seller | `Credit*` (Gap) | balance/history | Backend |
| 15 | اشتراک | Seller | `Subscription` (Gap) | active/expiring/expired/suspended | Backend |
| 16 | بازپرداخت | Seller | `Refund*` (Gap) | SENT≠ناموفق | Backend |
| 17 | پنل مالی | Finance | `Payment/Order/Refund/Exception` (Gap) | PENDING/PAID/FULFILLED/FAILED | Backend |
| 18 | پنل admin تجاری | Admin | `CommercialPlan/Exception/Audit` (Gap) | — | Backend |
| 19 | صف moderation | Moderator | `admin/listings`, `admin/reports` (موجود) | reason لازم | — |

---

## H. ماتریس نقش و مجوز (توافق با Backend)

> پنهان‌کردن دکمه امنیت نیست؛ API مجوز را در Backend چک می‌کند. دسترسی مالی هرگز به Moderator داده نمی‌شود؛ دادهٔ مالی/خصوصی در پروفایل عمومی نیست؛ دادهٔ فروشندهٔ A برای فروشندهٔ B نامرئی است.

| نقش | دیدن | اقدام مجاز | ممنوع |
|---|---|---|---|
| Guest | صفحات عمومی، جزئیات/فروشگاه | جستجو، تماس (نیازمند ورود برای reveal) | خرید/مالی/مدیریت |
| Buyer | + علاقه‌مندی/حساب | ذخیره، تماس | فروش/مالی |
| Seller (عادی) | + آگهی‌های من/حساب | ثبت/ویرایش/تمدید/فروخته/بایگانی/ارتقا (در آینده) | مالی دیگران، moderation |
| Commercial Seller | + تجاری (اشتراک/اعتبار/Promotion/سفارش) | خرید پلن، مصرف credit، ارتقا، درخواست refund | عملیات مالی دیگران |
| Moderator | صف آگهی/گزارش | approve/reject/resolve (با دلیل) | **هیچ عملیات مالی** |
| Finance | فضای مالی | PAYMENT_REVIEW/APPROVE/REJECT، REFUND_MANAGE | moderation/taxonomy/کاربران |
| Admin | همهٔ مجاز | مدیریت + تجاری + مالی (طبق permission) | اعمال بدون مجوز |

---

## F. سفرهای کاربر (User Journeys) — مسیر موفق/خطا/جایگزین

هر جریان به‌صورت مراحل + نقطهٔ Error/Alt (بدون متن ساختگی برای وضعیت‌های مالی که Backend هنوز ندارد — به‌عنوان Gap).

1. **بازدیدکننده→خریدار:** خانه → جستجو → جزئیات → تماس (ورود برای reveal). Error: آگهی sold/expired → 404/وضعیت صادقانه.
2. **خریدار→ثبت‌نام:** register → OTP → verify. Alt: cooldown/expiry → پیام روشن.
3. **خریدار→ذخیره:** جزئیات → علاقه‌مندی (نیازمند ورود). Alt: 401 → login با `next`.
4. **فروشنده→ثبت آگهی:** sell/basic→…→submit → PENDING_REVIEW (یا AUTO_APPROVE→ACTIVE). Error: `LISTING_LIMIT_REACHED` → پیام دری + اقدام.
5. **فروشنده→مدیریت آگهی:** my-listings (tabهای وضعیت) ← ویرایش/فروخته/بایگانی/تمدید.
6. **فروشنده→ویترین:** seller/[slug] عمومی از account.
7. **خرید پلن (تجاری):** plans → مقایسه → checkout → (create order) → پرداخت مدرک. Gap: Backend.
8. **مدرک پرداخت:** order/id/pay → ارسال مبلغ/مرجع/تصویر → وضعیت PENDING. Error: مرجع تکراری/مبلغ نادرست/انقضا.
9. **پرداخت→تأیید (Finance):** صف → جزئیات → approve/reject (با دلیل + تأیید). Error: مبلغ mismatch/مرجع تکراری.
10. **تأیید→تحویل:** PAID → FULFILLED (subscription/promotion). Alt: FAILED → CommercialException (PAID ≠ FULFILLED نمایش شفاف).
11. **اعتبار:** دریافت grant → مصرف promotion → reversal (سیستم). Error: کمبود/انقضا/تعلیق.
12. **ارتقا:** انتخاب آگهی ACTIVE → انتخاب Boost → نمایش هزینه/مدت → ثبت → status. Error: آگهی غیرواجد → گزینهٔ غیرفعال/توضیح.
13. **انقضای اشتراک:** active → expiring (هشدار) → expired (بدون auto-renew) → خرید مجدد/تمدید.
14. **تعلیق/بازگشت:** suspend → مزایا متوقف / restore → در صورت باقی‌بودن مدت.
15. **درخواست refund (تجاری):** order → refund request → انتقال → SENT → CONFIRMED/FAILED. Error: SENT معلق = نه ناموفق نه کامل.
16. **بازپرداخت:** انتقال + مرجع + تأیید → COMPLETED؛ FAILED → تلاش جدید.
17. **CommercialException (Finance):** OPEN → RESOLVING (REFUND/CREDIT/MANUAL) → RESOLVED؛ rewind → OPEN.
18. **بررسی پرداخت (Finance):** صف PENDING → approve/reject.
19. **moderation (Moderator):** صف آگهی/گزارش → تصمیم + reason.
20. **مدیریت تجاری (Admin):** پلن/revision/order/promotion/credit/exception/audit.

---

## I. ردیابی Backend→UI (Traceability)

| دامنه | Backend | API | UI لازم | Gap |
|---|---|---|---|---|
| PurchaseOrder | می‌خورد | `/orders` | جزئیات/وضعیت | Backend |
| PaymentSubmission | می‌خورد | `/orders/[id]/submissions` | فرم مدرک | Backend |
| PaymentReviewDecision | می‌خورد | finance | تصمیم/سابقه | Backend |
| PaymentRecord | می‌خورد | finance | تأیید/مرجع | Backend |
| FulfillmentStatus | می‌خورد | orders | PAID≠FULFILLED | Backend |
| Subscription | می‌خورد | `/subscription` | وضعیت/تمدید | Backend |
| Credit ledger (Grant/Consumption/Reversal/Expiration) | می‌خورد | `/credits` | موجودی/تاریخچه | Backend |
| Promotion | می‌خورد | `/promote` | ارتقا/وضعیت | Backend |
| RefundRequest/Attempt/Event | می‌خورد | `/refunds` | درخواست/انتقال | Backend |
| CommercialException | می‌خورد | finance/admin | OPEN/RESOLVING/RESOLVED | Backend |
| CommercialPlan/Revision | می‌خورد | admin | کاتالوگ/نسخه | Backend |
| AuditLog | موجود | `/admin/audit` | مشاهده (admin) | — |

**متن وضعیت (نمونهٔ دری):** `PENDING_PAYMENT` → «در انتظار پرداخت»؛ `PAID`+`PENDING` fulfillment → «پرداخت تأیید شد؛ در حال آماده‌سازی خدمت»؛ `FULFILLMENT_FAILED` → «خدمت قابل ارائه نبود؛ تیم پشتیبانی پیگیری می‌کند»؛ `SENT` refund → «انتقال آغاز شده؛ در انتظار تأیید نهایی»؛ credit → «اعتبار (نه پول نقد)».

---

## J. کتابخانهٔ حالت‌ها (Empty/Loading/Error/Success)

حالت‌های الزامی: Initial Loading، Skeleton، Empty، Populated، Error، Network، Permission Denied، Expired Session، Validation، Partial، Disabled، Pending، Success، Retry. برای هر Empty: چرا خالی/چه اقدامی/CTA/متن. برای هر Error: چه شد/چه اثری/آیا داده حفظ شد/retry/اقدام. هیچ «خطایی رخ داد» مبهم؛ هیچ عدد نمونه به‌عنوان دادهٔ واقعی؛ Empty حوادث مالی با placeholder صادقانه.

---

## K. چک‌لیست Accessibility و Responsive

- **WCAG 2.2 AA (تا حد قابل اعمال):** کنتراست متن ≥4.5:1 (متن) و ≥3:1 (غیرمتنی/فیلد)، focus قابل دیدن، keyboard کامل، label فرم، خطای قابل تشخیص (متن + رنگ)، اندازهٔ هدف ≥44px (token فعلی `touch/control`)، ترتیب Tab منطقی RTL، Dialog/Drawer با focus-trap/Esc، skip-link (موجود در `layout.tsx`)، خواندن با screen reader.
- **Responsive (موبایل-first):** breakpointهای واقعی (`xs 360, sm 390, md 430, lg 768, xl 1024, 2xl 1280, 3xl 1536`). در موبایل: جدول → Card؛ منو → Drawer/bottom-nav (`bottom-nav 64px`)؛ CTA اصلی در دسترس؛ بدون horizontal overflow؛ اعداد/مبلغ خوانا؛ حفظ RTL.

---

## L. نقشهٔ راه پیاده‌سازی (Frontend)

| فاز | محتوا | پیش‌نیاز | معیار پذیرش |
|---|---|---|---|
| 1 | Design System + Layoutهای مشترک | — | توکن‌ها/کامپوننت‌های مشترک تست‌شده |
| 2 | Marketplace و صفحات عمومی | P1 | خانه/جستجو/جزئیات/فروشگاه |
| 3 | Account و Buyer | P2 | حساب/علاقه‌مندی |
| 4 | Seller Dashboard و Storefront | P2 | آگهی‌ها/ویترین |
| 5 | Commercial Plans و Purchase Flow | Backend فاز 3-5 | پلن/سفارش/مدرک |
| 6 | Credit و Promotion | Backend فاز 7-8 | اعتبار/ارتقا |
| 7 | Finance Workspace | Backend فاز 4-6 | صف/تأیید/بازپرداخت/استثنا |
| 8 | Admin و Moderator Workspace | Backend فاز 10 | پنل/صف |
| 9 | Responsive و Accessibility | همه | AA + موبایل |
| 10 | QA و Visual Polish | همه | بازبینی بصری |

---

## M. ثبت ریسک و شکاف (Gap Register)

| اولویت | Gap/ریسک | اثر | وابستگی | پیشنهاد |
|---|---|---|---|---|
| Critical | هیچ Backend تجاری (payment/plan/credit/promotion/refund) نیست | UI تجاری ممکن نیست | پیاده‌سازی Backend مصوّب | فازبندی Backend-first |
| Critical | نقش Finance + مجوز مالی در سطح API وجود ندارد | پنل مالی ممکن نیست | permission/ENUM جدید | افزودن additive |
| High | مسیر `/api/commercial/v1` هنوز Routing ندارد | Route تجاری | bootstrap/versioning | تصمیم Routing مصوّب |
| High | قیمت/AFN-pul/entitlement قطعی نیست | متن/مبلغ UI | Decision Register | شروع با سقف ۲۰ (غیرمالی) |
| Medium | `LISTING_LIMIT_REACHED` فعلی race دارد | UI سقف ۲۰ | enforcement اتمی | قفل SellerAccount |
| Medium | تأیید مالی بدون Backend | وضعیت‌های مالی | — | placeholder صادقانه تا Backend |

---

## N. چک‌لیست پذیرش نهایی طراحی

- [ ] تمام گروه‌های کاربری (خریدار/فروشنده/تجاری/مالی/admin/moderator) تعریف شده.
- [ ] تفاوت ویترین عمومی و پنل خصوصی روشن است.
- [ ] همهٔ جریان‌های تجاری پوشش داده شده (pay/fulfill/refund/credit/promotion/subscription).
- [ ] PAID از FULFILLED تفکیک شده؛ credit از پول تفکیک شده.
- [ ] وضعیت‌های مالی با متن دری صادقانه (SENT≠ناموفق).
- [ ] پنل Finance از Admin/Moderator تفکیک شده.
- [ ] هر صفحه حالت Loading/Empty/Error/Success دارد.
- [ ] موبایل + دسکتاپ طراحی شده (RTL).
- [ ] Design System منطبق بر توکن‌های واقعی (teal/orange/Vazir).
- [ ] هیچ قابلیت ساختگی «موجود» معرفی نشده؛ Gapها مستند.
- [ ] هیچ قرارداد API/معماری بدون مجوز تغییر نکرده.

---

## گزارش وضعیت و محدودیت‌ها (الزام نهایی)

- **صفحات شناسایی شده‌اند؟** بله: ۱۹ صفحهٔ اصلی (موجود + پیشنهادی تجاری). 
- **نقش‌ها بررسی شده‌اند؟** بله (۷ نقش؛ Finance/Commercial هنوز در Backend نیست = Gap).
- **جریان‌های اصلی طراحی شده‌اند؟** بله (۲۰ جریان؛ جریان‌های تجاری وابسته به Backend به‌عنوان Gap علامت‌گذاری شدند).
- **طراحی با Backend تطبیق داده شده؟** بله برای هستهٔ موجود؛ لایهٔ تجاری صریحاً «طراحی اما Backend ندارد».
- **کدام صفحات به API موجود وابسته‌اند؟** ۱–۱۰، ۱۹.
- **کدام صفحات به Backend جدید نیاز دارند؟** ۱۱–۱۸ (تجاری/مالی).
- **کدام تصمیم‌ها هنوز تأیید مالک لازم دارند؟** قیمت‌ها، AFN/pul، entitlement، Routing `/api/commercial/v1`، نقش Finance (مطابق `commercialization-master-plan-fa.md`).
- **آیا سند آمادهٔ تبدیل به برنامهٔ اجرایی Frontend است؟** بله برای هستهٔ موجود؛ بخش‌های تجاری پس از تصمیم/Backend مصوّب فعال می‌شوند.

**وضعیت:** `PARTIALLY_COMPLETE` — لایهٔ تجاری/مالی به دلیل نبود Backend مصوّب و تصمیمات باز، در سطح مشخصات طراحی‌شده و برچسب Gap است (نه «قابل پیاده‌سازی امروز»). هیچ قابلیتی جعلی معرفی نشد.

> این مأموریت فقط مستندسازی بود؛ هیچ کد/Schema/Migration/API/OpenAPI/Dependency/Configuration/Flag/Git تغییر نکرد. تنها همین یک فایل Markdown جدید ساخته شد.