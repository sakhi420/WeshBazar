---.windsurf
# WeshBazar Backend

## Master Engineering Specification & Step-by-Step Build Prompt

**Project:** WeshBazar
**Product Type:** Afghanistan-focused C2C marketplace
**Backend Architecture:** Production-minded Modular Monolith
**API Style:** REST
**API Version:** `/api/v1`
**Primary Language:** TypeScript
**Runtime:** Node.js Active LTS
**Framework:** NestJS
**HTTP Adapter:** Fastify
**Database:** PostgreSQL
**ORM:** Prisma
**Authentication:** JWT access token + rotating refresh sessions
**Password Hashing:** Argon2id
**API Documentation:** OpenAPI / Swagger
**Validation:** class-validator / class-transformer for DTOs + explicit schema validation for dynamic category attributes
**Logging:** Pino / structured logging
**Testing:** Jest + Supertest + real PostgreSQL integration tests
**Scheduling:** NestJS Schedule
**Security:** Helmet, CORS, rate limiting, strict validation, authorization, secure file handling
**Containers:** Docker / Docker Compose
**Package Manager:** npm
**Code Quality:** ESLint + Prettier + Husky + lint-staged
**Repository:** Git / GitHub
**Future-ready integrations:** object storage, cache, queue, notifications, external search, analytics pipelines, payments, business accounts, messaging, geospatial services

---

# 0. ROLE AND PRIMARY INSTRUCTION

You are acting as a senior backend architect and production software engineer.

Your responsibility is to build the **WeshBazar backend**, not a toy CRUD API.

The backend must be:

* correct before clever
* secure by default
* modular
* testable
* observable
* maintainable
* documented
* incrementally deployable
* resistant to common marketplace abuse
* easy to extend without rewriting existing modules

The system must begin as a **modular monolith**.

Do NOT prematurely split the system into microservices.

The architecture must, however, establish clean module boundaries and external-provider abstractions so that specific modules can be extracted later if real scale or organizational requirements justify it.

---

# 1. NON-NEGOTIABLE PRODUCT SCOPE

WeshBazar is a C2C marketplace.

Users can:

* browse listings without an account
* search listings
* filter listings
* view listing details
* view seller information
* contact sellers directly
* save listings to favorites after authentication
* report suspicious listings after authentication
* register as sellers
* create listings
* edit listings
* publish listings
* mark listings as sold
* archive listings

The initial platform does NOT process the transaction between buyer and seller.

The initial platform does NOT provide:

* payment processing
* wallet
* commission
* escrow
* shipping
* logistics
* delivery tracking
* internal buyer/seller chat
* bidding
* auction system
* cryptocurrency
* marketplace checkout
* mobile application backend-specific features beyond keeping APIs reusable
* AI moderation
* recommendation engine
* Elasticsearch/OpenSearch
* Redis
* Kafka
* RabbitMQ
* Kubernetes
* microservices

These capabilities may be added later through isolated modules.

Do not implement them now merely for the sake of being "future-proof".

Future-proofing means designing boundaries and extension points, not installing unnecessary infrastructure.

---

# 2. ENGINEERING PHILOSOPHY

Follow these principles throughout the entire implementation.

## 2.1 Build the smallest correct version

Do not over-engineer.

Do not create abstractions that provide no real benefit.

Do not create:

* generic CRUD factories
* generic repository abstractions for every Prisma model
* unnecessary CQRS
* unnecessary event buses
* unnecessary design patterns
* unnecessary interfaces around simple internal functions

Use abstractions where they create genuine future flexibility, especially at:

* storage providers
* SMS providers
* notification providers
* search providers
* cache providers
* job/queue providers
* analytics providers
* moderation providers
* payment providers
* external integrations

---

## 2.2 Business rules must not live only inside controllers

Controllers should:

* receive HTTP input
* validate DTOs
* authenticate / authorize
* call application services
* return DTOs

Controllers must NOT contain substantial business logic.

Business rules belong in the appropriate application/domain layer.

---

## 2.3 Prisma must not leak everywhere

Do not access Prisma directly from controllers.

Prefer:

```text
Controller
    ↓
Application Service
    ↓
Domain / Business Rules
    ↓
Repository or Data Access Adapter
    ↓
Prisma
    ↓
PostgreSQL
```

A repository abstraction is required only where it improves module boundaries or testing.

Do not create a giant generic repository framework.

---

## 2.4 External services must be behind ports/adapters

Examples:

```text
SmsProvider
StorageProvider
NotificationProvider
SearchProvider
CacheProvider
JobQueueProvider
ModerationProvider
AnalyticsProvider
```

The MVP implementation can be:

```text
MockSmsProvider
LocalStorageProvider
PostgresSearchProvider
InMemoryRateLimitStore
InProcessJobScheduler
DatabaseAnalyticsProvider
```

Later implementations can be added without changing business logic.

---

# 3. TECHNOLOGY STACK

Use the following stack unless the existing repository contains a technically necessary and well-justified constraint.

## Core

```text
Node.js Active LTS
TypeScript
NestJS
Fastify
PostgreSQL
Prisma
npm
```

## API

```text
REST
OpenAPI
Swagger
/api/v1
```

## Security

```text
Argon2id
JWT
Helmet
CORS
Rate limiting
Secure cookies where appropriate
Strict input validation
```

## Validation

```text
class-validator
class-transformer
Explicit dynamic attribute schema validation
```

## Logging

```text
Pino
Structured JSON logs
Request IDs
```

## Testing

```text
Jest
Supertest
PostgreSQL integration tests
E2E tests
```

Use real PostgreSQL for integration/e2e database behavior.

Do not replace all database tests with mocks.

## Development and operations

```text
Docker
Docker Compose
Git
GitHub
ESLint
Prettier
Husky
lint-staged
NestJS Schedule
```

## File handling

Use:

```text
@fastify/multipart
sharp
```

for image upload and processing.

Create a storage abstraction so local disk can later be replaced by an S3-compatible provider.

---

# 4. VERSION MANAGEMENT

Do NOT use dependency versions such as:

```text
latest
```

for production dependencies.

Use compatible stable versions, then pin the resolved versions in:

```text
package.json
package-lock.json
.nvmrc
```

Use the Node.js Active LTS available in the build environment and pin the resolved version.

Before installing or upgrading Prisma/NestJS dependencies, inspect the versions already present in the environment/repository and use APIs compatible with those exact versions.

Do not blindly copy outdated Prisma or NestJS syntax from old tutorials.

---

# 5. REPOSITORY STRUCTURE

If the repository is empty, prefer:

```text
weshbazar/
│
├── apps/
│   └── api/
│
├── docs/
│
├── docker/
│
├── prisma/
│
├── scripts/
│
├── .github/
│   └── workflows/
│
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
├── package-lock.json
├── README.md
└── .nvmrc
```

If the repository already contains a working project, inspect it first and preserve valid existing work.

Do not destroy or rewrite unrelated code.

If the project is already a monorepo, adapt the structure rather than rebuilding it.

The API should internally use:

```text
src/
├── common/
├── config/
├── database/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── sellers/
│   ├── categories/
│   ├── locations/
│   ├── listings/
│   ├── media/
│   ├── favorites/
│   ├── reports/
│   ├── moderation/
│   ├── admin/
│   ├── analytics/
│   └── health/
├── app.module.ts
└── main.ts
```

Each substantial module may internally use:

```text
module/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

Do not create layers merely to satisfy architecture vocabulary. Use them when they improve separation.

---

# 6. DEPENDENCY RULES

Enforce these rules:

```text
common
  ↓
modules

modules must not depend on controllers of other modules.

controllers
  ↓
application services

application services
  ↓
domain rules / module interfaces

infrastructure
  ↓
Prisma / external providers
```

Avoid circular dependencies.

Do not allow:

```text
ListingController → Prisma
UserController → Prisma
AdminController → random module internals
```

Do not import private internals of another module.

Each module must expose a small public application API where necessary.

---

# 7. GLOBAL APPLICATION FOUNDATION

Implement the following before business modules.

## 7.1 Application bootstrap

Configure:

* Fastify
* global prefix `/api/v1`
* graceful shutdown
* environment validation
* CORS
* Helmet
* JSON/body limits
* multipart limits
* request ID
* structured logging
* global validation
* global exception handling
* Swagger
* health checks

---

## 7.2 Environment validation

Create strongly validated configuration.

At minimum:

```text
NODE_ENV
PORT
DATABASE_URL

JWT_ACCESS_SECRET
JWT_REFRESH_SECRET

ACCESS_TOKEN_EXPIRES_IN
REFRESH_TOKEN_EXPIRES_IN

CORS_ALLOWED_ORIGINS

STORAGE_PROVIDER
LOCAL_STORAGE_PATH

MAX_UPLOAD_SIZE
MAX_IMAGES_PER_LISTING

OTP_EXPIRES_IN
OTP_MAX_ATTEMPTS
OTP_RESEND_COOLDOWN

MAX_LOGIN_ATTEMPTS_PER_WINDOW
MAX_REGISTER_ATTEMPTS_PER_WINDOW

MAX_LISTINGS_PER_USER
MAX_LISTING_TITLE_LENGTH
MAX_LISTING_DESCRIPTION_LENGTH

TRUSTED_PROXY
```

Do not allow the application to start with invalid critical configuration.

Do not expose secret values in errors.

---

# 8. STANDARD API CONTRACT

Every endpoint must follow consistent response conventions.

## Success

Use:

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "requestId": "..."
}
```

`meta` is optional.

## Error

Use:

```json
{
  "success": false,
  "error": {
    "code": "LISTING_NOT_FOUND",
    "message": "Listing not found.",
    "details": {}
  },
  "requestId": "..."
}
```

The frontend must depend on:

```text
error.code
```

not on human-readable message strings.

Messages may change or become localized later.

---

# 9. HTTP STATUS POLICY

Use appropriate status codes consistently.

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

Do not leak implementation details.

Never return stack traces in production.

---

# 10. REQUEST IDENTIFICATION

Every request must receive a request ID.

Accept an incoming:

```text
X-Request-ID
```

when allowed by configuration.

Otherwise generate a secure unique ID.

Return the request ID in:

```text
X-Request-ID
```

and in the API envelope.

Include the request ID in structured logs.

Never log passwords, JWTs, refresh tokens, OTPs, or password reset tokens.

---

# 11. TIME AND DATE POLICY

Store all timestamps in PostgreSQL as timezone-aware timestamps.

Use UTC internally.

Never use local Afghanistan time as storage logic.

Frontend presentation can convert timestamps to local timezone.

---

# 12. ID POLICY

Use UUID primary keys unless there is a concrete reason not to.

Never expose sequential database IDs for public security-sensitive objects.

Listings also receive an immutable SEO-friendly slug.

Example:

```text
iphone-13-pro-max-a83kd2
```

Do not automatically change a listing slug every time the title changes.

Once published, keep the slug stable unless an explicit administrative action changes it.

If a title cannot produce a valid slug, use a safe fallback such as:

```text
listing-a83kd2
```

---

# 13. DATABASE DESIGN

Use PostgreSQL.

Do not store image binaries inside PostgreSQL.

Do not use MongoDB for this architecture.

Prisma is the application ORM.

Use proper foreign keys, constraints, unique indexes, and indexes.

Do not rely only on application validation when the database can enforce an invariant.

---

# 14. CORE DATABASE ENTITIES

The primary entities are:

```text
User
SellerAccount
RefreshSession
VerificationChallenge
PasswordResetToken

Category
CategoryAttribute
CategoryAttributeOption

Province
City

Listing
ListingRevision
ListingImage
ListingContactMethod

Favorite
Report

ModerationAction
AuditLog

ListingDailyStat
```

Additional infrastructure tables may be introduced only when needed.

---

# 15. USER MODEL

Implement a User model conceptually containing:

```text
id
phone
phoneNormalized
passwordHash
displayName
role
status

phoneVerifiedAt

avatarKey (nullable)

failedLoginAttempts
lockedUntil (nullable)

createdAt
updatedAt
deletedAt (nullable)
```

Roles initially:

```text
USER
MODERATOR
ADMIN
```

The authorization architecture must be able to support future roles such as:

```text
SUPER_ADMIN
SUPPORT
VERIFIER
```

without redesigning every controller.

User status should support:

```text
ACTIVE
SUSPENDED
BANNED
DEACTIVATED
```

Do not represent suspension only by `isActive`.

---

# 16. PHONE NUMBER NORMALIZATION

Phone numbers must be normalized before authentication logic.

Store one canonical representation.

Prefer E.164-style normalization.

Use a reliable phone-number parsing/normalization library.

Never use raw user-entered formatting as the uniqueness key.

For example, equivalent representations of an Afghanistan number must not accidentally produce multiple accounts.

---

# 17. AUTHENTICATION ARCHITECTURE

Authentication must support:

```text
Register
Phone verification
Login
Refresh
Logout current session
Logout all sessions
Change password
Forgot password
Reset password
Change phone
Session management
Current user
```

---

# 18. REGISTRATION FLOW

Recommended flow:

```text
POST /auth/register
        ↓
Create account in limited/unverified state
        ↓
Create verification challenge
        ↓
Send OTP
        ↓
POST /auth/verify-phone
        ↓
Activate verified account
```

A user must have a verified phone before publishing listings.

You may permit creating drafts before verification if useful.

Do not allow unverified accounts to bypass verification through alternate endpoints.

---

# 19. PASSWORD SECURITY

Use:

```text
Argon2id
```

Never:

```text
SHA256(password)
MD5
plain text
reversible encryption
```

Password requirements must be centralized and configurable.

Never return password hashes.

Never log password data.

After password reset or a security-sensitive password change:

```text
revoke all existing refresh sessions
```

or apply the documented security policy.

---

# 20. REFRESH SESSION MODEL

Do NOT store raw refresh tokens.

Store:

```text
tokenHash
```

and session metadata.

Recommended fields:

```text
id
userId
familyId
tokenHash

createdAt
lastUsedAt
expiresAt
revokedAt

replacedBySessionId

ipAddress
userAgent
deviceName
```

Implement:

```text
refresh token rotation
session revocation
session expiration
reuse detection
session family tracking
```

If a previously rotated token is reused:

1. detect the reuse
2. revoke the affected token family
3. require re-authentication
4. record a security/audit event

Do not silently accept reused refresh tokens.

---

# 21. WEB TOKEN TRANSPORT

For browser clients:

Prefer:

```text
short-lived access token
+
HttpOnly Secure refresh cookie
```

Do not tell the frontend to store refresh tokens in localStorage.

The web authentication design must account for:

* SameSite policy
* CORS
* HTTPS
* CSRF risk
* cookie domain
* cookie path
* trusted origins

For non-browser future clients, keep the auth service transport-agnostic.

---

# 22. OTP / VERIFICATION CHALLENGES

Implement a generic verification challenge rather than a hard-coded register-only OTP table.

Conceptually:

```text
VerificationChallenge
---------------------
id
userId nullable
phone
purpose
codeHash
expiresAt
attempts
maxAttempts
createdAt
usedAt
resendAvailableAt
```

Purposes:

```text
REGISTER
CHANGE_PHONE
PASSWORD_RESET
```

Future purposes may be added.

Never store raw OTP codes.

OTP rules:

* short expiration
* maximum attempts
* resend cooldown
* per-phone rate limit
* per-IP rate limit
* per-user rate limit
* invalidate after successful use
* invalidate older challenge when appropriate
* never reveal whether a phone is already registered through public error wording

In development only, the mock SMS provider may expose the OTP in development logs.

Never log OTPs in production.

---

# 23. PASSWORD RESET

Implement:

```text
POST /auth/forgot-password
POST /auth/reset-password
```

Use short-lived, one-time reset tokens.

Store token hashes, never raw tokens.

Do not reveal whether the account exists.

Resetting a password must invalidate appropriate refresh sessions.

---

# 24. SESSION MANAGEMENT

Implement:

```text
GET /auth/sessions
DELETE /auth/sessions/:sessionId
POST /auth/logout
POST /auth/logout-all
```

A user can revoke their own session.

An admin must not receive raw tokens.

The user must not be able to revoke another user's session.

---

# 25. SELLER ACCOUNT ABSTRACTION

Do NOT make Listing directly reference User as the only seller concept.

Use:

```text
SellerAccount
```

This is intentionally introduced now to make future business accounts possible without changing the fundamental Listing ownership model.

Initial type:

```text
INDIVIDUAL
```

Future types may include:

```text
BUSINESS
STORE
ORGANIZATION
```

Initial SellerAccount fields:

```text
id
ownerUserId
type
displayName
slug
bio nullable
status
createdAt
updatedAt
```

Create one individual seller account for an eligible user.

Future business accounts can add membership and staff permissions without replacing `Listing.sellerAccountId`.

---

# 26. SELLER PROFILE

Public seller information must use a dedicated safe DTO.

Public information can include:

```text
displayName
slug
memberSince
phoneVerified indicator
activeListingCount
```

Do NOT expose:

```text
passwordHash
refresh sessions
internal IDs
security metadata
admin information
private verification information
raw authentication secrets
```

Seller phone exposure must be controlled by listing contact settings.

---

# 27. CATEGORY ARCHITECTURE

Categories must support hierarchy.

Example:

```text
Electronics
 ├── Mobile Phones
 ├── Laptops
 ├── Tablets
 └── Cameras

Vehicles
 ├── Cars
 ├── Motorcycles
 └── Other Vehicles

Home
 ├── Appliances
 ├── Furniture
 └── Home Accessories
```

Category fields:

```text
id
parentId nullable
slug
status
sortOrder
iconKey nullable
moderationMode
createdAt
updatedAt
```

Statuses:

```text
ACTIVE
INACTIVE
ARCHIVED
```

Do not physically delete categories that are referenced by historical listings.

Archive instead.

Prevent:

* cycles in category hierarchy
* duplicate slugs
* invalid parent relationships
* moving a category below itself
* invalid deletion of referenced categories

---

# 28. CATEGORY LOCALIZATION

Do not hard-code category labels throughout the backend.

Design category labels so the system can support:

```text
en
fa-AF
ps-AF
```

without changing category identities.

Use a translation structure or a carefully designed localization model.

Do not duplicate business logic for each language.

Error codes remain language-neutral.

---

# 29. DYNAMIC CATEGORY ATTRIBUTE ENGINE

This is a core WeshBazar feature.

Do not hard-code product-specific fields inside the Listing table.

Examples:

Mobile:

```text
brand
model
ram
storage
batteryHealth
```

Car:

```text
brand
model
year
mileage
transmission
fuel
color
```

The system must store category-specific definitions.

---

# 30. CATEGORY ATTRIBUTE MODEL

Conceptually:

```text
CategoryAttribute
-----------------
id
categoryId
key
label
type

required
filterable
searchable

unit nullable
placeholder nullable

minValue nullable
maxValue nullable
minLength nullable
maxLength nullable
pattern nullable

sortOrder
isActive

createdAt
updatedAt
```

Attribute types should remain intentionally small and useful:

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

Do not create dozens of types unless a real requirement appears.

---

# 31. ATTRIBUTE OPTIONS

For:

```text
SELECT
MULTI_SELECT
```

use:

```text
CategoryAttributeOption
-----------------------
id
attributeId
value
label
sortOrder
isActive
```

Avoid embedding critical business metadata as arbitrary frontend-controlled JSON.

---

# 32. ATTRIBUTE VALIDATION

When a seller creates or updates a listing:

1. load the effective category attribute schema
2. determine all inherited attributes if the category has a parent
3. validate the provided attributes
4. reject unknown keys
5. enforce required fields
6. enforce types
7. enforce numeric ranges
8. enforce string lengths
9. enforce regex where configured
10. validate select values
11. validate multi-select values
12. reject inactive options
13. reject attributes that are not allowed for the category

Example invalid payload:

```json
{
  "ram": "banana",
  "storage": 999999999999
}
```

must not be accepted merely because the outer property is valid JSON.

---

# 33. ATTRIBUTE EVOLUTION RULE

Do not change the semantic meaning of an attribute used by existing listings in-place.

Do not:

```text
change "ram" from integer to string
```

while existing listings depend on the old definition.

Prefer:

```text
new attribute
or
attribute deactivation
or
controlled attribute evolution
```

Historical listings must remain readable.

This rule exists specifically to prevent future schema migrations from corrupting marketplace data.

---

# 34. ATTRIBUTE FILTERING

Only attributes marked:

```text
filterable = true
```

may be used in discovery filters.

Never accept arbitrary attribute keys and blindly turn them into SQL conditions.

Whitelist all dynamic filtering against category definitions.

Supported operations should include only appropriate operations for each type.

For example:

```text
TEXT:
  eq
  contains

SELECT:
  eq
  in

MULTI_SELECT:
  contains
  in

INTEGER / DECIMAL / YEAR:
  eq
  gte
  lte
  in

BOOLEAN:
  eq

DATE:
  eq
  gte
  lte
```

Limit the number of dynamic filters in a single request.

---

# 35. CATEGORY FILTER SCHEMA API

Provide an API from which the frontend can obtain the correct filter definition.

Example:

```text
GET /api/v1/categories/:categoryId/filter-schema
```

The frontend must not hard-code every category's filter structure.

Return:

```text
field
label
type
options
min
max
unit
required
filterable
```

This is critical for future category growth.

---

# 36. LOCATION MODEL

Use:

```text
Province
City
```

with:

```text
Province
--------
id
code
slug
status
sortOrder

City
----
id
provinceId
slug
status
sortOrder
```

Names must support localization.

Do not duplicate province strings throughout listings.

Every city must belong to exactly one province.

The backend must verify that the selected city belongs to the selected province.

---

# 37. LOCATION FUTURE EXTENSION

Do not implement map/geospatial functionality yet.

However, isolate location logic so future support can add:

```text
district
area
approximate coordinates
radius search
map providers
PostGIS
```

without changing Listing ownership or API architecture.

Do not expose a seller's exact private residential location by default.

---

# 38. LISTING DATA MODEL

Conceptually:

```text
Listing
-------
id

sellerAccountId
categoryId
provinceId
cityId

slug

title
description

price nullable
currency
pricingType
negotiable

condition

status

views
favoriteCount

publishedAt
soldAt
archivedAt
expiresAt

version

searchText

createdAt
updatedAt
deletedAt nullable
```

Pricing:

```text
PAID
FREE
CONTACT
```

For:

```text
PAID
```

price must be valid.

For:

```text
FREE
```

price should be null.

For:

```text
CONTACT
```

price may be null.

Currency should initially use:

```text
AFN
```

but avoid architecting the database in a way that makes future currencies impossible.

Do not use floating point for money.

---

# 39. LISTING CONDITION

Use a controlled enum such as:

```text
NEW
LIKE_NEW
GOOD
FAIR
```

Category-specific condition details can later be handled by dynamic attributes.

Do not invent dozens of overlapping condition values.

---

# 40. LISTING STATE MACHINE

Listing lifecycle:

```text
DRAFT
  ↓
PENDING_REVIEW
  ↓
ACTIVE
  ├──→ SOLD
  └──→ ARCHIVED

REJECTED
  ↓
DRAFT
```

Allow an archived listing to become a draft again only through an explicit republish flow.

Do not allow arbitrary status mutation from the client.

The API must implement explicit transition rules.

Never allow:

```text
POST /listings/:id
{
  "status": "ACTIVE"
}
```

as a generic mass-assignment field.

---

# 41. LISTING TRANSITION RULES

Implement explicit application commands/actions such as:

```text
createDraft
submitForReview
approve
reject
markSold
archive
renew
```

Do not expose arbitrary status updates.

Examples:

```text
DRAFT → PENDING_REVIEW
PENDING_REVIEW → ACTIVE
PENDING_REVIEW → REJECTED
REJECTED → DRAFT
ACTIVE → SOLD
ACTIVE → ARCHIVED
ARCHIVED → DRAFT
```

Invalid transitions must return stable error codes.

---

# 42. ACTIVE LISTING EDIT POLICY

Editing an active listing is not equivalent to editing a draft.

At minimum, material changes such as:

```text
title
description
price
category
location
attributes
images
contact configuration
```

must trigger the documented moderation workflow.

The implementation may move the listing back to:

```text
PENDING_REVIEW
```

after material changes.

Do not silently change sensitive listing data while bypassing moderation.

The code must make this policy explicit.

---

# 43. LISTING VERSIONING

Use an integer `version` on listings.

Increment it on successful mutation.

Use the version to reduce lost-update problems.

When appropriate, the client can provide:

```text
expectedVersion
```

and the backend rejects a stale update with:

```text
LISTING_VERSION_CONFLICT
```

This provides optimistic concurrency without locking the system.

---

# 44. LISTING REVISION HISTORY

Implement a lightweight revision history.

Conceptually:

```text
ListingRevision
---------------
id
listingId
version
changeType
snapshot
attributeSchemaReference
createdByUserId
createdAt
```

The snapshot can contain the important seller-facing listing state.

Purpose:

* moderation traceability
* recovery
* audit
* future revision system
* debugging
* controlled rollback

Do not use revision history as an excuse to duplicate every unrelated database record.

Images should remain separately managed.

---

# 45. LISTING CREATION RULES

Creating a listing requires:

```text
authenticated user
active seller account
verified phone before publishing
valid category
valid province/city
valid title
valid description
valid pricing
valid condition
valid dynamic attributes
```

The system must enforce user listing limits.

All configurable limits must come from configuration, not hard-coded magic numbers.

---

# 46. LISTING QUALITY VALIDATION

Define limits such as:

```text
title min/max length
description min/max length
max images
max upload size
max active listings
max pending listings
max attribute count
max filter count
```

These must be configurable.

Text must be treated as plain text.

Do not accept arbitrary HTML in listing title or description.

Normalize Unicode safely without destroying legitimate user text.

---

# 47. SEARCH TEXT NORMALIZATION

Create a reusable normalization service for marketplace text.

It should account for common Persian/Arabic inconsistencies such as:

```text
ي / ی
ك / ک
Arabic vs Persian digits
zero-width characters
repeated whitespace
```

The backend should maintain a normalized `searchText` representation.

Do not store raw private information in search indexes.

---

# 48. DATABASE SEARCH STRATEGY

MVP search uses PostgreSQL.

Use appropriate indexing, including:

```text
pg_trgm
GIN/GiST where appropriate
B-tree indexes
JSONB indexes where justified
```

Use PostgreSQL full-text/search capabilities where useful, but do not assume English stemming is sufficient for Persian/Dari.

For marketplace title matching, trigram/normalized text search may be more reliable for the initial system.

Do not install Elasticsearch/OpenSearch now.

Create a `SearchProvider` abstraction so an external search engine can be introduced later without rewriting listing APIs.

---

# 49. PUBLIC LISTING DISCOVERY API

Provide:

```text
GET /api/v1/listings
```

Supported core filters:

```text
q
category
province
city
minPrice
maxPrice
condition
sort
```

Plus dynamic category filters.

Example conceptual request:

```text
GET /api/v1/listings
    ?category=mobile-phones
    &province=balkh
    &city=mazar-e-sharif
    &minPrice=10000
    &maxPrice=30000
    &filter=ram:gte:8
    &filter=storage:in:128,256
    &sort=newest
```

Do not allow arbitrary SQL or arbitrary JSON path expressions from the client.

---

# 50. SEARCH SORTS

Initially support a controlled list such as:

```text
newest
price_asc
price_desc
most_viewed
```

Every sort must have a stable secondary ordering.

Example:

```text
createdAt DESC
id DESC
```

Do not allow clients to supply arbitrary database column names.

---

# 51. PAGINATION STRATEGY

Use:

```text
cursor pagination
```

for public high-volume discovery feeds where practical.

Use:

```text
page + limit
```

for admin dashboards where total counts are useful.

Public API example:

```json
{
  "data": [],
  "meta": {
    "hasNext": true,
    "nextCursor": "..."
  }
}
```

Admin API example:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 245,
    "totalPages": 13
  }
}
```

Apply maximum page/limit boundaries.

Never let clients request unlimited records.

---

# 52. PUBLIC LISTING DETAIL

Provide:

```text
GET /api/v1/listings/:slug
```

It must return:

```text
listing details
images
category
location
dynamic attributes
price
condition
seller safe profile
contact availability
created/published information
```

Do not return internal moderation metadata.

Do not return raw database objects.

Use explicit public DTOs.

---

# 53. LISTING CONTACT SYSTEM

Contact methods should be explicit.

Initial types:

```text
PHONE
WHATSAPP
TELEGRAM
```

Use:

```text
ListingContactMethod
--------------------
id
listingId
type
enabled
valueOverride nullable
createdAt
updatedAt
```

For phone/WhatsApp, the default may use the seller's verified phone.

For Telegram, validate the username/handle format.

Do not allow arbitrary dangerous URLs.

---

# 54. CONTACT ACTION API

Do not expose all contact data everywhere.

Provide a controlled endpoint such as:

```text
POST /api/v1/listings/:id/contact
```

Body:

```json
{
  "method": "WHATSAPP"
}
```

The backend:

1. verifies listing is active
2. verifies the contact method is enabled
3. verifies seller/account is eligible
4. applies rate limits
5. records the contact event
6. returns a sanitized contact target/action

Example response:

```json
{
  "success": true,
  "data": {
    "method": "WHATSAPP",
    "value": "..."
  }
}
```

This allows analytics and future anti-abuse controls without redesigning the API.

---

# 55. FAVORITES

Implement:

```text
POST /api/v1/favorites/:listingId
DELETE /api/v1/favorites/:listingId
GET /api/v1/me/favorites
```

Rules:

* authentication required
* only valid listings can be favorited
* duplicate favorite must be idempotent or return a predictable conflict behavior
* database unique constraint required

Use:

```text
UNIQUE(userId, listingId)
```

Do not rely only on frontend checks.

---

# 56. REPORTS

Reports are part of marketplace safety.

Initial reasons:

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

Conceptual fields:

```text
Report
------
id
reporterUserId
listingId nullable
reportedUserId nullable

reason
description

status

resolvedByUserId nullable
resolvedAt nullable
resolutionNote nullable

createdAt
updatedAt
```

Status:

```text
OPEN
UNDER_REVIEW
RESOLVED
DISMISSED
```

Ensure the model can later report targets other than listings without redesigning the entire moderation subsystem.

---

# 57. REPORT ABUSE PROTECTION

Protect report endpoints with:

* authentication
* verified phone requirement
* rate limiting
* reasonable description limits
* duplicate report prevention
* abuse logging

Do not permit one account to submit unlimited reports.

---

# 58. MODERATION

Moderation is a first-class backend capability.

Create:

```text
ModerationAction
```

with conceptual fields:

```text
id
listingId
adminUserId
action
reason
note
createdAt
```

Actions may include:

```text
APPROVE
REJECT
ARCHIVE
RESTORE
```

Rejection must have a machine-readable reason and optional human-readable note.

---

# 59. MODERATION QUEUE

Provide admin workflows for:

```text
pending listings
reported listings
rejected listings
suspicious users
```

Moderators must only see the actions their role is permitted to perform.

Do not allow arbitrary role escalation through request payloads.

---

# 60. USER MODERATION

Admins must be able to:

```text
suspend
ban
restore
```

users.

A suspension may contain:

```text
suspendedUntil
reason
```

A banned user must be prevented from performing protected marketplace actions.

When a user is suspended/banned:

* revoke appropriate sessions
* prevent publishing
* prevent contacting through protected APIs if policy requires
* determine documented behavior for existing listings
* record audit entry

Do not blindly delete historical records.

---

# 61. ADMIN RBAC

Use role-based authorization initially.

Roles:

```text
USER
MODERATOR
ADMIN
```

Authorization should be implemented through reusable guards/decorators/policies.

Do not scatter role strings throughout controllers.

Use permission mappings conceptually such as:

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

Future roles can map to these permissions.

---

# 62. AUDIT LOGGING

Admin/security-sensitive actions must generate immutable audit records.

Conceptually:

```text
AuditLog
--------
id
actorUserId nullable
action
entityType
entityId nullable
metadata
ipAddress
userAgent
createdAt
```

Examples:

```text
USER_SUSPENDED
USER_BANNED
USER_RESTORED
LISTING_APPROVED
LISTING_REJECTED
LISTING_ARCHIVED_BY_ADMIN
REPORT_RESOLVED
CATEGORY_UPDATED
ATTRIBUTE_UPDATED
LOCATION_UPDATED
SECURITY_SESSION_REVOKED
```

Audit logs are append-only.

Do not allow ordinary users to modify or delete audit records.

Do not put secrets into audit metadata.

---

# 63. IMAGE / MEDIA ARCHITECTURE

Images must be separate from listing records.

Use:

```text
ListingImage
-------------
id
listingId

storageKey
publicUrl or generated URL strategy

mimeType
size
width
height

checksum

sortOrder
isPrimary

createdAt
updatedAt
deletedAt nullable
```

Do not store raw image binaries in PostgreSQL.

---

# 64. STORAGE ABSTRACTION

Create:

```text
StorageProvider
```

with operations conceptually similar to:

```text
put
delete
exists/head
getPublicUrl
```

Possible implementations:

```text
LocalStorageProvider
S3CompatibleStorageProvider
```

Local storage is for development only.

Production storage should be object storage.

Do not hard-code S3-specific assumptions inside listing business logic.

---

# 65. SECURE IMAGE UPLOAD FLOW

Recommended flow:

```text
client
  ↓
upload endpoint
  ↓
request validation
  ↓
MIME/type inspection
  ↓
file size validation
  ↓
image metadata validation
  ↓
image decode
  ↓
image re-encode
  ↓
generate safe variants
  ↓
storage
  ↓
database metadata
```

Do not trust:

```text
file extension
Content-Type header
filename
```

alone.

Generate storage keys server-side.

Never use user-provided filenames directly as filesystem paths.

Prevent:

```text
path traversal
MIME spoofing
oversized uploads
pixel bombs
malformed images
```

---

# 66. IMAGE PROCESSING

Use `sharp`.

Generate useful variants such as:

```text
thumbnail
medium
large
```

Strip unnecessary metadata such as sensitive EXIF data where appropriate.

Do not expose raw local filesystem paths.

Store dimensions and checksum.

Avoid storing an unlimited number of image variants.

---

# 67. ORPHAN MEDIA CLEANUP

Support cleanup for:

```text
uploaded but unused media
failed listing creation
deleted images
abandoned drafts
```

A scheduled job should remove orphaned storage objects according to a safe retention window.

Never delete a file merely because it is not immediately referenced if a transaction or delayed processing flow may still reference it.

---

# 68. HEALTH CHECKS

Provide at minimum:

```text
GET /health/live
GET /health/ready
```

Liveness:

```text
process is alive
```

Readiness:

```text
database reachable
critical dependencies available
```

Do not make liveness depend on the database.

Optionally provide a protected metrics endpoint later.

---

# 69. SCHEDULED JOBS

Use NestJS Schedule initially.

Jobs should include:

```text
expire listings
archive stale drafts
clean expired verification challenges
clean expired refresh sessions
clean expired password reset records
clean orphan uploads
reconcile safe counters where necessary
```

Jobs must be:

* idempotent
* bounded
* observable
* safe to retry

Do not create jobs that silently modify arbitrary records.

When the platform grows to multiple application instances, scheduling must be revisited to prevent duplicate execution. At that point a distributed lock or queue can be introduced.

---

# 70. LISTING EXPIRATION

Listings should have:

```text
expiresAt
```

Default duration must be configurable.

Example lifecycle:

```text
ACTIVE
  ↓
expiresAt reached
  ↓
ARCHIVED
```

Provide a seller renewal action:

```text
POST /api/v1/listings/:id/renew
```

subject to business rules.

Do not hard-code an expiration period directly in multiple modules.

---

# 71. ANALYTICS

Marketplace analytics are important because registrations alone do not demonstrate marketplace health.

Track meaningful events such as:

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

Avoid storing unnecessary personal information in analytics.

---

# 72. LISTING DAILY STATISTICS

For MVP, use aggregated statistics rather than storing an unlimited raw event stream.

Conceptually:

```text
ListingDailyStat
----------------
id
listingId
date

views
phoneClicks
whatsappClicks
telegramClicks
favoriteAdds
reports

createdAt
updatedAt
```

Unique:

```text
(listingId, date)
```

Maintain fast counters on Listing where useful.

This architecture can later be replaced with:

```text
events
→ queue
→ analytics pipeline
→ warehouse
```

without changing the public analytics API.

---

# 73. VIEW COUNT POLICY

View counts are marketplace analytics, not financial records.

They may be approximate.

Prevent trivial abuse where practical through:

* client session identification
* request-level throttling
* reasonable deduplication
* rate limits

Do not store raw IP addresses indefinitely just to count views.

If fingerprinting is used, prefer short-lived or hashed representations and document the retention policy.

Do not let analytics complexity block the core marketplace.

---

# 74. SEARCH / ANALYTICS / CONTACT SEPARATION

Do not mix business logic for:

```text
listing discovery
contact tracking
analytics reporting
```

Keep them modular.

For example:

```text
Listings
Search
Analytics
Contact
```

can communicate through application services or internal events later.

This prevents the Listing module from becoming a giant monolith inside the monolith.

---

# 75. ERROR CODE CATALOG

Create a centralized error-code convention.

Examples:

```text
AUTH_INVALID_CREDENTIALS
AUTH_PHONE_NOT_VERIFIED
AUTH_ACCOUNT_SUSPENDED
AUTH_ACCOUNT_BANNED
AUTH_SESSION_EXPIRED
AUTH_SESSION_REUSED

OTP_INVALID
OTP_EXPIRED
OTP_MAX_ATTEMPTS
OTP_TOO_MANY_REQUESTS

USER_NOT_FOUND
USER_FORBIDDEN
USER_STATUS_INVALID

CATEGORY_NOT_FOUND
CATEGORY_INACTIVE
CATEGORY_HIERARCHY_INVALID
CATEGORY_ATTRIBUTE_INVALID

LOCATION_NOT_FOUND
CITY_PROVINCE_MISMATCH

LISTING_NOT_FOUND
LISTING_NOT_ACTIVE
LISTING_INVALID_STATE_TRANSITION
LISTING_NOT_OWNER
LISTING_VERSION_CONFLICT
LISTING_LIMIT_REACHED
LISTING_VALIDATION_FAILED

IMAGE_NOT_FOUND
IMAGE_TOO_LARGE
IMAGE_INVALID
IMAGE_LIMIT_REACHED

FAVORITE_ALREADY_EXISTS
FAVORITE_NOT_FOUND

REPORT_DUPLICATE
REPORT_RATE_LIMITED

MODERATION_NOT_ALLOWED

RATE_LIMITED
PAYLOAD_TOO_LARGE
```

Keep codes stable.

---

# 76. AUTHORIZATION MODEL

Security must be enforced at the service/application level as well as controller level.

Examples:

A seller may edit only:

```text
their own listings
```

An admin may moderate:

```text
authorized listings
```

A user cannot:

```text
change their own role
activate another user's listing
change another seller's phone
read another user's sessions
```

Do not trust IDs supplied by clients.

Every protected operation must perform object-level authorization.

---

# 77. MASS ASSIGNMENT PROTECTION

Do not map raw request bodies directly onto database models.

Never do:

```text
prisma.listing.update({
  data: request.body
})
```

Use explicit DTO-to-domain mapping.

Only allowed fields may be updated.

Sensitive fields such as:

```text
sellerAccountId
status
moderationStatus
views
favoriteCount
createdAt
role
passwordHash
```

must never be client-controlled.

---

# 78. RATE LIMITING

Implement rate limiting for at least:

```text
register
login
OTP send
OTP verify
forgot password
password reset
listing creation
listing publish
report creation
contact actions
image upload
public search
```

Rates must be configurable.

Separate:

```text
IP-based limits
user-based limits
phone-based limits
```

where appropriate.

Use a local in-memory implementation for MVP.

Create an abstraction so a future Redis-backed implementation can replace it.

Do not pretend an in-memory limiter provides distributed enforcement across multiple replicas.

Document this limitation clearly.

---

# 79. PUBLIC API ABUSE PROTECTION

Public endpoints must have:

* hard page limits
* maximum query lengths
* allowed sort fields
* maximum filter count
* validated identifiers
* reasonable timeout behavior
* rate limits
* no arbitrary SQL
* no arbitrary JSON-path queries

Do not allow users to request huge result sets.

---

# 80. TRANSACTION RULES

Use database transactions where multiple writes must succeed or fail together.

Examples:

```text
create listing + initial revision
publish listing + moderation record
favorite + counter update where necessary
report + related moderation event
password reset + session revocation
phone change + verification state update
```

Do NOT hold a DB transaction open while calling external services such as:

```text
SMS provider
object storage
future payment provider
```

External calls should happen before/after the appropriate database step, with explicit retry/reconciliation behavior.

---

# 81. CONCURRENCY CONTROL

Protect important state changes from race conditions.

Examples:

Two admins simultaneously attempting:

```text
approve
reject
```

must not leave impossible state.

Two simultaneous:

```text
mark sold
```

requests must produce a valid final state.

Two simultaneous favorites must not violate uniqueness.

Use:

```text
transactions
unique constraints
conditional updates
optimistic version checks
```

where appropriate.

---

# 82. DATABASE INDEX STRATEGY

Create indexes based on actual access patterns.

At minimum consider:

```text
User.phoneNormalized UNIQUE

SellerAccount.ownerUserId UNIQUE
SellerAccount.slug UNIQUE

RefreshSession.userId
RefreshSession.expiresAt
RefreshSession.familyId

Category.parentId
Category.slug UNIQUE

CategoryAttribute.categoryId
CategoryAttribute.key

Province.slug UNIQUE
City.provinceId + City.slug

Listing.status
Listing.categoryId
Listing.provinceId
Listing.cityId
Listing.sellerAccountId
Listing.createdAt
Listing.price

Listing(status, createdAt, id)
Listing(status, categoryId, createdAt, id)
Listing(status, provinceId, cityId, createdAt, id)

ListingImage.listingId + sortOrder

Favorite.userId + listingId UNIQUE

Report.status + createdAt
Report.listingId + status

AuditLog.entityType + entityId + createdAt

ListingDailyStat.listingId + date UNIQUE
```

Use search-specific PostgreSQL indexes after profiling.

Do not create dozens of indexes without justification.

---

# 83. DATABASE INTEGRITY

Enforce at DB level where appropriate:

```text
unique phone
unique category slug
unique favorite pair
unique seller slug
valid foreign keys
non-negative prices
valid relationship constraints
```

Use migrations.

Never use:

```text
prisma db push
```

as the production schema deployment strategy.

Use:

```text
prisma migrate
```

with committed migration files.

---

# 84. SOFT DELETE POLICY

For important marketplace records, prefer archival/soft-deletion semantics over destructive hard deletion.

Examples:

```text
Listing.deletedAt
User.deletedAt
Media.deletedAt where needed
```

Hard deletion must be rare and explicitly authorized.

Do not destroy historical moderation/audit evidence merely because a user deletes an account.

Define retention behavior separately.

---

# 85. ACCOUNT DELETION

Provide an account deletion/deactivation flow.

Conceptually:

```text
DELETE /api/v1/users/me
```

or an explicit deactivation action.

Rules should define:

* sessions revoked
* listings archived
* contact availability disabled
* personal profile removed/anonymized where appropriate
* audit records retained
* reports retained as necessary
* historical marketplace records preserved appropriately

Do not promise legal compliance with any jurisdiction unless a legal policy is separately established.

---

# 86. PRIVACY

Minimize stored personal information.

Do not log:

```text
passwords
password hashes
OTP codes
refresh tokens
JWTs
secret keys
full sensitive payloads
```

Treat phone numbers as sensitive personal data.

Avoid exposing phone numbers through:

```text
listing search
listing feeds
admin logs
public analytics
```

unless explicitly required.

---

# 87. SECURITY HEADERS

Use Helmet or equivalent security middleware.

Configure:

```text
CSP where applicable
X-Content-Type-Options
Referrer-Policy
Frame protections
```

Do not blindly copy a CSP that breaks the application.

Document security-header decisions.

---

# 88. CORS

Never use production:

```text
*
```

for credentialed requests.

Use explicit origins from environment configuration.

Support multiple development origins.

Only allow credentialed requests where required.

---

# 89. TRUST PROXY

When deployed behind a trusted reverse proxy, configure trusted proxy behavior deliberately.

Do not blindly trust arbitrary client-supplied:

```text
X-Forwarded-For
```

because IP-based security controls depend on correct proxy configuration.

---

# 90. FILE UPLOAD SECURITY

Use:

* maximum size
* maximum number of files
* allowed image types
* actual content inspection
* safe generated names
* no executable file types
* image re-encoding
* safe storage directories
* no user-controlled paths
* rate limits
* orphan cleanup

Do not accept arbitrary files simply because the endpoint is called "upload".

---

# 91. TEXT SAFETY

Listing descriptions and titles must be plain text.

Reject or normalize malicious control content.

Do not intentionally interpret user descriptions as HTML.

If rich text is added in the future, it must go through an explicit sanitizer and allowlist.

---

# 92. DTO POLICY

Every external endpoint should have explicit DTOs.

Use:

```text
CreateListingDto
UpdateListingDto
PublishListingDto
LoginDto
RegisterDto
VerifyOtpDto
CreateReportDto
CreateFavoriteDto
...
```

Never use raw generic objects for important public APIs.

Whitelist fields.

Enable strict validation and transformation settings appropriate for NestJS/Fastify.

---

# 93. API VERSIONING

All public API routes start with:

```text
/api/v1
```

Never casually break an existing v1 contract.

Future versions should use:

```text
/api/v2
```

only when compatibility cannot be preserved.

Prefer additive changes.

Document deprecated endpoints.

Do not change response meaning without documenting the change.

---

# 94. SWAGGER / OPENAPI

Swagger must document:

* authentication
* DTOs
* query parameters
* pagination
* filters
* response envelopes
* error responses
* role restrictions
* examples
* multipart upload requirements

Generate/export an OpenAPI document.

Keep API documentation synchronized with code.

The future frontend should be able to generate a typed API client from the contract if desired.

---

# 95. FRONTEND INTEGRATION CONTRACT

The backend must remain friendly to:

```text
Next.js
React
TypeScript
```

The public API must be predictable.

Do not leak Prisma response structures directly.

The future frontend should never need to understand:

```text
Prisma internals
database column names
internal moderation structures
refresh-session tables
```

---

# 96. OBSERVABILITY

Implement structured logs with useful fields:

```text
timestamp
level
requestId
route
method
statusCode
durationMs
userId when available
sellerAccountId when relevant
errorCode
```

Never log secrets.

Development may log additional diagnostic data, but production must remain safe.

---

# 97. LOGGING LEVELS

Use meaningful levels:

```text
debug
info
warn
error
```

Avoid logging every database query in production.

Database query logging may be enabled in development or controlled troubleshooting.

---

# 98. METRICS EXTENSION

The architecture should allow future metrics such as:

```text
http_requests_total
http_request_duration
database_query_duration
listing_publish_total
listing_contact_total
report_total
otp_requests_total
auth_failures_total
```

Do not require Prometheus infrastructure for the MVP.

A future metrics adapter can be added behind the observability layer.

---

# 99. TESTING STRATEGY

Tests are part of the implementation, not an optional final step.

Use:

```text
unit tests
integration tests
e2e tests
```

---

# 100. UNIT TESTS

Test domain/application rules such as:

```text
listing state transitions
attribute validation
pricing validation
ownership rules
permission rules
OTP expiration
OTP attempt limits
session rotation
slug generation
filter validation
```

---

# 101. INTEGRATION TESTS

Use real PostgreSQL.

Test:

```text
database constraints
Prisma queries
transactions
indexes where practical
unique conflicts
state updates
search queries
JSONB attribute filters
pagination
```

Do not mock the entire database layer in all tests.

---

# 102. E2E TESTS

At minimum test complete flows:

```text
register
verify phone
login
refresh session
logout
create listing
upload image
submit listing
admin approval
public listing discovery
listing detail
contact seller
favorite listing
report listing
seller marks listing sold
seller archives listing
user suspension
password reset
phone change
```

Also test failure paths.

---

# 103. SECURITY TESTS

Explicitly test:

```text
IDOR / broken object authorization
mass assignment
privilege escalation
unverified publishing
banned user actions
stale refresh token reuse
OTP brute force
duplicate favorite
duplicate report abuse
invalid state transition
oversized image
invalid MIME
path traversal
malformed JSON
SQL injection attempts
arbitrary sort injection
arbitrary filter key injection
```

---

# 104. TEST DATA

Create deterministic test factories/fixtures for:

```text
users
seller accounts
categories
attributes
provinces
cities
listings
reports
```

Do not make tests depend on production seed data.

---

# 105. DEVELOPMENT SEED

Create a safe seed system for development.

Seed:

```text
categories
sample attributes
verified provinces
cities
development admin
optional development users
sample listings
```

Admin credentials must come from environment variables.

Never hard-code production secrets.

Do not invent inaccurate geographic data.

If administrative data is not available in the repository, document the source and make the fixture replaceable.

---

# 106. ADMIN API

Provide administrative operations for:

```text
dashboard summary
user search
user details
suspend user
ban user
restore user

listing moderation queue
approve listing
reject listing
archive listing

report queue
resolve report
dismiss report

category CRUD
category attribute CRUD
attribute options CRUD

province/city management

audit log search

basic marketplace analytics
```

Do not expose admin endpoints under public naming accidentally.

Use explicit:

```text
/api/v1/admin/*
```

namespace.

---

# 107. SELLER API

Provide:

```text
GET    /api/v1/me
PATCH  /api/v1/me

GET    /api/v1/me/listings

POST   /api/v1/listings
GET    /api/v1/listings/:slug
PATCH  /api/v1/listings/:id

POST   /api/v1/listings/:id/submit
POST   /api/v1/listings/:id/mark-sold
POST   /api/v1/listings/:id/archive
POST   /api/v1/listings/:id/renew

POST   /api/v1/listings/:id/images
DELETE /api/v1/listings/:id/images/:imageId
PATCH  /api/v1/listings/:id/images/:imageId/order

POST   /api/v1/favorites/:listingId
DELETE /api/v1/favorites/:listingId
GET    /api/v1/me/favorites

POST   /api/v1/listings/:id/reports
```

Adjust exact naming only if the resulting REST contract is clearly better.

---

# 108. PUBLIC API

Provide at minimum:

```text
GET /api/v1/listings
GET /api/v1/listings/:slug

GET /api/v1/categories
GET /api/v1/categories/tree
GET /api/v1/categories/:slug
GET /api/v1/categories/:id/filter-schema

GET /api/v1/locations/provinces
GET /api/v1/locations/provinces/:provinceId/cities

GET /api/v1/sellers/:slug

POST /api/v1/listings/:id/contact
```

Anonymous users must be able to browse.

Do not require account registration simply to view listings.

---

# 109. SELLER PROFILE API

Provide a safe public endpoint:

```text
GET /api/v1/sellers/:slug
```

It may return:

```text
displayName
memberSince
verified indicator
active listing count
public listings
```

Do not expose private account/security details.

---

# 110. MARKETPLACE DISCOVERY RULE

Only:

```text
ACTIVE
```

listings should appear in public search.

Do not expose:

```text
DRAFT
PENDING_REVIEW
REJECTED
```

to public search.

SOLD/ARCHIVED listings must follow explicit historical/SEO policy.

Default public discovery should exclude them.

---

# 111. PUBLIC LISTING SEO SUPPORT

Although SEO is primarily a frontend concern, the backend must provide:

```text
stable slug
stable listing ID
createdAt
updatedAt
publishedAt
canonical category relationships
public seller information
```

Do not make URLs dependent on database pagination.

---

# 112. API CACHING EXTENSION

Do not install Redis initially.

However, public read services should be written so future caching can be introduced for:

```text
category tree
location lists
filter schemas
popular/public listings
```

without rewriting controllers.

Do not add cache logic to every service prematurely.

---

# 113. SEARCH PROVIDER EXTENSION

Define conceptually:

```text
SearchProvider
```

Initial:

```text
PostgresSearchProvider
```

Future:

```text
OpenSearchProvider
ElasticsearchProvider
```

The future provider must be able to replace only the infrastructure/search implementation while preserving the public API and application-level search contract.

---

# 114. CACHE PROVIDER EXTENSION

Define a small cache abstraction only when a real caching use case exists.

Future implementation:

```text
RedisCacheProvider
```

Do not install Redis just to satisfy the architecture.

---

# 115. JOB QUEUE EXTENSION

Current scheduled tasks can use:

```text
NestJS Schedule
```

Future large-scale asynchronous processing may use:

```text
BullMQ + Redis
```

or another queue.

Potential future jobs:

```text
image processing
notifications
SMS
analytics processing
search indexing
recommendation generation
moderation
```

Do not introduce a queue before the workload justifies it.

---

# 116. NOTIFICATION EXTENSION

Create interfaces that future features can use:

```text
SmsProvider
EmailProvider
PushNotificationProvider
```

Initial concrete implementation:

```text
MockSmsProvider
```

Production SMS provider must be configurable.

Do not hard-code a vendor into business logic.

---

# 117. PAYMENT EXTENSION

Do not add payments now.

When payments eventually exist, create a separate bounded module:

```text
payments
orders
transactions
```

Do not put payment fields inside Listing merely because a future payment feature may exist.

WeshBazar currently does not control the buyer/seller transaction.

---

# 118. BUSINESS ACCOUNT EXTENSION

The current:

```text
SellerAccount
```

exists specifically to make future business accounts possible.

Future architecture may introduce:

```text
SellerAccountMember
BusinessProfile
Storefront
BusinessVerification
```

without changing:

```text
Listing.sellerAccountId
```

Do not implement the business marketplace now.

---

# 119. FEATURED LISTING EXTENSION

Do not add advertising or boosting to the MVP.

Future module:

```text
promotions
boosts
featured listings
sponsored placements
```

must remain separate from core listing lifecycle.

The search/ranking layer should later be capable of receiving additional ranking signals.

Do not add a random `isFeatured` boolean to Listing as the final architecture.

---

# 120. REPUTATION EXTENSION

Do not implement ratings/reviews initially.

Future module may support:

```text
SellerReputation
Reviews
Trust signals
Verification
Completed transaction signals
```

Do not add fake or inferred reputation data.

---

# 121. INTERNAL CHAT EXTENSION

Do not implement internal messaging.

Future architecture should support a separate:

```text
Messaging
Conversation
Message
Attachment
Moderation
```

module.

Do not mix messaging state with Listing or User tables.

---

# 122. GEOSPATIAL EXTENSION

Do not install PostGIS initially.

If future requirements include:

```text
near me
radius search
map bounds
distance sorting
```

introduce a dedicated location/geospatial module.

The existing:

```text
Province
City
```

model should remain compatible with that upgrade.

---

# 123. RECOMMENDATION EXTENSION

Do not implement AI recommendations.

Future recommendation inputs may include:

```text
views
searches
favorites
contact clicks
category affinity
price affinity
location affinity
```

Recommendation logic must remain separate from core listing correctness.

---

# 124. AI MODERATION EXTENSION

Do not implement AI moderation now.

Create a conceptual extension point:

```text
ModerationProvider
```

Future implementations may assess:

```text
text
images
duplicate content
prohibited items
spam
fraud signals
```

AI results must never directly mutate critical marketplace state without explicit policy rules.

---

# 125. OUTBOX / EVENT ARCHITECTURE

Do not build a full distributed event bus now.

However, avoid tightly coupling every secondary side effect to core request paths.

Where appropriate, use internal application events such as:

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

Document how a future transactional outbox can replace in-process event handling when reliability requirements increase.

Never require Kafka/RabbitMQ for core correctness in the MVP.

---

# 126. IDEMPOTENCY

For write operations that may be retried by clients in unstable networks, consider an idempotency mechanism.

The architecture should support:

```text
Idempotency-Key
```

for selected commands.

Do not enable it blindly for every endpoint.

Initial candidates:

```text
listing creation
report submission
contact actions
future payment operations
```

Document the policy.

---

# 127. FAILURE HANDLING

Every external provider interaction must define:

```text
timeout
failure behavior
retry policy
logging
fallback
```

Never retry blindly.

Never retry non-idempotent operations without an idempotency strategy.

Never hold a database transaction open while waiting indefinitely for an external provider.

---

# 128. DATABASE CONNECTION MANAGEMENT

Configure:

```text
connection URL
pool behavior
timeouts
```

through environment/configuration.

Document production connection considerations.

Future scaling may introduce:

```text
PgBouncer
read replicas
connection pooling
```

only when justified.

---

# 129. PERFORMANCE ENGINEERING

The MVP must avoid obvious performance problems.

Do not create:

```text
N+1 queries
unbounded SELECT *
large JSON payloads
unbounded pagination
unindexed high-volume queries
```

Use explicit Prisma `select` shapes.

Load only the fields required by each endpoint.

Separate:

```text
list DTO
detail DTO
admin DTO
public seller DTO
```

---

# 130. QUERY PERFORMANCE

For important marketplace queries:

* inspect generated SQL where necessary
* use `EXPLAIN ANALYZE`
* verify indexes
* avoid unnecessary joins
* avoid counting large sets when not needed
* use cursor pagination where appropriate

Do not optimize imaginary bottlenecks before measuring.

---

# 131. FUTURE DATABASE SCALING PATH

If real traffic grows, the upgrade path should be:

```text
PostgreSQL optimization
        ↓
better indexes
        ↓
query optimization
        ↓
connection pooling
        ↓
Redis cache where useful
        ↓
read replicas
        ↓
analytics partitioning
        ↓
external search
        ↓
specialized services only where justified
```

Do not jump directly to microservices.

---

# 132. WHEN TO INTRODUCE REDIS

Redis should be introduced only when one or more real requirements appear, such as:

```text
multiple API replicas requiring distributed rate limiting
high cache demand
session/cache requirements
job queues
short-lived distributed coordination
```

The presence of Redis in a technology list is not itself a requirement.

---

# 133. WHEN TO INTRODUCE A QUEUE

Use a queue when:

```text
a task is too slow for the request
retry behavior becomes important
work can happen asynchronously
volume causes request latency problems
```

Examples:

```text
image processing
bulk notifications
search indexing
analytics processing
```

---

# 134. WHEN TO INTRODUCE AN EXTERNAL SEARCH ENGINE

Consider OpenSearch/Elasticsearch when PostgreSQL search becomes insufficient due to actual:

```text
dataset size
query latency
complex ranking requirements
fuzzy search requirements
aggregation requirements
```

Do not migrate merely because the marketplace is called a marketplace.

---

# 135. WHEN TO INTRODUCE MICROSERVICES

Only consider extraction when a module has strong justification such as:

```text
independent scaling needs
independent deployment
separate team ownership
different reliability requirements
high operational load
```

Potential future extraction candidates:

```text
Search
Notifications
Media Processing
Analytics
Messaging
Payments
```

Do not extract:

```text
Auth
Categories
Locations
Listings
```

without a concrete reason.

---

# 136. DATABASE MIGRATION POLICY

Every schema change must use a migration.

Migration rules:

* migration must be committed
* destructive changes require explicit review
* prefer additive changes
* preserve backward compatibility during rolling deployments
* do not depend on application code that does not yet exist during migration
* avoid changing large tables destructively in one deployment
* document data migrations
* never edit an already-applied migration

---

# 137. ZERO-DOWNTIME EXTENSION PRINCIPLE

Future deployments should prefer:

```text
expand
→ deploy
→ migrate data
→ switch behavior
→ contract
```

rather than:

```text
drop old field
→ hope old app does not exist
```

This is especially important once multiple replicas are running.

---

# 138. DEPLOYMENT

Provide Docker production support.

Use a multi-stage Dockerfile.

The container must:

* run as a non-root user where practical
* have a health endpoint
* accept configuration through environment variables
* shut down gracefully
* not contain development secrets
* not run development tooling in production

---

# 139. DOCKER COMPOSE

Development Compose should provide at minimum:

```text
PostgreSQL
```

Optionally local supporting services may be added later.

Do not add Redis/Kafka/etc merely for decoration.

---

# 140. DATABASE DEPLOYMENT

Production database deployment must use:

```text
prisma migrate deploy
```

or the correct equivalent for the pinned Prisma version.

Do not automatically run destructive schema synchronization from application startup.

---

# 141. BACKUPS

Document:

```text
PostgreSQL backup strategy
restore procedure
migration recovery
object storage recovery
```

The backend repository should contain operational documentation even if actual cloud backups are configured outside the repo.

---

# 142. GITHUB ACTIONS

Implement CI that checks:

```text
npm ci
lint
format check
typecheck
unit tests
integration/e2e tests
Prisma validation
build
```

CI should run against PostgreSQL for database tests.

Fail the build on actual correctness failures.

Do not hide errors merely to make CI green.

---

# 143. CODE STYLE

Enforce:

```text
strict TypeScript
no implicit any
explicit DTOs
meaningful names
small cohesive services
single responsibility where practical
no duplicated business rules
no dead code
no commented-out abandoned code
```

Do not create 500-line services when the module can be decomposed naturally.

Do not create 50 tiny classes when simple functions are clearer.

---

# 144. NAMING

Project naming:

```text
WeshBazar
weshbazar
weshbazar-api
WESHBAZAR_*
```

Search the repository for obsolete branding such as:

```text
Bazark
بازارک
Bazark API
```

and replace obsolete project branding only where it refers to this project.

Do not alter unrelated content.

---

# 145. DOCUMENTATION REQUIREMENTS

Maintain:

```text
README.md
docs/architecture.md
docs/database.md
docs/api.md
docs/security.md
docs/deployment.md
docs/testing.md
docs/marketplace-rules.md
docs/state-machines.md
docs/extension-guide.md
docs/error-codes.md
docs/adr/
```

Architecture Decision Records should document important decisions such as:

```text
why modular monolith
why PostgreSQL
why Prisma
why REST
why no Redis initially
why no external search initially
why SellerAccount exists
why dynamic category attributes use the chosen model
why public search uses cursor pagination
```

---

# 146. MARKETPLACE RULES DOCUMENT

Create a dedicated document describing:

```text
who can publish
listing states
editing rules
expiration
contact rules
moderation
reports
suspensions
deletions
favorites
seller visibility
```

Do not leave critical marketplace policies implied only by code.

---

# 147. SECURITY THREAT MODEL

Create a basic threat model addressing:

```text
account takeover
credential stuffing
OTP abuse
refresh token theft
session reuse
IDOR
privilege escalation
spam listings
fake listings
stolen goods reports
malicious uploads
path traversal
XSS
SQL injection
scraping
contact spam
report spam
admin abuse
data leakage
```

For each important threat, identify:

```text
attack
impact
mitigation
remaining limitation
```

---

# 148. NO HIDDEN ASSUMPTIONS

If a requirement is ambiguous:

1. choose the simplest safe assumption
2. document it
3. implement it consistently
4. do not block the project unnecessarily

Do not invent fake business rules.

Do not invent fake Afghanistan market statistics.

Do not invent external provider behavior.

---

# 149. DATA CORRECTNESS OVER DEMO APPEARANCE

Do not optimize for:

```text
"looks good in Cursor"
```

Optimize for:

```text
correct data
correct permissions
correct state
correct migrations
correct tests
```

A feature is incomplete if its happy path works but invalid paths are unsafe.

---

# 150. BUILD PROCESS — PHASE 0

## Phase 0: Repository Inspection

Before writing application code:

1. inspect the entire repository structure
2. inspect existing package.json
3. inspect existing source code
4. inspect existing Prisma configuration
5. inspect environment configuration
6. identify existing reusable code
7. identify conflicts
8. identify whether this is empty, partial, or already structured

Create:

```text
docs/implementation-status.md
```

with:

```text
existing
missing
conflicting
planned
```

Do not destroy existing useful work.

STOP after inspection if major architecture conflicts exist.

Otherwise proceed.

---

# 151. PHASE 1 — FOUNDATION

Implement:

```text
Node/TypeScript configuration
NestJS
Fastify
ConfigModule
environment validation
global validation
exception handling
logging
request IDs
CORS
Helmet
security configuration
API prefix
Swagger
health checks
graceful shutdown
Docker
Docker Compose
ESLint
Prettier
Husky
lint-staged
CI
```

Acceptance:

```text
application starts
database configuration validates
health endpoint works
Swagger works
invalid environment fails clearly
lint passes
typecheck passes
build passes
tests pass
```

Do not begin business modules until foundation passes.

---

# 152. PHASE 2 — DATABASE FOUNDATION

Implement:

```text
Prisma
PostgreSQL
schema
migrations
database module
seed framework
indexes
constraints
```

Implement the foundational models first.

Acceptance:

```text
clean database migration succeeds
migration can be applied from zero
seed works
database constraints work
integration test can connect
```

---

# 153. PHASE 3 — AUTHENTICATION

Implement:

```text
register
phone normalization
OTP challenge
phone verification
login
JWT access
refresh sessions
rotation
reuse detection
logout
logout-all
session management
password change
forgot password
reset password
change phone
me
```

Tests must cover all security-sensitive paths.

STOP if authentication has security test failures.

---

# 154. PHASE 4 — USERS AND SELLER ACCOUNTS

Implement:

```text
User profile
account status
SellerAccount
seller slug
public seller profile
ownership logic
```

Ensure Listing ownership is based on:

```text
sellerAccountId
```

not raw user IDs.

Acceptance:

```text
user gets personal seller account
seller can view own profile
seller can update allowed fields
public API exposes only safe data
```

---

# 155. PHASE 5 — CATEGORIES AND DYNAMIC ATTRIBUTES

Implement:

```text
category tree
category CRUD
category localization
CategoryAttribute
CategoryAttributeOption
effective inherited attributes
attribute validation
filter schema API
category moderation mode
```

Write extensive tests.

Test:

```text
parent category
child category
required fields
wrong types
invalid options
inactive options
numeric ranges
unknown keys
attribute filtering
```

---

# 156. PHASE 6 — LOCATIONS

Implement:

```text
Province
City
localization
province/city validation
admin location management
```

Tests:

```text
city belongs to province
invalid combinations rejected
inactive locations rejected
```

---

# 157. PHASE 7 — LISTINGS CORE

Implement:

```text
create draft
edit draft
submit
moderation
approve
reject
mark sold
archive
renew
listing state machine
versioning
revision history
ownership
validation
expiration
```

Acceptance:

No client can directly assign an arbitrary state.

---

# 158. PHASE 8 — MEDIA

Implement:

```text
multipart upload
StorageProvider
LocalStorageProvider
image validation
Sharp processing
variants
ordering
primary image
delete image
orphan cleanup
```

Test:

```text
valid image
invalid image
oversized image
duplicate image where policy applies
too many images
unauthorized upload
unauthorized deletion
```

---

# 159. PHASE 9 — DISCOVERY AND SEARCH

Implement:

```text
public listings endpoint
search q
category
location
price
condition
dynamic filters
sorting
cursor pagination
stable ordering
PostgreSQL search indexes
search normalization
public listing detail
seller summary
```

Verify queries with real PostgreSQL.

Test:

```text
empty query
text query
price range
category filter
location filter
attribute filter
multiple filters
pagination
invalid filters
invalid sort
inactive listings excluded
```

---

# 160. PHASE 10 — CONTACTS, FAVORITES, REPORTS

Implement:

```text
listing contact methods
contact action endpoint
contact analytics
favorites
reports
duplicate protection
rate limits
```

Ensure buyer can contact seller without requiring registration.

Require authentication where appropriate for:

```text
favorites
reports
```

---

# 161. PHASE 11 — MODERATION AND ADMIN

Implement:

```text
admin authentication
permission guard
moderation queue
user management
listing moderation
report moderation
category management
attribute management
location management
audit logs
basic dashboard statistics
```

Test role boundaries aggressively.

---

# 162. PHASE 12 — ANALYTICS

Implement:

```text
listing counters
daily listing stats
contact event tracking
favorite metrics
report metrics
seller listing summaries
admin marketplace summaries
```

Do not create a huge event warehouse.

The MVP analytics layer must remain lightweight.

---

# 163. PHASE 13 — SECURITY HARDENING

Audit all modules for:

```text
IDOR
mass assignment
privilege escalation
rate limits
input validation
upload abuse
session reuse
OTP abuse
logging leaks
CORS
security headers
pagination abuse
search abuse
race conditions
```

Add missing tests.

---

# 164. PHASE 14 — BACKGROUND JOBS

Implement:

```text
listing expiration
stale draft cleanup
expired OTP cleanup
expired session cleanup
password reset cleanup
orphan media cleanup
```

Each job must be:

```text
idempotent
safe
observable
bounded
```

---

# 165. PHASE 15 — RESILIENCE AND PERFORMANCE

Review:

```text
database indexes
N+1 queries
response sizes
pagination
query limits
transaction boundaries
timeouts
error handling
graceful shutdown
memory usage
file processing
```

Run a small load test against:

```text
GET /listings
GET /listings/:slug
POST /auth/login
POST /listings/:id/contact
```

Do not invent performance guarantees.

Record the observed development/test environment and the workload used.

---

# 166. PHASE 16 — CI/CD AND DEPLOYMENT

Finalize:

```text
Dockerfile
Compose
CI
migration deployment
environment validation
health checks
logging
deployment documentation
backup documentation
```

---

# 167. PHASE 17 — DOCUMENTATION AUDIT

Verify:

```text
architecture
database
API
security
state machines
marketplace rules
deployment
testing
errors
future extension paths
```

are accurate and match the actual implementation.

Documentation must not describe features that do not exist.

---

# 168. PHASE 18 — FINAL ARCHITECTURE AUDIT

Before declaring the backend complete, verify:

### Architecture

```text
modular monolith
clear boundaries
no circular dependencies
no accidental infrastructure leakage
```

### Database

```text
constraints
indexes
migrations
soft deletes
referential integrity
```

### Auth

```text
Argon2id
OTP
refresh rotation
reuse detection
session revocation
password reset
```

### Marketplace

```text
listing lifecycle
dynamic attributes
search
locations
media
favorites
reports
moderation
seller profile
contact
expiration
```

### Security

```text
IDOR
mass assignment
rate limiting
upload security
admin authorization
logging safety
```

### Operations

```text
health
logs
Docker
CI
backup docs
environment validation
```

### Testing

```text
unit
integration
e2e
security scenarios
```

---

# 169. DEFINITION OF DONE

The WeshBazar backend is NOT considered complete merely because the server starts.

It is done only when:

```text
the application builds
database migrations work
environment validation works
auth works securely
users work
seller accounts work
categories work
dynamic attributes work
locations work
listings work
listing state machine works
images work
public search works
filters work
seller contact works
favorites work
reports work
moderation works
admin permissions work
analytics work
scheduled jobs work
security tests pass
integration tests pass
E2E tests pass
Swagger is accurate
documentation matches implementation
Docker works
CI passes
```

---

# 170. FUTURE EXPANSION MAP

The architecture should allow this evolution:

## Stage A — MVP

```text
Next.js
    ↓
NestJS
    ↓
PostgreSQL + Prisma
    ↓
Local/S3-compatible storage
```

## Stage B — Growing traffic

```text
Next.js
    ↓
Load Balancer
    ↓
Multiple NestJS instances
    ↓
PostgreSQL
    +
Redis
    +
Object Storage/CDN
```

Redis can provide:

```text
distributed rate limiting
cache
temporary state
job queue support
```

## Stage C — Search growth

```text
NestJS
    ↓
SearchProvider
    ↓
PostgreSQL initially
       OR
OpenSearch later
```

## Stage D — Async workloads

```text
NestJS
    ↓
Queue
    ↓
Workers
```

for:

```text
notifications
image processing
analytics
search indexing
bulk operations
```

## Stage E — Specialized services

Only when justified:

```text
Search Service
Media Service
Notification Service
Analytics Service
Messaging Service
Payment Service
```

The core domain boundaries should make these extractions possible without forcing them prematurely.

---

# 171. FUTURE BUSINESS FEATURES

The architecture must remain ready for:

```text
Business Accounts
Storefronts
Business Verification
Featured Listings
Boosts
Sponsored Listings
Advertising
Seller Reputation
Reviews
Saved Searches
Notifications
Internal Messaging
Payment
Order Tracking
Delivery
Geospatial Search
Recommendations
AI Moderation
Advanced Analytics
Mobile Applications
```

These must be designed as modules.

Do not pollute the current Listing model with speculative fields for every future idea.

---

# 172. IMPORTANT EXTENSION PRINCIPLE

A future feature should generally be introduced by adding:

```text
new module
new application service
new provider adapter
new database models
new API endpoints
```

rather than by rewriting:

```text
Auth
Listing
User
Category
```

Example:

Future Business Accounts should not require replacing:

```text
Listing.sellerAccountId
```

Future Search Engine should not require replacing:

```text
GET /listings
```

Future Payments should not require changing the fundamental meaning of:

```text
Listing.status
```

Future Messaging should not require putting message data into:

```text
Listing
```

This is the meaning of "extensible architecture".

---

# 173. WHAT NOT TO DO

Do not:

```text
create microservices now
install Redis just because it is popular
install Elasticsearch just because it is a marketplace
store images in PostgreSQL
store passwords in plaintext
store refresh tokens in plaintext
store OTPs in plaintext
allow client-controlled status fields
allow arbitrary dynamic SQL filters
return Prisma entities directly
trust uploaded MIME headers
accept HTML descriptions by default
expose private user data
hard-delete marketplace history casually
use floats for money
use local time for DB timestamps
use OFFSET pagination for every future workload
create giant generic repositories
create huge all-purpose services
hide business rules in controllers
skip integration tests
fake successful external provider calls
use "latest" dependency versions
run destructive DB sync in production
```

---

# 174. CURSOR EXECUTION RULES

Cursor must work in phases.

For every phase:

1. inspect existing implementation
2. identify files to change
3. implement only the phase scope
4. run formatting
5. run lint
6. run typecheck
7. run unit tests
8. run integration/e2e tests relevant to the phase
9. run build
10. inspect migration status
11. update documentation
12. report completed work internally in the repository

Do not silently continue through multiple broken phases.

If the current phase fails:

```text
STOP
FIX
RETEST
```

before implementing dependent phases.

---

# 175. CURSOR CHANGE MANAGEMENT

Before a major change:

* inspect current dependencies
* inspect current database schema
* inspect affected modules
* preserve existing behavior unless intentionally changing it
* avoid unrelated refactoring

For every migration:

* explain why it exists in migration documentation
* ensure fresh database setup still works
* ensure tests use the new schema

---

# 176. CURSOR CODE REVIEW CHECKLIST

After each major phase ask internally:

```text
Is authorization correct?
Can another user access this resource?
Can mass assignment bypass this?
Can invalid state transitions occur?
Can the API be abused with huge input?
Can a retry duplicate data?
Can concurrent requests corrupt state?
Can an admin action be audited?
Can the frontend understand the response?
Can the feature be extended without rewriting the core?
```

Fix issues before moving on.

---

# 177. FINAL IMPLEMENTATION PRINCIPLE

The final WeshBazar backend must look like this conceptually:

```text
                         WESHBAZAR API
                              │
                    ┌─────────┴─────────┐
                    │                   │
                REST API            Swagger
                    │
              Application Layer
                    │
       ┌────────────┼─────────────────────┐
       │            │                     │
     Auth        Marketplace          Administration
       │            │                     │
       │      ┌─────┼─────────────┐       │
       │      │     │             │       │
      User  Listings Search     Media   Moderation
       │      │     │             │       │
       │   Categories Locations Contacts Reports
       │      │     │             │       │
       └──────┴─────┴─────────────┴───────┘
                         │
                   Application Rules
                         │
                Infrastructure Adapters
                         │
          ┌──────────────┼──────────────┐
          │              │              │
      PostgreSQL       Storage        External
       + Prisma                       Providers
          │              │
          └──────────────┘
```

The initial implementation remains one deployable NestJS application.

Its modules are separated by responsibility.

Its external integrations are abstracted.

Its database is relational and strongly constrained.

Its dynamic marketplace fields are data-driven.

Its public API is versioned.

Its authentication is session-aware and revocable.

Its listing lifecycle is state-driven.

Its moderation is auditable.

Its search can later move to another engine.

Its rate limiting can later move to Redis.

Its jobs can later move to a distributed queue.

Its storage can later move from local disk to object storage/CDN.

Its analytics can later move from PostgreSQL aggregation to an event pipeline.

Its seller model can later evolve from individual sellers to businesses/stores.

Its monolith can later be split only where actual engineering needs justify it.

---

# 178. FINAL COMMAND TO CURSOR

Implement WeshBazar exactly as specified above.

Do not treat this document as a loose suggestion.

Treat it as the backend engineering contract.

However, use engineering judgment where implementation details are intentionally left open.

When multiple valid approaches exist, choose the simplest solution that:

1. satisfies the current business requirement
2. preserves security
3. preserves data integrity
4. is testable
5. does not prevent future scaling
6. does not introduce unnecessary infrastructure

Do not add speculative systems merely because they might be needed someday.

Do not remove extension points that are explicitly required.

Never trade correctness for speed.

Never trade security for convenience.

Never trade maintainability for a temporary demo.

At the end of each phase, leave the repository in a working state.

At the end of the entire implementation, provide:

```text
working source code
database migrations
seed system
Docker setup
environment example
CI configuration
Swagger/OpenAPI
complete test suite
architecture documentation
database documentation
security documentation
deployment documentation
state machine documentation
extension guide
error-code catalog
```

The result must be a real, production-minded WeshBazar backend foundation that can begin as a small Afghanistan C2C marketplace and grow substantially without requiring a rewrite of its core architecture.

trigger: always_on
---

