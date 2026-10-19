# WeshBazar Frontend

Mobile-first, RTL (fa-AF) C2C marketplace frontend for WeshBazar, built strictly
against the **frozen** backend API (v1.0.0).

- UI language: Persian/Dari · direction: RTL.
- The backend HTTP contract is authoritative; the frontend never invents
  endpoints or features (see `../AGENTS.md`).

## Authoritative sources

| Source | Purpose |
| --- | --- |
| `../AGENTS.md` | Ground rules: frozen API, RTL/fa, no unsupported features |
| `../WeshBazar_Frontend_Master_Prompt_V5_EN(1).md` | Frontend build contract (§ references) |
| `../weshbazar-backend/docs/openapi.json` | HTTP contract — wins over everything for shapes |

## Stack

Next.js App Router (React 19) · TypeScript (strict) · Tailwind CSS · shadcn/ui ·
TanStack Query · native `fetch` · React Hook Form · Zod · nuqs (URL state) ·
Lucide React · Jest + React Testing Library.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3001
```

The backend is expected at `http://localhost:3000` (see `.env.example`). Public
pages degrade to honest empty/error states when the API is unreachable — they
never fabricate data.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run analyze` | Build with the bundle analyzer |
| `npm run lint` | ESLint (`next lint`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` | Prettier write |
| `npm run format:check` | Prettier check |
| `npm test` | Jest (jsdom + RTL) |
| `npm run test:watch` | Jest watch mode |

## Project structure

```text
src/
  app/           # App Router: layouts, pages, error/loading/not-found
  components/    # brand, layout, feedback, discovery, listings, location, ui, auth
  features/      # auth, listings, search, categories, locations, sellers,
                 # favorites, reports, contacts, media, account, admin
  lib/
    api/         # THE HTTP boundary: client, server, browser, errors, cache,
                 # token-store, query-keys, types
    i18n/        # locale/direction config
    env.ts       # typed env access
    utils.ts     # cn()
  config/        # site.ts, brand.ts
public/brand/    # official logo/mark/favicon assets (copied verbatim §9)
docs/frontend-execution/  # audit + phased remediation + STATUS.md
```

## API client boundary

All HTTP goes through `@/lib/api`. UI never calls `fetch` directly.

- **Base URL + prefix**: `apiUrl()` composes `API_BASE_URL` + `/api/v1`.
- **Cookies**: every request sends `credentials: 'include'` for the HttpOnly
  refresh cookie.
- **Access token**: held **in memory only** (`token-store.ts`) — never in
  localStorage/sessionStorage/URL/logs.
- **Single-flight refresh**: on `401 TOKEN_EXPIRED`, refresh once and replay once.
- **Errors**: non-2xx and transport failures throw a typed `ApiError`
  (`code`, `status`, `requestId`, `retryAfterSeconds`); branch on `code`, never
  `message`.
- **Pagination**: `getCursorPage()` (discovery) and `getPage()` (admin queues).
- **Server reads**: `serverGet()` / `serverGetCursorPage()` for RSC.

## Conventions

- RTL: logical utilities (`ps-*`/`pe-*`, `start`/`end`), `.bidi-isolate` /
  `.bidi-ltr` helpers for phone/URL/code strings; flip only directional icons.
- Design tokens only — no raw hex (§10–16).
- Teal is the action family; orange (`accent`) is reserved for Sell / Post Listing.
- Font: `next/font/google` Vazirmatn.