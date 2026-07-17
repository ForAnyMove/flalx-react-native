import i18n from '../../utils/i18n/i18n';

/**
 * Precise error slugs the backend returns in `message` (see server auth error
 * table). Several `code` values are ambiguous on their own — e.g. MFA_REQUIRED
 * covers `aal2_required`, `mfa_required_for_password_change` and
 * `mfa_setup_required`; VALIDATION_ERROR covers a dozen distinct field errors
 * — so `message` is the primary lookup key and `code` is only a fallback.
 */
const KNOWN_MESSAGE_KEYS = new Set([
  'invalid_credentials',
  'email_not_confirmed',
  'phone_not_confirmed',
  'otp_invalid',
  'otp_invalid_format',
  'mfa_verification_failed',
  'mfa_required_for_password_change',
  'aal2_required',
  'mfa_setup_required',
  'session_expired',
  'provider_session_refresh_failed',
  'authentication_required',
  'user_not_found',
  'provider_unauthorized',
  'forbidden',
  'invalid_email',
  'invalid_phone_format',
  'password_too_short',
  'password_too_weak',
  'password_required',
  'factor_id_required',
  'challenge_id_required',
  'recovery_session_required',
  'provider_incomplete_session',
  'provider_error',
  'internal_error',
  'too_many_requests',
  'phone_already_registered',
  'email_already_registered',
  'rate_limited',
  'email_already_exists',
  'phone_already_exists',
]);

/**
 * Coarse HTTP-level codes the backend returns alongside `message`, used as a
 * fallback when `message` isn't one of the precise slugs above (e.g. an
 * unmapped/older backend response).
 */
const CODE_FALLBACK_KEY = {
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_NOT_CONFIRMED: 'email_not_confirmed',
  PHONE_NOT_CONFIRMED: 'phone_not_confirmed',
  OTP_INVALID: 'otp_invalid',
  MFA_INVALID: 'mfa_verification_failed',
  MFA_REQUIRED: 'mfa_required',
  SESSION_EXPIRED: 'session_expired',
  UNAUTHORIZED: 'authentication_required',
  FORBIDDEN: 'forbidden',
  VALIDATION_ERROR: 'validation_error',
  PROVIDER_ERROR: 'provider_error',
  INTERNAL_ERROR: 'internal_error',
  TOO_MANY_REQUESTS: 'too_many_requests',
  PHONE_ALREADY_REGISTERED: 'phone_already_registered',
  EMAIL_ALREADY_REGISTERED: 'email_already_registered',
  RATE_LIMITED: 'rate_limited',
  // Coarse fallback for CONFLICT — only used if `messageMeaning`/`message`
  // aren't one of the precise slugs above. The backend has sent CONFLICT for
  // both email_already_exists and phone_already_exists (each disambiguated
  // via messageMeaning); default to the email variant since it was seen
  // first and is the more common case, but this is a guess if messageMeaning
  // is ever missing on a CONFLICT response.
  CONFLICT: 'email_already_exists',
};

/**
 * Map a backend auth error (thrown by authApi with `.message`/`.code`/
 * `.messageMeaning`) into a user-friendly, localized message.
 *
 * Some responses (e.g. 429 RATE_LIMITED) now send a human-readable `message`
 * sentence plus a separate precise slug in `messageMeaning` — when present,
 * that's the most reliable lookup key, ahead of `message` (which may or may
 * not be a slug depending on the endpoint) and `code` (coarse fallback).
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getAuthErrorMessage(error) {
  const messageMeaning = error && typeof error === 'object' ? error.messageMeaning : undefined;
  const message = error && typeof error === 'object' ? error.message : undefined;
  const code = error && typeof error === 'object' ? error.code : undefined;

  const key = KNOWN_MESSAGE_KEYS.has(messageMeaning)
    ? messageMeaning
    : KNOWN_MESSAGE_KEYS.has(message)
      ? message
      : CODE_FALLBACK_KEY[code] || 'AUTH_ERROR';

  return i18n.t(`auth.errors.${key}`);
}
