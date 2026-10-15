# Deliverable Two — Criteria Register & Gap Analysis

The machine-readable register lives in `criteria-register.json` (41 criteria).
Each entry carries id, category, subcategory, requirement/rationale, applicability,
expected behavior, status (PASS / PARTIAL / FAIL / NOT VERIFIED / NOT APPLICABLE),
source, file/line evidence, reproduction, severity, priority, remediation,
acceptance, and dependencies.

## Aggregate status

| Status | Count | Meaning |
| --- | --- | --- |
| PASS | 34 | Verified in source (incl. Phases 1–2 fixes). |
| FAIL | 1 | IDENT-005 (avatar — product decision pending). |
| NOT VERIFIED | 6 | CACHE-003, CACHE-005, UX-003, A11Y-002, A11Y-005, TEST-003 (need browser harness). |

**Headline:** the system is strong on authorization, presenter separation, session
lifecycle, verification truth, and draft isolation (all PASS). The material gaps
found at audit time — (a) incomplete cache clearing / non-user-scoped keys on
secondary sign-out paths, and (b) the `sellerSlug`/`slug` contract mismatch — are
now **resolved** (Phases 1–2). Remaining open item is the avatar scope (IDENT-005);
the rest are product/UX decisions or need browser QA.

## 4.1 Identity & profile correctness

- **Solid:** display name + seller name/bio editing, immutable slug, server-derived
  verification, zero fabricated trust metrics (IDENT-001…004 all PASS).
- **Gaps:** `IDENT-005` avatar — writable `avatarKey` without upload/validity/render
  (FAIL). `IDENT-006` `sellerSlug` vs `slug` now **resolved** (Phase 2).
- **No duplicate-identity issue:** uniqueness is `phoneNormalized`; slug allocation
  is collision-safe with deterministic + suffixed fallback (covered by
  `profile.e2e-spec.ts` slug tests).

## 4.2 Authorization & data isolation (OWASP ASVS 5.0 V1/V4/V5)

- **Verified PASS** on: anonymous denial (AUTHZ-001), cross-account listing/favorite
  protection (AUTHZ-002/003), mass-assignment protection (AUTHZ-004), server-side
  enforcement vs UI-hiding (AUTHZ-005).
- **Evidence:** every owner controller receives `@CurrentUser` and filters in service;
  e2e `profile/listings/favorites` suites cover the IDOR cases.
- **No gap found.** Note: `listings.service.ts` and `auth.service.ts` were reviewed at
  controller + e2e + `api-contract-audit.md` level, not line-by-line (recorded in
  review-inventory).

## 4.3 Privacy & public exposure

- **Field-level boundary (verified):** public seller = `slug/displayName/bio/memberSince/
  phoneVerified/activeListingCount`; private `/me` = own id/phone/role/status/avatar/
  seller; public listing excludes moderation/contact/rejection (PRIV-001…003,005 PASS).
- **Refresh token** kept out of JS-readable storage (PRIV-004 PASS; the body copy is
  documented debt — PROFILE-004).
- **Open question:** `avatarKey` classification is "sensitive and excluded" currently,
  but it is writable without ownership validation (IDENT-005) — see target-state matrix.

## 4.4 Cache & account switching

- **PASS:** draft isolation by userId + clear-on-logout (CACHE-004).
- **Resolved (Phase 1):** `clearUserCaches` now clears the full private set via
  `clearUserScopedCaches` (CACHE-001), and cross-account cache reuse is mitigated by
  complete clearing (CACHE-002; explicit key user-scoping deferred).
- **NOT VERIFIED:** full A→B sequence (CACHE-003) and in-flight repopulation
  (CACHE-005) — no Playwright suite exists to assert them.

## 4.5 Profile & account UX

- **PASS:** public/private separation, save/cancel, state handling, session-expiry
  handling, RTL+bidi (UX-001,002,005,006,007).
- **PASS (with caveat):** destructive confirmations (UX-004).
- **NOT VERIFIED:** dirty-state protection on the inline name edit (UX-003) — a
  low-risk, product-decision item.
- **Terminology:** Persian/Dari labels are consistent; phone numbers/URLs/IPs use
  `dir=ltr` + bidi isolation.

## 4.6 Accessibility (WCAG 2.2)

- **PASS (code-level):** labels + error association (A11Y-001), status announcements
  (A11Y-003), autocomplete + no paste blocking (A11Y-004).
- **NOT VERIFIED (need browser/axe):** keyboard completeness + focus-visible
  (A11Y-002), 44px touch targets (A11Y-005).
- No dialogs exist in the profile/security flows, so dialog-focus management is
  NOT APPLICABLE (report dialogs are out of this audit's scope).

## 4.7 Performance & resilience

- **PASS:** RSC for the public seller page, lazy/sized images, cursor pagination
  (PERF-001…003).
- **Observation:** the public seller page `fetchSellerProfileServer` uses
  `revalidate: 60` + `tags: ['sellers']`; `activeListingCount` is computed per-request
  (acceptable at this scale). No heavy deps or unnecessary animations.

## 4.8 Testing

- **PASS:** backend profile/public-seller e2e + `presenter-leak.spec.ts`
  (TEST-001); frontend pure-helper tests (TEST-002); verification consistency
  (TEST-004).
- **NOT VERIFIED:** browser session-regression suite (login/reload, refresh,
  A→B isolation, expired-session-during-submit) — TEST-003. This is the single
  most valuable missing test asset (see roadmap P1).