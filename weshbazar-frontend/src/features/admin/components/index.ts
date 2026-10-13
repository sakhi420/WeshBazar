/**
 * Admin components layer — pages import the view from here.
 *
 * Kept out of the feature barrel (`@/features/admin`) on purpose: the view
 * imports api/hooks/format helpers from that barrel, so re-exporting it there
 * would create an import cycle.
 */

export { AdminDashboardView } from './admin-dashboard-view';
export { AdminListingsView } from './admin-listings-view';
export { AdminReportsView } from './admin-reports-view';
export { AdminUsersView } from './admin-users-view';
export { AdminTaxonomyView } from './admin-taxonomy-view';
