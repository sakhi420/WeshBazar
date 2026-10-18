/**
 * SMS message rendering — the single source of truth for the Dari message text
 * so providers never hard-code wording. Templates may reference `{code}` and
 * `{purpose}` (the raw `VerificationPurpose` enum value).
 */

export interface SmsMessageVars {
  code: string;
  purpose: string;
}

export function renderSmsMessage(template: string, vars: SmsMessageVars): string {
  return template.replace(/\{code\}/g, vars.code).replace(/\{purpose\}/g, vars.purpose);
}