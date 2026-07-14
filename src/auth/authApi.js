import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import { getSessionToken } from './authStorage';
import { notifyAuthState } from './authEvents';
import { logError } from '../../utils/log_util';
import i18n from '../../utils/i18n/i18n';

// Current interface language (e.g. 'en' | 'he' | 'ru'), for backend emails
// that need to be sent in the user's language (forgot-password, email-change
// confirmation). i18n.language is already a plain 2-letter code — see
// managers/languageManager.js#applyLang.
const currentLanguage = () => i18n.language || 'en';

/**
 * Frontend API client for the backend auth endpoints.
 *
 * Principle: the frontend NEVER talks to Supabase directly. All auth actions go
 * through the backend under `${API_BASE_URL}/auth`. The backend owns the
 * server-side Supabase session and issues its own opaque app session token.
 *
 * Transport:
 *   - Web: HttpOnly cookie -> `credentials: 'include'` (no Authorization header).
 *   - Native: `Authorization: Bearer <app_session_token>` from SecureStore.
 *
 * @typedef {'phone' | 'email'} AuthMethod
 * @typedef {'aal1' | 'aal2'} AuthLevel
 *
 * Note: the `AuthUser`/current-user shape now comes from `GET /users/me`
 * (see src/api/users.js#me) alongside `session`/`mfa`/`nextStep` — this file
 * only exposes the `/auth/*` action endpoints, not current-user state.
 *
 * AuthResponse (discriminated by `status`). Register/login endpoints may still
 * include `mfaSetupRequired`/`mfaSetupOptional` on the raw response, but the
 * frontend no longer reads those — after any authenticated-ish response,
 * sessionManager calls refreshMe() and `nextStep` (from GET /users/me) is the
 * single source of truth for routing instead:
 *   - { status: 'authenticated', user, sessionToken?, authLevel?, mfaSetupRequired?, mfaSetupOptional? }
 *   - { status: 'email_confirmation_required' }
 *   - { status: 'phone_confirmation_required' | 'otp_sent' }
 *   - { status: 'mfa_required', authLevel: 'aal1', sessionToken?, mfa: { availableFactors: Array<{ id, type, phone? }> } }
 *   - { status: 'mfa_setup_required', user }
 *   - { status: 'mfa_setup_optional', user }
 *
 * Note on MFA: the app_session already exists at `mfa_required` (native must
 * persist `sessionToken` there too, not just on 'authenticated') — `mfa/verify`
 * only raises that same session's authLevel to aal2, it does not mint a new one.
 */

const AUTH_BASE = '/auth';

/**
 * @template T
 * @param {string} path
 * @param {{ method?: string, body?: any, headers?: Record<string, string> }} [options]
 * @returns {Promise<T>}
 */
async function request(path, options = {}) {
  try {
    const token = await getSessionToken();
    const { body, headers, ...requestOptions } = options;

    const res = await axios({
      url: `${API_BASE_URL}${AUTH_BASE}${path}`,
      ...requestOptions,
      data: body,
      // Required for web HttpOnly cookie sessions.
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        // Native transport: attach the backend app session token when present.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      validateStatus: () => true,
    });

    const data = res.data === '' ? null : res.data;

    if (res.status < 200 || res.status >= 300) {
      const message = data?.message || data?.error || 'Auth request failed';
      const code = data?.code || 'AUTH_ERROR';
      // 401 ({error, nextStep}) and 403 MFA-guard ({code, message, nextStep})
      // bodies use different failure-reason keys, but both carry `nextStep` —
      // key off that uniformly so the auth store can react even when this
      // call didn't originate from an auth-aware screen.
      if (data?.nextStep) {
        notifyAuthState(data.nextStep);
      }
      // Some responses (e.g. 429 RATE_LIMITED) now carry a human-readable
      // `message` plus a separate precise slug in `messageMeaning` — see
      // getAuthErrorMessage(), which prefers messageMeaning when present.
      throw Object.assign(new Error(message), {
        code,
        status: res.status,
        nextStep: data?.nextStep,
        messageMeaning: data?.messageMeaning,
      });
    }

    return data;
  }
  catch (err) {
    logError('Auth error', err);

    throw err;
  }
}

export const authApi = {
  // --- Registration ---

  registerEmail(input /* { email, password, inviteCode? } */) {
    return request('/register/email', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  startPhoneRegistration(input /* { phone } */) {
    return request('/register/phone/start', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // Legacy phone-first registration flow only (MultiStepRegisterScreen.jsx).
  // Deprecated for the simplified flow — use verifyRegistrationPhone below
  // for new registrations (/register/verify-phone, returns nextStep).
  verifyPhoneRegistration(input /* { phone, code } */) {
    return request('/register/phone/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Simplified registration (new flow): phone + password mandatory, email +
   * confirmPassword collected together in one form — `email` is optional
   * (omit/empty if not given). Followed by a mandatory phone OTP step — see
   * verifyRegistrationPhone below (NOT verifyPhoneRegistration above, which
   * is the legacy phone-first flow's verify endpoint). Rejects with
   * PHONE_ALREADY_REGISTERED / EMAIL_ALREADY_REGISTERED if either is already
   * taken (see src/auth/authErrors.js).
   * @param {{ phone: string, email?: string, password: string, confirmPassword: string }} input
   * -> { status: 'otp_sent' | 'phone_confirmation_required' }
   */
  register(input) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Verifies the mandatory phone OTP for the simplified registration flow.
   * Distinct endpoint from the legacy verifyPhoneRegistration above — this
   * one returns `nextStep` directly (same values as GET /users/me) instead
   * of a legacy `status` field.
   * @param {{ phone: string, code: string }} input
   * -> { nextStep: 'authenticated' | 'mfa_setup_required' | 'mfa_setup_optional'
   *    | 'mfa_verification_required', sessionToken?: string,
   *    emailConfirmationSent?: boolean }
   *
   * `emailConfirmationSent` is present ONLY if an email was given at
   * registration (check with `'emailConfirmationSent' in response`, not
   * truthiness) — true means the confirmation email was actually sent,
   * false means the send attempt failed (e.g. the email got taken by
   * someone else while the user was entering the OTP).
   */
  verifyRegistrationPhone(input) {
    return request('/register/verify-phone', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Resends (or checks the status of) the mandatory registration phone OTP.
   * `manual: false`/omitted (auto-call on entering the OTP screen) checks the
   * DB first — if the previous code hasn't expired yet, no SMS is sent, the
   * backend just replies `{status:'otp_still_active', expiresInSeconds}`.
   * `manual: true` (the "Resend code" button) skips that still-active check
   * but is still subject to rate limiting (429 RATE_LIMITED — see
   * authErrors.js). Either way, a successful send/still-active response
   * carries `expiresInSeconds` — don't hardcode a cooldown duration on the
   * frontend, use this instead.
   * @param {{ phone: string, manual?: boolean }} input
   * -> { status: 'otp_sent' | 'otp_still_active', expiresInSeconds: number }
   */
  resendRegistrationPhoneOtp(input) {
    return request('/register/resend-phone-otp', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // --- Login ---

  loginEmail(input /* { email, password } */) {
    return request('/login/email', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  startPhoneLogin(input /* { phone } */) {
    return request('/login/phone/start', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifyPhoneLogin(input /* { phone, code } */) {
    return request('/login/phone/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Simplified login (new flow): a single `login` field that accepts either a
   * phone number or an email — the backend detects/normalizes which. No OTP
   * step; a `mfa_required` status is handled exactly like the existing
   * login-time MFA flow (see MultiStepLoginScreen.jsx's inline handling).
   * @param {{ login: string, password: string }} input
   */
  login(input) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // --- Session ---
  // NOTE: GET /auth/me is legacy/unused — it only ever returned
  // { user: CurrentUser | null } and was never upgraded with the
  // session/mfa/nextStep fields. Current-user state comes from
  // GET /users/me instead (see src/api/users.js#me), which returns
  // everything in one call. Do not reintroduce a call to /auth/me here.

  logout() {
    return request('/logout', { method: 'POST' });
  },

  logoutAll() {
    return request('/logout-all', { method: 'POST' });
  },

  // --- MFA ---
  // MFA is Supabase Auth MFA end-to-end now (no custom Twilio/user_security
  // route) — it's state on the same app_session (see `authLevel: 'aal1'|'aal2'`
  // on login/verify/me responses), not a separate mfa_token cookie.

  enrollMfa(input /* { type: 'totp' | 'phone', phone? } */) {
    return request('/mfa/enroll', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  challengeMfa(input /* { factorId } */) {
    return request('/mfa/challenge', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  verifyMfa(input /* { factorId, challengeId, code } */) {
    return request('/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  unenrollMfa(input /* { factorId } */) {
    return request('/mfa/unenroll', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * List the current user's MFA factors (including unverified/abandoned
   * enrollments). Needed for flows like "change the phone number bound to
   * MFA" which require an existing factor's `factorId` (enroll/challenge/
   * verify responses are the only other source of it, and only at the moment
   * they happen) — also useful for a general "my sign-in methods" UI.
   * @returns {Promise<{ factors: Array<{
   *   id: string,
   *   type: 'totp' | 'phone',
   *   status: 'verified' | 'unverified',
   *   phone?: string,
   *   friendlyName?: string,
   *   createdAt?: string,
   * }> }>}
   */
  listMfaFactors() {
    return request('/mfa/factors', { method: 'GET' });
  },

  // --- Change email / phone / password (account identity, not MFA) ---
  // These change the account's own email/phone/password — distinct from the
  // MFA endpoints above, which manage second-factor devices.

  /**
   * Starts an email change. Applied immediately if the project has "secure
   * email change" confirmation disabled (`{status:'ok'}`), otherwise Supabase
   * emails a confirmation link to the new address and there is no in-app
   * verify step — `/auth/me` reflects the change once confirmed
   * (`{status:'email_confirmation_required'}`).
   * @param {{ newEmail: string }} input
   */
  startEmailChange(input) {
    return request('/change-email/start', {
      method: 'POST',
      body: JSON.stringify({ ...input, language: currentLanguage() }),
    });
  },

  /**
   * Changes the account's email immediately, with no confirmation link/step
   * of any kind — used by the Profile screen's email-change UI instead of
   * startEmailChange above (which is confirmation-based and no longer used
   * there, but stays available/untouched for any other future use).
   * @param {{ newEmail: string }} input -> { status: 'ok' }
   */
  changeEmailDirect(input) {
    return request('/change-email/direct', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Starts an account phone number change — sends an SMS OTP to the new
   * number. @param {{ newPhone: string }} input -> { status: 'otp_sent' }
   */
  startPhoneChange(input) {
    return request('/change-phone/start', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Verifies the OTP sent to the new phone number, completing the change.
   * @param {{ phone: string, code: string }} input -> { status: 'ok' }
   */
  verifyPhoneChange(input) {
    return request('/change-phone/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Changes the current user's password (while authenticated). Synchronous —
   * no email, no session change. If MFA is enabled and the session is still
   * aal1, the backend returns 403 MFA_REQUIRED (mfa_required_for_password_change).
   * @param {{ currentPassword?: string, newPassword: string }} input -> { status: 'ok' }
   */
  changePassword(input) {
    return request('/change-password', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  // --- Forgot password (logged-out user) ---
  // Supabase emails a link to `email`, pointing at a page the backend hosts
  // itself (reset-password.html) — the user resets their password there, not
  // in this app. The app's only job is to fire this request and tell the
  // user to check their email; there is no in-app verify/reset step.

  /** @param {{ email: string }} input -> { status: 'ok' } */
  forgotPassword(input) {
    return request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ ...input, language: currentLanguage() }),
    });
  },

  // --- Forgot password by phone (new simplified flow, logged-out user) ---
  // Primary recovery channel now that email verification isn't mandatory at
  // registration (an unverified email is a weak recovery channel) — see the
  // rework_auth simplified-flow notes. 3 steps: start (send OTP), verify OTP
  // (returns a short-lived, single-use resetToken), then reset with that token.

  /**
   * Same `manual` semantics as resendRegistrationPhoneOtp above: omitted/false
   * for the OTP screen's auto-check on entry, true for an explicit "Resend
   * code" click — still subject to rate limiting either way. Unlike the
   * registration resend, the response is always the same generic
   * `otp_sent_if_account_exists` regardless of whether the phone is actually
   * registered or the code was already active — anything phone-existence-
   * revealing (including a differing status) would be an account-enumeration
   * leak, so don't branch UI on this response's shape.
   * @param {{ phone: string, manual?: boolean }} input
   * -> { status: 'otp_sent_if_account_exists' }
   */
  forgotPasswordByPhone(input) {
    return request('/password/forgot-phone', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /** @param {{ phone: string, code: string }} input -> { status: 'verified', resetToken: string } */
  verifyPasswordResetPhoneOtp(input) {
    return request('/password/verify-phone-reset', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  /**
   * Revokes all of the user's sessions (not just this app_session) — no
   * auto-login after this, always a fresh, deliberate sign-in.
   * @param {{ resetToken: string, newPassword: string, confirmPassword: string }} input
   * -> { status: 'password_updated' }
   */
  resetPasswordByPhone(input) {
    return request('/password/reset-phone', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },
};
