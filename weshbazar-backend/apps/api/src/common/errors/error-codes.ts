/**
 * Centralized error-code catalog.
 *
 * Every error returned by the API carries a stable machine-readable `code`
 * from this catalog. Clients must branch on `error.code`, never on the
 * human-readable message (messages may change or be localized later).
 *
 * Each entry defines the HTTP status that must accompany the code and the
 * default message, which is safe to expose (it never contains internal
 * details such as stack traces, SQL, or Prisma internals).
 */
import { HttpStatus } from '@nestjs/common';

export interface ErrorDefinition {
  readonly status: HttpStatus;
  readonly message: string;
}

export const ERROR_CATALOG = {
  // --- Generic / transport ---------------------------------------------------
  VALIDATION_ERROR: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The request payload contains invalid fields.',
  },
  BAD_REQUEST: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The request could not be understood.',
  },
  UNAUTHORIZED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Authentication is required.',
  },
  FORBIDDEN: {
    status: HttpStatus.FORBIDDEN,
    message: 'You do not have permission to perform this action.',
  },
  NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'The requested resource was not found.',
  },
  METHOD_NOT_ALLOWED: {
    status: HttpStatus.METHOD_NOT_ALLOWED,
    message: 'The HTTP method is not allowed for this resource.',
  },
  CONFLICT: {
    status: HttpStatus.CONFLICT,
    message: 'The request conflicts with the current state of the resource.',
  },
  PAYLOAD_TOO_LARGE: {
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    message: 'The request payload is too large.',
  },
  UNSUPPORTED_MEDIA_TYPE: {
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    message: 'The request content type is not supported.',
  },
  UNPROCESSABLE_ENTITY: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'The request is well-formed but violates a business rule.',
  },
  RATE_LIMITED: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please try again later.',
  },
  INTERNAL_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred.',
  },
  SERVICE_UNAVAILABLE: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'The service is temporarily unavailable.',
  },

  // --- Authentication & account ---------------------------------------------
  INVALID_CREDENTIALS: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The phone number or password is incorrect.',
  },
  TOKEN_EXPIRED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The access token has expired.',
  },
  TOKEN_INVALID: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The access token is invalid.',
  },
  REFRESH_TOKEN_MISSING: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'No refresh session was provided.',
  },
  REFRESH_TOKEN_INVALID: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The refresh session is invalid.',
  },
  SESSION_REVOKED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'This session has been revoked. Please sign in again.',
  },
  SESSION_REUSE_DETECTED: {
    status: HttpStatus.UNAUTHORIZED,
    message:
      'This session was revoked because a previously used token was replayed. Please sign in again.',
  },
  SESSION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Session not found.',
  },
  PHONE_ALREADY_REGISTERED: {
    status: HttpStatus.CONFLICT,
    message: 'This phone number is already registered.',
  },
  INVALID_PHONE_NUMBER: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The phone number is not a valid number.',
  },
  PHONE_UNCHANGED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The new phone number is the same as the current one.',
  },
  PHONE_NOT_VERIFIED: {
    status: HttpStatus.FORBIDDEN,
    message: 'Verify your phone number before publishing listings.',
  },
  WEAK_PASSWORD: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The password does not meet the security policy.',
  },
  CURRENT_PASSWORD_INCORRECT: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The current password is incorrect.',
  },
  ACCOUNT_LOCKED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This account is temporarily locked due to repeated failed sign-in attempts.',
  },
  ACCOUNT_NOT_ACTIVE: {
    status: HttpStatus.FORBIDDEN,
    message: 'This account is not active.',
  },
  OTP_INVALID: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The verification code is incorrect.',
  },
  OTP_EXPIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The verification code has expired. Please request a new one.',
  },
  OTP_MAX_ATTEMPTS_EXCEEDED: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Too many incorrect verification attempts. Please request a new code.',
  },
  OTP_RESEND_TOO_SOON: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'A verification code was sent recently. Please wait before requesting another.',
  },
  OTP_DELIVERY_FAILED: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'The verification code could not be delivered. Please try again later.',
  },
  PASSWORD_RESET_TOKEN_INVALID: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The password reset request is invalid.',
  },
  PASSWORD_RESET_TOKEN_EXPIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The password reset request has expired. Please start again.',
  },

  // --- Users -----------------------------------------------------------------
  USER_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'User not found.',
  },

  // --- Seller accounts ---------------------------------------------------------
  SELLER_ACCOUNT_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Seller profile not found.',
  },
  SELLER_ACCOUNT_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: 'A seller profile already exists for this account.',
  },
  SELLER_SLUG_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'This seller profile address is already taken.',
  },
  SELLER_ACCOUNT_NOT_OWNED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This seller profile belongs to another account.',
  },

  // --- Taxonomy ---------------------------------------------------------------
  CATEGORY_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Category not found.',
  },
  CATEGORY_SLUG_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'This category address is already in use.',
  },
  CATEGORY_CYCLE_DETECTED: {
    status: HttpStatus.CONFLICT,
    message: 'This change would create a cycle in the category hierarchy.',
  },
  CATEGORY_HAS_CHILDREN: {
    status: HttpStatus.CONFLICT,
    message: 'The category has child categories and cannot be removed.',
  },
  CATEGORY_HAS_LISTINGS: {
    status: HttpStatus.CONFLICT,
    message: 'The category has listings and cannot be removed.',
  },
  CATEGORY_NOT_LEAF: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Listings can only be placed in a leaf (final-level) category.',
  },
  CATEGORY_INACTIVE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'The selected category is not available for listings.',
  },
  ATTRIBUTE_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Category attribute not found.',
  },
  ATTRIBUTE_KEY_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'An attribute with this key already exists for the category.',
  },
  ATTRIBUTE_OPTION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Attribute option not found.',
  },
  ATTRIBUTE_OPTION_VALUE_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'An option with this value already exists for the attribute.',
  },
  ATTRIBUTE_IN_USE: {
    status: HttpStatus.CONFLICT,
    message: 'The attribute is used by existing listings and cannot be changed this way.',
  },
  REQUIRED_ATTRIBUTE_MISSING: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A required category attribute is missing.',
  },
  INVALID_ATTRIBUTE_VALUE: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A category attribute value is invalid.',
  },

  // --- Locations ---------------------------------------------------------------
  PROVINCE_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Province not found.',
  },
  CITY_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'City not found.',
  },
  CITY_PROVINCE_MISMATCH: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The selected city does not belong to the selected province.',
  },
  PROVINCE_CODE_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'A province with this code already exists.',
  },
  PROVINCE_SLUG_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'A province with this address already exists.',
  },
  CITY_SLUG_TAKEN: {
    status: HttpStatus.CONFLICT,
    message: 'A city with this address already exists in the province.',
  },
  PROVINCE_IN_USE: {
    status: HttpStatus.CONFLICT,
    message: 'The province has cities or listings and cannot be removed.',
  },
  CITY_IN_USE: {
    status: HttpStatus.CONFLICT,
    message: 'The city has listings and cannot be removed.',
  },
  LOCATION_INACTIVE: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'The selected location is not available for listings.',
  },

  // --- Listings ----------------------------------------------------------------
  LISTING_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Listing not found.',
  },
  LISTING_NOT_OWNED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This listing belongs to another account.',
  },
  LISTING_INVALID_TRANSITION: {
    status: HttpStatus.CONFLICT,
    message: 'This action is not allowed in the current listing state.',
  },
  LISTING_EDIT_NOT_ALLOWED: {
    status: HttpStatus.CONFLICT,
    message: 'The listing cannot be edited in its current state.',
  },
  LISTING_NOT_ACTIVE: {
    status: HttpStatus.CONFLICT,
    message: 'The listing is not active.',
  },
  LISTING_LIMIT_REACHED: {
    status: HttpStatus.CONFLICT,
    message: 'The account has reached the allowed number of listings.',
  },
  LISTING_REVISION_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Listing revision not found.',
  },
  LISTING_VERSION_CONFLICT: {
    status: HttpStatus.CONFLICT,
    message: 'The listing was modified concurrently. Please refresh and retry.',
  },
  LISTING_IMAGE_LIMIT_REACHED: {
    status: HttpStatus.CONFLICT,
    message: 'The listing has reached the maximum number of images.',
  },

  // --- Media -------------------------------------------------------------------
  MEDIA_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Media not found.',
  },
  MEDIA_NOT_OWNED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This media belongs to another account.',
  },
  MEDIA_ALREADY_LINKED: {
    status: HttpStatus.CONFLICT,
    message: 'This media is already attached to a listing.',
  },
  INVALID_IMAGE: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The uploaded file is not a valid image.',
  },
  IMAGE_TOO_LARGE: {
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    message: 'The image exceeds the maximum allowed size.',
  },
  IMAGE_DIMENSIONS_TOO_LARGE: {
    status: HttpStatus.BAD_REQUEST,
    message: 'The image dimensions exceed the supported limits.',
  },
  UNSUPPORTED_IMAGE_TYPE: {
    status: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
    message: 'Only JPEG, PNG, and WebP images are supported.',
  },
  MEDIA_STORAGE_FAILED: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'The media could not be stored. Please try again later.',
  },

  // --- Contact methods -----------------------------------------------------------
  CONTACT_METHOD_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Contact method not found.',
  },
  CONTACT_METHOD_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: 'A contact method of this type already exists for the listing.',
  },
  CONTACT_METHOD_LIMIT_REACHED: {
    status: HttpStatus.CONFLICT,
    message: 'The listing has reached the maximum number of contact methods.',
  },

  // --- Favorites -----------------------------------------------------------------
  FAVORITE_ALREADY_EXISTS: {
    status: HttpStatus.CONFLICT,
    message: 'The listing is already in your favorites.',
  },
  FAVORITE_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'The listing is not in your favorites.',
  },

  // --- Reports ------------------------------------------------------------------
  REPORT_NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Report not found.',
  },
  REPORT_ALREADY_OPEN: {
    status: HttpStatus.CONFLICT,
    message: 'You already have an open report for this listing.',
  },
  REPORT_NOT_OPEN: {
    status: HttpStatus.CONFLICT,
    message: 'The report has already been resolved or dismissed.',
  },
  CANNOT_REPORT_OWN_LISTING: {
    status: HttpStatus.BAD_REQUEST,
    message: 'You cannot report your own listing.',
  },

  // --- Admin / moderation ---------------------------------------------------------
  MODERATION_ACTION_NOT_ALLOWED: {
    status: HttpStatus.CONFLICT,
    message: 'This moderation action is not allowed for the current state.',
  },
  USER_MODERATION_FORBIDDEN: {
    status: HttpStatus.FORBIDDEN,
    message: 'This account cannot be moderated.',
  },

  // --- Idempotency -----------------------------------------------------------------
  IDEMPOTENCY_KEY_REQUIRED: {
    status: HttpStatus.BAD_REQUEST,
    message: 'A valid idempotency key is required for this operation.',
  },
  IDEMPOTENCY_CONFLICT: {
    status: HttpStatus.CONFLICT,
    message: 'This request conflicts with a previous request that used the same idempotency key.',
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ERROR_CATALOG;

export const ERROR_CODES: readonly ErrorCode[] = Object.keys(ERROR_CATALOG) as ErrorCode[];

export function getErrorDefinition(code: ErrorCode): ErrorDefinition {
  return ERROR_CATALOG[code];
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(ERROR_CATALOG, value);
}
