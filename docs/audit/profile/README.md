# WeshBazar — Profile / Account / Seller / Privacy & Security Audit

Scope: the complete user profile and account experience across the public seller
profile, private account page, personal listings, favorites, account security,
and all authentication-related states.

This audit is deliberately separate from the administration-panel audit. Findings
here are cross-checked against the backend contract, database schema, and the
frozen OpenAPI document — no endpoints, fields, roles, or metrics are invented.

## Authoritative evidence hierarchy (as applied)

1. Verified runtime behavior and current source code.
2. Database schema, migrations, API implementations, validation, authorization, OpenAPI.
3. `WeshBazar_Frontend_Master_Prompt_V5_EN(1).md` (the V5 build contract).
4. Security/accessibility/usability/performance standards (OWASP ASVS 5.0, WCAG 2.2).
5. External marketplace references (used only as leads, never to invent scope).
6. Prior AI-generated reports (leads only, not proof).

## Repository baseline (recorded at audit start)

- Repo root: `c:\Users\AYDIN\Desktop\WeshBazar`
- Branch: `qwen` · HEAD `dd6ceefb14f75007e72c3b25b4da6154f1bcfb89` · working tree clean.
- Backend: NestJS 12 / Fastify 5 / Prisma 7 / PostgreSQL 17 — **frozen at API v1.0.0**.
- Frontend: Next.js 15.1.6 (App Router) / React 19 / TanStack Query 5 / Tailwind.
- Frontend quality gate (run during this audit):
  - `npm run typecheck` → **PASS** (exit 0).
  - `npm test -- --ci --silent` → **33 suites, 264 tests, 0 failed** (one benign Jest
    worker teardown warning only).
  - Backend reports **450 automated tests** (193 unit + 7 integration + 250 e2e),
    all green per `weshbazar-backend/README.md` (not re-run here — backend frozen).

## Document index

| File | Purpose |
| --- | --- |
| `README.md` | This index: scope, baseline, evidence hierarchy, summary of results. |
| `review-inventory.md` | File-level inventory with review status for every relevant file. |
| `findings.md` | Evidence-based findings with IDs, file/line evidence, impact, remediation. |
| `criteria-register.json` | Machine-readable deduplicated criteria catalogue + statuses. |
| `01-current-state.md` | Deliverable One — verified current-state report. |
| `02-criteria-and-gap-analysis.md` | Deliverable Two — criteria register + gap analysis. |
| `03-target-state-and-implementation-plan.md` | Deliverable Three — target spec + roadmap. |

## Headline result

The profile/account surface is **mature and largely correct**. Server-side
authorization is enforced on every owner-facing mutation (`/me`, `/me/listings`,
`/listings/{id}/*`, `/favorites/*`) via the authenticated `user.id`; public and
private response shapes are cleanly separated by presenter DTOs; the refresh-session
lifecycle is rotation + reuse-detection safe; drafts are user-namespaced and cleared
on logout; and verification is derived only from backend `phoneVerifiedAt`.

The material gaps found are:

- **CACHE-001 (P1)** — incomplete private-cache clearing on the account-page logout,
  "revoke current session", and "logout all" paths (the weaker `clearUserCaches`
  omits `listings`/`contacts`/`analytics`, whose query keys are not user-scoped).
- **CONTRACT-001 (P2)** — `sellerSlug` (OpenAPI + frontend) vs `slug` (backend
  runtime) field-name mismatch breaks the seller page canonical URL (`/seller/undefined`).
- **SESSION-001 (P2)** — the middleware `weshbazar_session` marker cookie is not
  cleared on the account/security sign-out paths (only the header logout clears it).
- **PROFILE-002 (P2)** — ~~`avatarKey` is writable but has no upload workflow, no
  ownership check, and no rendering~~ ✅ **Resolved** — `POST /me/avatar` + `avatarUrl`
  rendered in header, account, seller page and listing seller card.
- **PROFILE-003 (P3)** — no user-facing account deletion/deactivation endpoint exists
  in the frozen v1 contract (product/legal decision required).

No live-exploitable cross-account authorization, verification-spoofing, or
token-storage defect was found. Full detail is in `findings.md`.
## Implementation progress

- **Phase 1 — cache isolation + unified sign-out cleanup: ✅ DONE.**
  - **CACHE-001** — shared `clearUserScopedCaches()` (`src/lib/api/cache.ts`) now runs on every sign-out path.
  - **CACHE-002** — cross-account cache leak mitigated via complete clearing; explicit key user-scoping deferred (documented).
  - **SESSION-001** — `clearSessionCookie()` (`src/lib/api/session-cookie.ts`) now called from `useLogout`/`useSignOutLocal`.
  - Fixed a latent bug: `performLogout` passed the `queryKeys.analytics` object instead of a prefix, so the analytics cache was never cleared.
  - Verification: `typecheck` exit 0 · **34 suites / 265 tests / 0 failed**.
- **Phase 2 (CONTRACT-001 sellerSlug fix)** — ✅ DONE.
  - Standardized field name on `slug` in the backend DTO (`seller-responses.dto.ts`), `docs/openapi.json`, frontend `sellers/types.ts` + `seller/[slug]/page.tsx`.
  - Added a `generateMetadata` regression test (canonical = `/seller/{slug}`).
  - Verification: openapi.json valid + `slug` exposed · frontend typecheck exit 0 · 35 suites / 267 tests / 0 failed · backend typecheck exit 0.
- **Phase 3 — visual polish (first pass)** — ✅ DONE (added on request; TEST-003 Playwright is still blocked by the missing browser harness).
  - Warm gradient canvas, brand-tinted layered shadows (`soft`/`card`/`lift`/`glow`), translucent blurred header, button press feedback, listing-card hover lift, subtle hero reveal — layered on top of the frozen §10–16 tokens.
  - Verification: frontend typecheck exit 0 · 35 suites / 267 tests / 0 failed. Cosmetic only — **not visually verified here (no browser)**; please review live and share visual feedback.
- **Phase 4 (P3 optional items)** — product decisions pending.
- **Phase 5 (avatar — IDENT-005 / PROFILE-002)** — ✅ DONE.
  - `POST /me/avatar` ends the "no upload path" gap; `avatarUrl` flows through `/me`,
    `PublicSellerProfile` and the listing `PublicSellerRef`.
  - `Avatar` renders the photo (initials fallback) in header, account card + nav,
    seller page and listing seller card. OpenAPI regenerated (84 operations).
  - Verification: frontend typecheck 0 · 36 suites / 269 tests · backend typecheck 0 + unit tests.