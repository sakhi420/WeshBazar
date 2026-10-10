# WeshBazar Frontend

Mobile-first, RTL (fa-AF) C2C marketplace frontend for WeshBazar, built strictly
against the **frozen** backend API (v1.0.0).

This is the initial **scaffold** increment: project configuration, design tokens,
RTL/fa-AF setup, the API client boundary, the app shell, and the route skeleton.
Page-level features (search, listing detail, sell flow, admin, …) are stubbed with
honest placeholders and implemented in later increments.

## Authoritative sources

- `../WeshBazar_Frontend_Master_Prompt_V4_EN.md` — the frontend build contract (§ references below).
- `../AGENTS.md` — ground rules (backend frozen, never invent endpoints, RTL/fa, no unsupported features).
- `../weshbazar-backend/docs/frontend-api-contract.md` — transport, auth, envelopes, pagination.
- `../weshbazar-backend/docs/frontend-error-map.md` — stable `error.code` catalog → frontend action.
- `../weshbazar-backend/docs/openapi.json` — the HTTP contract; wins over everything for shapes.
- `docs/implementation-status.md` — durable progress record: which page contracts are done, what remains.

## Stack (§4)

Next.js App Router · React 19 · TypeScript (strict) · Tailwind CSS · shadcn/ui ·
TanStack Query · native `fetch` · React Hook Form · Zod · nuqs (URL state) ·
Lucide React · Jest + React Testing Library.

## Getting started

```bash
cp .env.example .env.local   # already created during scaffolding
npm install
npm run dev                  # http://localhost:3001
```

The backend is expected at `http://localhost:3000` (see `.env.example`). Public
pages degrade to honest empty/error states when the API is unreachable — they
never fabricate data.

### Scripts

| Script              | Purpose                    |
| ------------------- | -------------------------- |
| `npm run dev`       | Dev server on port 3001    |
| `npm run build`     | Production build           |
| `npm run start`     | Serve the production build |
| `npm run lint`      | ESLint (`next lint`)       |
| `npm run typecheck` | `tsc --noEmit`             |
| `npm run format`    | Prettier write             |
| `npm test`          | Jest (jsdom + RTL)         |

## Project structure

```text
src/
  app/                     # App Router: layouts, pages, error/loading/not-found
    layout.tsx             # Root: lang=fa-AF dir=rtl, Vazirmatn, Providers, header
    page.tsx               # Home (§20) — search-first + real categories feed
    providers.tsx          # Client boundary: TanStack Query + nuqs adapter
    globals.css            # Design tokens (HSL vars) + base/utilities
    (search|category|listing|seller|auth|favorites|my-listings|account|sell|admin)/
  components/
    brand/                 # BrandLogo — uses the official vector assets (§9)
    layout/                # SiteHeader, PageContainer, PageHeading, RouteScaffold
    feedback/              # EmptyState, ErrorState, Skeleton (§17–19, §48)
    ui/                    # shadcn/ui primitives (Button, …)
  features/                # auth, listings, search, categories, locations,
                           # sellers, favorites, reports, contacts, media,
                           # account, admin  (§6)
  lib/
    api/                   # THE HTTP boundary (§6): client, server, browser,
                           # errors, token-store, query-keys, types
    i18n/config.ts         # locale/direction config (§8)
    env.ts                 # typed env access
    utils.ts               # cn()
  config/
    site.ts                # site metadata (Persian copy)
    brand.ts               # canonical brand asset paths (§9)
public/brand/              # official logo/mark/favicon assets (copied, never redrawn)
```

## API client boundary (§6, §7)

All HTTP goes through `@/lib/api`. UI never calls `fetch` directly.

- **Base URL + prefix**: `apiUrl()` composes `API_BASE_URL` + `/api/v1`.
- **Cookies**: every request sends `credentials: 'include'` so the HttpOnly
  refresh cookie round-trips.
- **Request id**: `x-request-id` is generated per request.
- **Access token**: stored **in memory only** (`token-store.ts`) — never
  localStorage/sessionStorage/URL/logs.
- **Single-flight refresh**: on `401 TOKEN_EXPIRED`, refresh once, replay once;
  concurrent callers share one refresh. On terminal 401 codes the session is
  cleared (see `ApiError.isSessionTerminal`).
- **Errors**: non-2xx and transport failures throw a typed `ApiError` carrying
  `code`, `status`, `requestId`, `details`, `retryAfterSeconds`. Branch on
  `code`, never on `message`.
- **Pagination**: `getCursorPage()` (discovery) and `getPage()` (admin queues)
  normalize the two backend shapes.
- **Server reads**: `serverGet()` for React Server Components with Next cache
  hints (`revalidate` / `tags`).

## Design tokens (§10–16)

Brand colors, radii, spacing, type scale, touch baselines, motion durations, and
z-index live in `tailwind.config.ts` + `globals.css` as semantic tokens. Colors
are HSL channel triplets so opacity modifiers (`bg-primary/10`) work. Use tokens
(`bg-primary`, `text-foreground`, `rounded-card`, `h-control`, `text-ui`, …),
not raw hex.

- Teal is the action family; orange (`accent`) is reserved for high-attention
  marketplace actions such as Sell / Post Listing.
- RTL: use logical utilities (`ps-*`/`pe-*`, `ms-*`/`me-*`, `start`/`end`), the
  `.bidi-isolate` / `.bidi-ltr` helpers for phone/URL/code strings, and flip only
  directional icons.

## Key decisions

- **Scaffolded manually** (not `create-next-app`) for a deterministic, reviewable
  tree that matches the contract's folder layout (§6) exactly.
- **Font**: `next/font/google` Vazirmatn for now (§12). Swap to `next/font/local`
  once the font files are vendored into the repo for self-hosting.
- **Brand assets**: copied verbatim from the backend brand kit into
  `public/brand/`. The logo is rendered with `next/image` (`unoptimized` for SVG);
  it is never redrawn or approximated (§9).
- **Honest placeholders**: unbuilt routes render `RouteScaffold`, which states the
  page is pending and records its contract route/purpose. No fake listings/data.
- **ESLint 8 + `.eslintrc.json`** (classic config) paired with `eslint-config-next`
  for stability; Prettier handles formatting (class sorting via the Tailwind plugin).

## Not in this increment

Individual page contracts (§20–51), the sell flow, admin UI, auth wiring, image
gallery, filter drawer, toasts, Playwright/axe suites, and OpenAPI-generated
types. These land in subsequent increments on top of this boundary.
