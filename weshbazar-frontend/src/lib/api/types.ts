/**
 * API envelope + pagination types.
 * Source of truth: weshbazar-backend/docs/frontend-api-contract.md (§4, §6)
 * and docs/openapi.json. These mirror the frozen backend contract — do not
 * invent fields.
 */

/** `{ field, message }` entries present on VALIDATION_ERROR (and some 422s). */
export interface ApiFieldError {
  field: string;
  message: string;
}

/** Success envelope: `{ success: true, data, meta?, requestId }`. */
export interface ApiSuccessEnvelope<TData, TMeta = unknown> {
  success: true;
  data: TData;
  meta?: TMeta;
  requestId: string;
}

/** Error envelope: `{ success: false, error: { code, message, details? }, requestId }`. */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

export type ApiEnvelope<TData, TMeta = unknown> =
  | ApiSuccessEnvelope<TData, TMeta>
  | ApiErrorEnvelope;

/** Cursor pagination (public discovery) — frontend-api-contract.md §6.1. */
export interface CursorMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
  /** Exact match count (discovery feeds); absent on non-discovery cursors. */
  total?: number;
}

/** Page pagination (admin queues) — frontend-api-contract.md §6.2. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Normalized cursor page consumed by the UI (backend-agnostic). */
export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Exact match count when the server provides one (discovery feeds). */
  total?: number;
}

/** Normalized offset page consumed by the UI. */
export interface PageResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/** Discovery sort options (GET /listings) — frontend-api-contract.md §7. */
export type ListingSort = 'newest' | 'price_asc' | 'price_desc' | 'most_viewed';

/** ListingCondition enum (prisma/schema.prisma) accepted by the discovery filter. */
export type ListingCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';

/** ListingStatus enum (prisma/schema.prisma). The backend is authoritative. */
export type ListingStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SOLD'
  | 'ARCHIVED';
