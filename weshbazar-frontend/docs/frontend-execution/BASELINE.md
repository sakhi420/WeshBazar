# Baseline

## Repository state

- Working directory used for implementation: `weshbazar-frontend/`
- Parent workspace Git state shows `weshbazar-frontend/` as untracked from the parent root; no separate clean frontend Git root was detected during this pass
- Existing durable project summary already present in `docs/implementation-status.md`

## Stack and scripts

- Framework: Next.js `15.1.6`
- React: `19.0.0`
- TypeScript: strict
- Styling: Tailwind CSS
- Test runner: Jest + React Testing Library
- Core scripts:
  - `npm run dev`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `npm run build`

## Source of truth

- Backend contract: `../weshbazar-backend/docs/openapi.json`
- Workspace rules: `../AGENTS.md`
- Previous frontend status map: `docs/implementation-status.md`
- Current build contract: `../WeshBazar_Frontend_Master_Prompt_V5_EN(1).md`

## Confirmed implementation facts

- Root layout already uses `lang=fa-AF` and `dir=rtl`
- Public shell previously had a shared header but no shared footer in the root layout
- Home page is category-first and search-first, but does not yet satisfy the full V5 homepage contract for location context and listing-first above-the-fold evidence
- Current docs still reference V4; V5 execution tracking was missing before this pass

## Baseline checks run

- `npm run typecheck` -> PASS
- `npm run lint` -> PASS
- `npm test` -> PASS (`15` suites, `179` tests)
- `npm run build` -> PASS

## Key route inventory

- Public: `/`, `/search`, `/category/[slug]`, `/listing/[slug]`, `/seller/[slug]`
- Auth/account: `/auth/*`, `/favorites`, `/my-listings`, `/account`, `/account/security`
- Sell: `/sell/*`, `/sell/[id]/edit`
- Admin: `/admin`, `/admin/listings`

## Known gaps from the first V5 read

- Browser screenshot evidence not yet stored
- No dedicated V5 visual QA records yet
- Homepage and shared shell still need a contract-level visual review against V5 sections for header, footer, search, categories, and first viewport density
- V5 references UI/UX Pro Max workflow, but that skill is not currently installed in the available skill set
