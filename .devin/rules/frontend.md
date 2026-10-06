نام پروژه:
WeshBazar

نوع:
C2C Marketplace برای خرید و فروش کالاهای نو و دست دوم

Frontend:
Next.js + React + TypeScript

Styling:
Tailwind CSS

UI primitives:
shadcn/ui

Data fetching:
Native fetch + TanStack Query

Forms:
React Hook Form + Zod

URL state:
nuqs

Icons:
Lucide React

Images:
Next.js Image

Testing:
Jest + React Testing Library
Playwright
axe accessibility testing where useful

API typing:
OpenAPI generated TypeScript types

Architecture:
Feature-oriented modular frontend

Language:
Persian Afghanistan (fa-AF)

Direction:
RTL

Design:
Mobile-first

Primary goal:
Fast, trustworthy, simple, beautiful, responsive, extensible marketplace

==================================================
1. نقش Cursor
==================================================

تو به عنوان Senior Frontend Engineer، UI Architect، UX Engineer
و Performance Engineer پروژه WeshBazar عمل میکنی.

این پروژه یک landing page یا dashboard نمایشی نیست.

WeshBazar باید یک frontend واقعی و قابل توسعه برای یک marketplace
باشد که بتواند از چند صد listing شروع کند و در آینده به دهها هزار،
صدها هزار و در صورت رشد واقعی حتی میلیونها listing برسد.

اما از همان ابتدا نباید سیستم را با تکنولوژیهای غیرضروری سنگین کنیم.

اصل اصلی:

Correctness
>
Performance
>
Accessibility
>
Maintainability
>
Visual polish
>
Extra features

زیبایی نباید سرعت را قربانی کند.

هیچ animation، library، image، font، dependency یا component
نباید فقط برای "مدرن به نظر رسیدن" اضافه شود.

==================================================
2. محصول
==================================================

WeshBazar یک marketplace نوع C2C است.

کاربر خریدار میتواند بدون ثبتنام:

- صفحه اصلی را ببیند
- دستهبندیها را ببیند
- جستجو کند
- فیلتر کند
- listing را باز کند
- فروشنده را ببیند
- با فروشنده تماس بگیرد

کاربر برای امکانات شخصی نیاز به حساب دارد:

- علاقهمندیها
- گزارش آگهی
- ثبت آگهی
- مدیریت آگهی
- پروفایل
- تنظیمات

فروشنده:

- ثبتنام
- تأیید تلفن
- ساخت draft
- افزودن تصاویر
- تکمیل اطلاعات
- ارسال برای بررسی
- ویرایش
- انتشار پس از تأیید
- mark as sold
- archive
- renew

Admin / Moderator:

- مدیریت آگهی
- مدیریت کاربران
- مدیریت گزارشها
- مدیریت دستهبندی
- مدیریت ویژگیهای دستهها
- مدیریت location
- audit

==================================================
3. چیزهایی که فعلاً نباید بسازیم
==================================================

فعلاً نساز:

- checkout
- cart
- online payment
- wallet
- delivery
- shipping
- internal chat
- auction
- bidding
- cryptocurrency
- AI recommendation
- AI image generation
- AI moderation
- massive animation system
- 3D
- autoplay video hero
- unnecessary carousel
- heavy map integration
- social media clone
- complex seller analytics dashboard
- Redux unless a real requirement proves it necessary

معماری باید برای آینده آماده باشد،
اما قابلیتهای آینده را زودتر از نیاز واقعی پیاده نکن.

==================================================
4. تکنولوژی نهایی
==================================================

Frontend:

Next.js
React
TypeScript
Tailwind CSS
shadcn/ui

Data:

TanStack Query
Native fetch

Forms:

React Hook Form
Zod

URL state:

nuqs

Icons:

Lucide React

Testing:

Jest
React Testing Library
Playwright
axe

API typing:

OpenAPI-generated TypeScript types

Performance:

next/image
next/font
lazy loading
code splitting
route-level loading
server components by default

DO NOT use:

Axios unless there is a documented reason.
Redux unless there is a documented reason.
Framer Motion for routine UI.
Large animation libraries.
UI libraries that duplicate shadcn/ui.
Huge icon packages.

==================================================
5. معماری React
==================================================

اصل:

Server Components by default.

Client Components فقط زمانی استفاده شوند که واقعاً نیاز به:

- useState
- useEffect
- event handlers
- browser APIs
- interactive UI

وجود دارد.

نباید کل صفحه را با:

"use client"

تبدیل به Client Component کنیم.

صفحات public تا حد امکان:

Server-rendered
SEO-friendly
cacheable
small

باشند.

==================================================
6. ساختار پروژه
==================================================

اگر repository خالی است، ساختار پیشنهادی:

src/
│
├── app/
│
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── search/
│   │   ├── category/
│   │   ├── listing/
│   │   └── seller/
│   │
│   ├── (auth)/
│   │   └── auth/
│   │
│   ├── (account)/
│   │   ├── favorites/
│   │   ├── my-listings/
│   │   ├── sell/
│   │   └── account/
│   │
│   ├── admin/
│   │
│   ├── error.tsx
│   ├── not-found.tsx
│   ├── loading.tsx
│   ├── robots.ts
│   ├── sitemap.ts
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── navigation/
│   ├── feedback/
│   └── forms/
│
├── features/
│   ├── auth/
│   ├── listings/
│   ├── search/
│   ├── categories/
│   ├── locations/
│   ├── sellers/
│   ├── favorites/
│   ├── reports/
│   ├── media/
│   ├── account/
│   └── admin/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── seo/
│   ├── formatting/
│   ├── performance/
│   ├── analytics/
│   └── utils/
│
├── hooks/
│
├── schemas/
│
├── i18n/
│
├── types/
│
└── styles/

اصل مهم:

app/
= routing + composition

features/
= business-facing frontend functionality

components/ui/
= reusable visual primitives

lib/
= infrastructure/helpers

نباید business logic را در components/ui قرار دهی.

==================================================
7. API CONTRACT
==================================================

Backend دارای OpenAPI است.

Frontend نباید interfaceهای API را دستی و پراکنده تعریف کند.

از OpenAPI برای تولید TypeScript types استفاده کن.

مثال:

packages/api-types/

یا:

src/types/generated-api.ts

اگر repository monorepo است،
ترجیحاً generated API types را در package مشترک قرار بده.

اما:

Frontend نباید به Prisma types وابسته شود.

Frontend فقط API contract را میشناسد.

==================================================
8. API CLIENT
==================================================

یک API client مرکزی بساز.

مثلاً:

lib/api/client.ts
lib/api/server.ts
lib/api/errors.ts

وظیفه:

- base URL
- headers
- credentials
- JSON parsing
- request timeout
- error normalization
- request ID
- authentication handling

را متمرکز کند.

هیچ feature نباید برای خودش fetch wrapper جدا بسازد.

بد:

fetch("/api/...")
axios(...)
fetch(...)
fetch(...)

در تمام پروژه.

خوب:

apiClient.get(...)
apiClient.post(...)

==================================================
9. AUTH FRONTEND
==================================================

هرگز:

access token
refresh token

را در:

localStorage
sessionStorage

ذخیره نکن.

طبق قرارداد Backend:

refresh session باید با HttpOnly Secure cookie مدیریت شود.

Access token در صورت استفاده در browser فقط در memory نگهداری شود
و هرگز persist نشود.

اگر معماری backend امکان cookie-based access authentication را
با امنیت مناسب فراهم کند، از آن استفاده شود.

هیچ token نباید:

- در URL
- query string
- localStorage
- logs
- analytics
- error tracking

قرار گیرد.

==================================================
10. AUTH FLOW
==================================================

صفحات:

/auth/login
/auth/register
/auth/verify
/auth/forgot-password
/auth/reset-password

Flow:

Register
→ OTP
→ Verify
→ Login/session

UI باید بتواند:

- resend OTP
- countdown
- paste OTP
- خطای OTP
- expired OTP
- too many attempts

را درست مدیریت کند.

==================================================
11. ACCESSIBLE OTP INPUT
==================================================

به جای ساخت 6 input کاملاً جدا که تجربه paste را خراب کند،
یک ورودی accessible یا component مناسب بساز که:

- paste کامل OTP
- keyboard
- Android keyboard
- iOS keyboard
- RTL
- auto-focus
- auto-submit در صورت نیاز

را درست مدیریت کند.

==================================================
12. I18N
==================================================

زبان اصلی:

fa-AF

direction:

rtl

text باید از نظر ساختار طوری باشد که آینده بتواند:

fa-AF
ps-AF
en

را اضافه کند.

اما برای MVP سیستم چندزبانه پیچیده نساز.

تمام متنهای UI نباید داخل JSX پراکنده باشند.

از dictionary structure استفاده کن.

مثلاً:

i18n/fa-AF/common.ts
i18n/fa-AF/listings.ts
i18n/fa-AF/auth.ts

زبان پیشفرض:

fa-AF

HTML:

lang="fa-AF"
dir="rtl"

==================================================
13. فارسی و RTL
==================================================

RTL باید از ابتدا native باشد.

نباید سایت را LTR بسازی و در پایان:

direction: rtl;

به آن بچسبانی.

تمام spacingها و positioningها باید logical باشند.

ترجیح:

margin-inline-start
margin-inline-end
padding-inline
inset-inline-start
inset-inline-end

به جای hardcoded:

margin-left
margin-right

هر جا ممکن است.

Icons جهتدار باید در RTL درست باشند.

مثلاً:

back
forward
chevron
arrow

باید رفتار معنایی داشته باشند، نه صرفاً rotate تصادفی.

==================================================
14. فونت
==================================================

برای Persian از یک font family اصلی استفاده کن.

ترجیحاً یک فونت فارسی web-optimized مثل Vazirmatn یا معادل
سبک و خوانا.

فقط یک خانواده اصلی.

از 4 یا 5 font family استفاده نکن.

فونت باید:

- variable/optimized if available
- subset
- font-display: swap
- minimal weights

داشته باشد.

برای UI فقط وزنهای مورد نیاز:

400
500
600
700

را استفاده کن.

==================================================
15. DESIGN LANGUAGE
==================================================

WeshBazar نباید شبیه clone مستقیم eBay یا Sheypoor باشد.

الهام:

از eBay:
- search-centric design
- filter chips
- clean cards
- structured product information
- strong mobile discovery

از شیپور:
- simplicity
- listing-first experience
- local marketplace feeling
- compact listings

از marketplaceهای حرفهای:
- trust
- clear price
- location
- seller identity
- strong search

اما نتیجه باید هویت بصری اختصاصی WeshBazar داشته باشد.

==================================================
16. BRAND CHARACTER
==================================================

WeshBazar باید حس:

اعتماد
سادگی
سرعت
زندگی واقعی
خرید و فروش محلی
مدرن بودن

را منتقل کند.

نه:

بانکی
خیلی corporate
خیلی luxury
بچهگانه
شلوغ
neon
gaming style

==================================================
17. COLOR SYSTEM
==================================================

از semantic design tokens استفاده کن.

پیشنهاد اولیه:

background:
#F7F8FA

surface:
#FFFFFF

foreground:
#0F172A

muted:
#64748B

border:
#E2E8F0

primary:
#0F766E

primary-hover:
#0B625B

primary-soft:
#E6F5F3

accent:
#F59E0B

success:
#15803D

danger:
#DC2626

warning:
#B45309

اما این رنگها را مستقیم در صدها فایل پخش نکن.

در CSS variables تعریف کن.

مثلاً:

--background
--foreground
--surface
--primary
--primary-foreground
--muted
--border
--danger
--warning
--success

تا بتوان در آینده:

dark mode
brand refresh

را بدون بازنویسی components انجام داد.

==================================================
18. LIGHT-FIRST
==================================================

MVP:

Light theme

باشد.

ولی تمام UI semantic token based باشد تا Dark mode آینده
بدون بازنویسی component architecture اضافه شود.

Hard-coded color داخل componentها ممنوع.

==================================================
19. TYPOGRAPHY SCALE
==================================================

Base body:

16px

این مقدار برای mobile خوانایی خوبی دارد و با راهنمای mobile-friendly
eBay نیز همراستا است.

پیشنهاد:

body:
16px / 24px

small:
13px / 20px

caption:
12px / 18px

title-sm:
18px / 26px

title:
20px / 28px

heading:
24px / 32px

display mobile:
28px / 36px

desktop display:
32px / 40px

در صفحات marketplace از typography بیش از حد بزرگ استفاده نکن.

هدف:

scanability

نه:

marketing landing page.

==================================================
20. SPACING SYSTEM
==================================================

بر مبنای 4px:

4
8
12
16
20
24
32
40
48
64

اصلیترین spacingها:

8
12
16
24
32

باشند.

از اعداد تصادفی مثل:

13px
17px
23px
27px

فقط وقتی واقعاً pixel correction لازم است استفاده کن.

==================================================
21. RADIUS
==================================================

Small control:

8px

Input:

10px

Card:

12px

Large surface:

16px

Modal:

16px

Pill:

9999px

همه جا radius متفاوت نساز.

==================================================
22. SHADOW
==================================================

Shadow باید کم باشد.

اولویت:

border
+
surface contrast

و فقط در موارد لازم:

subtle shadow

از:

massive blur
glassmorphism
heavy drop shadow

استفاده نکن.

==================================================
23. MOBILE-FIRST BREAKPOINTS
==================================================

حداقل پشتیبانی:

320px
360px
390px
430px
480px
768px
1024px
1280px
1440px

Breakpoints اصلی:

< 640:
mobile

640–767:
large mobile

768–1023:
tablet

1024–1279:
desktop

1280+:
large desktop

هیچ صفحهای نباید در width 320px
horizontal overflow داشته باشد.

==================================================
24. CONTENT WIDTH
==================================================

Public content max width:

1280px

Mobile:
padding-inline: 16px

Tablet:
20px

Desktop:
24px

Large desktop:
24px

صفحه نباید تمام عرض 1440px را پر کند.

==================================================
25. TOUCH TARGET
==================================================

حداقل target برای interactive controls:

44x44px

برای primary controls ترجیحاً:

48px height

این مسئله مخصوصاً برای:

favorite
back
menu
filter
sort
contact

مهم است.

==================================================
26. MOBILE HEADER
==================================================

Mobile header باید بسیار ساده باشد.

ترتیب:

Top row:
Logo
Search/menu/profile action

Search باید جزء مهمترین عناصر باشد.

ارتفاع اولیه:

56px

Search field:

48px

Radius:

12px

Input:
font-size: 16px

تا روی mobile browserها از رفتار zoom نامطلوب جلوگیری شود.

==================================================
27. MOBILE NAVIGATION
==================================================

در صفحات عمومی یک bottom navigation سبک داشته باش:

خانه
جستجو
دستهها
علاقهمندیها
حساب

اما:

در صفحات form-heavy مثل Sell
و جزئیات listing
نباید navigation با CTAهای اصلی رقابت کند.

اگر bottom action bar فعال است،
layout باید safe-area را رعایت کند.

از:

env(safe-area-inset-bottom)

استفاده کن.

==================================================
28. HEADER BEHAVIOR
==================================================

Mobile:

header ابتدا visible.

در scroll down:
در صفحات عمومی میتواند کوچک/مخفی شود.

در scroll up:
برگردد.

اما:

در search/results
search control نباید بیدلیل ناپدید شود.

در listing detail:
title/navigation context باید پایدار بماند.

از JS scroll listener سنگین استفاده نکن.

ترجیح:

CSS
+
حداقل JS

==================================================
29. HOME PAGE
==================================================

Homepage نباید یک hero عظیم داشته باشد.

ترتیب mobile:

1.
Header

2.
Search

3.
Location selector

4.
Category shortcuts

5.
Latest listings

6.
Popular categories / useful discovery sections

7.
Sell CTA

8.
Footer

Hero بسیار کوچک یا اصلاً وجود نداشته باشد.

تصویر 2MB برای banner ممنوع.

Autoplay video ممنوع.

==================================================
30. HOME SEARCH
==================================================

Search باید یکی از prominentترین عناصر صفحه باشد.

Placeholder:

"چی میخواهی پیدا کنی؟"

نه:

"Search everything in our marketplace..."

متن محلی و کوتاه.

Search box باید:

- بزرگ
- واضح
- tap-friendly
- سریع
- accessible

باشد.

==================================================
31. LOCATION
==================================================

Location selector:

"همه افغانستان"

یا:

"مزار شریف"

مثلاً:

[ موقعیت: مزار شریف ]

کاربر باید بتواند:

افغانستان
→ ولایت
→ شهر

انتخاب کند.

برای انتخاب location روی mobile:
dialog / context-style panel

استفاده کن.

از صفحه سنگین map در MVP استفاده نکن.

==================================================
32. CATEGORY SHORTCUTS
==================================================

دستههای مهم را با icon یا thumbnail سبک نمایش بده.

نمونه:

موبایل
لپتاپ
موتر
لوازم خانه
لوازم برقی
پوشاک
فرنیچر
سایر

Mobile:
horizontal scroll یا grid سبک

Desktop:
grid

نه 30 کارت بزرگ با تصاویر سنگین.

==================================================
33. CATEGORY CARD
==================================================

Category card:

Mobile:
حدود 92–120px

ارتفاع:
حدود 96–112px

radius:
12px

icon/image:
40–48px

title:
13–14px

فقط اطلاعات ضروری.

==================================================
34. LISTING CARD
==================================================

Listing card یکی از مهمترین components سایت است.

mobile:

horizontal compact card

image:
112px × 112px

aspect:
1:1

text area:
flexible

title:
حداکثر 2 خط

price:
prominent

location:
small

condition:
small badge یا text

favorite:
44x44 target

spacing:
12px

border:
1px solid var(--border)

background:
surface

روی mobile از shadow سنگین استفاده نکن.

==================================================
35. LISTING CARD DESKTOP
==================================================

Desktop:

grid card

image:
aspect 4/3 یا 1/1 بر اساس طراحی نهایی

title:
2 line maximum

price:
clear

location:
compact

created time:
optional

favorite:
top-end

Desktop تعداد ستون:

<768:
1

768–1023:
2

1024–1279:
3

1280+:
4

اگر content width یا image quality اجازه نداد،
column count را کمتر کن.

هدف:

خوانایی

نه:

بیشترین تعداد کارت ممکن.

==================================================
36. IMAGE LOADING
==================================================

تمام listing images:

next/image

استفاده از:

responsive srcsets
sizes
lazy loading

First visible hero/LCP image:

priority/preload فقط در صورت نیاز.

هرگز تمام تصاویر صفحه را preload نکن.

برای listing cards:

loading="lazy"

برای تصویر خارج از viewport:

lazy

==================================================
37. IMAGE BANDWIDTH
==================================================

به خاطر اینترنت ضعیف:

- thumbnail باید thumbnail واقعی باشد
- mobile نباید تصویر desktop با resolution کامل دریافت کند
- image quality کنترل شود
- تصاویر چند مگابایتی مستقیم در card استفاده نشوند

Backend/storage باید variants داشته باشد:

thumbnail
medium
large

Frontend بر اساس context variant مناسب را بگیرد.

==================================================
38. LISTING IMAGE POLICY
==================================================

برای card:

small thumbnail

برای detail:

medium/large

برای image fullscreen:

large/original در صورت درخواست کاربر

همه تصاویر را در اولین request دانلود نکن.

==================================================
39. DETAIL PAGE
==================================================

Listing detail باید از نظر UX مهمترین صفحه سایت باشد.

ترتیب mobile:

1.
Back / Header

2.
Primary Image

3.
Gallery navigation

4.
Price

5.
Title

6.
location / condition / date

7.
dynamic specifications

8.
description

9.
seller card

10.
similar listings

11.
report/share

12.
sticky contact actions

==================================================
40. DETAIL IMAGE GALLERY
==================================================

اولین تصویر:

large

اما سایر تصاویر:

lazy

Thumbnailها:

64–72px

horizontal scroll

No giant carousel library.

Use lightweight React state.

برای transition:

CSS opacity/transform

نه animation library سنگین.

==================================================
41. DETAIL PRICE
==================================================

Price باید یکی از اولین چیزهایی باشد که چشم میبیند.

مثلاً:

۲۵٬۰۰۰ افغانی

یا:

توافقی

یا:

رایگان

از number formatter مخصوص `fa-AF`
استفاده کن.

هیچ floating point formatting در UI انجام نده.

==================================================
42. TITLE
==================================================

Title:

20–24px mobile

font-weight:
700 یا 600

line-height:
1.4

حداکثر طول visual معقول.

هیچ title را با fixed height که متن را قطع کند خراب نکن.

==================================================
43. LOCATION
==================================================

location باید واضح باشد:

مزار شریف، بلخ

نه:

cityId: 13

اما frontend raw backend IDs را نشان نمیدهد.

==================================================
44. SELLER CARD
==================================================

Seller section:

avatar
name
verified phone indicator
member since
active listings

CTA:

"مشاهده آگهیهای فروشنده"

اما تمام اینها server-derived باشد.

==================================================
45. CONTACT BAR
==================================================

در mobile:

sticky bottom action bar

نمونه:

[ تماس ] [ واتساپ ] [ تلگرام ]

اگر روش وجود نداشت:

فقط روشهای فعال نمایش داده شوند.

مثلاً seller فقط phone دارد:

[ تماس ]

و اگر WhatsApp:
[ واتساپ ]

وجود داشت.

Action bar باید با bottom navigation تداخل نداشته باشد.

==================================================
46. CONTACT CLICK
==================================================

Contact click باید:

- analytics event
- loading state در صورت API call
- error state
- graceful fallback

داشته باشد.

اما کاربر را برای contact کردن
به registration مجبور نکن.

==================================================
47. FAVORITE
==================================================

Favorite button:

44x44

icon-only

accessible label

states:

not saved
saved
loading
error

Optimistic update مجاز است.

در صورت failure:

state revert شود.

==================================================
48. SHARE
==================================================

از Web Share API وقتی موجود است استفاده کن.

Fallback:

copy URL

UI:

"لینک آگهی کپی شد"

نه یک modal پیچیده.

==================================================
49. REPORT
==================================================

Report UI:

Mobile:
dialog

Desktop:
dialog/popover appropriate

گزینهها:

کلاهبرداری
کالای ممنوع
کالای سرقتی
اسپم
اطلاعات نادرست
تکراری
سایر

description optional/required based on backend rules.

بعد از submit:

success feedback

نه یک page reload کامل.

==================================================
50. SEARCH PAGE
==================================================

URL:

/search?q=...

تمام filters باید تا حد ممکن در URL باشند.

مثلاً:

/search?q=iphone&category=mobile&province=balkh&minPrice=10000

مزایا:

- shareable
- bookmarkable
- SEO-friendly where appropriate
- browser back works
- state persistence

==================================================
51. URL STATE
==================================================

برای search/filter state:

nuqs

یا یک URL parser مرکزی.

Do NOT store filter state only in React useState.

Browser refresh نباید filterها را نابود کند.

==================================================
52. SEARCH MOBILE HEADER
==================================================

mobile:

search input
filter chip
sort chip

مثلاً:

[ فیلتر ] [ قیمت ] [ وضعیت ] [ مرتبسازی ]

Single row.

Horizontal scroll مجاز.

Chipها wrap نشوند مگر طراحی واقعاً لازم باشد.

الهام از اصول filter فعلی eBay:
filter باید واضح، contextual و قابل reset باشد. 
:contentReference[oaicite:3]{index=3}

==================================================
53. FILTER DIALOG MOBILE
==================================================

برای web mobile:

semantically accessible Dialog

که از پایین ظاهر میشود.

ظاهر میتواند sheet-like باشد،
ولی از نظر accessibility باید dialog استاندارد باشد.

یک dialog:
- scrim
- title
- content
- clear/reset
- apply

 داشته باشد.

از nested modalهای تو در تو اجتناب کن.

==================================================
54. FILTER ORDER
==================================================

ترتیب:

1.
Global / high-priority

2.
Category-related

3.
Location

4.
Price

5.
Condition

6.
Dynamic attributes

7.
Advanced/rare filters

این با اصول طراحی filter فعلی eBay نیز همراستاست. 
:contentReference[oaicite:4]{index=4}

==================================================
55. FILTER COMPONENTS
==================================================

Reusable:

FilterChip
FilterGroup
SingleSelectFilter
MultiSelectFilter
RangeFilter
TextSearchFilter
BooleanFilter
DynamicAttributeFilter
FilterSummary
ClearFiltersButton
ApplyFiltersButton

هر category schema باید بتواند این componentها را dynamically تولید کند.

==================================================
56. DYNAMIC FILTER UI
==================================================

Backend category filter schema را میدهد.

Frontend نباید بنویسد:

اگر mobile بود:
show RAM

اگر car بود:
show mileage

به شکل hardcoded در دهها فایل.

به جای آن:

backend schema
→ parser
→ field registry
→ UI component

مثلاً:

INTEGER
→ NumberRangeFilter

SELECT
→ SelectFilter

MULTI_SELECT
→ MultiSelectFilter

BOOLEAN
→ BooleanFilter

==================================================
57. SEARCH RESULTS
==================================================

Results باید:

- تعداد نتیجه را نشان دهد اگر backend فراهم کرده
- loading
- empty
- error
- retry
- pagination/load more

داشته باشد.

از automatic infinite scroll در MVP پرهیز کن.

بهتر:

"آگهیهای بیشتر"

دکمهای که 20 یا مقدار مناسب بعدی را load کند.

دلیل:

- مصرف دیتا قابل کنترل
- کاربر آگاهانه ادامه میدهد
- footer/navigation کمتر خراب میشود
- مدیریت memory سادهتر

==================================================
58. EMPTY SEARCH
==================================================

اگر نتیجه صفر شد:

"آگهیای با این شرایط پیدا نشد."

و پیشنهاد:

"فیلترها را بازتر کن"

CTA:

"پاک کردن فیلترها"

از empty state عظیم با تصویر 500KB استفاده نکن.

==================================================
59. SEARCH ERROR
==================================================

مثلاً:

"بارگذاری آگهیها انجام نشد."

[ دوباره تلاش کن ]

Error technical details را نشان نده.

==================================================
60. SORT
==================================================

گزینهها:

جدیدترین
ارزانترین
گرانترین
پربازدیدترین

در صورت پشتیبانی backend.

روی mobile:
dialog یا compact popover

==================================================
61. CATEGORY PAGE
==================================================

URL:

/category/[slug]

ساختار:

header
breadcrumb
category title
child categories
filters
listings

اگر category parent است:

subcategory shortcuts

اگر leaf category است:

dynamic filters

==================================================
62. BREADCRUMB
==================================================

Desktop:

خانه > وسایل نقلیه > موتر > تویوتا

Mobile:

فقط context مهم

مثلاً:

← موتر

از breadcrumbهای 8 لایه روی mobile اجتناب کن.

==================================================
63. SELL FLOW
==================================================

مسیر:

/sell

باید mobile-first باشد.

کاربر نباید با یک فرم 50-field
در یک صفحه منفجر شود.

Flow:

1.
Category

2.
Photos

3.
Basic information

4.
Dynamic attributes

5.
Price

6.
Location

7.
Contact methods

8.
Preview

9.
Submit

اما stepها تا حد ممکن کم باشند.

اگر فرم کوتاه بود:
میتواند یک صفحه با sectionهای واضح باشد.

اگر category فرم سنگین داشت:
progressive steps.

==================================================
64. SELL CATEGORY PICKER
==================================================

Mobile category picker:

search
parent categories
child categories

tap target:
48px

بدون deep navigation پیچیده.

کاربر نباید 4 modal تو در تو باز کند.

==================================================
65. IMAGE UPLOADER
==================================================

ImageUploader component:

- drag/drop desktop
- file picker mobile
- camera capture where browser supports it
- preview
- reorder
- primary image
- delete
- upload progress
- retry
- failure
- max image limit
- max size

Mobile باید بسیار ساده باشد.

CTA:

"عکس اضافه کن"

==================================================
66. LOW-BANDWIDTH IMAGE COMPRESSION
==================================================

قبل از upload:

اگر تصویر خیلی بزرگ است،
در browser با native image APIs
تا حد معقول resize/compress کن.

ترجیحاً:

max dimension:
1920px

قابل تنظیم.

quality:
حدود 0.8

اما فقط وقتی واقعاً لازم است.

Never process 10 images simultaneously.

Sequential یا controlled concurrency.

اگر browser compression پشتیبانی نکرد:
fallback به original با warning مناسب.

==================================================
67. AUTOSAVE SELL FORM
==================================================

فروشنده ممکن است اینترنت ضعیف داشته باشد.

متن draft باید به صورت local ذخیره شود.

مثلاً:

localStorage

فقط:

- title
- description
- price
- category
- attributes
- location
- contact preferences

ذخیره شود.

توکنها و دادههای حساس ذخیره نشوند.

برای تصاویر خام:
localStorage استفاده نکن.

Draft باید:

TTL داشته باشد.

==================================================
68. FORM RECOVERY
==================================================

اگر کاربر:

- browser را بست
- اینترنت قطع شد
- refresh کرد

بعداً:

"ادامه پیشنویس قبلی؟"

نشان بده.

این ویژگی برای UX واقعی فروشنده بسیار مهم است.

==================================================
69. FORM VALIDATION
==================================================

React Hook Form
+
Zod

برای client-side UX.

اما:

Frontend validation
هرگز جای backend validation نیست.

Frontend:
user feedback

Backend:
source of truth

==================================================
70. DYNAMIC ATTRIBUTE FORM
==================================================

Backend schema:

brand
model
ram
storage
...

Frontend:

DynamicFieldRenderer

مثلاً:

TEXT → TextField
INTEGER → NumberField
SELECT → Select
MULTI_SELECT → MultiSelect
BOOLEAN → Switch/Checkbox
YEAR → YearSelect/Input

هیچ category-specific JSX
در صفحه اصلی Sell پراکنده نشود.

==================================================
71. PRICE INPUT
==================================================

Price input باید:

- Persian digits را درست handle کند
- English digits را نیز قبول کند
- commas را مدیریت کند
- مقدار واقعی numeric را به API بدهد

مثلاً:

"25,000"

یا:

"۲۵٬۰۰۰"

→

25000

UI:

"افغانی"

اما currency hardcoded در business logic نباشد.

==================================================
72. PREVIEW LISTING
==================================================

قبل از submit:

"پیشنمایش آگهی"

باید تا حد ممکن همان ListingCard و ListingDetail components واقعی را
re-use کند.

یعنی preview یک component جدا و ناسازگار نباشد.

==================================================
73. LISTING STATES UI
==================================================

Badgeها:

پیشنویس
در حال بررسی
فعال
رد شده
فروخته شد
بایگانی شده

رنگ semantic داشته باشند.

ولی فقط از رنگ برای meaning استفاده نکن.

مثلاً:

آیکون + text + color

==================================================
74. MY LISTINGS
==================================================

Route:

/my-listings

Tabs:

همه
فعال
در بررسی
فروخته
پیشنویس
رد شده

Mobile:
horizontal tab scroll

Desktop:
tabs

هر tab نباید request جدید بیجهت ایجاد کند اگر data
قابل reuse باشد.

==================================================
75. SELLER DASHBOARD MOBILE
==================================================

Mobile-first.

اول:

"آگهی جدید"

بعد:

active listings
pending
sold

Stats ساده.

در MVP chart سنگین لازم نیست.

==================================================
76. SELLER LISTING MANAGEMENT
==================================================

هر listing actions:

ویرایش
فروش رفت
بایگانی
تمدید

اگر action مخرب است:

confirmation dialog.

Delete واقعی تا حد ممکن پنهان و کنترلشده باشد.

برای marketplace ترجیح:

archive

به delete.

==================================================
77. ACCOUNT PAGE
==================================================

Mobile:

پروفایل
آگهیهای من
علاقهمندیها
امنیت
شماره تلفن
خروج

ساده و لیستمحور.

از dashboardهای پیچیده برای user عادی اجتناب کن.

==================================================
78. FAVORITES PAGE
==================================================

Route:

/favorites

Listing cards reuse شوند.

States:

loading
empty
error
logged out

اگر anonymous:

"برای ذخیره آگهیها وارد حساب شو"

اما browse را block نکن.

==================================================
79. SELLER PUBLIC PAGE
==================================================

URL:

/seller/[slug]

نمایش:

seller name
verification
member since
listing count
active listings

و grid/list listings.

Private information نمایش نده.

==================================================
80. ADMIN
==================================================

Admin frontend باید responsive باشد
ولی desktop-first architecture میتواند داشته باشد.

Desktop:

sidebar
top bar
content

Mobile:

compact header
navigation drawer
cards instead of massive tables

==================================================
81. ADMIN DASHBOARD
==================================================

Dashboard اولیه:

active listings
pending moderation
reports
users
sold listings
contact events

No huge chart library.

Prefer:

stat cards
simple tables
small lightweight visualizations if needed later.

==================================================
82. ADMIN TABLE
==================================================

Desktop:

table

Mobile:

stacked cards

نباید table در موبایل باعث horizontal scrolling ناخوشایند شود
مگر برای data واقعاً جدولی.

==================================================
83. LOADING STATES
==================================================

هر route و async component باید loading strategy داشته باشد.

استفاده:

loading.tsx
Suspense
Skeleton

اما:

Skeleton برای کل صفحه 50 خط نباشد.

3–6 skeleton item
معمولاً کافی است.

==================================================
84. SKELETON POLICY
==================================================

Skeleton باید شکل تقریبی content را حفظ کند.

این کار باعث کاهش layout shift میشود.

برای images:

aspect ratio را از قبل مشخص کن.

برای title:

max line structure

را مشخص کن.

==================================================
85. ERROR BOUNDARIES
==================================================

ایجاد کن:

global error
route error
feature error

Error UI:

قابل فهم
قابل retry
بدون stack trace

==================================================
86. 404
==================================================

404 page باید:

ساده
سریع
قابل بازگشت

باشد.

مثلاً:

"این صفحه پیدا نشد"

[ برگشت به خانه ]

==================================================
87. OFFLINE / POOR NETWORK UX
==================================================

Frontend باید قطع اینترنت را بفهمد.

در صورت offline:

یک banner یا compact message:

"اتصال اینترنت قطع است"

برای requestهای شکستخورده:

"دوباره تلاش کن"

اما صفحه را نابود نکن.

==================================================
88. RETRY POLICY
==================================================

GETهای safe:

retry محدود

مثلاً:
1–2 بار

Mutationها:

default automatic retry نکن.

مثلاً:

POST listing
POST report
POST contact

نباید به شکل کورکورانه دوباره اجرا شوند.

برای mutationهای حساس:

idempotency-aware design

==================================================
89. NETWORK TIMEOUT
==================================================

Fetch client باید timeout داشته باشد.

یک request نباید برای همیشه pending بماند.

Timeout configurable باشد.

==================================================
90. TANSTACK QUERY
==================================================

برای client-side server state:

TanStack Query

استفاده کن.

Query keys متمرکز:

queryKeys.ts

مثلاً:

listings
listing
categories
category
locations
seller
favorites
me

هر feature query key خودش را پراکنده تعریف نکند.

==================================================
91. QUERY CACHING
==================================================

دادههای کمتغییر:

categories
locations
filter schemas

staleTime بلندتر.

مثلاً چند دقیقه.

دادههای listing:

staleTime کوتاهتر.

دادههای user:

بر اساس mutation invalidate شوند.

از polling مداوم استفاده نکن.

==================================================
92. SERVER DATA VS CLIENT STATE
==================================================

Server data:

TanStack Query

URL state:

nuqs

UI state:

React useState

Global UI state فقط اگر واقعاً لازم شد.

Redux ممنوع مگر architecture review ضرورت آن را ثابت کند.

==================================================
93. SEARCH PREFETCH
==================================================

به خاطر اینترنت ضعیف:

listing links:

prefetch={false}

مگر مواردی که prefetch واقعاً ارزشمند و سبک باشد.

Next.js automatic prefetch نباید باعث شود
کاربر بدون قصد، دهها listing سنگین را preload کند.

==================================================
94. ROUTE CACHING
==================================================

Public data:

تا حد ممکن server-cached/revalidated.

مثلاً:

categories
locations

را زیاد fetch نکن.

Listing pages میتوانند revalidate کوتاه داشته باشند
در صورتی که business requirement اجازه دهد.

Authenticated pages:

personalized/no-store appropriately

طبق auth architecture.

==================================================
95. PERFORMANCE FIRST
==================================================

اصلی:

JavaScript کمتر
Image کمتر
Network request کمتر
DOM کمتر

زیبایی با CSS و composition ساخته شود،
نه با libraryهای سنگین.

==================================================
96. PERFORMANCE BUDGET
==================================================

هدفهای مهندسی:

- initial JS را تا جای ممکن پایین نگه دار
- از chunkهای بزرگ جلوگیری کن
- first viewport imageها را محدود کن
- فونت را کوچک نگه دار
- فقط یک LCP candidate داشته باش
- third-party script تا حد ممکن صفر در MVP

به عنوان target داخلی:

mobile route initial JS:
ترجیحاً زیر حدود 150KB gzip

و در صورت عبور قابل توجه:
علت ثبت و بررسی شود.

این یک budget هدف است، نه ضمانت.

==================================================
97. CORE WEB VITALS
==================================================

Measure:

LCP
INP
CLS

نیز:

TTFB

و page-level request performance.

Goal:

LCP:
هدف ≤ 2.5s در شرایط مناسب

CLS:
هدف ≤ 0.1

INP:
هدف پاسخگویی سریع و نزدیک به محدوده good

اما گزارش performance باید
با محیط تست و شبکه مشخص انجام شود.

هر عددی بدون context به عنوان guarantee ثبت نشود.

==================================================
98. IMAGE PERFORMANCE
==================================================

هر image:

width
height
aspect ratio

داشته باشد.

از layout shift جلوگیری کن.

فقط تصویر LCP:

priority

بگیرد.

نه 20 تصویر.

==================================================
99. CSS PERFORMANCE
==================================================

Tailwind classes.

از:

giant global CSS

اجتناب کن.

CSS باید:

small
predictable
semantic

باشد.

==================================================
100. ANIMATION POLICY
==================================================

Default:

CSS transitions

مجاز:

opacity
transform
background-color
box-shadow subtle

Duration:

120–200ms

برای micro interactions.

هیچ animationی نباید interaction را کند کند.

از:

layout animation
large blur
continuous parallax
scroll-based heavy JS

اجتناب کن.

==================================================
101. REDUCED MOTION
==================================================

برای:

prefers-reduced-motion

animationها کاهش/خاموش شوند.

==================================================
102. HOVER
==================================================

Hover فقط برای desktop enhancement.

هیچ functionality نباید فقط با hover قابل استفاده باشد.

Mobile:

tap-first

==================================================
103. ACCESSIBILITY
==================================================

از semantic HTML استفاده کن.

مثلاً:

button
nav
main
header
footer
section
article

نه div برای همه چیز.

==================================================
104. KEYBOARD
==================================================

Desktop باید با keyboard قابل استفاده باشد.

Tab order
focus visible
Escape
Enter
Space

در:

dialog
dropdown
filter
search
forms

صحیح باشند.

==================================================
105. FOCUS
==================================================

هیچ focus outline را کورکورانه حذف نکن.

Custom focus style داشته باش.

==================================================
106. DIALOG
==================================================

Dialog باید:

- focus trap
- Escape
- labelled
- aria semantics
- close action
- body scroll lock
- mobile viewport handling

داشته باشد.

==================================================
107. ICONS
==================================================

Lucide React.

Icon-only button:

aria-label

داشته باشد.

مثلاً:

favorite:
"افزودن به علاقهمندیها"

==================================================
108. COLOR ACCESSIBILITY
==================================================

رنگ نباید تنها indicator باشد.

مثلاً SOLD:

[● فروخته شد]

نه فقط:

grey color

==================================================
109. FORM ERRORS
==================================================

Error باید کنار field نمایش داده شود.

مثلاً:

قیمت نمیتواند منفی باشد.

نه:

"validation failed"

و تمام.

==================================================
110. MOBILE KEYBOARD
==================================================

فرمها باید با keyboard mobile آزمایش شوند.

به خصوص:

price
phone
OTP
search

برای numeric inputs:

inputMode

درست تنظیم شود.

==================================================
111. INPUT TYPE
==================================================

برای phone:

type="tel"

برای price:

inputMode="decimal"

برای search:

type="search"

ولی type باید معنایی باشد و UX را خراب نکند.

==================================================
112. SEARCH AUTOCOMPLETE
==================================================

MVP:

recent searches local

اختیاری

max 5–10

No huge analytics request.

Future:

search suggestions
popular terms

==================================================
113. SEARCH DEBOUNCE
==================================================

Autocomplete اگر بعداً اضافه شد:

debounce

مثلاً حدود 200–300ms

و cancel previous requests.

اما search submit اصلی نباید
کاربر را مجبور به صبر مصنوعی کند.

==================================================
114. LISTING DETAIL DATA SPLIT
==================================================

Server-rendered:

title
price
location
images
attributes
seller summary

Client:

favorite
share
contact interaction
gallery state
report dialog

تا client bundle کوچک بماند.

==================================================
115. SEO
==================================================

هر listing public باید:

title
description
canonical
Open Graph
social image where available

داشته باشد.

==================================================
116. SEO LISTING TITLE
==================================================

مثلاً:

"Samsung Galaxy S23 256GB | فروش در مزار شریف | WeshBazar"

اما title generation باید reusable باشد.

عنوانهای مصنوعی و keyword stuffing ممنوع.

==================================================
117. SEO CATEGORY
==================================================

Category page:

title
description
canonical
breadcrumbs

داشته باشد.

==================================================
118. NOINDEX
==================================================

اینها نباید index شوند:

/auth/*
/account/*
/admin/*
/sell/*
/favorites
private user pages

و pages بیارزش query combinations
باید strategy مناسب داشته باشند.

==================================================
119. SITEMAP
==================================================

ایجاد:

sitemap

برای:

categories
public sellers
active public listings

به شکل scalable.

اگر تعداد listing زیاد شد:
sitemap index

استفاده شود.

==================================================
120. ROBOTS
==================================================

robots.ts

بساز.

Admin/private routes را block کن.

اما sitemap را expose کن.

==================================================
121. JSON-LD
==================================================

در صفحات عمومی که semantic data واقعاً دقیق است:

BreadcrumbList
WebSite
ItemList

و در صورت صدق اطلاعات:

Product/Offer

استفاده شود.

هرگز اطلاعات ساختگی مثل:

rating
review
stock
brand

اضافه نکن.

==================================================
122. URL DESIGN
==================================================

Listing:

/listing/[slug]

Category:

/category/[slug]

Seller:

/seller/[slug]

Search:

/search

URL باید:

human-readable
stable
shareable

باشد.

==================================================
123. ADMIN SEO
==================================================

Admin pages:

noindex

و public sitemap شامل admin نشود.

==================================================
124. COMPONENT SYSTEM
==================================================

Primitive components:

Button
IconButton
Input
Textarea
Label
Select
Checkbox
RadioGroup
Switch
Badge
Chip
Avatar
Separator
Skeleton
Spinner
Tooltip
Dialog
Dropdown
Popover
Pagination
Tabs
Accordion
Sheet-like Dialog
Toast

اما فقط componentهایی را که واقعاً استفاده میشوند بساز.

==================================================
125. LAYOUT COMPONENTS
==================================================

AppShell
PublicHeader
MobileHeader
DesktopHeader
MobileBottomNav
PageContainer
Section
Stack
Cluster
ResponsiveGrid
StickyActionBar
Footer

==================================================
126. MARKETPLACE COMPONENTS
==================================================

ListingCard
ListingListItem
ListingGrid
ListingPrice
ListingMeta
ListingLocation
ConditionBadge
FavoriteButton
ListingImage
ListingGallery
ListingAttributes
ListingDescription
SellerCard
SellerSummary
ContactActions
ReportDialog
ShareButton
CategoryCard
CategoryGrid
FilterChip
FilterPanel
SortSelector
SearchBar
LocationSelector
EmptyListings
ListingSkeleton

==================================================
127. SELL COMPONENTS
==================================================

CategoryPicker
ImageUploader
ImagePreview
ImageReorder
DynamicAttributeForm
PriceInput
LocationPicker
ContactMethodSelector
ListingPreview
DraftRecoveryBanner
PublishSummary
SubmissionStatus

==================================================
128. ACCOUNT COMPONENTS
==================================================

ProfileCard
MyListingCard
ListingStatusBadge
AccountMenu
SecuritySection
PhoneVerificationStatus
FavoriteList

==================================================
129. ADMIN COMPONENTS
==================================================

AdminShell
AdminSidebar
AdminMobileNav
AdminStatCard
AdminTable
AdminCard
ModerationQueue
ReportQueue
UserModerationPanel
CategoryManager
AttributeManager
LocationManager
AuditLogTable

==================================================
130. COMPONENT DESIGN RULE
==================================================

Reusable component باید:

- prop API کوچک
- predictable
- accessible
- theme-aware
- RTL-safe
- responsive

باشد.

اما:

"generic universal component"

نساز که 42 props داشته باشد.

==================================================
131. LISTING CARD SINGLE SOURCE
==================================================

ListingCard نباید چهار implementation جدا داشته باشد.

ممکن است variants داشته باشد:

compact
default
featured-future

اما business data mapping مشترک بماند.

==================================================
132. RESPONSIVE VARIANTS
==================================================

Responsive behavior:

Mobile:
list-first

Tablet:
2 columns

Desktop:
grid

اما component identity یکی باشد.

CSS/media queries:
layout

React conditional rendering:
فقط وقتی لازم است.

==================================================
133. DATA FORMATTERS
==================================================

مرکز formatter بساز:

formatPrice()
formatDate()
formatRelativeDate()
formatPhone()
formatLocation()
formatNumber()

در featureها دوباره formatter نساز.

==================================================
134. DATE
==================================================

UI فارسی.

برای مثال:

امروز
دیروز
۳ روز پیش

اما هنگام نیاز:

تاریخ دقیق

نمایش بده.

Timezone backend:
UTC

frontend:
local display

==================================================
135. NUMBER FORMAT
==================================================

از Intl استفاده کن.

فارسی:

fa-AF

برای قیمت:

۲۵٬۰۰۰

اما API:

25000

==================================================
136. PHONE DISPLAY
==================================================

Phone باید public/private policy backend را رعایت کند.

Frontend هرگز full phone را
در listing card عمومی نشان ندهد.

==================================================
137. TRUST SIGNALS
==================================================

Trust UI را از ابتدا طراحی کن.

مثلاً:

تلفن تأیید شده
عضو از...
تعداد آگهی فعال

اما:

"فروشنده معتبر"
"Trusted seller"

فقط وقتی backend چنین claimی واقعاً دارد.

هرگز trust score جعلی نشان نده.

==================================================
138. CONTACT UX
==================================================

تماس باید friction پایین داشته باشد.

مثلاً:

☎ تماس
WhatsApp
Telegram

اما user نباید ابتدا:

login
register
profile completion

کند.

==================================================
139. SELLER TRUST
==================================================

Seller card باید حس:

"این آدم واقعی و قابل شناسایی در حد لازم است"

بدهد.

اما privacy رعایت شود.

==================================================
140. MARKETPLACE SAFETY
==================================================

مکان مناسب برای:

"هنگام خرید احتیاط کنید"

باشد.

مثلاً در detail:

هیچوقت قبل از دیدن کالا پول ارسال نکنید.

این متن باید generic safety guidance باشد.

در future CMS/configurable شود.

==================================================
141. NO FAKE CONTENT
==================================================

در UI هیچ:

- fake rating
- fake reviews
- fake sales count
- fake online status
- fake seller trust badge

نساز.

برای demo seed میتوانی data واضحاً development-only داشته باشی.

==================================================
142. HOME LISTING SECTIONS
==================================================

MVP:

جدیدترین آگهیها

براساس backend:

ACTIVE + createdAt

بعداً:

محبوبترین
نزدیک شما
پیشنهادی
boosted

به عنوان feature جدا.

==================================================
143. NO FAKE PERSONALIZATION
==================================================

اگر backend recommendation ندارد:

"پیشنهاد شده برای شما"

نمایش نده.

==================================================
144. ANALYTICS FRONTEND
==================================================

یک abstraction بساز:

AnalyticsClient

Events:

page_view
listing_view
search
filter_apply
favorite_add
favorite_remove
contact_phone
contact_whatsapp
contact_telegram
report_submit
listing_create
listing_submit

در MVP analytics باید lightweight باشد.

==================================================
145. ANALYTICS MUST NOT BLOCK UX
==================================================

Analytics request:

fire-and-forget

نباید navigation یا interaction را منتظر نگه دارد.

برای eventهای lightweight:
navigator.sendBeacon

در صورت مناسب بودن.

==================================================
146. WEB VITALS
==================================================

در production measurement:

LCP
INP
CLS

جمعآوری شود.

اما analytics infrastructure نباید
صفحه را کند کند.

==================================================
147. PRIVACY ANALYTICS
==================================================

Analytics نباید:

password
token
full phone
private user data

را بفرستد.

==================================================
148. ERROR OBSERVABILITY
==================================================

Frontend error logger abstraction داشته باشد.

مثلاً:

reportError()

اما provider-specific implementation
نباید در componentها پخش شود.

==================================================
149. THIRD-PARTY POLICY
==================================================

در MVP third-party scripts بسیار محدود.

از:

chat widgets
ads
heatmaps
trackers

تا حد ممکن خودداری.

هر script خارجی باید:

- ارزش واضح
- performance impact
- privacy implications

داشته باشد.

==================================================
150. PERFORMANCE ON LOW-END PHONES
==================================================

فرض کن کاربر:

RAM پایین
CPU متوسط/ضعیف
Android قدیمی
browser متوسط

دارد.

پس:

- long React component tree
- huge SVG
- animated background
- blur effects
- canvas
- video
- enormous DOM

ممنوع مگر ضرورت ثابت شده.

==================================================
151. MEMORY
==================================================

Listing pages ممکن است long باشند.

پس:

- تصاویر را unload/lazy کن
- stateهای غیرضروری را نگه ندار
- event listeners را cleanup کن
- giant arrays را بیدلیل duplicate نکن

==================================================
152. LIST VIRTUALIZATION
==================================================

MVP:

لازم نیست.

وقتی تعداد render شدهها واقعاً زیاد شد:

react virtualization

بررسی شود.

مثلاً admin tableهای بسیار بزرگ.

==================================================
153. MOBILE HOME PERFORMANCE
==================================================

First viewport باید کوچک باشد.

در ابتدا:

Logo
Search
Location
first categories
first listings

بارگذاری شوند.

قسمت پایین صفحه:

lazy/render later

==================================================
154. NO AUTOLOAD EVERYTHING
==================================================

Home:

فقط first batch

Search:

first batch

Next batch:
on user action

این تصمیم عمداً برای network ضعیف است.

==================================================
155. RESPONSIVE GRID
==================================================

CSS Grid.

Mobile:
1-column list

Desktop:
grid

Avoid JS window.innerWidth branching
برای layout ساده.

==================================================
156. CSS RESPONSIVE
==================================================

Prefer:

CSS media queries

به:

React resize listeners

مگر behavior واقعاً متفاوت باشد.

==================================================
157. IMAGE OBJECT FIT
==================================================

Marketplace card:

object-fit: cover

Detail:

object-fit: contain

برای کالاهای مختلف باید image crop
تا حد ممکن اطلاعات اصلی را از بین نبرد.

==================================================
158. IMAGE BACKGROUND
==================================================

در ListingCard از background سطح خنثی استفاده کن.

اگر image transparency دارد:
surface مناسب.

==================================================
159. CARD TEXT
==================================================

Title line clamp:
2

Description:
نه در card

Location:
1 line

Price:
1 line

Meta:
حداکثر 1–2 line

هدف:
اسکن سریع.

==================================================
160. SKELETON WIDTH
==================================================

Skeleton باید dimension واقعی content را تقلید کند.

نه:

random grey boxes

==================================================
161. TOAST
==================================================

برای:

favorite saved
copy success
draft saved

استفاده کن.

برای خطاهای مهم:
inline error

نه 10 toast پشت سر هم.

==================================================
162. CONFIRM DIALOG
==================================================

برای:

mark sold
archive
delete image

استفاده کن.

متن:

کوتاه و روشن.

==================================================
163. MOBILE SHEET POLICY
==================================================

برای web:

dialog semantics

ظاهر bottom-sheet style

مجاز.

اما:

nested sheets

ممنوع.

این با اصول accessibility و الگوهای responsive طراحی eBay همراستاست. :contentReference[oaicite:5]{index=5}

==================================================
164. DESKTOP FILTER
==================================================

در desktop:

sidebar یا filter panel

مجاز.

در mobile:

dialog

در tablet:

adaptive panel

==================================================
165. RESPONSIVE HEADER
==================================================

Desktop:

logo
search
location
sell CTA
favorites/account

Mobile:

logo
search
compact account/menu

هرگز تمام navigation desktop را فشرده داخل 360px نکن.

==================================================
166. SELL CTA
==================================================

دکمه:

"ثبت آگهی"

باید visible باشد.

اما:

sticky huge floating button
که content را میپوشاند

نساز.

==================================================
167. MOBILE CTA
==================================================

در mobile میتوان:

sticky compact CTA

داشت.

ولی safe-area رعایت شود.

==================================================
168. DESKTOP NAV
==================================================

Desktop header میتواند:

logo
search large
category
sell
favorites
account

داشته باشد.

Spacing generous.

==================================================
169. FOOTER
==================================================

Footer باید ساده باشد:

دستهها
راهنما
امنیت
درباره
تماس
قوانین

اما links فیک نگذار.

==================================================
170. TRUST FOOTER
==================================================

در آینده میتواند داشته باشد:

security
verification
seller guidelines

اما فعلاً ادعای تایید قانونی/نماد/بانکی نساز.

==================================================
171. MODAL POLICY
==================================================

Modal فقط برای:

focused task

استفاده شود.

برای صفحه کامل:

new route/page

بهتر است.

==================================================
172. SCROLL RESTORATION
==================================================

وقتی کاربر:

search
→ listing
→ back

میرود:

scroll position
و search state

تا حد ممکن حفظ شود.

این feature برای marketplace بسیار مهم است.

==================================================
173. BROWSER BACK
==================================================

Filter URL-based باشد.

Back browser باید رفتار طبیعی داشته باشد.

History را با هر tiny filter mutation بیجهت پر نکن.

برای بعضی filter controls:
replace

بعد از apply:
push

استراتژی مشخص باشد.

==================================================
174. FORM NAVIGATION
==================================================

در sell flow:

اگر dirty form است
و کاربر میخواهد خارج شود:

warning

اما draft recovery وجود دارد،
پس warning باید آزاردهنده نباشد.

==================================================
175. ERROR RECOVERY
==================================================

مثلاً upload عکس fail شد:

فقط همان عکس:

Retry

نه کل فرم reset شود.

==================================================
176. MUTATION FEEDBACK
==================================================

هر mutation:

idle
pending
success
error

state داشته باشد.

Button هنگام submit:

disabled یا loading

اما user نباید حس کند interface مرده است.

==================================================
177. OPTIMISTIC UX
==================================================

مناسب:

favorite

مناسب نیست بدون policy:

listing publish
mark sold
delete account

برای موارد حساس:

server-confirmed UI

==================================================
178. ACCESSIBILITY LABELS
==================================================

متن visible و aria-label
نباید بیدلیل متفاوت باشند.

==================================================
179. LINK SEMANTICS
==================================================

Navigation:

<Link>

Actions:

<button>

به جای:

clickable div

==================================================
180. CARD CLICK
==================================================

اگر کل card clickable است:

semantic link

داشته باشد.

Favorite button داخل آن نباید navigation ناخواسته trigger کند.

Event propagation درست مدیریت شود.

==================================================
181. LISTING SHARING URL
==================================================

URL باید stable باشد.

Query state نباید بخشی از canonical listing URL باشد
مگر نیاز واقعی.

==================================================
182. SECURITY FRONTEND
==================================================

هیچ:

dangerouslySetInnerHTML

برای listing content استفاده نکن.

title/description:

plain text

باشد.

اگر در آینده rich text آمد:
sanitization explicit.

==================================================
183. EXTERNAL URL SAFETY
==================================================

WhatsApp/Telegram links باید
از server-authorized values ساخته شوند.

هرگز:

javascript:

URL

قبول نکن.

==================================================
184. OPEN REDIRECT
==================================================

redirect parameter:

allowlist

داشته باشد.

هرگز:

/login?redirect=https://evil.com

را مستقیم قبول نکن.

==================================================
185. SECURITY HEADERS
==================================================

Backend مسؤول security headers اصلی است.

Frontend باید با آن architecture سازگار باشد.

CSP نباید به خاطر third-party scripts بیدلیل شل شود.

==================================================
186. NEXT CONFIG
==================================================

configure:

image remotePatterns
security-related headers if appropriate
redirects
compression
experimental features

اما هیچ experimental featureی را بدون reason روشن فعال نکن.

==================================================
187. IMAGE HOSTS
==================================================

لیست remote image hosts مشخص باشد.

هر domain دلخواه از API نباید
به next/image remotePatterns اضافه شود.

==================================================
188. FONT HOSTS
==================================================

external font CDN در runtime تا حد ممکن استفاده نکن.

ترجیح:

self-hosted optimized font

برای network ضعیف.

==================================================
189. NO GIANT GLOBAL PROVIDER
==================================================

Provider tree را سبک نگه دار.

فقط:

QueryClientProvider
Theme
i18n

در صورت نیاز.

تمام featureها provider global جدا نسازند.

==================================================
190. QUERY CLIENT
==================================================

QueryClient configuration:

sensible staleTime
retry policy
refetchOnWindowFocus

در marketplace باید با دقت باشد.

refetchOnWindowFocus:
برای دادههای dynamic محدود.

کاربر نباید هر بار برگشتن به tab
صدها request ببینید.

==================================================
191. CACHE INVALIDATION
==================================================

بعد از:

favorite
listing update
listing sold
profile update

queryهای مرتبط invalidate شوند.

اما کل cache را reset نکن.

==================================================
192. FORM AUTOSAVE DEBOUNCE
==================================================

draft autosave:

debounce

مثلاً 500–1000ms

ولی هنگام unmount/blur
flush در صورت نیاز.

==================================================
193. LOCAL STORAGE NAMESPACE
==================================================

تمام local storage keys:

weshbazar.*

مثلاً:

weshbazar.sellDraft
weshbazar.recentSearches

هیچ key عمومی مثل:

draft

نساز.

==================================================
194. LOCAL DATA TTL
==================================================

recent searches:

حداکثر 10

draft:

TTL configurable

و پاکسازی خودکار.

==================================================
195. RECENT SEARCHES
==================================================

فقط عبارت search.

نه private API response.

==================================================
196. DESIGN TOKEN FILES
==================================================

مثلاً:

styles/tokens.css

شامل:

colors
spacing
radii
shadows
typography
z-index

باشد.

==================================================
197. Z-INDEX SCALE
==================================================

z-indexهای random مثل:

99999
88888
123456

ممنوع.

Semantic scale:

base
sticky
header
dropdown
modal
toast

مثلاً:

10
20
30
40
50

==================================================
198. FIXED ELEMENTS
==================================================

fixed/sticky elements باید:

- safe-area
- keyboard
- viewport

را رعایت کنند.

==================================================
199. MOBILE KEYBOARD + FIXED CTA
==================================================

وقتی keyboard باز است:

sticky bottom actions
نباید روی inputها را بپوشانند.

به خصوص در:

sell form
filter dialog
OTP

==================================================
200. SMALL SCREEN QA
==================================================

حداقل تست:

320x640
360x800
390x844
430x932

با:

RTL

و بدون horizontal scroll.

==================================================
201. TABLET QA
==================================================

768x1024

1024x768

landscape/portrait

==================================================
202. DESKTOP QA
==================================================

1280x720
1440x900
1536x864

==================================================
203. VISUAL REGRESSION
==================================================

Playwright screenshot tests.

حداقل:

home
search
category
listing detail
sell
my listings
login

در عرضهای:

360
390
768
1280

screenshots بگیر.

اگر UI تغییر کرد:
قابل بررسی باشد.

==================================================
204. PIXEL QA
==================================================

برای هر صفحه بررسی کن:

- alignment
- padding
- line-height
- icon baseline
- card height
- image ratio
- button height
- border radius
- overflow
- sticky position
- safe-area
- RTL direction
- mobile keyboard
- typography
- loading state

"looks fine"

قبول نیست.

==================================================
205. COMPONENT SHOWCASE
==================================================

یک development-only component showcase بساز.

مثلاً:

/_dev/components

که در production accessible نباشد.

نمایش:

Buttons
Inputs
Cards
Badges
Dialogs
Filters
Listing Card
Seller Card
Skeletons

این صفحه برای visual QA استفاده میشود.

Storybook فقط اگر بعداً تیم بزرگ شد.

==================================================
206. UNIT TESTING
==================================================

تست:

Button
Input
PriceInput
DynamicAttributeRenderer
FilterChip
ListingCard
FavoriteButton
ContactActions
ImageUploader

اما فقط behavior مهم.

Snapshot testing گسترده ممنوع.

==================================================
207. INTEGRATION UI TESTS
==================================================

تست:

search + filter
favorite
login
listing form
dynamic category fields

==================================================
208. PLAYWRIGHT E2E
==================================================

Flows:

anonymous browse
search
filter
open listing
contact seller
register
verify
favorite
create draft
upload photo
submit listing
seller management

==================================================
209. ACCESSIBILITY TEST
==================================================

Playwright + axe

برای صفحات اصلی:

home
search
detail
auth
sell
admin

بررسی:

ARIA
contrast
labels
keyboard
heading structure

==================================================
210. MOBILE E2E
==================================================

حداقل Playwright mobile viewport.

Test:

- tap search
- filter dialog
- favorite
- listing navigation
- back
- sell form
- image upload
- sticky action bar

==================================================
211. PERFORMANCE TEST
==================================================

Measure:

home
search
detail

با throttled network.

حداقل:

Fast 4G
Slow 4G
و در صورت امکان 3G-like testing

نه فقط localhost سریع.

==================================================
212. PERFORMANCE REGRESSION
==================================================

اگر bundle به شکل غیرعادی بزرگ شد:

STOP

و دلیل را پیدا کن.

Feature جدید نباید بدون بررسی performance اضافه شود.

==================================================
213. BUNDLE ANALYSIS
==================================================

در صورت رشد پروژه:

bundle analyzer

اضافه شود.

dependencyهایی که حجم زیادی ایجاد میکنند
review شوند.

==================================================
214. DEPENDENCY POLICY
==================================================

هر dependency جدید باید یکی از این دلایل را داشته باشد:

- مشکل واقعی را حل میکند
- performance یا accessibility را بهتر میکند
- maintenance را کاهش میدهد
- با architecture لازم است

نه:

"چون کتابخانه معروف است."

==================================================
215. ICON DEPENDENCY
==================================================

Lucide فقط.

ده package icon نصب نکن.

==================================================
216. DATE DEPENDENCY
==================================================

اگر Intl کافی بود:

هیچ date library اضافه نکن.

برای logic پیچیده future:
date-fns بررسی شود.

==================================================
217. STATE MANAGEMENT
==================================================

Default:

React state
URL state
TanStack Query

فقط.

Zustand فقط اگر یک use case واقعی global state
بعداً ظاهر شد.

Redux فعلاً ممنوع.

==================================================
218. DARK MODE FUTURE
==================================================

Componentها semantic token-based باشند.

در آینده dark mode
بدون بازنویسی componentها ممکن باشد.

==================================================
219. DESIGN SYSTEM EXTENSION
==================================================

Future:

Business accounts
Featured listing
Boost
Ads

نباید باعث شود ListingCard
به:

isBusiness
isBoosted
isFeatured
isSponsored
isVerifiedBusiness
...

با 30 prop تبدیل شود.

بهتر:

data + badges + optional slots

==================================================
220. SLOT-BASED EXTENSION
==================================================

برای آینده از ساختارهایی مثل:

leading
trailing
badge
actions
footer

استفاده کن.

نه prop explosion.

==================================================
221. BUSINESS LISTING FUTURE
==================================================

اگر SellerAccount نوع business شد:

ListingCard باید بتواند:

seller badge

را optional نمایش دهد.

بدون fork کردن component.

==================================================
222. PROMOTED LISTING FUTURE
==================================================

Future ranking metadata:

promotion

نباید hardcoded visual business logic باشد.

ممکن است بعداً:

Sponsored badge
Featured
Boosted

اضافه شود.

Component:

ListingBadges

قابل extension باشد.

==================================================
223. NOTIFICATIONS FUTURE
==================================================

Architecture آماده routeهای:

/notifications

ولی MVP لازم نیست.

==================================================
224. CHAT FUTURE
==================================================

هیچ UI fake chat نساز.

در آینده:

/messages

به عنوان feature جدا.

==================================================
225. PAYMENT FUTURE
==================================================

Frontend architecture نباید payment UI را
داخل ListingDetail hardcode کند.

بعداً Payment/Order feature مستقل.

==================================================
226. MAP FUTURE
==================================================

LocationSelector باید طوری باشد که بعداً:

map
coordinates
radius

به آن اضافه شوند.

اما MVP:
Province/City

==================================================
227. PWA FUTURE
==================================================

در MVP:

responsive web

اول.

پس از پایدار شدن:

manifest
installability
offline shell
selected caching

بررسی شود.

اما:

offline listing mutation
یا offline publish

فعلاً نساز.

==================================================
228. SERVICE WORKER
==================================================

Service Worker نباید cache قدیمی
و اطلاعات marketplace را کورکورانه نگه دارد.

اگر PWA اضافه شد:

strategy per resource

داشته باشد.

==================================================
229. OFFLINE CONTENT POLICY
==================================================

Future:

static shell
categories
recently viewed

مجاز.

Private data:
با caution.

Listing freshness:
explicit.

==================================================
230. SEO + PERFORMANCE BALANCE
==================================================

SSR/Server Components
برای public SEO pages.

اما:

Client hydration
حداقل.

یک listing page نباید فقط به خاطر favorite
کاملاً client-side شود.

==================================================
231. SERVER COMPONENT RULE
==================================================

Public listing:

Server:
content

Client:
interactive actions

به این تقسیمبندی پایبند باش.

==================================================
232. ADMIN CLIENT
==================================================

Admin میتواند client-heavyتر باشد،
چون:

SEO مهم نیست.

اما هنوز:

performance
accessibility
responsive

باید حفظ شود.

==================================================
233. ERROR MESSAGES
==================================================

Backend error codes را map کن:

LISTING_NOT_FOUND
→
"این آگهی پیدا نشد."

AUTH_ACCOUNT_BANNED
→
"این حساب امکان استفاده از سرویس را ندارد."

Frontend نباید backend English message را مستقیم نمایش دهد.

==================================================
234. UNKNOWN ERROR
==================================================

اگر error code ناشناخته بود:

"مشکلی پیش آمد. دوباره تلاش کنید."

نه:

AxiosError
Fetch failed
Prisma error
500 stack

==================================================
235. API REQUEST ID
==================================================

اگر backend requestId بدهد:

در error UI برای support
میتواند قابل کپی باشد.

اما user را با UUIDهای طولانی نترسان.

مثلاً فقط در:

"جزئیات خطا"

نمایش optional.

==================================================
236. SEARCH ACCESSIBILITY
==================================================

Search field:

label accessible

keyboard submit

clear button

loading state

search icon

در mobile.

==================================================
237. FILTER ACCESSIBILITY
==================================================

Filter chip:

aria-label appropriate

selected state:

aria-pressed

یا semantics مناسب.

==================================================
238. TABS
==================================================

Tabs فقط برای switching content.

برای navigation بین صفحات:
links/routes

نه tab semantics فیک.

==================================================
239. TOAST ACCESSIBILITY
==================================================

toast باید:

aria-live

مناسب داشته باشد.

==================================================
240. IMAGE ALT
==================================================

Listing image:

اگر title:
alt = title contextual

تصاویر تکراری gallery:
alt مناسب یا decorative

نه:

"image1.jpg"

==================================================
241. DECORATIVE ICON
==================================================

iconهای decorative:

aria-hidden

==================================================
242. SEO IMAGE
==================================================

OG image:

از listing primary image
در صورت availability.

No user-controlled arbitrary image domains.

==================================================
243. SECURITY FOR NEXT SERVER
==================================================

server-side environment:

private secrets

PUBLIC:
فقط NEXT_PUBLIC_* موارد واقعاً عمومی.

هیچ secret در NEXT_PUBLIC_*.

==================================================
244. ENV
==================================================

مثلاً:

NEXT_PUBLIC_API_BASE_URL

NEXT_PUBLIC_SITE_URL

AUTH-related server-only vars if needed

analytics config

هیچ secret در client bundle.

==================================================
245. DEPLOYMENT
==================================================

Frontend باید platform-agnostic باشد.

مناسب برای:

Vercel
یا
Next.js-compatible hosting

اما کد نباید vendor-specific شود.

==================================================
246. CDN
==================================================

Static assets:

CDN

Image storage:

object storage + CDN

در صورت استفاده backend-provided image URLs.

==================================================
247. CACHE HEADERS
==================================================

Static assets:

long cache

HTML/API:
طبق freshness

User-specific:

private/no-store

policy-specific.

==================================================
248. NO CACHE LEAK
==================================================

هیچ صفحه private نباید به صورت عمومی cache شود.

مثلاً:

/favorites
/account
/my-listings

باید user-specific باشند.

==================================================
249. SEO CACHE LEAK
==================================================

Public listing page اگر personalized favorite state دارد:

public content cache
را با personal state قاطی نکن.

مثلاً:

Server:
listing

Client:
favorite button

==================================================
250. MOBILE BOTTOM NAV
==================================================

Height:

حدود 64px

+
safe-area bottom

background:
surface

border-top

همیشه content پایین page:
padding-bottom

متناسب داشته باشد.

اما در listing detail:
sticky contact action
میتواند جایگزین یا بالاتر از bottom nav شود.

==================================================
251. DESKTOP BOTTOM NAV
==================================================

Hide.

Desktop:

top navigation

==================================================
252. MOBILE HEADER
==================================================

Header باید از نظر visual hierarchy
با bottom nav رقابت نکند.

Search:
primary

Logo:
secondary

icons:
minimal

==================================================
253. HOME VISUAL HIERARCHY
==================================================

اول:

"دنبال چی میگردی؟"

بعد:

دستهها

بعد:

آگهیها

کاربر باید در 2–3 ثانیه بفهمد سایت برای چیست.

==================================================
254. TRUST FIRST IMPRESSION
==================================================

کاربر تازهوارد باید احساس کند:

این سایت واقعی است.

برای همین:

- spacing منظم
- typography خوب
- image quality مناسب
- loading states
- error handling
- no broken icons
- no lorem ipsum
- no fake counters

بسیار مهم است.

==================================================
255. MICROCOPY
==================================================

متن UI:

عامیانه و واضح

مثلاً:

"ثبت آگهی"

بهتر از:

"ایجاد یک مورد جدید"

"ذخیره آگهی"
بهتر از:
"افزودن به collection"

زبان واقعی کاربر.

==================================================
256. FORM COPY
==================================================

Label:

عنوان آگهی

Placeholder:

مثلاً Samsung Galaxy S23 256GB

Help text:

کوتاه

==================================================
257. TRUST COPY
==================================================

هیچ statement حقوقی/امنیتی بدون basis.

==================================================
258. LOADING COPY
==================================================

از:

"در حال پردازش..."

فقط وقتی واقعاً لازم است.

برای skeleton:
متن اضافه نده.

==================================================
259. PAGE COMPOSITION
==================================================

هر صفحه باید:

- max width
- main content
- hierarchy
- responsive layout
- loading
- error
- empty

داشته باشد.

==================================================
260. PAGE-BY-PAGE IMPLEMENTATION ORDER
==================================================

Phase 0:
Repository inspection

Phase 1:
Design tokens + app shell

Phase 2:
UI primitives

Phase 3:
Header/navigation

Phase 4:
Homepage

Phase 5:
Listing card/list/grid

Phase 6:
Search

Phase 7:
Category/filter

Phase 8:
Listing detail

Phase 9:
Auth

Phase 10:
Favorites/account

Phase 11:
Sell flow

Phase 12:
Seller management

Phase 13:
Admin

Phase 14:
SEO

Phase 15:
Performance

Phase 16:
Accessibility

Phase 17:
Visual regression

Phase 18:
production hardening

==================================================
261. PHASE 0 — INSPECTION
==================================================

قبل از code:

repository را بررسی کن.

بررسی:

package.json
Next config
Tailwind
existing components
existing routes
API integration
environment
lint
typescript

اگر project existing دارد:

آن را نابود نکن.

ابتدا گزارش:

docs/frontend-implementation-status.md

بساز.

==================================================
262. PHASE 1 — DESIGN FOUNDATION
==================================================

بساز:

- CSS variables
- typography
- spacing
- colors
- radius
- shadows
- z-index
- container
- RTL
- font
- base reset

Acceptance:

320px
و
1440px

صحیح باشند.

==================================================
263. PHASE 2 — PRIMITIVES
==================================================

در این phase:

Button
Input
Textarea
Badge
Avatar
Dialog
Tabs
Skeleton
Toast
etc.

بساز.

هیچ marketplace page
در این phase لازم نیست.

هدف:

foundation

==================================================
264. PHASE 3 — SHELL
==================================================

بساز:

PublicHeader
MobileHeader
DesktopHeader
BottomNav
Footer
AppShell

حس سایت باید همینجا مشخص شود.

==================================================
265. PHASE 4 — HOME
==================================================

اول mobile.

بعد tablet.

بعد desktop.

Do not design desktop first and squeeze it down.

==================================================
266. PHASE 5 — LISTING COMPONENTS
==================================================

ListingCard

را در تمام breakpoints QA کن.

این component قبل از search باید stabilize شود.

==================================================
267. PHASE 6 — SEARCH
==================================================

به ترتیب:

search bar
URL state
filter chips
filter dialog
sort
result list
pagination/load more
empty
error

==================================================
268. PHASE 7 — CATEGORY
==================================================

category tree
dynamic filter schema
filter renderer
category listings

==================================================
269. PHASE 8 — DETAIL
==================================================

detail page.

بعد:

gallery
favorite
share
contact
report

==================================================
270. PHASE 9 — AUTH
==================================================

بعد از public browse.

چون browse بدون login
باید کامل کار کند.

==================================================
271. PHASE 10 — ACCOUNT
==================================================

favorites
profile
security
my listings

==================================================
272. PHASE 11 — SELL
==================================================

این phase را با دقت بالا بساز.

Seller UX برای marketplace حیاتی است.

==================================================
273. SELL FLOW QA
==================================================

سناریو:

mobile user
→ category
→ image
→ title
→ price
→ attributes
→ location
→ contact
→ preview
→ submit

هیچ مرحله نباید اطلاعات قبلی را نابود کند.

==================================================
274. PHASE 12 — ADMIN
==================================================

Admin بعد از core marketplace.

==================================================
275. PHASE 13 — SEO
==================================================

metadata
canonical
robots
sitemap
JSON-LD
OG

==================================================
276. PHASE 14 — PERFORMANCE
==================================================

Bundle
image
font
request count
caching
server components
prefetch
hydration

را audit کن.

==================================================
277. PHASE 15 — ACCESSIBILITY
==================================================

keyboard
screen reader
focus
contrast
dialog
form errors

==================================================
278. PHASE 16 — VISUAL QA
==================================================

Playwright screenshots.

تمام صفحههای اصلی.

==================================================
279. PHASE 17 — PRODUCTION
==================================================

Environment
build
deployment
error handling
monitoring
analytics
sitemap
robots

==================================================
280. DEFINITION OF DONE
==================================================

Frontend زمانی complete است که:

- mobile-first
- responsive
- RTL
- accessible
- SEO-ready
- fast
- API typed
- loading states
- error states
- empty states
- auth
- search
- filters
- listing detail
- favorites
- seller flow
- image upload
- account
- admin
- analytics
- tests
- visual QA

کار کنند.

==================================================
281. NON-NEGOTIABLE PERFORMANCE RULE
==================================================

اگر بین:

UI animation جذاب
و
100–300KB اضافی JS

انتخاب باشد:

JS کمتر.

اگر بین:

hero image زیبا
و
slow first load

انتخاب باشد:

fast first load.

اگر بین:

blur/shadow/glass effect
و
battery/CPU

انتخاب باشد:

performance.

==================================================
282. NON-NEGOTIABLE MOBILE RULE
==================================================

Desktop is not the source design.

Mobile is the source design.

Desktop expands from mobile.

==================================================
283. NON-NEGOTIABLE MARKETPLACE RULE
==================================================

User باید بتواند بدون account:

browse
search
filter
view detail
contact seller

انجام دهد.

==================================================
284. NON-NEGOTIABLE TRUST RULE
==================================================

هر element بصری باید واقعی باشد.

No fake:

reviews
ratings
sales
trust score
verification
statistics

==================================================
285. NON-NEGOTIABLE DATA RULE
==================================================

Frontend business rules را از Backend تکرار نکند
به شکلی که دو source of truth بسازد.

Frontend UX validation دارد.

Backend authoritative validation دارد.

==================================================
286. NON-NEGOTIABLE COMPONENT RULE
==================================================

Component باید reusable باشد
اما abstraction بیش از حد ممنوع.

Reusable:
yes

generic monster component:
no

==================================================
287. NON-NEGOTIABLE RESPONSIVE RULE
==================================================

هر component قبل از استفاده در page:

mobile
tablet
desktop

را در نظر بگیرد.

==================================================
288. NON-NEGOTIABLE RTL RULE
==================================================

هیچ componentی فقط با LTR assumptions نوشته نشود.

==================================================
289. NON-NEGOTIABLE NETWORK RULE
==================================================

هیچ request غیرضروری در first load.

هیچ auto-fetch بیدلیل.

هیچ image preload غیرضروری.

هیچ polling بیدلیل.

==================================================
290. FINAL CURSOR EXECUTION LOOP
==================================================

برای هر phase:

1.
Inspect

2.
Plan

3.
Implement

4.
Typecheck

5.
Lint

6.
Unit test

7.
Run app

8.
Visual test

9.
Mobile QA

10.
Desktop QA

11.
Performance check

12.
Update documentation

13.
Commit-ready state

اگر یکی از موارد مهم fail شد:

STOP

Fix

Retest

بعد phase بعدی.

==================================================
291. FINAL ARCHITECTURE
==================================================

Conceptual architecture:

                        WESHBAZAR WEB
                              |
                         Next.js
                              |
            ┌─────────────────┴────────────────┐
            |                                  |
      Server Components                  Client Components
            |                                  |
       SEO/Public data                  Interactive UI
            |                                  |
            └─────────────────┬────────────────┘
                              |
                       API Client Layer
                              |
                     OpenAPI Typed Contract
                              |
                         NestJS Backend
                              |
                PostgreSQL + Storage + Auth


State:

Backend server state
→ TanStack Query

URL state
→ nuqs

UI state
→ React state

Auth:
HttpOnly secure session mechanism
+
non-persistent client auth state

Images:
Next/Image
+
responsive backend/storage variants

Styling:
Tailwind
+
shadcn/ui
+
semantic design tokens

Testing:
Jest
+
React Testing Library
+
Playwright
+
accessibility tests

==================================================
292. FUTURE GROWTH PATH
==================================================

Current:

Next.js
+
NestJS
+
PostgreSQL
+
Object Storage

Later:

CDN
+
Redis
+
Queue
+
Search engine
+
Analytics pipeline

Only when real traffic and requirements justify them.

==================================================
293. FUTURE FRONTEND APPS
==================================================

Architecture should allow future:

WeshBazar Web
WeshBazar Admin
WeshBazar Mobile
WeshBazar Seller Portal

But do NOT create four apps now.

Start with:

one strong Next.js application.

Later split if team/scale requires.

==================================================
294. FUTURE MOBILE APP
==================================================

If React Native is introduced later,
business terminology and API contract
should already be platform-neutral.

No web-specific business rule
should be required by backend.

==================================================
295. FINAL PRINCIPLE
==================================================

Build a marketplace that feels:

fast enough that users trust it,
simple enough that users understand it,
beautiful enough that users remember it,
stable enough that users return to it.

WeshBazar should not impress users with technology.

It should impress them with:

speed,
clarity,
trust,
excellent listing discovery,
excellent seller flow,
and a polished but restrained visual system.

END OF FRONTEND MASTER SPECIFICATION.