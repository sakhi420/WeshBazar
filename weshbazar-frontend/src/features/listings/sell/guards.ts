/**
 * Sell wizard — step prerequisites (master prompt §34–§41).
 *
 * Pure navigation math used by the per-step guard: entering a step whose
 * prerequisites are unmet redirects to the earliest unfinished step instead
 * of rendering a broken form. The draft is the only input — the guard
 * component adds auth + hydration checks on top.
 */

import type { SellDraft } from './draft';
import { validateDescription, validatePriceField, validateTitle } from './validation';
import type { SellStepKey } from './sell-steps';

/** True when the basic-info step (condition/title/description/price) is valid. */
export function hasBasicInfo(draft: SellDraft): boolean {
  return (
    draft.condition !== null &&
    validateTitle(draft.title) === null &&
    validateDescription(draft.description) === null &&
    validatePriceField(draft.price, draft.pricingType) === null
  );
}

/**
 * The earliest step whose data is still missing before `step` can render,
 * or null when everything is in place.
 */
export function missingPrerequisite(step: SellStepKey, draft: SellDraft): SellStepKey | null {
  switch (step) {
    case 'start':
    case 'submit':
      return null;
    case 'photos':
    case 'basic':
    case 'attributes':
      return draft.categoryId === null ? 'start' : null;
    case 'location': {
      if (draft.categoryId === null) return 'start';
      return hasBasicInfo(draft) ? null : 'basic';
    }
    case 'contact':
    case 'preview': {
      if (draft.categoryId === null) return 'start';
      if (!hasBasicInfo(draft)) return 'basic';
      return draft.listingId === null ? 'location' : null;
    }
  }
}
