/**
 * Contacts feature — types (master prompt §23, §36).
 * Re-exports the contact DTO mirrors owned by `features/listings`
 * (PublicContactDto / ContactTargetDto) so the reveal flow has one import
 * surface. Shapes come from docs/openapi.json — do not invent fields.
 */

import type { ContactMethodType } from '@/features/listings';

export type { ContactMethodType, ContactTarget, PublicContact } from '@/features/listings';

/** UI order of the ListingContactType enum (contract order, not alphabetical). */
export const CONTACT_METHODS: ContactMethodType[] = ['PHONE', 'WHATSAPP', 'TELEGRAM'];
