/**
 * Typed shape of the namespaced application configuration produced by
 * `configuration.ts`. Consume it via
 * `ConfigService<AppConfig, true>` and `get('path.to.key', { infer: true })`.
 */

export interface AppConfig {
  app: {
    env: 'development' | 'test' | 'production';
    isProduction: boolean;
    isTest: boolean;
    isDevelopment: boolean;
    port: number;
    logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
    swaggerEnabled: boolean;
    trustProxy: boolean;
    trustRequestIdHeader: boolean;
    corsAllowedOrigins: string[];
  };
  database: {
    url: string;
    shadowUrl?: string;
    poolMax: number;
    poolConnectTimeoutMs: number;
    poolIdleTimeoutMs: number;
  };
  auth: {
    accessSecret: string;
    refreshSecret: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
    password: {
      minLength: number;
      maxLength: number;
      requireLetter: boolean;
      requireDigit: boolean;
      requireSymbol: boolean;
      requireUppercase: boolean;
    };
    otp: {
      length: number;
      expiresInSeconds: number;
      maxAttempts: number;
      resendCooldownSeconds: number;
      passwordResetExpiresInSeconds: number;
    };
    cookie: {
      name: string;
      domain?: string;
      secure: boolean;
      sameSite: 'lax' | 'strict' | 'none';
    };
    lockout: {
      threshold: number;
      durationSeconds: number;
    };
  };
  rateLimit: {
    windowSeconds: number;
    loginPerWindow: number;
    registerPerWindow: number;
    otpSendPerWindow: number;
    otpVerifyPerWindow: number;
    passwordResetPerWindow: number;
    listingCreatePerWindow: number;
    reportPerWindow: number;
    contactPerWindow: number;
    imageUploadPerWindow: number;
    searchPerWindow: number;
    /** Cap on search-interaction telemetry events per client per window. */
    searchEventsPerWindow: number;
    /** Cap on *counted* listing views per client per dedupe window (§73). */
    listingViewPerWindow: number;
  };
  storage: {
    provider: 'local' | 'neon';
    localStoragePath: string;
    publicBaseUrl: string;
    neon: { endpoint: string; bucket: string; region: string; accessKeyId: string; secretAccessKey: string };
    maxUploadSize: number;
    maxImagesPerListing: number;
    maxImagePixels: number;
    orphanMediaRetentionDays: number;
  };
  listing: {
    minTitleLength: number;
    maxTitleLength: number;
    minDescriptionLength: number;
    maxDescriptionLength: number;
    maxAttributes: number;
    maxFilters: number;
    maxActivePerUser: number;
    maxPendingPerUser: number;
    expiresAfterDays: number;
    staleDraftArchiveAfterDays: number;
    viewDedupeWindowSeconds: number;
  };
  jobs: {
    /**
     * Master switch. When false no timers are registered at all; the job
     * methods remain callable (tests, manual runs) — only the scheduled
     * handlers skip work (spec §69, §164).
     */
    enabled: boolean;
    /** Rows processed per bounded pass of every job (§69). */
    batchSize: number;
    expireListingsIntervalSeconds: number;
    archiveStaleDraftsIntervalSeconds: number;
    cleanChallengesIntervalSeconds: number;
    cleanSessionsIntervalSeconds: number;
    cleanOrphanMediaIntervalSeconds: number;
    cleanArchivedListingImagesEnabled: boolean;
    cleanArchivedListingImagesDryRun: boolean;
    cleanArchivedListingImagesIntervalSeconds: number;
    /** TTL after `archivedAt` before archived-listing images may be claimed. */
    archivedImageRetentionDays: number;
    /** Extra grace on top of `expiresAt` before challenges are deleted (§69). */
    challengeRetentionDays: number;
    /** Extra grace on top of `expiresAt` before refresh sessions are deleted. */
    refreshSessionRetentionDays: number;
  };
  providers: {
    sms: string;
    smsHttp: {
      gatewayUrl?: string;
      apiKey?: string;
      apiKeyHeader: string;
      apiKeyPrefix: string;
      sender?: string;
      timeoutMs: number;
      maxRetries: number;
      messageTemplate: string;
    };
    smsBaharFuture: {
      username?: string;
      password?: string;
      sender?: string;
      timeoutMs: number;
      maxRetries: number;
      messageTemplate: string;
    };
    moderation: string;
  };
}
