# WeshBazar API Contract Freeze v1 — Product Requirements Document

## Overview
- **Summary**: تبدیل Backend موجود WeshBazar به یک API قراردادی دقیق، پایدار، قابل تست و قابل مصرف توسط Frontend Next.js/TypeScript؛ شامل audit کامل شکاف‌ها، رفع ناهماهنگی‌ها، تولید مستندات نهایی OpenAPI و مستند handoff Frontend.
- **Purpose**: ایجاد یک مرجع حقیقت واحد و machine-readable برای API v1 به طوری که تیم Frontend بتواند بدون هیچ حدسی، کاملاً مبتنی بر OpenAPI منتشرشده و تست‌شده عمل کند. این مرحله "Contract Freeze" است؛ پس از آن هیچ endpoint و response fieldی توسط Frontend اختراع نمی‌شود.
- **Target Users**: Senior Frontend Engineer (Next.js/TS)، API Client Generator، توسعه‌دهندگان بعدی پروژه و Reviewerهای معماری.

## Goals
- ساخت سند audit شکاف (`/docs/api-contract-audit.md`) که implementation واقعی را با API Contract Master v1 هم‌تراز کند.
- اطمینان از اینکه تمام endpointها، DTOها، enumها، error codeها و pagination/filter grammar با implementation واقعی سازگار هستند.
- تولید artifact ماشین‌خوان OpenAPI (`/docs/openapi.json`) که از SwaggerModule تولید و در repository commit می‌شود.
- ساخت CI test برای جلوگیری از drift بین OpenAPI تولیدی و source.
- تهیه مستند handoff Frontend (`/docs/frontend-api-contract.md`) و نقشه خطاها (`/docs/frontend-error-map.md`).
- اطمینان از اینکه هیچ‌کدام از قوانین §0-§220 (مانند عدم تخلیه Prisma مستقیم، envelope یکدست، RBAC 3 سطحی، Audit Log append-only) نقض نشده‌اند.

## Non-Goals
- بازنویسی معماری NestJS یا تغییر Modular Monolith به میکروسرویس.
- تغییر Prisma schema بی‌دلیل یا ساخت migration جدید بدون دلیل محصولی.
- پیاده‌سازی Payment، Shipping، Chat، Recommendation، Redis، Kafka، Elasticsearch یا موارد خارج از Scope مستند اصلی.
- تغییر نام endpointهای سالم فقط برای سلیقه.
- انتقال Business Logic به لایه Controller (مطابق §95 حفظ می‌شود).
- تضعیف security برای راحتی Frontend.

## Background & Context
- Backend فعلی NestJS 12 + Fastify 5 + TypeScript 6 + Prisma 7 + PostgreSQL 17 است.
- Global Prefix: `/api/v1` — Health خارج از prefix: `/health/live`, `/health/ready`.
- Response Envelope: `{ success: true, data, meta?, requestId }` | `{ success: false, error: { code, message, details? }, requestId }`.
- Auth: short-lived JWT access token (Bearer) + HttpOnly Secure refresh cookie (refresh rotation + reuse detection + revocable sessions).
- 21 Controller با حدود 80 endpoint فعال: Auth, Users, Sellers, Categories, Locations, Listings (Discovery/Management/Me), Media, Favorites, Reports, Contacts, Admin (Listings/Reports/Users), Audit, Analytics, Health.
- 3 سطح RBAC: USER / MODERATOR / ADMIN با Permission-based guard تکمیلی.
- Error catalog حاوی 80+ error code با HTTP status مشخص.
- 187 Unit Test + 7 Integration Test + 250 E2E Test گزارش‌شده در فاز قبل.
- Image Pipeline: Magic-byte detection + pixel limit + re-encode (EXIF strip) + 3 variant (thumbnail/medium/large WebP).
- UUID primary keys برای تمام entityهای عمومی؛ slug برای URLهای انسانی.
- Listing State Machine: DRAFT → PENDING_REVIEW → ACTIVE → SOLD/ARCHIVED + REJECTED.

## Functional Requirements

### FR-1: API Contract Audit Gap Matrix
- داکیومنت `/docs/api-contract-audit.md` شامل جدول Area|Expected|Actual|Gap|Decision|Files|Tests برای حداقل این حوزه‌ها بسازد: Auth, Listings, Search, Media, Favorites, Reports, Contact, Admin, OpenAPI, CORS/Cookies, Envelope/Errors, Pagination/Filter.

### FR-2: Endpoint Inventory & Canonical Path Alignment
- تمام endpointهای فعال را با canonical paths مستند §23,31,38,46,49,61,73,76,87 هم‌راستا کن.
- در صورت عدم تطابق غیرضروری، backward compatibility را حفظ کن یا نام‌گذاری را یکدست کن.
- `GET /api/v1/me` برای current user و `GET /api/v1/sellers/:slug` برای seller profile public مطابق §31,37 وجود داشته باشد.

### FR-3: OpenAPI Artifact Generation & Drift Guard
- `/docs/openapi.json` (یا yaml) را به صورت machine-readable از SwaggerModule تولید و در مخزن commit کن.
- OpenAPI دارای: title, version, servers, tags, security schemes (Bearer + Cookie), operationIdهای یکتا (camelCase، codegen-friendly)، request/response schemas کامل، exampleها برای endpointهای مهم باشد.
- یک CI test بساز که: generation موفق را تضمین کند؛ operationId های one-to-one را بررسی کند؛ no broken refs را اثبات کند؛ و schemaهای موردنیاز را در خود داشته باشد.

### FR-4: Frontend Handoff Documents
- `/docs/frontend-api-contract.md` بساز که شامل: base URL، local setup، auth flow (access/refresh/cookie)، CORS، common headers، envelope، error envelope، error map، listing APIs، search grammar، pagination، categories، filter schema، locations، seller، favorites، reports، contacts، media، account، admin، OpenAPI location، generation commands، known limitations.
- جدول نهایی Operation ID | Method | Path | Auth | Role | Request | Response | Errors برای تمام endpointها.
- جدول Capability Matrix (Anonymous/Auth User/Moderator/Admin) و جدول Listing State Matrix.
- `/docs/frontend-error-map.md` شامل mapping error code به UI action و محلی‌سازی.

### FR-5: OpenAPI Completeness & Correctness
- هر endpoint دارای: `@ApiTags`, `@ApiOperation(summary)`, `@ApiResponse` برای statusهای مهم (200/201/204, 400/401/403/404/409/422/429, 500/503), و در صورت نیاز `@ApiBearerAuth`.
- Multipart endpoint (`POST /listings/:id/images`) دارای `multipart/form-data` declaration، field name، max size، accepted mime types، max files باشد.
- Security schemes: `access-token` (Bearer JWT) و در صورت امکان cookie scheme.
- OperationIdها یکتا و stable و مطابق الگو `listListings`, `getListingBySlug`, `createListing`, `submitListing`, `markListingSold` باشند.

### FR-6: Validation / Field-level Error Contract
- فرم field-level errors مطابق §67 freeze شود؛ در صورت عدم تطابق با implementation واقعی، mapping آن را مستند کن.
- Validation pipe باید details.field errors را به صورت machine-readable برگرداند.

### FR-7: Contract Test Coverage Evidence
- برای تمام endpointهای مهم Matrix E2E موجود را بررسی و ثبت کن (§123-§132): Auth, Listing, Search, Media, Favorite, Contact, Report, Admin, Security.
- در صورت وجود gap قابل‌توجه، نتیجه را در audit ثبت کن (تغییرات implementation فقط در صورت نیاز محصولی انجام شود).

## Non-Functional Requirements

### NFR-1: Layer Boundary (§95 Constraint)
- هیچ‌یک از Controllerها مستقیماً `@prisma/client` یا `PrismaService` را import نمی‌کنند. تمام داده‌ها از طریق Service و Presentation/Presenter layer عبور می‌کنند.

### NFR-2: No Raw Entity Exposure
- هیچ Prisma model مستقیم در response Frontend وجود ندارد؛ Presenter DTOها هم‌زمان mapping و redaction انجام می‌دهند (passwordHash، sessions، moderation metadata، audit secrets هرگز خارج نمی‌شوند).

### NFR-3: Stability & Backward Compatibility
- هیچ endpoint، field، enum value و error code فعلی بدون دلیل محصولی حذف یا نام غیر‌قابل پیش‌بینی نمی‌گیرد.
- ترجیحاً additive change.

### NFR-4: No Prisma/SQL Leakage
- Error responseها حاوی stack trace، Prisma error code خام یا SQL نیستند (exception filter این را تضمین می‌کند).

### NFR-5: Audit Log Append-Only
- AuditLog همچنان append-only بماند و برای Admin API readonly باشد.

### NFR-6: OpenAPI Security Declaration Correctness
- Public endpointها دارای security: [] یا annotation `@Public` باشند.
- Protected endpointها دارای `@ApiBearerAuth` و در صورت نیاز `@ApiCookieAuth` باشند.
- Admin endpointها دارای RBAC declaration واضح باشند.

### NFR-7: Quality Gate Compliance
- بعد از اعمال هر تغییزی: `lint`, `format:check`, `typecheck`, unit test, integration test, e2e test باید green بمانند.

## Constraints
- **Technical**: Node.js 24؛ PostgreSQL 17-alpine؛ NestJS 12 + Fastify 5؛ Prisma 7؛ REST JSON + Multipart؛ OpenAPI 3.x؛ UUID PKs؛ Decimal به صورت string/number serial شود؛ ISO 8601 UTC timestamps؛ IDOR/rate-limit/CSRF policy حفظ شود.
- **Business**: فقط AFN برای MVP؛ public listing discovery فقط ACTIVE به جز policy؛ anonymous browse/search/contact مجاز است؛ favorites/reports/seller ops نیازمند auth هستند.
- **Dependencies**: NestJS Swagger (Nestia/Redocly بدون نیاز)، Jest + Supertest برای E2E، Zod برای env schema.

## Assumptions
- ساختار فعلی NestJS module (apps/api + prisma در repo root) حفظ می‌شود.
- Storage provider فعلی `local` است؛ Public URLها از `PUBLIC_STORAGE_BASE_URL` ساخته می‌شوند و future S3-compatible به contract public آسیب نمی‌زند.
- Refresh Cookie Name canonical: `weshbazar_refresh` (با env قابل تغییر) در داکیومنت ثبت می‌شود.
- Search backend فعلی PostgreSQL + pg_trgm است و این در contract public آشکار نمی‌شود.
- Filter grammar فعلی discovery (ram:gte:8 / storage:in:128,256) حفظ می‌شود و مستند می‌شود.

## Open Questions
- [ ] آیا artifact OpenAPI باید JSON باشد یا YAML؟ (پیشنهاد: JSON چون Nest `JSON.stringify` مستقیم می‌دهد و برای code generator ورودی استانداردتر است)
- [ ] آیا OpenAPI را در CI به‌صورت auto-regenerate + diff compare نگه می‌داریم یا فقط یک test صحت تولید را بررسی می‌کند؟ (پیشنهاد: test صحت تولید + در صورت نیاز artifact generation به صورت manual یک‌بار در پایان این فاز)
- [ ] آیا نیاز به `@ApiCookieAuth` برای refresh در Swagger UI داریم یا Bearer برای auth endpoints کافی است؟ (پیشنهاد: هر دو را اعلام کنیم اما access-token به عنوان primary)

## Acceptance Criteria

### AC-1: Audit Document Exists & Comprehensive
- **Type**: `rule`
- **Given**: Implementation فعلی در `weshbazar-backend` و API Contract Master v1
- **When**: `/docs/api-contract-audit.md` ساخته و تکمیل شود
- **Then**: فایل حاوی حداقل 9 جدول Area (Auth, Listings, Search, Media, Favorites, Reports, Contact, Admin, OpenAPI) + ستون‌های Expected/Actual/Gap/Decision/Files/Tests باشد و برای هر ردیف حداقل یکی از "Match" یا "Gap + Decision" ثبت شده باشد.
- **Pass Condition**: `Test-Path "c:\Users\AYDIN\Desktop\WeshBazar\weshbazar-backend\docs\api-contract-audit.md"` برگرداند `$true` و grep حداقل 9 Area در جدول موجود باشد.
- **Evidence**: Read file + line count + spot-check 3 area (Auth, Listings, OpenAPI).

### AC-2: OpenAPI Artifact Committed & Valid
- **Type**: `rule`
- **Given**: NestJS app با SwaggerModule فعال
- **When**: یک script/CI step OpenAPI JSON تولید کند و در `/docs/openapi.json` ذخیره کند
- **Then**: artifact parse شود، حاوی `openapi: 3.x` + `info.title = "WeshBazar API"` + `paths` non-empty + حداقل 60 operation + تمام operationIdها منحصر‌به‌فرد + هرچند schema اصلی (Listing, User, Error) تعریف شده باشند.
- **Pass Condition**: `node -e "JSON.parse(require('fs').readFileSync('...openapi.json','utf8'))"` بدون خطا و `Object.keys(paths).length >= 50` و `new Set(operationIds).size === operationIds.length`.
- **Evidence**: JSON parse + sanity script stdout.

### AC-3: OpenAPI Drift Test / Verification Step
- **Type**: `rule`
- **Given**: build/test pipeline
- **When**: `npm run test` (یا dedicated test file) اجرا شود
- **Then**: حداقل یک test وجود داشته باشد که صحت تولید OpenAPI (success parse، operationIds unique، no $ref broken) را بررسی کند یا یک اسکریپت سمت repository این کار را انجام دهد و در CI قابل اجرا باشد.
- **Pass Condition**: حداقل یک spec test یا helper script وجود داشته باشد و اجرا شود (پاس/شکست به معنای وجود خودش نیست؛ بلکه وجود و اجرا آن است).
- **Evidence**: Glob برای test فایل openapi/drift + grep نام test در Jest output.

### AC-4: Frontend Handoff Documents Exist
- **Type**: `rule`
- **Given**: تمام audit و OpenAPI نهایی‌شده
- **When**: `/docs/frontend-api-contract.md` و `/docs/frontend-error-map.md` ساخته شوند
- **Then**:
  - `frontend-api-contract.md` شامل: base URL, auth flow, cookies, CORS, common headers, response envelope, error envelope, listing APIs, search grammar, pagination, categories, filter schema, locations, seller, favorites, reports, contacts, media, account, admin, OpenAPI location + جدول Operation ID کل و جدول Capability Matrix + Listing State Matrix باشد.
  - `frontend-error-map.md` شامل حداقل mapping برای 20 error code پرکاربرد (AUTH, LISTING, VALIDATION, RATE, FAVORITE, REPORT, MEDIA, USER) به پیشنهاد UI action و retryability باشد.
- **Pass Condition**: هر دو فایل وجود داشته باشند و grep عنوان‌های بالا در هر کدام برگرداند true.
- **Evidence**: Read 2 فایل + grep بخش‌های موردنیاز.

### AC-5: OpenAPI Operation Naming & Tags Consistent
- **Type**: `rule`
- **Given**: Generated OpenAPI JSON
- **When**: تمام operation ها اسکن شوند
- **Then**: هر `operationId` یکتا باشد؛ از naming verbNoun استفاده کند؛ و هر operation دارای `tags` non-empty از مجموعه: Auth, Users, Sellers, Categories, Locations, Listings, Media, Favorites, Reports, Admin, Analytics, Audit, Health باشد.
- **Pass Condition**: Set of `operationId` برابر `length` collection؛ هیچ `operationId` empty و هیچ `tags` empty ندارد.
- **Evidence**: Sanity check بر روی OpenAPI artifact.

### AC-6: Controller Layer Boundary (§95)
- **Type**: `rule`
- **Given**: تمام فایل‌های `*.controller.ts`
- **When**: Grep برای import of `@prisma/client` یا `PrismaService` در controllerها
- **Then**: هیچ Controllerی مستقیماً Prisma را import نکند.
- **Pass Condition**: `rg -l "from ['\"]@prisma/client" apps/api/src/modules/**/*.controller.ts` خالی باشد.
- **Evidence**: Grep output stdout.

### AC-7: No Raw Prisma Entity Exposure
- **Type**: `rubric`
- **Dimension**: میزان حضور مستقیم فیلدهای حساس Prisma در Presenter DTO یا Controller return
- **Scale**: 1-5
- **Anchors**: 1 = حداقل یک فایل `passwordHash` یا `refreshSessions` در خروجی public /me/listings وجود دارد؛ 3 = فیلدهای حساس نیستند اما برخی internal IDs یا moderation fieldها expose شده‌اند؛ 5 = تمام Presenterها صریحاً mapping می‌کنند و هیچ فیلد حساسی (passwordHash, session, rejection internal, audit raw) در DTO public/private نیست.
- **Pass Threshold**: >= 4
- **Evidence**: grep در 5 presenter برای کلیدهای ممنوعه + spot-check 2 DTO class.

### AC-8: Enum Consistency Across Backend/DTO/OpenAPI
- **Type**: `rule`
- **Given**: Prisma enums (UserRole, UserStatus, ListingStatus, PricingType, ListingCondition, ListingContactType, ReportReason, ReportStatus, AttributeType) و DTOs و generated OpenAPI
- **When**: 8 enum core مقایسه شوند
- **Then**: همه مقادیر enum در DTO و Swagger با Prisma enum مطابقت داشته باشند و موردی مانند camelCase/snake_case mismatch وجود نداشته باشد.
- **Pass Condition**: برای حداقل 6 enum از 8، تمام values در 3 لایه یکسان باشند (نام 100% match).
- **Evidence**: grep enum names + diff در 3 فایل نمونه.

### AC-9: Error Code Catalog Completeness & Stability
- **Type**: `rule`
- **Given**: `error-codes.ts` و exception filter
- **When**: تمام error codes موردنیاز مستند §106 (AUTH, OTP, USER, CATEGORY, LOCATION, LISTING, IMAGE, FAVORITE, REPORT, MODERATION, RATE, PAYLOAD prefix) اسکن شوند
- **Then**: حداقل presence of codes برای هرگروه ثبت شود؛ نمانده‌ای از هر گروه در catalog وجود داشته باشد (مثلاً AUTH_* یا INVALID_CREDENTIALS/TOKEN_EXPIRED/REFRESH_TOKEN_*).
- **Pass Condition**: حداقل 70% از prefix groupهای بالا حداقل یک error code فعال در catalog داشته باشند.
- **Evidence**: grep regex روی catalog.

### AC-10: Quality Gates Remain Green
- **Type**: `rule`
- **Given**: Repo با تمام تغییرات اعمال‌شده
- **When**: این دستورات اجرا شوند:
  - `cd weshbazar-backend\apps\api ; npm run typecheck`
  - `cd weshbazar-backend\apps\api ; npm run lint` (یا root-level `npm run lint` در صورت وجود)
  - `cd weshbazar-backend\apps\api ; npm run test -- --passWithNoTests`
  - (اختیاری) e2e در صورت environment آماده
- **Then**: typecheck و lint و unit tests بدون خطا شوند.
- **Pass Condition**: exit code 0 برای هر 3.
- **Evidence**: command exit codes و stdout بخش پایانی.

### AC-11: Cookie & CORS Contract Documented
- **Type**: `rule`
- **Given**: env.schema (COOKIE_*, CORS_*) و bootstrap.ts
- **When**: frontend-api-contract.md + audit.md ساخته شوند
- **Then**: cookie contract (Name=weshbazar_refresh, HttpOnly, Secure in prod, SameSite, Path=/api/v1/auth, Max-Age/Expires per session) مستند شود؛ CORS (Allow-Credentials: true, no wildcard in prod) مستند شود.
- **Pass Condition**: هر دو بخش در frontend-api-contract.md پیدا شود.
- **Evidence**: grep بخش Cookie Contract و CORS Contract در فایل handoff.

### AC-12: Error Envelope & Response Envelope Consistency
- **Type**: `rule`
- **Given**: global exception filter + response interceptor
- **When**: یک E2E نمونه برای success و failure اجرا شود (یا از تست‌های موجود sample بگیریم)
- **Then**: success دارای `{ success:true, data, requestId }`؛ failure دارای `{ success:false, error:{ code, message, details? }, requestId }` باشد.
- **Pass Condition**: یک نمونه response از تست E2E یا یک fixture هر دو فرم را داشته باشد.
- **Evidence**: grep envelope keyها در output e2e یا فایل‌های Jest snapshot.
