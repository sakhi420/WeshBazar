/**
 * Explicit no-delivery SMS provider for read-only exhibition deployments.
 *
 * OTP issuance fails closed through VerificationService. Existing verified
 * accounts can still sign in, while registration and password/phone recovery
 * cannot complete until a real SMS gateway is configured.
 */
import { Injectable } from '@nestjs/common';
import type { SendVerificationCodeInput, SmsProvider } from './sms.provider';

@Injectable()
export class DisabledSmsProvider implements SmsProvider {
  sendVerificationCode(_input: SendVerificationCodeInput): Promise<void> {
    return Promise.reject(new Error('SMS delivery is disabled for this deployment.'));
  }
}
