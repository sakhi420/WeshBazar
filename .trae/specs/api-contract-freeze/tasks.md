# WeshBazar API Contract Freeze v1 — Implementation Plan

## Task 1: Build API Contract Audit Matrix (Gap Document)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - ساخت `/docs/api-contract-audit.md` در `weshbazar-backend/docs/` با بررسی کامل implementation فعلی در برابر مستند API Contract Master v1 (§0-§220).
  - جدول 9 گانه Area: Auth, Listings, Search, Media, Favorites, Reports, Contact, Admin, OpenAPI + ستون‌های Expected/Actual/Gap/Decision/Files/Tests.
  - همچنین بخش‌های CORS/Cookie، Envelope/Errors، Pagination/Filter را در همان audit (یا به عنوان areas اضافی) ثبت کن.
  - برای هر Area، endpoint inventory، DTO shape، enum/error codes، و behaviorهای کلیدی را مقایسه کن.
  - تصمیم‌گیری نهایی برای هر Gap: رفع (code change) یا مستند کردن (documented deviation) یا No-Op (تطابق کامل).
- **Acceptance Criteria Addressed**: AC-1, AC-6, AC-8, AC-9, AC-11
- **Test Requirements**:
  - `rule` TR-1.1: فایل audit در مسیر درست وجود دارد و حداقل 9 Area table دارد؛ spot-check 3 ستون (Expected/Actual/Decision) برای Auth, Listings, OpenAPI non-empty باشند. **Evidence**: Read + grep "| Auth |", "| Listings |", "| OpenAPI |".
  - `rule` TR-1.2: بخش CORS/Cookie در audit یا در یکی از Areaها ثبت شده و نام cookie canonical و SameSite/Secure policy ذکر شده باشد. **Evidence**: grep "weshbazar_refresh" یا "REFRESH_COOKIE_NAME" در audit.md.
  - `rule` TR-1.3: Controller imports برای Prisma بررسی و نتیجه در Area ثبت شود. **Evidence**: بخشی از audit که §95 را assert می‌کند.
- **Notes**: Audit باید توسط یک سری grep/exploration پشتیبانی شود نه صرفاً حدس.

## Task 2: Swagger/OpenAPI Decorator Audit & Enhancement
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1 (برای شناسایی gaps)
- **Description**:
  - بررسی تمام 21 Controller و 80+ endpoint برای وجود `@ApiTags`, `@ApiOperation`, `@ApiOkResponse/@ApiCreatedResponse/@ApiNoContentResponse`, `@ApiBearerAuth`.
  - اطمینان از اینکه همه DTOها دارای `@ApiProperty` با required/nullable, type, enum, example مناسب هستند.
  - بررسی اینکه operationId در `@ApiOperation({ operationId: 'xxx' })` تنظیم شده باشد. در صورت تنظیم نبودن، یک نام استاندارد اختصاص بده (مثلاً `listListings`, `getListingBySlug`, `createListingDraft`, `submitListingForReview`, `markListingSold`, `archiveListing`, `renewListing`, `getSellerProfileBySlug`, `getCurrentUser`, ...).
  - Multipart endpoint `POST /listings/:id/images` را با `@ApiConsumes('multipart/form-data')` و `@ApiBody` schema برای file field تکمیل کن.
  - Cookie auth: در صورت تمایل یک `ApiCookieAuth` برای refresh در `DocumentBuilder` اضافه کن (اختیاری).
- **Acceptance Criteria Addressed**: AC-5, FR-5, NFR-6
- **Test Requirements**:
  - `rule` TR-2.1: حداقل 90% از endpointها دارای `@ApiOperation` باشند. **Evidence**: grep "@ApiOperation\(" روی 21 controller و نسبت به تعداد routeها.
  - `rule` TR-2.2: همه 21 controller حداقل یک `@ApiTags(...)` فعال دارند. **Evidence**: grep "controller.ts" و "@ApiTags\(" پوشش داده شود.
  - `rubric` TR-2.3: کیفیت operationIdها (نام‌گذاری یکدست، verbNoun، یکتایی)؛ مقیاس 1-5؛ 1=تقریباً هیچ کدام؛ 3=بیشتر endpointها اما نام‌گذاری متنوع؛ 5=همه یکا، پایدار، codegen-friendly؛ آستانه >=4. **Evidence**: list of operationIds از generated OpenAPI و بررسی uniqueness + نام‌گذاری.
- **Notes**: هیچ endpoint را فقط برای تغییر operationId حذف/تغییر مسیر نده. فقط decorator را اضافه/اصلاح کن.

## Task 3: Generate OpenAPI Artifact (/docs/openapi.json)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - یک اسکریپت standalone بساز (مثلاً `apps/api/scripts/generate-openapi.ts` یا یک route test) که Nest app را بسازد و `SwaggerModule.createDocument` را بدون HTTP server اجرا کند و JSON خروجی را در `weshbazar-backend/docs/openapi.json` ذخیره کند.
  - اسکریپت باید `validateEnv` را انجام دهد و `AppModule` را با Config واقعی بوت کند (بدون نیاز به DB در حالت ایده‌آل؛ اما در صورت نیاز با mock برای minimal case یا صرفاً bootstrap Nest module) یا یک `bootstrap-swagger.ts` جدا بساز.
  - خروجی JSON را زیبا‌سازی (prettify) کن تا diff در PR خوانا باشد.
  - در یک run واقعی artifact را تولید و commit کن.
- **Acceptance Criteria Addressed**: AC-2, AC-5
- **Test Requirements**:
  - `rule` TR-3.1: `node dist/scripts/generate-openapi.js` (یا ts-node / tsx) اجرا شود و exit code 0 داشته باشد و فایل `docs/openapi.json` تولید شود. **Evidence**: command exit + file size > 20KB.
  - `rule` TR-3.2: JSON parse succeeds؛ `$.openapi` شروع شود با `3.`؛ `$.info.title == "WeshBazar API"`؛ `Object.keys($.paths).length >= 50`؛ و operationIdها یکتا باشند. **Evidence**: sanity script stdout.
- **Notes**: ترجیحاً از build artifact استفاده کن اما اگر سریع‌تر بود، با `ts-node` یا `tsx` مستقیم اجرا کن.

## Task 4: OpenAPI Drift/Validation Test
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 3
- **Description**:
  - یک Jest spec (مثلاً `apps/api/src/common/openapi/openapi.spec.ts` یا در `test/e2e/openapi.e2e-spec.ts`) بساز که:
    1. Nest app را می‌سازد.
    2. Swagger document را generate می‌کند.
    3. معتبر است که parse می‌شود.
    4. operationIdها one-to-one و منحصر‌به‌فرد هستند.
    5. هیچ `$ref` شکسته‌ای در schemas وجود ندارد (بررسی presence حداقل schemaهای اصلی).
  - در صورت تمایل، یک step بسیار سبک‌تر: یک اسکریپت `check-openapi` در package.json که فقط validation ساده انجام دهد.
  - این را به CI script یا README مستند کن (نه لزوماً وارد CI فعلی بعد از تأیید).
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-4.1: فایل تست وجود دارد و می‌تواند اجرا شود (`jest --listTests` این را نشان می‌دهد). **Evidence**: Glob + Jest list output.
  - `rule` TR-4.2: اجرای تست green باشد و حداقل assertion مربوط به uniqueness operationId را داشته باشد. **Evidence**: Jest output "PASS" + توضیحات.
- **Notes**: اگر این تسک مستقل برای Scope فوری زیاد است، حداقل یک helper validation ساده به عنوان اسکریپت `scripts/validate-openapi.mjs` بساز.

## Task 5: Build Frontend Error Map Document
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1, Task 2
- **Description**:
  - ساخت `/docs/frontend-error-map.md` در `weshbazar-backend/docs/`.
  - برای حداقل 20 error code پرکاربرد از گروه‌های AUTH, OTP, USER, CATEGORY, LOCATION, LISTING, IMAGE, FAVORITE, REPORT, MODERATION, RATE, VALIDATION/PAYLOAD:
    - کد (code)
    - HTTP status
    - معنای user-safe
    - اقدام پیشنهادی Frontend (نمایش toast، نمایش خطا روی فیلد، رفتار به login page، retry با delay، refresh و دوباره تلاش، conflict resolution UI)
    - آیا قابل retry است؟ (retryable boolean)
    - آیا field-level است؟
  - grouping منطقی بخش‌ها.
- **Acceptance Criteria Addressed**: AC-4 (بخش error map), FR-4
- **Test Requirements**:
  - `rule` TR-5.1: فایل وجود دارد و حداقل 20 mapping ثبت شده باشد. **Evidence**: grep "### " یا "| " در فایل و شمارش سطرها.
  - `rule` TR-5.2: حداقل 3 گروه (AUTH, LISTING, RATE) پوشش داده شوند. **Evidence**: grep عنوان گروه‌ها.
- **Notes**: مستقیم از ERROR_CATALOG در `error-codes.ts` برداشت کن؛ هیچ کد جدیدی اختراع نکن.

## Task 6: Build Frontend API Contract (Handoff Document)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1, Task 2, Task 3, Task 5
- **Description**:
  - ساخت `/docs/frontend-api-contract.md` در `weshbazar-backend/docs/`.
  - شامل این بخش‌ها (مطابق §216, §217, §218, §219, §220):
    1. Base URL + Versioning + Health URLs + Local Setup (how to run backend, default port, env example)
    2. Authentication & Session Flow (access token format, refresh cookie contract, `/auth/refresh`, `/auth/logout`, `/auth/logout-all`, sessions list/revoke)
    3. Cookie Contract: name, HttpOnly, Secure, SameSite, Path, Domain, Max-Age
    4. CORS & Credentials (credentials: include در fetch)
    5. Common Headers (Authorization, Content-Type, Accept, X-Request-ID)
    6. Response Envelope & Error Envelope (with examples)
    7. Listing APIs (cards, detail, management, lifecycle commands)
    8. Search Grammar (q, category, province, city, minPrice, maxPrice, condition, sort, cursor, limit, dynamic filter `key:op:value` و grammar پیشنهادی)
    9. Pagination (cursor vs admin page/limit + meta shape)
    10. Categories + Tree + Filter Schema
    11. Locations (provinces/cities)
    12. Seller profile public
    13. Favorites, Reports, Contacts
    14. Media (upload, ordering, delete, variants)
    15. Account (me, patch me, change/reset password, change phone)
    16. Admin overview (namespace, roles)
    17. OpenAPI artifact location + generation command
    18. جدول Operation ID | Method | Path | Auth | Role | Request DTO | Response DTO | Known Errors (برای 60+ endpoint)
    19. جدول Capability Matrix (Anonymous / Auth User / Moderator / Admin)
    20. جدول Listing State Matrix (DRAFT / PENDING_REVIEW / ACTIVE / REJECTED / SOLD / ARCHIVED در ستون‌های Public, Owner Edit, Submit, Admin Approve, Mark Sold, Archive)
    21. Known limitations
- **Acceptance Criteria Addressed**: AC-4, AC-11, FR-4
- **Test Requirements**:
  - `rule` TR-6.1: فایل وجود دارد و 18 بخش از 21 بالا را پوشش می‌دهد. **Evidence**: grep 18+ عنوان.
  - `rule` TR-6.2: جدول Operation ID شامل حداقل 50 endpoint فعال باشد. **Evidence**: grep سطرهای جدول.
  - `rule` TR-6.3: جدول Capability Matrix و جدول Listing State Matrix وجود داشته باشند. **Evidence**: grep 2 عنوان جدول.
- **Notes**: جدول endpointها از generated OpenAPI قابل‌استخراج است؛ اما حداقل بخش‌های manual باید نوشته شود.

## Task 7: Layer Boundary & Raw Exposure Sanity Audit + Small Fixes
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 1
- **Description**:
  - grep تمام `*.controller.ts` برای `from '@prisma/client'` یا `PrismaService` import و ثبت در audit در صورت وجود (باید none باشد). در صورت وجود، refactor به سرویس مناسب.
  - grep تمام presenter & DTO برای کلیدهای خطرناک: `passwordHash`, `tokenHash`, `revokedReason`, `rejectedReason` در صورتی که در DTO عمومی/خصوصی بدون redaction ظاهر شده‌اند. در صورت leak واقعی (باید none باشد)، mapping را اصلاح کن.
  - بررسی 3-4 endpoint برای پاسخ envelope: `{ success, data, requestId }` و `{ success, error: { code }, requestId }` از طریق E2E fixture یا اجرای یک تست تک.
- **Acceptance Criteria Addressed**: AC-6, AC-7, AC-12, NFR-1, NFR-2
- **Test Requirements**:
  - `rule` TR-7.1: هیچ کدام از 21 controller import مستقیم Prisma ندارند. **Evidence**: grep output خالی.
  - `rubric` TR-7.2: عدم حضور فیلدهای حساس در DTOها؛ مقیاس 1-5؛ آستانه >=4. **Evidence**: grep در 6 presenter + 4 DTO file برای کلیدهای ممنوعه.
  - `rule` TR-7.3: حداقل یک success و یک failure envelope در E2E یا تست واحد وجود دارد. **Evidence**: grep "success: true" و "success: false" در فایل‌های test.
- **Notes**: این تسک صرفاً Sanity Check + Fix کوچک. اگر مشکلی بزرگ باشد، Issue جدید ثبت شود.

## Task 8: Enum / Error Code Stability Checks & Documentation
- **Status**: `pending`
- **Priority**: low
- **Depends On**: Task 1, Task 5
- **Description**:
  - مقایسه 8 enum اصلی (UserRole, UserStatus, ListingStatus, PricingType, ListingCondition, ContactType, ReportReason, AttributeType) در 3 لایه: Prisma schema → TS DTO class-validator/Swagger enums → OpenAPI generated schemas.
  - هر mismatch نام یا مقدار را ثبت کن؛ در صورت نیاز DTO enum را با Prisma enum هم‌راستا کن.
  - در audit و frontend contract این enums را مستند کن (یک جدول تمام enum و مقادیر مجاز).
- **Acceptance Criteria Addressed**: AC-8, AC-9
- **Test Requirements**:
  - `rule` TR-8.1: حداقل 6 enum از 8، مقادیرشان در Prisma و DTO 100% match باشد. **Evidence**: 6 diff (Prisma/DTO) خالی.
  - `rule` TR-8.2: Error Catalog شامل حداقل 9 prefix group (AUTH, OTP, USER, CATEGORY, LOCATION, LISTING, IMAGE/ MEDIA, FAVORITE, REPORT) و یک کد از هر کدام وجود داشته باشد. **Evidence**: grep regex در catalog.
- **Notes**: به این تسک Quality Check می‌نامند؛ migration لازم نیست.

## Task 9: Quality Gates Verification (Typecheck / Lint / Test)
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 2,3,4,7,8
- **Description**:
  - اجرای `typecheck`, `lint`, `test` در `apps/api` یا root package.
  - ثبت خروجی و در صورت وجود خطا (مثلاً یک مورد خطای TypeScript در Swagger decorator)، رفع خطا.
  - اگر e2e نیاز به PostgreSQL دارد و در دسترس نیست، unit/integration را انجام بده و E2E را به عنوان "manual verification" مستند کن.
- **Acceptance Criteria Addressed**: AC-10, NFR-7
- **Test Requirements**:
  - `rule` TR-9.1: `npm run typecheck` exit code 0. **Evidence**: command output.
  - `rule` TR-9.2: `npm run lint` (یا معادل root) exit code 0. **Evidence**: command output.
  - `rule` TR-9.3: `npm run test` (Jest unit) exit code 0. **Evidence**: Jest terminal summary.
- **Notes**: این تسک **final gate** قبل از review است. هر تسک قبلی که باعث شکست quality gate می‌شود، در همین تسک رفع می‌شود.
