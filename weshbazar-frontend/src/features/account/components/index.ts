/**
 * Account components layer — pages import the view from here.
 *
 * Kept out of the feature barrel (`@/features/account`) on purpose: the view
 * imports api/hooks/format helpers from that barrel, so re-exporting it there
 * would create an import cycle.
 */

export { AccountView } from './account-view';
export { SecurityView } from './security-view';
