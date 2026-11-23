/**
 * Environment schema — the single source of truth for configuration.
 *
 * Every variable is validated and coerced here; nothing else in the codebase
 * reads `process.env` directly (the only exception is the seed script and the
 * test-env defaults, which run outside the application).
 */
import { z } from 'zod';

// --- Small helpers -----------------------------------------------------------

const boolEnv = (defaultValue: 'true' | 'false') =>
  z
    .enum(['true', 'false'])
    .default(defaultValue)
    .transform((value) => value === 'true');

const intEnv = (defaultValue: number) => z.coerce.number().int().default(defaultValue);

const csvEnv = (defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    );

const optionalString = z
  .preprocess((value) => (value === '' ? undefined : value), z.string().optional())
  .transform((value) => value ?? undefined);

const durationEnv = (defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .refine((value) => /^\d+[smhd]$/.test(value), {
      message: 'must be a duration like "15m", "30d", "3600s" or "24h"',
    });

// --- Schema ------------------------------------------------------------------

export const envSchema = z
  .object({
    // Runtime
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: intEnv(3000),

    // Database
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required')
      .regex(/^postgres(ql)?:\/\//, 'must be a postgresql:// connection string'),
    SHADOW_DATABASE_URL: optionalString,
    DB_POOL_MAX: intEnv(10).pipe(z.number().min(1).max(100)),
    DB_POOL_CONNECT_TIMEOUT_MS: intEnv(5000),
    DB_POOL_IDLE_TIMEOUT_MS: intEnv(30000),

    // Auth secrets
    JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET is too short'),
    JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET is too short'),
    ACCESS_TOKEN_EXPIRES_IN: durationEnv('15m'),
    REFRESH_TOKEN_EXPIRES_IN: durationEnv('30d'),

    // Password policy
    PASSWORD_MIN_LENGTH: intEnv(8).pipe(z.number().min(6).max(64)),
    PASSWORD_MAX_LENGTH: intEnv(128).pipe(z.number().min(16).max(256)),
    PASSWORD_REQUIRE_LETTER: boolEnv('true'),
    PASSWORD_REQUIRE_DIGIT: boolEnv('true'),
    PASSWORD_REQUIRE_SYMBOL: boolEnv('false'),
    PASSWORD_REQUIRE_UPPERCASE: boolEnv('false'),

    // OTP / verification challenges
    OTP_LENGTH: intEnv(6).pipe(z.number().min(4).max(10)),
    OTP_EXPIRES_IN: intEnv(300),
    OTP_MAX_ATTEMPTS: intEnv(5),
    OTP_RESEND_COOLDOWN: intEnv(60),
    PASSWORD_RESET_EXPIRES_IN: intEnv(900),

    // Cookies
    REFRESH_COOKIE_NAME: z.string().default('weshbazar_refresh'),
    COOKIE_DOMAIN: optionalString,
    COOKIE_SECURE: boolEnv('false'),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

    // CORS / proxy / request ids
    CORS_ALLOWED_ORIGINS: csvEnv('http://localhost:3000'),
    TRUST_PROXY: boolEnv('false'),
    TRUST_REQUEST_ID_HEADER: boolEnv('false'),

    // Rate limiting
    RATE_LIMIT_WINDOW_SECONDS: intEnv(900),
    MAX_LOGIN_ATTEMPTS_PER_WINDOW: intEnv(10),
    MAX_REGISTER_ATTEMPTS_PER_WINDOW: intEnv(5),
    MAX_OTP_SEND_PER_WINDOW: intEnv(5),
    MAX_OTP_VERIFY_ATTEMPTS_PER_WINDOW: intEnv(20),
    MAX_PASSWORD_RESET_PER_WINDOW: intEnv(5),
    MAX_LISTING_CREATE_PER_WINDOW: intEnv(20),
    MAX_REPORT_PER_WINDOW: intEnv(10),
    MAX_CONTACT_PER_WINDOW: intEnv(30),
    MAX_IMAGE_UPLOAD_PER_WINDOW: intEnv(60),
    MAX_SEARCH_PER_WINDOW: intEnv(120),
    MAX_SEARCH_EVENTS_PER_WINDOW: intEnv(500),
    MAX_LISTING_VIEWS_PER_WINDOW: intEnv(200),

    // Account lockout
    LOGIN_LOCKOUT_THRESHOLD: intEnv(5),
    LOGIN_LOCKOUT_DURATION_SECONDS: intEnv(900),

    // Storage / media
    STORAGE_PROVIDER: z.enum(['local', 'neon']).default('local'),
    LOCAL_STORAGE_PATH: z.string().default('./var/storage'),
    PUBLIC_STORAGE_BASE_URL: z.string().default('http://localhost:3000'),
    NEON_STORAGE_ENDPOINT: z.string().trim().default(''),
    NEON_STORAGE_BUCKET: z.string().trim().default(''),
    NEON_STORAGE_REGION: z.string().trim().default('us-east-2'),
    NEON_STORAGE_ACCESS_KEY_ID: z.string().trim().default(''),
    NEON_STORAGE_SECRET_ACCESS_KEY: z.string().trim().default(''),
    MAX_UPLOAD_SIZE: intEnv(5 * 1024 * 1024),
    MAX_IMAGES_PER_LISTING: intEnv(10),
    MAX_IMAGE_PIXELS: intEnv(25_000_000),
    ORPHAN_MEDIA_RETENTION_DAYS: intEnv(7),

    // Listing / marketplace limits
    MIN_LISTING_TITLE_LENGTH: intEnv(10),
    MAX_LISTING_TITLE_LENGTH: intEnv(120),
    MIN_LISTING_DESCRIPTION_LENGTH: intEnv(30),
    MAX_LISTING_DESCRIPTION_LENGTH: intEnv(5000),
    MAX_LISTING_ATTRIBUTES: intEnv(30),
    MAX_LISTING_FILTERS: intEnv(8),
    MAX_ACTIVE_LISTINGS_PER_USER: intEnv(50),
    MAX_PENDING_LISTINGS_PER_USER: intEnv(10),
    LISTING_EXPIRES_AFTER_DAYS: intEnv(30),
    STALE_DRAFT_ARCHIVE_AFTER_DAYS: intEnv(30),
    VIEW_DEDUPE_WINDOW_SECONDS: intEnv(43_200),

    // Background jobs (spec §69, §70, §164)
    JOBS_ENABLED: boolEnv('true'),
    JOBS_BATCH_SIZE: intEnv(100).pipe(z.number().min(1).max(1000)),
    JOBS_EXPIRE_LISTINGS_INTERVAL_SECONDS: intEnv(300).pipe(z.number().min(5)),
    JOBS_ARCHIVE_STALE_DRAFTS_INTERVAL_SECONDS: intEnv(3600).pipe(z.number().min(5)),
    JOBS_CLEAN_CHALLENGES_INTERVAL_SECONDS: intEnv(3600).pipe(z.number().min(5)),
    JOBS_CLEAN_SESSIONS_INTERVAL_SECONDS: intEnv(3600).pipe(z.number().min(5)),
    JOBS_CLEAN_ORPHAN_MEDIA_INTERVAL_SECONDS: intEnv(21_600).pipe(z.number().min(5)),
    JOBS_CHALLENGE_RETENTION_DAYS: intEnv(1).pipe(z.number().min(0)),
    JOBS_REFRESH_SESSION_RETENTION_DAYS: intEnv(30).pipe(z.number().min(0)),
    // Archived-listing image retention (opt-in + dry-run by default, §5.17.2)
    ARCHIVED_IMAGE_RETENTION_DAYS: intEnv(30).pipe(z.number().min(1)),
    JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_ENABLED: boolEnv('false'),
    JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_DRY_RUN: boolEnv('true'),
    JOBS_CLEAN_ARCHIVED_LISTING_IMAGES_INTERVAL_SECONDS: intEnv(21_600).pipe(z.number().min(5)),

    // Providers
    SMS_PROVIDER: z.enum(['mock', 'http', 'disabled']).default('mock'),
    MODERATION_PROVIDER: z.string().min(1).default('noop'),

    // SMS gateway (only required when SMS_PROVIDER=http)
    SMS_GATEWAY_URL: optionalString,
    SMS_GATEWAY_API_KEY: optionalString,
    SMS_GATEWAY_API_KEY_HEADER: z.string().trim().min(1).default('X-Api-Key'),
    SMS_GATEWAY_API_KEY_PREFIX: z.string().default(''),
    SMS_GATEWAY_SENDER: optionalString,
    SMS_GATEWAY_TIMEOUT_MS: intEnv(10_000).pipe(z.number().int().min(100).max(60_000)),
    SMS_GATEWAY_MAX_RETRIES: intEnv(2).pipe(z.number().int().min(0).max(5)),
    SMS_MESSAGE_TEMPLATE: z.string().min(1).default('وزبازار: کد تأیید شما {code} است'),

    // Logging / docs
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    SWAGGER_ENABLED: boolEnv('true'),
  })
  .superRefine((env, ctx) => {
    // Neon Object Storage credentials are required only when selected.
    if (env.STORAGE_PROVIDER === 'neon') {
      for (const [variable, value] of [
        ['NEON_STORAGE_ENDPOINT', env.NEON_STORAGE_ENDPOINT],
        ['NEON_STORAGE_BUCKET', env.NEON_STORAGE_BUCKET],
        ['NEON_STORAGE_ACCESS_KEY_ID', env.NEON_STORAGE_ACCESS_KEY_ID],
        ['NEON_STORAGE_SECRET_ACCESS_KEY', env.NEON_STORAGE_SECRET_ACCESS_KEY],
      ] as const) {
        if (!value) {
          ctx.addIssue({ code: 'custom', path: [variable], message: variable + ' is required when STORAGE_PROVIDER=neon' });
        }
      }
      if (env.NEON_STORAGE_ENDPOINT) {
        try {
          const endpoint = new URL(env.NEON_STORAGE_ENDPOINT);
          if (endpoint.protocol !== 'https:') throw new Error('HTTPS required');
        } catch {
          ctx.addIssue({ code: 'custom', path: ['NEON_STORAGE_ENDPOINT'], message: 'NEON_STORAGE_ENDPOINT must be an absolute HTTPS URL' });
        }
      }
      if (env.NEON_STORAGE_BUCKET && !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(env.NEON_STORAGE_BUCKET)) {
        ctx.addIssue({ code: 'custom', path: ['NEON_STORAGE_BUCKET'], message: 'NEON_STORAGE_BUCKET must be a valid S3 bucket name' });
      }
    }

    // The `http` provider has a real delivery dependency; refuse to boot on a
    // half-configured gateway so a misconfiguration fails at startup, not on
    // the first user's verification attempt.
    if (env.SMS_PROVIDER === 'http') {
      if (!env.SMS_GATEWAY_URL) {
        ctx.addIssue({
          code: 'custom',
          path: ['SMS_GATEWAY_URL'],
          message: 'SMS_GATEWAY_URL is required when SMS_PROVIDER=http',
        });
      } else {
        const validUrl = (() => {
          try {
            const url = new URL(env.SMS_GATEWAY_URL);
            return url.protocol === 'http:' || url.protocol === 'https:';
          } catch {
            return false;
          }
        })();
        if (!validUrl) {
          ctx.addIssue({
            code: 'custom',
            path: ['SMS_GATEWAY_URL'],
            message: 'SMS_GATEWAY_URL must be an absolute http(s) URL',
          });
        }
      }
      if (!env.SMS_GATEWAY_API_KEY) {
        ctx.addIssue({
          code: 'custom',
          path: ['SMS_GATEWAY_API_KEY'],
          message: 'SMS_GATEWAY_API_KEY is required when SMS_PROVIDER=http',
        });
      }
    }

    if (env.NODE_ENV !== 'production') {
      return;
    }

    // Production hardening: long secrets and secure cookies only.
    const secretVars = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;
    for (const variable of secretVars) {
      if (env[variable].length < 32) {
        ctx.addIssue({
          code: 'custom',
          path: [variable],
          message: `${variable} must be at least 32 characters in production`,
        });
      }
    }
    if (!env.COOKIE_SECURE) {
      ctx.addIssue({
        code: 'custom',
        path: ['COOKIE_SECURE'],
        message: 'COOKIE_SECURE must be true in production',
      });
    }
    if (env.CORS_ALLOWED_ORIGINS.includes('*')) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ALLOWED_ORIGINS'],
        message: 'a wildcard origin is not allowed in production',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Validates and coerces the process environment. Throws a descriptive error
 * listing every invalid variable — used both by `ConfigModule` and by the
 * bootstrap before the Nest application exists.
 */
export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${details}`);
  }
  return result.data;
}
