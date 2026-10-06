/**
 * Listing state machine (spec §40–§42, §70).
 *
 * Pure transition table — the only place that knows which state changes are
 * legal. The service never writes `status` directly; every mutation resolves
 * its target status through `resolveListingTransition`.
 *
 *   DRAFT → PENDING_REVIEW → ACTIVE → { SOLD, ARCHIVED }
 *   ACTIVE → (expiresAt reached) ARCHIVED — system job (§70)
 *   DRAFT → (stale) ARCHIVED — system job (§69, §164)
 *   PENDING_REVIEW → REJECTED → (edit) DRAFT
 *   ARCHIVED → (explicit republish flow) DRAFT
 *
 * ACTIVE is also reachable directly from DRAFT/REJECTED on submit when the
 * category is AUTO_APPROVE; material edits of an ACTIVE listing in a
 * REVIEW_REQUIRED category route back through PENDING_REVIEW (§42).
 */
import type { ListingStatus, ModerationMode } from '../../generated/prisma/enums';

/** Explicit application commands (never a generic status assignment). */
export type ListingAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'EDIT'
  | 'MARK_SOLD'
  | 'ARCHIVE'
  | 'RENEW'
  | 'ADMIN_ARCHIVE'
  | 'ADMIN_RESTORE'
  | 'EXPIRE'
  | 'ARCHIVE_STALE_DRAFT';

export interface TransitionRequest {
  action: ListingAction;
  status: ListingStatus;
  /** Needed for SUBMIT/EDIT (category moderation mode decides the target). */
  moderationMode?: ModerationMode;
  /** For EDIT: whether the patch touches moderation-relevant fields (§42). */
  materialChanges?: boolean;
}

/** Fields whose change is a material change under the edit policy (§42). */
export const MATERIAL_CHANGE_FIELDS = [
  'title',
  'description',
  'price',
  'pricingType',
  'currency',
  'negotiable',
  'condition',
  'categoryId',
  'provinceId',
  'cityId',
  'attributes',
  'contactMethods',
] as const;

/**
 * Returns the target status, or null when the action is not allowed from the
 * current state. Callers translate null into `LISTING_INVALID_TRANSITION` /
 * `LISTING_EDIT_NOT_ALLOWED`.
 */
export function resolveListingTransition(request: TransitionRequest): ListingStatus | null {
  const { action, status, moderationMode, materialChanges } = request;

  switch (action) {
    case 'SUBMIT':
      if (status !== 'DRAFT' && status !== 'REJECTED') {
        return null;
      }
      return moderationMode === 'AUTO_APPROVE' ? 'ACTIVE' : 'PENDING_REVIEW';

    case 'APPROVE':
      return status === 'PENDING_REVIEW' ? 'ACTIVE' : null;

    case 'REJECT':
      return status === 'PENDING_REVIEW' ? 'REJECTED' : null;

    case 'MARK_SOLD':
      return status === 'ACTIVE' ? 'SOLD' : null;

    case 'ARCHIVE':
      return status === 'ACTIVE' ? 'ARCHIVED' : null;

    case 'ADMIN_ARCHIVE':
      // Admin takedown of a live listing (§58, §106). Pending listings are
      // handled through REJECT; the owner's republish flow still applies.
      return status === 'ACTIVE' ? 'ARCHIVED' : null;

    case 'ADMIN_RESTORE':
      // Reverses an admin/owner archive; publication checks (caps, expiry)
      // are re-applied by the service.
      return status === 'ARCHIVED' ? 'ACTIVE' : null;

    case 'RENEW':
      // Active listings extend their runway; archived ones republish by
      // returning to DRAFT for a fresh review cycle (§40, §70).
      if (status === 'ACTIVE') {
        return 'ACTIVE';
      }
      return status === 'ARCHIVED' ? 'DRAFT' : null;

    case 'EXPIRE':
      // System job (§70, §164): the listing consumed its runway, so it is
      // archived. Only ACTIVE listings run out of runway; anything else is a
      // stale candidate row that must be skipped.
      return status === 'ACTIVE' ? 'ARCHIVED' : null;

    case 'ARCHIVE_STALE_DRAFT':
      // System job (§69, §164): abandoned drafts are archived so they do not
      // linger forever. The owner can still republish from ARCHIVED.
      return status === 'DRAFT' ? 'ARCHIVED' : null;

    case 'EDIT':
      if (status === 'DRAFT') {
        return 'DRAFT';
      }
      if (status === 'REJECTED') {
        return 'DRAFT';
      }
      if (status === 'ACTIVE') {
        // Material edits re-enter moderation where the category requires it.
        return moderationMode === 'REVIEW_REQUIRED' && materialChanges === true
          ? 'PENDING_REVIEW'
          : 'ACTIVE';
      }
      return null;
  }
}

/** Statuses whose content the owner may still change through `EDIT`. */
export const EDITABLE_STATUSES: readonly ListingStatus[] = ['DRAFT', 'REJECTED', 'ACTIVE'];

/**
 * Statuses whose gallery the owner may still change. Broader than
 * `EDITABLE_STATUSES`: image uploads arrive one file at a time, so a listing
 * that just re-entered PENDING_REVIEW after its first new image must accept
 * the rest of the batch — otherwise every multi-image edit dead-ends.
 */
export const IMAGE_MUTABLE_STATUSES: readonly ListingStatus[] = [
  'DRAFT',
  'REJECTED',
  'ACTIVE',
  'PENDING_REVIEW',
];
