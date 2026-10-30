# مشخصات فنی — Job پاک‌سازی امنِ تصاویرِ آگهی‌های بایگانی‌شده

> **نوع سند:** مشخصات فنی برای پیاده‌سازیِ آینده (Documentation-Only). این سند «مجوز اجرا» نیست.
> **وضعیت:** پیش‌نویس برای انتشارِ بعدیِ بک‌اند — **بازبینیشده «v6»** (تحلیل همزمانی و ترتیبِ امنِ عملیات اصلاح شد). هیچ کد، قرارداد، migration یا داده‌ای تغییر نکرده است.
> **وابستگی سیاستی:** `docs/data-retention-policy.md` (تصمیم مالک D5) و `docs/ROADMAP.md`.
> **قفل قرارداد:** مطابق `AGENTS.md`، بک‌اند در v1.0.0 قفل است؛ این job در مرحله‌ای جداگانه و با مجوز صریح پیاده می‌شود.

---

## 5.1 هدف و محدوده

**مسئله:** تصاویرِ آگهی‌های بایگانی‌شده (`ARCHIVED`) امروز از storage حذف نمی‌شوند. حجیم‌ترین بخشِ داده (باینری تصاویر) عملاً برای همیشه باقی می‌ماند، در حالی که سیاست تأییدشده‌ی مالک می‌گوید تصاویر آگهیِ بایگانی‌شده باید پس از یک مهلتِ قابل‌تنظیم، به‌صورت دائمی از storage پاک شوند (`docs/data-retention-policy.md §2.2`).

**این job دقیقاً چه چیزی را پاک می‌کند:** فایل‌های باینریِ تصویر (در حال حاضر `original.jpg` + سه variant `thumbnail.webp` / `medium.webp` / `large.webp`) متعلق به آگهی‌های واجد شرایط، و سپس وضعیت metadata تصویر را طوری تغییر می‌دهد که دیگر به فایلِ حذف‌شده ارجاع ندهد.

**خارج از محدوده (باید انجام نشود):**
- حذف فیزیکی ردیف `Listing` (سیاست: بایگانی حفظ می‌شود).
- تغییر وضعیت خود آگهی.
- حذف سوابق `AuditLog` / `ModerationAction` / `Report` / `ListingRevision`.
- تولید endpoint جدید یا تغییر OpenAPI.

**تفاوت با `clean-orphan-media` (jobs.service.ts:278 به بعد):**

| | `clean-orphan-media` (موجود) | `clean-archived-listing-images` (پیشنهادی) |
|---|---|---|
| ورودی | ردیف‌های `ListingImage` با `deletedAt < cutoff` + کلیدهای storage بدون ردیف | تصاویرِ زندهٔ آگهیِ `ARCHIVED` با `deletedAt = null` و گذشته از مهلت |
| خروجی | hard-delete ردیف + پاک‌کردن اشیاء پس از `ORPHAN_MEDIA_RETENTION_DAYS=7` | ادعای اتمی (soft-delete ردیف) + پاک‌کردن فایل‌ها |
| ملاک زمان | `ListingImage.deletedAt` و `lastModified` | `Listing.archivedAt` + مهلت جدید |
| پوشش آگهی | فقط تصاویر قبلاً حذف‌شده | آگهی بایگانی‌شده اما تصاویرش هنوز حفظ‌شده |

**پاسخ صریح:** این job با `clean-orphan-media` جایگزین/تکراری نیست. آن job تصویرِ زندهٔ آگهی `ARCHIVED` را هدف نمی‌گیرد (بایگانی، تصویر را soft-delete نمی‌کند). هم‌پوشانیِ عمدی فقط «بعد از» این job است: با soft-delete ردیف‌ها، `clean-orphan-media` هفت روز بعد ردیف را hard-delete می‌کند.

## 5.2 وضعیت موجود (با شواهد کد)

ردیف‌های زیر «رفتار فعلیِ مشاهده‌شده» است، نه رفتار پیشنهادی.

| موضوع | رفتار فعلی (مشاهده‌شده) | شاهد در کد | شکاف / ابهام |
|---|---|---|---|
| تاریخِ واقعی بایگانی | `Listing.archivedAt` وجود دارد و در هر ۴ مسیر `ARCHIVED` مقدار `now` می‌گیرد | `schema.prisma:441`؛ `listings.service.ts:479,826,1001` | ایندکس `[status, archivedAt]` نیست |
| پاک‌شدنِ تاریخ بایگانی | بازگردانی/بازنشر `archivedAt=null` می‌کند | `listings.service.ts:525,873` | — |
| مسیر بایگانی مالک/ادمین | `ACTIVE → ARCHIVED` + `archivedAt=now`؛ تصاویر لمس نمی‌شوند | `listings.service.ts:470-482,807-843` | تصاویر soft-delete نمی‌شوند |
| انقضا/پیش‌نویس کهنه | `EXPIRE`/`ARCHIVE_STALE_DRAFT` → `ARCHIVED` + `archivedAt=now` + revision `SYSTEM` | `listings.service.ts:912-1017` | تصاویر soft-delete نمی‌شوند |
| فروخته‌شدن | `ACTIVE → SOLD` فقط `soldAt=now`؛ `archivedAt` لمس نمی‌شود | `listing-state.ts:80-81`؛ `listings.service.ts:455-467` | تصاویر `SOLD` بدون مهلت (OPEN) |
| حذف تصویر توسط مالک | soft-delete: `ListingImage.deletedAt=now`؛ فایل‌ها بعداً orphan sweep | `media.service.ts:163-198` | — |
| پاک‌سازی orphan | hard-delete ردیف+فایل بعد ۷ روز + reconcile کلید یتیم | `jobs.service.ts:278-384`؛ `env.schema.ts:119` | آگهی ARCHIVED با تصویر زنده را نمی‌گیرد |
| شکل فایل هر تصویر | ۴ شیء زیر `listings/<listingId>/<imageId>/` | `media.service.ts:281-292`؛ `image-processor.ts:25-33` | تأییدشده |
| نمایان‌شدن تصویر soft-del‌شده | `images.where.deletedAt = null` در همهٔ payloadها | `listing-row-include.ts:16-19` | مبنای جلوگیری از dangling URL |
| مدل «گزارش باز» | `Report.status ∈ {OPEN, UNDER_REVIEW, RESOLVED, DISMISSED}` | `schema.prisma:598-633` | «باز» = OPEN و UNDER_REVIEW |
| مدل «بررسی نظارتی باز» | `ModerationAction` بدون وضعیت باز (Append-only) | `schema.prisma:635-660` | «در جریان» فقط `PENDING_REVIEW` |
| گزارش‌پذیری | گزارش فقط روی `ACTIVE`/`SOLD`؛ `ARCHIVED` → `LISTING_NOT_FOUND` | `reports.service.ts:73-78` (read ساده، بیرون تراکنش؛ درج در تراکنش جدا) | **Race باز (TOCTOU)** — اصلاح v5 (§5.16) |
| Soft-delete خود Listing | ستون `deletedAt` هست ولی هیچ مسیری مقدارش نمی‌دهد؛ گاردها `null` شرط می‌کنند | `schema.prisma:456`؛ `listings.service.ts:964,1000,1063` | job نباید `Listing.deletedAt` را لمس کند |
| مکانیزم تراکنش وضعیت | `commitTransition`: `UPDATE ... WHERE version AND deletedAt IS NULL` | `listings.service.ts:1332-1373` | مبنا برای قفل/شرط امن |
| قفل ردیف (سابقه) | `lockListing` با `SELECT ... FOR UPDATE` | `media.service.ts:277-279` | الگوی تأییدشدهٔ سریال‌سازی writers |

## 5.3 تعریف دقیقِ واجد شرایط بودن (Eligibility)

یک تصویر وقتی واجد شرایط است که **تمامی** این شرط‌ها هم‌زمان برقرار باشند (قابل آزمون):

1. `Listing.status == 'ARCHIVED'` (`SOLD/DRAFT/PENDING_REVIEW/ACTIVE/REJECTED` خارج — `schema.prisma:393-400`).
2. `Listing.archivedAt` غیر null و `archivedAt <= (now - ARCHIVED_IMAGE_RETENTION_DAYS)`.
3. `Listing.deletedAt == null`.
4. هیچ `Report` با `listingId=listing.id` و `status ∈ {OPEN, UNDER_REVIEW}` وجود ندارد.
5. `ListingImage.deletedAt == null` (هم‌پوشانی با `clean-orphan-media` ممنوع).
6. تصویر با FK متعلق به همان آگهی باشد (`schema.prisma:516`).

**مهم (اصلاح v2):** این شرط‌ها فقط در «انتخاب batch» بررسی نمی‌شوند؛ **داخل یک تراکنش قفل‌شده** (§5.6 گام ۲–۳) بازبینی می‌شوند. بازخوانیِ بدون قفل پیش از حذف کافی نیست (§5.6.1).

**سؤال باز (بدون اختراع):** سیاست `SOLD` — چون `markSold` فقط `soldAt` می‌گذارد و `archivedAt` را null نگه می‌دارد، تصاویر `SOLD` هرگز با قاعدهٔ `archivedAt` واجد شرایط نمی‌شوند (Q1).

## 5.4 محاسبهٔ زمان نگهداری

- **فیلد مبنا:** `Listing.archivedAt` (`schema.prisma:441`). نه `expiresAt`، نه `createdAt`.
- **مسیرهای مقداردهی:** owner `archive` (`:479`)، admin `archiveByAdmin` (`:826`)، `EXPIRE` (`:1001`)، `ARCHIVE_STALE_DRAFT` (`:1001`).
- **بازنویسی مبنا:** بازگردانی/بازنشر `archivedAt=null` می‌کند (`:525`, `:873`). بایگانی مجدد دوباره `now` می‌گذارد (مهلت از آخرین بایگانی) — درست است.
- **دادهٔ ناسازگار (`ARCHIVED` بدون `archivedAt`):** با کد فعلی نباید باشد؛ اگر یافت شد → skip + log (بازیابی خودکار اختراع نشود).
- **چرا `expiresAt/createdAt` مبنا نیست:** `expiresAt` «پایان runway» است و ممکن است با لحظهٔ واقعی `ARCHIVED` فرق کند؛ `createdAt` زمان ایجاد است.
- **نیاز migration برای ستونِ زمان: ندارد** (`archivedAt` موجود است). تنها migration احتمالی، ایندکس `[status, archivedAt]` است (§5.11 / Q6).

## 5.5 ثبت و زمان‌بندی job

- **نام پیشنهادی:** `clean-archived-listing-images` (ثابت `jobs.clean-archived-listing-images`) — سازگار با `JOB_NAMES` (`jobs.service.ts:60-66`).
- **محل ثبت:** داخل `JobsService` کنار پنج job موجود؛ متد عمومی قابل فراخوانی مستقیم (تست/دستی).
- **اتصال به `JOBS_ENABLED`:** از طریق `registerInterval` همانند بقیه (`jobs.service.ts:90-100`، `config.types.ts:97-115`). `false` → بدون تایمر، متد مستقیم فعال.
- **`JOBS_BATCH_SIZE`:** سقف هر پاس از همین `batchSize` (۱۰۰)؛ بدون متغیر batch جدید.
- **زمان‌بندی:** بازهٔ روزانه/چندساعته (هم‌تراز orphan)؛ قطعی‌سازی نیازمند بررسی زیرساخت. متغیر `JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_INTERVAL_SECONDS` جدید (§5.11).
- **مدیریت هم‌زمانی:** بدون قفل توزیع (مانند فعلی — `jobs.service.ts:27-32`). ایمنی از **قفل ردیف + به‌روزرسانی شرطی** (§5.6).

## 5.6 الگوریتم پیشنهادی (اصلاح‌شده v2 — «ادعای اتمی» سپس حذف فایل)

اصل کلیدی: **نقطهٔ بدون‌بازگشت یک تراکنش دیتابیس کوچکِ قفل‌شده است، نه حذف فایل.** چون storage و دیتابیس «اتمیک مشترک» نیستند، ادعا (soft-delete همهٔ ردیف‌های تصویرِ یک آگهی) اتمی و قفل‌شده انجام می‌شود و حذف باینری بعد از commit به‌صورت best-effort (قابل retry / reconcile) رخ می‌دهد.

1. **انتخاب batch (نامزد):** تا `batchSize` آگهیِ واجد شرایط (`status='ARCHIVED'`, `archivedAt <= cutoff`, `deletedAt=null`, بدون `Report` باز، دارای حداقل یک `ListingImage.deletedAt=null`). ترتیب پایدار (`archivedAt asc`, سپس `id asc`). **هیچ عملیات مخربی در این گام نیست.**
2. **تراکنش قفل‌شده به‌ازای «آگهی» (نه هر تصویر):** بازکردن تراکنش تعاملی و قفل ردیف آگهی با `SELECT ... FOR UPDATE` (الگوی `lockListing` — `media.service.ts:277-279`). **قید کلاینت/اتصال (ثبت‌شده در v3):** این `FOR UPDATE` باید روی همان `Prisma.TransactionClient` (همان `tx`) و در نتیجه روی همان connectionِ تراکنش صادر شود که گام ۴ (soft-delete) را انجام می‌دهد — دقیقاً مثل `deleteImage` که `lockListing(tx, ...)` را داخل `prisma.$transaction` صدا می‌زند (`media.service.ts:172-193`). این قفل، همهٔ نویسندگان آگهی (از `commitTransition` → `UPDATE Listing`؛ `listings.service.ts:1346-1352`) را تا commit بلوکه می‌کند.
3. **بازبینیِ اتمی شرایط داخل قفل:** `status == 'ARCHIVED'`، `archivedAt <= cutoff`، `deletedAt == null`، نبود `Report` باز. اگر رد شد → rollback (بدون اثر) + شمارش `skipped`.
4. **ادعا (نقطهٔ بدون‌بازگشت) در همان تراکنش:** `UPDATE ListingImage SET deletedAt = now WHERE listingId = ? AND deletedAt IS NULL` برای **همهٔ** تصاویر آگهی. از این لحظه تصاویر در همهٔ payloadها نامرئی‌اند (`listing-row-include.ts:16-19`)؛ حتی اگر بلافاصله `renew/restore` اجرا شود، آگهی «با گالری خالی» باز می‌گردد، نه با تصاویر شکسته.
5. **COMMIT → سپس حذف باینری (best-effort، بعد از commit):** الگوی سالم، همان است که `sweepDeletedImageRows` موجود استفاده می‌کند (`jobs.service.ts:315-323`): کلیدها = `[row.storageKey, ...readVariantKeys(row.variants)]` (با `readVariantKeys` — `jobs.service.ts:420-435`)، سپس برای هر کلید `storage.delete(key)`؛ شیءِ ناموجود خطا نیست (`storage.provider.ts:24-25`، `local-storage.provider.ts:38-45`). `deletePrefix(prefix): Promise<number>` هم API واقعی است (`storage.provider.ts:26-27`؛ پیاده‌سازی `local-storage.provider.ts:51-62`: پیشوند خالی → throw، زیردرخت بدون شیء → ۰) ولی در مسیر پاک‌سازیِ موجود به‌کار نمی‌رود و فقط برای rollback آپلود استفاده می‌شود (`media.service.ts:154,327`). **شکست جزئی چند فایل:** الگوی per-keyِ `delete` + اجرای مجدد روی همهٔ کلیدها (شیء ناموجود no-op) در برابر شکست جزئی مقاوم است؛ در مقابل، `deletePrefix` در پیاده‌سازی محلی با یک `rm -r` غیراتمی است و در صورت throw وسط کار ممکن است تعدادی شیء حذف و بقیه باقی بمانند — پس الگوی per-key ترجیح دارد. شکستِ حذف فایل مهلک نیست چون **retry و reconcile بر عهدهٔ `clean-orphan-media` فاز ۱ است، نه همین job** (زیرا این job رکورد ادعاشده با `deletedAt != null` را دیگر انتخاب نمی‌کند — §5.6.1/§5.7).
6. **ثبت نتیجه:** شمارش `purged` / `skipped_guard` / `skipped_report` / `storage_failed` / `db_failed`.
7. **batch بعدی:** پاس با حداکثر `batchSize` آگهی پایان می‌یابد؛ بدون کوئری بدون‌باند. رکوردهای ادعاشده (`deletedAt != null`) دیگر واجد شرایط نیستند، پس این job idempotent است و چیزی را دوباره حذف نمی‌کند (retry فایل بر عهدهٔ orphan sweep است).
8. **توقف/ازسرگیری امن:** قطع‌شدن بین commit و حذف فایل، وضعیت «ادعاشده ولی فایل باقی‌مانده» می‌گذارد که orphan sweep آن را reconcile می‌کند.

### چرا «ابتدا فایل، سپس soft-delete» (نسخهٔ v1) غلط بود
بین «بررسی آرشیو» و «حذف فایل»، `renew/restore` می‌توانست وضعیت را `ACTIVE` کند؛ حذف فایل، باینری را می‌برد ولی ردیف `deletedAt=null` می‌ماند → آگهیِ ACTIVE با تصاویر شکسته. شرط `WHERE deletedAt IS NULL` هم این را نمی‌بست چون «وضعیت آگهی» را شرط نمی‌کرد.

## 5.6.1 تحلیل هم‌زمانی (Race Condition) و طرح هماهنگی

**Race با `renew`/`restore` (مسئلهٔ ۱):**
- همهٔ انتقال‌ها از `commitTransition` با `UPDATE ... WHERE id AND version AND deletedAt IS NULL` می‌گذرند (`listings.service.ts:1346-1352`) — یعنی `UPDATE` ساده روی ردیف `Listing`.
- `SELECT ... FOR UPDATE` (`media.service.ts:277-279`) روی همان ردیف با آن `UPDATE` سریال می‌شود. دو ترتیب ممکن، هر دو امن:
  - renew قبل از قفل job commit شد → job در گام ۳ `status=ACTIVE/DRAFT` می‌بیند و rollback؛ هیچ فایلی حذف نمی‌شود.
  - job اول قفل و ادعا را commit کرد → renew بعداً اجرا و آگهی «با گالری خالی» بازنشر می‌شود (فروشنده دوباره آپلود) — منطبق با سیاست.
- **چرا بازخوانیِ وضعیت قبل از حذف کافی نیست:** read عادی (بدون قفل) با حذف غیرتراکنشیِ فایل اتمیک نیست؛ renew می‌تواند بین آن دو commit شود. `WHERE deletedAt IS NULL` به‌تنهایی هم وضعیت آگهی را شرط نمی‌کند.
- **بازنشرِ هم‌زمان با آغاز پاک‌سازی:** از commit ادعا، «نقطهٔ بدون‌بازگشت» گذشته است؛ بازنشر موفق ولی بدون تصویر. اگر renew باید در این لحظه خطای صریح بدهد، باید `Listing.version` bump شود تا `commitTransition` با `LISTING_VERSION_CONFLICT` رد شود؛ اما bump بدون revision، شکاف version می‌سازد (Q7).

**Race با ایجاد `Report` جدید (مسئلهٔ ۲ — اصلاح‌شده در v5: race باز است):**
- `reports.submit` وضعیت را با `findUnique` ساده (بدون تراکنش/قفل) می‌خواند (`reports.service.ts:55-63`) و سپس در تراکنشِ جدا (`:81-105`) فقط `report.create` را اجرا می‌کند — بدون بازخوانی `status` و بدون `SELECT ... FOR UPDATE`. شرط `ACTIVE/SOLD` (`:73-78`) صرفاً روی همان read قدیمی اعمال می‌شود؛ پس «رد گزارش روی `ARCHIVED`» به‌تنهایی race را نمی‌بندد (TOCTOU).
- **ترتیبِ رقابتِ ممکن (v5):** (۱) گزارش `status=ACTIVE` را می‌خواند؛ (۲) آگهی `ARCHIVED` می‌شود؛ (۳) job قفل می‌گیرد، «نبود گزارش باز» را می‌بیند و ادعای اتمی را commit می‌کند؛ (۴) گزارش با استناد به read قدیمی، `report.create` را commit می‌کند؛ (۵) job باینری را حذف می‌کند. نتیجه: گزارش `OPEN` معتبر برای آگهی‌ای که تصاویرش همین حالا پاک شد.
- **سازوکار هماهنگی فعلی بین گزارش و پاک‌سازی: وجود ندارد** — مسیر گزارش ردیف `Listing` را قفل نمی‌کند و وضعیت را در همان تراکنشِ درج بازخوانی نمی‌کند (`reports.service.ts:55-63` فقط read). ادعای «انحصار متقابل از خود status» نادرست است: status در لحظهٔ read دیده می‌شود، نه لحظهٔ insert؛ ایمن‌سازی نیاز به قفل+بازخوانی در مسیر گزارش دارد (§5.16).
- **دسترسی تصویر هنگام گزارش:** فقط با بستن TOCTOU (§5.16) تضمین می‌شود که هنگام درج گزارش، آگهی قابل پاک‌سازی نباشد. بدون آن، گزارش ممکن است پس از purge ثبت شود و شواهد بصری در دسترس نباشد (وابسته به Q4/Q8).

**Batch چند تصویری:** پردازش «به‌ازای آگهی» در یک تراکنش، ادعای اتمی سراسر گالری را تضمین می‌کند؛ بازنشر نمی‌تواند بین حذف تصویر ۱ و ۲ قرار گیرد.

**OPEN QUESTION (اثبات قفل):** blocking واقعیِ `SELECT ... FOR UPDATE` در برابر `updateMany` باید با یک تستِ واقعیِ دو-تراکنش (دو connection جدا، روی پول اتصال) اثبات شود که job و `renew`/`restore` را هم‌زمان اجرا می‌کند و در هر دو ترتیبِ رقابت نتیجه امن است. وجودِ `lockListing` سابقهٔ پیاده‌سازی است، نه اثبات ریسک مسابقه؛ بدون این تست نمی‌توان ادعای قطعیِ سریال‌سازی کرد. **پیش‌شرط:** قفل حتماً روی همان کلاینت تراکنش/اتصالِ گام ۴ صادر شود (§5.6 گام ۲)، وگرنه اصلاً مسابقه را سریال نمی‌کند.

## 5.7 تحلیل دقیق شکست (Failure analysis) — بر اساس ترتیب اصلاح‌شده

در همهٔ موارد، بازیابی از idempotency و به‌روزرسانی شرطی تأمین می‌شود.

| سناریو | رفتار پیشنهادی | بازیابی |
|---|---|---|
| شیءِ فایل وجود ندارد | `delete(key)` شیءِ ناموجود را نادیده می‌گیرد (`storage.provider.ts:24-25`, `local-storage.provider.ts:38-45`)؛ `deletePrefix` زیردرختِ خالی را ۰ برمی‌گرداند (`local-storage.provider.ts:56-58`) | ادامه (idempotent) |
| ادعا (soft-delete) commit شد | تصاویر بلافاصله از payloadها حذف می‌شوند | سپس حذف باینری |
| حذف باینری ناموفق بعد از ادعا | ردیف soft-deleted می‌ماند؛ شمارش `claimed` + `storage_failed` (نه `purged`) — §5.10 | **retry توسط `clean-orphan-media` فاز ۱، نه همین job** (`jobs.service.ts:305-337`) |
| قطع اتصال storage بعد از ادعا | ردیف soft-deleted؛ فایل‌ها می‌مانند | retry توسط `clean-orphan-media` فاز ۱ |
| خطای DB قبل از commit ادعا | تراکنش rollback؛ هیچ اثری | هیچ |
| توقف job بعد از commit ادعا، قبل از حذف فایل | ردیف soft-deleted؛ فایل‌ها باقی | reconcile توسط `clean-orphan-media` فاز ۱ (ردیف past-retention) و فاز ۲ (کلید بی‌مرجع) |
| آگهی بین انتخاب batch و شروع تراکنش بازگردانده شد | قفل/check گام ۳ (`status != ARCHIVED`) → rollback | هیچ فایلی حذف نمی‌شود |
| آگهی در حین ادعا بازگردانده شد | سریال‌سازی قفل: یا job برنده (renew بعداً با گالری خالی) یا renew برنده (job `status!=ARCHIVED` می‌بیند → rollback) | هرگز «فعال با فایلِ حذف‌شده» نمی‌شود |
| گزارش جدید در بازهٔ پاک‌سازی | تحت کد فعلی **ممکن است** (TOCTOU: read قدیمی + درج در تراکنش جدا)؛ پس از اصلاح §5.16 دیگر ممکن نیست | اصلاح مسیر گزارش (§5.16) |
| دو worker همان آگهی | قفل + شرطی؛ فقط یکی ادعا commit می‌کند | دومی count=0 → skip |
| اجرای مجدد (نیمه‌پردازش‌شده) | claim idempotent (`deletedAt IS NULL`)؛ حذف فایل تکراری بی‌اثر | بدون اثر |

**مالکیت retry (اصلاح v3):** پس از commit ادعا، همین job رکورد را دیگر انتخاب نمی‌کند (eligibility = `deletedAt IS NULL`). **retryِ حذف فایل و hard-delete نهاییِ ردیف بر عهدهٔ `clean-orphan-media` فاز ۱** است که ردیف‌های `deletedAt < cutoff` را طی می‌کند، `storage.delete(key)` را روی همهٔ کلیدها باز می‌زند (شیء ناموجود no-op) و تنها پس از حذف همهٔ اشیاء ردیف را hard-delete می‌کند؛ در صورت خطا ردیف برای پاس بعد باقی می‌ماند (`jobs.service.ts:305-337`). پس `claimed` (soft-delete commit شد) از `purged` (فایل‌ها هم حذف شدند) جدا است و `storage_failed` یعنی `claimed` ولی نه `purged`. متریک `needs_reconciliation` برای رصد (نه جدول state جدید).

## 5.8 جلوگیری از dangling reference و ناسازگاری

- **وضعیت `ListingImage` پس از ادعا:** `deletedAt = now`. بلافاصله از همهٔ payloadها حذف می‌شود چون include تصاویر با `where.deletedAt = null` فیلتر می‌شود (`listing-row-include.ts:16-19`).
- **چه زمانی ردیف hard-delete می‌شود؟** توسط `clean-orphan-media` فاز ۱، هفت روز بعد از `deletedAt` (`jobs.service.ts:306-337`). این کار hard-delete ردیف را از این job جدا می‌کند.
- **رفتار metadata هنگام شکست حذف فایل (اثبات از کد):** در `sweepDeletedImageRows` اگر `storage.delete` خطا دهد، `catch` → `continue` → ردیف **با `deletedAt` ماندگار باقی می‌ماند** و در پاس بعدی `delete` روی همهٔ کلیدها دوباره اجرا و سپس hard-delete می‌شود (`jobs.service.ts:324-334`). پس soft-delete و hard-delete ی metadata هرگز صرفاً به‌خاطر شکستِ موقت storage از بین نمی‌رود و همیشه بعد از حذف همهٔ اشیاء اتفاق می‌افتد.
- **ارجاع فعال به فایل:** فقط `ListingImage.storageKey`/`variants`. جدول دیگری storage-key ذخیره نمی‌کند. پس از soft-delete، این ردیف فیلتر می‌شود.
- **FK:** فقط `ListingImage.listingId → Listing` (`schema.prisma:516`). حذف باینری و soft-delete ردیف هیچ FKای نمی‌شکند.
- **تفکیک باینری/metadata:** این job «ادعا» می‌کند (metadata soft-delete) و باینری را بعد می‌زداید؛ hard-delete نهایی metadata بر عهدهٔ `clean-orphan-media` است.

### 5.8.1 شواهد تصویری و تاریخچه (تفکیک چهار لایه)

سیاستِ «حفظ شواهد» باید بین این چهار چیز جدا قائل شود (اجرای این job فقط لایهٔ ۴ را نابود می‌کند):

| لایه | پس از اجرای job | شاهد |
|---|---|---|
| ۱. رویداد نظارتی (`AuditLog`/`ModerationAction`) | **دست‌نخورده** | job هیچ‌کدام را نمی‌نویسد/حذف نمی‌کند |
| ۲. snapshot در `ListingRevision` | **باقی می‌ماند**، اما URL/کلید داخل آن به باینریِ حذف‌شده اشاره می‌کند → لینک مرده | `schema.prisma:499-500`؛ `commitTransition` ردیف revision را می‌نویسد |
| ۳. URL / storage key | به‌صورت رشته باقی می‌ماند ولی قابل‌حل نیست (404) | `ListingImage.storageKey`/`variants` |
| ۴. باینری تصویر (original + 3 variant) | **نابود می‌شود** (نقطهٔ بدون‌بازگشت) | هدف همین job |

**نتیجه:** آنچه «حفظ می‌شود» متن metadata + رویداد نظارتی + متن گزارش + متن revision است؛ **خودِ تصویر (شواهد بصری) از بین می‌رود.** اگر برای اختلاف/پروندهٔ نظارتی به خودِ باینری نیاز باشد، این job آن را از دسترس خارج می‌کند. این تصمیم مالک است (Q4/Q8) و تا تصمیم نهایی «حل‌شده» تلقی نمی‌شود.

## 5.9 امنیت و محدودیت‌های حفاظتی

- **جلوگیری از حذف آگهی فعال:** eligibility فقط `ARCHIVED`؛ و در گام ۲–۳ با `SELECT ... FOR UPDATE` + بازبینیِ `status` قفل‌شده تضمین می‌شود.
- **اعتبارسنجی وضعیت پیش از حذف نهایی:** ادعا فقط داخل تراکنش قفل‌شده و پس از تأیید `status=ARCHIVED`؛ نه بر اساس read عادی.
- **بررسی گزارش/نظارت:** چک `Report.status ∈ {OPEN, UNDER_REVIEW}` داخل همان قفلِ job لازم است اما **کافی نیست** — چون `reports.submit` وضعیت را بدون قفل می‌خواند و درج را در تراکنش جدا انجام می‌دهد، TOCTOU باز می‌ماند. بستن gap مستلزم قفل‌کردن ردیف `Listing` و بازخوانی `status` در همان تراکنشِ درج گزارش است (§5.16). `ModerationAction`/`AuditLog` دست نمی‌خورند.
- **سرایت حذف به اطلاعات دیگر:** خیر — حذف محدود به کلیدهای زیر پیشوند `listings/<listingId>/<imageId>/` است (uuid های server-generated؛ الگوی per-key یا `deletePrefix(prefix)`)؛ هیچ ورودی کاربر در کلید نیست.
- **استخراج امن مسیر:** کلیدها از `ListingImage.storageKey`/`variants`؛ با `assertSafeStorageKey` (رد backslash و `..`) — `storage.provider.ts:39-64`.
- **نگهداری قانونی/نظارتی:** رویدادها و metadata حفظ می‌شوند؛ اما **باینری تصویر** پس از purge از دسترس خارج می‌شود (§5.8.1). استثناهای «نگهداری بیشتر» به Q4/Q8.
- **خطر تغییر هم‌زمان وضعیت:** با قفل ردیف + به‌روزرسانی شرطی پوشش داده می‌شود؛ نه صرفاً کوئری اولیه.

## 5.10 Logging و Metrics

یک log ساخت‌یافتهٔ pino به‌ازای هر اجرا (الگوی `JobLogFields` — `jobs.service.ts:53-57`):

- `scanned` — آگهیِ بررسی‌شده
- `eligible` — واجد شرایط
- `purged` — آگهی که ادعا و حذف فایل انجام شد
- `claimed` — ادعا commit شد (متمایز از `purged` وقتی حذف فایل عقب می‌افتد)
- `skipped_guard` / `skipped_report` — ردشده به‌دلیل گارد/گزارش باز
- `storage_failed` / `db_failed` — خطا
- `needs_reconciliation` — نیمه‌پردازش‌شده (اختیاری)
- `durationMs`

**ممنوع در log:** کلیدهای storage (احتمال secret)، شماره/نام کاربر، متن/محتوای آگهی. فقط شناسه‌های داخلی و شمارنده‌های تجمیعی.

## 5.11 تنظیمات محیطی

| متغیر | مقدار پیشنهادی | کاربرد | تغییر در نسخهٔ بعدی |
|---|---|---|---|
| `ARCHIVED_IMAGE_RETENTION_DAYS` | `30` | مهلت نگهداری تصویر پس از `archivedAt` | ✅ جدید — `env.schema.ts`+`configuration.ts`+`config.types.ts`+`.env.example`+`test-env.ts`+`README` |
| `JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_INTERVAL_SECONDS` | `21600` (پیشنهادی) | فاصلهٔ اجرا | ✅ جدید — همان فایل‌ها |
| `JOBS_ENABLED` | `true` (موجود) | سوییچ اصلی | ❌ موجود (`config.types.ts:103`) |
| `JOBS_BATCH_SIZE` | `100` (موجود) | سقف پاس | ❌ موجود (`config.types.ts:105`) |
| `ORPHAN_MEDIA_RETENTION_DAYS` | `7` (موجود) | soft→hard delete ردیف | ❌ موجود (`env.schema.ts:119`) |

> ایندکس `[status, archivedAt]` (یا `[status, archivedAt, id]`) برای انتخاب batch — migration مستقل در انتشار بعدی.

## 5.12 برنامهٔ تست (شامل سناریوهای هم‌زمانی)

الگوی شاهد: `jobs.e2e-spec.ts:580-663` (4 keys، تزریق `now`، soft-delete، محافظت تصاویر زنده).

**Unit tests**
- محاسبهٔ cutoff از `archivedAt + DAYS` (لبه‌ها).
- فیلتر وضعیت غیرمجاز (`ACTIVE/SOLD/DRAFT/PENDING_REVIEW/REJECTED`).
- رکورد ناقص (`ARCHIVED` بدون `archivedAt`) → skip نه خرابی.
- شمارنده‌ها برای هر مسیر.
- idempotency (اجرای مجدد → ۰).

**Integration tests (Postgres + storage آزمایشی)**
- آگهی `ARCHIVED` قدیمی → ادعا commit + فایل‌ها پاک.
- آگهی `ARCHIVED` تازه → دست‌نخورده.
- آگهی با `Report.status=OPEN` → دست‌نخورده.
- هر ۴ شیء یک تصویر پاک شود؛ تصاویر زنده دست‌نخورده.
- **هم‌زمانی (کلیدی):** دو تراکنش هم‌زمان — job (قفل+ادعا) و renew/restore — در هر دو ترتیب، نتیجه امن باشد (هیچگاه «ACTIVE با فایل حذف‌شده»).
- **آزمونِ واقعیِ رقابت (دو connection):** دو تراکنش هم‌زمان — job (گام ۲–۴) و `renew`/restore — از دو اتصال جدا؛ در هر دو ترتیب، برنده تعیین شود (یک آگهی هرگز «فعال با فایل حذف‌شده» نشود). صرفِ وجود `lockListing` اثبات نیست.
- شکست بین commit ادعا و حذف فایل → reconcile توسط `clean-orphan-media` (نه همین job؛ رکورد `deletedAt != null` دیگر انتخاب نمی‌شود).
- بازنشر پس از ادعا → گالری خالی (نه تصاویر شکسته).

**E2E tests**
- بایگانی/واجد شرایط → بعد از job تصویر از payloadها غایب و storage خالی.
- ACTIVE → دست‌نخورده.
- بازگردانده‌شده → دست‌نخورده.
- گزارش باز → دست‌نخورده.
- فایل مفقود → بدون خطا.
- خطای storage → retry توسط `clean-orphan-media` فاز ۱ (این job رکورد را دوباره نمی‌گیرد).
- اجرای تکراری → no-op.
- **race واقعی با‌تأخیر:** تزریق تأخیر بین گام‌ها برای تحریک renew هم‌زمان.

**محدودیت:** عبور زمان با تزریق `now` (`jobs.cleanOrphanMedia(later)` — `jobs.e2e-spec.ts:648-649`). بدون تغییر معماری.

## 5.13 معیارهای پذیرش (قابل آزمون)

- فقط تصاویر آگهی `ARCHIVED` با `archivedAt + DAYS <= now` پاک می‌شوند.
- هیچ ردیف `Listing` تغییر وضعیت/soft-delete/hard-delete نمی‌شود.
- هیچ تصویر آگهی `ACTIVE` یا بازگردانده‌شده حذف نمی‌شود — **تحت race واقعی هم** (§5.12).
- هیچ تصویری با `Report.status ∈ {OPEN, UNDER_REVIEW}` حذف نمی‌شود.
- `AuditLog`/`ModerationAction`/`ListingRevision`/`Report` (به‌جز soft-delete عمدی `ListingImage`) تغییری نمی‌کنند.
- **هیچ اجرایی نمی‌تواند آگهی را «ACTIVE/نمایان با تصویرِ باینریِ حذف‌شده» بگذارد.**
- خطای موقت storage بعد از ادعا، `storage_failed` ثبت می‌کند و ردیف `claimed` (soft-deleted) می‌ماند؛ retry و hard-delete توسط `clean-orphan-media` فاز ۱ تضمین می‌شود (نه همین job). خطای DB قبل از commitِ ادعا → rollback بی‌اثر.
- اجرای مجدد امن/بی‌اثر است؛ هر پاس باند و قابل کنترل.
- `claimed` (ادعای commit‌شده) و `purged` (حذف فایل) به‌صورت دو شمارندهٔ مجزا گزارش می‌شوند و همیشه `purged <= claimed` است.
- نتیجه observable (pino) و قابل ممیزی.
- `JOBS_ENABLED=false` مانع اجرای زمان‌بندی‌شده می‌شود (متد مستقیم فعال).

## 5.14 موارد نیازمند تصمیم مالک

| شناسه | سؤال | گزینه‌ها | پیشنهاد مستند | پیامد |
|---|---|---|---|---|
| Q1 | سیاست تصاویر `SOLD` | الف) خارج از scope؛ ب) مهلت بر مبنای `soldAt`؛ ج) ۳۰ روز | الف (چون `soldAt` ست می‌شود نه `archivedAt`) | حجم SOLD در بلندمدت؛ بدون تصمیم، `SOLD` ≠ `ARCHIVED` |
| Q2 | سرنوشت metadata پس از حذف باینری | الف) soft-delete (این سند)؛ ب) hard-delete فوری؛ ج) ستون `filesPurgedAt` | الف (بازاستفاده از orphan sweep) | hard-delete فوری به handling `isPrimary`/revision نیاز دارد |
| Q3 | `ARCHIVED` بدون `archivedAt` (legacy) | الف) skip دائم + alert؛ ب) backfill با `updatedAt` | الف (بدون اختراع مبنا) | رکورد هرگز پاک نمی‌شود |
| Q4 | استثناهای نگهداری نظارتی/قانونی (شواهد بصری) | الف) فقط گزارش باز + `PENDING_REVIEW`؛ ب) flag/hold اضافی؛ ج) حفظ باینری برای پرونده‌ها | الف (هم‌خوان با مدل فعلی) | چون باینری نابود می‌شود (§5.8.1)، نگهداری طولانی‌تر مستلزم تصمیم جدا |
| Q5 | بازنشر پس از حذف تصاویر (UX) | الف) دوباره آپلود؛ ب) خطای صریح هنگام race | الف + تغییر متن «بعداً بازنشر» هم‌زمان | جلوگیری از انتظار نادرست کاربر |
| Q6 | ایندکس `[status, archivedAt]` | الف) در انتشار بعدی (migration)؛ ب) بدون ایندکس | الف | کارایی انتخاب batch |
| Q7 | ثبت/قفلِ ادعا به‌صورت version bump یا revision | الف) بدون bump (renew بعد از ادعا با گالری خالی)؛ ب) bump version برای خطای صریح + نوشتن revision `SYSTEM` (نیاز enum جدید + migration) | الف (ساده‌تر)؛ ب برای audit کامل | ب نیاز به تغییر `ListingRevisionChangeType` + migration دارد |
| Q8 | ماندگاری شواهد بصری برای اختلاف/نظارت | الف) باینری برای همیشهٔ محدود خارج از storage اصلی؛ ب) فقط metadata/متن | **باز** — تصمیم صریح لازم | پاک‌سازی، شواهد بصری را غیرقابل‌بازیابی می‌کند |

---

## 5.15 بازبینی آمادگی نهایی (v5)

### 5.15.1 موجودی مسیرهای تغییر گالری و محافظت همزمانی هر مسیر

| مسیر | عملیات روی `ListingImage` | قفل/محافظت | شاهد کد |
|---|---|---|---|
| آپلود/افزودن تصویر (`uploadImage`) | `create` + کنترل `maxImagesPerListing` + تخصیص `sortOrder`/`isPrimary` | **قفل ردیف**: `lockListing(tx)` = `SELECT ... FOR UPDATE` روی همان `tx` تراکنش | `media.service.ts:121-136` |
| حذف تصویر (`deleteImage`) | soft-delete + ارتقای successor (حفظ single-primary) | **قفل ردیف**: `lockListing(tx)` | `media.service.ts:172-193` |
| تغییر اولویت/تصویر اصلی (`reorderImage`) | update `isPrimary`/`sortOrder` | **قفل ردیف**: `lockListing(tx)` | `media.service.ts:218-255` |
| ثبت تغییر گالری (`registerImageChange` → `commitImageChange`) | تغییر `status` + append revision | **بدون `FOR UPDATE`**؛ optimistic با `commitTransition` (`UPDATE ... WHERE version`) | `media.service.ts:158,196,257` → `listings.service.ts:645-692,1332-1373` |

**نتیجهٔ هماهنگی با Job (اثباتشده از کد):**
- مسیر چهارم قفل ردیف نمیگیرد، ولی صرفاً در `IMAGE_MUTABLE_STATUSES` (DRAFT/REJECTED/ACTIVE/PENDING_REVIEW) اجرا میشود (`listings.service.ts:658-660`؛ `listing-state.ts:141-146`). `ARCHIVED`/`SOLD` **کاملاً خارج** از این مجموعهاند. پس تغییر گالری و Job پاکسازی روی یک آگهیِ واحد «انحصار متقابل» دارند و هرگز همزمان اجرا نمیشوند.
- تنها راهِ خروج آگهی از `ARCHIVED` به وضعیت گالری-پذیر، `renew` (`listings.service.ts:489-536`) و `restoreByAdmin` (`:851-891`) هستند؛ هر دو از `commitTransition` (بهروزرسانی optimistic) میگذرند که روی قفلِ `FOR UPDATE` ی Job بلوکه/سریال میشود.
- **بنابراین هیچ مسیری باعث حذفِ تصویرِ تازهاضافهشده، یتیمشدن فایل یا ناسازگاری گالری نمیشود:** تصویر جدیدی که پس از بایگانی اضافه شود، ردیفی است که یا بعد از commit ادعای Job ساخته شده (Job آن را نمیبیند) یا پیش از قفل Job ساخته شده ولی آگهی دیگر `ARCHIVED` نیست (Job رد میشود). وجود `lockListing` در یک مسیر ≠ اثبات بقیه؛ اینجا هر مسیر جدا با شاهد کد تأیید شد.

### 5.15.2 invariant «انتشار بدون تصویر» (مسیرهای `renew`/`restore`)

- **هیچ شرط «حداقل تصویر» در هیچ مسیر انتشار/بازنشر وجود ندارد.** جستجوی backend فقط `maxImagesPerListing` (سقف بالا؛ `media.service.ts:98,127`) را مییابد؛ `assertPublishAllowance` فقط سقف تعداد ACTIVE/PENDING را چک میکند (`listings.service.ts:1167-1191`) و `validateContent` فقط عنوان/توضیح/قیمت (`:1198+`).
- `submit` (`:400-451`)، `approve` (`:697-749`)، `restoreByAdmin` (`:851-891`) و `renew` (`:489-536`) هیچکدام تعداد تصویر را نمیسنجند.
- **نتیجه:** فعال/منتشر شدنِ آگهیِ بدون تصویر **مجاز است** و frontend نیز عمداً placeholder «بدون تصویر» رندر میکند (`listing-card.tsx:70`؛ `listing-card.test.tsx:61`). بنابراین اگر Job ابتدا گالری را «ادعا» کند و سپس `renew`/`restore` انجام شود، آگهی با گالری خالی باز میشود — **این رفتارِ معتبر محصول است، نه نقض invariant**؛ راهکار جایگزین لازم نیست. (هماهنگ با وابستگی UI در Q5.)

### 5.15.3 تکمیل تستهای همزمانی (شامل مسیرهای گالری) + وضعیت اجرا

علاوه بر رقابت Job با `renew`/`restore` (§5.12)، این سناریوها نیز **طراحی** شدهاند:
- **دو connection مستقل Postgres + یک storage**: تراکنش Job (قفل + ادعا) روی connection A، عملیات گالری (`upload`/`delete`/`reorder`) روی connection B؛ کنترل ترتیب با barrier صریح (نگهداشتن `FOR UPDATE` حین شلیک عملیات از connection دیگر).
- **پس از هر interleaving، هم وضعیت دیتابیس و هم وضعیت Storage بررسی شود** (شمارش ردیفهای `deletedAt`/`isPrimary` + `list()` کلیدهای storage).
- آپلود روی `ARCHIVED` → رد (`LISTING_EDIT_NOT_ALLOWED`).
- `renew` پس از commit ادعا → گالری خالی؛ سپس آپلود جدید → ردیف سالم، `isPrimary` درست، فایل storage موجود، و Job آن را حذف نمیکند.
- حداکثر-تصویر/تک-باینری: بعد از مسابقه، orphan sweep فاز ۲ چیز ناخواستهای نیابد.

**وضعیت اجرا (صریح):** همهٔ تستهای این سند «طراحیشده» هستند و **هیچکدام اجرا نشدهاند** — Job هنوز پیادهسازی نشده و این بازبینی صرفاً مستندسازی است؛ هیچ تستی run نشده و هیچ نتیجهای ادعا نمیشود.

### 5.15.4 وضعیت تصمیمهای مالک و آمادگی

- **Q8 (نگهداری باینری تصاویر بهعنوان شواهد نظارتی) همچنان باز است** — حلنشده.
- سایر سؤالها فقط در صورت ثبت تصمیم صریح «حلشده» علامت میخورند؛ **در حال حاضر هیچیک تصمیم صریح ندارند.** پیامد فنی هر یک:
  - **Q1 (SOLD):** بدون تصمیم، تصاویر `SOLD` هرگز در scope نمیآیند → رشد storage.
  - **Q2 (metadata):** پیشفرض سند soft-delete است؛ hard-delete فوری یا ستون `filesPurgedAt` محتاج تصمیم.
  - **Q3 (legacy بدون `archivedAt`):** skip دائم → این رکوردها هیچوقت پاک نمیشوند.
  - **Q4 (استثناهای نظارتی):** بدون hold اضافی، شواهد بصری پس از ۳۰+۷ روز از بین میرود.
  - **Q5 (UX بازنشر):** **وابستگی اجرا که نباید فراموش شود** — متن UI «بعداً میتوانید بازنشرش کنید» باید همزمان با انتشار Job تغییر کند تا به کاربر وعدهٔ نادرستِ ماندگاری تصویر داده نشود.
  - **Q6 (ایندکس):** بدون `[status, archivedAt]`، انتخاب batch در حجم بالا کند میشود.
  - **Q7 (version-bump/revision):** بدون bump، بازنشرِ پس از ادعا با گالری خالی باز میشود (رفتار پذیرفتهشده)؛ با bump نیاز به enum جدید + migration.
- **حکم آمادگی:** سند برای «تصمیمگیری مالک» آماده است (readiness برای تصمیم)؛ **برای کدنویسی آماده نیست** مگر پس از پاسخ صریح Q1–Q8 و لغو انجماد v1.0.0 و اثباتِ تستِ همزمانِ قفل (§5.6.1).
- **وابستگی مسیر گزارش (v5):** صحت job مشروط به اصلاح `reports.submit` است (قفل + بازخوانی وضعیت در یک تراکنش — §5.16)؛ تا آن زمان race گزارش باز می‌ماند.

## 5.16 مسیر گزارش و Race (اصلاح v5)

### 5.16.1 نتیجهٔ حسابرسی — ادعای v4 نادرست بود

ادعای «race گزارش به‌دلیل ردشدن گزارش روی `ARCHIVED` بسته می‌شود» **با شواهد کد رد شد.** مسیر ثبت گزارش (`reports.service.ts`):

- وضعیت `Listing` با `findUnique` ساده، **بدون تراکنش و بدون قفل** خوانده می‌شود (`:55-63`).
- شرط «فقط `ACTIVE`/`SOLD` گزارش‌پذیرند» (`:73-78`) روی همان read قدیمی اعمال می‌شود.
- درج `Report` در تراکنشِ **جدا** (`:81-105`) فقط `tx.report.create` + `stats.record` است — بدون `SELECT ... FOR UPDATE`، بدون بازخوانی `status`، بدون به‌روزرسانی شرطی.
- حذف‌های تکراری فقط با ایندکس یکتای جزئی `Report_reporter_user_listing_open_key` (`:97`) محدود می‌شود؛ آن هم «همان گزارشگر + همان آگهی» را می‌گیرد، نه وضعیت آگهی را و نه گزارشگرهای دیگر را.

**پس TOCTOU ممکن است:** (۱) read=ACTIVE؛ (۲) بایگانی؛ (۳) job قفل + ادعای اتمی + commit؛ (۴) درج گزارش بر اساس read قدیمی؛ (۵) حذف باینری. نتیجه: گزارش `OPEN` برای آگهی‌ای که تصاویرش پاک شده. وجود Foreign Key یا «رد گزارش روی ARCHIVED» کافی نیست.

### 5.16.2 راهکار پیشنهادی (سازگار با معماری موجود)

ثبت گزارش در **یک تراکنش واحد**: (۱) قفل ردیف `Listing` با `SELECT ... FOR UPDATE` روی همان `tx` (الگوی `lockListing` — `media.service.ts:277-279`)؛ (۲) بازخوانی `status` پس از گرفتن قفل؛ (۳) اعتبارسنجی (`ACTIVE`/`SOLD`، مالک نبودن، seller `ACTIVE`)؛ (۴) `report.create` + `stats.record`؛ (۵) commit. در صورت `ARCHIVED`/غیرمجاز → `LISTING_NOT_FOUND` مطابق قرارداد (§110).

- **سازگاری:** الگوی قفل+درج همان است که `upload/delete/reorder` با `lockListing(tx)` دارند؛ `stats.record(listingId, 'reports', …, tx)` پیش‌تر `tx` را می‌پذیرد (`:94`). **نیازی به migration نیست.**
- **تغییر ظاهری برای کاربر/قرارداد:** ندارد — همان endpoint و همان کدهای خطا/پاسخ؛ فقط atomicity قفل+بازخوانی اضافه می‌شود.

### 5.16.3 دو ترتیبِ امن (قابل آزمون پس از پیاده‌سازی)

- **ترتیب A (گزارش برنده):** گزارش قفل `Listing` را اول می‌گیرد، گزارش را در همان tx ثبت و commit می‌کند؛ job سپس قفل را می‌گیرد، «گزارش باز» را می‌بیند و تصاویر را پاک نمی‌کند.
- **ترتیب B (job برنده):** job قفل را اول می‌گیرد و ادعای تصاویر را commit می‌کند؛ درخواست گزارش پس از گرفتن قفل، `status=ARCHIVED` را می‌خواند و طبق §110 رد می‌شود.

⚠ این دو ترتیب **تضمینِ اثبات‌شده نیستند**؛ طراحی‌اند و فقط پس از اصلاح مسیر گزارش و اجرای تست‌های §5.16.4 معتبر می‌شوند.

### 5.16.4 تست‌های لازم (طراحی‌شده — هیچ‌کدام اجرا نشده‌اند)

Integration با Postgres واقعی + دو connection مستقل:

- گزارش در برابر job (گزارش برنده → تصاویر حفظ می‌شوند).
- job در برابر گزارش (job برنده → گزارش رد می‌شود، `ListingImage.deletedAt` ست می‌شود، باینری حذف می‌شود).
- تأخیر کنترل‌شده بین اعتبارسنجی و درج گزارش (تزریق barrier) برای تحریک TOCTOU.
- بررسی نهایی هم‌زمان: `Listing.status`، `Report.status`، `ListingImage.deletedAt` و وجود/نبود باینری در storage.
- گزارش معتبرِ پیش از ادعا → حفظ تصاویر؛ درخواستِ مبتنی بر status قدیمی → **به اشتباه پذیرفته نمی‌شود**.

### 5.16.5 پیامد و وابستگی‌ها

- **نیاز به تغییر کد داخلی مسیر گزارش دارد** (`reports.service.ts`) — خارج از محدودهٔ خودِ job ولی پیش‌شرط صحت آن است.
- **بدون تغییر در API عمومی / OpenAPI / migration** (همان endpoint و همان کد خطا).
- این وابستگی باید در برنامهٔ انتشار بعدی کنار job ثبت شود؛ تا اصلاح نشود، «ادعای اتمی» job، race گزارش را نمی‌بندد.
- Q4/Q8 (ماندگاری شواهد بصری) همچنان باز و مستقل است؛ تصمیم مالک لازم.

## 5.17 آماده‌سازی اجرا و Rollout کنترل‌شده (v6 — پیشنهاد، پیش از مجوز)

> این بخش فقط «پیشنهاد اجرایی» است؛ هیچ تصمیم مصوب مالک و هیچ تغییری در کد/قرارداد/داده اعمال نشده است.

### 5.17.1 سیاست محافظه‌کارانهٔ شواهد (پیشنهاد مرحلهٔ B)

- آگهی‌های `SOLD` خارج از scope این job بمانند (هم‌راستا با Q1/گزینهٔ الف؛ چون `markSold` فقط `soldAt` را می‌گذارد و `archivedAt` را مقداردهی نمی‌کند — `listings.service.ts:455-467`).
- آگهی‌هایی که دارای «هر» سابقهٔ گزارش (`Report` در هر وضعیتی) یا اقدام نظارتی معنادار (`ModerationAction`) هستند، تا تعیین سیاست مستقل نگهداری شواهد، از پاک‌سازی خارج بمانند — این سخت‌گیرانه‌تر از «فقط گزارش باز» (§5.3 / Q4 گزینهٔ الف) است و ریسک نظارتی نسخهٔ اول را می‌کاهد.
- `ListingImage` ابتدا soft-delete شود؛ پاک‌سازی نهایی metadata بر عهدهٔ `clean-orphan-media` فاز ۱ بماند (§5.6/§5.8).
- آگهی `ARCHIVED` بدون `archivedAt` معتبر → رد + گزارش (skip) بدون حدس دربارهٔ تاریخ مبنا (Q3/گزینهٔ الف).
- پس از حذف تصاویر، بازنشر نیازمند بارگذاری دوبارهٔ تصاویر است (Q5؛ تغییر هم‌زمان متن UI الزامی).
- **وضعیت: پیشنهاد** — تا تأیید صریح مالک، تصمیم تلقی نمی‌شود.

### 5.17.2 الزامات ایمنی پیاده‌سازی (مرحلهٔ C — مشروط به مجوز)

- اصلاح `reports.submit` و این job باید در همان انتشار باشند (§5.16).
- قفل + بازخوانی `status` داخل همان `Prisma.TransactionClient` (§5.16.2).
- پیش از ادعا، تمام شروط حفاظتی داخل قفل بازبینی شوند (§5.6 گام ۳).
- حذف باینری پس از commit و فقط با کلیدهای معتبر (`assertSafeStorageKey` — `storage.provider.ts:39-64`).
- شکست storage نباید metadata را زودهنگام حذف کند؛ retry به `clean-orphan-media` فاز ۱ واگذار شود (§5.7).
- **متغیر مستقل فعال‌سازی، پیش‌فرض خاموش:** `JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED=false` (جدای از `JOBS_ENABLED`؛ باید به §5.11 افزوده شود).
- **حالت dry-run:** `JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN=true` (پیش‌فرض rollout) — فقط شمارش/گزارش «چه چیزی ادعا می‌شد»؛ هیچ soft-delete، حذف فایل یا تغییر وضعیتی انجام نمی‌دهد.
- بدون تغییر غیرضروری در API عمومی / OpenAPI / قرارداد frozen.

### 5.17.3 روش rollout کنترل‌شده

- گام ۱ (dry-run): `ENABLED=false, DRY_RUN=true` → گزارش eligible/purged خیالی.
- گام ۲ (خاموش + متد مستقیم): `ENABLED=false` → متد public فقط برای تست دستی/CI.
- گام ۳ (روشن تدریجی): `ENABLED=true` با batch کوچک و مانیتور `claimed/purged/storage_failed`.
- در همهٔ حالت‌ها، hard-delete نهایی ردیف با مهلت ۷ روزهٔ `clean-orphan-media` انجام می‌شود.

### 5.17.4 ماتریس آزمون الزامی (مرحلهٔ D — طراحی و اجرا شده)

دو اتصال مستقل PostgreSQL + storage آزمایشی (تزریق `now`/barrier برای ترتیب):

1. ثبت گزارش پیش از ادعای job → تصاویر حفظ می‌شوند.
2. ادعای job پیش از گزارش → گزارش `status=ARCHIVED` را می‌بیند و طبق §110 رد می‌شود.
3. رقابت job با `renew`/`restore`.
4. شکست بین commit ادعا و حذف فایل → بازیابی توسط `clean-orphan-media`.
5. حذف ناقص چند فایل → metadata تا حذف موفق همهٔ اشیاء حفظ شود.
6. اجرای تکراری و دو worker هم‌زمان → idempotent / یک برنده.
7. بررسی نهایی هم‌زمان `Listing.status` / `Report.status` / `ListingImage.deletedAt` + وجود واقعی فایل‌ها در storage.

**وضعیت:** هر ۷ سناریو پیاده‌سازی و در فازهای ۲–۴ با پایگاه PostgreSQL آزمایشی و storage موقت اجرا شدند؛ نتایج واقعی در §5.19 ثبت است.

### جمع‌بندی (v6)
این job فقط چرخهٔ عمر فایل تصویری آگهی بایگانی‌شده را مدیریت می‌کند. اصلاح کلیدی v2: **«ادعای اتمی» (soft-delete در تراکنش قفل‌شده با `SELECT ... FOR UPDATE`) پیش از حذف باینری**، که race با `renew`/`restore` را می‌بندد؛ حذف باینری best-effort و reconcile‌شونده توسط `clean-orphan-media` است. **بدون تغییر schema/migration برای رویکرد اصلی** (فقط دو env جدید + job جدید + ایندکس اختیاری). هیچ آگهی‌ای حذف نمی‌شود؛ شواهد متنی/نظارتی حفظ ولی **باینری تصویر** از بین می‌رود (تصمیم Q8). این سند مجوز اجرای عملیات destructive نیست.
## 5.18 وضعیت اجرا (v7 — پیاده‌سازی انجام شد؛ حالت مخرب فعال نیست)

- **محیط کار:** worktree مستقل `feature/archived-image-retention` از commit `ea1ff5e`.
- **انجام‌شده:** اصلاح اتمیک `reports.submit` (قفل `FOR UPDATE` + بازخوانی + درج در یک تراکنش)؛ job جدید `clean-archived-listing-images` (batch صرفاً‌خواندنی + ادعای اتمی per-listing + حذف per-key پس از commit + واگذاری retry به `clean-orphan-media`)؛ ۴ متغیر env جدید با پیش‌فرض `ENABLED=false`/`DRY_RUN=true`؛ متن UI بازنشر اصلاح شد.
- **اعتبارسنجی:** `typecheck` = ۰ خطا؛ `build` موفق؛ `lint` = ۹ خطای از پیش موجود (هیچ‌کدام در فایل‌های این تغییر نیستند).
- **نقص پیشین کشف‌شده (blocker برای build تمیز):** دایرکتوری `apps/api/src/providers/storage` توسط الگوی `storage/` در `.gitignore` نادیده گرفته شده و در commit نیست؛ checkout تمیزِ `ea1ff5e` این ماژول را ندارد. اصلاح واقعی نیازمند commit این فایل‌هاست (خارج از این وظیفهٔ بدون‌commit).
- **تست‌ها:** در فازهای ۲–۴ اجرا و سبز شدند؛ جزئیات و تمایز «اجرا‌شده در فاز قبل» در برابر «بازبینی نهایی» در §5.19 آمده است.
- **هیچ** job، داده یا فایل واقعی پاک/اجرا نشد؛ migration ایجاد/اجرا نشد؛ API/OpenAPI تغییری نکرد.

## 5.19 نتایج آزمون و بازبینی نهایی (v8)

نتایج واقعی — اجرا‌شده در فازهای ۲–۴ با پایگاه PostgreSQL آزمایشی `weshbazar_test` و storage موقت (هیچ job تولیدی یا عملیات مخرب اجرا نشد):

- Backend integration: **۳۰/۳۰ سبز** (۶ suite؛ شامل ۵ suite مرتبط با این job به‌علاوهٔ `database.integration-spec.ts` پیش‌موجود).
- Storage provider unit: **۱۹/۱۹ سبز** (`local-storage.provider.spec.ts`).
- Frontend UI: **۷/۷ سبز** (`listing-manage-card.test.tsx`).
- API `typecheck` / `build`: exit 0.
- Frontend `typecheck` / `lint` / `build`: exit 0.
- API `lint`: exit 1 با ۹ خطای از پیش موجود که در بازبینی نهایی مستقیماً در برابر commit پایهٔ `ea1ff5e` تأیید شد (بدون هیچ خطای جدید).

تمایز شفاف: اعداد بالا در فازهای قبل (۲–۴) اجرا شدند؛ بازبینیِ نهایی (Code Review) فقط `lint` و بازرسی read-only را مستقیماً دوباره اجرا کرد و **کل مجموعهٔ آزمون‌ها دوباره اجرا نشد**.