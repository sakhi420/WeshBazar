/**
 * Favorites components layer — pages and shared cards import from here.
 * Kept out of the feature barrel for the same cycle-avoidance reason as auth:
 * the components import data helpers from `@/features/favorites`.
 */

export { FavoriteButton, type FavoriteButtonProps } from './favorite-button';
export { FavoritesView } from './favorites-view';
