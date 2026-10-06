# WeshBazar

## Database & ERD Master Engineering Specification

نسخه معماری: V1
پایگاه داده: PostgreSQL
ORM: Prisma
نوع معماری: Modular Monolith
هدف: Marketplace قابل توسعه، امن، سریع و قابل مهاجرت در آینده

---

# 1. اصل اصلی Database

PostgreSQL منبع اصلی حقیقت داده است.

هیچ داده مهمی فقط در frontend نگهداری نمیشود.

هیچ business invariant مهمی فقط در frontend enforce نمیشود.

Frontend validation فقط برای UX است.

Backend validation برای business correctness است.

Database constraints برای data integrity است.

ترتیب اعتماد:

```text
User Input
   ↓
Frontend UX Validation
   ↓
API DTO Validation
   ↓
Business Validation
   ↓
Database Constraints
```

---

# 2. شناسهها

تمام موجودیتهای اصلی از UUID استفاده کنند.

مثلاً:

```text
id UUID
```

شناسهها:

* قابل حدس نباشند
* sequential نباشند
* در URL عمومی به عنوان تنها identifier استفاده نشوند

Listing علاوه بر UUID دارای:

```text
slug
```

است.

---

# 3. زمان

تمام timestampها در UTC ذخیره شوند.

استفاده:

```text
TIMESTAMPTZ
```

یا معادل صحیح Prisma.

فیلدهای استاندارد:

```text
createdAt
updatedAt
```

فیلدهای lifecycle فقط وقتی وجود دارند:

```text
publishedAt
soldAt
archivedAt
expiresAt
deletedAt
```

---

# 4. User

## User

```text
User
----
id
phone
phoneNormalized
passwordHash
displayName
role
status

phoneVerifiedAt

avatarKey

failedLoginAttempts
lockedUntil

createdAt
updatedAt
deletedAt
```

### Constraints

```text
phoneNormalized UNIQUE
```

`passwordHash` هیچوقت public نیست.

---

# 5. User Role

V1:

```text
USER
MODERATOR
ADMIN
```

در آینده:

```text
SUPER_ADMIN
SUPPORT
VERIFIER
ANALYST
```

اما authorization نباید فقط با `role === ADMIN` در دهها فایل نوشته شود.

Permission system باید قابل اضافه شدن باشد.

---

# 6. User Status

```text
ACTIVE
SUSPENDED
BANNED
DEACTIVATED
```

### منطق

ACTIVE:

کاربر عادی

SUSPENDED:

موقتاً محدود

BANNED:

دسترسی marketplace ممنوع

DEACTIVATED:

حساب غیرفعالشده

---

# 7. SellerAccount

این موجودیت عمداً جدا از User طراحی میشود.

```text
SellerAccount
-------------
id
ownerUserId
type
displayName
slug
bio
status

createdAt
updatedAt
deletedAt
```

Constraint:

```text
ownerUserId UNIQUE
slug UNIQUE
```

V1:

```text
INDIVIDUAL
```

Future:

```text
BUSINESS
STORE
ORGANIZATION
```

---

# 8. چرا SellerAccount جداست؟

به جای:

```text
Listing.userId
```

داریم:

```text
Listing.sellerAccountId
```

تا آینده بتوانیم:

```text
User
 ↓
Business
 ↓
Staff Members
 ↓
SellerAccount
 ↓
Listings
```

داشته باشیم.

در نتیجه Business Account نیازمند بازنویسی Listing نیست.

---

# 9. RefreshSession

```text
RefreshSession
--------------
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

Index:

```text
userId
familyId
expiresAt
```

هیچ refresh token خامی ذخیره نشود.

---

# 10. VerificationChallenge

برای OTP و verification از یک model عمومی استفاده کن.

```text
VerificationChallenge
---------------------
id
userId
phone
purpose

codeHash

attempts
maxAttempts

expiresAt
resendAvailableAt
usedAt

createdAt
```

Purpose:

```text
REGISTER
CHANGE_PHONE
PASSWORD_RESET
```

Constraintهای منطقی:

* challenge مصرفشده دوباره قابل استفاده نیست
* challenge منقضی قابل استفاده نیست
* attempts نباید از maxAttempts عبور کند

---

# 11. PasswordResetToken

```text
PasswordResetToken
------------------
id
userId
tokenHash
expiresAt
usedAt
createdAt
```

هیچ token خامی در DB نگهداری نشود.

---

# 12. Category

```text
Category
--------
id
parentId

slug

status
sortOrder
iconKey

moderationMode

createdAt
updatedAt
```

Status:

```text
ACTIVE
INACTIVE
ARCHIVED
```

---

# 13. Category Hierarchy

مثلاً:

```text
Electronics
 ├── Mobile
 ├── Laptop
 └── Camera

Vehicles
 ├── Cars
 ├── Motorcycles
 └── Other
```

Parent:

```text
parentId
```

Rules:

* self-parent ممنوع
* cycle ممنوع
* category archived حذف نمیشود
* category دارای listing تاریخی حذف فیزیکی نشود

---

# 14. CategoryTranslation

برای آماده بودن چندزبانه:

```text
CategoryTranslation
-------------------
id
categoryId
locale
name
description
```

Unique:

```text
(categoryId, locale)
```

Locales:

```text
fa-AF
ps-AF
en
```

ممکن است V1 فقط `fa-AF` داشته باشد.

---

# 15. CategoryAttribute

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

unit
placeholder

minValue
maxValue
minLength
maxLength
pattern

sortOrder
isActive

createdAt
updatedAt
```

Type:

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

---

# 16. CategoryAttributeOption

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

Unique:

```text
(attributeId, value)
```

---

# 17. Dynamic Attribute Example

Mobile:

```text
brand → SELECT
model → TEXT
ram → SELECT
storage → SELECT
batteryHealth → INTEGER
```

Car:

```text
brand → SELECT
model → TEXT
year → YEAR
mileage → INTEGER
transmission → SELECT
fuel → SELECT
color → SELECT
```

---

# 18. Dynamic Attribute Storage

Listing دارای:

```text
attributes JSONB
```

نمونه:

```json
{
  "brand": "Samsung",
  "model": "Galaxy S23",
  "ram": 8,
  "storage": 256,
  "batteryHealth": 91
}
```

اما JSONB به معنی «هر JSON دلخواه» نیست.

Backend باید value را مطابق CategoryAttribute validate کند.

---

# 19. Attribute Schema Evolution

هر attribute استفادهشده توسط listing نباید بدون فکر تغییر semantic کند.

مثلاً:

بد:

```text
ram INTEGER
```

تبدیل مستقیم به:

```text
ram TEXT
```

بهتر:

```text
deactivate old attribute
create new attribute
```

یا migration کنترلشده.

هدف:

listing تاریخی همیشه قابل render باشد.

---

# 20. Province

```text
Province
--------
id
code
slug
status
sortOrder
createdAt
updatedAt
```

Unique:

```text
code
slug
```

---

# 21. ProvinceTranslation

```text
ProvinceTranslation
-------------------
id
provinceId
locale
name
```

Unique:

```text
(provinceId, locale)
```

---

# 22. City

```text
City
----
id
provinceId
slug
status
sortOrder
createdAt
updatedAt
```

Unique:

```text
(provinceId, slug)
```

---

# 23. CityTranslation

```text
CityTranslation
---------------
id
cityId
locale
name
```

Unique:

```text
(cityId, locale)
```

---

# 24. Listing

Core model:

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

price
currency
pricingType
negotiable

condition

status

attributes

views
favoriteCount

version

publishedAt
soldAt
archivedAt
expiresAt

createdAt
updatedAt
deletedAt
```

---

# 25. PricingType

```text
PAID
FREE
CONTACT
```

Rules:

PAID:

```text
price >= 0
```

FREE:

```text
price = null
```

CONTACT:

```text
price = null
```

Currency فعلاً:

```text
AFN
```

ولی schema نباید طوری باشد که بعداً multi-currency غیرممکن شود.

---

# 26. Condition

```text
NEW
LIKE_NEW
GOOD
FAIR
```

شرایط تخصصیتر در CategoryAttribute قرار میگیرند.

---

# 27. Listing Status

```text
DRAFT
PENDING_REVIEW
ACTIVE
REJECTED
SOLD
ARCHIVED
```

---

# 28. Listing State Machine

Allowed:

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

ARCHIVED
 ↓
DRAFT
```

هیچ clientی نمیتواند:

```text
status = ACTIVE
```

را مستقیماً update کند.

---

# 29. Listing Version

```text
version INT
```

هر mutation مهم:

```text
version + 1
```

را انجام دهد.

در update حساس:

```text
expectedVersion
```

میتواند ارسال شود.

در mismatch:

```text
LISTING_VERSION_CONFLICT
```

---

# 30. ListingRevision

```text
ListingRevision
---------------
id
listingId
version

changeType
snapshot

createdByUserId

createdAt
```

ChangeType مثلاً:

```text
CREATED
UPDATED
SUBMITTED
APPROVED
REJECTED
SOLD
ARCHIVED
RESTORED
```

Snapshot شامل اطلاعات مهم listing است.

---

# 31. چرا Revision؟

برای:

* moderation
* history
* debugging
* recovery
* future rollback

Revisionها immutable هستند.

---

# 32. ListingImage

```text
ListingImage
------------
id
listingId

storageKey
mimeType
size
width
height
checksum

sortOrder
isPrimary

createdAt
updatedAt
deletedAt
```

URL نهایی ترجیحاً از StorageProvider ساخته شود، نه اینکه وابستگی غیرقابل تغییر به provider داشته باشیم.

---

# 33. Image Variants

Backend storage ممکن است:

```text
thumbnail
medium
large
```

داشته باشد.

Database میتواند strategy provider-level داشته باشد.

نباید Listing به path خاصی از local disk وابسته باشد.

---

# 34. ListingContactMethod

```text
ListingContactMethod
--------------------
id
listingId

type
enabled
valueOverride

createdAt
updatedAt
```

Type:

```text
PHONE
WHATSAPP
TELEGRAM
```

---

# 35. Contact Value Rules

PHONE:

از phone verified seller استفاده شود مگر policy اجازه override داشته باشد.

WHATSAPP:

میتواند شماره seller باشد.

TELEGRAM:

handle validated.

هر value باید server-authorized باشد.

---

# 36. Favorite

```text
Favorite
--------
id
userId
listingId
createdAt
```

Unique:

```text
(userId, listingId)
```

---

# 37. Report

```text
Report
------
id

reporterUserId

listingId
reportedUserId

reason
description

status

resolvedByUserId
resolvedAt
resolutionNote

createdAt
updatedAt
```

Reason:

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

---

# 38. ModerationAction

```text
ModerationAction
----------------
id

listingId
adminUserId

action
reason
note

createdAt
```

Action:

```text
APPROVE
REJECT
ARCHIVE
RESTORE
```

---

# 39. AuditLog

```text
AuditLog
--------
id

actorUserId

action
entityType
entityId

metadata

ipAddress
userAgent

createdAt
```

Append-only.

Examples:

```text
USER_SUSPENDED
USER_BANNED
USER_RESTORED

LISTING_APPROVED
LISTING_REJECTED
LISTING_ARCHIVED

REPORT_RESOLVED

CATEGORY_UPDATED
ATTRIBUTE_UPDATED

SESSION_REVOKED
```

---

# 40. ListingDailyStat

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

---

# 41. Entity Relationship

رابطه اصلی:

```text
User
 │
 ├──────────< RefreshSession
 │
 ├──────────< VerificationChallenge
 │
 ├──────────< PasswordResetToken
 │
 │
 └──────────1 SellerAccount
                 │
                 │
                 └──────────< Listing
                              │
                ┌─────────────┼─────────────┐
                │             │             │
            Category       Province       City
                │                           │
                └── CategoryAttribute       │
                       │                    │
                       └── AttributeOption   │
                                             │
Listing
 │
 ├──< ListingImage
 ├──< ListingContactMethod
 ├──< ListingRevision
 ├──< Favorite
 ├──< Report
 ├──< ModerationAction
 └──< ListingDailyStat
```

---

# 42. Database Rules

هیچ `Listing` بدون:

```text
valid SellerAccount
valid Category
valid Province
valid City
```

نباید وجود داشته باشد.

City باید متعلق به Province انتخابشده باشد.

---

# 43. Delete Strategy

Category:

archive

Listing:

soft delete/archive policy

User:

soft-delete/deactivation

AuditLog:

hard delete ممنوع توسط application

Historical moderation data:

preserve

---

# 44. Counter Strategy

Listing:

```text
views
favoriteCount
```

برای read سریع.

اما counters نباید تنها source of truth analytics باشند.

در آینده reconciliation job میتواند آنها را بررسی کند.

---

# 45. JSONB Policy

`Listing.attributes` برای dynamic data است.

نباید برای:

```text
status
price
categoryId
provinceId
sellerAccountId
```

استفاده شود.

Fields اصلی و query-critical باید ستون واقعی باشند.

---

# 46. Index Philosophy

Index بر اساس access pattern.

بیشترین query:

```text
ACTIVE listings
category
province
city
price
createdAt
seller
```

پس index مناسب بساز.

Dynamic JSONB index فقط پس از بررسی واقعی query workload.

---

# 47. Search Text

Listing میتواند:

```text
searchText
```

normalized داشته باشد.

برای:

* title
* description
* relevant searchable attributes

استفاده شود.

Normalization شامل موارد مناسب فارسی:

```text
ي → ی
ك → ک
Arabic digits → Persian/normalized representation
whitespace normalization
zero-width cleanup
```

اما raw title/description دستنخورده نیز حفظ شود.

---

# 48. Database Migration Rules

هر تغییر schema:

migration

هیچ:

```text
db push
```

به عنوان production schema process.

migrationهای اجراشده:

ویرایش نشوند.

تغییرات مخرب:

explicit review.

---

# 49. Expansion Safety

Future fields مانند:

```text
businessAccount
boost
featured
order
payment
message
review
coordinates
```

نباید بدون نیاز به Listing core اضافه شوند.

Feature آینده:

```text
new module
new tables
new relations
```

تا حد ممکن.

---

# 50. Database Completion

Database زمانی complete محسوب میشود که:

* fresh migration works
* seed works
* foreign keys work
* unique constraints work
* indexes exist
* JSONB validation exists
* state transitions are protected
* concurrency strategy exists
* historical records are preserved
* tests cover constraints
* extension path documented

END.
