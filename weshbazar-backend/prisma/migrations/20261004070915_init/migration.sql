-- Extensions
-- pg_trgm backs the trigram search index on "Listing"."searchText" (added below).
-- Pre-provisioned by scripts/setup-local-db.{sh,ps1}; repeated here so environments
-- where the app role may install trusted extensions (PG >= 13) stay self-contained.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "SellerAccountType" AS ENUM ('INDIVIDUAL');

-- CreateEnum
CREATE TYPE "SellerAccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED');

-- CreateEnum
CREATE TYPE "VerificationPurpose" AS ENUM ('REGISTER', 'CHANGE_PHONE', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "CategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ModerationMode" AS ENUM ('REVIEW_REQUIRED', 'AUTO_APPROVE');

-- CreateEnum
CREATE TYPE "AttributeType" AS ENUM ('TEXT', 'LONG_TEXT', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'SELECT', 'MULTI_SELECT', 'YEAR', 'DATE');

-- CreateEnum
CREATE TYPE "LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PricingType" AS ENUM ('PAID', 'FREE', 'CONTACT');

-- CreateEnum
CREATE TYPE "ListingCondition" AS ENUM ('NEW', 'LIKE_NEW', 'GOOD', 'FAIR');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SOLD', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ListingRevisionChangeType" AS ENUM ('CREATE', 'UPDATE', 'SUBMIT', 'APPROVE', 'REJECT', 'MARK_SOLD', 'ARCHIVE', 'RENEW', 'RESTORE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ListingContactType" AS ENUM ('PHONE', 'WHATSAPP', 'TELEGRAM');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SCAM', 'STOLEN', 'PROHIBITED_ITEM', 'SPAM', 'MISLEADING', 'DUPLICATE', 'OFFENSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_SUSPENDED', 'USER_BANNED', 'USER_RESTORED', 'USER_DEACTIVATED', 'LISTING_APPROVED', 'LISTING_REJECTED', 'LISTING_ARCHIVED_BY_ADMIN', 'LISTING_RESTORED_BY_ADMIN', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_ARCHIVED', 'ATTRIBUTE_CREATED', 'ATTRIBUTE_UPDATED', 'ATTRIBUTE_OPTION_CREATED', 'ATTRIBUTE_OPTION_UPDATED', 'LOCATION_CREATED', 'LOCATION_UPDATED', 'SECURITY_SESSION_REVOKED', 'SECURITY_REFRESH_REUSE_DETECTED', 'SECURITY_LOGOUT_ALL', 'AUTH_PASSWORD_CHANGED', 'AUTH_PASSWORD_RESET', 'AUTH_PHONE_CHANGED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "phoneNormalized" VARCHAR(20) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "phoneVerifiedAt" TIMESTAMPTZ(3),
    "avatarKey" VARCHAR(300),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(3),
    "suspensionReason" VARCHAR(500),
    "suspendedUntil" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SellerAccount" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "type" "SellerAccountType" NOT NULL DEFAULT 'INDIVIDUAL',
    "displayName" VARCHAR(80) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "bio" VARCHAR(500),
    "status" "SellerAccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SellerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "replacedBySessionId" UUID,
    "revokedReason" VARCHAR(40),
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "deviceName" VARCHAR(120),

    CONSTRAINT "RefreshSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "phone" VARCHAR(20) NOT NULL,
    "purpose" "VerificationPurpose" NOT NULL,
    "codeHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resendAvailableAt" TIMESTAMPTZ(3) NOT NULL,
    "usedAt" TIMESTAMPTZ(3),
    "invalidatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "VerificationChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "slug" VARCHAR(140) NOT NULL,
    "status" "CategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "iconKey" VARCHAR(80),
    "moderationMode" "ModerationMode" NOT NULL DEFAULT 'REVIEW_REQUIRED',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryTranslation" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(140) NOT NULL,
    "description" VARCHAR(300),

    CONSTRAINT "CategoryTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAttribute" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "label" VARCHAR(140) NOT NULL,
    "type" "AttributeType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "filterable" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT false,
    "unit" VARCHAR(20),
    "placeholder" VARCHAR(140),
    "minValue" DECIMAL(18,4),
    "maxValue" DECIMAL(18,4),
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "pattern" VARCHAR(200),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAttributeOption" (
    "id" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "value" VARCHAR(80) NOT NULL,
    "label" VARCHAR(140) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoryAttributeOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" UUID NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProvinceTranslation" (
    "id" UUID NOT NULL,
    "provinceId" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(140) NOT NULL,

    CONSTRAINT "ProvinceTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" UUID NOT NULL,
    "provinceId" UUID NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "status" "LocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityTranslation" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "locale" VARCHAR(10) NOT NULL,
    "name" VARCHAR(140) NOT NULL,

    CONSTRAINT "CityTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" UUID NOT NULL,
    "sellerAccountId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "provinceId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT NOT NULL,
    "price" DECIMAL(14,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'AFN',
    "pricingType" "PricingType" NOT NULL DEFAULT 'PAID',
    "negotiable" BOOLEAN NOT NULL DEFAULT true,
    "condition" "ListingCondition" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "attributes" JSONB NOT NULL DEFAULT '{}',
    "views" INTEGER NOT NULL DEFAULT 0,
    "favoriteCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMPTZ(3),
    "soldAt" TIMESTAMPTZ(3),
    "archivedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "searchText" TEXT,
    "rejectedReason" VARCHAR(64),
    "rejectedNote" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingRevision" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "changeType" "ListingRevisionChangeType" NOT NULL,
    "snapshot" JSONB NOT NULL,
    "attributeSchemaReference" JSONB,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "storageKey" VARCHAR(300) NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '{}',
    "mimeType" VARCHAR(64) NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingContactMethod" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "type" "ListingContactType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "valueOverride" VARCHAR(160),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ListingContactMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterUserId" UUID NOT NULL,
    "listingId" UUID,
    "reportedUserId" UUID,
    "reason" "ReportReason" NOT NULL,
    "description" VARCHAR(1000),
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedByUserId" UUID,
    "resolvedAt" TIMESTAMPTZ(3),
    "resolutionNote" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "adminUserId" UUID NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "reason" VARCHAR(64),
    "note" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(64),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" VARCHAR(64),
    "userAgent" VARCHAR(512),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingDailyStat" (
    "id" UUID NOT NULL,
    "listingId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "phoneClicks" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicks" INTEGER NOT NULL DEFAULT 0,
    "telegramClicks" INTEGER NOT NULL DEFAULT 0,
    "favoriteAdds" INTEGER NOT NULL DEFAULT 0,
    "reports" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ListingDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(80) NOT NULL,
    "subject" VARCHAR(120) NOT NULL,
    "key" VARCHAR(120) NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNormalized_key" ON "User"("phoneNormalized");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SellerAccount_ownerUserId_key" ON "SellerAccount"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SellerAccount_slug_key" ON "SellerAccount"("slug");

-- CreateIndex
CREATE INDEX "SellerAccount_status_idx" ON "SellerAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshSession_tokenHash_key" ON "RefreshSession"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshSession_userId_idx" ON "RefreshSession"("userId");

-- CreateIndex
CREATE INDEX "RefreshSession_familyId_idx" ON "RefreshSession"("familyId");

-- CreateIndex
CREATE INDEX "RefreshSession_expiresAt_idx" ON "RefreshSession"("expiresAt");

-- CreateIndex
CREATE INDEX "VerificationChallenge_phone_purpose_createdAt_idx" ON "VerificationChallenge"("phone", "purpose", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "VerificationChallenge_userId_idx" ON "VerificationChallenge"("userId");

-- CreateIndex
CREATE INDEX "VerificationChallenge_expiresAt_idx" ON "VerificationChallenge"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_status_sortOrder_idx" ON "Category"("status", "sortOrder");

-- CreateIndex
CREATE INDEX "CategoryTranslation_locale_idx" ON "CategoryTranslation"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryTranslation_categoryId_locale_key" ON "CategoryTranslation"("categoryId", "locale");

-- CreateIndex
CREATE INDEX "CategoryAttribute_categoryId_isActive_idx" ON "CategoryAttribute"("categoryId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAttribute_categoryId_key_key" ON "CategoryAttribute"("categoryId", "key");

-- CreateIndex
CREATE INDEX "CategoryAttributeOption_attributeId_isActive_idx" ON "CategoryAttributeOption"("attributeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryAttributeOption_attributeId_value_key" ON "CategoryAttributeOption"("attributeId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "Province_code_key" ON "Province"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Province_slug_key" ON "Province"("slug");

-- CreateIndex
CREATE INDEX "Province_status_sortOrder_idx" ON "Province"("status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ProvinceTranslation_provinceId_locale_key" ON "ProvinceTranslation"("provinceId", "locale");

-- CreateIndex
CREATE INDEX "City_provinceId_status_sortOrder_idx" ON "City"("provinceId", "status", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "City_provinceId_slug_key" ON "City"("provinceId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CityTranslation_cityId_locale_key" ON "CityTranslation"("cityId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "Listing_slug_key" ON "Listing"("slug");

-- CreateIndex
CREATE INDEX "Listing_status_createdAt_id_idx" ON "Listing"("status", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Listing_status_categoryId_createdAt_id_idx" ON "Listing"("status", "categoryId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Listing_status_provinceId_cityId_createdAt_id_idx" ON "Listing"("status", "provinceId", "cityId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Listing_sellerAccountId_status_idx" ON "Listing"("sellerAccountId", "status");

-- CreateIndex
CREATE INDEX "Listing_categoryId_idx" ON "Listing"("categoryId");

-- CreateIndex
CREATE INDEX "Listing_provinceId_idx" ON "Listing"("provinceId");

-- CreateIndex
CREATE INDEX "Listing_cityId_idx" ON "Listing"("cityId");

-- CreateIndex
CREATE INDEX "Listing_price_idx" ON "Listing"("price");

-- CreateIndex
CREATE INDEX "Listing_expiresAt_idx" ON "Listing"("expiresAt");

-- CreateIndex
CREATE INDEX "ListingRevision_listingId_createdAt_idx" ON "ListingRevision"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ListingRevision_listingId_version_key" ON "ListingRevision"("listingId", "version");

-- CreateIndex
CREATE INDEX "ListingImage_listingId_sortOrder_idx" ON "ListingImage"("listingId", "sortOrder");

-- CreateIndex
CREATE INDEX "ListingImage_deletedAt_idx" ON "ListingImage"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListingContactMethod_listingId_type_key" ON "ListingContactMethod"("listingId", "type");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Favorite_listingId_idx" ON "Favorite"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_listingId_key" ON "Favorite"("userId", "listingId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Report_listingId_status_idx" ON "Report"("listingId", "status");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_status_idx" ON "Report"("reportedUserId", "status");

-- CreateIndex
CREATE INDEX "ModerationAction_listingId_createdAt_idx" ON "ModerationAction"("listingId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ModerationAction_adminUserId_idx" ON "ModerationAction"("adminUserId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ListingDailyStat_date_idx" ON "ListingDailyStat"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ListingDailyStat_listingId_date_key" ON "ListingDailyStat"("listingId", "date");

-- CreateIndex
CREATE INDEX "IdempotencyKey_expiresAt_idx" ON "IdempotencyKey"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_scope_subject_key_key" ON "IdempotencyKey"("scope", "subject", "key");

-- AddForeignKey
ALTER TABLE "SellerAccount" ADD CONSTRAINT "SellerAccount_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshSession" ADD CONSTRAINT "RefreshSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationChallenge" ADD CONSTRAINT "VerificationChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryTranslation" ADD CONSTRAINT "CategoryTranslation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttributeOption" ADD CONSTRAINT "CategoryAttributeOption_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategoryAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProvinceTranslation" ADD CONSTRAINT "ProvinceTranslation_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityTranslation" ADD CONSTRAINT "CityTranslation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerAccountId_fkey" FOREIGN KEY ("sellerAccountId") REFERENCES "SellerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingRevision" ADD CONSTRAINT "ListingRevision_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingContactMethod" ADD CONSTRAINT "ListingContactMethod_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterUserId_fkey" FOREIGN KEY ("reporterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingDailyStat" ADD CONSTRAINT "ListingDailyStat_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Raw SQL additions (not expressible in the Prisma schema)
-- -----------------------------------------------------------------------------

-- Trigram index backing case-insensitive substring/similarity search over
-- "Listing"."searchText" (maintained by the application as a normalized
-- title+description+attribute digest).
CREATE INDEX "Listing_searchText_trgm_idx" ON "Listing" USING GIN ("searchText" gin_trgm_ops);

-- Data-integrity guard rails.
ALTER TABLE "Listing"
    ADD CONSTRAINT "Listing_price_nonnegative_check" CHECK ("price" IS NULL OR "price" >= 0),
    ADD CONSTRAINT "Listing_views_nonnegative_check" CHECK ("views" >= 0),
    ADD CONSTRAINT "Listing_favoriteCount_nonnegative_check" CHECK ("favoriteCount" >= 0),
    ADD CONSTRAINT "Listing_version_positive_check" CHECK ("version" >= 1);

-- A reporter may hold at most one unresolved (open / under review) report per listing.
CREATE UNIQUE INDEX "Report_reporter_user_listing_open_key"
    ON "Report" ("reporterUserId", "listingId")
    WHERE "status" IN ('OPEN', 'UNDER_REVIEW') AND "listingId" IS NOT NULL;
