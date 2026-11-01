/**
 * First-visit welcome/intro contract (welcome landing §5).
 *
 * A single, versioned, non-sensitive first-party cookie marks that a visitor
 * has completed the intro so returning visitors are sent straight to the
 * marketplace. Kept in one place so the Edge middleware and the client CTA can
 * never drift on the cookie name/path/version.
 */
export const INTRO_COOKIE_NAME = 'wb_intro_seen';
export const INTRO_COOKIE_VALUE = 'v1';

/** One year in seconds — long enough to not annoy, short enough to be versionable. */
export const INTRO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Destination for the primary CTA and for returning-visitor redirects. */
export const MARKET_PATH = '/market';