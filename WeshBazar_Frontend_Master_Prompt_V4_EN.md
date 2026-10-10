# WeshBazar — Frontend Master Engineering & UX/UI Build Prompt V4

This is the authoritative frontend build contract for WeshBazar.

The prompt is written in English so a coding agent can follow it precisely. The product UI must be Persian by default, Afghanistan/Dari-oriented, and RTL. The architecture must remain ready for Pashto and English later.

MASTER PRINCIPLE: speed + clarity + trust + usability before decorative effects.

Do not build a generic SaaS dashboard. Do not build a marketing landing page. Build a real C2C marketplace for Afghanistan, optimized for mobile devices, low-end phones, weak connections, and direct seller contact.

# 0. Agent Role and Absolute Rules

You are the Senior Frontend Engineer, UX Engineer, UI Architect, Design Systems Engineer, Performance Engineer, Accessibility Engineer, and QA Engineer for WeshBazar. Treat every requirement below as a build contract, not as inspiration.

Execution loop for every phase:
Inspect → Reconcile → Plan → Implement → Typecheck → Lint → Test → Build → Visual QA → Mobile QA → Accessibility QA → Performance QA → Document → Stop/Review.

If a critical gate fails: STOP → diagnose → fix → rerun the failed gate → rerun affected regression tests → continue only after PASS.

Never hide errors with fake data, disabled checks, swallowed exceptions, giant loading spinners, or production-only conditionals.

Never sacrifice performance, accessibility, RTL correctness, or trust for visual decoration.

# 1. Source-of-Truth Hierarchy

Use this order when making implementation decisions:
1. Existing frontend repository and its working code.
2. Current backend OpenAPI/API contract.
3. Backend DTOs and business rules.
4. Existing WeshBazar brand assets.
5. This master prompt.
6. Verified external research.
7. Engineering judgment.

If sources conflict, identify the conflict, choose the smallest safe resolution, document material decisions, and keep backend-specific adaptation inside the API/client boundary.

The frontend must never import Prisma models, decide authorization, invent listing states, invent dynamic attributes, or infer private data from database structure.

# 2. Product Scope

WeshBazar is an Afghanistan-focused C2C marketplace for new and used goods.

Guest capabilities: home, category browsing, search, filters, sorting, listing details, seller information, direct contact, sharing.
Authenticated capabilities: favorites, reports, profile, security.
Seller capabilities: register, phone verification, drafts, photos, dynamic category attributes, price, location, contact methods, preview, submit, edit, mark sold, archive, manage listings.
Admin/moderator capabilities: dashboard, users, listings, reports, taxonomy, locations, audit context, moderation actions according to actual backend permissions.

Not in MVP: checkout, payment, wallet, escrow, commission, shipping, delivery tracking, bidding, auctions, cryptocurrency, internal marketplace chat, AI recommendation, AI moderation, heavy maps, 3D, video-first home page, fake ratings, fake reviews, fake trust scores.

# 3. Research Synthesis — What to Borrow and What Not to Borrow

Local marketplace research shows the value of broad categories, free listing creation, city/category/price/date discovery, and direct local-market framing. WeshBazar should use these interaction principles without cloning any site.

OfferUp demonstrates a practical marketplace search model: prominent search, category browsing, location, price range, condition, sorting, and category-dependent filters.

OLX makes search location explicit and user-changeable, which reinforces the importance of a visible province/city context.

Facebook Marketplace emphasizes safety, reporting, seller context, and responsible in-person trading. WeshBazar can borrow the principle of keeping safety and reporting discoverable, but must not invent ratings or claims.

Divar-style search APIs demonstrate the usefulness of category-specific structured filters such as brand/model, production year, usage, room count, and other domain-specific values. This validates the dynamic attribute architecture already present in WeshBazar.

Research is used for interaction patterns, not for copied visual appearance.

# 4. Technology Stack

```text
Next.js App Router
React
TypeScript strict
Tailwind CSS
shadcn/ui
TanStack Query
Native fetch
React Hook Form
Zod
nuqs or approved URL-state equivalent
Lucide React
Jest
React Testing Library
Playwright
axe or equivalent
OpenAPI-generated TypeScript types
next/image
next/font
```

Dependency policy: add a dependency only for a concrete capability. Do not add a second icon library, overlapping UI library, global state library, animation framework, or large utility library without an architecture review. Respect the repository lockfile and installed framework version. Do not perform opportunistic major upgrades during feature implementation.

# 5. Next.js Rendering Architecture

App Router is required. Pages and layouts are Server Components by default. Public listing/category/seller content should be server-rendered whenever practical.

Use Client Components only when a browser capability or live interaction is required: state, event handlers, localStorage for safe drafts, interactive galleries, favorite mutation, contact action, dialog, sheet, uploader, or complex form.

Do not turn an entire page into a Client Component because a single child button needs onClick.

Public data, user-specific data, and UI state must remain separated.

Listing detail example:
Server: listing, images, seller, price, structured attributes.
Client: gallery selection, favorite, share, contact action, report dialog.

Use current Next.js caching/rendering semantics for the installed version. Never copy obsolete APIs from old tutorials without verifying compatibility.

# 6. API Client Architecture

```text
src/lib/api/
  client.ts
  server.ts
  browser.ts
  errors.ts
  query-keys.ts

src/features/
  auth/
  listings/
  search/
  categories/
  locations/
  sellers/
  favorites/
  reports/
  contacts/
  media/
  account/
  admin/
```

Every HTTP interaction belongs behind a centralized adapter. UI components must never scatter raw fetch calls. Convert backend DTOs into stable frontend view models. Map error codes centrally. Normalize pagination centrally. Keep storage/media URL differences out of presentation code.

All endpoint names, request shapes, response fields, enums, nullability, pagination, media behavior, and authentication behavior must be verified against the current OpenAPI/backend before production wiring. Never invent an endpoint because the page design expects it.

# 7. Authentication and Session Rules

The backend architecture uses a short-lived access token plus rotating refresh sessions. Refresh tokens must not be readable by normal browser JavaScript. Prefer HttpOnly, Secure, SameSite cookie behavior compatible with the real deployment.

Never store refresh tokens in localStorage or sessionStorage. Never put tokens in URLs. Never log tokens.

Handle concurrent 401 responses with a single-flight refresh mechanism. If refresh fails, clear private auth state safely, invalidate private server-state caches, and only redirect to login when the user is actually on a protected flow. Public browsing must remain functional.

# 8. RTL and Localization Architecture

Default document: lang=fa-AF and dir=rtl.

Design for Persian first, but keep all components direction-aware so ps-AF and en can be added later.

Use logical layout concepts: inline/block, start/end, margin-inline, padding-inline, inset-inline, border-start/end. Avoid physical left/right assumptions except where physical direction is the actual intended meaning.

Directional arrows and chevrons should flip when their meaning is directional. Icons such as phone, heart, camera, menu, bookmark, and share normally do not flip.

Use bidi isolation for phone numbers, URLs, email, model names, handles, codes, and mixed English/Persian strings.

# 9. Brand Asset Contract

Use the official WeshBazar logo/mark assets already present in the repository. Prefer SVG for scalable header/footer contexts and PNG where a raster asset is explicitly appropriate.

Known asset family includes logo.svg, logo.png, logo-white.svg, logo-white.png, logo-mark.svg, logo-mark.png, logo-mark-teal.svg, logo-mark-teal.png, logo-mark-orange.svg, logo-mark-orange.png, logo-mark-white.svg, logo-mark-white.png, logo-with-tagline.svg, logo-with-tagline.png, app-icon.svg, app-icon.png, favicon.svg, favicon.png, favicon-16.png, favicon-32.png, social-avatar-1024.png.

Never redraw, trace, approximate, recolor, stretch, crop, rotate, add gradient, add shadow, or alter the proportions of the official logo. Never generate a substitute SVG with CSS shapes.

Before implementation, audit which variant belongs on each surface and record canonical paths.

# 10. WeshBazar Visual Identity

```text
Primary Teal       #0F766E
Primary Dark       #0B2F2B
Primary Soft       #E6F5F3
Brand Orange       #F59E0B
Orange Dark        #D97706
Text               #0B2F2B
Secondary          #64748B
Muted              #94A3B8
Border             #E2E8F0
Background         #F8FAFC
Surface            #FFFFFF
Success            #15803D
Danger             #DC2626
Warning            #B45309
Info               #0369A1
```

Teal is the main brand/action family. Orange is a controlled accent for high-attention marketplace actions such as Sell/Post Listing and selected promotional emphasis. Do not make every price, icon, badge, or button orange. Blue is not the primary WeshBazar identity.

The design should feel local, modern, trustworthy, practical, and warm; never neon, childish, luxury-only, gaming-like, corporate banking, or visually over-designed.

# 11. Design Tokens

Create semantic design tokens for colors, typography, spacing, radii, borders, shadows, control heights, header height, bottom navigation height, content max width, page padding, section gaps, z-index, and motion durations.

Prefer named semantic tokens over raw colors. Repeated pixel values must become tokens. One-off corrections are acceptable only when they are genuinely unique and documented.

Suggested radii: 8–10px controls, 12px cards, 16px grouped surfaces/dialogs, full pill only for tags/chips.

Default elevation should come from surface contrast and borders first; shadows remain subtle.

# 12. Typography

Primary Persian font: Vazirmatn or another high-quality repository-approved Persian font. Prefer next/font/local for self-hosted fonts.

Suggested scale:
12/18 captions
13/20 metadata
14/20 compact UI
16/24 body
18/26 card titles
20/28 section headings
24/32 major headings
28/36 mobile display
32/40 desktop display

Use weights 400, 500, 600, and 700. Do not create many tiny variants. Persian line-height must remain comfortable. Marketplace metadata should be scan-friendly.

# 13. Responsive Contract

```text
320×640
360×800
390×844  PRIMARY
430×932
480×900
768×1024
1024×768
1280×720
1440×900
1536×864
```

Mobile-first means the smallest useful layout is designed first, then expanded. Desktop is not a shrunk mobile layout and mobile is not a squeezed desktop layout.

At 320px there must be no horizontal scroll, clipped buttons, overlapping labels, or hidden required actions.

390×844 is the canonical reference for visual QA.

Desktop public content should generally use a constrained centered container around 1280px maximum unless a route has a clearly justified alternate width.

# 14. Touch Targets and Interaction

Use 44px as the comfortable minimum interactive hit area and 48px as the common major mobile control height. WCAG 2.2 permits 24px targets in certain cases; WeshBazar intentionally uses a larger baseline for real-world mobile usability.

Icon-only buttons require an accessible name and 44px hit area. Essential functionality must never be hover-only.

Use visible pressed/selected/disabled/focus states. Prevent duplicate mutations without disabling unrelated controls.

# 15. Motion

Prefer CSS transitions and platform primitives. Typical duration: 120ms micro, 160ms small transition, 200ms dialog/sheet. Prefer opacity and transform over layout animation.

No parallax, continuous animation, animated blur, autoplay video, scroll-linked JavaScript, or decorative page transitions. Respect prefers-reduced-motion. Never delay a contact/favorite action for animation.

# 16. Information Density

WeshBazar is a marketplace, not a landing page. The mobile layout should be compact, scan-friendly, and information-rich while maintaining comfortable touch spacing.

Avoid giant hero banners and giant empty whitespace. The first viewport should prioritize search and discoverability.

Typical mobile page padding: 16px. Typical section gaps: 24–32px. Typical card gap: 12px. Tablet: 20px page padding. Desktop: 24px page padding.

# 20. Page Contract — Home

- Route: /
- Purpose: Public discovery and first impression
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 21. Page Contract — Search

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 22. Page Contract — Category

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 23. Page Contract — Listing Detail

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 24. Page Contract — Seller Profile

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 25. Page Contract — Login

- Route: /auth/login
- Purpose: Phone/password login
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 26. Page Contract — Register

- Route: /auth/register
- Purpose: Account creation
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 27. Page Contract — Verify

- Route: /auth/verify
- Purpose: Phone verification
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 28. Page Contract — Forgot Password

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 29. Page Contract — Reset Password

- Route: /auth/reset-password
- Purpose: Password reset completion
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 30. Page Contract — Favorites

- Route: /favorites
- Purpose: Saved listings
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 31. Page Contract — My Listings

- Route: /my-listings
- Purpose: Seller listing management
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 32. Page Contract — Account

- Route: /account
- Purpose: Profile and account navigation
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 33. Page Contract — Security

- Route: /account/security
- Purpose: Password, sessions, verification
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 34. Page Contract — Sell Start

- Route: /sell
- Purpose: Category selection
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 35. Page Contract — Sell Photos

- Route: /sell/photos
- Purpose: Image selection and ordering
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 36. Page Contract — Sell Basic Info

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 37. Page Contract — Sell Attributes

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 38. Page Contract — Sell Location

- Route: /sell/location
- Purpose: Province and city
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 39. Page Contract — Sell Contact

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 40. Page Contract — Sell Preview

- Route: /sell/preview
- Purpose: Public listing preview
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 41. Page Contract — Sell Submit

- Route: /sell/submit
- Purpose: Submission outcome
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 42. Page Contract — Edit Listing

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 43. Page Contract — Admin Dashboard

- Route: /admin
- Purpose: Moderation/admin overview
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 44. Page Contract — Admin Listings

- Route: /admin/listings
- Purpose: Listing moderation queue
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 45. Page Contract — Admin Reports

- Route: /admin/reports
- Purpose: Report queue
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 46. Page Contract — Admin Users

- Route: /admin/users
- Purpose: User management
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 47. Page Contract — Admin Taxonomy

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 48. Page Contract — Admin Locations

- Route: /admin/locations
- Purpose: Province/city management
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 49. Page Contract — Admin Audit

- Route: /admin/audit
- Purpose: Audit context
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 50. Page Contract — Not Found

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 51. Page Contract — Global Error

- Route: app/global-error
- Purpose: Safe system recovery
- Default language: fa-AF
- Direction: RTL
- Primary mobile viewport: 390×844
Every page must define a clear H1 or equivalent page heading, one primary content goal, one primary action where applicable, and deliberate loading, error, empty, and recovery states.

Public pages should prefer Server Components. Private/admin pages may use more Client Components where interaction requires them, but still keep client boundaries narrow.

Mobile order must be intentional. Desktop may use columns/rails only where they improve scanability. Do not duplicate primary actions in multiple sticky regions without a reason.

Private/admin pages must not be publicly indexable. Public pages must have metadata appropriate to their content and canonical URLs where applicable.

# 55. Anatomy Contract — Home

Required order for the default mobile composition:

```text
1. 56px mobile header
2. 48px primary search
3. location control
4. top category shortcuts
5. latest listings
6. optional discovery section
7. orange sell CTA
8. short safety guidance
9. footer
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 56. Anatomy Contract — Search

Required order for the default mobile composition:

```text
1. compact search control
2. context heading
3. applied filter chips
4. sort control
5. desktop filter rail or mobile filter button
6. listing results
7. cursor load more
8. empty/error recovery
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 57. Anatomy Contract — Category

Required order for the default mobile composition:

```text
1. category title
2. breadcrumb
3. child categories if useful
4. dynamic filter summary
5. generic filters
6. applied filters
7. results
8. empty recovery
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 58. Anatomy Contract — Listing Detail

Required order for the default mobile composition:

```text
1. back/header row
2. primary gallery
3. price block
4. title
5. condition/location/date
6. dynamic specifications
7. description
8. seller card
9. contact actions
10. share/report
11. safety notice
12. related listings
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 59. Anatomy Contract — Sell

Required order for the default mobile composition:

```text
1. step indicator
2. current step content
3. validation summary when needed
4. primary action
5. back action
6. draft preservation
7. submit/review outcome
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 60. Anatomy Contract — Account

Required order for the default mobile composition:

```text
1. account summary
2. seller state if applicable
3. favorites shortcut
4. my listings shortcut
5. security shortcut
6. logout
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 61. Anatomy Contract — Admin

Required order for the default mobile composition:

```text
1. admin navigation
2. page title
3. filters/search
4. data region
5. action region
6. confirmation dialog
7. pagination or load more
```

The desktop composition may reorganize the same semantic blocks into columns, rails, or grouped surfaces only when usability improves. The semantic order, accessibility order, and interaction model must remain coherent.

# 100. Component Contract — PageContainer

- Area: global
- Role: constrained width + responsive padding
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 101. Component Contract — MobileHeader

- Area: navigation
- Role: 56px top bar
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 102. Component Contract — DesktopHeader

- Area: navigation
- Role: 64px top bar
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 103. Component Contract — MobileBottomNav

- Area: navigation
- Role: 64–72px plus safe area
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 104. Component Contract — DesktopFooter

- Area: navigation
- Role: footer information
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 105. Component Contract — SearchBar

- Area: discovery
- Role: 48px primary search control
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 106. Component Contract — LocationButton

- Area: location
- Role: current province/city context
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 107. Component Contract — LocationPicker

- Area: location
- Role: province → city selection
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 108. Component Contract — CategoryShortcutGrid

- Area: discovery
- Role: top category navigation
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 109. Component Contract — ListingCard

- Area: listing
- Role: compact product card
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 110. Component Contract — ListingGrid

- Area: listing
- Role: responsive grid
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 111. Component Contract — ListingList

- Area: listing
- Role: vertical feed
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 112. Component Contract — FavoriteButton

- Area: listing
- Role: saved/unsaved mutation
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 113. Component Contract — ShareButton

- Area: listing
- Role: native share/copy
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 114. Component Contract — ContactActions

- Area: contact
- Role: phone/WhatsApp/Telegram
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 115. Component Contract — SellerCard

- Area: seller
- Role: public seller summary
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 116. Component Contract — AttributeList

- Area: listing
- Role: label/value specification list
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 117. Component Contract — FilterPanelDesktop

- Area: search
- Role: persistent desktop filters
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 118. Component Contract — FilterSheetMobile

- Area: search
- Role: full-height mobile filters
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 119. Component Contract — AppliedFilterChips

- Area: search
- Role: active filter summary
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 120. Component Contract — SortControl

- Area: search
- Role: sort selection
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 121. Component Contract — LoadMoreCursor

- Area: search
- Role: cursor pagination
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 122. Component Contract — ListingSkeleton

- Area: feedback
- Role: stable loading geometry
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 123. Component Contract — EmptyState

- Area: feedback
- Role: no-results guidance
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 124. Component Contract — ErrorState

- Area: feedback
- Role: recoverable failure
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 125. Component Contract — OfflineBanner

- Area: feedback
- Role: offline/retry hint
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 126. Component Contract — ToastRegion

- Area: feedback
- Role: non-blocking announcements
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 127. Component Contract — Dialog

- Area: primitive
- Role: accessible modal
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 128. Component Contract — ConfirmDialog

- Area: primitive
- Role: destructive confirmation
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 129. Component Contract — ImageGallery

- Area: media
- Role: detail gallery
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 130. Component Contract — ImageUploader

- Area: media
- Role: seller upload
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 131. Component Contract — ImageReorder

- Area: media
- Role: gallery ordering
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 132. Component Contract — PriceInput

- Area: form
- Role: AFN-aware value entry
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 133. Component Contract — PhoneInput

- Area: form
- Role: phone entry
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 134. Component Contract — OtpInput

- Area: form
- Role: verification code
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 135. Component Contract — PasswordField

- Area: form
- Role: password entry
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 136. Component Contract — DynamicFieldRenderer

- Area: form
- Role: API-driven attribute renderer
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 137. Component Contract — FormSection

- Area: form
- Role: label/help/error grouping
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 138. Component Contract — Stepper

- Area: sell
- Role: workflow progress
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 139. Component Contract — DraftRecoveryBanner

- Area: sell
- Role: restore/discard local draft
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 140. Component Contract — ListingStatusBadge

- Area: status
- Role: owner/admin status
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 141. Component Contract — SellerStatusBadge

- Area: status
- Role: safe public status
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 142. Component Contract — ReportDialog

- Area: safety
- Role: listing report form
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 143. Component Contract — SafetyNotice

- Area: safety
- Role: responsible trading guidance
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 144. Component Contract — AdminSidebar

- Area: admin
- Role: responsive admin nav
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 145. Component Contract — AdminTable

- Area: admin
- Role: dense desktop data display
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 146. Component Contract — AdminCards

- Area: admin
- Role: mobile data alternative
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 147. Component Contract — AdminActionMenu

- Area: admin
- Role: permission-aware actions
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 148. Component Contract — Breadcrumbs

- Area: navigation
- Role: hierarchical path
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 149. Component Contract — SectionHeader

- Area: layout
- Role: heading plus action
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 150. Component Contract — Surface

- Area: primitive
- Role: semantic surface
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 151. Component Contract — FieldError

- Area: form
- Role: accessible validation message
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 152. Component Contract — FieldHint

- Area: form
- Role: supportive helper text
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 153. Component Contract — LoadingButton

- Area: primitive
- Role: pending mutation state
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 154. Component Contract — StatusMessage

- Area: feedback
- Role: inline result status
Requirements:
- Geometry must come from design tokens.
- State must be explicit.
- Presentation components receive typed view-model data.
- Presentation components do not contain authorization logic.
- API calls belong in feature/API layers.
- RTL layout must use logical direction-aware rules.
- Mobile interaction must be complete without hover.
- Focus-visible state must be visible.
- Error and disabled states must be designed before the component is considered complete.
- Tests must verify behavior rather than producing huge snapshot suites.

# 200. Design Token Audit — primary

- Value:  #0F766E
- Use: main brand/action
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 201. Design Token Audit — primary-dark

- Value: #0B2F2B
- Use: strong text/brand
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 202. Design Token Audit — primary-soft

- Value: #E6F5F3
- Use: subtle selected surface
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 203. Design Token Audit — orange

- Value: #F59E0B
- Use: sell/accent
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 204. Design Token Audit — orange-dark

- Value: #D97706
- Use: orange interaction
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 205. Design Token Audit — surface

- Value: #FFFFFF
- Use: cards/panels
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 206. Design Token Audit — background

- Value: #F8FAFC
- Use: canvas
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 207. Design Token Audit — border

- Value: #E2E8F0
- Use: separation
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 208. Design Token Audit — secondary

- Value: #64748B
- Use: metadata
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 209. Design Token Audit — muted

- Value: #94A3B8
- Use: tertiary hint
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 210. Design Token Audit — success

- Value: #15803D
- Use: success
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 211. Design Token Audit — danger

- Value: #DC2626
- Use: danger
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 212. Design Token Audit — warning

- Value: #B45309
- Use: warning
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 213. Design Token Audit — info

- Value: #0369A1
- Use: informational
Use as a semantic variable; do not scatter raw hex values across components. Verify contrast in actual combinations. Pair semantic color with text or icon. Reject any generic blue theme drift.

# 230. Discovery Contract — free-text keyword

- Query parameter: q
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 231. Discovery Contract — category slug/id according to frozen contract

- Query parameter: category
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 232. Discovery Contract — province

- Query parameter: province
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 233. Discovery Contract — city

- Query parameter: city
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 234. Discovery Contract — minimum price

- Query parameter: minPrice
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 235. Discovery Contract — maximum price

- Query parameter: maxPrice
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 236. Discovery Contract — condition values

- Query parameter: condition
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 237. Discovery Contract — category-specific attribute filters

- Query parameter: dynamic
- URL rule: shareable when contract permits
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 238. Discovery Contract — sort mode

- Query parameter: sort
- URL rule: shareable
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 239. Discovery Contract — server cursor

- Query parameter: cursor
- URL rule: transient, avoid canonical SEO pollution
Verify the exact serialization against OpenAPI. Keep unrelated filter state intact when one filter changes. Provide reset behavior. Show applied state. Parse defensively. Reject malformed values without crashing. Never use a client-only filter that contradicts server results.

Mobile uses a filter sheet with explicit Apply and Reset actions. Desktop can use a persistent filter rail. Sort stays close to result heading.

# 250. Dynamic Attribute Contract — Mobile phones

- Example attributes: brand, model, storage, ram, battery_health, condition, color, network
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 251. Dynamic Attribute Contract — Laptops

- Example attributes: brand, model, cpu, ram, storage, gpu, screen_size, condition
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 252. Dynamic Attribute Contract — Cars

- Example attributes: brand_model, production_year, mileage, transmission, fuel, color, condition
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 253. Dynamic Attribute Contract — Home appliances

- Example attributes: brand, model, condition, capacity_or_size, age_or_year, color
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 254. Dynamic Attribute Contract — Furniture

- Example attributes: type, material, condition, color, dimensions
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 255. Dynamic Attribute Contract — Clothing

- Example attributes: type, size, gender, condition, color, brand
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 256. Dynamic Attribute Contract — Property

- Example attributes: property_type, rooms, size, floor, furnished, parking, condition
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 257. Dynamic Attribute Contract — Services

- Example attributes: service_type, availability, location, experience_or_specialization
These attributes illustrate the intended domain structure; they are NOT a hardcoded final schema. The backend filter-schema/category attribute contract is authoritative.

The renderer must consume attribute type, label, options, required/optional state, ordering, filterability, and validation metadata when provided. New backend attributes should not require a new page or new data-fetch strategy. Unknown non-critical attributes should fail gracefully or be represented through a safe generic renderer rather than crashing the page.

# 280. Error Contract — UNAUTHORIZED

- UI purpose: login required
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 281. Error Contract — FORBIDDEN

- UI purpose: not permitted
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 282. Error Contract — VALIDATION_ERROR

- UI purpose: review highlighted fields
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 283. Error Contract — LISTING_NOT_FOUND

- UI purpose: listing unavailable
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 284. Error Contract — LISTING_NOT_ACTIVE

- UI purpose: listing cannot be contacted now
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 285. Error Contract — CONTACT_METHOD_NOT_FOUND

- UI purpose: contact method unavailable
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 286. Error Contract — PHONE_NOT_VERIFIED

- UI purpose: verify phone first
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 287. Error Contract — FAVORITE_ALREADY_EXISTS

- UI purpose: already saved
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 288. Error Contract — FAVORITE_NOT_FOUND

- UI purpose: not saved
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 289. Error Contract — REPORT_ALREADY_OPEN

- UI purpose: already reported
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 290. Error Contract — CANNOT_REPORT_OWN_LISTING

- UI purpose: cannot report your own listing
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 291. Error Contract — LISTING_VERSION_CONFLICT

- UI purpose: listing changed; reload before saving
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 292. Error Contract — RATE_LIMITED

- UI purpose: please wait and try again
Map by stable `error.code`, not by human-readable message. Keep localization in the frontend. Preserve field-level `details` for validation. Never show stack traces. Keep requestId available for technical diagnostics without making it the primary user message. Recovery must be the least disruptive valid action.

# 300. Form Contract — Register

- Fields: phone, password, displayName
- Core rule: phone semantics + password quality + localized validation
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 301. Form Contract — Login

- Fields: phone, password
- Core rule: credential error + pending + session handling
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 302. Form Contract — OTP

- Fields: code
- Core rule: six-digit entry + resend cooldown + paste support
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 303. Form Contract — Forgot password

- Fields: phone
- Core rule: anti-enumeration-safe message
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 304. Form Contract — Reset password

- Fields: newPassword, confirmation
- Core rule: strength + mismatch + expiry
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 305. Form Contract — Listing basic info

- Fields: title, description, condition, price
- Core rule: clear labels + AFN formatting
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 306. Form Contract — Phone contact

- Fields: phone
- Core rule: Afghanistan phone normalization
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 307. Form Contract — Dynamic attributes

- Fields: backend schema-defined
- Core rule: type-specific controls
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 308. Form Contract — Report

- Fields: reason, optional note
- Core rule: one clear submit action
Use React Hook Form for complex interactive forms and Zod only where appropriate for frontend shape validation that complements backend validation. Server validation remains authoritative. Use labels, help text, error association, autocomplete, inputMode, and keyboard-safe layouts. Preserve safe user input after validation failure. Never persist passwords, OTPs, access tokens, or refresh tokens in drafts.

# 320. Seller Workflow Contract — Category

- Goal: choose category
- Rule: API category id/slug resolved through adapter
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 321. Seller Workflow Contract — Photos

- Goal: add images
- Rule: type/size/pixel/order/primary
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 322. Seller Workflow Contract — Basic

- Goal: title/description/condition/price
- Rule: clear Persian copy + AFN
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 323. Seller Workflow Contract — Attributes

- Goal: dynamic fields
- Rule: schema-driven
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 324. Seller Workflow Contract — Location

- Goal: province then city
- Rule: no forced precise geolocation
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 325. Seller Workflow Contract — Contact

- Goal: methods
- Rule: PHONE/WHATSAPP/TELEGRAM according to backend
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 326. Seller Workflow Contract — Preview

- Goal: public rendering
- Rule: reuse core listing detail presentation
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 327. Seller Workflow Contract — Submit

- Goal: state transition
- Rule: show backend outcome and requirements
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 340. Global State Contract — initial-loading

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 341. Global State Contract — partial-loading

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 342. Global State Contract — empty-no-results

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 343. Global State Contract — empty-account

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 344. Global State Contract — api-error

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 345. Global State Contract — unauthorized

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 346. Global State Contract — forbidden

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 347. Global State Contract — not-found

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 348. Global State Contract — conflict

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 349. Global State Contract — rate-limited

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 350. Global State Contract — offline

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 351. Global State Contract — slow-network

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 352. Global State Contract — stale-data

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 353. Global State Contract — sold

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 354. Global State Contract — archived

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 355. Global State Contract — suspended

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 356. Global State Contract — form-invalid

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 357. Global State Contract — submitting

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 358. Global State Contract — uploading

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 359. Global State Contract — upload-failed

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 360. Global State Contract — session-refresh

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 361. Global State Contract — session-expired

Design the state before implementation. Preserve stable geometry where possible. Avoid giant full-page spinners. Every failure state must tell the user what happened in plain Persian and what they can do next when recovery exists. Do not fabricate content to fill an empty feed. Do not reveal internal moderation details. Test 390px and 1280px.

# 370. Accessibility Contract — semantic structure

Use header, nav, main, section, footer, form, button, a, lists, tables when semantically correct.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 371. Accessibility Contract — focus-visible

Every keyboard-focusable control has a visible focus state.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 372. Accessibility Contract — keyboard complete

Every important task must be completed without pointer input.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 373. Accessibility Contract — dialog focus

Move focus into modal and restore it on close.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 374. Accessibility Contract — form labeling

Every input has an associated accessible label.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 375. Accessibility Contract — field errors

Associate error text with the affected control.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 376. Accessibility Contract — target size

Use the project 44px comfortable target baseline.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 377. Accessibility Contract — color meaning

Never rely on color alone for status.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 378. Accessibility Contract — mixed-direction text

Isolate phones, URLs, email, model strings, and handles.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 379. Accessibility Contract — reduced motion

Respect prefers-reduced-motion.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 380. Accessibility Contract — autocomplete

Use valid autocomplete tokens for user-information fields.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 381. Accessibility Contract — screen reader order

Reading order matches semantic meaning.

Verify through automated checks plus manual keyboard/focus review on critical routes.

# 390. SEO Contract — home

- Metadata: brand/product metadata
- Policy: public
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 391. SEO Contract — category

- Metadata: category title/description
- Policy: public
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 392. SEO Contract — listing

- Metadata: listing title/summary/image
- Policy: public when allowed
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 393. SEO Contract — seller

- Metadata: public seller information only
- Policy: public when allowed
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 394. SEO Contract — search

- Metadata: controlled canonical strategy
- Policy: indexing policy deliberate
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 395. SEO Contract — auth

- Metadata: no public indexing
- Policy: private
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 396. SEO Contract — account

- Metadata: no public indexing
- Policy: private
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 397. SEO Contract — admin

- Metadata: no public indexing
- Policy: private
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 398. SEO Contract — sitemap

- Metadata: only intended public URLs
- Policy: public
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 399. SEO Contract — robots

- Metadata: exclude admin/private routes
- Policy: public
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 400. SEO Contract — open-graph

- Metadata: safe public image/title
- Policy: public
Inspect rendered head output in production mode. Keep canonical URL generation deterministic. Do not index infinite combinations of search parameters. Never expose private seller/account data in social metadata. Do not invent aggregate ratings or review counts for structured data.

# 410. Performance Contract — JS

- Rule: narrow client boundaries
- Evidence: measure bundle/hydration
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 411. Performance Contract — LCP

- Rule: prioritize useful content
- Evidence: reserve media geometry
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 412. Performance Contract — INP

- Rule: responsive interactions
- Evidence: test CPU throttling
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 413. Performance Contract — CLS

- Rule: stable layout
- Evidence: width/height/sizes
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 414. Performance Contract — images

- Rule: backend variants + next/image
- Evidence: avoid originals in feeds
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 415. Performance Contract — fonts

- Rule: next/font/self-host
- Evidence: avoid runtime font requests
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 416. Performance Contract — prefetch

- Rule: only high-probability destinations
- Evidence: avoid network waste
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 417. Performance Contract — waterfalls

- Rule: parallelize independent server fetches
- Evidence: avoid serial awaits
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 418. Performance Contract — cache

- Rule: public non-personalized only
- Evidence: avoid private cache leak
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 419. Performance Contract — low bandwidth

- Rule: minimal first-view payload
- Evidence: no giant banners/video
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 420. Performance Contract — low-end CPU

- Rule: avoid large hydration trees
- Evidence: keep computation local and cheap
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 421. Performance Contract — third parties

- Rule: minimum necessary
- Evidence: analytics/scripts audited
A visual feature is rejected when it materially harms input responsiveness, layout stability, bandwidth, or first useful content. Measure with a production build; do not rely on development-mode timings.

# 430. Security Contract — token storage

no refresh token in browser storage

Release-blocking if violated.

# 431. Security Contract — env vars

no secret NEXT_PUBLIC_ value

Release-blocking if violated.

# 432. Security Contract — logging

never log secret/auth/private body

Release-blocking if violated.

# 433. Security Contract — unsafe HTML

avoid unsanitized HTML rendering

Release-blocking if violated.

# 434. Security Contract — redirects

validate return URLs

Release-blocking if violated.

# 435. Security Contract — external actions

trust only sanitized backend action URLs

Release-blocking if violated.

# 436. Security Contract — analytics

no PII/secrets

Release-blocking if violated.

# 437. Security Contract — drafts

safe fields only

Release-blocking if violated.

# 438. Security Contract — admin

server permission is authoritative

Release-blocking if violated.

# 439. Security Contract — error output

no stack traces to users

Release-blocking if violated.

# 450. Visual QA Contract — Header

Inspect: logo scale, baseline, action spacing.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 451. Visual QA Contract — Search

Inspect: 48px height, focus, clear, submit.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 452. Visual QA Contract — ListingCard

Inspect: 112px image area, title clamp, price, metadata, favorite.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 453. Visual QA Contract — Gallery

Inspect: aspect ratio, thumbnail/gesture, image count.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 454. Visual QA Contract — Detail CTA

Inspect: contact order, sticky behavior, safe area.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 455. Visual QA Contract — Form

Inspect: 48px controls, labels, errors, keyboard.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 456. Visual QA Contract — Sheet

Inspect: scroll region, close action, focus trap.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 457. Visual QA Contract — Dialog

Inspect: width, padding, portal direction, focus restore.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 458. Visual QA Contract — BottomNav

Inspect: 64–72px plus safe-area inset.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 459. Visual QA Contract — Footer

Inspect: compact mobile grouping.

Review at 320, 390, 430, 768, 1280, and 1440px. Verify token usage, logical RTL flow, typography, icon scale, focus, empty/error/loading state geometry, and touch targets. Reject unexplained visual inconsistency.

# 470. API Domain Adapter Contract — Auth

- Scope: register/login/verify/refresh/logout/password/session
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 471. API Domain Adapter Contract — Me

- Scope: current user/profile/security
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 472. API Domain Adapter Contract — Categories

- Scope: list/tree/filter-schema
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 473. API Domain Adapter Contract — Locations

- Scope: provinces/cities
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 474. API Domain Adapter Contract — Listings

- Scope: public discovery/detail + owner management
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 475. API Domain Adapter Contract — Media

- Scope: upload/delete/reorder/variants
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 476. API Domain Adapter Contract — Contacts

- Scope: contact action + method availability
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 477. API Domain Adapter Contract — Favorites

- Scope: create/delete/list
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 478. API Domain Adapter Contract — Reports

- Scope: submit report
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 479. API Domain Adapter Contract — Seller

- Scope: public seller + account
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 480. API Domain Adapter Contract — Admin

- Scope: moderation/users/reports/taxonomy/locations
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 481. API Domain Adapter Contract — Analytics

- Scope: only where UI needs it
This domain name does not authorize inventing endpoints. Verify the real OpenAPI/backend. Keep paths, DTOs, error codes, and auth requirements localized in the adapter/query layer. UI must consume stable frontend view models and hooks/services.

# 490. Navigation Contract — Mobile header

logo + minimal action + search/location context

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 491. Navigation Contract — Desktop header

logo + wide search + location + categories + sell + account/favorites

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 492. Navigation Contract — Bottom nav

home/search/categories/favorites/account

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 493. Navigation Contract — Breadcrumbs

start at home/category then current resource

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 494. Navigation Contract — Back navigation

use router/history semantics safely

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 495. Navigation Contract — Deep links

listing/category URLs must be directly openable

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 496. Navigation Contract — External contact

backend-provided action or sanitized URL

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 497. Navigation Contract — Share

native share when supported; copy link fallback

Navigation labels must be concise Persian. Active state must be visible without relying only on color. Mobile bottom navigation must not obscure sticky contact actions; calculate safe spacing.

# 530. Acceptance Record — Home / first viewport / idle

- Purpose: search-first hierarchy
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 531. Acceptance Record — Home / first viewport / hover

- Purpose: search-first hierarchy
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 532. Acceptance Record — Home / first viewport / focus-visible

- Purpose: search-first hierarchy
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 533. Acceptance Record — Home / first viewport / pressed

- Purpose: search-first hierarchy
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 534. Acceptance Record — Home / first viewport / disabled

- Purpose: search-first hierarchy
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 535. Acceptance Record — Home / first viewport / loading

- Purpose: search-first hierarchy
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 536. Acceptance Record — Home / first viewport / success

- Purpose: search-first hierarchy
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 537. Acceptance Record — Home / first viewport / error

- Purpose: search-first hierarchy
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 538. Acceptance Record — Home / first viewport / empty

- Purpose: search-first hierarchy
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 539. Acceptance Record — Home / first viewport / unauthorized

- Purpose: search-first hierarchy
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 540. Acceptance Record — Home / first viewport / forbidden

- Purpose: search-first hierarchy
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 541. Acceptance Record — Home / first viewport / not-found

- Purpose: search-first hierarchy
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 542. Acceptance Record — Home / first viewport / conflict

- Purpose: search-first hierarchy
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 543. Acceptance Record — Home / first viewport / offline

- Purpose: search-first hierarchy
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 544. Acceptance Record — Home / first viewport / slow-network

- Purpose: search-first hierarchy
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 545. Acceptance Record — Home / first viewport / long-content

- Purpose: search-first hierarchy
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 546. Acceptance Record — Home / first viewport / mixed-rtl

- Purpose: search-first hierarchy
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 547. Acceptance Record — Home / first viewport / no-image

- Purpose: search-first hierarchy
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 548. Acceptance Record — Home / first viewport / image-error

- Purpose: search-first hierarchy
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 549. Acceptance Record — Home / first viewport / reduced-motion

- Purpose: search-first hierarchy
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 550. Acceptance Record — Home / first viewport / keyboard

- Purpose: search-first hierarchy
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 551. Acceptance Record — Home / category discovery / idle

- Purpose: fast category access
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 552. Acceptance Record — Home / category discovery / hover

- Purpose: fast category access
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 553. Acceptance Record — Home / category discovery / focus-visible

- Purpose: fast category access
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 554. Acceptance Record — Home / category discovery / pressed

- Purpose: fast category access
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 555. Acceptance Record — Home / category discovery / disabled

- Purpose: fast category access
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 556. Acceptance Record — Home / category discovery / loading

- Purpose: fast category access
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 557. Acceptance Record — Home / category discovery / success

- Purpose: fast category access
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 558. Acceptance Record — Home / category discovery / error

- Purpose: fast category access
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 559. Acceptance Record — Home / category discovery / empty

- Purpose: fast category access
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 560. Acceptance Record — Home / category discovery / unauthorized

- Purpose: fast category access
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 561. Acceptance Record — Home / category discovery / forbidden

- Purpose: fast category access
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 562. Acceptance Record — Home / category discovery / not-found

- Purpose: fast category access
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 563. Acceptance Record — Home / category discovery / conflict

- Purpose: fast category access
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 564. Acceptance Record — Home / category discovery / offline

- Purpose: fast category access
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 565. Acceptance Record — Home / category discovery / slow-network

- Purpose: fast category access
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 566. Acceptance Record — Home / category discovery / long-content

- Purpose: fast category access
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 567. Acceptance Record — Home / category discovery / mixed-rtl

- Purpose: fast category access
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 568. Acceptance Record — Home / category discovery / no-image

- Purpose: fast category access
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 569. Acceptance Record — Home / category discovery / image-error

- Purpose: fast category access
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 570. Acceptance Record — Home / category discovery / reduced-motion

- Purpose: fast category access
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 571. Acceptance Record — Home / category discovery / keyboard

- Purpose: fast category access
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 572. Acceptance Record — Home / latest listings / idle

- Purpose: real listing data only
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 573. Acceptance Record — Home / latest listings / hover

- Purpose: real listing data only
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 574. Acceptance Record — Home / latest listings / focus-visible

- Purpose: real listing data only
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 575. Acceptance Record — Home / latest listings / pressed

- Purpose: real listing data only
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 576. Acceptance Record — Home / latest listings / disabled

- Purpose: real listing data only
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 577. Acceptance Record — Home / latest listings / loading

- Purpose: real listing data only
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 578. Acceptance Record — Home / latest listings / success

- Purpose: real listing data only
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 579. Acceptance Record — Home / latest listings / error

- Purpose: real listing data only
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 580. Acceptance Record — Home / latest listings / empty

- Purpose: real listing data only
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 581. Acceptance Record — Home / latest listings / unauthorized

- Purpose: real listing data only
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 582. Acceptance Record — Home / latest listings / forbidden

- Purpose: real listing data only
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 583. Acceptance Record — Home / latest listings / not-found

- Purpose: real listing data only
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 584. Acceptance Record — Home / latest listings / conflict

- Purpose: real listing data only
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 585. Acceptance Record — Home / latest listings / offline

- Purpose: real listing data only
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 586. Acceptance Record — Home / latest listings / slow-network

- Purpose: real listing data only
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 587. Acceptance Record — Home / latest listings / long-content

- Purpose: real listing data only
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 588. Acceptance Record — Home / latest listings / mixed-rtl

- Purpose: real listing data only
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 589. Acceptance Record — Home / latest listings / no-image

- Purpose: real listing data only
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 590. Acceptance Record — Home / latest listings / image-error

- Purpose: real listing data only
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 591. Acceptance Record — Home / latest listings / reduced-motion

- Purpose: real listing data only
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 592. Acceptance Record — Home / latest listings / keyboard

- Purpose: real listing data only
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 593. Acceptance Record — Home / sell CTA / idle

- Purpose: orange controlled accent
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 594. Acceptance Record — Home / sell CTA / hover

- Purpose: orange controlled accent
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 595. Acceptance Record — Home / sell CTA / focus-visible

- Purpose: orange controlled accent
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 596. Acceptance Record — Home / sell CTA / pressed

- Purpose: orange controlled accent
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 597. Acceptance Record — Home / sell CTA / disabled

- Purpose: orange controlled accent
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 598. Acceptance Record — Home / sell CTA / loading

- Purpose: orange controlled accent
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 599. Acceptance Record — Home / sell CTA / success

- Purpose: orange controlled accent
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 600. Acceptance Record — Home / sell CTA / error

- Purpose: orange controlled accent
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 601. Acceptance Record — Home / sell CTA / empty

- Purpose: orange controlled accent
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 602. Acceptance Record — Home / sell CTA / unauthorized

- Purpose: orange controlled accent
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 603. Acceptance Record — Home / sell CTA / forbidden

- Purpose: orange controlled accent
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 604. Acceptance Record — Home / sell CTA / not-found

- Purpose: orange controlled accent
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 605. Acceptance Record — Home / sell CTA / conflict

- Purpose: orange controlled accent
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 606. Acceptance Record — Home / sell CTA / offline

- Purpose: orange controlled accent
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 607. Acceptance Record — Home / sell CTA / slow-network

- Purpose: orange controlled accent
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 608. Acceptance Record — Home / sell CTA / long-content

- Purpose: orange controlled accent
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 609. Acceptance Record — Home / sell CTA / mixed-rtl

- Purpose: orange controlled accent
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 610. Acceptance Record — Home / sell CTA / no-image

- Purpose: orange controlled accent
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 611. Acceptance Record — Home / sell CTA / image-error

- Purpose: orange controlled accent
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 612. Acceptance Record — Home / sell CTA / reduced-motion

- Purpose: orange controlled accent
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 613. Acceptance Record — Home / sell CTA / keyboard

- Purpose: orange controlled accent
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 614. Acceptance Record — Search / query / idle

- Purpose: URL state
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 615. Acceptance Record — Search / query / hover

- Purpose: URL state
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 616. Acceptance Record — Search / query / focus-visible

- Purpose: URL state
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 617. Acceptance Record — Search / query / pressed

- Purpose: URL state
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 618. Acceptance Record — Search / query / disabled

- Purpose: URL state
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 619. Acceptance Record — Search / query / loading

- Purpose: URL state
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 620. Acceptance Record — Search / query / success

- Purpose: URL state
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 621. Acceptance Record — Search / query / error

- Purpose: URL state
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 622. Acceptance Record — Search / query / empty

- Purpose: URL state
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 623. Acceptance Record — Search / query / unauthorized

- Purpose: URL state
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 624. Acceptance Record — Search / query / forbidden

- Purpose: URL state
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 625. Acceptance Record — Search / query / not-found

- Purpose: URL state
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 626. Acceptance Record — Search / query / conflict

- Purpose: URL state
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 627. Acceptance Record — Search / query / offline

- Purpose: URL state
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 628. Acceptance Record — Search / query / slow-network

- Purpose: URL state
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 629. Acceptance Record — Search / query / long-content

- Purpose: URL state
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 630. Acceptance Record — Search / query / mixed-rtl

- Purpose: URL state
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 631. Acceptance Record — Search / query / no-image

- Purpose: URL state
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 632. Acceptance Record — Search / query / image-error

- Purpose: URL state
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 633. Acceptance Record — Search / query / reduced-motion

- Purpose: URL state
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 634. Acceptance Record — Search / query / keyboard

- Purpose: URL state
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 635. Acceptance Record — Search / filters / idle

- Purpose: applied chip visibility
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 636. Acceptance Record — Search / filters / hover

- Purpose: applied chip visibility
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 637. Acceptance Record — Search / filters / focus-visible

- Purpose: applied chip visibility
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 638. Acceptance Record — Search / filters / pressed

- Purpose: applied chip visibility
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 639. Acceptance Record — Search / filters / disabled

- Purpose: applied chip visibility
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 640. Acceptance Record — Search / filters / loading

- Purpose: applied chip visibility
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 641. Acceptance Record — Search / filters / success

- Purpose: applied chip visibility
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 642. Acceptance Record — Search / filters / error

- Purpose: applied chip visibility
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 643. Acceptance Record — Search / filters / empty

- Purpose: applied chip visibility
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 644. Acceptance Record — Search / filters / unauthorized

- Purpose: applied chip visibility
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 645. Acceptance Record — Search / filters / forbidden

- Purpose: applied chip visibility
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 646. Acceptance Record — Search / filters / not-found

- Purpose: applied chip visibility
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 647. Acceptance Record — Search / filters / conflict

- Purpose: applied chip visibility
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 648. Acceptance Record — Search / filters / offline

- Purpose: applied chip visibility
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 649. Acceptance Record — Search / filters / slow-network

- Purpose: applied chip visibility
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 650. Acceptance Record — Search / filters / long-content

- Purpose: applied chip visibility
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 651. Acceptance Record — Search / filters / mixed-rtl

- Purpose: applied chip visibility
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 652. Acceptance Record — Search / filters / no-image

- Purpose: applied chip visibility
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 653. Acceptance Record — Search / filters / image-error

- Purpose: applied chip visibility
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 654. Acceptance Record — Search / filters / reduced-motion

- Purpose: applied chip visibility
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 655. Acceptance Record — Search / filters / keyboard

- Purpose: applied chip visibility
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 656. Acceptance Record — Search / sort / idle

- Purpose: result consistency
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 657. Acceptance Record — Search / sort / hover

- Purpose: result consistency
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 658. Acceptance Record — Search / sort / focus-visible

- Purpose: result consistency
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 659. Acceptance Record — Search / sort / pressed

- Purpose: result consistency
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 660. Acceptance Record — Search / sort / disabled

- Purpose: result consistency
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 661. Acceptance Record — Search / sort / loading

- Purpose: result consistency
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 662. Acceptance Record — Search / sort / success

- Purpose: result consistency
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 663. Acceptance Record — Search / sort / error

- Purpose: result consistency
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 664. Acceptance Record — Search / sort / empty

- Purpose: result consistency
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 665. Acceptance Record — Search / sort / unauthorized

- Purpose: result consistency
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 666. Acceptance Record — Search / sort / forbidden

- Purpose: result consistency
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 667. Acceptance Record — Search / sort / not-found

- Purpose: result consistency
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 668. Acceptance Record — Search / sort / conflict

- Purpose: result consistency
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 669. Acceptance Record — Search / sort / offline

- Purpose: result consistency
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 670. Acceptance Record — Search / sort / slow-network

- Purpose: result consistency
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 671. Acceptance Record — Search / sort / long-content

- Purpose: result consistency
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 672. Acceptance Record — Search / sort / mixed-rtl

- Purpose: result consistency
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 673. Acceptance Record — Search / sort / no-image

- Purpose: result consistency
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 674. Acceptance Record — Search / sort / image-error

- Purpose: result consistency
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 675. Acceptance Record — Search / sort / reduced-motion

- Purpose: result consistency
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 676. Acceptance Record — Search / sort / keyboard

- Purpose: result consistency
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 677. Acceptance Record — Search / empty / idle

- Purpose: broaden query/recover
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 678. Acceptance Record — Search / empty / hover

- Purpose: broaden query/recover
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 679. Acceptance Record — Search / empty / focus-visible

- Purpose: broaden query/recover
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 680. Acceptance Record — Search / empty / pressed

- Purpose: broaden query/recover
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 681. Acceptance Record — Search / empty / disabled

- Purpose: broaden query/recover
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 682. Acceptance Record — Search / empty / loading

- Purpose: broaden query/recover
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 683. Acceptance Record — Search / empty / success

- Purpose: broaden query/recover
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 684. Acceptance Record — Search / empty / error

- Purpose: broaden query/recover
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 685. Acceptance Record — Search / empty / empty

- Purpose: broaden query/recover
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 686. Acceptance Record — Search / empty / unauthorized

- Purpose: broaden query/recover
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 687. Acceptance Record — Search / empty / forbidden

- Purpose: broaden query/recover
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 688. Acceptance Record — Search / empty / not-found

- Purpose: broaden query/recover
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 689. Acceptance Record — Search / empty / conflict

- Purpose: broaden query/recover
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 690. Acceptance Record — Search / empty / offline

- Purpose: broaden query/recover
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 691. Acceptance Record — Search / empty / slow-network

- Purpose: broaden query/recover
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 692. Acceptance Record — Search / empty / long-content

- Purpose: broaden query/recover
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 693. Acceptance Record — Search / empty / mixed-rtl

- Purpose: broaden query/recover
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 694. Acceptance Record — Search / empty / no-image

- Purpose: broaden query/recover
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 695. Acceptance Record — Search / empty / image-error

- Purpose: broaden query/recover
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 696. Acceptance Record — Search / empty / reduced-motion

- Purpose: broaden query/recover
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 697. Acceptance Record — Search / empty / keyboard

- Purpose: broaden query/recover
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 698. Acceptance Record — Search / network / idle

- Purpose: retry without losing query
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 699. Acceptance Record — Search / network / hover

- Purpose: retry without losing query
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 700. Acceptance Record — Search / network / focus-visible

- Purpose: retry without losing query
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 701. Acceptance Record — Search / network / pressed

- Purpose: retry without losing query
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 702. Acceptance Record — Search / network / disabled

- Purpose: retry without losing query
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 703. Acceptance Record — Search / network / loading

- Purpose: retry without losing query
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 704. Acceptance Record — Search / network / success

- Purpose: retry without losing query
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 705. Acceptance Record — Search / network / error

- Purpose: retry without losing query
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 706. Acceptance Record — Search / network / empty

- Purpose: retry without losing query
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 707. Acceptance Record — Search / network / unauthorized

- Purpose: retry without losing query
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 708. Acceptance Record — Search / network / forbidden

- Purpose: retry without losing query
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 709. Acceptance Record — Search / network / not-found

- Purpose: retry without losing query
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 710. Acceptance Record — Search / network / conflict

- Purpose: retry without losing query
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 711. Acceptance Record — Search / network / offline

- Purpose: retry without losing query
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 712. Acceptance Record — Search / network / slow-network

- Purpose: retry without losing query
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 713. Acceptance Record — Search / network / long-content

- Purpose: retry without losing query
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 714. Acceptance Record — Search / network / mixed-rtl

- Purpose: retry without losing query
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 715. Acceptance Record — Search / network / no-image

- Purpose: retry without losing query
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 716. Acceptance Record — Search / network / image-error

- Purpose: retry without losing query
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 717. Acceptance Record — Search / network / reduced-motion

- Purpose: retry without losing query
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 718. Acceptance Record — Search / network / keyboard

- Purpose: retry without losing query
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 719. Acceptance Record — Category / breadcrumb / idle

- Purpose: logical navigation
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 720. Acceptance Record — Category / breadcrumb / hover

- Purpose: logical navigation
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 721. Acceptance Record — Category / breadcrumb / focus-visible

- Purpose: logical navigation
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 722. Acceptance Record — Category / breadcrumb / pressed

- Purpose: logical navigation
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 723. Acceptance Record — Category / breadcrumb / disabled

- Purpose: logical navigation
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 724. Acceptance Record — Category / breadcrumb / loading

- Purpose: logical navigation
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 725. Acceptance Record — Category / breadcrumb / success

- Purpose: logical navigation
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 726. Acceptance Record — Category / breadcrumb / error

- Purpose: logical navigation
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 727. Acceptance Record — Category / breadcrumb / empty

- Purpose: logical navigation
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 728. Acceptance Record — Category / breadcrumb / unauthorized

- Purpose: logical navigation
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 729. Acceptance Record — Category / breadcrumb / forbidden

- Purpose: logical navigation
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 730. Acceptance Record — Category / breadcrumb / not-found

- Purpose: logical navigation
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 731. Acceptance Record — Category / breadcrumb / conflict

- Purpose: logical navigation
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 732. Acceptance Record — Category / breadcrumb / offline

- Purpose: logical navigation
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 733. Acceptance Record — Category / breadcrumb / slow-network

- Purpose: logical navigation
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 734. Acceptance Record — Category / breadcrumb / long-content

- Purpose: logical navigation
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 735. Acceptance Record — Category / breadcrumb / mixed-rtl

- Purpose: logical navigation
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 736. Acceptance Record — Category / breadcrumb / no-image

- Purpose: logical navigation
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 737. Acceptance Record — Category / breadcrumb / image-error

- Purpose: logical navigation
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 738. Acceptance Record — Category / breadcrumb / reduced-motion

- Purpose: logical navigation
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 739. Acceptance Record — Category / breadcrumb / keyboard

- Purpose: logical navigation
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 740. Acceptance Record — Category / children / idle

- Purpose: scan-friendly shortcuts
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 741. Acceptance Record — Category / children / hover

- Purpose: scan-friendly shortcuts
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 742. Acceptance Record — Category / children / focus-visible

- Purpose: scan-friendly shortcuts
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 743. Acceptance Record — Category / children / pressed

- Purpose: scan-friendly shortcuts
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 744. Acceptance Record — Category / children / disabled

- Purpose: scan-friendly shortcuts
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 745. Acceptance Record — Category / children / loading

- Purpose: scan-friendly shortcuts
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 746. Acceptance Record — Category / children / success

- Purpose: scan-friendly shortcuts
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 747. Acceptance Record — Category / children / error

- Purpose: scan-friendly shortcuts
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 748. Acceptance Record — Category / children / empty

- Purpose: scan-friendly shortcuts
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 749. Acceptance Record — Category / children / unauthorized

- Purpose: scan-friendly shortcuts
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 750. Acceptance Record — Category / children / forbidden

- Purpose: scan-friendly shortcuts
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 751. Acceptance Record — Category / children / not-found

- Purpose: scan-friendly shortcuts
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 752. Acceptance Record — Category / children / conflict

- Purpose: scan-friendly shortcuts
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 753. Acceptance Record — Category / children / offline

- Purpose: scan-friendly shortcuts
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 754. Acceptance Record — Category / children / slow-network

- Purpose: scan-friendly shortcuts
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 755. Acceptance Record — Category / children / long-content

- Purpose: scan-friendly shortcuts
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 756. Acceptance Record — Category / children / mixed-rtl

- Purpose: scan-friendly shortcuts
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 757. Acceptance Record — Category / children / no-image

- Purpose: scan-friendly shortcuts
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 758. Acceptance Record — Category / children / image-error

- Purpose: scan-friendly shortcuts
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 759. Acceptance Record — Category / children / reduced-motion

- Purpose: scan-friendly shortcuts
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 760. Acceptance Record — Category / children / keyboard

- Purpose: scan-friendly shortcuts
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 761. Acceptance Record — Category / dynamic filters / idle

- Purpose: schema-driven
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 762. Acceptance Record — Category / dynamic filters / hover

- Purpose: schema-driven
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 763. Acceptance Record — Category / dynamic filters / focus-visible

- Purpose: schema-driven
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 764. Acceptance Record — Category / dynamic filters / pressed

- Purpose: schema-driven
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 765. Acceptance Record — Category / dynamic filters / disabled

- Purpose: schema-driven
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 766. Acceptance Record — Category / dynamic filters / loading

- Purpose: schema-driven
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 767. Acceptance Record — Category / dynamic filters / success

- Purpose: schema-driven
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 768. Acceptance Record — Category / dynamic filters / error

- Purpose: schema-driven
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 769. Acceptance Record — Category / dynamic filters / empty

- Purpose: schema-driven
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 770. Acceptance Record — Category / dynamic filters / unauthorized

- Purpose: schema-driven
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 771. Acceptance Record — Category / dynamic filters / forbidden

- Purpose: schema-driven
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 772. Acceptance Record — Category / dynamic filters / not-found

- Purpose: schema-driven
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 773. Acceptance Record — Category / dynamic filters / conflict

- Purpose: schema-driven
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 774. Acceptance Record — Category / dynamic filters / offline

- Purpose: schema-driven
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 775. Acceptance Record — Category / dynamic filters / slow-network

- Purpose: schema-driven
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 776. Acceptance Record — Category / dynamic filters / long-content

- Purpose: schema-driven
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 777. Acceptance Record — Category / dynamic filters / mixed-rtl

- Purpose: schema-driven
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 778. Acceptance Record — Category / dynamic filters / no-image

- Purpose: schema-driven
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 779. Acceptance Record — Category / dynamic filters / image-error

- Purpose: schema-driven
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 780. Acceptance Record — Category / dynamic filters / reduced-motion

- Purpose: schema-driven
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 781. Acceptance Record — Category / dynamic filters / keyboard

- Purpose: schema-driven
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 782. Acceptance Record — Category / results / idle

- Purpose: listing density
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 783. Acceptance Record — Category / results / hover

- Purpose: listing density
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 784. Acceptance Record — Category / results / focus-visible

- Purpose: listing density
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 785. Acceptance Record — Category / results / pressed

- Purpose: listing density
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 786. Acceptance Record — Category / results / disabled

- Purpose: listing density
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 787. Acceptance Record — Category / results / loading

- Purpose: listing density
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 788. Acceptance Record — Category / results / success

- Purpose: listing density
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 789. Acceptance Record — Category / results / error

- Purpose: listing density
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 790. Acceptance Record — Category / results / empty

- Purpose: listing density
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 791. Acceptance Record — Category / results / unauthorized

- Purpose: listing density
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 792. Acceptance Record — Category / results / forbidden

- Purpose: listing density
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 793. Acceptance Record — Category / results / not-found

- Purpose: listing density
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 794. Acceptance Record — Category / results / conflict

- Purpose: listing density
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 795. Acceptance Record — Category / results / offline

- Purpose: listing density
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 796. Acceptance Record — Category / results / slow-network

- Purpose: listing density
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 797. Acceptance Record — Category / results / long-content

- Purpose: listing density
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 798. Acceptance Record — Category / results / mixed-rtl

- Purpose: listing density
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 799. Acceptance Record — Category / results / no-image

- Purpose: listing density
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 800. Acceptance Record — Category / results / image-error

- Purpose: listing density
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 801. Acceptance Record — Category / results / reduced-motion

- Purpose: listing density
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 802. Acceptance Record — Category / results / keyboard

- Purpose: listing density
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 803. Acceptance Record — Listing Detail / gallery / idle

- Purpose: optimized responsive images
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 804. Acceptance Record — Listing Detail / gallery / hover

- Purpose: optimized responsive images
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 805. Acceptance Record — Listing Detail / gallery / focus-visible

- Purpose: optimized responsive images
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 806. Acceptance Record — Listing Detail / gallery / pressed

- Purpose: optimized responsive images
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 807. Acceptance Record — Listing Detail / gallery / disabled

- Purpose: optimized responsive images
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 808. Acceptance Record — Listing Detail / gallery / loading

- Purpose: optimized responsive images
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 809. Acceptance Record — Listing Detail / gallery / success

- Purpose: optimized responsive images
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 810. Acceptance Record — Listing Detail / gallery / error

- Purpose: optimized responsive images
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 811. Acceptance Record — Listing Detail / gallery / empty

- Purpose: optimized responsive images
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 812. Acceptance Record — Listing Detail / gallery / unauthorized

- Purpose: optimized responsive images
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 813. Acceptance Record — Listing Detail / gallery / forbidden

- Purpose: optimized responsive images
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 814. Acceptance Record — Listing Detail / gallery / not-found

- Purpose: optimized responsive images
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 815. Acceptance Record — Listing Detail / gallery / conflict

- Purpose: optimized responsive images
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 816. Acceptance Record — Listing Detail / gallery / offline

- Purpose: optimized responsive images
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 817. Acceptance Record — Listing Detail / gallery / slow-network

- Purpose: optimized responsive images
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 818. Acceptance Record — Listing Detail / gallery / long-content

- Purpose: optimized responsive images
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 819. Acceptance Record — Listing Detail / gallery / mixed-rtl

- Purpose: optimized responsive images
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 820. Acceptance Record — Listing Detail / gallery / no-image

- Purpose: optimized responsive images
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 821. Acceptance Record — Listing Detail / gallery / image-error

- Purpose: optimized responsive images
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 822. Acceptance Record — Listing Detail / gallery / reduced-motion

- Purpose: optimized responsive images
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 823. Acceptance Record — Listing Detail / gallery / keyboard

- Purpose: optimized responsive images
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 824. Acceptance Record — Listing Detail / price / idle

- Purpose: strong hierarchy
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 825. Acceptance Record — Listing Detail / price / hover

- Purpose: strong hierarchy
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 826. Acceptance Record — Listing Detail / price / focus-visible

- Purpose: strong hierarchy
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 827. Acceptance Record — Listing Detail / price / pressed

- Purpose: strong hierarchy
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 828. Acceptance Record — Listing Detail / price / disabled

- Purpose: strong hierarchy
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 829. Acceptance Record — Listing Detail / price / loading

- Purpose: strong hierarchy
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 830. Acceptance Record — Listing Detail / price / success

- Purpose: strong hierarchy
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 831. Acceptance Record — Listing Detail / price / error

- Purpose: strong hierarchy
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 832. Acceptance Record — Listing Detail / price / empty

- Purpose: strong hierarchy
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 833. Acceptance Record — Listing Detail / price / unauthorized

- Purpose: strong hierarchy
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 834. Acceptance Record — Listing Detail / price / forbidden

- Purpose: strong hierarchy
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 835. Acceptance Record — Listing Detail / price / not-found

- Purpose: strong hierarchy
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 836. Acceptance Record — Listing Detail / price / conflict

- Purpose: strong hierarchy
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 837. Acceptance Record — Listing Detail / price / offline

- Purpose: strong hierarchy
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 838. Acceptance Record — Listing Detail / price / slow-network

- Purpose: strong hierarchy
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 839. Acceptance Record — Listing Detail / price / long-content

- Purpose: strong hierarchy
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 840. Acceptance Record — Listing Detail / price / mixed-rtl

- Purpose: strong hierarchy
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 841. Acceptance Record — Listing Detail / price / no-image

- Purpose: strong hierarchy
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 842. Acceptance Record — Listing Detail / price / image-error

- Purpose: strong hierarchy
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 843. Acceptance Record — Listing Detail / price / reduced-motion

- Purpose: strong hierarchy
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 844. Acceptance Record — Listing Detail / price / keyboard

- Purpose: strong hierarchy
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 845. Acceptance Record — Listing Detail / attributes / idle

- Purpose: schema-driven display
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 846. Acceptance Record — Listing Detail / attributes / hover

- Purpose: schema-driven display
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 847. Acceptance Record — Listing Detail / attributes / focus-visible

- Purpose: schema-driven display
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 848. Acceptance Record — Listing Detail / attributes / pressed

- Purpose: schema-driven display
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 849. Acceptance Record — Listing Detail / attributes / disabled

- Purpose: schema-driven display
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 850. Acceptance Record — Listing Detail / attributes / loading

- Purpose: schema-driven display
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 851. Acceptance Record — Listing Detail / attributes / success

- Purpose: schema-driven display
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 852. Acceptance Record — Listing Detail / attributes / error

- Purpose: schema-driven display
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 853. Acceptance Record — Listing Detail / attributes / empty

- Purpose: schema-driven display
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 854. Acceptance Record — Listing Detail / attributes / unauthorized

- Purpose: schema-driven display
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 855. Acceptance Record — Listing Detail / attributes / forbidden

- Purpose: schema-driven display
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 856. Acceptance Record — Listing Detail / attributes / not-found

- Purpose: schema-driven display
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 857. Acceptance Record — Listing Detail / attributes / conflict

- Purpose: schema-driven display
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 858. Acceptance Record — Listing Detail / attributes / offline

- Purpose: schema-driven display
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 859. Acceptance Record — Listing Detail / attributes / slow-network

- Purpose: schema-driven display
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 860. Acceptance Record — Listing Detail / attributes / long-content

- Purpose: schema-driven display
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 861. Acceptance Record — Listing Detail / attributes / mixed-rtl

- Purpose: schema-driven display
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 862. Acceptance Record — Listing Detail / attributes / no-image

- Purpose: schema-driven display
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 863. Acceptance Record — Listing Detail / attributes / image-error

- Purpose: schema-driven display
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 864. Acceptance Record — Listing Detail / attributes / reduced-motion

- Purpose: schema-driven display
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 865. Acceptance Record — Listing Detail / attributes / keyboard

- Purpose: schema-driven display
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 866. Acceptance Record — Listing Detail / description / idle

- Purpose: readable line length
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 867. Acceptance Record — Listing Detail / description / hover

- Purpose: readable line length
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 868. Acceptance Record — Listing Detail / description / focus-visible

- Purpose: readable line length
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 869. Acceptance Record — Listing Detail / description / pressed

- Purpose: readable line length
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 870. Acceptance Record — Listing Detail / description / disabled

- Purpose: readable line length
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 871. Acceptance Record — Listing Detail / description / loading

- Purpose: readable line length
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 872. Acceptance Record — Listing Detail / description / success

- Purpose: readable line length
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 873. Acceptance Record — Listing Detail / description / error

- Purpose: readable line length
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 874. Acceptance Record — Listing Detail / description / empty

- Purpose: readable line length
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 875. Acceptance Record — Listing Detail / description / unauthorized

- Purpose: readable line length
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 876. Acceptance Record — Listing Detail / description / forbidden

- Purpose: readable line length
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 877. Acceptance Record — Listing Detail / description / not-found

- Purpose: readable line length
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 878. Acceptance Record — Listing Detail / description / conflict

- Purpose: readable line length
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 879. Acceptance Record — Listing Detail / description / offline

- Purpose: readable line length
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 880. Acceptance Record — Listing Detail / description / slow-network

- Purpose: readable line length
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 881. Acceptance Record — Listing Detail / description / long-content

- Purpose: readable line length
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 882. Acceptance Record — Listing Detail / description / mixed-rtl

- Purpose: readable line length
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 883. Acceptance Record — Listing Detail / description / no-image

- Purpose: readable line length
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 884. Acceptance Record — Listing Detail / description / image-error

- Purpose: readable line length
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 885. Acceptance Record — Listing Detail / description / reduced-motion

- Purpose: readable line length
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 886. Acceptance Record — Listing Detail / description / keyboard

- Purpose: readable line length
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 887. Acceptance Record — Listing Detail / seller / idle

- Purpose: public-only context
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 888. Acceptance Record — Listing Detail / seller / hover

- Purpose: public-only context
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 889. Acceptance Record — Listing Detail / seller / focus-visible

- Purpose: public-only context
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 890. Acceptance Record — Listing Detail / seller / pressed

- Purpose: public-only context
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 891. Acceptance Record — Listing Detail / seller / disabled

- Purpose: public-only context
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 892. Acceptance Record — Listing Detail / seller / loading

- Purpose: public-only context
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 893. Acceptance Record — Listing Detail / seller / success

- Purpose: public-only context
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 894. Acceptance Record — Listing Detail / seller / error

- Purpose: public-only context
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 895. Acceptance Record — Listing Detail / seller / empty

- Purpose: public-only context
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 896. Acceptance Record — Listing Detail / seller / unauthorized

- Purpose: public-only context
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 897. Acceptance Record — Listing Detail / seller / forbidden

- Purpose: public-only context
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 898. Acceptance Record — Listing Detail / seller / not-found

- Purpose: public-only context
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 899. Acceptance Record — Listing Detail / seller / conflict

- Purpose: public-only context
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 900. Acceptance Record — Listing Detail / seller / offline

- Purpose: public-only context
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 901. Acceptance Record — Listing Detail / seller / slow-network

- Purpose: public-only context
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 902. Acceptance Record — Listing Detail / seller / long-content

- Purpose: public-only context
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 903. Acceptance Record — Listing Detail / seller / mixed-rtl

- Purpose: public-only context
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 904. Acceptance Record — Listing Detail / seller / no-image

- Purpose: public-only context
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 905. Acceptance Record — Listing Detail / seller / image-error

- Purpose: public-only context
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 906. Acceptance Record — Listing Detail / seller / reduced-motion

- Purpose: public-only context
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 907. Acceptance Record — Listing Detail / seller / keyboard

- Purpose: public-only context
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 908. Acceptance Record — Listing Detail / contact / idle

- Purpose: low-friction direct action
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 909. Acceptance Record — Listing Detail / contact / hover

- Purpose: low-friction direct action
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 910. Acceptance Record — Listing Detail / contact / focus-visible

- Purpose: low-friction direct action
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 911. Acceptance Record — Listing Detail / contact / pressed

- Purpose: low-friction direct action
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 912. Acceptance Record — Listing Detail / contact / disabled

- Purpose: low-friction direct action
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 913. Acceptance Record — Listing Detail / contact / loading

- Purpose: low-friction direct action
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 914. Acceptance Record — Listing Detail / contact / success

- Purpose: low-friction direct action
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 915. Acceptance Record — Listing Detail / contact / error

- Purpose: low-friction direct action
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 916. Acceptance Record — Listing Detail / contact / empty

- Purpose: low-friction direct action
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 917. Acceptance Record — Listing Detail / contact / unauthorized

- Purpose: low-friction direct action
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 918. Acceptance Record — Listing Detail / contact / forbidden

- Purpose: low-friction direct action
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 919. Acceptance Record — Listing Detail / contact / not-found

- Purpose: low-friction direct action
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 920. Acceptance Record — Listing Detail / contact / conflict

- Purpose: low-friction direct action
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 921. Acceptance Record — Listing Detail / contact / offline

- Purpose: low-friction direct action
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 922. Acceptance Record — Listing Detail / contact / slow-network

- Purpose: low-friction direct action
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 923. Acceptance Record — Listing Detail / contact / long-content

- Purpose: low-friction direct action
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 924. Acceptance Record — Listing Detail / contact / mixed-rtl

- Purpose: low-friction direct action
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 925. Acceptance Record — Listing Detail / contact / no-image

- Purpose: low-friction direct action
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 926. Acceptance Record — Listing Detail / contact / image-error

- Purpose: low-friction direct action
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 927. Acceptance Record — Listing Detail / contact / reduced-motion

- Purpose: low-friction direct action
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 928. Acceptance Record — Listing Detail / contact / keyboard

- Purpose: low-friction direct action
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 929. Acceptance Record — Listing Detail / report / idle

- Purpose: secondary but discoverable
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 930. Acceptance Record — Listing Detail / report / hover

- Purpose: secondary but discoverable
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 931. Acceptance Record — Listing Detail / report / focus-visible

- Purpose: secondary but discoverable
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 932. Acceptance Record — Listing Detail / report / pressed

- Purpose: secondary but discoverable
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 933. Acceptance Record — Listing Detail / report / disabled

- Purpose: secondary but discoverable
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 934. Acceptance Record — Listing Detail / report / loading

- Purpose: secondary but discoverable
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 935. Acceptance Record — Listing Detail / report / success

- Purpose: secondary but discoverable
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 936. Acceptance Record — Listing Detail / report / error

- Purpose: secondary but discoverable
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 937. Acceptance Record — Listing Detail / report / empty

- Purpose: secondary but discoverable
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 938. Acceptance Record — Listing Detail / report / unauthorized

- Purpose: secondary but discoverable
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 939. Acceptance Record — Listing Detail / report / forbidden

- Purpose: secondary but discoverable
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 940. Acceptance Record — Listing Detail / report / not-found

- Purpose: secondary but discoverable
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 941. Acceptance Record — Listing Detail / report / conflict

- Purpose: secondary but discoverable
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 942. Acceptance Record — Listing Detail / report / offline

- Purpose: secondary but discoverable
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 943. Acceptance Record — Listing Detail / report / slow-network

- Purpose: secondary but discoverable
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 944. Acceptance Record — Listing Detail / report / long-content

- Purpose: secondary but discoverable
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 945. Acceptance Record — Listing Detail / report / mixed-rtl

- Purpose: secondary but discoverable
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 946. Acceptance Record — Listing Detail / report / no-image

- Purpose: secondary but discoverable
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 947. Acceptance Record — Listing Detail / report / image-error

- Purpose: secondary but discoverable
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 948. Acceptance Record — Listing Detail / report / reduced-motion

- Purpose: secondary but discoverable
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 949. Acceptance Record — Listing Detail / report / keyboard

- Purpose: secondary but discoverable
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 950. Acceptance Record — Listing Detail / safety / idle

- Purpose: concise caution
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 951. Acceptance Record — Listing Detail / safety / hover

- Purpose: concise caution
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 952. Acceptance Record — Listing Detail / safety / focus-visible

- Purpose: concise caution
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 953. Acceptance Record — Listing Detail / safety / pressed

- Purpose: concise caution
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 954. Acceptance Record — Listing Detail / safety / disabled

- Purpose: concise caution
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 955. Acceptance Record — Listing Detail / safety / loading

- Purpose: concise caution
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 956. Acceptance Record — Listing Detail / safety / success

- Purpose: concise caution
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 957. Acceptance Record — Listing Detail / safety / error

- Purpose: concise caution
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 958. Acceptance Record — Listing Detail / safety / empty

- Purpose: concise caution
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 959. Acceptance Record — Listing Detail / safety / unauthorized

- Purpose: concise caution
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 960. Acceptance Record — Listing Detail / safety / forbidden

- Purpose: concise caution
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 961. Acceptance Record — Listing Detail / safety / not-found

- Purpose: concise caution
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 962. Acceptance Record — Listing Detail / safety / conflict

- Purpose: concise caution
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 963. Acceptance Record — Listing Detail / safety / offline

- Purpose: concise caution
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 964. Acceptance Record — Listing Detail / safety / slow-network

- Purpose: concise caution
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 965. Acceptance Record — Listing Detail / safety / long-content

- Purpose: concise caution
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 966. Acceptance Record — Listing Detail / safety / mixed-rtl

- Purpose: concise caution
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 967. Acceptance Record — Listing Detail / safety / no-image

- Purpose: concise caution
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 968. Acceptance Record — Listing Detail / safety / image-error

- Purpose: concise caution
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 969. Acceptance Record — Listing Detail / safety / reduced-motion

- Purpose: concise caution
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 970. Acceptance Record — Listing Detail / safety / keyboard

- Purpose: concise caution
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 971. Acceptance Record — Listing Detail / related / idle

- Purpose: only when useful data exists
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 972. Acceptance Record — Listing Detail / related / hover

- Purpose: only when useful data exists
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 973. Acceptance Record — Listing Detail / related / focus-visible

- Purpose: only when useful data exists
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 974. Acceptance Record — Listing Detail / related / pressed

- Purpose: only when useful data exists
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 975. Acceptance Record — Listing Detail / related / disabled

- Purpose: only when useful data exists
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 976. Acceptance Record — Listing Detail / related / loading

- Purpose: only when useful data exists
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 977. Acceptance Record — Listing Detail / related / success

- Purpose: only when useful data exists
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 978. Acceptance Record — Listing Detail / related / error

- Purpose: only when useful data exists
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 979. Acceptance Record — Listing Detail / related / empty

- Purpose: only when useful data exists
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 980. Acceptance Record — Listing Detail / related / unauthorized

- Purpose: only when useful data exists
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 981. Acceptance Record — Listing Detail / related / forbidden

- Purpose: only when useful data exists
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 982. Acceptance Record — Listing Detail / related / not-found

- Purpose: only when useful data exists
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 983. Acceptance Record — Listing Detail / related / conflict

- Purpose: only when useful data exists
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 984. Acceptance Record — Listing Detail / related / offline

- Purpose: only when useful data exists
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 985. Acceptance Record — Listing Detail / related / slow-network

- Purpose: only when useful data exists
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 986. Acceptance Record — Listing Detail / related / long-content

- Purpose: only when useful data exists
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 987. Acceptance Record — Listing Detail / related / mixed-rtl

- Purpose: only when useful data exists
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 988. Acceptance Record — Listing Detail / related / no-image

- Purpose: only when useful data exists
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 989. Acceptance Record — Listing Detail / related / image-error

- Purpose: only when useful data exists
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 990. Acceptance Record — Listing Detail / related / reduced-motion

- Purpose: only when useful data exists
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 991. Acceptance Record — Listing Detail / related / keyboard

- Purpose: only when useful data exists
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 992. Acceptance Record — Seller Profile / summary / idle

- Purpose: public seller identity
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 993. Acceptance Record — Seller Profile / summary / hover

- Purpose: public seller identity
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 994. Acceptance Record — Seller Profile / summary / focus-visible

- Purpose: public seller identity
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 995. Acceptance Record — Seller Profile / summary / pressed

- Purpose: public seller identity
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 996. Acceptance Record — Seller Profile / summary / disabled

- Purpose: public seller identity
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 997. Acceptance Record — Seller Profile / summary / loading

- Purpose: public seller identity
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 998. Acceptance Record — Seller Profile / summary / success

- Purpose: public seller identity
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 999. Acceptance Record — Seller Profile / summary / error

- Purpose: public seller identity
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1000. Acceptance Record — Seller Profile / summary / empty

- Purpose: public seller identity
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1001. Acceptance Record — Seller Profile / summary / unauthorized

- Purpose: public seller identity
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1002. Acceptance Record — Seller Profile / summary / forbidden

- Purpose: public seller identity
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1003. Acceptance Record — Seller Profile / summary / not-found

- Purpose: public seller identity
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1004. Acceptance Record — Seller Profile / summary / conflict

- Purpose: public seller identity
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1005. Acceptance Record — Seller Profile / summary / offline

- Purpose: public seller identity
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1006. Acceptance Record — Seller Profile / summary / slow-network

- Purpose: public seller identity
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1007. Acceptance Record — Seller Profile / summary / long-content

- Purpose: public seller identity
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1008. Acceptance Record — Seller Profile / summary / mixed-rtl

- Purpose: public seller identity
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1009. Acceptance Record — Seller Profile / summary / no-image

- Purpose: public seller identity
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1010. Acceptance Record — Seller Profile / summary / image-error

- Purpose: public seller identity
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1011. Acceptance Record — Seller Profile / summary / reduced-motion

- Purpose: public seller identity
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1012. Acceptance Record — Seller Profile / summary / keyboard

- Purpose: public seller identity
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1013. Acceptance Record — Seller Profile / listings / idle

- Purpose: active public listings only
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1014. Acceptance Record — Seller Profile / listings / hover

- Purpose: active public listings only
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1015. Acceptance Record — Seller Profile / listings / focus-visible

- Purpose: active public listings only
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1016. Acceptance Record — Seller Profile / listings / pressed

- Purpose: active public listings only
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1017. Acceptance Record — Seller Profile / listings / disabled

- Purpose: active public listings only
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1018. Acceptance Record — Seller Profile / listings / loading

- Purpose: active public listings only
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1019. Acceptance Record — Seller Profile / listings / success

- Purpose: active public listings only
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1020. Acceptance Record — Seller Profile / listings / error

- Purpose: active public listings only
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1021. Acceptance Record — Seller Profile / listings / empty

- Purpose: active public listings only
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1022. Acceptance Record — Seller Profile / listings / unauthorized

- Purpose: active public listings only
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1023. Acceptance Record — Seller Profile / listings / forbidden

- Purpose: active public listings only
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1024. Acceptance Record — Seller Profile / listings / not-found

- Purpose: active public listings only
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1025. Acceptance Record — Seller Profile / listings / conflict

- Purpose: active public listings only
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1026. Acceptance Record — Seller Profile / listings / offline

- Purpose: active public listings only
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1027. Acceptance Record — Seller Profile / listings / slow-network

- Purpose: active public listings only
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1028. Acceptance Record — Seller Profile / listings / long-content

- Purpose: active public listings only
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1029. Acceptance Record — Seller Profile / listings / mixed-rtl

- Purpose: active public listings only
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1030. Acceptance Record — Seller Profile / listings / no-image

- Purpose: active public listings only
- State: no-image
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1031. Acceptance Record — Seller Profile / listings / image-error

- Purpose: active public listings only
- State: image-error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1032. Acceptance Record — Seller Profile / listings / reduced-motion

- Purpose: active public listings only
- State: reduced-motion
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1033. Acceptance Record — Seller Profile / listings / keyboard

- Purpose: active public listings only
- State: keyboard
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1034. Acceptance Record — Seller Profile / empty / idle

- Purpose: clear explanation
- State: idle
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1035. Acceptance Record — Seller Profile / empty / hover

- Purpose: clear explanation
- State: hover
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1036. Acceptance Record — Seller Profile / empty / focus-visible

- Purpose: clear explanation
- State: focus-visible
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1037. Acceptance Record — Seller Profile / empty / pressed

- Purpose: clear explanation
- State: pressed
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1038. Acceptance Record — Seller Profile / empty / disabled

- Purpose: clear explanation
- State: disabled
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1039. Acceptance Record — Seller Profile / empty / loading

- Purpose: clear explanation
- State: loading
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1040. Acceptance Record — Seller Profile / empty / success

- Purpose: clear explanation
- State: success
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1041. Acceptance Record — Seller Profile / empty / error

- Purpose: clear explanation
- State: error
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1042. Acceptance Record — Seller Profile / empty / empty

- Purpose: clear explanation
- State: empty
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1043. Acceptance Record — Seller Profile / empty / unauthorized

- Purpose: clear explanation
- State: unauthorized
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1044. Acceptance Record — Seller Profile / empty / forbidden

- Purpose: clear explanation
- State: forbidden
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1045. Acceptance Record — Seller Profile / empty / not-found

- Purpose: clear explanation
- State: not-found
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1046. Acceptance Record — Seller Profile / empty / conflict

- Purpose: clear explanation
- State: conflict
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1047. Acceptance Record — Seller Profile / empty / offline

- Purpose: clear explanation
- State: offline
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1048. Acceptance Record — Seller Profile / empty / slow-network

- Purpose: clear explanation
- State: slow-network
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1049. Acceptance Record — Seller Profile / empty / long-content

- Purpose: clear explanation
- State: long-content
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1050. Acceptance Record — Seller Profile / empty / mixed-rtl

- Purpose: clear explanation
- State: mixed-rtl
Required acceptance:
- The semantic hierarchy remains understandable.
- Persian copy stays concise and natural.
- RTL flow uses logical start/end semantics.
- The primary action remains reachable at 390px.
- No essential behavior depends on hover.
- Focus-visible styling remains clear.
- Loading does not cause avoidable layout collapse.
- Error state uses stable API error-code mapping where applicable.
- User-entered safe state is preserved during retry/recovery.
- No secrets or private data enter logs or analytics.
- Media reserves geometry when present.
- The same semantic behavior remains valid at desktop widths.
- Test the state in a real browser, not only a static render.

# 1051. Component Acceptance — SearchBar / query editing / idle

- Detail: typing, clear, submit
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1052. Component Acceptance — SearchBar / query editing / hover

- Detail: typing, clear, submit
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1053. Component Acceptance — SearchBar / query editing / focus-visible

- Detail: typing, clear, submit
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1054. Component Acceptance — SearchBar / query editing / pressed

- Detail: typing, clear, submit
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1055. Component Acceptance — SearchBar / query editing / disabled

- Detail: typing, clear, submit
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1056. Component Acceptance — SearchBar / query editing / loading

- Detail: typing, clear, submit
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1057. Component Acceptance — SearchBar / query editing / success

- Detail: typing, clear, submit
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1058. Component Acceptance — SearchBar / query editing / error

- Detail: typing, clear, submit
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1059. Component Acceptance — SearchBar / query editing / empty

- Detail: typing, clear, submit
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1060. Component Acceptance — SearchBar / query editing / unauthorized

- Detail: typing, clear, submit
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1061. Component Acceptance — SearchBar / query editing / forbidden

- Detail: typing, clear, submit
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1062. Component Acceptance — SearchBar / query editing / not-found

- Detail: typing, clear, submit
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1063. Component Acceptance — SearchBar / query editing / conflict

- Detail: typing, clear, submit
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1064. Component Acceptance — SearchBar / query editing / offline

- Detail: typing, clear, submit
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1065. Component Acceptance — SearchBar / query editing / slow-network

- Detail: typing, clear, submit
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1066. Component Acceptance — SearchBar / query editing / long-content

- Detail: typing, clear, submit
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1067. Component Acceptance — SearchBar / query editing / mixed-rtl

- Detail: typing, clear, submit
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1068. Component Acceptance — SearchBar / query editing / no-image

- Detail: typing, clear, submit
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1069. Component Acceptance — SearchBar / query editing / image-error

- Detail: typing, clear, submit
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1070. Component Acceptance — SearchBar / query editing / reduced-motion

- Detail: typing, clear, submit
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1071. Component Acceptance — SearchBar / query editing / keyboard

- Detail: typing, clear, submit
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1072. Component Acceptance — LocationPicker / province-to-city / idle

- Detail: hierarchical selection
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1073. Component Acceptance — LocationPicker / province-to-city / hover

- Detail: hierarchical selection
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1074. Component Acceptance — LocationPicker / province-to-city / focus-visible

- Detail: hierarchical selection
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1075. Component Acceptance — LocationPicker / province-to-city / pressed

- Detail: hierarchical selection
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1076. Component Acceptance — LocationPicker / province-to-city / disabled

- Detail: hierarchical selection
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1077. Component Acceptance — LocationPicker / province-to-city / loading

- Detail: hierarchical selection
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1078. Component Acceptance — LocationPicker / province-to-city / success

- Detail: hierarchical selection
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1079. Component Acceptance — LocationPicker / province-to-city / error

- Detail: hierarchical selection
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1080. Component Acceptance — LocationPicker / province-to-city / empty

- Detail: hierarchical selection
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1081. Component Acceptance — LocationPicker / province-to-city / unauthorized

- Detail: hierarchical selection
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1082. Component Acceptance — LocationPicker / province-to-city / forbidden

- Detail: hierarchical selection
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1083. Component Acceptance — LocationPicker / province-to-city / not-found

- Detail: hierarchical selection
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1084. Component Acceptance — LocationPicker / province-to-city / conflict

- Detail: hierarchical selection
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1085. Component Acceptance — LocationPicker / province-to-city / offline

- Detail: hierarchical selection
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1086. Component Acceptance — LocationPicker / province-to-city / slow-network

- Detail: hierarchical selection
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1087. Component Acceptance — LocationPicker / province-to-city / long-content

- Detail: hierarchical selection
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1088. Component Acceptance — LocationPicker / province-to-city / mixed-rtl

- Detail: hierarchical selection
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1089. Component Acceptance — LocationPicker / province-to-city / no-image

- Detail: hierarchical selection
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1090. Component Acceptance — LocationPicker / province-to-city / image-error

- Detail: hierarchical selection
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1091. Component Acceptance — LocationPicker / province-to-city / reduced-motion

- Detail: hierarchical selection
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1092. Component Acceptance — LocationPicker / province-to-city / keyboard

- Detail: hierarchical selection
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1093. Component Acceptance — ListingCard / navigation / idle

- Detail: card vs favorite event
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1094. Component Acceptance — ListingCard / navigation / hover

- Detail: card vs favorite event
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1095. Component Acceptance — ListingCard / navigation / focus-visible

- Detail: card vs favorite event
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1096. Component Acceptance — ListingCard / navigation / pressed

- Detail: card vs favorite event
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1097. Component Acceptance — ListingCard / navigation / disabled

- Detail: card vs favorite event
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1098. Component Acceptance — ListingCard / navigation / loading

- Detail: card vs favorite event
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1099. Component Acceptance — ListingCard / navigation / success

- Detail: card vs favorite event
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1100. Component Acceptance — ListingCard / navigation / error

- Detail: card vs favorite event
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1101. Component Acceptance — ListingCard / navigation / empty

- Detail: card vs favorite event
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1102. Component Acceptance — ListingCard / navigation / unauthorized

- Detail: card vs favorite event
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1103. Component Acceptance — ListingCard / navigation / forbidden

- Detail: card vs favorite event
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1104. Component Acceptance — ListingCard / navigation / not-found

- Detail: card vs favorite event
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1105. Component Acceptance — ListingCard / navigation / conflict

- Detail: card vs favorite event
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1106. Component Acceptance — ListingCard / navigation / offline

- Detail: card vs favorite event
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1107. Component Acceptance — ListingCard / navigation / slow-network

- Detail: card vs favorite event
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1108. Component Acceptance — ListingCard / navigation / long-content

- Detail: card vs favorite event
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1109. Component Acceptance — ListingCard / navigation / mixed-rtl

- Detail: card vs favorite event
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1110. Component Acceptance — ListingCard / navigation / no-image

- Detail: card vs favorite event
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1111. Component Acceptance — ListingCard / navigation / image-error

- Detail: card vs favorite event
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1112. Component Acceptance — ListingCard / navigation / reduced-motion

- Detail: card vs favorite event
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1113. Component Acceptance — ListingCard / navigation / keyboard

- Detail: card vs favorite event
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1114. Component Acceptance — FavoriteButton / mutation / idle

- Detail: optimistic or pending-safe
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1115. Component Acceptance — FavoriteButton / mutation / hover

- Detail: optimistic or pending-safe
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1116. Component Acceptance — FavoriteButton / mutation / focus-visible

- Detail: optimistic or pending-safe
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1117. Component Acceptance — FavoriteButton / mutation / pressed

- Detail: optimistic or pending-safe
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1118. Component Acceptance — FavoriteButton / mutation / disabled

- Detail: optimistic or pending-safe
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1119. Component Acceptance — FavoriteButton / mutation / loading

- Detail: optimistic or pending-safe
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1120. Component Acceptance — FavoriteButton / mutation / success

- Detail: optimistic or pending-safe
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1121. Component Acceptance — FavoriteButton / mutation / error

- Detail: optimistic or pending-safe
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1122. Component Acceptance — FavoriteButton / mutation / empty

- Detail: optimistic or pending-safe
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1123. Component Acceptance — FavoriteButton / mutation / unauthorized

- Detail: optimistic or pending-safe
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1124. Component Acceptance — FavoriteButton / mutation / forbidden

- Detail: optimistic or pending-safe
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1125. Component Acceptance — FavoriteButton / mutation / not-found

- Detail: optimistic or pending-safe
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1126. Component Acceptance — FavoriteButton / mutation / conflict

- Detail: optimistic or pending-safe
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1127. Component Acceptance — FavoriteButton / mutation / offline

- Detail: optimistic or pending-safe
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1128. Component Acceptance — FavoriteButton / mutation / slow-network

- Detail: optimistic or pending-safe
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1129. Component Acceptance — FavoriteButton / mutation / long-content

- Detail: optimistic or pending-safe
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1130. Component Acceptance — FavoriteButton / mutation / mixed-rtl

- Detail: optimistic or pending-safe
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1131. Component Acceptance — FavoriteButton / mutation / no-image

- Detail: optimistic or pending-safe
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1132. Component Acceptance — FavoriteButton / mutation / image-error

- Detail: optimistic or pending-safe
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1133. Component Acceptance — FavoriteButton / mutation / reduced-motion

- Detail: optimistic or pending-safe
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1134. Component Acceptance — FavoriteButton / mutation / keyboard

- Detail: optimistic or pending-safe
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1135. Component Acceptance — ContactActions / method / idle

- Detail: phone/WhatsApp/Telegram
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1136. Component Acceptance — ContactActions / method / hover

- Detail: phone/WhatsApp/Telegram
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1137. Component Acceptance — ContactActions / method / focus-visible

- Detail: phone/WhatsApp/Telegram
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1138. Component Acceptance — ContactActions / method / pressed

- Detail: phone/WhatsApp/Telegram
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1139. Component Acceptance — ContactActions / method / disabled

- Detail: phone/WhatsApp/Telegram
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1140. Component Acceptance — ContactActions / method / loading

- Detail: phone/WhatsApp/Telegram
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1141. Component Acceptance — ContactActions / method / success

- Detail: phone/WhatsApp/Telegram
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1142. Component Acceptance — ContactActions / method / error

- Detail: phone/WhatsApp/Telegram
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1143. Component Acceptance — ContactActions / method / empty

- Detail: phone/WhatsApp/Telegram
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1144. Component Acceptance — ContactActions / method / unauthorized

- Detail: phone/WhatsApp/Telegram
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1145. Component Acceptance — ContactActions / method / forbidden

- Detail: phone/WhatsApp/Telegram
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1146. Component Acceptance — ContactActions / method / not-found

- Detail: phone/WhatsApp/Telegram
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1147. Component Acceptance — ContactActions / method / conflict

- Detail: phone/WhatsApp/Telegram
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1148. Component Acceptance — ContactActions / method / offline

- Detail: phone/WhatsApp/Telegram
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1149. Component Acceptance — ContactActions / method / slow-network

- Detail: phone/WhatsApp/Telegram
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1150. Component Acceptance — ContactActions / method / long-content

- Detail: phone/WhatsApp/Telegram
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1151. Component Acceptance — ContactActions / method / mixed-rtl

- Detail: phone/WhatsApp/Telegram
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1152. Component Acceptance — ContactActions / method / no-image

- Detail: phone/WhatsApp/Telegram
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1153. Component Acceptance — ContactActions / method / image-error

- Detail: phone/WhatsApp/Telegram
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1154. Component Acceptance — ContactActions / method / reduced-motion

- Detail: phone/WhatsApp/Telegram
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1155. Component Acceptance — ContactActions / method / keyboard

- Detail: phone/WhatsApp/Telegram
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1156. Component Acceptance — ImageGallery / selection / idle

- Detail: thumbnail/swipe
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1157. Component Acceptance — ImageGallery / selection / hover

- Detail: thumbnail/swipe
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1158. Component Acceptance — ImageGallery / selection / focus-visible

- Detail: thumbnail/swipe
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1159. Component Acceptance — ImageGallery / selection / pressed

- Detail: thumbnail/swipe
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1160. Component Acceptance — ImageGallery / selection / disabled

- Detail: thumbnail/swipe
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1161. Component Acceptance — ImageGallery / selection / loading

- Detail: thumbnail/swipe
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1162. Component Acceptance — ImageGallery / selection / success

- Detail: thumbnail/swipe
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1163. Component Acceptance — ImageGallery / selection / error

- Detail: thumbnail/swipe
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1164. Component Acceptance — ImageGallery / selection / empty

- Detail: thumbnail/swipe
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1165. Component Acceptance — ImageGallery / selection / unauthorized

- Detail: thumbnail/swipe
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1166. Component Acceptance — ImageGallery / selection / forbidden

- Detail: thumbnail/swipe
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1167. Component Acceptance — ImageGallery / selection / not-found

- Detail: thumbnail/swipe
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1168. Component Acceptance — ImageGallery / selection / conflict

- Detail: thumbnail/swipe
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1169. Component Acceptance — ImageGallery / selection / offline

- Detail: thumbnail/swipe
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1170. Component Acceptance — ImageGallery / selection / slow-network

- Detail: thumbnail/swipe
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1171. Component Acceptance — ImageGallery / selection / long-content

- Detail: thumbnail/swipe
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1172. Component Acceptance — ImageGallery / selection / mixed-rtl

- Detail: thumbnail/swipe
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1173. Component Acceptance — ImageGallery / selection / no-image

- Detail: thumbnail/swipe
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1174. Component Acceptance — ImageGallery / selection / image-error

- Detail: thumbnail/swipe
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1175. Component Acceptance — ImageGallery / selection / reduced-motion

- Detail: thumbnail/swipe
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1176. Component Acceptance — ImageGallery / selection / keyboard

- Detail: thumbnail/swipe
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1177. Component Acceptance — ImageUploader / upload / idle

- Detail: validation/progress/retry
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1178. Component Acceptance — ImageUploader / upload / hover

- Detail: validation/progress/retry
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1179. Component Acceptance — ImageUploader / upload / focus-visible

- Detail: validation/progress/retry
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1180. Component Acceptance — ImageUploader / upload / pressed

- Detail: validation/progress/retry
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1181. Component Acceptance — ImageUploader / upload / disabled

- Detail: validation/progress/retry
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1182. Component Acceptance — ImageUploader / upload / loading

- Detail: validation/progress/retry
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1183. Component Acceptance — ImageUploader / upload / success

- Detail: validation/progress/retry
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1184. Component Acceptance — ImageUploader / upload / error

- Detail: validation/progress/retry
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1185. Component Acceptance — ImageUploader / upload / empty

- Detail: validation/progress/retry
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1186. Component Acceptance — ImageUploader / upload / unauthorized

- Detail: validation/progress/retry
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1187. Component Acceptance — ImageUploader / upload / forbidden

- Detail: validation/progress/retry
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1188. Component Acceptance — ImageUploader / upload / not-found

- Detail: validation/progress/retry
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1189. Component Acceptance — ImageUploader / upload / conflict

- Detail: validation/progress/retry
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1190. Component Acceptance — ImageUploader / upload / offline

- Detail: validation/progress/retry
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1191. Component Acceptance — ImageUploader / upload / slow-network

- Detail: validation/progress/retry
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1192. Component Acceptance — ImageUploader / upload / long-content

- Detail: validation/progress/retry
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1193. Component Acceptance — ImageUploader / upload / mixed-rtl

- Detail: validation/progress/retry
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1194. Component Acceptance — ImageUploader / upload / no-image

- Detail: validation/progress/retry
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1195. Component Acceptance — ImageUploader / upload / image-error

- Detail: validation/progress/retry
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1196. Component Acceptance — ImageUploader / upload / reduced-motion

- Detail: validation/progress/retry
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1197. Component Acceptance — ImageUploader / upload / keyboard

- Detail: validation/progress/retry
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1198. Component Acceptance — PriceInput / formatting / idle

- Detail: AFN integer handling
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1199. Component Acceptance — PriceInput / formatting / hover

- Detail: AFN integer handling
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1200. Component Acceptance — PriceInput / formatting / focus-visible

- Detail: AFN integer handling
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1201. Component Acceptance — PriceInput / formatting / pressed

- Detail: AFN integer handling
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1202. Component Acceptance — PriceInput / formatting / disabled

- Detail: AFN integer handling
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1203. Component Acceptance — PriceInput / formatting / loading

- Detail: AFN integer handling
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1204. Component Acceptance — PriceInput / formatting / success

- Detail: AFN integer handling
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1205. Component Acceptance — PriceInput / formatting / error

- Detail: AFN integer handling
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1206. Component Acceptance — PriceInput / formatting / empty

- Detail: AFN integer handling
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1207. Component Acceptance — PriceInput / formatting / unauthorized

- Detail: AFN integer handling
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1208. Component Acceptance — PriceInput / formatting / forbidden

- Detail: AFN integer handling
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1209. Component Acceptance — PriceInput / formatting / not-found

- Detail: AFN integer handling
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1210. Component Acceptance — PriceInput / formatting / conflict

- Detail: AFN integer handling
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1211. Component Acceptance — PriceInput / formatting / offline

- Detail: AFN integer handling
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1212. Component Acceptance — PriceInput / formatting / slow-network

- Detail: AFN integer handling
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1213. Component Acceptance — PriceInput / formatting / long-content

- Detail: AFN integer handling
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1214. Component Acceptance — PriceInput / formatting / mixed-rtl

- Detail: AFN integer handling
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1215. Component Acceptance — PriceInput / formatting / no-image

- Detail: AFN integer handling
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1216. Component Acceptance — PriceInput / formatting / image-error

- Detail: AFN integer handling
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1217. Component Acceptance — PriceInput / formatting / reduced-motion

- Detail: AFN integer handling
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1218. Component Acceptance — PriceInput / formatting / keyboard

- Detail: AFN integer handling
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1219. Component Acceptance — OtpInput / verification / idle

- Detail: paste/resend
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1220. Component Acceptance — OtpInput / verification / hover

- Detail: paste/resend
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1221. Component Acceptance — OtpInput / verification / focus-visible

- Detail: paste/resend
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1222. Component Acceptance — OtpInput / verification / pressed

- Detail: paste/resend
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1223. Component Acceptance — OtpInput / verification / disabled

- Detail: paste/resend
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1224. Component Acceptance — OtpInput / verification / loading

- Detail: paste/resend
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1225. Component Acceptance — OtpInput / verification / success

- Detail: paste/resend
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1226. Component Acceptance — OtpInput / verification / error

- Detail: paste/resend
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1227. Component Acceptance — OtpInput / verification / empty

- Detail: paste/resend
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1228. Component Acceptance — OtpInput / verification / unauthorized

- Detail: paste/resend
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1229. Component Acceptance — OtpInput / verification / forbidden

- Detail: paste/resend
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1230. Component Acceptance — OtpInput / verification / not-found

- Detail: paste/resend
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1231. Component Acceptance — OtpInput / verification / conflict

- Detail: paste/resend
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1232. Component Acceptance — OtpInput / verification / offline

- Detail: paste/resend
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1233. Component Acceptance — OtpInput / verification / slow-network

- Detail: paste/resend
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1234. Component Acceptance — OtpInput / verification / long-content

- Detail: paste/resend
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1235. Component Acceptance — OtpInput / verification / mixed-rtl

- Detail: paste/resend
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1236. Component Acceptance — OtpInput / verification / no-image

- Detail: paste/resend
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1237. Component Acceptance — OtpInput / verification / image-error

- Detail: paste/resend
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1238. Component Acceptance — OtpInput / verification / reduced-motion

- Detail: paste/resend
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1239. Component Acceptance — OtpInput / verification / keyboard

- Detail: paste/resend
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1240. Component Acceptance — DynamicFieldRenderer / schema / idle

- Detail: type mapping
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1241. Component Acceptance — DynamicFieldRenderer / schema / hover

- Detail: type mapping
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1242. Component Acceptance — DynamicFieldRenderer / schema / focus-visible

- Detail: type mapping
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1243. Component Acceptance — DynamicFieldRenderer / schema / pressed

- Detail: type mapping
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1244. Component Acceptance — DynamicFieldRenderer / schema / disabled

- Detail: type mapping
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1245. Component Acceptance — DynamicFieldRenderer / schema / loading

- Detail: type mapping
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1246. Component Acceptance — DynamicFieldRenderer / schema / success

- Detail: type mapping
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1247. Component Acceptance — DynamicFieldRenderer / schema / error

- Detail: type mapping
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1248. Component Acceptance — DynamicFieldRenderer / schema / empty

- Detail: type mapping
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1249. Component Acceptance — DynamicFieldRenderer / schema / unauthorized

- Detail: type mapping
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1250. Component Acceptance — DynamicFieldRenderer / schema / forbidden

- Detail: type mapping
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1251. Component Acceptance — DynamicFieldRenderer / schema / not-found

- Detail: type mapping
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1252. Component Acceptance — DynamicFieldRenderer / schema / conflict

- Detail: type mapping
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1253. Component Acceptance — DynamicFieldRenderer / schema / offline

- Detail: type mapping
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1254. Component Acceptance — DynamicFieldRenderer / schema / slow-network

- Detail: type mapping
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1255. Component Acceptance — DynamicFieldRenderer / schema / long-content

- Detail: type mapping
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1256. Component Acceptance — DynamicFieldRenderer / schema / mixed-rtl

- Detail: type mapping
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1257. Component Acceptance — DynamicFieldRenderer / schema / no-image

- Detail: type mapping
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1258. Component Acceptance — DynamicFieldRenderer / schema / image-error

- Detail: type mapping
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1259. Component Acceptance — DynamicFieldRenderer / schema / reduced-motion

- Detail: type mapping
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1260. Component Acceptance — DynamicFieldRenderer / schema / keyboard

- Detail: type mapping
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1261. Component Acceptance — FilterSheetMobile / apply / idle

- Detail: draft vs applied state
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1262. Component Acceptance — FilterSheetMobile / apply / hover

- Detail: draft vs applied state
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1263. Component Acceptance — FilterSheetMobile / apply / focus-visible

- Detail: draft vs applied state
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1264. Component Acceptance — FilterSheetMobile / apply / pressed

- Detail: draft vs applied state
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1265. Component Acceptance — FilterSheetMobile / apply / disabled

- Detail: draft vs applied state
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1266. Component Acceptance — FilterSheetMobile / apply / loading

- Detail: draft vs applied state
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1267. Component Acceptance — FilterSheetMobile / apply / success

- Detail: draft vs applied state
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1268. Component Acceptance — FilterSheetMobile / apply / error

- Detail: draft vs applied state
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1269. Component Acceptance — FilterSheetMobile / apply / empty

- Detail: draft vs applied state
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1270. Component Acceptance — FilterSheetMobile / apply / unauthorized

- Detail: draft vs applied state
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1271. Component Acceptance — FilterSheetMobile / apply / forbidden

- Detail: draft vs applied state
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1272. Component Acceptance — FilterSheetMobile / apply / not-found

- Detail: draft vs applied state
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1273. Component Acceptance — FilterSheetMobile / apply / conflict

- Detail: draft vs applied state
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1274. Component Acceptance — FilterSheetMobile / apply / offline

- Detail: draft vs applied state
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1275. Component Acceptance — FilterSheetMobile / apply / slow-network

- Detail: draft vs applied state
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1276. Component Acceptance — FilterSheetMobile / apply / long-content

- Detail: draft vs applied state
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1277. Component Acceptance — FilterSheetMobile / apply / mixed-rtl

- Detail: draft vs applied state
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1278. Component Acceptance — FilterSheetMobile / apply / no-image

- Detail: draft vs applied state
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1279. Component Acceptance — FilterSheetMobile / apply / image-error

- Detail: draft vs applied state
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1280. Component Acceptance — FilterSheetMobile / apply / reduced-motion

- Detail: draft vs applied state
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1281. Component Acceptance — FilterSheetMobile / apply / keyboard

- Detail: draft vs applied state
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1282. Component Acceptance — ReportDialog / submit / idle

- Detail: reason validation
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1283. Component Acceptance — ReportDialog / submit / hover

- Detail: reason validation
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1284. Component Acceptance — ReportDialog / submit / focus-visible

- Detail: reason validation
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1285. Component Acceptance — ReportDialog / submit / pressed

- Detail: reason validation
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1286. Component Acceptance — ReportDialog / submit / disabled

- Detail: reason validation
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1287. Component Acceptance — ReportDialog / submit / loading

- Detail: reason validation
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1288. Component Acceptance — ReportDialog / submit / success

- Detail: reason validation
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1289. Component Acceptance — ReportDialog / submit / error

- Detail: reason validation
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1290. Component Acceptance — ReportDialog / submit / empty

- Detail: reason validation
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1291. Component Acceptance — ReportDialog / submit / unauthorized

- Detail: reason validation
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1292. Component Acceptance — ReportDialog / submit / forbidden

- Detail: reason validation
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1293. Component Acceptance — ReportDialog / submit / not-found

- Detail: reason validation
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1294. Component Acceptance — ReportDialog / submit / conflict

- Detail: reason validation
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1295. Component Acceptance — ReportDialog / submit / offline

- Detail: reason validation
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1296. Component Acceptance — ReportDialog / submit / slow-network

- Detail: reason validation
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1297. Component Acceptance — ReportDialog / submit / long-content

- Detail: reason validation
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1298. Component Acceptance — ReportDialog / submit / mixed-rtl

- Detail: reason validation
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1299. Component Acceptance — ReportDialog / submit / no-image

- Detail: reason validation
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1300. Component Acceptance — ReportDialog / submit / image-error

- Detail: reason validation
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1301. Component Acceptance — ReportDialog / submit / reduced-motion

- Detail: reason validation
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1302. Component Acceptance — ReportDialog / submit / keyboard

- Detail: reason validation
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1303. Component Acceptance — SellerCard / context / idle

- Detail: public seller info
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1304. Component Acceptance — SellerCard / context / hover

- Detail: public seller info
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1305. Component Acceptance — SellerCard / context / focus-visible

- Detail: public seller info
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1306. Component Acceptance — SellerCard / context / pressed

- Detail: public seller info
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1307. Component Acceptance — SellerCard / context / disabled

- Detail: public seller info
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1308. Component Acceptance — SellerCard / context / loading

- Detail: public seller info
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1309. Component Acceptance — SellerCard / context / success

- Detail: public seller info
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1310. Component Acceptance — SellerCard / context / error

- Detail: public seller info
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1311. Component Acceptance — SellerCard / context / empty

- Detail: public seller info
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1312. Component Acceptance — SellerCard / context / unauthorized

- Detail: public seller info
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1313. Component Acceptance — SellerCard / context / forbidden

- Detail: public seller info
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1314. Component Acceptance — SellerCard / context / not-found

- Detail: public seller info
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1315. Component Acceptance — SellerCard / context / conflict

- Detail: public seller info
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1316. Component Acceptance — SellerCard / context / offline

- Detail: public seller info
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1317. Component Acceptance — SellerCard / context / slow-network

- Detail: public seller info
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1318. Component Acceptance — SellerCard / context / long-content

- Detail: public seller info
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1319. Component Acceptance — SellerCard / context / mixed-rtl

- Detail: public seller info
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1320. Component Acceptance — SellerCard / context / no-image

- Detail: public seller info
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1321. Component Acceptance — SellerCard / context / image-error

- Detail: public seller info
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1322. Component Acceptance — SellerCard / context / reduced-motion

- Detail: public seller info
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1323. Component Acceptance — SellerCard / context / keyboard

- Detail: public seller info
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1324. Component Acceptance — MyListings / status / idle

- Detail: owner-visible states
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1325. Component Acceptance — MyListings / status / hover

- Detail: owner-visible states
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1326. Component Acceptance — MyListings / status / focus-visible

- Detail: owner-visible states
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1327. Component Acceptance — MyListings / status / pressed

- Detail: owner-visible states
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1328. Component Acceptance — MyListings / status / disabled

- Detail: owner-visible states
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1329. Component Acceptance — MyListings / status / loading

- Detail: owner-visible states
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1330. Component Acceptance — MyListings / status / success

- Detail: owner-visible states
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1331. Component Acceptance — MyListings / status / error

- Detail: owner-visible states
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1332. Component Acceptance — MyListings / status / empty

- Detail: owner-visible states
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1333. Component Acceptance — MyListings / status / unauthorized

- Detail: owner-visible states
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1334. Component Acceptance — MyListings / status / forbidden

- Detail: owner-visible states
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1335. Component Acceptance — MyListings / status / not-found

- Detail: owner-visible states
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1336. Component Acceptance — MyListings / status / conflict

- Detail: owner-visible states
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1337. Component Acceptance — MyListings / status / offline

- Detail: owner-visible states
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1338. Component Acceptance — MyListings / status / slow-network

- Detail: owner-visible states
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1339. Component Acceptance — MyListings / status / long-content

- Detail: owner-visible states
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1340. Component Acceptance — MyListings / status / mixed-rtl

- Detail: owner-visible states
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1341. Component Acceptance — MyListings / status / no-image

- Detail: owner-visible states
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1342. Component Acceptance — MyListings / status / image-error

- Detail: owner-visible states
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1343. Component Acceptance — MyListings / status / reduced-motion

- Detail: owner-visible states
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1344. Component Acceptance — MyListings / status / keyboard

- Detail: owner-visible states
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1345. Component Acceptance — AdminTable / actions / idle

- Detail: permission-aware row actions
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1346. Component Acceptance — AdminTable / actions / hover

- Detail: permission-aware row actions
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1347. Component Acceptance — AdminTable / actions / focus-visible

- Detail: permission-aware row actions
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1348. Component Acceptance — AdminTable / actions / pressed

- Detail: permission-aware row actions
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1349. Component Acceptance — AdminTable / actions / disabled

- Detail: permission-aware row actions
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1350. Component Acceptance — AdminTable / actions / loading

- Detail: permission-aware row actions
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1351. Component Acceptance — AdminTable / actions / success

- Detail: permission-aware row actions
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1352. Component Acceptance — AdminTable / actions / error

- Detail: permission-aware row actions
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1353. Component Acceptance — AdminTable / actions / empty

- Detail: permission-aware row actions
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1354. Component Acceptance — AdminTable / actions / unauthorized

- Detail: permission-aware row actions
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1355. Component Acceptance — AdminTable / actions / forbidden

- Detail: permission-aware row actions
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1356. Component Acceptance — AdminTable / actions / not-found

- Detail: permission-aware row actions
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1357. Component Acceptance — AdminTable / actions / conflict

- Detail: permission-aware row actions
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1358. Component Acceptance — AdminTable / actions / offline

- Detail: permission-aware row actions
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1359. Component Acceptance — AdminTable / actions / slow-network

- Detail: permission-aware row actions
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1360. Component Acceptance — AdminTable / actions / long-content

- Detail: permission-aware row actions
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1361. Component Acceptance — AdminTable / actions / mixed-rtl

- Detail: permission-aware row actions
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1362. Component Acceptance — AdminTable / actions / no-image

- Detail: permission-aware row actions
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1363. Component Acceptance — AdminTable / actions / image-error

- Detail: permission-aware row actions
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1364. Component Acceptance — AdminTable / actions / reduced-motion

- Detail: permission-aware row actions
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1365. Component Acceptance — AdminTable / actions / keyboard

- Detail: permission-aware row actions
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1366. Component Acceptance — Dialog / focus / idle

- Detail: open/close/restoration
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1367. Component Acceptance — Dialog / focus / hover

- Detail: open/close/restoration
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1368. Component Acceptance — Dialog / focus / focus-visible

- Detail: open/close/restoration
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1369. Component Acceptance — Dialog / focus / pressed

- Detail: open/close/restoration
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1370. Component Acceptance — Dialog / focus / disabled

- Detail: open/close/restoration
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1371. Component Acceptance — Dialog / focus / loading

- Detail: open/close/restoration
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1372. Component Acceptance — Dialog / focus / success

- Detail: open/close/restoration
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1373. Component Acceptance — Dialog / focus / error

- Detail: open/close/restoration
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1374. Component Acceptance — Dialog / focus / empty

- Detail: open/close/restoration
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1375. Component Acceptance — Dialog / focus / unauthorized

- Detail: open/close/restoration
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1376. Component Acceptance — Dialog / focus / forbidden

- Detail: open/close/restoration
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1377. Component Acceptance — Dialog / focus / not-found

- Detail: open/close/restoration
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1378. Component Acceptance — Dialog / focus / conflict

- Detail: open/close/restoration
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1379. Component Acceptance — Dialog / focus / offline

- Detail: open/close/restoration
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1380. Component Acceptance — Dialog / focus / slow-network

- Detail: open/close/restoration
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1381. Component Acceptance — Dialog / focus / long-content

- Detail: open/close/restoration
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1382. Component Acceptance — Dialog / focus / mixed-rtl

- Detail: open/close/restoration
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1383. Component Acceptance — Dialog / focus / no-image

- Detail: open/close/restoration
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1384. Component Acceptance — Dialog / focus / image-error

- Detail: open/close/restoration
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1385. Component Acceptance — Dialog / focus / reduced-motion

- Detail: open/close/restoration
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1386. Component Acceptance — Dialog / focus / keyboard

- Detail: open/close/restoration
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1387. Component Acceptance — ToastRegion / announcement / idle

- Detail: non-noisy feedback
- State: idle
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1388. Component Acceptance — ToastRegion / announcement / hover

- Detail: non-noisy feedback
- State: hover
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1389. Component Acceptance — ToastRegion / announcement / focus-visible

- Detail: non-noisy feedback
- State: focus-visible
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1390. Component Acceptance — ToastRegion / announcement / pressed

- Detail: non-noisy feedback
- State: pressed
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1391. Component Acceptance — ToastRegion / announcement / disabled

- Detail: non-noisy feedback
- State: disabled
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1392. Component Acceptance — ToastRegion / announcement / loading

- Detail: non-noisy feedback
- State: loading
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1393. Component Acceptance — ToastRegion / announcement / success

- Detail: non-noisy feedback
- State: success
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1394. Component Acceptance — ToastRegion / announcement / error

- Detail: non-noisy feedback
- State: error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1395. Component Acceptance — ToastRegion / announcement / empty

- Detail: non-noisy feedback
- State: empty
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1396. Component Acceptance — ToastRegion / announcement / unauthorized

- Detail: non-noisy feedback
- State: unauthorized
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1397. Component Acceptance — ToastRegion / announcement / forbidden

- Detail: non-noisy feedback
- State: forbidden
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1398. Component Acceptance — ToastRegion / announcement / not-found

- Detail: non-noisy feedback
- State: not-found
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1399. Component Acceptance — ToastRegion / announcement / conflict

- Detail: non-noisy feedback
- State: conflict
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1400. Component Acceptance — ToastRegion / announcement / offline

- Detail: non-noisy feedback
- State: offline
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1401. Component Acceptance — ToastRegion / announcement / slow-network

- Detail: non-noisy feedback
- State: slow-network
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1402. Component Acceptance — ToastRegion / announcement / long-content

- Detail: non-noisy feedback
- State: long-content
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1403. Component Acceptance — ToastRegion / announcement / mixed-rtl

- Detail: non-noisy feedback
- State: mixed-rtl
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1404. Component Acceptance — ToastRegion / announcement / no-image

- Detail: non-noisy feedback
- State: no-image
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1405. Component Acceptance — ToastRegion / announcement / image-error

- Detail: non-noisy feedback
- State: image-error
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1406. Component Acceptance — ToastRegion / announcement / reduced-motion

- Detail: non-noisy feedback
- State: reduced-motion
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1407. Component Acceptance — ToastRegion / announcement / keyboard

- Detail: non-noisy feedback
- State: keyboard
Verify: geometry, typography, spacing, state contrast, keyboard operation, accessible name, RTL behavior, safe error handling, no duplicate request, no unintended navigation, no private data exposure, no unnecessary client hydration, and no unexplained one-off styling.

At 390×844 verify thumb reachability and keyboard overlap. At 1280×720 verify density and alignment. At 320px verify no overflow.

PASS only when behavior is covered by an appropriate test and manual visual review where appearance matters.

# 1408. Responsive Acceptance — Home at 320px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1409. Responsive Acceptance — Home at 390px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1410. Responsive Acceptance — Home at 430px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1411. Responsive Acceptance — Home at 768px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1412. Responsive Acceptance — Home at 1024px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1413. Responsive Acceptance — Home at 1280px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1414. Responsive Acceptance — Home at 1440px

- Route: /
- Purpose: Public discovery and first impression
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1415. Responsive Acceptance — Search at 320px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1416. Responsive Acceptance — Search at 390px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1417. Responsive Acceptance — Search at 430px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1418. Responsive Acceptance — Search at 768px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1419. Responsive Acceptance — Search at 1024px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1420. Responsive Acceptance — Search at 1280px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1421. Responsive Acceptance — Search at 1440px

- Route: /search
- Purpose: Keyword and filter-driven discovery
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1422. Responsive Acceptance — Category at 320px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1423. Responsive Acceptance — Category at 390px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1424. Responsive Acceptance — Category at 430px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1425. Responsive Acceptance — Category at 768px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1426. Responsive Acceptance — Category at 1024px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1427. Responsive Acceptance — Category at 1280px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1428. Responsive Acceptance — Category at 1440px

- Route: /category/[slug]
- Purpose: Category discovery with dynamic filters
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1429. Responsive Acceptance — Listing Detail at 320px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1430. Responsive Acceptance — Listing Detail at 390px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1431. Responsive Acceptance — Listing Detail at 430px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1432. Responsive Acceptance — Listing Detail at 768px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1433. Responsive Acceptance — Listing Detail at 1024px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1434. Responsive Acceptance — Listing Detail at 1280px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1435. Responsive Acceptance — Listing Detail at 1440px

- Route: /listing/[slug]
- Purpose: Product information, seller context, direct contact
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1436. Responsive Acceptance — Seller Profile at 320px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1437. Responsive Acceptance — Seller Profile at 390px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1438. Responsive Acceptance — Seller Profile at 430px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1439. Responsive Acceptance — Seller Profile at 768px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1440. Responsive Acceptance — Seller Profile at 1024px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1441. Responsive Acceptance — Seller Profile at 1280px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1442. Responsive Acceptance — Seller Profile at 1440px

- Route: /seller/[slug]
- Purpose: Public seller context and active listings
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1443. Responsive Acceptance — Login at 320px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1444. Responsive Acceptance — Login at 390px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1445. Responsive Acceptance — Login at 430px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1446. Responsive Acceptance — Login at 768px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1447. Responsive Acceptance — Login at 1024px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1448. Responsive Acceptance — Login at 1280px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1449. Responsive Acceptance — Login at 1440px

- Route: /auth/login
- Purpose: Phone/password login
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1450. Responsive Acceptance — Register at 320px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1451. Responsive Acceptance — Register at 390px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1452. Responsive Acceptance — Register at 430px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1453. Responsive Acceptance — Register at 768px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1454. Responsive Acceptance — Register at 1024px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1455. Responsive Acceptance — Register at 1280px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1456. Responsive Acceptance — Register at 1440px

- Route: /auth/register
- Purpose: Account creation
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1457. Responsive Acceptance — Verify at 320px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1458. Responsive Acceptance — Verify at 390px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1459. Responsive Acceptance — Verify at 430px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1460. Responsive Acceptance — Verify at 768px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1461. Responsive Acceptance — Verify at 1024px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1462. Responsive Acceptance — Verify at 1280px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1463. Responsive Acceptance — Verify at 1440px

- Route: /auth/verify
- Purpose: Phone verification
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1464. Responsive Acceptance — Forgot Password at 320px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1465. Responsive Acceptance — Forgot Password at 390px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1466. Responsive Acceptance — Forgot Password at 430px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1467. Responsive Acceptance — Forgot Password at 768px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1468. Responsive Acceptance — Forgot Password at 1024px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1469. Responsive Acceptance — Forgot Password at 1280px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1470. Responsive Acceptance — Forgot Password at 1440px

- Route: /auth/forgot-password
- Purpose: Password recovery start
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1471. Responsive Acceptance — Reset Password at 320px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1472. Responsive Acceptance — Reset Password at 390px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1473. Responsive Acceptance — Reset Password at 430px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1474. Responsive Acceptance — Reset Password at 768px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1475. Responsive Acceptance — Reset Password at 1024px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1476. Responsive Acceptance — Reset Password at 1280px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1477. Responsive Acceptance — Reset Password at 1440px

- Route: /auth/reset-password
- Purpose: Password reset completion
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1478. Responsive Acceptance — Favorites at 320px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1479. Responsive Acceptance — Favorites at 390px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1480. Responsive Acceptance — Favorites at 430px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1481. Responsive Acceptance — Favorites at 768px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1482. Responsive Acceptance — Favorites at 1024px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1483. Responsive Acceptance — Favorites at 1280px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1484. Responsive Acceptance — Favorites at 1440px

- Route: /favorites
- Purpose: Saved listings
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1485. Responsive Acceptance — My Listings at 320px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1486. Responsive Acceptance — My Listings at 390px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1487. Responsive Acceptance — My Listings at 430px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1488. Responsive Acceptance — My Listings at 768px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1489. Responsive Acceptance — My Listings at 1024px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1490. Responsive Acceptance — My Listings at 1280px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1491. Responsive Acceptance — My Listings at 1440px

- Route: /my-listings
- Purpose: Seller listing management
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1492. Responsive Acceptance — Account at 320px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1493. Responsive Acceptance — Account at 390px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1494. Responsive Acceptance — Account at 430px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1495. Responsive Acceptance — Account at 768px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1496. Responsive Acceptance — Account at 1024px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1497. Responsive Acceptance — Account at 1280px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1498. Responsive Acceptance — Account at 1440px

- Route: /account
- Purpose: Profile and account navigation
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1499. Responsive Acceptance — Security at 320px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1500. Responsive Acceptance — Security at 390px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1501. Responsive Acceptance — Security at 430px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1502. Responsive Acceptance — Security at 768px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1503. Responsive Acceptance — Security at 1024px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1504. Responsive Acceptance — Security at 1280px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1505. Responsive Acceptance — Security at 1440px

- Route: /account/security
- Purpose: Password, sessions, verification
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1506. Responsive Acceptance — Sell Start at 320px

- Route: /sell
- Purpose: Category selection
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1507. Responsive Acceptance — Sell Start at 390px

- Route: /sell
- Purpose: Category selection
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1508. Responsive Acceptance — Sell Start at 430px

- Route: /sell
- Purpose: Category selection
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1509. Responsive Acceptance — Sell Start at 768px

- Route: /sell
- Purpose: Category selection
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1510. Responsive Acceptance — Sell Start at 1024px

- Route: /sell
- Purpose: Category selection
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1511. Responsive Acceptance — Sell Start at 1280px

- Route: /sell
- Purpose: Category selection
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1512. Responsive Acceptance — Sell Start at 1440px

- Route: /sell
- Purpose: Category selection
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1513. Responsive Acceptance — Sell Photos at 320px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1514. Responsive Acceptance — Sell Photos at 390px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1515. Responsive Acceptance — Sell Photos at 430px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1516. Responsive Acceptance — Sell Photos at 768px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1517. Responsive Acceptance — Sell Photos at 1024px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1518. Responsive Acceptance — Sell Photos at 1280px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1519. Responsive Acceptance — Sell Photos at 1440px

- Route: /sell/photos
- Purpose: Image selection and ordering
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1520. Responsive Acceptance — Sell Basic Info at 320px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1521. Responsive Acceptance — Sell Basic Info at 390px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1522. Responsive Acceptance — Sell Basic Info at 430px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1523. Responsive Acceptance — Sell Basic Info at 768px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1524. Responsive Acceptance — Sell Basic Info at 1024px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1525. Responsive Acceptance — Sell Basic Info at 1280px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1526. Responsive Acceptance — Sell Basic Info at 1440px

- Route: /sell/basic
- Purpose: Title, description, condition, price
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1527. Responsive Acceptance — Sell Attributes at 320px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1528. Responsive Acceptance — Sell Attributes at 390px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1529. Responsive Acceptance — Sell Attributes at 430px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1530. Responsive Acceptance — Sell Attributes at 768px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1531. Responsive Acceptance — Sell Attributes at 1024px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1532. Responsive Acceptance — Sell Attributes at 1280px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1533. Responsive Acceptance — Sell Attributes at 1440px

- Route: /sell/attributes
- Purpose: Dynamic category fields
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1534. Responsive Acceptance — Sell Location at 320px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1535. Responsive Acceptance — Sell Location at 390px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1536. Responsive Acceptance — Sell Location at 430px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1537. Responsive Acceptance — Sell Location at 768px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1538. Responsive Acceptance — Sell Location at 1024px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1539. Responsive Acceptance — Sell Location at 1280px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1540. Responsive Acceptance — Sell Location at 1440px

- Route: /sell/location
- Purpose: Province and city
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1541. Responsive Acceptance — Sell Contact at 320px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1542. Responsive Acceptance — Sell Contact at 390px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1543. Responsive Acceptance — Sell Contact at 430px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1544. Responsive Acceptance — Sell Contact at 768px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1545. Responsive Acceptance — Sell Contact at 1024px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1546. Responsive Acceptance — Sell Contact at 1280px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1547. Responsive Acceptance — Sell Contact at 1440px

- Route: /sell/contact
- Purpose: Phone/WhatsApp/Telegram
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1548. Responsive Acceptance — Sell Preview at 320px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1549. Responsive Acceptance — Sell Preview at 390px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1550. Responsive Acceptance — Sell Preview at 430px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1551. Responsive Acceptance — Sell Preview at 768px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1552. Responsive Acceptance — Sell Preview at 1024px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1553. Responsive Acceptance — Sell Preview at 1280px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1554. Responsive Acceptance — Sell Preview at 1440px

- Route: /sell/preview
- Purpose: Public listing preview
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1555. Responsive Acceptance — Sell Submit at 320px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1556. Responsive Acceptance — Sell Submit at 390px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1557. Responsive Acceptance — Sell Submit at 430px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1558. Responsive Acceptance — Sell Submit at 768px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1559. Responsive Acceptance — Sell Submit at 1024px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1560. Responsive Acceptance — Sell Submit at 1280px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1561. Responsive Acceptance — Sell Submit at 1440px

- Route: /sell/submit
- Purpose: Submission outcome
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1562. Responsive Acceptance — Edit Listing at 320px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1563. Responsive Acceptance — Edit Listing at 390px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1564. Responsive Acceptance — Edit Listing at 430px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1565. Responsive Acceptance — Edit Listing at 768px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1566. Responsive Acceptance — Edit Listing at 1024px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1567. Responsive Acceptance — Edit Listing at 1280px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1568. Responsive Acceptance — Edit Listing at 1440px

- Route: /sell/[id]/edit
- Purpose: Edit existing seller listing
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1569. Responsive Acceptance — Admin Dashboard at 320px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1570. Responsive Acceptance — Admin Dashboard at 390px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1571. Responsive Acceptance — Admin Dashboard at 430px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1572. Responsive Acceptance — Admin Dashboard at 768px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1573. Responsive Acceptance — Admin Dashboard at 1024px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1574. Responsive Acceptance — Admin Dashboard at 1280px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1575. Responsive Acceptance — Admin Dashboard at 1440px

- Route: /admin
- Purpose: Moderation/admin overview
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1576. Responsive Acceptance — Admin Listings at 320px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1577. Responsive Acceptance — Admin Listings at 390px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1578. Responsive Acceptance — Admin Listings at 430px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1579. Responsive Acceptance — Admin Listings at 768px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1580. Responsive Acceptance — Admin Listings at 1024px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1581. Responsive Acceptance — Admin Listings at 1280px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1582. Responsive Acceptance — Admin Listings at 1440px

- Route: /admin/listings
- Purpose: Listing moderation queue
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1583. Responsive Acceptance — Admin Reports at 320px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1584. Responsive Acceptance — Admin Reports at 390px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1585. Responsive Acceptance — Admin Reports at 430px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1586. Responsive Acceptance — Admin Reports at 768px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1587. Responsive Acceptance — Admin Reports at 1024px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1588. Responsive Acceptance — Admin Reports at 1280px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1589. Responsive Acceptance — Admin Reports at 1440px

- Route: /admin/reports
- Purpose: Report queue
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1590. Responsive Acceptance — Admin Users at 320px

- Route: /admin/users
- Purpose: User management
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1591. Responsive Acceptance — Admin Users at 390px

- Route: /admin/users
- Purpose: User management
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1592. Responsive Acceptance — Admin Users at 430px

- Route: /admin/users
- Purpose: User management
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1593. Responsive Acceptance — Admin Users at 768px

- Route: /admin/users
- Purpose: User management
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1594. Responsive Acceptance — Admin Users at 1024px

- Route: /admin/users
- Purpose: User management
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1595. Responsive Acceptance — Admin Users at 1280px

- Route: /admin/users
- Purpose: User management
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1596. Responsive Acceptance — Admin Users at 1440px

- Route: /admin/users
- Purpose: User management
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1597. Responsive Acceptance — Admin Taxonomy at 320px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1598. Responsive Acceptance — Admin Taxonomy at 390px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1599. Responsive Acceptance — Admin Taxonomy at 430px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1600. Responsive Acceptance — Admin Taxonomy at 768px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1601. Responsive Acceptance — Admin Taxonomy at 1024px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1602. Responsive Acceptance — Admin Taxonomy at 1280px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1603. Responsive Acceptance — Admin Taxonomy at 1440px

- Route: /admin/taxonomy
- Purpose: Categories and attributes
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1604. Responsive Acceptance — Admin Locations at 320px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1605. Responsive Acceptance — Admin Locations at 390px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1606. Responsive Acceptance — Admin Locations at 430px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1607. Responsive Acceptance — Admin Locations at 768px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1608. Responsive Acceptance — Admin Locations at 1024px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1609. Responsive Acceptance — Admin Locations at 1280px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1610. Responsive Acceptance — Admin Locations at 1440px

- Route: /admin/locations
- Purpose: Province/city management
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1611. Responsive Acceptance — Admin Audit at 320px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1612. Responsive Acceptance — Admin Audit at 390px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1613. Responsive Acceptance — Admin Audit at 430px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1614. Responsive Acceptance — Admin Audit at 768px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1615. Responsive Acceptance — Admin Audit at 1024px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1616. Responsive Acceptance — Admin Audit at 1280px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1617. Responsive Acceptance — Admin Audit at 1440px

- Route: /admin/audit
- Purpose: Audit context
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1618. Responsive Acceptance — Not Found at 320px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1619. Responsive Acceptance — Not Found at 390px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1620. Responsive Acceptance — Not Found at 430px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1621. Responsive Acceptance — Not Found at 768px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1622. Responsive Acceptance — Not Found at 1024px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1623. Responsive Acceptance — Not Found at 1280px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1624. Responsive Acceptance — Not Found at 1440px

- Route: /404 or app not-found
- Purpose: Recovery from invalid route
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1625. Responsive Acceptance — Global Error at 320px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 320
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1626. Responsive Acceptance — Global Error at 390px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 390
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1627. Responsive Acceptance — Global Error at 430px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 430
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1628. Responsive Acceptance — Global Error at 768px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 768
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1629. Responsive Acceptance — Global Error at 1024px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 1024
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1630. Responsive Acceptance — Global Error at 1280px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 1280
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1631. Responsive Acceptance — Global Error at 1440px

- Route: app/global-error
- Purpose: Safe system recovery
- Viewport: 1440
Verify no horizontal overflow, no clipped interactive target, coherent line wrapping, stable image ratio, correct logical spacing, visible focus, safe bottom spacing, no accidental desktop-only requirement, and no unexpected content jump.

If this is a public page, verify direct navigation without authentication. If this is private/admin, verify unauthorized/forbidden recovery. If this is a form, verify keyboard viewport behavior. If this is a listing page, verify card density and pagination.

PASS requires browser evidence.

# 1632. Final Engineering Checklist

- [ ] Repository inspected
- [ ] Backend/OpenAPI inspected
- [ ] Brand assets inspected
- [ ] Design tokens centralized
- [ ] Persian RTL root configured
- [ ] Logical layout reviewed
- [ ] Mobile header complete
- [ ] Desktop header complete
- [ ] Bottom navigation complete
- [ ] Footer complete
- [ ] Home complete
- [ ] Search complete
- [ ] Category complete
- [ ] Dynamic filters complete
- [ ] Listing cards complete
- [ ] Listing detail complete
- [ ] Seller profile complete
- [ ] Contact actions complete
- [ ] Favorites complete
- [ ] Reports complete
- [ ] Auth complete
- [ ] Seller flow complete
- [ ] Account complete
- [ ] Admin complete
- [ ] Loading states complete
- [ ] Empty states complete
- [ ] Error states complete
- [ ] Offline/retry states complete
- [ ] SEO complete
- [ ] Accessibility complete
- [ ] Performance measured
- [ ] Visual regression reviewed
- [ ] E2E reviewed
- [ ] API contract frozen or adapter explicitly isolates provisional contract
- [ ] No fake production data
- [ ] No fake trust signals
- [ ] No unmodified-logo violations
- [ ] No token persistence violations
- [ ] Final architecture audit passed

# Final Agent Command

Implement WeshBazar as a serious, coherent Afghan marketplace frontend. Start by inspecting the repository, existing code, current API/OpenAPI, implementation status, and official brand assets. Build mobile first with Persian RTL as the default. Keep public browsing fast and mostly server-rendered. Keep interaction-heavy islands client-side only when needed. Use semantic design tokens, teal/orange identity, responsive layout, safe session behavior, centralized API adapters, schema-driven category attributes, low-bandwidth media strategy, accessible forms, and clear recovery states.

Do not invent endpoints, DTO fields, permissions, statuses, category attributes, contact targets, or trust claims. Do not clone another marketplace. Do not turn the app into a giant marketing page. Do not sacrifice performance for decoration.

At every failed quality gate: STOP → FIX → VERIFY.

Final user experience target: a first-time user can understand WeshBazar immediately, search in seconds, inspect a useful listing, understand the price/location/condition, recognize the seller context, contact the seller directly, and return later with confidence — even on a weak phone and a slow connection.

# Research Sources and External References

- Next.js — App Router / Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js — Image Component: https://nextjs.org/docs/app/api-reference/components/image
- Next.js — Font Module: https://nextjs.org/docs/app/api-reference/components/font
- Next.js — Production Checklist: https://nextjs.org/docs/app/guides/production-checklist
- Tailwind CSS — Responsive Design: https://tailwindcss.com/docs/responsive-design
- shadcn/ui — RTL: https://ui.shadcn.com/docs/rtl
- shadcn/ui — RTL migration: https://ui.shadcn.com/docs/cli
- TanStack Query — React Overview: https://tanstack.com/query/latest/docs/framework/react/overview
- MDN — HTML dir attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/dir
- MDN — CSS logical properties: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Logical_properties_and_values
- MDN — autocomplete: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete
- W3C — WCAG 2.2: https://www.w3.org/TR/wcag/
- Diwal Afghanistan marketplace: https://diwal.af/
- OfferUp search/filter guidance: https://help.offerup.com/hc/en-us/articles/360032334711-Search-for-items-to-buy
- OLX location/search guidance: https://help.olx.in/hc/en-us/articles/10845219297821-How-do-I-search-for-a-product-in-my-preferred-location
- Facebook Marketplace shopping safety: https://www.facebook.com/help/123884166448529/
- Divar search/filter API documentation: https://divar-ir.github.io/kenar-docs/post/search_post/
# FINAL FRONTEND EXCELLENCE DIRECTIVE

This project is NOT a demo, tutorial, template, generic AI-generated website, or collection of functional pages.

You are building the real WeshBazar frontend as a serious, production-quality marketplace product.

The goal is not merely:

```text
pages work
API calls work
forms submit
routing works
```

The goal is:

```text
excellent UX
+
excellent UI
+
excellent frontend architecture
+
excellent responsive behavior
+
excellent RTL implementation
+
excellent performance
+
excellent accessibility
+
excellent visual consistency
+
excellent error/loading/empty states
+
excellent API integration
```

The frontend must feel like a professionally designed product that could realistically be launched to real users.

---

# 1. DESIGN QUALITY BAR

Never settle for:

```text
generic
plain
template-like
AI-looking
overly repetitive
visually empty
visually noisy
```

Do not produce a page simply because it technically satisfies the requirement.

Before considering a screen complete, ask:

```text
Would a professional product designer approve this?
Would a senior frontend engineer approve this?
Would a real marketplace user understand this immediately?
Does this feel trustworthy?
Does this feel polished?
Does the visual hierarchy make sense?
Does the interface feel intentional rather than generated?
```

If the answer is no, improve it before continuing.

---

# 2. WESHBAZAR MUST HAVE A DISTINCT PRODUCT IDENTITY

Do not make WeshBazar look like:

```text
a generic Tailwind template
a copied ecommerce dashboard
a random shadcn demo
a Bootstrap website
an AI-generated landing page
```

Create a coherent visual identity for WeshBazar.

Establish and consistently reuse:

```text
color system
typography system
spacing system
radius system
shadow system
border system
icon system
button system
input system
card system
badge system
modal system
drawer system
navigation system
```

Do not invent a different visual language on every page.

The entire product must look like one product designed by one strong design team.

---

# 3. DESIGN SYSTEM FIRST

Before building dozens of pages, establish a reusable design system.

Define reusable tokens for:

```text
colors
backgrounds
surface levels
text hierarchy
muted text
borders
focus states
success
warning
error
information
spacing
radii
shadows
typography sizes
font weights
breakpoints
container widths
transitions
z-index layers
```

Use the design system instead of scattering arbitrary values throughout components.

Avoid endless one-off values such as:

```text
mt-[13px]
px-[19px]
rounded-[17px]
text-[15.5px]
```

unless genuinely necessary.

Prefer coherent design tokens and reusable primitives.

---

# 4. RTL IS NOT A TRANSLATION STEP

WeshBazar is a Persian/Dari-first marketplace.

RTL must be treated as a first-class layout architecture.

Do NOT build an English LTR interface and simply apply:

```css
direction: rtl;
```

at the end.

The interface must be intentionally designed for RTL.

Audit:

```text
text alignment
icon placement
chevrons
back buttons
breadcrumbs
navigation
dropdown alignment
form labels
input adornments
pagination
carousels
price display
badges
cards
dialogs
drawers
tables
filters
sorting controls
image galleries
mobile navigation
```

Use logical CSS properties where appropriate:

```text
margin-inline
padding-inline
inset-inline
border-inline
text-align
```

rather than unnecessarily relying on left/right-specific rules.

Mixed-direction content must remain correct for:

```text
Persian
English
phone numbers
URLs
usernames
Telegram handles
prices
numbers
dates
IDs
```

---

# 5. PERSIAN TYPOGRAPHY

Typography is a major part of product quality.

Choose an appropriate Persian-compatible font strategy already allowed by the project architecture.

Typography must have clear hierarchy:

```text
display
heading
subheading
body
caption
metadata
button
label
error
```

Avoid tiny unreadable text.

Avoid excessive font weights.

Ensure:

```text
line-height
letter spacing
word wrapping
number rendering
mixed Persian/English text
```

remain visually correct.

---

# 6. MOBILE-FIRST MARKETPLACE DESIGN

WeshBazar is a real marketplace.

Assume a significant percentage of users are on phones.

Do not create:

```text
desktop page
+
"make it responsive later"
```

Build mobile-first.

Every important experience must work naturally on:

```text
small mobile
large mobile
tablet
laptop
desktop
wide desktop
```

Do not merely shrink the desktop layout.

Re-think mobile interactions where necessary.

Examples:

```text
mobile filter drawer
mobile bottom navigation where appropriate
sticky actions
compact listing cards
touch-friendly controls
mobile image gallery
mobile seller contact actions
mobile form sections
```

---

# 7. RESPONSIVE BEHAVIOR MUST BE INTENTIONAL

For every major component, define how it behaves across breakpoints.

Examples:

```text
desktop grid → tablet grid → mobile list
desktop navigation → mobile navigation
desktop sidebar → mobile drawer
large gallery → compact swipe gallery
wide filter controls → stacked controls
```

Do not allow accidental wrapping to define responsive behavior.

---

# 8. VISUAL HIERARCHY

Every page must have an obvious visual hierarchy.

Users should immediately understand:

```text
where they are
what the page is about
what the primary action is
what information is important
what is secondary
what can be interacted with
```

Use whitespace intentionally.

Do not fill every empty area.

Do not create huge empty hero sections without product value.

Do not make every component visually loud.

---

# 9. MARKETPLACE UX PRIORITIES

For WeshBazar, prioritize:

```text
discoverability
search
trust
readability
price visibility
image quality
seller identity
location
condition
contact actions
listing status
fast browsing
```

A listing card should allow users to understand the important information quickly.

A listing detail page should make the following obvious:

```text
what is being sold
price
condition
location
images
seller
contact options
listing state
important attributes
```

Do not bury critical information below decorative content.

---

# 10. REAL CONTENT, NOT PLACEHOLDERS

Do not make the final UI depend on:

```text
Lorem ipsum
fake lorem content
fake statistics
fake reviews
fake ratings
fake marketplace activity
invented seller metrics
invented popularity
invented product claims
```

Use real API data or clearly marked development fixtures.

Never manufacture marketplace trust signals.

---

# 11. NO FAKE FEATURES

Do not create frontend UI for backend features that do not exist.

For example, do NOT invent:

```text
chat
payments
checkout
wallet
reviews
ratings
business storefronts
AI recommendations
auction
shipping tracking
```

just because they look good in a mockup.

The frontend must reflect the actual WeshBazar v1 capability set.

---

# 12. API CONTRACT IS LAW

The backend API contract is authoritative.

Use:

```text
docs/openapi.json
docs/frontend-api-contract.md
docs/frontend-error-map.md
docs/api-freeze-summary.md
```

as the source of truth.

Never invent:

```text
endpoint
field
enum
status
query parameter
pagination format
filter syntax
error code
authentication behavior
```

When something is unclear:

```text
inspect OpenAPI
inspect frontend API contract
inspect backend implementation
```

Do not guess.

---

# 13. ZERO PRISMA KNOWLEDGE IN FRONTEND

Frontend must never depend on:

```text
Prisma models
database schema
database column names
internal IDs
internal moderation state
internal session tables
storage filesystem paths
```

Consume only the public API contract.

---

# 14. TYPED API CLIENT

Prefer generating or maintaining a strongly typed API layer from the OpenAPI contract.

The architecture should resemble:

```text
UI
 ↓
hooks/query layer
 ↓
typed API client
 ↓
HTTP
 ↓
WeshBazar API
```

Do not scatter raw fetch calls throughout UI components.

Do not duplicate:

```text
base URL
headers
credentials
error parsing
token handling
request ID handling
```

across components.

---

# 15. AUTHENTICATION UX

Implement the actual backend authentication model.

Understand:

```text
access token
refresh cookie
session refresh
logout
logout-all
session expiration
account suspension
account ban
phone verification
password reset
```

The frontend must never attempt to read the HttpOnly refresh cookie.

Do not store refresh tokens in:

```text
localStorage
sessionStorage
React state
cookies accessible to JavaScript
```

Handle expired access tokens through the documented refresh flow.

---

# 16. AUTH STATE MUST FEEL PROFESSIONAL

Account state must distinguish:

```text
anonymous
checking session
authenticated
session expired
verification required
suspended
banned
```

Avoid UI flicker.

Do not show:

```text
logged out
→ logged in
→ logged out
```

during initial session hydration.

Create a deliberate authentication-loading strategy.

---

# 17. LOADING STATES ARE PART OF THE DESIGN

Every asynchronous experience must have a deliberate loading state.

Use appropriate:

```text
skeletons
spinners
progress indicators
disabled states
optimistic updates where safe
```

Do not make the entire page flash white.

Do not show a spinner for every tiny interaction.

Prefer skeleton layouts that resemble the final content when appropriate.

---

# 18. EMPTY STATES

Empty results are not errors.

Design useful empty states for:

```text
no search results
no favorites
no listings
no seller listings
no admin queue
no reports
no sessions
no images
```

An empty state should explain:

```text
what happened
what the user can do next
```

Do not merely display:

```text
No data
```

---

# 19. ERROR STATES

Error handling must be designed as part of the UX.

Use:

```text
error.code
```

not:

```text
error.message
```

for behavior.

Map backend errors to appropriate UI.

Examples:

```text
AUTH_ACCOUNT_BANNED
→ account-blocked experience

AUTH_PHONE_NOT_VERIFIED
→ verification flow

LISTING_VERSION_CONFLICT
→ stale-edit conflict UI

LISTING_NOT_FOUND
→ unavailable listing UI

RATE_LIMITED
→ retry-later state

VALIDATION_ERROR
→ field-level form errors
```

Never expose:

```text
raw stack trace
Prisma error
internal exception
debug object
```

to users.

---

# 20. FORMS MUST FEEL PREMIUM

Forms should provide:

```text
clear labels
helpful descriptions
correct input types
inline validation
field-level errors
focus management
disabled states
submit progress
success feedback
server validation handling
```

Do not make users discover errors only after submitting a huge form.

Preserve user input when server validation fails.

---

# 21. SELL LISTING EXPERIENCE

The listing creation flow is one of the most important UX surfaces.

It must feel simple despite backend complexity.

Do not dump every dynamic attribute into one overwhelming form.

Use clear progressive structure such as:

```text
Category
→
Basic information
→
Price
→
Location
→
Category-specific attributes
→
Images
→
Contact methods
→
Review
→
Submit
```

The exact structure may differ, but the user should understand where they are and what remains.

Dynamic attributes must be rendered from backend filter/attribute schema.

Do not hard-code mobile-only fields, car-only fields, etc., if the API is schema-driven.

---

# 22. IMAGE UX

Images are central to marketplace conversion.

Provide:

```text
preview
reordering
primary image selection
remove
upload progress
validation feedback
```

Optimize display appropriately.

Use the actual media URLs/variants returned by the backend.

Do not construct internal storage URLs manually.

---

# 23. LISTING CARDS

Listing cards must be optimized for scanning.

Prioritize:

```text
image
title
price
location
condition
important metadata
favorite action
```

Avoid overcrowding cards.

Cards should remain visually strong when titles are:

```text
short
long
Persian
mixed Persian/English
```

Handle inconsistent image aspect ratios gracefully.

---

# 24. LISTING DETAIL PAGE

The detail page must have strong hierarchy.

Important information should appear early.

Use appropriate patterns for:

```text
image gallery
price
title
condition
location
attributes
description
seller
contact actions
favorite
report
status
```

Contact actions should remain easy to discover on mobile.

---

# 25. SEARCH EXPERIENCE

Search must feel fast and deliberate.

Implement:

```text
search input
search state
loading
results
filters
sorting
pagination/infinite loading according to API
empty state
error recovery
```

Do not create a search experience that fires unnecessary requests for every keystroke.

Use appropriate debouncing where useful.

Preserve search/filter state during navigation when the product flow requires it.

---

# 26. FILTER UX

Dynamic filters must be generated from the backend schema.

Support appropriate controls for:

```text
TEXT
INTEGER
DECIMAL
BOOLEAN
SELECT
MULTI_SELECT
YEAR
DATE
```

Do not expose backend grammar directly to normal users.

The UI should convert intuitive controls into the documented API filter serialization.

---

# 27. URL STATE

Where beneficial, search state should be represented in the URL:

```text
query
category
location
price range
condition
filters
sort
cursor where appropriate
```

But do not put unnecessary private state into URLs.

URLs should be stable and shareable for public discovery pages.

---

# 28. INTERACTION DESIGN

Use interaction feedback deliberately:

```text
hover
focus
active
pressed
disabled
loading
success
error
selected
```

Animations should communicate state or improve perceived continuity.

Do not animate everything.

Avoid distracting animations that reduce usability.

---

# 29. MOTION

Motion should be:

```text
subtle
fast
purposeful
consistent
accessible
```

Respect:

```text
prefers-reduced-motion
```

Avoid:

```text
slow page transitions
excessive parallax
constant floating animations
decorative motion everywhere
```

---

# 30. ACCESSIBILITY

Accessibility is not optional.

Implement:

```text
semantic HTML
keyboard navigation
visible focus states
accessible labels
aria only where needed
correct heading hierarchy
button vs link semantics
form association
dialog focus management
keyboard-close behavior
sufficient contrast
reduced motion support
```

Every important action must be usable without a mouse.

Do not use clickable `div` elements when a semantic button/link is appropriate.

---

# 31. PERFORMANCE

Performance is part of the product quality.

Use the capabilities of the selected Next.js architecture appropriately:

```text
Server Components where useful
Client Components only where needed
image optimization
code splitting
lazy loading
dynamic imports when useful
minimal client-side JavaScript
```

Do not turn the entire application into a giant Client Component without reason.

Avoid unnecessary:

```text
global state
large dependencies
duplicate API requests
expensive re-renders
massive bundles
```

---

# 32. DATA FETCHING

Choose a consistent data-fetching strategy.

Avoid:

```text
duplicate requests
request waterfalls
fetching the same data independently in many components
```

Cache and revalidate according to actual API semantics.

Do not cache personalized data as shared public data.

Respect the backend distinction between:

```text
public
private
authenticated
mutation
```

data.

---

# 33. SERVER VS CLIENT RESPONSIBILITY

Prefer server-side rendering/server data access where it improves:

```text
SEO
initial performance
public listing pages
public seller pages
category pages
```

Use Client Components where interaction actually requires them.

Do not move all logic into the browser simply because it is easier.

---

# 34. SEO

Public marketplace pages should be SEO-aware.

Use stable backend data such as:

```text
slug
title
description
price
category
location
publishedAt
images
seller information
```

for appropriate metadata.

Do not invent SEO information that the API does not provide.

Handle:

```text
404
unavailable listing
noindex where appropriate
canonical URLs
Open Graph
Twitter/social metadata where useful
```

appropriately.

---

# 35. SECURITY

Frontend must not weaken backend security.

Never:

```text
trust hidden fields
assume UI role checks are security
expose tokens
construct unsafe URLs
render listing HTML unsafely
```

Listing descriptions are plain text.

Do not use:

```text
dangerouslySetInnerHTML
```

for marketplace user-generated text unless an explicit sanitized rich-text contract exists.

---

# 36. URL / CONTACT SAFETY

Contact actions must consume server-authoritative targets.

Do not blindly execute arbitrary URLs returned from user-controlled data.

Validate or rely on the backend's documented safe contact target contract.

---

# 37. COMPONENT ARCHITECTURE

Build reusable components around real product patterns.

Examples may include:

```text
AppShell
Header
MobileNavigation
SearchBar
ListingCard
ListingGrid
ListingList
Price
LocationLabel
ConditionBadge
SellerCard
FavoriteButton
ContactButtons
ImageGallery
FilterPanel
FilterDrawer
Pagination/CursorLoader
EmptyState
ErrorState
Skeletons
FormField
Modal
Dialog
Toast
```

Do not create hundreds of pointless tiny components.

Do not create one giant component containing an entire page.

Keep boundaries meaningful.

---

# 38. PAGE ARCHITECTURE

Pages should be composed from reusable product components.

Avoid duplication such as separate copies of:

```text
listing card
favorite button
price display
seller summary
image gallery
filter UI
```

Reuse shared primitives.

---

# 39. STATE MANAGEMENT

Do not introduce global state for everything.

Separate:

```text
server state
URL state
local UI state
form state
authentication state
```

Use the simplest suitable solution for each.

Do not add Redux or another large state framework merely because the application is large.

---

# 40. DEPENDENCY DISCIPLINE

Before adding a package ask:

```text
Does the project genuinely need it?
Can the existing stack solve this?
What bundle cost does it introduce?
Does it complicate maintenance?
```

Do not install packages merely because they are popular.

---

# 41. NO DUPLICATED BUSINESS LOGIC

Frontend may perform UX validation, but backend remains authoritative.

Do not reproduce complex backend rules in many places.

Especially avoid duplicating:

```text
listing state machine
authorization
dynamic attribute semantics
pricing business rules
server identity
moderation permissions
```

The frontend may hide invalid actions for UX, but the API remains the authority.

---

# 42. REAL AUTHORIZATION UX

Role-based UI visibility is useful:

```text
USER
MODERATOR
ADMIN
```

but never treat hidden UI as security.

The frontend must gracefully handle:

```text
403
```

even if a user reaches an action through a stale UI or direct navigation.

---

# 43. DATA CONSISTENCY

After mutations, update the relevant UI state correctly.

Examples:

```text
favorite add
→ favorite button
→ favorites list
→ count if exposed

mark sold
→ listing state
→ seller listing list
→ public availability

archive
→ owner dashboard
→ public visibility
```

Do not rely blindly on stale cached data.

---

# 44. OPTIMISTIC UI

Use optimistic updates only where safe.

Good candidate:

```text
favorite
```

Potentially acceptable:

```text
simple UI toggles
```

Do not pretend important server mutations succeeded before confirmation:

```text
publish
mark sold
archive
delete account
moderation
```

---

# 45. NETWORK FAILURE EXPERIENCE

This is a real Afghanistan marketplace and network quality cannot be assumed to be perfect.

The UI should handle:

```text
slow network
request timeout
temporary disconnect
429
500
503
stale request
duplicate retry
partial failure
```

without becoming confusing.

Provide useful recovery actions.

Avoid losing user-entered form data after transient failures.

---

# 46. LOW-BANDWIDTH AWARENESS

Prefer efficient UX:

```text
optimized images
lazy loading
small initial payloads
pagination/cursors
limited client JavaScript
avoid auto-playing heavy media without purpose
```

Do not waste bandwidth on decorative assets that do not improve the product.

---

# 47. IMAGE PERFORMANCE

Use appropriate responsive image behavior.

Avoid downloading:

```text
large desktop image
```

when the device only needs:

```text
small mobile image
```

Use real backend image variants when available.

---

# 48. SKELETON QUALITY

Skeletons should roughly match final component geometry.

Bad:

```text
one spinner in the center for the entire page
```

Better:

```text
listing card skeleton
seller skeleton
detail skeleton
filter skeleton
```

where useful.

---

# 49. TOASTS AND FEEDBACK

Use notifications carefully.

Good toast candidates:

```text
favorite added
listing saved
copy succeeded
session action completed
```

Do not use toasts for errors that need persistent user attention.

Inline errors are often better for forms.

---

# 50. DEStructive ACTIONS

For destructive or irreversible actions:

```text
delete
archive
mark sold
account deactivation
admin moderation
```

provide clear confirmation where appropriate.

Never make destructive actions easy to trigger accidentally.

---

# 51. ADMIN UI

Admin interfaces must feel like a serious internal tool, not a public marketplace page with random tables.

Prioritize:

```text
information density
filtering
search
clear status
safe actions
auditability
pagination
```

but preserve readability and accessibility.

---

# 52. PUBLIC VS ADMIN DESIGN

Public marketplace:

```text
trust
discovery
visual appeal
simplicity
mobile usability
```

Admin:

```text
efficiency
density
clarity
control
auditability
```

They may share the design system but should not necessarily have identical interaction patterns.

---

# 53. MICROCOPY

Use clear, natural Persian/Dari wording for user-facing UI.

Avoid robotic translations.

Avoid Iranian-specific phrasing where an Afghan/Dari phrasing is more appropriate.

Technical API codes remain machine-readable.

User-facing messages must be understandable without knowing backend terminology.

---

# 54. LANGUAGE DIRECTION

Treat language as a system feature.

The implementation should remain capable of supporting:

```text
fa-AF
ps-AF
en
```

without duplicating entire component trees.

RTL is default for Persian/Dari.

---

# 55. MIXED-LANGUAGE CONTENT

Real marketplace content may contain:

```text
Persian + English
Persian + numbers
English model names
phone numbers
URLs
Telegram usernames
brand names
```

Test these explicitly.

Do not allow bidi formatting issues to damage readability.

---

# 56. DESIGN FOR LONG TEXT

Persian marketplace titles can become long.

Components must gracefully handle:

```text
long titles
multi-line descriptions
long seller names
long category names
long attribute labels
```

Do not assume every string fits in one line.

Use truncation only when it improves UX, and provide access to the full content where appropriate.

---

# 57. DESIGN FOR BAD DATA

Real users produce imperfect content.

The UI must remain stable when:

```text
image missing
image broken
very long title
empty optional field
unexpected Unicode
missing seller avatar
no description
no price
unknown optional metadata
```

Never let one malformed optional field destroy the entire page.

---

# 58. VISUAL QA

After implementing each major screen, inspect it visually at multiple viewport sizes.

Check:

```text
mobile
tablet
desktop
wide desktop
RTL
mixed-language content
loading
empty
error
long content
```

Do not assume that because the code compiles, the interface is visually correct.

---

# 59. SELF-REVIEW BEFORE COMPLETION

Before declaring a page complete, perform a deliberate review:

```text
1. Visual hierarchy
2. RTL correctness
3. Typography
4. Spacing consistency
5. Responsive behavior
6. Accessibility
7. Loading state
8. Empty state
9. Error state
10. Long-content behavior
11. API correctness
12. Performance
13. Security
14. Mobile usability
15. Overall polish
```

Fix discovered issues before moving on.

---

# 60. NO "GOOD ENOUGH" STOPPING POINT

Never stop at:

```text
It works.
```

The completion standard is:

```text
It works
+
It is correct
+
It is secure
+
It is responsive
+
It is accessible
+
It is fast
+
It is visually polished
+
It is maintainable
+
It feels like a real product
```

---

# 61. ITERATIVE BUILDING

Do not generate the entire frontend blindly in one huge step.

Work in coherent stages.

For each major feature:

```text
inspect
design
implement
run
test
visually review
fix
then continue
```

Keep the application working throughout development.

---

# 62. AVOID PREMATURE MASSIVE ABSTRACTION

Do not create an enormous design system abstraction before understanding the actual product.

Start with real reusable patterns.

Extract abstractions when duplication or consistency requirements justify them.

---

# 63. DO NOT REWRITE WORKING INFRASTRUCTURE

Respect the existing:

```text
Next.js setup
TypeScript configuration
linting
formatting
API client strategy
authentication infrastructure
project conventions
```

Do not replace stable infrastructure without a concrete reason.

---

# 64. FRONTEND COMPLETION DEFINITION

The frontend is NOT done when every route exists.

It is done when:

```text
all major flows work
all important screens are polished
API integration is real
authentication is real
forms are real
loading states exist
empty states exist
error states exist
mobile UX works
RTL works
accessibility works
SEO works where applicable
performance is reasonable
no fake backend features remain
no obvious visual inconsistencies remain
```

---

# 65. FINAL PRODUCT QUALITY TEST

Before final completion, behave like five different people reviewing the product:

```text
Product Designer
Senior Frontend Engineer
Marketplace User
Mobile User
Accessibility Reviewer
```

Each reviewer should independently be able to say:

```text
This feels intentional.
This is easy to understand.
This works well on mobile.
This interface is consistent.
This product feels trustworthy.
```

---

# 66. FINAL RULE

When choosing between two implementations, prefer the one that gives:

```text
better UX
better accessibility
better maintainability
better performance
better RTL support
better consistency
```

without introducing unnecessary complexity.

Do not optimize for:

```text
fastest code generation
fewest files
most visual effects
most dependencies
most abstractions
most features
```

Optimize for:

```text
WeshBazar as a real, excellent product.
```

---

# 67. ABSOLUTE FRONTEND STANDARD

The final WeshBazar frontend should feel like:

```text
a real product
not a coding exercise
not a template
not an AI demo
not a university assignment
```

Every screen should communicate:

```text
clarity
trust
simplicity
quality
speed
consistency
```

The user should notice the product quality naturally without the interface needing to show off.

**Build less unnecessary UI. Build better UI.**
**Build fewer fake features. Build the real features extremely well.**
**Do not merely make the frontend functional. Make it excellent.**


