import axios from 'axios';
import { API_BASE_URL } from '../../utils/config';
import { getSessionToken } from './authStorage';
import { logError } from '../../utils/log_util';

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
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string | null} [email]
 * @property {string | null} [phone]
 * @property {boolean} emailVerified
 * @property {boolean} phoneVerified
 * @property {boolean} mfaEnabled
 * @property {AuthLevel} authLevel
 * @property {Array<'email' | 'phone' | 'google' | 'saml' | 'custom'>} providers
 *
 * AuthResponse (discriminated by `status`):
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
      throw Object.assign(new Error(message), { code, status: res.status });
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

  verifyPhoneRegistration(input /* { phone, code } */) {
    return request('/register/phone/verify', {
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

  // --- Session ---

  me() {
    return request('/me', { method: 'GET' });
  },

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
      body: JSON.stringify(input),
    });
  },
};
