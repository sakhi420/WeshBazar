/**
 * Deterministic environment defaults for integration/e2e tests.
 *
 * This module must be loaded (`setupFiles`) before any application module is
 * imported. Existing `process.env` values always win, so CI or a developer can
 * point the tests at another database via `TEST_DATABASE_URL` / `DATABASE_URL`.
 */
const defaults: Record<string, string> = {
  NODE_ENV: 'test',
  PORT: '0',

  // Dedicated test database (never the development database).
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    'postgresql://weshbazar:weshbazar@localhost:5432/weshbazar_test',

  // Test-only secrets — never valid outside tests.
  JWT_ACCESS_SECRET: 'test-access-secret-0123456789abcdef',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcdef',
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '30d',

  CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
  TRUST_PROXY: 'false',
  TRUST_REQUEST_ID_HEADER: 'false',

  REFRESH_COOKIE_NAME: 'weshbazar_refresh',
  COOKIE_SECURE: 'false',
  COOKIE_SAME_SITE: 'lax',

  STORAGE_PROVIDER: 'local',
  LOCAL_STORAGE_PATH: './var/storage-test',
  PUBLIC_STORAGE_BASE_URL: 'http://localhost:0',
  MAX_UPLOAD_SIZE: '5242880',
  MAX_IMAGES_PER_LISTING: '10',
  MAX_IMAGE_PIXELS: '25000000',
  ORPHAN_MEDIA_RETENTION_DAYS: '7',

  OTP_LENGTH: '6',
  OTP_EXPIRES_IN: '300',
  OTP_MAX_ATTEMPTS: '5',
  OTP_RESEND_COOLDOWN: '60',
  PASSWORD_RESET_EXPIRES_IN: '900',

  RATE_LIMIT_WINDOW_SECONDS: '900',
  MAX_LOGIN_ATTEMPTS_PER_WINDOW: '10',
  MAX_REGISTER_ATTEMPTS_PER_WINDOW: '5',
  MAX_OTP_SEND_PER_WINDOW: '5',
  MAX_OTP_VERIFY_ATTEMPTS_PER_WINDOW: '20',
  MAX_PASSWORD_RESET_PER_WINDOW: '5',
  MAX_LISTING_CREATE_PER_WINDOW: '20',
  MAX_REPORT_PER_WINDOW: '10',
  MAX_CONTACT_PER_WINDOW: '30',
  MAX_IMAGE_UPLOAD_PER_WINDOW: '60',
  MAX_SEARCH_PER_WINDOW: '120',
  MAX_SEARCH_EVENTS_PER_WINDOW: '500',
  MAX_LISTING_VIEWS_PER_WINDOW: '200',
  LOGIN_LOCKOUT_THRESHOLD: '5',
  LOGIN_LOCKOUT_DURATION_SECONDS: '900',

  MIN_LISTING_TITLE_LENGTH: '10',
  MAX_LISTING_TITLE_LENGTH: '120',
  MIN_LISTING_DESCRIPTION_LENGTH: '30',
  MAX_LISTING_DESCRIPTION_LENGTH: '5000',
  MAX_LISTING_ATTRIBUTES: '30',
  MAX_LISTING_FILTERS: '8',
  MAX_ACTIVE_LISTINGS_PER_USER: '50',
  MAX_PENDING_LISTINGS_PER_USER: '10',
  LISTING_EXPIRES_AFTER_DAYS: '30',
  STALE_DRAFT_ARCHIVE_AFTER_DAYS: '30',
  VIEW_DEDUPE_WINDOW_SECONDS: '43200',

  // Background jobs never fire on their own during tests (spec §69); the job
  // methods are invoked directly by the suites.
  JOBS_ENABLED: 'false',
  JOBS_BATCH_SIZE: '100',
  JOBS_EXPIRE_LISTINGS_INTERVAL_SECONDS: '300',
  JOBS_ARCHIVE_STALE_DRAFTS_INTERVAL_SECONDS: '3600',
  JOBS_CLEAN_CHALLENGES_INTERVAL_SECONDS: '3600',
  JOBS_CLEAN_SESSIONS_INTERVAL_SECONDS: '3600',
  JOBS_CLEAN_ORPHAN_MEDIA_INTERVAL_SECONDS: '21600',
  JOBS_CHALLENGE_RETENTION_DAYS: '1',
  JOBS_REFRESH_SESSION_RETENTION_DAYS: '30',
  // Archived-image cleanup is opt-in + dry-run even in tests; the dedicated
  // job spec flips these to exercise the destructive path explicitly.
  ARCHIVED_IMAGE_RETENTION_DAYS: '30',
  JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED: 'false',
  JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN: 'true',
  JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_INTERVAL_SECONDS: '21600',

  SMS_PROVIDER: 'mock',
  MODERATION_PROVIDER: 'noop',

  LOG_LEVEL: 'silent',
  SWAGGER_ENABLED: 'false',
};

for (const [key, value] of Object.entries(defaults)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

export {};
