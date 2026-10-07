# WeshBazar API — Contract Changelog

> Freeze discipline for the WeshBazar REST API contract.
> Every future contract change **MUST** be recorded here before it is merged
> (see `.devin/rules/api-contract.md` §278).
>
> The API is versioned; the frontend binds to a `Runtime Version` (`v1`) exposed
> in the URL prefix `/api/v1`.

## Version ledger

| Contract | Runtime | OpenAPI | Freeze date | Notes |
| --- | --- | --- | --- | --- |
| `1.0.0` | `v1` | `3.0.0` (generated) | 2026-10-06 | Initial contract freeze — 83 endpoints, 94 error codes. |

## Changelog

### 1.0.0 — Initial contract freeze (2026-10-06)

- **What changed:** The complete public API surface is frozen as the baseline
  frontend contract: base URL `http://localhost:3000/api/v1`, 83 endpoints
  (health, auth, sellers, me/users, categories, locations, listings, media,
  favorites, reports, admin), the standard success envelope
  `{ success, data|error, meta?, requestId }`, a 94-code centralized error
  catalog, cursor pagination for public feeds + page pagination for admin
  lists, and HttpOnly-cookie refresh-token authentication with JWT bearer
  access tokens.
- **Why:** First stable contract handed to the frontend agent so it can build
  without guessing endpoint names, request/response shapes, auth behavior,
  error handling, search grammar, or pagination.
- **Breaking?** No — this is the baseline.
- **Frontend impact:** None — the frontend consumes this version from day one.
- **Migration:** N/A.

---

## Template for future entries

Copy this block for each future change. Keep `breaking` and `migration`
explicit — they drive how the frontend schedules its own updates.

```markdown
### <semver> — <short title> (<ISO date>)

- **What changed:** <describe the contract delta + affected endpoint(s)/fields>
- **Why:** <reason the change was necessary>
- **Breaking?** yes | no
- **Frontend impact:** <how existing consumers are affected>
- **Migration:** <step-by-step what the frontend must change to adopt>
```