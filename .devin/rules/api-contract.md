# WeshBazar — API Contract Master Engineering Specification v1

> وضعیت: API Contract Freeze + Backend/API Audit + Frontend Readiness Contract
>
> محصول: WeshBazar — بازار C2C افغانستان برای کالاهای نو و دست‌دوم
>
> هدف این سند: تبدیل Backend موجود به یک API قراردادیِ دقیق، پایدار، قابل تست و قابل مصرف توسط Frontend Next.js/TypeScript؛ بدون بازنویسی بی‌دلیل معماری موجود.
>
> اصل مادر: **اول قرارداد واقعی و قابل اجرا، بعد Frontend.**

---

# 0. دستور مادر به Agent

تو به عنوان Senior API Architect، Backend Engineer، OpenAPI Engineer، Security Engineer و Contract-Test Engineer پروژه WeshBazar عمل می‌کنی.

این سند یک ایده آزاد نیست؛ قرارداد اجرای مرحله API است.

اما یک قاعده مهم داری:

```text
Existing repository
       ↓
Actual implementation
       ↓
Database/schema
       ↓
Tests
       ↓
Generated OpenAPI
       ↓
This contract
       ↓
Final frozen API
```

اگر بین این منابع اختلاف وجود داشت:

1. ابتدا اختلاف را دقیق پیدا کن.
2. مشخص کن اختلاف از implementation، database، OpenAPI یا specification است.
3. اگر requirement محصولی روشن است، implementation را با آن هماهنگ کن.
4. اگر requirement روشن نیست، ساده‌ترین انتخاب امن و قابل توسعه را انتخاب کن.
5. تصمیم را مستند کن.
6. تست اضافه کن.
7. OpenAPI را به‌روزرسانی کن.
8. تا زمانی که contract با implementation و tests هم‌خوان نشده، phase را موفق اعلام نکن.

هرگز برای هماهنگ کردن API با این سند:

```text
❌ پروژه را از صفر نساز
❌ Prisma schema را بی‌دلیل بازطراحی نکن
❌ migration بی‌دلیل نساز
❌ نام endpoint سالم را فقط به خاطر سلیقه تغییر نده
❌ business rule را به Controller منتقل نکن
❌ security را برای راحتی Frontend ضعیف نکن
❌ response را به خاطر راحتی یک component بیش از حد بزرگ نکن
❌ database entity را مستقیماً به Frontend expose نکن
```

هدف این مرحله ساخت یک **API Contract واقعی** است، نه ساخت دوباره Backend.

---

# 1. تصمیم معماری این مرحله

Backend فعلی همچنان باید:

```text
NestJS
+
Fastify
+
TypeScript
+
PostgreSQL
+
Prisma
+
REST
+
/api/v1
+
OpenAPI
```

باشد.

Modular Monolith باقی می‌ماند.

این مرحله فقط مرز ارتباطی زیر را تثبیت می‌کند:

```text
Next.js Frontend
       ↓
Typed API Client
       ↓
HTTP / JSON / Multipart
       ↓
WeshBazar API v1
       ↓
Application Services
       ↓
PostgreSQL / Storage / Providers
```

Frontend نباید بداند:

```text
Prisma model names
Database columns
RefreshSession tables
Internal moderation fields
Internal audit metadata
Storage filesystem paths
Raw provider internals
```

---

# 2. چرا این مرحله قبل از Frontend لازم است

Frontend Master آینده باید بتواند بدون حدس زدن درباره API ساخته شود.

Frontend باید از قبل بداند:

```text
چه endpointی وجود دارد
چه زمانی public است
چه زمانی authentication لازم است
چه body دارد
چه query دارد
چه response دارد
چه error دارد
چه fieldهایی nullable هستند
چه enumهایی داریم
pagination چگونه است
filter چگونه serialize می‌شود
image چگونه upload می‌شود
authentication چگونه حمل می‌شود
favorite state چگونه مشخص می‌شود
contact action چه چیزی برمی‌گرداند
dynamic attributes چگونه render می‌شوند
```

پس این مرحله یک **Contract Freeze** است.

---

# 3. منابع حقیقت نهایی

منابع حقیقت در WeshBazar:

```text
Database constraints
       ↓
Backend business rules
       ↓
API Contract
       ↓
Frontend presentation
```

اما برای Frontend، **OpenAPI منتشرشده و تست‌شده** باید مرجع مصرف HTTP باشد.

Database هرگز مستقیماً مرجع Frontend نیست.

---

# 4. Scope این مرحله

این مرحله باید همه موارد زیر را audit، اصلاح، مستند و test کند:

```text
API inventory
base URL
versioning
request IDs
HTTP semantics
response envelope
error envelope
validation errors
authentication
cookies
CORS
CSRF considerations
session refresh
logout
me/profile
seller profile
categories
category tree
category filter schema
locations
listings
listing cards
listing detail
listing lifecycle
seller listing management
search
filters
sorting
cursor pagination
media upload
media variants
favorites
reports
contact actions
analytics event semantics
admin APIs
RBAC
rate limits
cache semantics
conditional requests where useful
localization
date/time
money representation
nullable fields
enums
ID formats
slugs
OpenAPI metadata
operationIds
examples
security declarations
multipart declarations
contract tests
failure-path tests
security tests
frontend integration documentation
```

---

# 5. خارج از Scope

این مرحله نباید پیاده‌سازی کند:

```text
❌ payments
❌ checkout
❌ wallet
❌ escrow
❌ shipping
❌ logistics
❌ bidding
❌ auctions
❌ internal chat
❌ recommendations
❌ AI moderation
❌ Redis
❌ Kafka
❌ RabbitMQ
❌ Elasticsearch/OpenSearch
❌ microservices
❌ mobile app
❌ business storefront
❌ reviews/ratings
```

فقط extension pointهای فعلی را خراب نکن.

---

# 6. وضعیت موجود Backend را مفروض نگیر

قبل از تغییر:

```text
inspect repository
inspect package.json
inspect NestJS bootstrap
inspect routes/controllers
inspect DTOs
inspect services
inspect Prisma schema
inspect migrations
inspect seed
inspect auth guards
inspect cookie handling
inspect CORS
inspect rate limiting
inspect media implementation
inspect tests
inspect Swagger/OpenAPI generation
inspect environment configuration
```

سپس:

```text
/docs/api-contract-audit.md
```

را بساز.

این فایل باید حداقل شامل این جدول باشد:

| Area | Expected | Actual | Gap | Decision | Files | Tests |
|---|---|---|---|---|---|---|
| Auth | | | | | | |
| Listings | | | | | | |
| Search | | | | | | |
| Media | | | | | | |
| Favorites | | | | | | |
| Reports | | | | | | |
| Contact | | | | | | |
| Admin | | | | | | |
| OpenAPI | | | | | | |

---

# 7. Freeze rule

بعد از پایان این مرحله:

```text
Frontend agent MUST NOT invent an endpoint.
Frontend agent MUST NOT invent a response field.
Frontend agent MUST NOT assume a field is non-null.
Frontend agent MUST NOT assume an enum value not present in OpenAPI.
Frontend agent MUST NOT parse raw Prisma data.
Frontend agent MUST NOT construct server-sensitive URLs itself.
```

هر چیزی که Frontend نیاز دارد باید از:

```text
OpenAPI
یا
documented public contract
```

به دست آید.

---

# 8. API Base Contract

Canonical API root:

```text
/api/v1
```

Health endpoints طبق معماری فعلی می‌توانند خارج از version prefix باقی بمانند:

```text
/health/live
/health/ready
```

تمام business APIهای public باید زیر `/api/v1` باشند.

مثال:

```text
GET /api/v1/listings
GET /api/v1/listings/:slug
GET /api/v1/categories
```

---

# 9. HTTP Methods

از semantics استاندارد HTTP استفاده کن:

```text
GET     read
POST    command/create/action
PATCH   partial update
PUT     فقط اگر replacement semantics واقعی وجود دارد
DELETE  deletion/removal action
```

برای state transitionهای حساس از endpoint command استفاده کن.

نمونه:

```text
POST /listings/:id/submit
POST /listings/:id/mark-sold
POST /listings/:id/archive
POST /listings/:id/renew
```

به جای:

```json
{
  "status": "ACTIVE"
}
```

---

# 10. IDs

Public resource IDs باید UUID باشند اگر implementation فعلی همین است.

Client نباید بتواند ID داخلی دیگری را حدس بزند.

در URLهای انسانی:

```text
listing slug
seller slug
category slug
province slug
city slug
```

را ترجیح بده، مطابق endpoint قرارداد نهایی.

---

# 11. Slug Contract

Listing slug باید پایدار باشد.

تغییر title نباید به صورت خودکار slug منتشرشده را عوض کند.

مثال:

```text
iphone-13-pro-max-a83kd2
```

Slug باید:

```text
stable
URL-safe
unique
SEO-friendly
```

باشد.

---

# 12. Response Envelope

قرارداد فعلی WeshBazar باید حفظ شود مگر audit نشان دهد implementation ناقص است:

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "..."
}
```

`meta` در صورت نیاز وجود دارد.

Error:

```json
{
  "success": false,
  "error": {
    "code": "LISTING_NOT_FOUND",
    "message": "Listing not found",
    "details": {}
  },
  "requestId": "..."
}
```

اصل حیاتی:

```text
Frontend depends on error.code
not error.message
```

Message می‌تواند بعداً localized شود.

---

# 13. Error Design Principle

Error باید:

```text
machine-readable
stable
localized-independent
safe
useful for UI mapping
```

باشد.

از stack trace، Prisma errors و internal implementation details در production استفاده نکن.

استانداردهای HTTP و رویکردهای machine-readable error format را در نظر بگیر، اما برای MVP envelope موجود WeshBazar را بدون دلیل عوض نکن.

---

# 14. HTTP Status Policy

حداقل:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
415 Unsupported Media Type
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
503 Service Unavailable
```

هر operation باید status درست خود را در OpenAPI اعلام کند.

---

# 15. Request ID

هر request باید requestId داشته باشد.

رفتار:

```text
incoming X-Request-ID if policy allows
otherwise generate secure ID
return X-Request-ID
return requestId in envelope
include requestId in structured logs
```

هرگز در request logs این موارد را ذخیره نکن:

```text
password
passwordHash
OTP
OTP hash
refresh token
JWT
secret
full sensitive body
```

---

# 16. Date/Time Contract

Database:

```text
UTC
timezone-aware
```

API:

```text
ISO 8601 date-time
```

مثال:

```text
2026-10-04T14:30:00Z
```

Frontend مسئول تبدیل presentation به timezone محلی است.

---

# 17. Money Contract

هیچ API نباید money را به صورت floating-point غیرقابل‌کنترل منتقل کند.

Audit باید بررسی کند:

```text
DB type
Prisma type
JSON serialization
OpenAPI schema
Frontend TypeScript type
```

همگی باید سازگار باشند.

اگر implementation فعلی Decimal دارد:

```text
do not silently serialize Decimal in an ambiguous way
```

یک representation قطعی انتخاب و مستند کن.

برای MVP فقط currency موجود WeshBazar را expose کن:

```text
AFN
```

اما API طوری مستند شود که future currency extension بدون شکستن contract ممکن باشد.

---

# 18. Nullability Audit

برای هر field در تمام DTOها مشخص کن:

```text
required
optional
nullable
optional + nullable
```

این چهار حالت را با هم اشتباه نگیر.

مثال:

```ts
price: number | null
```

با:

```ts
price?: number
```

یک معنی ندارد.

OpenAPI باید دقیقاً این تفاوت را نشان دهد.

---

# 19. Enum Audit

تمام enumها باید:

```text
backend enum
DTO enum
OpenAPI enum
frontend generated type
```

هم‌نام باشند.

Enums مهم:

```text
USER / MODERATOR / ADMIN
ACTIVE / SUSPENDED / BANNED / DEACTIVATED
INDIVIDUAL / future seller types
NEW / LIKE_NEW / GOOD / FAIR
PAID / FREE / CONTACT
DRAFT / PENDING_REVIEW / ACTIVE / REJECTED / SOLD / ARCHIVED
PHONE / WHATSAPP / TELEGRAM
SCAM / STOLEN / PROHIBITED_ITEM / SPAM / MISLEADING / DUPLICATE / OFFENSIVE / OTHER
OPEN / UNDER_REVIEW / RESOLVED / DISMISSED
TEXT / LONG_TEXT / INTEGER / DECIMAL / BOOLEAN / SELECT / MULTI_SELECT / YEAR / DATE
```

اما enum واقعی باید از implementation و OpenAPI نهایی تأیید شود.

---

# 20. Authentication Architecture Freeze

Backend Master فعلی auth را این‌گونه طراحی کرده است:

```text
short-lived access token
+
HttpOnly Secure refresh cookie
+
refresh rotation
+
reuse detection
+
revocable sessions
```

این معماری باید حفظ شود مگر audit دلیل امنیتی مشخصی برای تغییر پیدا کند.

برای browser client:

```text
refresh token → HttpOnly cookie
```

و نه localStorage.

---

# 21. Cookie Contract

یک نام canonical برای refresh cookie تعیین کن.

نام باید در documentation ثبت شود:

```text
COOKIE_NAME = ...
```

همراه با:

```text
HttpOnly
Secure
SameSite
Path
Domain
Max-Age/Expires
```

همگی باید explicit باشند.

Frontend نباید انتظار داشته باشد JavaScript محتوای HttpOnly cookie را بخواند.

---

# 22. SameSite / CORS / Credentials

Audit کن که ترکیب زیر واقعاً کار می‌کند:

```text
Frontend origin
Backend origin
CORS allowed origins
Allow-Credentials
Cookie SameSite
Cookie Secure
HTTPS deployment
```

اگر Frontend و Backend روی originهای متفاوت هستند، browser credential behavior را واقعی تست کن.

هرگز در production برای credentialed requests:

```text
Access-Control-Allow-Origin: *
```

استفاده نکن.

---

# 23. Auth Endpoints — Canonical Inventory

API باید endpointهای موردنیاز Auth را audit کند:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-phone
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
GET  /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:sessionId
POST /api/v1/auth/change-password
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/change-phone
```

اگر implementation فعلی نام دیگری دارد، اختلاف را ثبت کن.

به دلیل اینکه Frontend هنوز freeze نشده، در صورت تفاوت غیرضروری می‌توان naming را یکدست کرد.

اما migration path و backward compatibility را در صورت وجود مصرف‌کننده واقعی رعایت کن.

---

# 24. Register Contract

ورودی باید explicit DTO باشد.

حداقل مفهومی:

```text
phone
password
displayName
```

Backend باید:

```text
normalize phone
validate input
check account policy
create user
create verification challenge
send through provider
```

را به شکل امن انجام دهد.

Response نباید اطلاعاتی بدهد که وجود یا عدم وجود account خصوصی را افشا کند.

---

# 25. OTP Contract

OTP raw code نباید در DB ذخیره شود.

باید:

```text
hashed
short-lived
attempt-limited
rate-limited
single-use
```

باشد.

Endpoint verification باید status code و error codes مشخص برای:

```text
invalid
expired
max attempts
rate limited
already verified
```

داشته باشد.

---

# 26. Development OTP

اگر MockSmsProvider در development OTP را log می‌کند، این رفتار باید:

```text
development only
```

باشد.

Production logs نباید OTP داشته باشند.

---

# 27. Login Contract

Login response دقیقاً freeze شود:

```text
access token presence
user summary
expiry semantics
refresh cookie behavior
```

اگر access token در body است، schema دقیق OpenAPI داشته باشد.

اگر session cookie فقط refresh را نگه می‌دارد، همین را واضح بنویس.

Frontend نباید refresh token را دریافت یا ذخیره کند.

---

# 28. Refresh Contract

Refresh باید:

```text
validate cookie
find session
validate hash
check expiration
rotate
detect reuse
issue new access token
set new refresh cookie
```

داشته باشد.

سناریوهای تست:

```text
valid refresh
expired refresh
revoked refresh
reused rotated refresh
missing cookie
malformed cookie
```

---

# 29. Logout Contract

Logout current session باید:

```text
revoke current session
clear cookie
return deterministic success
```

باشد.

Logout all:

```text
revoke all eligible sessions
clear current cookie
```

باشد.

---

# 30. Session Management Contract

GET sessions باید فقط اطلاعات safe بدهد:

```text
deviceName
userAgent summary if appropriate
createdAt
lastUsedAt
current marker if supported
```

هرگز:

```text
JWT
refresh token
hash
session secret
```

نشان نده.

---

# 31. Current User Contract

Canonical endpoint:

```text
GET /api/v1/me
```

باید DTO محدود و frontend-friendly بدهد.

مقادیر حساس هرگز نباید مستقیم برگردند.

حداقل حوزه‌ها:

```text
id
phone/display state as policy allows
displayName
role
status
phoneVerified state
seller summary
createdAt/memberSince where useful
```

در response دقیقاً مشخص کن کدام field public/private است.

---

# 32. User Profile Update

Canonical:

```text
PATCH /api/v1/me
```

فقط fieldهای مجاز.

ممنوع:

```text
role
status
passwordHash
phoneVerifiedAt
sellerAccountId
security fields
admin metadata
```

---

# 33. Password Change

Password change باید:

```text
verify current credentials according to policy
validate new password
hash Argon2id
revoke appropriate refresh sessions
```

را انجام دهد.

---

# 34. Password Reset

Forgot password باید account enumeration را کمینه کند.

Reset token:

```text
short-lived
single-use
hashed in DB
```

باشد.

After reset:

```text
revoke appropriate sessions
```

طبق policy.

---

# 35. Change Phone

Change phone باید یک state machine واضح داشته باشد:

```text
request change
→ verification challenge
→ verify new phone
→ commit new normalized phone
→ security/session policy
```

phone identity هرگز بدون verification عوض نشود.

---

# 36. Seller Account Contract

Listing باید به:

```text
SellerAccount
```

متصل باشد، نه صرفاً User.

این abstraction برای business accounts آینده حفظ شود.

---

# 37. Seller Public Profile

Canonical:

```text
GET /api/v1/sellers/:slug
```

Public DTO باید فقط safe information داشته باشد:

```text
displayName
slug
memberSince
phoneVerified indicator
activeListingCount
public listings if contract includes them
```

ممنوع:

```text
passwordHash
sessions
security metadata
internal IDs where not needed
admin metadata
private verification data
```

---

# 38. Categories API Inventory

حداقل:

```text
GET /api/v1/categories
GET /api/v1/categories/tree
GET /api/v1/categories/:slug
GET /api/v1/categories/:id/filter-schema
```

اگر public filter-schema با ID به URL داخلی وابسته شده، بررسی کن آیا slug endpoint از نظر public contract مناسب‌تر است.

---

# 39. Category Contract

Category DTO باید صریحاً مشخص کند:

```text
id
slug
label/name
parentId/parent
icon information if public
status if needed
sortOrder if public contract requires it
children where applicable
```

Admin-only fields نباید public شوند.

---

# 40. Category Tree Contract

Tree response باید برای render سریع UI قابل مصرف باشد.

از nesting نامحدود بدون limit پرهیز کن.

Contract باید مشخص کند:

```text
children[]
parent relationship
inactive handling
ordering
localization
```

---

# 41. Dynamic Attribute Contract

Dynamic attributes هسته WeshBazar هستند.

Backend باید schema-driven باشد.

Frontend نباید برای هر category fieldهای backend را hard-code کند.

---

# 42. Filter Schema Contract

Canonical endpoint:

```text
GET /api/v1/categories/:id/filter-schema
```

response باید حداقل مفهوم این fieldها را داشته باشد:

```text
key
label
type
required
filterable
searchable
unit
placeholder
min
max
options
sortOrder
```

اگر fieldی وجود ندارد، nullable/optional بودنش مستند شود.

---

# 43. Attribute Types

Attribute renderer باید فقط typeهای معتبر را قبول کند:

```text
TEXT
LONG_TEXT
INTEGER
DECIMAL
BOOLEAN
SELECT
MULTI_SELECT
YEAR
DATE
```

نوع جدید بدون به‌روزرسانی:

```text
backend validator
OpenAPI
frontend contract
tests
```

نباید وارد production شود.

---

# 44. Attribute Value Contract

Freeze کن که listing attributes چگونه serialize می‌شوند.

یک مدل canonical انتخاب کن و در OpenAPI دقیق نشان بده.

مثال مفهومی:

```json
{
  "ram": 8,
  "storage": [128, 256]
}
```

یا representation دیگری که implementation فعلی با آن سازگار است.

هیچ بخش از Frontend نباید شکل value را حدس بزند.

---

# 45. Attribute Validation

Backend باید همچنان enforce کند:

```text
unknown key → reject
required missing → reject
wrong type → reject
invalid numeric range → reject
invalid option → reject
inactive option → reject
invalid category mapping → reject
```

Frontend validation صرفاً UX است.

Backend authoritative است.

---

# 46. Location API Inventory

حداقل:

```text
GET /api/v1/locations/provinces
GET /api/v1/locations/provinces/:provinceId/cities
```

اگر public city-by-slug نیاز است، فقط در صورت business value اضافه شود.

---

# 47. Location Contract

Province:

```text
id
code
slug
name/localized name
```

City:

```text
id
provinceId
slug
name/localized name
```

Backend باید city/province mismatch را رد کند.

---

# 48. Localization Contract

Public API باید یک localization strategy واضح داشته باشد.

Audit و freeze کن:

```text
Accept-Language
locale query parameter
URL locale
or documented default
```

از hard-code شدن labelهای category/location در Frontend جلوگیری کن.

Language candidates from product architecture:

```text
en
fa-AF
ps-AF
```

اما implementation واقعی باید منبع نهایی باشد.

---

# 49. Listings — Public API

Canonical public endpoint:

```text
GET /api/v1/listings
```

فقط listingهای public-safe را برگرداند.

Default public scope:

```text
ACTIVE
```

بودن.

---

# 50. Listing Search Query Inventory

حداقل:

```text
q
category
province
city
minPrice
maxPrice
condition
sort
cursor
limit
```

Dynamic filters نیز پشتیبانی شوند.

---

# 51. Search Query Limits

هر query باید limits داشته باشد:

```text
maximum q length
maximum limit
maximum dynamic filter count
maximum list values
maximum numeric ranges
```

هرگز:

```text
unlimited query
unlimited records
arbitrary SQL
arbitrary JSON path
arbitrary order by
```

قبول نکن.

---

# 52. Search Normalization

Backend search normalization باید inconsistencyهای رایج Persian/Arabic را در نظر بگیرد، از جمله:

```text
ي / ی
ك / ک
Arabic/Persian digits
zero-width characters
repeated whitespace
```

Search باید روی normalized representation نیز کار کند.

---

# 53. Search Sorts

فهرست sortها باید controlled enum باشد.

حداقل مفهومی:

```text
newest
price_asc
price_desc
most_viewed
```

هر sort stable secondary ordering داشته باشد.

مثال:

```text
createdAt DESC, id DESC
```

---

# 54. Cursor Pagination

Public discovery باید cursor-based باشد مگر audit دلیل عملی قوی برای تغییر پیدا کند.

Meta باید دقیقاً contract شود:

```json
{
  "hasNext": true,
  "nextCursor": "..."
}
```

یا representation واقعی implementation.

`nextCursor` باید opaque باشد.

Frontend نباید cursor داخلی را decode کند.

---

# 55. Cursor Stability

دو request با یک query و داده پایدار نباید ordering تصادفی بگیرند.

Audit:

```text
sort key
secondary key
insertions between pages
updates between pages
expired listings
sold listings
```

را بررسی کند.

---

# 56. Limit Contract

برای limit یک default و maximum صریح تعریف کن.

مثال مفهومی:

```text
default = 20
max = 50
```

عدد نهایی از implementation/config بیاید و مستند شود.

---

# 57. Listing Card DTO

Listing list response نباید full detail model باشد.

یک DTO اختصاصی برای card تعریف/تأیید کن.

حداقل حوزه‌ها:

```text
id
slug
title
price/pricing type
currency
negotiable
condition
primary image
province
city
publishedAt
seller summary if needed
favorite state according to auth policy
```

Fields اضافی فقط با دلیل.

---

# 58. Listing Detail DTO

Canonical:

```text
GET /api/v1/listings/:slug
```

Detail باید شامل:

```text
listing core
images
category
location
attributes
price
condition
seller safe profile
contact availability
created/published timestamps
```

نباید شامل:

```text
moderation secrets
audit metadata
internal provider data
private seller data
refresh/session data
```

---

# 59. Listing Detail / Favorite State

این مرحله باید یک تصمیم قطعی درباره favorite state بگیرد.

گزینه مناسب:

```text
public anonymous request:
isFavorite omitted or null
```

و برای authenticated user:

```text
isFavorite: true | false
```

اما فقط اگر backend می‌تواند آن را بدون N+1 یا request explosion ارائه کند.

اگر implementation دیگری بهتر است، آن را صریحاً freeze کن.

---

# 60. Listing State Machine API

Client حق تعیین status ندارد.

Commands:

```text
create draft
submit
approve
reject
mark sold
archive
renew
restore/republish where allowed
```

هر transition باید endpoint و authorization مشخص داشته باشد.

---

# 61. Seller Listing APIs

حداقل:

```text
GET  /api/v1/me/listings
POST /api/v1/listings
GET  /api/v1/listings/:slug
PATCH /api/v1/listings/:id
POST /api/v1/listings/:id/submit
POST /api/v1/listings/:id/mark-sold
POST /api/v1/listings/:id/archive
POST /api/v1/listings/:id/renew
```

GET detail public می‌تواند anonymous باشد.

Private seller management باید authorization داشته باشد.

---

# 62. My Listings DTO

`GET /me/listings` باید listing management data بدهد، اما نباید raw database model را expose کند.

حداقل statusهایی که UI می‌تواند لازم داشته باشد:

```text
DRAFT
PENDING_REVIEW
ACTIVE
REJECTED
SOLD
ARCHIVED
```

برای rejected listing در صورت policy:

```text
rejection reason code
safe note
```

برگردد.

---

# 63. Listing Edit Contract

PATCH باید explicit DTO داشته باشد.

ممنوع:

```text
status
sellerAccountId
views
favoriteCount
moderation state
createdAt
owner
```

اگر material edit نیازمند re-review است، response و transition دقیق freeze شود.

---

# 64. Versioning / Optimistic Concurrency

Listing `version` فعلی را audit کن.

اگر `expectedVersion` contract است:

```json
{
  "expectedVersion": 4
}
```

باشد.

Conflict:

```text
LISTING_VERSION_CONFLICT
```

باشد.

Frontend باید بتواند conflict را به UI تبدیل کند.

---

# 65. Listing Create Contract

Create draft باید با explicit DTO انجام شود.

حداقل حوزه‌ها:

```text
categoryId
provinceId
cityId
title
description
pricing
condition
attributes
contact configuration
```

مقادیر server-controlled را client تعیین نمی‌کند.

---

# 66. Listing Validation Contract

حداقل rules:

```text
authenticated user
active seller account
valid category
valid location
valid title
description constraints
price rules
condition enum
attribute schema
listing quotas
```

هر failure باید error code قابل mapping داشته باشد.

---

# 67. Form Field Error Contract

Frontend باید بتواند field-level errors را بفهمد.

ترجیح contract:

```json
{
  "success": false,
  "error": {
    "code": "LISTING_VALIDATION_FAILED",
    "message": "Validation failed",
    "details": {
      "fields": {
        "title": ["..."],
        "price": ["..."],
        "attributes.ram": ["..."]
      }
    }
  },
  "requestId": "..."
}
```

اگر implementation فعلی شکل دیگری دارد، آن را audit و freeze کن؛ Frontend نباید حدس بزند.

---

# 68. Pricing Contract

Pricing modes:

```text
PAID
FREE
CONTACT
```

Rules:

```text
PAID → price valid
FREE → price null or policy-defined representation
CONTACT → price according to policy
```

همه این قواعد باید در DTO، backend validation، OpenAPI و tests هم‌راستا باشند.

---

# 69. Condition Contract

Canonical controlled values:

```text
NEW
LIKE_NEW
GOOD
FAIR
```

از مقادیر آزاد جلوگیری شود.

---

# 70. Contact Methods Contract

Initial methods:

```text
PHONE
WHATSAPP
TELEGRAM
```

Listing contact configuration باید explicit باشد.

---

# 71. Contact Action

Canonical:

```text
POST /api/v1/listings/:id/contact
```

Body:

```json
{
  "method": "WHATSAPP"
}
```

Backend باید:

```text
listing active?
method enabled?
seller eligible?
rate limit?
record event?
return safe target?
```

را انجام دهد.

---

# 72. Contact Response

Response باید Frontend را قادر کند action را انجام دهد.

اما Frontend نباید raw dangerous URL را خودش تولید کند.

در contract مشخص کن:

```text
method
target/value
action URL if used
```

و rules مربوط به:

```text
https
wa.me
t.me
tel
```

را server-authoritative نگه دار.

---

# 73. Favorite APIs

Canonical:

```text
POST   /api/v1/favorites/:listingId
DELETE /api/v1/favorites/:listingId
GET    /api/v1/me/favorites
```

Authentication required.

---

# 74. Favorite Semantics

Duplicate favorite:

```text
idempotent success
```

یا predictable conflict behavior.

یک انتخاب قطعی کن.

Database unique constraint:

```text
UNIQUE(userId, listingId)
```

باقی بماند.

---

# 75. Favorite List DTO

`GET /me/favorites` باید listing card-friendly data بدهد.

نباید Frontend را مجبور به request جدا برای هر favorite کند.

---

# 76. Report APIs

Canonical:

```text
POST /api/v1/listings/:id/reports
```

و اگر current implementation شکل دیگری دارد، inventory و contract freeze کن.

---

# 77. Report Reasons

Initial:

```text
SCAM
STOLEN
PROHIBITED_ITEM
SPAM
MISLEADING
DUPLICATE
OFFENSIVE
OTHER
```

Report باید:

```text
authenticated
rate-limited
duplicate-protected
bounded description
```

باشد.

---

# 78. Report DTO

Frontend باید بداند:

```text
reason enum
description constraints
possible target
```

و response codeهای زیر را بشناسد:

```text
REPORT_DUPLICATE
REPORT_RATE_LIMITED
```

به‌علاوه errorهای عمومی.

---

# 79. Media Architecture Contract

Media جدا از Listing row باقی بماند.

Storage abstraction فعلی حفظ شود:

```text
StorageProvider
LocalStorageProvider
S3-compatible future
```

---

# 80. Upload Contract

Canonical listing image upload:

```text
POST /api/v1/listings/:id/images
```

Content-Type:

```text
multipart/form-data
```

OpenAPI باید دقیقاً:

```text
field name
required/optional
max size
accepted mime types
max files
```

را مستند کند.

---

# 81. Image Security Contract

Backend نباید به این‌ها اعتماد کند:

```text
filename
file extension
Content-Type header alone
```

باید:

```text
inspect
validate
decode
re-encode
```

کند.

---

# 82. Image Variants

اگر backend variants دارد، response دقیقاً مشخص کند:

```text
id
url/URL object
mimeType
width
height
size
sortOrder
isPrimary
thumbnail/medium/large variants
```

فقط variantهای واقعی implementation را expose کن.

---

# 83. Primary Image Contract

Listing باید بتواند یک تصویر primary معتبر داشته باشد.

Ordering endpoint:

```text
PATCH /api/v1/listings/:id/images/:imageId/order
```

در صورت وجود همین contract.

---

# 84. Delete Image

Canonical:

```text
DELETE /api/v1/listings/:id/images/:imageId
```

فقط owner/authorized moderator.

response باید deterministic باشد.

---

# 85. Image Limits

Backend configuration source of truth برای:

```text
MAX_UPLOAD_SIZE
MAX_IMAGES_PER_LISTING
```

باشد.

Frontend فقط UX constraint نشان می‌دهد.

---

# 86. Orphan Media

Backend باید orphan cleanup را انجام دهد.

Contract public لازم نیست.

اما status داخلی و job health باید قابل audit باشد.

---

# 87. Admin API Namespace

Admin endpoints باید واضحاً namespace داشته باشند:

```text
/api/v1/admin/...
```

و هر endpoint باید:

```text
role/permission
DTO
response
error codes
OpenAPI security
```

داشته باشد.

---

# 88. Admin Operations Inventory

حداقل domainها:

```text
summary/dashboard
users
user detail
suspend user
ban user
restore user
listing moderation
approve listing
reject listing
archive listing
reports
resolve report
dismiss report
categories
category attributes
attribute options
locations
audit logs
analytics
```

---

# 89. Admin Dashboard Contract

Dashboard باید فقط dataهای لازم را بدهد.

از یک mega-response برای تمام admin screens پرهیز کن.

ترجیح:

```text
summary endpoint
queue endpoint
report queue endpoint
analytics endpoint
```

جدا.

---

# 90. RBAC Contract

Roles:

```text
USER
MODERATOR
ADMIN
```

Permissions مفهوم‌محور:

```text
LISTING_REVIEW
LISTING_REJECT
REPORT_REVIEW
USER_SUSPEND
USER_BAN
CATEGORY_MANAGE
LOCATION_MANAGE
AUDIT_READ
```

Frontend role gating فقط UX است.

Backend authority نهایی است.

---

# 91. IDOR Audit

برای هر protected resource تست کن:

```text
User A cannot read User B sessions
Seller A cannot edit Seller B listing
Seller A cannot delete Seller B image
User A cannot mutate User B profile
User cannot use another seller's contact settings
Moderator cannot perform admin-only operation
```

---

# 92. Mass Assignment Audit

هیچ endpoint مهمی نباید:

```ts
prisma.model.update({ data: request.body })
```

انجام دهد.

Explicit mapping اجباری است.

---

# 93. User Status Rules

وقتی user:

```text
SUSPENDED
BANNED
DEACTIVATED
```

است، protected operations باید policy مشخص داشته باشند.

این policy باید در docs و tests باشد.

---

# 94. Listing Public Visibility

Public listing search فقط باید listingهای allowed را نشان دهد.

حداقل:

```text
DRAFT → no
PENDING_REVIEW → no
REJECTED → no
ACTIVE → yes
SOLD → default no
ARCHIVED → default no
```

تاریخی/SEO policy اگر متفاوت است باید explicit باشد.

---

# 95. Search Filters

Core filters:

```text
q
category
province
city
minPrice
maxPrice
condition
```

Dynamic category filters:

```text
schema-driven
whitelisted
validated
category-aware
```

---

# 96. Dynamic Filter Syntax

Master backend یک grammar مفهومی پیشنهاد کرده است:

```text
filter=ram:gte:8
filter=storage:in:128,256
```

قبل از Freeze نهایی باید grammar را دقیق تعریف کن:

```text
operator set
value serialization
multiple filters
multiple values
escaping
URL encoding
invalid filter behavior
category mismatch behavior
max filter count
```

Frontend باید بتواند parser/serializer واحد بسازد.

---

# 97. Filter Operators

مجاز بودن operatorها باید وابسته به attribute type باشد.

مثال:

```text
TEXT → eq / contains
SELECT → eq / in
MULTI_SELECT → contains / in according to chosen representation
INTEGER/DECIMAL/YEAR → eq / gte / lte / in
BOOLEAN → eq
DATE → eq / gte / lte
```

فهرست نهایی باید در OpenAPI/docs freeze شود.

---

# 98. Invalid Filters

اگر filter:

```text
unknown key
unknown operator
wrong value type
wrong category
inactive option
excessive filter count
```

باشد، رفتار باید predictable باشد:

```text
400/422 + stable error code
```

یا documented ignore policy.

برای داده حساس ترجیحاً fail closed.

---

# 99. Query Serialization Rules

Backend باید برای:

```text
null
missing
empty string
empty array
zero
false
```

semantics مشخص داشته باشد.

مثلاً:

```text
minPrice=0
```

نباید با missing اشتباه شود.

---

# 100. Pagination Metadata

Public:

```text
hasNext
nextCursor
```

Admin:

```text
page
limit
total
totalPages
```

اما فقط اگر endpoint واقعاً نیاز به total دارد.

---

# 101. Admin Pagination

Admin dashboardها می‌توانند page/limit استفاده کنند.

حداکثر limit مشخص باشد.

`total` ممکن است query گران باشد؛ در مواردی که لازم نیست حذف شود.

---

# 102. API Request Cancellation / Idempotency

برای commandهایی که روی شبکه ضعیف ممکن است retry شوند، policy بررسی کن.

Candidate operations:

```text
listing creation
report submission
contact action
```

اگر idempotency key استفاده می‌شود، دقیق freeze شود:

```text
header name
which endpoints
key lifetime
conflict behavior
response replay behavior
```

برای همه endpointها بدون دلیل آن را اضافه نکن.

---

# 103. Rate Limit Contract

Endpoints حساس:

```text
register
login
OTP send
OTP verify
forgot password
password reset
listing creation
publish
report
contact
image upload
public search
```

محدودیت‌ها configurable باشند.

---

# 104. Rate Limit Response

اگر backend rate-limit metadata دارد، OpenAPI و docs باید آن را مشخص کنند.

مثلاً:

```text
Retry-After
```

در 429 در صورت implementation.

Frontend باید بتواند 429 را به پیام مناسب تبدیل کند بدون نمایش raw server text.

---

# 105. Public Search Abuse

Search باید:

```text
max q length
max result limit
max filters
allowed sorts
rate limit
safe identifiers
bounded execution
```

داشته باشد.

---

# 106. Error Code Catalog Freeze

تمام error codeهای frontend-relevant باید canonical باشند.

حداقل گروه‌ها:

```text
AUTH_*
OTP_*
USER_*
CATEGORY_*
LOCATION_*
LISTING_*
IMAGE_*
FAVORITE_*
REPORT_*
MODERATION_*
RATE_*
PAYLOAD_*
```

مستر Backend قبلی نمونه‌هایی داده است؛ implementation نهایی باید catalog واقعی را export کند.

---

# 107. Error Code Documentation

برای هر code:

```text
code
HTTP status
trigger
user-safe meaning
frontend action
retryable?
field-level?
log level
```

را مستند کن.

---

# 108. Frontend Error Mapping Contract

یک فایل تولید/مستند کن:

```text
/docs/frontend-error-map.md
```

مثال:

```text
LISTING_NOT_FOUND
→ listing unavailable UI

AUTH_ACCOUNT_BANNED
→ account blocked UI

LISTING_VERSION_CONFLICT
→ refresh/edit conflict UI

RATE_LIMITED
→ retry later UI
```

Frontend نباید backend English messages را مستقیم render کند.

---

# 109. OpenAPI Standard

OpenAPI باید یک source machine-readable باشد.

در صورت پشتیبانی tooling از OpenAPI 3.1.x، استفاده از schemaهای دقیق 3.1 را ترجیح بده؛ در غیر این صورت از نسخه رسمی‌ای که stack نصب‌شده NestJS Swagger واقعاً و به‌درستی تولید می‌کند استفاده کن.

نسخه انتخاب‌شده باید در artifact مشخص باشد.

---

# 110. OpenAPI Metadata

Document باید داشته باشد:

```text
title
version
description
servers
tags
security schemes
schemas
responses
parameters
examples
```

---

# 111. Operation IDs

هر operation باید unique `operationId` داشته باشد.

نام‌ها باید stable و code-generation friendly باشند.

نمونه:

```text
listListings
getListingBySlug
createListing
updateListing
submitListing
markListingSold
archiveListing
getSellerBySlug
getCurrentUser
```

از نام‌های تصادفی و duplicate جلوگیری کن.

---

# 112. OpenAPI Tags

Tags منطقی:

```text
Auth
Users
Sellers
Categories
Locations
Listings
Media
Favorites
Reports
Admin
Analytics
Health
```

---

# 113. Request Schemas

تمام request bodyهای مهم باید schema explicit داشته باشند.

تمام query parameters باید:

```text
name
location
required
schema
description
enum/default
```

را داشته باشند.

---

# 114. Response Schemas

هر operation باید responseهای مهم را مستند کند:

```text
200/201 success
204 if used
400
401
403
404
409
413
415
422
429
500
```

همه لازم نیستند اگر operation واقعاً تولیدشان نمی‌کند؛ اما خطاهای ممکن نباید بی‌دلیل پنهان شوند.

---

# 115. Security in OpenAPI

Public endpoints باید security optional/anonymous را درست نشان دهند.

Protected endpoints باید authentication requirement مناسب داشته باشند.

اگر cookie-based auth در OpenAPI مدل می‌شود، scheme و documentation باید دقیق باشد.

---

# 116. Multipart OpenAPI

Upload endpoint باید explicit داشته باشد:

```text
multipart/form-data
file field
constraints
response
```

---

# 117. Examples

برای endpointهای مهم example واقعی و safe بساز:

```text
register
login
verify OTP
listing search
listing detail
create draft
filter schema
upload image
favorite
contact
report
admin moderation
```

هیچ secret واقعی در examples نباشد.

---

# 118. Typed Client Readiness

API باید طوری باشد که از OpenAPI بتوان TypeScript client/type generation ساخت.

Typed client generation باید بدون manual guessing امکان‌پذیر باشد.

Frontend نباید خودسرانه typeهایی بسازد که با contract مغایرت دارند.

---

# 119. Generated OpenAPI Artifact

یک فایل machine-readable در repository قرار بده، مثلاً:

```text
/docs/openapi.json
```

یا:

```text
/docs/openapi.yaml
```

نام نهایی را با repository فعلی هماهنگ کن.

---

# 120. OpenAPI Drift Test

یک test/CI step بساز که بررسی کند:

```text
OpenAPI generation succeeds
OpenAPI parses
required schemas exist
operationIds unique
no broken refs
no undocumented public endpoint
```

اگر امکان دارد artifact generated را در CI با source compare کن.

---

# 121. Undocumented Endpoint Rule

هیچ public endpoint جدیدی بدون OpenAPI documentation وارد repository نشود.

اگر controller route جدید اضافه شد، contract update باید بخشی از PR/phase باشد.

---

# 122. Contract Test Philosophy

تست باید سه چیز را همزمان بررسی کند:

```text
Implementation behavior
HTTP response
OpenAPI contract
```

صرفاً green unit test کافی نیست.

---

# 123. Endpoint Contract Test Matrix

برای هر endpoint مهم این matrix را بساز:

| Endpoint | Anonymous | Auth | Role | Happy | Validation | AuthZ | Error | OpenAPI |
|---|---|---|---|---|---|---|---|---|
| GET listings | ✅ | ✅ | any | ✅ | ✅ | N/A | ✅ | ✅ |
| GET listing | ✅ | ✅ | any | ✅ | ✅ | N/A | ✅ | ✅ |
| POST listing | ❌ | ✅ | USER | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favorite | ❌ | ✅ | USER | ✅ | ✅ | ✅ | ✅ | ✅ |
| Contact | ✅ | optional | policy | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ❌ | ✅ | MOD/ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ |

این matrix را برای تمام endpointها کامل کن.

---

# 124. Auth E2E Matrix

حداقل:

```text
register
verify
login
refresh
logout
logout-all
session revoke
change password
forgot password
reset password
change phone
banned login/action
suspended action
```

هم happy path و هم failure path.

---

# 125. Listing E2E Matrix

حداقل:

```text
create draft
edit draft
submit
approve
reject
edit rejected
mark sold
archive
renew
version conflict
owner violation
invalid category
invalid attributes
invalid location
listing limit
```

---

# 126. Search E2E Matrix

حداقل:

```text
empty query
text query
Persian normalization
category
province
city
price min
price max
condition
sorts
dynamic eq
dynamic range
dynamic multi-value
invalid filter
multiple filters
cursor page 1
cursor page 2
end of results
inactive listings excluded
```

---

# 127. Media E2E Matrix

حداقل:

```text
valid image
invalid mime
fake mime
oversized file
oversized dimensions
malformed image
too many images
unauthorized upload
unauthorized delete
ordering
primary image
orphan cleanup
```

---

# 128. Favorite E2E Matrix

```text
add
repeat add
remove
repeat remove
list favorites
unauthorized
listing unavailable
```

---

# 129. Contact E2E Matrix

```text
phone
whatsapp
telegram
method disabled
listing inactive
seller banned
rate limited
analytics event
safe response
```

---

# 130. Report E2E Matrix

```text
valid report
duplicate report
rate limit
invalid reason
long description
inactive listing
unauthorized
```

---

# 131. Admin E2E Matrix

```text
user role cannot admin
moderator allowed action
moderator denied admin action
admin allowed
suspend
ban
restore
approve
reject
report resolve
audit record created
```

---

# 132. Security Contract Tests

Mandatory:

```text
IDOR
mass assignment
privilege escalation
unverified publish
banned actions
refresh reuse
OTP brute force
report abuse
favorite duplication
SQL injection input
sort injection
filter injection
path traversal
malicious image
malformed JSON
oversized request
CORS credential policy
```

---

# 133. Request Body Limits

Audit:

```text
JSON limit
multipart limit
file count
field count if relevant
string length
array length
filter count
```

و limits را در OpenAPI تا حدی که tooling اجازه می‌دهد document کن.

---

# 134. Content Types

API باید content types واضح داشته باشد:

```text
application/json
multipart/form-data
```

HTML input را برای listing content قبول نکن.

---

# 135. Listing Text Contract

Title و description:

```text
plain text
Unicode-safe
bounded
```

باشند.

`dangerouslySetInnerHTML` در Frontend برای این داده‌ها نباید لازم باشد.

---

# 136. External URL Safety

Contact targets باید server-authoritative باشند.

Frontend نباید arbitrary URL را اجرا کند.

Allowed scheme/domain policy را مستند کن.

---

# 137. Open Redirect Safety

اگر endpointی redirect parameter دارد:

```text
allowlist
same-origin policy
safe relative redirect
```

و هیچ redirect خارجی بدون validation.

---

# 138. CORS Contract

Environment configuration باید explicit origins داشته باشد.

مثال مفهومی:

```text
CORS_ALLOWED_ORIGINS=https://weshbazar.example,...
```

Production wildcard برای credentialed browser flow ممنوع.

---

# 139. Cache Semantics

API public data ممکن است cache-friendly باشد:

```text
categories
locations
filter schema
public listing detail
public search
```

Private data:

```text
/me
favorites
my listings
sessions
```

باید private/no-store semantics مناسب داشته باشد.

---

# 140. Cache Leak Audit

هیچ personalized fieldی نباید وارد public shared cache شود.

مثال خطرناک:

```text
listing response cached with user-specific isFavorite
```

اگر چنین چیزی وجود دارد:

```text
fix cache boundary
```

---

# 141. ETag / Conditional Requests

فقط اگر واقعاً ارزش دارد بررسی کن:

```text
ETag
If-None-Match
Last-Modified
```

برای listing detail و static-like resources می‌تواند مفید باشد.

اما اضافه کردن complexity بدون اندازه‌گیری ممنوع.

---

# 142. Compression

API response compression policy را audit کن.

عمده payloadهای JSON باید بدون unnecessary duplication باشند.

---

# 143. Payload Size Audit

برای endpointهای مهم نمونه response size ثبت کن:

```text
listing list
listing detail
category tree
filter schema
seller profile
favorites
admin queue
```

اگر response به خاطر nested data غیرضروری بزرگ است، DTO را کوچک کن.

---

# 144. N+1 Audit

Endpoints زیر باید برای N+1 بررسی شوند:

```text
GET listings
GET seller
GET category tree
GET favorites
admin queues
```

Generated SQL را در صورت نیاز inspect کن.

---

# 145. Selective DTO Mapping

هر endpoint باید explicit select داشته باشد.

این موارد را از raw Prisma output نده:

```text
passwordHash
refresh sessions
internal moderation metadata
```

---

# 146. Search Performance

Search queries را با:

```text
EXPLAIN ANALYZE
indexes
actual filtering
cursor pagination
```

در test/development environment بررسی کن.

Performance claim بدون measurement ممنوع.

---

# 147. PostgreSQL Search

MVP search همچنان PostgreSQL است.

اگر implementation از:

```text
pg_trgm
GIN/GiST
normalized searchText
```

استفاده می‌کند، contract/public behavior را مستقل از implementation نگه دار.

Frontend نباید بداند search engine PostgreSQL است.

---

# 148. Search Provider Boundary

Public API باید به:

```text
SearchProvider
```

وابسته به رفتار باشد، نه implementation.

OpenSearch آینده نباید public contract را بشکند.

---

# 149. Storage Provider Boundary

Frontend باید فقط public URL یا variant object معتبر بگیرد.

هرگز:

```text
filesystem path
absolute local path
S3 secret URL with credentials
```

expose نکن.

---

# 150. Image URL Stability

اگر storage provider عوض شود، public contract تا حد ممکن ثابت بماند.

اگر URL signed باشد، expiration semantics باید document شود.

---

# 151. Signed URL Audit

اگر media private نیست، signed URLs بی‌دلیل اضافه نکن.

اگر signed URL استفاده می‌شود:

```text
expiry
cache behavior
refresh behavior
```

باید freeze شود.

---

# 152. Listing Expiration

Listing field:

```text
expiresAt
```

در صورت public exposure باید معنا و timezone مشخص باشد.

Renew endpoint:

```text
POST /api/v1/listings/:id/renew
```

rules باید server authoritative باشد.

---

# 153. Sold/Archived Behavior

Frontend باید بتواند بفهمد listing:

```text
active
sold
archived
```

است.

اما public search default فقط active است مگر policy دیگری freeze شود.

---

# 154. Rejection Contract

اگر listing rejected شود، public API نباید moderation secrets بدهد.

Seller API می‌تواند safe rejection code/note بدهد.

---

# 155. Moderation Contract

Moderation actions:

```text
APPROVE
REJECT
ARCHIVE
RESTORE
```

Rejection reason machine-readable باشد.

---

# 156. Audit Log Contract

Audit logs برای security/admin هستند.

API admin باید fields لازم را بدهد اما secrets نه.

Append-only semantics باقی بماند.

---

# 157. Analytics Contract

Events مهم:

```text
LISTING_VIEW
PHONE_CONTACT
WHATSAPP_CONTACT
TELEGRAM_CONTACT
FAVORITE_ADDED
REPORT_CREATED
LISTING_CREATED
LISTING_PUBLISHED
LISTING_SOLD
```

Public API نباید raw event stream را بی‌دلیل expose کند.

---

# 158. Analytics Privacy

Analytics نباید داده شخصی اضافه‌ای را ذخیره کند فقط برای convenience.

Raw IP retention برای view counting فقط اگر واقعاً لازم است و policy دارد.

---

# 159. Seller Analytics

اگر API seller analytics وجود دارد، آن را جدا و explicit طراحی کن.

هیچ analytics field اضافه‌ای را داخل Listing DTO فقط به خاطر آینده اضافه نکن.

---

# 160. Admin Analytics

Summary data باید lightweight باشد.

No analytics warehouse.

No fake counters.

---

# 161. Empty Result Semantics

Search با هیچ نتیجه:

```text
200
items: []
meta: { hasNext: false, ... }
```

باشد مگر implementation reason دیگری دارد.

404 را برای collection empty استفاده نکن.

---

# 162. Resource Not Found

برای resource singular:

```text
404
LISTING_NOT_FOUND
```

مثلاً.

---

# 163. Authorization vs Not Found

برای protected resources policy باید مشخص کند چه زمانی:

```text
404
```

به جای:

```text
403
```

برگردانده می‌شود تا resource existence leakage کم شود.

این تصمیم را endpoint-by-endpoint مستند کن.

---

# 164. Conflict Semantics

409 برای مواردی مثل:

```text
version conflict
duplicate resource when not idempotent
state conflict
```

استفاده شود.

---

# 165. Validation vs Bad Request

400/422 semantics را در کل API یکدست کن.

یک convention سراسری انتخاب کن و مستند کن.

Frontend نباید برای هر endpoint strategy متفاوت داشته باشد.

---

# 166. Retryability Contract

برای errorهای backend یک mapping ایجاد کن:

```text
retryable
not retryable
retry after
user action required
```

مثلاً:

```text
429 → retry according to Retry-After if present
401 → auth recovery
409 → user conflict resolution
422 → fix form
404 → stop/request unavailable
503 → retry with backoff where safe
```

---

# 167. API Timeout Contract

هیچ request نباید indefinitely hang کند.

External providerها timeout داشته باشند.

Frontend timeout و backend timeout باید منطقی و documented باشند.

---

# 168. External Service Failure

SMS/storage/provider failure:

```text
timeout
failure code
safe fallback
retry behavior
```

باید explicit باشد.

---

# 169. Transactions

برای multi-write operations database transaction لازم است.

مثال:

```text
create listing + revision
publish + moderation action
favorite + counter update if transactional
password reset + session revoke
phone change + security state
```

External provider calls داخل transaction طولانی نباشند.

---

# 170. Concurrency

Race conditions را برای:

```text
approve/reject
mark sold
favorite duplicates
version updates
session rotation
```

تست کن.

---

# 171. API Versioning Policy

v1 باید stable باشد.

Prefer additive change.

Breaking change:

```text
v2
```

یا migration policy مستند.

---

# 172. Deprecation

اگر endpoint قدیمی باقی می‌ماند، document کن:

```text
deprecated
replacement
removal timeline if known
```

بدون شکستن frontend جدید.

---

# 173. Header Contract

Headerهای مهم:

```text
Authorization
Content-Type
Accept
X-Request-ID
Cookie
```

و response headers مانند:

```text
X-Request-ID
Retry-After if relevant
Cache-Control
ETag if used
```

باید consistent باشند.

---

# 174. Authorization Header

اگر access token با Bearer استفاده می‌شود:

```text
Authorization: Bearer <access-token>
```

OpenAPI security scheme باید آن را نشان دهد.

---

# 175. Browser Credential Flow

اگر browser request نیاز به cookie دارد:

```text
credentials: include
```

روی client/API adapter در صورت cross-origin بودن باید لحاظ شود.

Backend CORS نیز باید credential policy را صحیح پشتیبانی کند.

---

# 176. CSRF Audit

چون browser authentication بخشی از آن cookie-based است، CSRF risk را explicit بررسی کن.

تصمیم نهایی باید documented باشد، نه فرضی.

اگر SameSite policy به تنهایی کافی نیست، مناسب‌ترین CSRF defense اضافه شود.

اما architecture را بی‌دلیل پیچیده نکن.

---

# 177. Auth State Frontend Contract

Frontend باید بتواند این stateها را distinguish کند:

```text
anonymous
checking session
authenticated
session expired
account suspended
account banned
verification required
```

Backend باید error/statusهای لازم را برای این stateها داشته باشد.

---

# 178. Public Anonymous Contract

بدون login باید امکان:

```text
browse
search
filter
listing detail
seller profile
contact seller
```

وجود داشته باشد، طبق محصول.

---

# 179. Auth Required Contract

Authentication برای:

```text
favorites
reports
seller operations
account
admin
session management
```

لازم باشد.

---

# 180. Contact Authentication

Contact seller برای buyer نباید به‌طور پیش‌فرض registration را اجباری کند.

این اصل product-level است و API باید آن را حفظ کند.

---

# 181. Seller Verification

Publishing listing باید phone verification را enforce کند.

ساخت draft قبل از verification می‌تواند مجاز باشد اگر implementation دارد.

اما bypass publish ممنوع.

---

# 182. API Data Freshness

Contract باید تفاوت این‌ها را روشن کند:

```text
real-time state
cached public data
eventual analytics
```

Frontend نباید assumptions نامشخص داشته باشد.

---

# 183. Mutation Response Policy

برای mutationهای مهم response باید بعد از server commit داده صحیح برگرداند.

از response fake مثل:

```json
{"success":true}
```

بدون state لازم برای UI، فقط اگر 204/empty response واقعاً مناسب است استفاده کن.

---

# 184. Optimistic UI Boundary

Backend نباید به خاطر optimistic frontend semantics data غلط بدهد.

محدوده optimistic مناسب:

```text
favorite
```

ولی:

```text
publish
mark sold
archive
account deletion
```

server-confirmed باشند.

---

# 185. List Ordering

هر endpoint list باید ordering explicit داشته باشد.

Database natural order قابل اتکا نیست.

---

# 186. Stable IDs in Pagination

برای cursor ordering از fieldهای deterministic استفاده کن.

مثال:

```text
createdAt + id
```

یا strategy واقعی implementation.

---

# 187. Search Category Scope

Dynamic filters فقط زمانی valid باشند که category مربوطه آن attribute را تعریف کرده باشد.

Filter خارج از category:

```text
reject
```

یا policy documented؛ ترجیح fail closed.

---

# 188. Category Inheritance

اگر attributes از parent category inherit می‌شوند، filter schema endpoint باید **effective schema** را برگرداند، نه فقط direct fields.

Frontend نباید inheritance را دوباره implement کند.

---

# 189. Attribute Historical Compatibility

اگر attribute definition تغییر کند، listingهای تاریخی نباید خراب شوند.

API باید historical listing را همچنان renderable نگه دارد.

---

# 190. Location Historical Compatibility

Deactivating a province/city نباید historical listing data را کورکورانه نابود کند.

Public exposure policy باید explicit باشد.

---

# 191. Seller Public Listings

Seller page اگر public listings دارد، از همان ListingCard contract استفاده کند.

DTO duplication غیرضروری ممنوع.

---

# 192. Public Seller Contact

Seller profile نباید phone را صرفاً به خاطر public profile endpoint expose کند.

Contact visibility از listing contact policy پیروی کند.

---

# 193. Listing Image Ordering

Order باید deterministic باشد.

Primary image باید مشخص باشد.

اگر image missing/deleted شد، backend باید invariant را حفظ کند یا deterministic recovery داشته باشد.

---

# 194. Favorite Counter

`favoriteCount` اگر public expose می‌شود باید consistency policy داشته باشد.

Approximation اگر مجاز است document شود.

Frontend نباید به counter به عنوان exact financial/business truth نگاه کند.

---

# 195. View Counter

`views` approximate می‌تواند باشد.

Do not expose misleading precision.

Analytics implementation باید abuse-resistant باشد.

---

# 196. Public Listing SEO Fields

Backend باید stable:

```text
slug
publishedAt
updatedAt
category relation
seller public relation
```

برای Frontend SEO فراهم کند.

---

# 197. Canonical URL Support

Backend لازم نیست full frontend URL را hard-code کند مگر contract عمداً چنین چیزی بخواهد.

ترجیح:

```text
slug/id/category relation
```

و Frontend canonical URL را بسازد.

---

# 198. OpenAPI and SEO

OpenAPI باید public listing detail fields را کامل توصیف کند تا Frontend metadata generation بدون guessing باشد.

---

# 199. Localization of Error Codes

Error code language-neutral.

Message user-facing localization concern است.

Backend می‌تواند default language بدهد، اما Frontend باید map داشته باشد.

---

# 200. Localization of Data

Category/location labels باید localized یا locale-resolved باشند.

Do not duplicate translations into unrelated DTO shapes.

---

# 201. API Client Generation

یک workflow مستند کن:

```text
OpenAPI source
→ validation
→ TypeScript client/types generation
→ frontend consume
```

در صورت استفاده از generator، command را در docs بنویس.

---

# 202. Generator Compatibility

Generated client باید با:

```text
Next.js
React
TypeScript
browser fetch
Node-side fetch where needed
```

سازگار باشد.

---

# 203. Server Component Compatibility

Frontend ممکن است API را از Server Component مصرف کند.

همین‌طور Client Component.

API contract نباید به browser-only assumptions وابسته باشد.

---

# 204. Request Context

برای endpoints authenticated مشخص کن چه چیزی source of identity است:

```text
access token
cookie/session
server auth context
```

Frontend نباید `userId` را برای تعیین actor ارسال کند مگر endpoint واقعاً نیاز داشته باشد و authorization آن را validate کند.

---

# 205. Actor Identity

Current user operation:

```text
/me
```

و listing ownership باید server identity context داشته باشد.

ممنوع:

```text
body.userId controls actor
```

---

# 206. Admin Actor Identity

Admin actions باید از authenticated principal گرفته شوند.

`adminUserId` client-controlled نیست.

---

# 207. Audit Metadata

Audit metadata باید safe باشد.

عدم وجود secrets mandatory است.

---

# 208. API Naming Consistency

Use one convention:

```text
plural collections
resource IDs/slugs
command actions for state transitions
```

مثلاً:

```text
/listings
/categories
/sellers
/favorites
```

نه ترکیب تصادفی singular/plural.

---

# 209. Query Parameter Naming

یک convention برای camelCase یا snake_case انتخاب و freeze کن.

Master قبلی camelCase مفهومی داشت:

```text
minPrice
maxPrice
```

اگر implementation همین را دارد، حفظ کن.

---

# 210. Pagination Parameter Naming

Public:

```text
cursor
limit
```

Admin:

```text
page
limit
```

نام‌ها globally consistent باشند.

---

# 211. Boolean Query Parameters

Behavior برای:

```text
true
false
1
0
```

یکدست شود.

ترجیح API: string booleans parsed به boolean.

OpenAPI باید type را نشان دهد.

---

# 212. Array Query Parameters

برای list values یک serialization style مشخص کن.

مثلاً:

```text
?ids=a,b,c
```

یا repeated params.

برای dynamic filters grammar مستقل داشته باش.

Frontend باید همان serialization را استفاده کند.

---

# 213. URL Encoding

Characters Persian، spaces، comma، colon و Unicode باید تست شوند.

Filter serializer نباید دستی string concatenate کند بدون encoding.

---

# 214. Search Unicode Tests

تست‌های واقعی شامل:

```text
ی
ي
ک
ك
۰۱۲۳
0123
zero-width
```

باشد.

---

# 215. API Documentation Language

API docs می‌تواند English technical language داشته باشد، اما field meaning و examples باید برای تیم Frontend واضح باشد.

---

# 216. Frontend Handoff Document

یک فایل نهایی بساز:

```text
/docs/frontend-api-contract.md
```

باید شامل:

```text
base URL
local setup
auth flow
cookies
CORS
common headers
response envelope
error envelope
error map
listing APIs
search grammar
pagination
categories
filter schema
locations
seller
favorites
reports
contacts
media
account
admin
OpenAPI location
generation commands
known limitations
```

---

# 217. Frontend API Contract Table

یک جدول نهایی:

| Operation ID | Method | Path | Auth | Role | Request | Response | Errors |
|---|---|---|---|---|---|---|---|

برای **تمام endpointها** پر کن.

این جدول باید از implementation واقعی تولید شود.

---

# 218. API Capability Matrix

جدول:

| Capability | Anonymous | Auth User | Moderator | Admin |
|---|---:|---:|---:|---:|
| Browse | ✅ | ✅ | ✅ | ✅ |
| Search | ✅ | ✅ | ✅ | ✅ |
| Detail | ✅ | ✅ | ✅ | ✅ |
| Contact | ✅ | policy | policy | policy |
| Favorite | ❌ | ✅ | ✅ | ✅ |
| Report | ❌/policy | ✅ | ✅ | ✅ |
| Create listing | ❌ | ✅ | ✅ | ✅ |
| Moderate | ❌ | ❌ | ✅/scope | ✅ |

اعداد واقعی را بر اساس implementation نهایی قرار بده.

---

# 219. API State Matrix

برای Listing:

| State | Public | Owner Edit | Submit | Admin Approve | Mark Sold | Archive |
|---|---:|---:|---:|---:|---:|---:|
| DRAFT | ❌ | ✅ | ✅ | ❌ | ❌ | policy |
| PENDING_REVIEW | ❌ | policy | ❌ | ✅ | ❌ | policy |
| ACTIVE | ✅ | policy | ❌ | N/A | ✅ | ✅ |
| REJECTED | ❌ | ✅ | ✅ | N/A | ❌ | policy |
| SOLD | policy/no | policy | ❌ | N/A | ❌ | ✅ |
| ARCHIVED | ❌ | restore flow | ❌ | N/A | ❌ | N/A |

جدول واقعی implementation را freeze کن.

---

# 220. API Lifecycle

برای تمام endpointهای mutation مشخص کن:

```text
preconditions
mutation
side effects
events
analytics
audit
response
errors
rollback
```

---

# 221. Secondary Side Effects

مثلاً publish listing:

```text
state transition
moderation action
analytics event
revision
```

نباید نصفه اجرا شود.

Internal events در صورت وجود باید documented باشند.

---

# 222. Event Naming

اگر internal events استفاده شده، نام‌ها consistent باشند:

```text
listing.created
listing.published
listing.sold
listing.archived
favorite.added
contact.clicked
report.created
user.suspended
```

اما این internal events بخشی از public HTTP API نیستند مگر explicitly exposed شوند.

---

# 223. Outbox Boundary

Distributed event bus در MVP اضافه نکن.

اما dependency را طوری نساز که future transactional outbox غیرممکن شود.

---

# 224. Performance Contract

برای endpointهای critical sample benchmarks در development/test environment ثبت کن:

```text
listings
listing detail
login
contact
```

Claim عمومی مثل “<100ms” نده مگر measurement واقعی داشته باشی.

---

# 225. Large Payload Test

تست کن:

```text
maximum listing description
maximum filters
maximum images
maximum categories tree
maximum admin page
```

تا memory/serialization failure آشکار شود.

---

# 226. Database Contract Audit

این مرحله Database Master جدید نیست، اما باید DB را برای API readiness audit کند:

```text
constraints
nullability
indexes
foreign keys
unique constraints
enums
JSONB structure
Decimal serialization
soft deletes
referential integrity
```

اگر gap باعث خراب شدن API contract است، اصلاحش کن.

---

# 227. Prisma Boundary

API DTOها نباید Prisma model types باشند.

Mapping explicit یا safe projection باشد.

---

# 228. Migration Policy

اگر API readiness به DB migration نیاز دارد:

```text
add migration
run migration tests
preserve data
update seed
update docs
```

هرگز:

```text
prisma db push
```

به عنوان production migration strategy.

---

# 229. Seed Readiness

Seed باید برای Frontend development داده کافی و deterministic فراهم کند:

```text
categories
attributes
options
provinces
cities
admin
optional verified seller/listings
```

اما اطلاعات جعلی را production-like حقیقت معرفی نکن.

---

# 230. Development Dataset

برای API smoke test داده‌های development واضح باشند.

مثلاً:

```text
1 verified seller
1 admin
several active listings
several draft listings
several categories
attribute examples
```

---

# 231. API Smoke Test Script

یک smoke script بساز که:

```text
health
categories
locations
public search
listing detail
register
verify (dev provider only)
login
me
create draft
submit
admin approve
search active listing
favorite
contact
report
mark sold
```

را پوشش دهد.

---

# 232. API Test Database

E2E/integration باید از database تست جدا استفاده کند.

Production DB هرگز target test suite نباشد.

---

# 233. Test Isolation

Test order dependency ممنوع.

Factories/fixtures deterministic باشند.

---

# 234. Contract Snapshot Policy

Snapshot کامل JSON برای هر endpoint ممنوع نیست، اما snapshot explosion نداشته باش.

Behavior + schema validation مهم‌تر است.

---

# 235. Schema Validation

OpenAPI generated schema را با نمونه responseهای واقعی validate کن.

اگر response واقعی مطابق schema نیست:

```text
STOP
FIX
RETEST
```

---

# 236. OpenAPI Response Drift

برای endpointهای مهم:

```text
real response
vs
OpenAPI schema
```

باید automated یا نیمه automated بررسی شود.

---

# 237. Request Validation Drift

DTO validation:

```text
code
runtime
OpenAPI
```

باید با هم سازگار باشند.

---

# 238. Enum Drift

هیچ enumی فقط در UI تعریف نشود.

Backend authoritative.

OpenAPI باید همان enum را expose کند.

---

# 239. Required Field Drift

Field required در DB ولی optional در DTO یا برعکس باید audit شود.

این اختلاف‌ها معمولاً bugهای integration می‌سازند.

---

# 240. Serialization Drift

ویژه:

```text
Date
Decimal
BigInt
UUID
JSONB
multipart
null
```

را بررسی کن.

---

# 241. Decimal/BigInt

اگر Prisma یا PostgreSQL type خاصی response را به string تبدیل می‌کند، OpenAPI باید همان را reflect کند.

Frontend type guessing ممنوع.

---

# 242. JSONB Attribute Serialization

Dynamic attributes باید JSON-safe باشند.

Date/Decimal values باید representation دقیق داشته باشند.

---

# 243. API Security Header Audit

Backend security headers را audit کن:

```text
Helmet
X-Content-Type-Options
Referrer-Policy
frame protections
CSP where applicable
```

Frontend نباید این policy را دور بزند.

---

# 244. Logging Audit

برای هر endpoint مهم بررسی:

```text
requestId
route
method
status
duration
userId when safe
errorCode
```

Secrets ممنوع.

---

# 245. Scraping Consideration

Public marketplace API inherently discoverable است.

Controls:

```text
rate limits
pagination caps
reasonable payloads
abuse monitoring
```

اما authenticated browser UX را نابود نکن.

---

# 246. Contact Spam

Contact endpoint باید abuse-aware باشد.

نباید buyer بتواند uncontrolled repeated contact events ایجاد کند.

---

# 247. Report Spam

Report endpoint باید duplicate/rate policy داشته باشد.

---

# 248. Listing Spam

Publish/create limits باید server-side enforce شوند.

---

# 249. Account Bans and API

Banned user cannot use protected marketplace commands.

Listing visibility policy documented.

Sessions revoked according to security policy.

---

# 250. Public Privacy

Public listing response هرگز نباید:

```text
seller private email
private phone unless contact policy
session data
IP
admin notes
security flags
```

برگرداند.

---

# 251. Admin Privacy

Admin response نیز least privilege را رعایت کند.

فقط اطلاعاتی که role نیاز دارد.

---

# 252. API Error Localization Strategy

Error code stable.

Messages may be English at API layer if current implementation uses English.

Frontend maps them to Dari/Persian UX.

Do not create frontend dependence on exact message text.

---

# 253. API Language Header

اگر Accept-Language پشتیبانی می‌شود، behavior آن را document کن.

اگر پشتیبانی نمی‌شود، Frontend باید localization خود را انجام دهد.

---

# 254. Public API Availability

Anonymous endpoints باید در UIهای اصلی در شرایط بدون session کار کنند.

No accidental global auth guard.

---

# 255. Auth Optional Detection

اگر یک endpoint public است ولی user-specific augmentation دارد، behavior را دقیق تعریف کن.

مثال:

```text
GET /listings
```

ممکن است:

```text
anonymous → no personalized favorite state
authenticated → favorite state available
```

اما query behavior باید deterministic بماند.

---

# 256. Cache With Auth Optionality

اگر authenticated response متفاوت است، public shared cache ممنوع.

Public base data و personalization را جدا کن.

---

# 257. Frontend Request Budget

API response design باید اجازه دهد Homepage در چند request منطقی render شود.

اما mega endpoint برای کل Home ایجاد نکن مگر requirement ثابت کند.

---

# 258. Home API Boundary

Homepage باید composable از:

```text
categories
listings
locations/popular if real data
```

باشد.

Fake “popular” data ممنوع.

---

# 259. Search Page API Boundary

Search page ideally:

```text
one search request
+
filter schema/category/location data when needed
```

نه request per listing.

---

# 260. Listing Detail API Boundary

Detail باید بتواند page را بدون fetchهای بی‌دلیل hydrate کند:

```text
listing
images
seller
category
attributes
contact availability
```

در یک response یا set منطقی از responses.

---

# 261. Seller Profile API Boundary

Public seller page باید listing cards را با reuse contract مصرف کند.

---

# 262. Sell Page API Boundary

Sell form باید با:

```text
categories
filter schema / attributes
locations
listing mutation APIs
media APIs
```

کار کند.

---

# 263. Admin UI API Boundary

Admin frontend می‌تواند client-heavyتر باشد.

اما API responseها باید bounded و paginated باشند.

---

# 264. API Documentation for Frontend

هر endpoint در frontend handoff باید شامل:

```text
purpose
auth
request
response
errors
side effects
cache notes
retry notes
```

باشد.

---

# 265. Cache Policy Documentation

برای هر endpoint یکی را انتخاب کن:

```text
public-cacheable
private
no-store
short-lived
mutation-no-cache
```

یا strategy واقعی implementation.

---

# 266. Mutation Cache Invalidation Hints

Documentation باید نشان دهد mutation چه queryهایی را تغییر می‌دهد.

مثلاً:

```text
favorite add
→ listing favorite state
→ favorites list
→ favorite counter if applicable
```

این guidance برای Frontend مهم است.

---

# 267. Search Cache Key

Search cache اگر future/implementation دارد باید شامل تمام query state باشد:

```text
q
category
location
price
condition
filters
sort
cursor
locale
```

Personalization جدا.

---

# 268. API Provider Independence

Frontend باید public contract را consume کند، نه provider-specific fields.

---

# 269. Future Business Accounts

Seller public DTO و listing DTO طوری باشد که future business badge بتواند اضافه شود.

اما الآن fieldهای fake یا unused اضافه نکن.

---

# 270. Future Promotions

Listing DTO را با 20 boolean آینده‌نگر شلوغ نکن.

Extension point برای:

```text
badges
ranking metadata
promotion data
```

در آینده کافی است.

---

# 271. Future Reviews

Review data فعلاً API ندارد.

هیچ rating fake اضافه نشود.

---

# 272. Future Messaging

Chat فعلاً API ندارد.

Frontend Master نباید fake conversation UI بسازد.

---

# 273. Future Payments

Payment API فعلاً ندارد.

Listing price API را طوری نگه دار که payment feature بعداً جدا اضافه شود.

---

# 274. Future Geospatial

Location API فعلاً Province/City است.

Map/radius future است.

contract فعلی را با coordinateهای fake آلوده نکن.

---

# 275. Future Notifications

Notification API فعلاً optional/not required.

داده fake نده.

---

# 276. API Backward Compatibility

تا زمانی که Frontend نهایی نشده، contract را می‌توان اصلاح کرد.

بعد از freeze واقعی:

```text
additive changes preferred
breaking change → explicit version/migration
```

---

# 277. Freeze Date/Version

پس از تکمیل:

```text
API Contract Version: 1.0.0
API Runtime Version: v1
OpenAPI Version: actual generated version
```

ثبت کن.

---

# 278. Contract Changelog

فایل:

```text
/docs/api-changelog.md
```

بساز.

هر تغییر بعدی:

```text
what changed
why
breaking?
frontend impact
migration
```

---

# 279. API ADRs

اگر تصمیم مهمی گرفته شد، ADR ثبت کن:

```text
why cursor pagination
why current response envelope
why auth cookie design
why dynamic filter grammar
why selected money representation
why selected localization mechanism
```

---

# 280. API Audit Report

در پایان:

```text
/docs/api-contract-audit.md
```

باید شامل:

```text
Executive summary
Architecture
Endpoint inventory
DTO inventory
Error inventory
Auth flow
Search contract
Media contract
Admin contract
OpenAPI status
Security findings
Performance findings
Breaking changes
Known limitations
Frontend readiness
```

باشد.

---

# 281. Contract Freeze Checklist

تمام موارد زیر باید PASS شوند:

```text
✅ all routes inventoried
✅ all public routes documented
✅ all protected routes documented
✅ all admin routes documented
✅ all DTOs explicit
✅ all enum values explicit
✅ nullability audited
✅ response envelopes consistent
✅ errors stable
✅ field validation documented
✅ auth flow tested
✅ cookies tested
✅ CORS tested
✅ refresh rotation tested
✅ IDOR tested
✅ search tested
✅ dynamic filters tested
✅ pagination tested
✅ media tested
✅ favorites tested
✅ reports tested
✅ contacts tested
✅ moderation tested
✅ analytics tested
✅ OpenAPI generated
✅ OpenAPI valid
✅ operationIds unique
✅ schema refs valid
✅ real responses match OpenAPI
✅ OpenAPI examples valid
✅ frontend handoff docs complete
```

---

# 282. Do Not Declare Done If

```text
❌ OpenAPI says one thing, runtime returns another
❌ DTO says nullable=false but runtime can return null
❌ frontend needs to infer field meanings
❌ cookie flow only works in localhost but deployment contract unknown
❌ refresh token can be read by JS
❌ public API exposes private fields
❌ public listing search leaks inactive ads
❌ arbitrary filters reach SQL
❌ cursor pagination is unstable
❌ media response lacks stable URLs
❌ error codes are inconsistent
❌ field-level validation cannot be mapped
❌ admin authorization relies only on hidden UI
❌ tests cover only happy paths
❌ undocumented routes exist
```

---

# 283. Phase Execution Protocol

برای هر phase:

```text
1. Inspect
2. Identify affected files
3. Write plan
4. Implement smallest required change
5. Format
6. Lint
7. Typecheck
8. Unit tests
9. Integration tests
10. E2E tests
11. Security tests where relevant
12. Build
13. Generate OpenAPI
14. Validate OpenAPI
15. Update documentation
16. Review diff
17. Stop if failed
```

---

# 284. Phase 0 — Repository/API Reconnaissance

انجام بده:

```text
route inventory
DTO inventory
controller inventory
service inventory
Prisma schema inspection
migration status
OpenAPI generation
auth bootstrap
cookie settings
CORS settings
global validation
error handling
media routes
admin routes
test inventory
```

خروجی:

```text
/docs/api-contract-audit.md
```

STOP اگر architecture conflict جدی وجود دارد.

---

# 285. Phase 1 — Common Contract Foundation

Freeze:

```text
response envelope
error envelope
requestId
HTTP status policy
date serialization
nullability conventions
API version
naming conventions
pagination metadata
```

Tests.

---

# 286. Phase 2 — Authentication Contract

Freeze:

```text
register
OTP
login
refresh
logout
sessions
password
phone
me
cookies
CORS
CSRF policy
```

Tests.

---

# 287. Phase 3 — Categories/Locations Contract

Freeze:

```text
category DTOs
tree
translations
filter schema
attribute values
province
city
localization
```

Tests.

---

# 288. Phase 4 — Listings Contract

Freeze:

```text
list
search
sort
cursor
card DTO
detail DTO
create
update
submit
approve/reject
sold
archive
renew
version conflict
rejection
```

Tests.

---

# 289. Phase 5 — Media Contract

Freeze:

```text
upload
variants
primary
order
delete
limits
mime
errors
```

Tests.

---

# 290. Phase 6 — Buyer/Seller Interaction Contract

Freeze:

```text
seller profile
contact
favorite
report
```

Tests.

---

# 291. Phase 7 — Admin Contract

Freeze:

```text
users
moderation
reports
categories
locations
audit
analytics
permissions
```

Tests.

---

# 292. Phase 8 — Security Hardening

Audit:

```text
IDOR
mass assignment
privilege escalation
OTP abuse
refresh reuse
rate limits
upload security
search abuse
CORS
CSRF
logging
privacy
```

Add missing tests.

---

# 293. Phase 9 — Performance/Resilience

Audit:

```text
N+1
payload size
cursor queries
timeouts
transactions
race conditions
file processing
cache headers
```

Run measured tests.

---

# 294. Phase 10 — OpenAPI Finalization

Generate:

```text
openapi.json/yaml
```

Validate:

```text
paths
operationIds
schemas
responses
security
multipart
examples
refs
```

---

# 295. Phase 11 — Frontend Contract Package

Produce:

```text
/docs/frontend-api-contract.md
/docs/frontend-error-map.md
/docs/openapi.json or yaml
/docs/api-changelog.md
/docs/api-contract-audit.md
```

اگر repository convention متفاوت است، همان convention را رعایت کن.

---

# 296. Phase 12 — Final Freeze Audit

مقایسه کن:

```text
Backend Master
+
API Contract Master
+
Database implementation
+
OpenAPI
+
Runtime behavior
+
Tests
```

و نتیجه را ثبت کن.

---

# 297. Final PASS Criteria

PASS فقط وقتی مجاز است که:

```text
API is predictable
API is secure
API is documented
API is typed-contract ready
OpenAPI matches runtime
Frontend can consume it without guessing
```

باشد.

---

# 298. Final Handoff Command

بعد از completion، داخل repository یک فایل:

```text
/docs/api-freeze-summary.md
```

بساز.

در آن بنویس:

```text
API version
OpenAPI version
OpenAPI file
base URL configuration
auth transport
cookie name/policy
common headers
all endpoint groups
pagination
search grammar
dynamic attributes
media
errors
roles
rate limits
cache policy
known limitations
breaking decisions
frontend instructions
```

---

# 299. Final Agent Instruction

در تمام مراحل:

```text
Do not guess.
Inspect actual code.
Do not invent API fields.
Do not invent business rules.
Do not expose Prisma models.
Do not weaken security.
Do not hide contract mismatches.
Do not over-engineer.
Do not install infrastructure without need.
Do not break working modules without reason.
Do not skip failure-path tests.
Do not declare success from build alone.
```

اگر mismatch پیدا شد:

```text
Find
→ Explain
→ Fix
→ Test
→ Regenerate OpenAPI
→ Revalidate
→ Document
```

---

# 300. Final Deliverables

در پایان باید این خروجی‌ها وجود داشته باشند:

```text
1. Working API implementation
2. Updated DTOs
3. Updated OpenAPI decorators/schemas
4. Valid generated OpenAPI document
5. API contract audit
6. Frontend API contract document
7. Frontend error map
8. API changelog
9. Contract tests
10. Integration/E2E tests
11. Security tests
12. Smoke test
13. Documentation of auth/cookies/CORS
14. Documentation of search/filter grammar
15. Documentation of pagination
16. Documentation of media
17. Documentation of admin permissions
18. Known limitations
19. Final freeze summary
```

---

# 301. Important Implementation Constraint — Do Not Restart Backend

اگر repository قبلاً Backend Master را تا بخش زیادی اجرا کرده است، این prompt باید به عنوان:

```text
AUDIT + CONTRACT FREEZE + GAP IMPLEMENTATION
```

اجرا شود.

نه:

```text
REBUILD BACKEND FROM SCRATCH
```

اول existing implementation را preserve کن.

---

# 302. Important Database Constraint

Database فعلی قبلاً داخل Backend Master طراحی و اجرا شده است.

این prompt یک Database Master جدید نیست.

فقط در صورتی migration بساز که:

```text
API contract correctness
security
integrity
performance
```

بدون آن قابل تضمین نباشد.

هر migration باید:

```text
minimal
backward-aware
tested
documented
```

باشد.

---

# 303. Final Relationship to Frontend Master

بعد از PASS این سند:

```text
Backend
   ↓
API Contract Freeze
   ↓
OpenAPI
   ↓
Frontend Master v4
   ↓
Frontend implementation
```

Frontend Master نباید قبل از این freeze نهایی شود.

---

# 304. Source/Research Principles Used

این سند در موارد استاندارد از منابع رسمی زیر الهام گرفته است:

- OpenAPI Specification — specification of API surface, operations, parameters, responses and security.
- NestJS OpenAPI documentation — Swagger/OpenAPI decorators and generated API metadata.
- RFC 9457 — machine-readable HTTP problem details as a general API error-design reference.
- MDN — browser cookie, HttpOnly, Secure, SameSite, credentialed CORS behavior.

WeshBazar's existing response-envelope/error-code architecture is intentionally preserved rather than replaced merely for standards conformity.

---

# 305. Absolute Final Command

**Implement the API contract above against the existing WeshBazar backend. Do not rebuild the backend. Inspect first. Reconcile actual implementation, database, tests and OpenAPI. Implement only the gaps required to make the contract complete, secure, predictable and Frontend-ready. Generate and validate the final OpenAPI document. Add contract, integration, E2E and security coverage. Produce the required handoff documents. Stop and fix every contract mismatch before declaring PASS. The final result must allow a Next.js + TypeScript Frontend Agent to build WeshBazar without inventing endpoint names, request shapes, response fields, authentication behavior, error handling, search grammar, pagination, media behavior or business rules.**

---

# END OF WESHBAZAR API CONTRACT MASTER ENGINEERING SPECIFICATION v1
