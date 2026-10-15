/**
 * Centralized TanStack Query key factory (master prompt §6, §32).
 * Keeping keys in one place makes cache invalidation after mutations precise
 * and avoids stringly-typed keys scattered across features.
 */

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
    sessions: ['auth', 'sessions'] as const,
  },

  account: {
    all: ['account'] as const,
    profile: ['account', 'profile'] as const,
  },

  categories: {
    all: ['categories'] as const,
    list: ['categories', 'list'] as const,
    tree: ['categories', 'tree'] as const,
    bySlug: (slug: string) => ['categories', 'bySlug', slug] as const,
    filterSchema: (id: string) => ['categories', 'filterSchema', id] as const,
  },

  locations: {
    all: ['locations'] as const,
    provinces: ['locations', 'provinces'] as const,
    cities: (provinceId: string) => ['locations', 'cities', provinceId] as const,
  },

  listings: {
    all: ['listings'] as const,
    discovery: (params: unknown) => ['listings', 'discovery', params] as const,
    detail: (slug: string) => ['listings', 'detail', slug] as const,
    mine: (params: unknown) => ['listings', 'mine', params] as const,
    /** Owner single-listing read (`GET /me/listings/:id`) — sell wizard + preview. */
    owner: (id: string) => ['listings', 'owner', id] as const,
    revisions: (id: string) => ['listings', 'revisions', id] as const,
  },

  sellers: {
    all: ['sellers'] as const,
    profile: (slug: string) => ['sellers', 'profile', slug] as const,
  },

  favorites: {
    all: ['favorites'] as const,
    /** Prefix of every favorites list query — targeted invalidation without the ids cache. */
    listRoot: ['favorites', 'list'] as const,
    list: (params: unknown) => ['favorites', 'list', params] as const,
    ids: ['favorites', 'ids'] as const,
  },

  reports: {
    all: ['reports'] as const,
  },

  contacts: {
    all: ['contacts'] as const,
    revealed: (listingId: string) => ['contacts', 'revealed', listingId] as const,
  },

  analytics: {
    all: ['analytics'] as const,
    sellerSummary: ['analytics', 'seller', 'summary'] as const,
  },

  admin: {
    all: ['admin'] as const,
    dashboard: ['admin', 'dashboard'] as const,
    summary: ['admin', 'analytics', 'summary'] as const,
    users: (params: unknown) => ['admin', 'users', params] as const,
    user: (id: string) => ['admin', 'users', id] as const,
    listings: (params: unknown) => ['admin', 'listings', params] as const,
    listing: (id: string) => ['admin', 'listings', id] as const,
    reports: (params: unknown) => ['admin', 'reports', params] as const,
    auditLogs: (params: unknown) => ['admin', 'audit-logs', params] as const,
    categories: ['admin', 'categories'] as const,
    provinces: ['admin', 'provinces'] as const,
    cities: (provinceId: string) => ['admin', 'provinces', provinceId, 'cities'] as const,
    attributes: (categoryId: string) => ['admin', 'categories', categoryId, 'attributes'] as const,
  },
} as const;
