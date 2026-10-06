/**
 * SMS provider abstraction.
 *
 * The application never talks to an SMS gateway directly; it depends on this
 * interface so a real gateway (e.g. an Afghan aggregator) can be plugged in
 * without touching auth flows. The MVP ships with `MockSmsProvider`.
 */
import type { VerificationPurpose } from '../../generated/prisma/enums';

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');

export interface SendVerificationCodeInput {
  /** Normalized (E.164) destination. */
  phone: string;
  code: string;
  purpose: VerificationPurpose;
}

export interface SmsProvider {
  sendVerificationCode(input: SendVerificationCodeInput): Promise<void>;
}
