# WeshBazar — Frontend Master Engineering & UX/UI Build Prompt V5 (Controlled Revision)

This is the authoritative frontend build contract for WeshBazar.

The prompt is written in English so a coding agent can follow it precisely. The product UI must be Persian by default, Afghanistan/Dari-oriented, and RTL. The architecture must remain ready for Pashto and English later.

MASTER PRINCIPLE: a polished marketplace experience is a release requirement, not a cosmetic bonus. Optimize in this order: trust and functional correctness → visual hierarchy and usability → performance/accessibility → decorative refinement.

Do not build a generic SaaS dashboard, starter-template storefront, marketing landing page, or a stack of giant generic cards. Build a distinctive, credible C2C marketplace for Afghanistan, optimized for mobile devices, low-end phones, weak connections, Persian/Dari RTL, and direct seller contact.

V5 revision intent: retain V4's valid architecture, security, API, accessibility, brand, and product rules; change only the parts needed to remove ambiguity, reduce repetitive prompt noise, enforce a visual-design workflow, and add regression gates for the known classes of failure. Do not treat this document as permission to rebuild everything in one batch.

# 0. Agent Role and Absolute Rules

You are the Senior Frontend Engineer, Product Designer, UX Researcher, UI Architect, Design Systems Engineer, Performance Engineer, Accessibility Engineer, and QA Engineer for WeshBazar. Requirements are a build contract, not inspiration.

Execution loop for every phase:
Inspect current source and behavior → reconcile with backend/OpenAPI and V5 → research/design if relevant → write a small phase plan → implement one bounded slice → typecheck → lint → focused tests → affected regressions → build → run in a real browser → capture/inspect screenshots → fix visual defects → accessibility/responsive QA → document evidence → mark phase status → proceed to the next phase only when its gate passes.

Autonomous execution: continue phase-by-phase without asking the user to approve ordinary implementation decisions. Pause only for a genuinely blocking ambiguity, destructive action, missing secret/credential, required paid service, data-loss risk, or an API/backend change outside frontend scope. Never fabricate successful test or browser evidence. If a gate fails, diagnose and fix it before moving on. If blocked by unavailable SMS/provider/browser/skill access, document the exact blocker and continue with independent work that remains safe.

Never hide errors with fake data, disabled checks, swallowed exceptions, giant loading spinners, mock success responses in production paths, or production-only conditionals. Never sacrifice performance, accessibility, RTL correctness, account isolation, or trust for visual decoration. Do not rewrite working infrastructure or mass-reformat unrelated files.

# V5.0. Autonomous Phase Control and Durable Documentation

The agent must complete the project as a sequence of small, verifiable phases, not as one enormous generation task. Do not stop after producing a plan: execute each phase autonomously, verify it, document it, and continue while gates pass.

Before changing code:
1. Detect the real repository root, current branch, package manager, framework versions, scripts, existing tests, environment requirements, current Git status, and uncommitted user changes.
2. Never discard, overwrite, reset, clean, or mass-reformat existing user work. If Git is available and the working tree is clean, create a clearly named feature branch or checkpoint according to the repository's existing convention. If the tree is dirty, record it and preserve it.
3. Run the available baseline checks and start the app/browser if feasible. Capture baseline screenshots of the current homepage and key broken journeys before repair; this creates evidence, not an instruction to preserve poor design.
4. Inspect the actual frontend, backend OpenAPI artifact, backend contract documents, runtime API base URL, brand assets, existing visual references, and current implementation-status docs. Mark each finding as confirmed, probable, or unknown.

Create or reuse one durable execution area under `docs/frontend-execution/` (do not create duplicates if an equivalent canonical folder already exists):
- `STATUS.md`: current phase, completed gates, blockers, next exact task, and commands/results.
- `BASELINE.md`: repository state, baseline checks, known defects, route inventory, API contract source/version, and untouched areas.
- `DESIGN-DECISIONS.md`: approved visual system, references reviewed, decisions/rejected patterns, rationale, and skill evidence.
- `phases/phase-NN-<slug>.md`: scope, assumptions, files touched, tests run, screenshot paths, visual findings, known limitations, and PASS/FAIL.
- Store browser screenshots and visual evidence under an existing QA artifact folder or `docs/frontend-execution/artifacts/`; do not commit huge temporary artifacts unless the repository convention requires them.

At the beginning of every resume, read STATUS.md, the latest phase report, Git status, and relevant tests before acting. At the end of each phase, update its report and STATUS.md. If quota/context is running low, leave a precise resume checkpoint; never claim completion for unfinished phases.

Required phase gates:
- Correctness: real API contract, no invented endpoints/states, and regression tests for affected flows.
- Visual: real-browser screenshots at the required viewport(s), inspected against the design specification, with a recorded issue list and fixes.
- Responsive: relevant phone/tablet/desktop viewports checked; no overflow or inaccessible controls.
- Accessibility: keyboard, visible focus, labels/errors, contrast, reduced motion, dialog focus, and touch sizes for affected components.
- Engineering: relevant lint/typecheck/unit/component/E2E/build commands pass, or any unavailable gate is explicitly documented as NOT RUN (never as PASS).

# V5.1. Required Execution Phases (Do Not Collapse Them)

Proceed in this order, adapting exact task boundaries to the repo but not skipping a phase:

0. **Baseline and repository preservation** — map the app, routes, shared shell, state stores, API client, tests, screenshots, and existing uncommitted work. Do not implement during baseline collection.
1. **API + critical behavior audit** — trace real registration/login/refresh/logout/verification state, seller contact-step request, listing draft ownership, and API error mapping against OpenAPI/backend source. Add or update regression tests first where possible. Separate frontend defects from backend/provider limitations.
2. **Identity/session/draft isolation** — fix account-switching, stale private caches, refresh/re-login behavior, and draft namespacing before broad feature work. Prove user A → logout → user B cannot see or resume A's private draft; prove A can resume only A's own draft after authenticating again.
3. **Visual research and design system** — inspect the live reference sites listed in §3 from desktop and mobile if reachable; use UI/UX Pro Max if available; persist the agreed WeshBazar design system; define a concrete home/header/footer/search/listing-card design brief before implementing the visual foundation.
4. **Shared shell and homepage vertical slice** — implement/reconcile the global public layout, desktop/mobile headers, footer, navigation, typography/tokens, location control, compact categories, and listing-first homepage. Complete its loading/error/empty states and visual QA before proceeding.
5. **Discovery** — search results, category pages, URL-synchronized filters/sort, applied-filter chips, mobile filter sheet, desktop filter rail, pagination, and no-results recovery.
6. **Listing detail and seller context** — gallery, price/title/condition/location/date, schema-driven attributes, seller card, contact actions, share/report, safety, and related listings.
7. **Seller listing flow** — category → photos → basic info → dynamic attributes → location → contact methods → preview → submit/result, including server errors, upload failures, draft persistence, and resume.
8. **Authentication and account completion** — registration, login, verification, forgot/reset password, sessions/security, favorites, report flows, account and user listing management. Re-run the cross-account tests from Phase 2.
9. **Admin/moderation surfaces** — only the pages/features supported by backend permissions and OpenAPI; never fake admin capabilities.
10. **Full regression and release audit** — all applicable routes, responsive breakpoints, accessibility, SEO, performance, API-contract drift, and documentation review. No release declaration while a critical known defect remains.

A phase may be split into smaller checkpoints, but multiple major phases must not be implemented as one undifferentiated code-generation batch. A later phase may be started only when the earlier phase's release-blocking criteria pass.

# 1. Source-of-Truth Hierarchy

Use domain-specific sources of truth; the existing visual implementation is not automatically authoritative when it contradicts this contract or is visibly defective.

For API and business behavior:
1. Actual backend implementation plus the current generated OpenAPI/API Contract artifact and DTOs (resolve any disagreement explicitly; do not guess).
2. Backend business rules, auth/permissions, and state transitions.
3. Existing frontend API adapter and passing tests, after validating them against the above.

For product/visual decisions:
1. Official WeshBazar logo/brand assets and locked palette in this document.
2. This V5 product contract and the persisted WeshBazar design system/page overrides.
3. Applicable UI/UX Pro Max search results and verified external UX research.
4. Existing frontend UI only where it meets the preceding sources.
5. Engineering judgment, with a short decision record for material trade-offs.

For code preservation, keep existing behavior that is demonstrated to be correct; do not preserve known defects merely because they already exist. If sources conflict, record the exact conflict, select the smallest safe correction, and keep backend-specific adaptation inside the API/client boundary.

The frontend must never import Prisma models, decide authorization, invent listing states, invent dynamic attributes, invent contact endpoints/phone verification success, or infer private data from database structure.

# 2. Product Scope

WeshBazar is an Afghanistan-focused C2C marketplace for new and used goods.

Guest capabilities: home, category browsing, search, filters, sorting, listing details, seller information, direct contact, sharing.
Authenticated capabilities: favorites, reports, profile, security.
Seller capabilities: register, phone verification, drafts, photos, dynamic category attributes, price, location, contact methods, preview, submit, edit, mark sold, archive, manage listings.
Admin/moderator capabilities: dashboard, users, listings, reports, taxonomy, locations, audit context, moderation actions according to actual backend permissions.

Not in MVP: checkout, payment, wallet, escrow, commission, shipping, delivery tracking, bidding, auctions, cryptocurrency, internal marketplace chat, AI recommendation, AI moderation, heavy maps, 3D, video-first home page, fake ratings, fake reviews, fake trust scores.

# 3. Research Synthesis — What to Borrow and What Not to Borrow

Research was performed against live/reference materials for Divar, Sheypoor, eBay, eBay's filtering pattern guidance, Baymard Institute, Nielsen Norman Group, Playwright, Next.js, shadcn/ui RTL, and the open-source UI/UX Pro Max skill. Treat each site as evidence for a pattern, not as a design to copy verbatim.

**Divar (Iranian classifieds reference) — discovery:** emphasize a clear city/location context, direct keyword discovery, legible category paths, and a low-friction “post listing” journey. The web experience communicates direct buying/selling rather than a full retail checkout. Adapt “city” to Afghanistan's province/city selection and do not force precise GPS.

**Sheypoor — broad classifieds taxonomy:** use clear, recognizable category families, helpful category-specific browsing, and relevant popular-search shortcuts where real data supports them. Avoid making the category directory so large that it pushes fresh listings below the meaningful first viewport.

**eBay — search, categories, and filters:** borrow strong search prominence, structured category navigation, item-condition/attribute filters, discoverable sorting, and visible filter selection. eBay's auctions, shipping, retail trust/rating claims, seller metrics, and checkout behaviors are out of scope unless the WeshBazar API explicitly supports an equivalent.

**Baymard and NN/G — evidence-based product discovery:** applied filters need an at-a-glance overview and easy removal; key filters come first, less-used filters can be collapsed; category-specific filters should match the items being browsed; desktop and mobile filtering need different interaction patterns. On desktop prefer a persistent filter rail when space permits; on mobile use a discoverable filter button/sheet rather than cramming a long filter form into the results header.

**WeshBazar adaptation:** prominent search + user-changeable province/city context + concise category shortcuts + early listing visibility + clear prices in AFN + condition/location/date + direct seller contact. UI must stay compact, warm, restrained, and marketplace-like. Never copy competitors' branding, exact layout, wording, imagery, rating signals, or business model. Do not render filter/sort options that the real API does not support.

Research URLs appear in the final source list and should be reviewed during Phase 3. Record what was actually inspected and how each chosen pattern was adapted in `docs/frontend-execution/DESIGN-DECISIONS.md`.

# V5.2. UI/UX Pro Max Skill and Design-System Workflow

Use the official open-source UI/UX Pro Max skill whenever designing/reviewing a UI, changing layout, choosing typography/spacing, building forms, or repairing responsive/interaction defects. Official repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill . The skill provides searchable design styles, product-oriented palettes/reasoning, font pairings, UX guidelines, and stack-specific guidance; its priority order places accessibility, touch/interaction, performance, style, responsive layout, typography/color, animation, forms/feedback, and navigation ahead of charts when relevant.

1. Inspect whether UI/UX Pro Max is already installed in the repository or available through the current agent's supported skill directory. Read its `SKILL.md`, README, and local usage instructions before running it. Do not claim it was used without actual output/evidence.
2. If installed, use its design-system search for the dominant product intent, e.g. `Afghan C2C classifieds marketplace product discovery mobile-first RTL Persian Dari`, and persist its result in the project root using the installed skill's documented `--design-system --persist --output-dir <repo-root>` workflow. Also use targeted UX searches for marketplace search/filtering, forms/errors, keyboard/focus, and responsive touch interactions. Inspect the script's `--help` and use only flags supported by the installed version.
3. If no supported installation exists, do not install global software, rewrite agent configuration, or overwrite existing skill files automatically. Record the blocker and provide the documented setup command in STATUS.md; continue using the research sources and the concrete V5 rules rather than stalling.
4. Design system persistence must use a single project-level Master and page-specific overrides (at least `home`, `search`, `listing-detail`, `auth`, and `sell` as needed). Inspect existing files first; never overwrite a user-authored Master or page override without explicit authorization. Follow the skill's hierarchy: page override may refine Master but may not silently change the official brand.
5. **Brand lock:** UI/UX Pro Max output is advisory. It cannot replace WeshBazar's official logo, teal/orange palette, Dari-first RTL, marketplace information density, low-bandwidth constraints, or actual API capabilities. If the skill recommends a conflicting palette/style, record and reject the conflicting suggestion.
6. Store a brief evidence summary: skill version/path, exact queries/commands used, top applicable recommendations, accepted/rejected recommendations, and resulting design decisions. Never paste the whole skill dataset into this prompt or ask the model to load every guideline; search narrowly for the concern at hand.

The implementation target is not merely “modern”: a cohesive marketplace with strong hierarchy, deliberate whitespace, consistent alignment, polished listing cards, excellent imagery treatment, compact filters, precise type scale, subtle borders/elevation, and no generic starter-template look.

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

The backend architecture uses a short-lived access token plus rotating refresh sessions. Refresh tokens must not be readable by normal browser JavaScript. Use the backend's actual cookie contract (HttpOnly, Secure, SameSite, credentials/CORS behavior) for the deployment; do not guess whether the browser/server are same-site or cross-site.

Never store refresh tokens in localStorage/sessionStorage. Never put tokens in URLs. Never log tokens. Do not persist access tokens unless the verified backend/client architecture explicitly requires a safe in-memory mechanism; prefer the documented contract.

Registration, account creation, authentication, and phone verification are distinct states. Derive each from the actual API response/session contract. Account creation alone does NOT mean the UI may claim the phone is verified. If SMS delivery is not implemented or the provider is disabled, do not fake OTP delivery/success; show an honest pending/unavailable state and permit only operations the backend authorizes. Never let a frontend-only flag override server verification/permissions.

Handle concurrent 401 responses with one single-flight refresh attempt. Do not retry mutations blindly after refresh unless the operation is idempotent or has a verified idempotency mechanism. If refresh fails, clear all in-memory private state and user-specific query caches, reset forms tied to the prior identity, re-check the server session, and redirect only when appropriate. Public browsing must remain functional. The visible account identity must always match the identity established by the server session.

**Mandatory session regression tests:** registration response followed by refresh; unverified user state; successful login; refresh success; refresh failure/expired session; logout; logout-all/session revocation where supported; two concurrent 401s; account A logout followed by account B login; browser back/forward after logout; and reload after every relevant transition. Keep every test isolated by browser context/storage state.

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

- Route: `/`
- Purpose: public discovery and first impression
- Default language: `fa-AF`; root direction `rtl`
- Canonical visual reference: 390×844 mobile and 1440×900 desktop
- Primary user goal: understand the marketplace, set/confirm location, search or browse, and see useful listings quickly.

Required visual hierarchy: (1) complete shared header, (2) prominent search, (3) visible province/city context, (4) compact category shortcuts, (5) a clearly headed latest/recent listings grid visible early, (6) optional discovery sections only after useful listings, (7) restrained post-listing CTA/safety help, (8) complete footer. There must be no oversized marketing hero. Categories are navigation aids, not the main body of the homepage.

The first useful viewport must show the search/location plus at least the beginning of real listing content on normal phone and desktop sizes. On mobile, category shortcuts should be one compact horizontal strip (or at most two compact rows when the available data/categories require it); show no more than about eight shortcuts before “all categories”. Never let category art/icons occupy more vertical space than the first listings section. On desktop, listings should be the dominant content area, not an oversized category wall.

Listing cards must use real API data. If the API returns no listings, show an honest designed empty state; never fabricate prices, products, sellers, counts, ratings, or promotional claims. Preserve the correct public header/footer shell, content max-width, token-based spacing, responsive card density, SEO metadata, and clear loading/error/retry states. Public data should use Server Components where practical; keep interactive behavior in narrow Client Components.

# 21. Page Contract — Search

- Route: `/search`
- Purpose: keyword/filter-driven discovery; `390×844` is the primary mobile reference.
- The search term, category, province, city, price bounds, condition, schema-defined category attributes, sort, and cursor must follow the real API/OpenAPI contract. URL state is the durable source for shareable search state; Back/Forward and reload must restore the same visible filters and results.
- Mobile layout: compact search/context row, result count, visible removable applied-filter chips, sort + clearly labeled Filter button with selected count, then results. Open filters in an accessible drawer/sheet with a stable header and a sticky footer for Apply/Show results and Reset. Draft selections inside the sheet do not mutate results until the defined Apply action if the chosen pattern uses explicit apply.
- Desktop layout: result heading/count and sort above results, a persistent filter rail only when there is enough width, and a responsive result grid. Never squish a desktop sidebar into a narrow phone.
- Prioritize common global filters (price, location, condition when supported) before category-specific and low-frequency filters. Use progressive disclosure for long attribute schemas. Applied filters must be visible and individually removable; “clear all” must be discoverable. Never expose unsupported filters, ratings, sorting modes, or facets just because a reference marketplace has them.
- Debounce free-text search where appropriate, cancel/ignore stale requests, preserve filter values through recoverable failures, and distinguish API validation, empty results, offline, rate-limit, and server failures. No giant spinner or rough horizontal row of dozens of filter buttons. Public SEO/canonical rules apply according to the actual query contract.

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
1. Shared 56px mobile header (logo + only essential actions)
2. 48px primary search control
3. Compact, user-changeable province/city selector
4. One compact row of category shortcuts (max ~8 before “all categories”; never a category wall)
5. Latest listings heading + real responsive listing cards, visible early in the first viewport
6. Optional secondary discovery/category section only after useful listing content
7. Compact orange post-listing CTA (not an oversized banner)
8. Short, truthful safety guidance
9. Complete but compact footer
```

No oversized hero, autoplay video, decorative banner, or giant category grid may push listings out of the first meaningful viewport. Target consistent rhythm (commonly 16px page padding and 24–32px section spacing) using tokens, not arbitrary one-off values. At 390px, prefer a two-column listing grid when titles/prices remain legible; at 320px choose the layout (two compact columns or one compact row-list) that avoids cramped text and overflow. At desktop widths, recent listings should typically use 4 columns at wide desktop, 3 columns around 1024px, and 2 columns at tablet widths when the container supports it. Adjust only with screenshot evidence.

The desktop composition may reorganize these blocks only when scanability improves. Keep semantic/accessibility order coherent and keep categories subordinate to discovery/listings.

# 56. Anatomy Contract — Search

Required order for the default mobile composition:

```text
1. compact search control / query context
2. result title and result count (only when supplied by API)
3. removable applied-filter chips + clear-all
4. sort control + accessible Filter button/count
5. result grid/list with responsive cards
6. explicit cursor-based Load More when supported
7. honest no-results/error/offline recovery
```

Mobile filters open in a sheet/drawer that respects RTL, keyboard, safe areas, focus containment, and a sticky Apply/Reset footer. Desktop uses a persistent filter rail when width allows. Never make users scroll through a large dense filter form before seeing the results. Search state must survive refresh/deep link/back-forward as specified by the actual contract.

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
- Required content: official logo, one essential account/menu action, and a concise sell entry point if it fits; search and location follow in the compact discovery row.
- Must remain clean at 320px: no squeezed desktop navigation, duplicated action clusters, distorted logo, or text collisions.
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
- Required RTL hierarchy: official logo at inline-start (right in Persian RTL), a wide search field, province/city control, favorites/account affordances, and one clearly emphasized post-listing action. Keep category navigation compact and do not force all controls into a cramped single row; use one restrained secondary row only if needed and evidenced by screenshots.
- The header must be part of the shared public layout, not implemented separately on each page.
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
- The footer is mandatory on public pages and must be a real shared component. Include concise marketplace/about/help/safety/legal/contact links only where valid destinations exist; never render dead placeholders. Desktop may group useful links in columns; mobile uses compact groups/accordions and avoids a huge blank footer.
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

- Goal: configure the listing's allowed contact methods.
- Rule: PHONE/WHATSAPP/TELEGRAM only if supported for this listing by the verified backend contract; do not invent “verify WhatsApp” or contact-save endpoints.
- Trace the exact request URL, method, content type, payload, credentials, error envelope, and backend error code. A generic “cannot connect to server” is not acceptable when the real error is validation, unauthorized, phone-not-verified, rate-limited, unsupported, or a server response.
- Normalize Afghanistan phone input only according to the API's accepted format. Keep PHONE/WHATSAPP/TELEGRAM semantics distinct; a WhatsApp selection does not prove the phone number is verified.
- If SMS is not live, show the real pending/unavailable state; never fake OTP delivery or verification success. Preserve safe non-secret form fields after recoverable errors and do not submit twice.
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep the mobile keyboard from obscuring the active control. Draft recovery must be owner-scoped. Do not assume every listing can be edited/submitted; obey backend state and permission responses.

# 326. Seller Workflow Contract — Preview

- Goal: public rendering
- Rule: reuse core listing detail presentation
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# 327. Seller Workflow Contract — Submit

- Goal: state transition
- Rule: show backend outcome and requirements
One primary action per step. Back navigation must preserve safe data. Prevent duplicate submission. Show workflow progress. Keep mobile keyboard from obscuring the active control. Draft recovery is for safe non-secret fields only. Do not assume every listing can be edited or submitted; follow backend state/permission response.

# V5.3. Critical User-Journey Regression Contract (Release Blocking)

These are not optional illustrative cases. Add or extend Playwright/component/API-adapter tests that reproduce real behavior against the local test backend or a faithful contract-backed test fixture. Keep each test isolated in its own browser context/storage/cookies, following Playwright's official guidance. Do not use mocks to claim backend behavior was verified.

**Registration / verification**
- Register a new phone. Confirm the response and server session behavior from the actual contract.
- Reload immediately. The UI must show the correct created/unverified/authenticated state; it must never turn “account exists” into “phone verified” by inference.
- If OTP delivery is disabled, do not fabricate a code, resend success, or verified state. If backend account creation occurs before verification, show the truthful pending state and only let the user perform server-authorized operations.
- Wrong OTP, expired OTP, resend cooldown/rate limit, already-used phone, network failure, 4xx domain error, and 5xx response must each produce the correct inline status and recovery action.

**Session and account switching**
- Login → reload → restore the same server-confirmed user.
- Logout → reload/back → private UI and caches stay cleared; do not resurrect the prior account from stale client memory.
- Account A login → create or resume a draft → logout → account B login/register → B sees no A data and cannot continue A's draft.
- Account B logout → account A login again → only A's owned drafts may be restored after identity is established.
- Refresh token/session expiration must invalidate user-specific query keys and forms. Public pages continue to work.

**Seller wizard and contact-step failures**
- Walk through category, photo upload, basic info, backend-driven attributes, location, contact methods, preview, and submit using actual API payloads/contracts.
- Test server/network failures at each step; distinguish network failure, validation errors, unauthorized, forbidden/PHONE_NOT_VERIFIED, not found, conflict, rate limit, and unexpected server error by `error.code`/requestId where available.
- Safe entered fields must remain recoverable after retry/back navigation; no step may claim saved/success if the API failed. Do not advance to the next step on a failed mutation.
- Ensure account changes reset the active wizard identity and ownership. Do not duplicate draft submission or photo uploads on retry.

**Required evidence:** test name, route, browser-context isolation, expected/actual state, and passing command in the phase report. Unknown backend behavior is recorded as a blocker, not reimplemented in the frontend.

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

Persist only necessary non-secret fields. Never persist passwords, OTPs, access/refresh tokens, auth cookies, or raw server credentials. Prefer backend-owned drafts when supported; otherwise namespace browser draft keys by an explicit stable owner identity and schema version. If ownership cannot be proven, do not auto-resume the draft; quarantine/clear the ambiguous legacy key and explain the recovery choice without revealing content.

On logout or identity change, clear the prior account's in-memory draft, current form, private query cache, selected listing ownership state, and user-specific UI state. A user A draft must never appear to user B after A logs out and B registers/logs in. Keep A's recoverable draft isolated under A's identity only if the product's shared-device privacy model allows it; never render it until A is re-authenticated and ownership is re-validated with the backend. Do not automatically copy old unscoped localStorage drafts into a newly authenticated account.

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

# V5.4. Visual Design and Browser-Evidence Release Gate

The agent must not judge the interface only from JSX/Tailwind source or declare it polished because the build passes. Run the application in a real browser, inspect screenshots, list visible defects, fix them, then re-capture. If no browser automation/browser tool exists, document the limitation and do not call visual QA complete.

For every major visual phase, capture at least:
- Homepage: 390×844 and 1440×900; also 320px and 768px for overflow/breakpoint checks.
- Search/category: 390×844 and 1280×720, with filters both closed and open.
- Listing detail: 390×844 and 1280×720, including gallery/contact area.
- Auth and seller wizard: 390×844 with keyboard/focused field where possible and 1280×720.
- Shared header/footer: mobile and desktop, plus at least one page other than home to prove the shared shell persists.

Create before/after browser screenshots and a short visual review record; use Playwright screenshot assertions where stable and useful. Review actual rendered content, not only baseline pixel diff. Browser snapshot tests supplement (do not replace) manual visual judgment because fonts/OS rendering can produce harmless diffs.

Visual pass rubric (100 points): information hierarchy and above-the-fold content 15; shared shell/header/footer 15; typography and Dari RTL 12; spacing/alignment/grid rhythm 12; listing card and image quality 12; search/filter clarity 12; color/brand consistency 8; responsive behavior 8; loading/error/empty states and accessibility 6. Aim for at least 88/100 on the homepage after fixes. Regardless of score, any missing shared header/footer, broken layout, generic huge category wall, unreadable listing cards, horizontal overflow, misleading auth/verification state, cross-account data leak, broken filter apply/reset, fake success, or dead primary action is an automatic FAIL.

Check that the UI has consistent spacing/radius/typography; a restrained palette; alignment across page edges; deliberate image ratios/crops; clear product price hierarchy; realistic marketplace density; balanced whitespace; a strong but not oversized search control; subtle borders/elevation; coherent icon family; and no “cards inside cards” or unrelated design styles. Icons must be consistent SVG/icon-library assets, not emoji used as interface icons.

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

# V5 QA Appendix A — Consolidated Acceptance Coverage

This appendix **replaces the repetitive Acceptance Record headings #530–1050**. It preserves their distinct component/area coverage while defining shared acceptance checks once. A state must be exercised only where it is semantically applicable; never invent impossible states merely to check a box.

Shared checks for every applicable area: meaningful hierarchy; concise natural Afghan Dari; correct RTL/logical layout; 44×44px minimum touch target and visible keyboard focus; no essential hover-only action; stable loading geometry; truthful error copy and recovery; safe user input preservation; no secrets/PII in logs; reserved media dimensions; real-browser verification; and equivalent usable behavior on mobile and desktop.

| Area | Purpose recorded in V4 | States to cover where applicable |
|---|---|---|

| Home / first viewport | search-first hierarchy | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Home / category discovery | fast category access | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Home / latest listings | real listing data only | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Home / sell CTA | orange controlled accent | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Search / query | URL state | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Search / filters | applied chip visibility | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Search / sort | result consistency | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Search / empty | broaden query/recover | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Search / network | retry without losing query | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Category / breadcrumb | logical navigation | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Category / children | scan-friendly shortcuts | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Category / dynamic filters | schema-driven | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Category / results | listing density | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / gallery | optimized responsive images | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / price | strong hierarchy | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / attributes | schema-driven display | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / description | readable line length | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / seller | public-only context | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / contact | low-friction direct action | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / report | secondary but discoverable | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / safety | concise caution | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Listing Detail / related | only when useful data exists | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Seller Profile / summary | public seller identity | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Seller Profile / listings | active public listings only | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Seller Profile / empty | clear explanation | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl |


# V5 QA Appendix B — Consolidated Component Acceptance

This appendix **replaces the repetitive Component Acceptance headings #1051–1407**. For every component, exercise the named interaction plus the applicable states below. An interaction must be tested by observable behavior, not by class-name or snapshot count alone.

Common component checks: geometry and typography align to tokens; state contrast is obvious; accessible name/label exists; RTL is correct; no duplicate request or unintended navigation; safe error handling; no private-data exposure; no unnecessary Client Component hydration; and no unexplained one-off styling. Verify 320px for overflow, 390×844 for thumb/keyboard behavior, and 1280×720 for density.

| Component | Original interaction focus | Required applicable states |
|---|---|---|

| SearchBar | query editing | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| LocationPicker | province-to-city | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| ListingCard | navigation | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| FavoriteButton | mutation | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| ContactActions | method | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| ImageGallery | selection | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| ImageUploader | upload | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| PriceInput | formatting | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| OtpInput | verification | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| DynamicFieldRenderer | schema | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| FilterSheetMobile | apply | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| ReportDialog | submit | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| SellerCard | context | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| MyListings | status | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| AdminTable | actions | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| Dialog | focus | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |
| ToastRegion | announcement | idle, hover, focus-visible, pressed, disabled, loading, success, error, empty, unauthorized, forbidden, not-found, conflict, offline, slow-network, long-content, mixed-rtl, no-image, image-error, reduced-motion, keyboard |


# V5 QA Appendix C — Consolidated Responsive Route Matrix

This appendix **replaces the repetitive Responsive Acceptance headings #1408–1631**. Every route below must be checked at every listed viewport, using real browser screenshots and at least one functional interaction per page. The same universal checks apply at every size.

| Page/route area | Viewport widths |
|---|---|

| Home | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Search | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Category | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Listing Detail | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Seller Profile | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Login | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Register | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Verify | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Forgot Password | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Reset Password | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Favorites | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| My Listings | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Account | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Security | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Start | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Photos | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Basic Info | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Attributes | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Location | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Contact | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Preview | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Sell Submit | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Edit Listing | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Dashboard | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Listings | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Reports | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Users | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Taxonomy | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Locations | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Admin Audit | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Not Found | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |
| Global Error | 320px, 390px, 430px, 768px, 1024px, 1280px, 1440px |


Universal responsive pass criteria: no horizontal overflow; no clipped, overlapping, or unreachable controls; coherent line wrapping; stable image aspect ratios; consistent logical spacing; visible focus; no bottom navigation/sticky CTA overlap; usable virtual-keyboard viewport for forms; and no accidental desktop-only behavior. Public routes must open directly without authentication; private/admin routes must display correct unauthorized/forbidden recovery; listing pages must retain readable card density and pagination.



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
- [ ] Registration versus phone-verification state is truthful
- [ ] No cross-account draft/cache leakage
- [ ] Seller contact step has contract-backed success/error handling
- [ ] UI/UX Pro Max recommendations were actually queried or the missing-skill limitation was documented
- [ ] Persisted design system and required page overrides exist and respect the official WeshBazar brand
- [ ] Shared header and footer are present and visually checked on relevant routes
- [ ] Homepage listing content is not pushed down by oversized category shortcuts
- [ ] Search filters are URL-consistent, removable, and fit mobile/desktop patterns
- [ ] Real-browser screenshots and visual defect closure are recorded for each major phase
- [ ] All phase reports and STATUS.md accurately reflect PASS/FAIL/NOT RUN
- [ ] Final architecture audit passed

# Final Agent Command

Execute the required phases in §V5.1 autonomously and in order. Begin with a non-destructive baseline, preserve user changes, audit the real backend/API contract, and document facts versus hypotheses. Do not attempt a one-shot build of all pages. Fix critical identity/session/draft-isolation defects before broad feature rollout; then establish a persisted design system using UI/UX Pro Max when available, rebuild the shared shell and homepage to browser-verified quality, and expand through discovery, listing detail, seller creation, account, and admin surfaces.

Use Divar/Sheypoor/eBay and the cited UX research only for transferable interaction principles. Do not clone a competitor or import unsupported business features. Preserve WeshBazar's official logo and teal/orange identity. Make homepage discovery listing-first: search and location prominent; category shortcuts compact; real listings visible early; polished responsive cards; complete shared header/footer. Make filters and sort contextual, removable, URL-restorable, and usable on desktop and mobile.

Follow the actual OpenAPI and backend semantics. Do not invent endpoints, DTO fields, permissions, statuses, category attributes, contact targets, or verification success. Treat account verification truthfulness, cross-account draft isolation, contact-step error mapping, header/footer completeness, and visual-browser evidence as release-blocking.

At every failed quality gate: STOP → FIX → VERIFY. Update STATUS.md and the phase report before continuing. Do not label a check PASS if it was not run. Final completion requires a truthful final report, screenshots, tests, documentation, and no unresolved critical defects.

Final user experience target: a first-time user immediately understands WeshBazar, searches in seconds, sees useful and legible listings without scrolling through a category wall, understands price/location/condition/seller context, contacts the seller directly, and can register/post/manage a listing without losing data or seeing another account's information — even on a weak phone and slow connection.

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
- Divar (Iranian classifieds reference; adapt patterns for Afghanistan): https://divar.ir/
- Sheypoor classifieds taxonomy and category discovery: https://www.sheypoor.com/
- eBay marketplace homepage/category hierarchy: https://www.ebay.com/
- eBay official search/filter guidance: https://www.ebay.com/help/Buying/Finding_Items_Managing_Purchases/Search_tips?id=4006
- eBay Playbook — Filtering patterns: https://playbook.ebay.com/design-system/patterns/filtering-patterns
- Baymard Institute — Product Lists UX: https://baymard.com/research/ecommerce-product-lists
- Baymard Institute — Product List UX best practices: https://baymard.com/research-articles/current-state-product-list-and-filtering
- Nielsen Norman Group — Ecommerce search and faceted search: https://www.nngroup.com/reports/ecommerce-ux-search-including-faceted-search/
- Nielsen Norman Group — Helpful filter categories and values: https://www.nngroup.com/articles/filter-categories-values/
- Playwright — Visual comparisons: https://playwright.dev/docs/test-snapshots
- Playwright — Authentication and isolated browser state: https://playwright.dev/docs/auth
- Playwright — Best practices: https://playwright.dev/docs/best-practices
- UI/UX Pro Max — official open-source repository: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- UI/UX Pro Max — skill workflow and design-system generation: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/main/.claude/skills/ui-ux-pro-max/SKILL.md

