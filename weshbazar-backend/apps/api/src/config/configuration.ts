/**
 * Namespaced configuration factory. Registered with `ConfigModule.load`; the
 * returned object is the `AppConfig` shape. All values come from the already
 * validated environment (see `env.schema.ts`).
 */
import { validateEnv, type Env } from './env.schema';
import type { AppConfig } from './config.types';

export function configuration(): AppConfig {
  const env: Env = validateEnv(process.env);

  return {
    app: {
      env: env.NODE_ENV,
      isProduction: env.NODE_ENV === 'production',
      isTest: env.NODE_ENV === 'test',
      isDevelopment: env.NODE_ENV === 'development',
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
      swaggerEnabled: env.SWAGGER_ENABLED,
      trustProxy: env.TRUST_PROXY,
      trustRequestIdHeader: env.TRUST_REQUEST_ID_HEADER,
      corsAllowedOrigins: env.CORS_ALLOWED_ORIGINS,
    },
    database: {
      url: env.DATABASE_URL,
      shadowUrl: env.SHADOW_DATABASE_URL,
      poolMax: env.DB_POOL_MAX,
      poolConnectTimeoutMs: env.DB_POOL_CONNECT_TIMEOUT_MS,
      poolIdleTimeoutMs: env.DB_POOL_IDLE_TIMEOUT_MS,
    },
    auth: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN,
      refreshTokenExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
      password: {
        minLength: env.PASSWORD_MIN_LENGTH,
        maxLength: env.PASSWORD_MAX_LENGTH,
        requireLetter: env.PASSWORD_REQUIRE_LETTER,
        requireDigit: env.PASSWORD_REQUIRE_DIGIT,
        requireSymbol: env.PASSWORD_REQUIRE_SYMBOL,
        requireUppercase: env.PASSWORD_REQUIRE_UPPERCASE,
      },
      otp: {
        length: env.OTP_LENGTH,
        expiresInSeconds: env.OTP_EXPIRES_IN,
        maxAttempts: env.OTP_MAX_ATTEMPTS,
        resendCooldownSeconds: env.OTP_RESEND_COOLDOWN,
        passwordResetExpiresInSeconds: env.PASSWORD_RESET_EXPIRES_IN,
      },
      cookie: {
        name: env.REFRESH_COOKIE_NAME,
        domain: env.COOKIE_DOMAIN,
        secure: env.COOKIE_SECURE,
        sameSite: env.COOKIE_SAME_SITE,
      },
      lockout: {
        threshold: env.LOGIN_LOCKOUT_THRESHOLD,
        durationSeconds: env.LOGIN_LOCKOUT_DURATION_SECONDS,
      },
    },
    rateLimit: {
      windowSeconds: env.RATE_LIMIT_WINDOW_SECONDS,
      loginPerWindow: env.MAX_LOGIN_ATTEMPTS_PER_WINDOW,
      registerPerWindow: env.MAX_REGISTER_ATTEMPTS_PER_WINDOW,
      otpSendPerWindow: env.MAX_OTP_SEND_PER_WINDOW,
      otpVerifyPerWindow: env.MAX_OTP_VERIFY_ATTEMPTS_PER_WINDOW,
      passwordResetPerWindow: env.MAX_PASSWORD_RESET_PER_WINDOW,
      listingCreatePerWindow: env.MAX_LISTING_CREATE_PER_WINDOW,
      reportPerWindow: env.MAX_REPORT_PER_WINDOW,
      contactPerWindow: env.MAX_CONTACT_PER_WINDOW,
      imageUploadPerWindow: env.MAX_IMAGE_UPLOAD_PER_WINDOW,
      searchPerWindow: env.MAX_SEARCH_PER_WINDOW,
      listingViewPerWindow: env.MAX_LISTING_VIEWS_PER_WINDOW,
    },
    storage: {
      provider: env.STORAGE_PROVIDER,
      localStoragePath: env.LOCAL_STORAGE_PATH,
      publicBaseUrl: env.PUBLIC_STORAGE_BASE_URL,
      maxUploadSize: env.MAX_UPLOAD_SIZE,
      maxImagesPerListing: env.MAX_IMAGES_PER_LISTING,
      maxImagePixels: env.MAX_IMAGE_PIXELS,
      orphanMediaRetentionDays: env.ORPHAN_MEDIA_RETENTION_DAYS,
    },
    listing: {
      minTitleLength: env.MIN_LISTING_TITLE_LENGTH,
      maxTitleLength: env.MAX_LISTING_TITLE_LENGTH,
      minDescriptionLength: env.MIN_LISTING_DESCRIPTION_LENGTH,
      maxDescriptionLength: env.MAX_LISTING_DESCRIPTION_LENGTH,
      maxAttributes: env.MAX_LISTING_ATTRIBUTES,
      maxFilters: env.MAX_LISTING_FILTERS,
      maxActivePerUser: env.MAX_ACTIVE_LISTINGS_PER_USER,
      maxPendingPerUser: env.MAX_PENDING_LISTINGS_PER_USER,
      expiresAfterDays: env.LISTING_EXPIRES_AFTER_DAYS,
      staleDraftArchiveAfterDays: env.STALE_DRAFT_ARCHIVE_AFTER_DAYS,
      viewDedupeWindowSeconds: env.VIEW_DEDUPE_WINDOW_SECONDS,
    },
    jobs: {
      enabled: env.JOBS_ENABLED,
      batchSize: env.JOBS_BATCH_SIZE,
      expireListingsIntervalSeconds: env.JOBS_EXPIRE_LISTINGS_INTERVAL_SECONDS,
      archiveStaleDraftsIntervalSeconds: env.JOBS_ARCHIVE_STALE_DRAFTS_INTERVAL_SECONDS,
      cleanChallengesIntervalSeconds: env.JOBS_CLEAN_CHALLENGES_INTERVAL_SECONDS,
      cleanSessionsIntervalSeconds: env.JOBS_CLEAN_SESSIONS_INTERVAL_SECONDS,
      cleanOrphanMediaIntervalSeconds: env.JOBS_CLEAN_ORPHAN_MEDIA_INTERVAL_SECONDS,
      challengeRetentionDays: env.JOBS_CHALLENGE_RETENTION_DAYS,
      refreshSessionRetentionDays: env.JOBS_REFRESH_SESSION_RETENTION_DAYS,
    },
    providers: {
      sms: env.SMS_PROVIDER,
      moderation: env.MODERATION_PROVIDER,
    },
  };
}

export default configuration;
