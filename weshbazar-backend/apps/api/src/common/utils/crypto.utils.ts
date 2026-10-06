/**
 * Small cryptographic helpers shared by the auth flows.
 *
 * Everything here uses Node's CSPRNG (`node:crypto`); secrets (HMAC pepper,
 * JWT keys) are always passed in by callers and never hard-coded here.
 */
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 of `value` keyed by `secret`, hex-encoded. */
export function hmacSha256Hex(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

/** Cryptographically random opaque token, URL-safe (32 bytes → 43 chars). */
export function generateOpaqueToken(byteLength = 32): string {
  return randomBytes(byteLength).toString('base64url');
}

/** Cryptographically random zero-padded numeric code (e.g. an OTP). */
export function generateNumericCode(length: number): string {
  const exclusiveMax = 10 ** length;
  return randomInt(0, exclusiveMax).toString().padStart(length, '0');
}

/** Constant-time comparison of two hex-encoded strings. */
export function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  if (leftBuffer.length === 0 || leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}
