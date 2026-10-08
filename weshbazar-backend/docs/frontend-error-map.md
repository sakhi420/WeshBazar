# Frontend Error Map — WeshBazar API v1

> **Audience:** frontend engineers. **Source of truth:** `apps/api/src/common/errors/error-codes.ts`.
> **Status:** Frozen at API v1.0.0. The error `code` strings are stable and machine-readable; the
> human-readable `message` may change or be localized later — **always branch on `error.code`, never on `message`**.

## 1. Error envelope

Every error response uses the standard envelope. HTTP status matches the code (see table).

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload contains invalid fields.",
    "details": [{ "field": "password", "message": "password must be longer than or equal to 8 characters" }]
  },
  "requestId": "8f3c..."
}
```

- `error.code` — **stable**, branch on this.
- `error.message` — safe to show as a fallback, but prefer a frontend-owned copy for known codes.
- `error.details` — present only on `VALIDATION_ERROR` (and a few 422 business rules); array of
  `{ field, message }` for inline form binding. Field paths are dot/bracket notation (`images.0.url`).
- `requestId` — echo of the `x-request-id` response header. Surface it on fatal screens so support can trace.

## 2. Global handling rules

| Signal | Action |
| --- | --- |
| HTTP `401` + `TOKEN_EXPIRED` | Silently call `POST /api/v1/auth/refresh` once (cookie sent automatically). On success, replay the original request. On refresh failure → clear session, route to `/login`. |
| HTTP `401` + any other auth code (`TOKEN_INVALID`, `SESSION_REVOKED`, `SESSION_REUSE_DETECTED`, `REFRESH_TOKEN_*`) | Do **not** retry refresh. Clear local session immediately, route to `/login` with a toast. |
| HTTP `429` + `RATE_LIMITED` | Stop auto-retry. Show "Try again in a moment" with a countdown if `Retry-After` header is present. |
| HTTP `5xx` (`INTERNAL_ERROR`, `SERVICE_UNAVAILABLE`, `MEDIA_STORAGE_FAILED`) | Retry idempotent GETs once with backoff. Never auto-retry non-idempotent writes. |
| `NETWORK` / no response | Retry GETs up to 2× with exponential backoff; show offline banner. |
| `VALIDATION_ERROR` | Bind `error.details` to form fields (see §4). Do not show a global toast when details exist. |
| Any code not in the catalog | Treat as `INTERNAL_ERROR`; log `code` + `requestId` to telemetry. |

## 3. Error-code catalog → frontend action

### 3.1 Generic / transport

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `VALIDATION_ERROR` | 400 | No | Inline field binding (§4). |
| `BAD_REQUEST` | 400 | No | Generic toast "Something's wrong with the request." |
| `UNAUTHORIZED` | 401 | Refresh once | If not token-related, prompt sign-in. |
| `FORBIDDEN` | 403 | No | "You don't have permission to do this." Hide the action. |
| `NOT_FOUND` | 404 | No | Show empty/404 state for the resource. |
| `METHOD_NOT_ALLOWED` | 405 | No | Dev bug — log to telemetry; show generic error. |
| `CONFLICT` | 409 | No | See specific code; usually "refresh and retry" prompt. |
| `PAYLOAD_TOO_LARGE` | 413 | No | "File is too large." |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | No | "This file type isn't supported." |
| `UNPROCESSABLE_ENTITY` | 422 | No | Business rule message; usually show inline or toast per code. |
| `RATE_LIMITED` | 429 | After delay | Countdown + "Try again later." Respect `Retry-After`. |
| `INTERNAL_ERROR` | 500 | GET once | "Something went wrong." Show `requestId`. |
| `SERVICE_UNAVAILABLE` | 503 | GET once | "We're briefly unavailable." Retry GETs. |

### 3.2 Authentication & account

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `INVALID_CREDENTIALS` | 401 | No | Inline: "Wrong phone or password." |
| `TOKEN_EXPIRED` | 401 | Refresh once | Silent refresh + replay (see §2). |
| `TOKEN_INVALID` | 401 | No | Clear session → `/login`. |
| `REFRESH_TOKEN_MISSING` | 401 | No | Clear session → `/login`. |
| `REFRESH_TOKEN_INVALID` | 401 | No | Clear session → `/login`. |
| `SESSION_REVOKED` | 401 | No | "You've been signed out elsewhere." → `/login`. |
| `SESSION_REUSE_DETECTED` | 401 | No | "Your session was revoked for security." → `/login`. |
| `SESSION_NOT_FOUND` | 404 | No | Clear session → `/login`. |
| `PHONE_ALREADY_REGISTERED` | 409 | No | Inline on register form: "This phone is already registered." Offer login link. |
| `INVALID_PHONE_NUMBER` | 400 | No | Inline phone field. |
| `PHONE_UNCHANGED` | 400 | No | Inline on change-phone form. |
| `PHONE_NOT_VERIFIED` | 403 | No | Block publish; prompt "Verify your phone first." |
| `WEAK_PASSWORD` | 400 | No | Inline password meter / policy hints. |
| `CURRENT_PASSWORD_INCORRECT` | 400 | No | Inline current-password field. |
| `ACCOUNT_LOCKED` | 403 | After delay | "Account temporarily locked. Try again later." |
| `ACCOUNT_NOT_ACTIVE` | 403 | No | "Your account isn't active." Contact support. |
| `OTP_INVALID` | 400 | Yes (re-enter) | Inline code field: "Incorrect code." |
| `OTP_EXPIRED` | 400 | Resend | "Code expired." Show resend button. |
| `OTP_MAX_ATTEMPTS_EXCEEDED` | 429 | Resend | "Too many tries. Request a new code." |
| `OTP_RESEND_TOO_SOON` | 429 | After cooldown | "Wait a moment before resending." Start cooldown timer. |
| `OTP_DELIVERY_FAILED` | 503 | Retry send | "Couldn't send the code. Try again." |
| `PASSWORD_RESET_TOKEN_INVALID` | 400 | No | "Reset link is invalid." → forgot-password. |
| `PASSWORD_RESET_TOKEN_EXPIRED` | 400 | No | "Reset link expired." → forgot-password. |


### 3.3 Users / seller accounts

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `USER_NOT_FOUND` | 404 | No | 404 profile state. |
| `SELLER_ACCOUNT_NOT_FOUND` | 404 | No | Prompt "Create your seller profile." |
| `SELLER_ACCOUNT_ALREADY_EXISTS` | 409 | No | Redirect to existing seller profile editor. |
| `SELLER_SLUG_TAKEN` | 409 | No | Inline slug field: "This address is taken." |
| `SELLER_ACCOUNT_NOT_OWNED` | 403 | No | Hide edit controls. |

### 3.4 Taxonomy (categories / attributes)

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `CATEGORY_NOT_FOUND` | 404 | No | 404 / picker fallback. |
| `CATEGORY_SLUG_TAKEN` | 409 | No | Admin: inline slug field. |
| `CATEGORY_CYCLE_DETECTED` | 409 | No | Admin: "That parent would create a loop." |
| `CATEGORY_HAS_CHILDREN` | 409 | No | Admin: "Remove child categories first." |
| `CATEGORY_HAS_LISTINGS` | 409 | No | Admin: "This category is in use by listings." |
| `CATEGORY_NOT_LEAF` | 400 | No | Listing form: "Pick a final-level category." |
| `CATEGORY_INACTIVE` | 422 | No | Listing form: "This category is unavailable." |
| `ATTRIBUTE_NOT_FOUND` | 404 | No | Admin 404. |
| `ATTRIBUTE_KEY_TAKEN` | 409 | No | Admin: inline key field. |
| `ATTRIBUTE_OPTION_NOT_FOUND` | 404 | No | Admin 404. |
| `ATTRIBUTE_OPTION_VALUE_TAKEN` | 409 | No | Admin: inline option value. |
| `ATTRIBUTE_IN_USE` | 409 | No | Admin: "Attribute is in use; can't change." |
| `REQUIRED_ATTRIBUTE_MISSING` | 400 | No | Listing form: highlight the missing required attribute. |
| `INVALID_ATTRIBUTE_VALUE` | 400 | No | Listing form: inline attribute value. |

### 3.5 Locations

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `PROVINCE_NOT_FOUND` | 404 | No | Location picker fallback. |

### 3.7 Media

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `MEDIA_NOT_FOUND` | 404 | No | Remove broken image tile. |
| `MEDIA_NOT_OWNED` | 403 | No | Hide delete/reorder. |
| `MEDIA_ALREADY_LINKED` | 409 | No | Refresh image list. |
| `INVALID_IMAGE` | 400 | No | Upload tile: "Not a valid image." |
| `IMAGE_TOO_LARGE` | 413 | No | Upload tile: "Image too large (max 5 MB)." |
| `IMAGE_DIMENSIONS_TOO_LARGE` | 400 | No | Upload tile: "Image too large (max 25 MP)." |
| `UNSUPPORTED_IMAGE_TYPE` | 415 | No | Upload tile: "Use JPEG, PNG, or WebP." |
| `MEDIA_STORAGE_FAILED` | 500 | Retry once | Upload tile: "Upload failed. Try again." |

### 3.8 Contact methods / favorites / reports

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `CONTACT_METHOD_NOT_FOUND` | 404 | No | Remove row. |
| `CONTACT_METHOD_ALREADY_EXISTS` | 409 | No | Inline: "Already added." |
| `CONTACT_METHOD_LIMIT_REACHED` | 409 | No | Disable add button. |
| `FAVORITE_ALREADY_EXISTS` | 409 | No | Set favorite state to active. |
| `FAVORITE_NOT_FOUND` | 404 | No | Set favorite state to inactive. |
| `REPORT_NOT_FOUND` | 404 | No | Admin 404. |
| `REPORT_ALREADY_OPEN` | 409 | No | "You already reported this listing." |
| `REPORT_NOT_OPEN` | 409 | No | Refresh reports list. |
| `CANNOT_REPORT_OWN_LISTING` | 400 | No | Hide report button on own listings. |

### 3.9 Admin / moderation / idempotency


## 4. Field-level validation (`VALIDATION_ERROR`)

When `error.code === 'VALIDATION_ERROR'`, bind `error.details[]` directly to the form. Each entry is
`{ field, message }`. Recommended mapping:

```ts
// react-hook-style pseudo
for (const { field, message } of error.details ?? []) {
  setError(field, { type: 'server', message }); // supports "images.0.url"
}
```

- **Do not** also fire a global toast when `details` is non-empty — duplicate messaging is noisy.
- Field paths mirror the request body exactly (including array indices).
- If a `details` entry's `field` does not map to a visible input (rare), fall back to a toast with `message`.

## 5. Retry policy summary

| Code family | Auto-retry? | Strategy |
| --- | --- | --- |
| `TOKEN_EXPIRED` | Yes, once | Silent refresh + replay. |
| `5xx` (server) | Yes, GET only | 1 retry, 500 ms backoff. |
| `429` | No (auto) | Surface countdown; respect `Retry-After`. |
| `OTP_*` / network | Per code above | Limited manual retry. |
| All other 4xx | No | Inline / toast. |

> **Non-idempotent writes** (`POST`, `PATCH`, `DELETE`) must never be auto-retried on 5xx without an
> `Idempotency-Key` header. Listing create, contact reveal, report submit, and image upload accept
> `Idempotency-Key` to make retries safe — send a client-generated UUID and cache the response.

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `MODERATION_ACTION_NOT_ALLOWED` | 409 | No | Refresh queue; disable action. |
| `USER_MODERATION_FORBIDDEN` | 403 | No | "This account can't be moderated." |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | No | Client bug — ensure `Idempotency-Key` header is sent. |
| `IDEMPOTENCY_CONFLICT` | 409 | No | "A previous request with this key is in progress/finished." Surface stored result if cached. |

| `CITY_NOT_FOUND` | 404 | No | Location picker fallback. |
| `CITY_PROVINCE_MISMATCH` | 400 | No | Listing form: reset city when province changes. |
| `PROVINCE_CODE_TAKEN` | 409 | No | Admin: inline code. |
| `PROVINCE_SLUG_TAKEN` | 409 | No | Admin: inline slug. |
| `CITY_SLUG_TAKEN` | 409 | No | Admin: inline slug. |
| `PROVINCE_IN_USE` | 409 | No | Admin: "Province has cities/listings." |
| `CITY_IN_USE` | 409 | No | Admin: "City has listings." |
| `LOCATION_INACTIVE` | 422 | No | Listing form: "This location is unavailable." |

### 3.6 Listings

| Code | HTTP | Retryable | Frontend action |
| --- | --- | --- | --- |
| `LISTING_NOT_FOUND` | 404 | No | 404 detail page. |
| `LISTING_NOT_OWNED` | 403 | No | Hide owner actions. |
| `LISTING_INVALID_TRANSITION` | 409 | No | Refresh listing state; disable the action. |
| `LISTING_EDIT_NOT_ALLOWED` | 409 | No | "This listing can't be edited in its current state." |
| `LISTING_NOT_ACTIVE` | 409 | No | Disable renew/contact actions. |
| `LISTING_LIMIT_REACHED` | 409 | No | "You've reached your active listing limit." |
| `LISTING_REVISION_NOT_FOUND` | 404 | No | Hide revision view. |
| `LISTING_VERSION_CONFLICT` | 409 | Yes (refresh) | "This listing changed. Reload and retry." |
| `LISTING_IMAGE_LIMIT_REACHED` | 409 | No | Disable image upload; show limit. |
