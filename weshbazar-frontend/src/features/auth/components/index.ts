/**
 * Auth components layer — pages import the forms from here.
 *
 * Kept out of the feature barrel (`@/features/auth`) on purpose: the forms
 * themselves import validation/api helpers from that barrel, so re-exporting
 * components there would create an import cycle. Pages import:
 *   - shell: AuthCard
 *   - forms: LoginForm, RegisterForm, VerifyForm, ForgotForm, ResetForm
 */

export { AuthCard, type AuthCardProps } from './auth-card';
export { FormError, FormNotice, bindFieldErrors } from './form-error';
export { FormField, INPUT_CLASS, fieldMessageId, type FormFieldProps } from './form-field';
export { OtpInput, type OtpInputProps } from './otp-input';
export { PasswordField, type PasswordFieldProps } from './password-field';
export { PhoneInput, type PhoneInputProps } from './phone-input';
export { LoginForm, type LoginFormProps } from './login-form';
export { RegisterForm, type RegisterFormProps } from './register-form';
export { VerifyForm, type VerifyFormProps } from './verify-form';
export { ForgotForm } from './forgot-form';
export { ResetForm, type ResetFormProps } from './reset-form';
