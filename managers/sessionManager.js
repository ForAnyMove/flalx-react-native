import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../utils/config';
import { authApi } from '../src/auth/authApi';
import { setGlobalAuthHandler } from '../src/auth/authEvents';
import {
  saveSessionToken,
  getSessionToken,
  clearSessionToken,
} from '../src/auth/authStorage';
import { fetchWithSession } from '../src/api/apiBase';
import { getRevealedUsers, getRevealProduct, revealUser, me as fetchUsersMe } from '../src/api/users';
import { getUserSubscription } from '../src/api/subscriptions';
import { getAuthErrorMessage } from '../src/auth/authErrors';
import { logError, logInfo, logWarn } from '../utils/log_util';

// nextStep values that mean a session actually exists and GET /users/me can
// be called — the whitelist (not a blacklist of 'login_required') because
// endpoints keep adding new pre-session nextStep values (e.g. login's
// `phone_verification_required` for an unconfirmed account) that must NOT
// trigger refreshMe(). See handleAuthResponse below.
const SESSION_ESTABLISHED_NEXT_STEPS = new Set([
  'authenticated',
  'mfa_setup_required',
  'mfa_setup_optional',
  'mfa_verification_required',
]);

/**
 * Backend-driven auth store.
 *
 * The frontend no longer talks to Supabase. All auth goes through the backend
 * `/auth/*` endpoints (see src/auth/authApi.js). Session transport:
 *   - Web: HttpOnly cookie (credentials: 'include').
 *   - Native: opaque backend app session token in expo-secure-store, sent as
 *     `Authorization: Bearer <token>`.
 *
 * `authUser` is the backend identity, `user` is the app profile (account_type,
 * firstauth, professions, ...) — both come from a single `GET /users/me` call
 * (src/api/users.js#me), which is also the source of `authLevel`/`mfa`/
 * `nextStep`. `nextStep` is the single source of truth for what screen the
 * app shows (see App.js) — `GET /auth/me` is legacy and unused now.
 *
 * @param {{ setAppLoading?: (isLoading: boolean) => void }} [deps]
 */
export default function sessionManager({ setAppLoading } = {}) {
  const [authUser, setAuthUser] = useState(null); // CurrentUser from /users/me
  const [user, setUser] = useState(null); // app profile
  const [subscription, setSubscription] = useState(null);
  const [revealedUsers, setRevealedUsers] = useState([]);
  const [revealProduct, setRevealProduct] = useState(null);
  // Native only: the backend app session token kept in memory to build the
  // Authorization header for data-API calls. Null on web (cookie transport).
  const [appSessionToken, setAppSessionToken] = useState(null);
  const [authLevel, setAuthLevel] = useState('aal1');
  // Full mfa object from /users/me: { policy, enabled, required, setupRequired,
  // verificationRequired, allowedFactors, recommendedFactor?, availableFactors?,
  // setupRecommended? }. MFA is now optional (nextStep goes straight to
  // 'authenticated' even with no MFA set up) — setupRecommended (ASSUMED
  // present here and on /register/verify-phone + /auth/mfa/verify, not
  // confirmed against real backend source) signals whether to nudge the user
  // to set it up anyway via a dismissible in-app popup rather than a
  // blocking screen. Read as session.mfa?.setupRecommended — see
  // AppMainScreen.jsx.
  const [mfa, setMfa] = useState(null);
  // Drives app-level routing (see App.js): 'authenticated' | 'mfa_setup_required'
  // | 'mfa_verification_required' | 'login_required'.
  const [nextStep, setNextStep] = useState('login_required');

  const [isLoader, setLoader] = useState(true);

  const isAuthenticated = !!authUser;

  // A session-like object accepted by the shared data-API helpers. `token` is
  // kept as `{ access_token }` for backwards compatibility with data managers
  // that build their own Authorization header — but it now carries the backend
  // app session token (native) rather than a Supabase token.
  const apiSession = {
    serverURL: API_BASE_URL,
    token: isAuthenticated ? { access_token: appSessionToken } : null,
  };

  // Load auth state on start.
  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Let the shared transport layer (src/api/apiBase.js, src/auth/authApi.js)
  // push a nextStep here when it sees one in an error response — even when the
  // failing call came from an unrelated business screen (jobs/payments/...).
  useEffect(() => {
    setGlobalAuthHandler((pushedNextStep) => {
      if (pushedNextStep === 'login_required') {
        clearAuthState();
      } else if (pushedNextStep) {
        setNextStep(pushedNextStep);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap() {
    try {
      if (Platform.OS !== 'web') {
        const token = await getSessionToken();
        setAppSessionToken(token);
        // No stored token on native => definitely unauthenticated, skip /me.
        if (!token) {
          setLoader(false);
          return;
        }
      }
      await refreshMe();
    } catch (e) {
      logError('Auth bootstrap error:', e);
    } finally {
      setLoader(false);
    }
  }

  // >>> CORE SESSION <<<

  async function clearAuthState() {
    setAuthUser(null);
    setUser(null);
    setSubscription(null);
    setRevealedUsers([]);
    setRevealProduct(null);
    setAuthLevel('aal1');
    setMfa(null);
    setNextStep('login_required');
    setAppSessionToken(null);
    await clearSessionToken();
  }

  /**
   * Fetch everything current-user-related in one call: profile, subscription,
   * auth identity, authLevel, mfa policy, and nextStep (the routing signal
   * App.js reads). On 401/no-user, clears local auth state.
   */
  async function refreshMe() {
    try {
      const data = await fetchUsersMe(apiSession);

      if (!data) {
        await clearAuthState();
        return;
      }

      setAuthUser(data.user ?? null);
      setUser(data.profile ?? null);
      setSubscription(data.subscription ?? null);
      setAuthLevel(data.session?.authLevel ?? 'aal1');
      setMfa(data.mfa ?? null);
      setNextStep(data.nextStep ?? 'login_required');

      // Best-effort side data; failures shouldn't block auth.
      await Promise.allSettled([
        refreshRevealedUsers(),
        refreshRevealProduct(),
      ]);
    } catch (e) {
      if (e?.status === 401 || e?.nextStep === 'login_required') {
        await clearAuthState();
        return;
      }
      logError('refreshMe error:', e.message || e);
    }
  }

  /**
   * Normalize an AuthResponse. For authenticated-ish responses, persist the
   * app session token (native) and refresh the current user — `nextStep` from
   * that refresh (not any locally-derived flag) is what decides which screen
   * App.js shows next. Returns the response so callers can still branch on
   * `status` for flow control (e.g. email_confirmation_required).
   */
  async function handleAuthResponse(resp) {
    if (!resp) return { status: 'error' };
    console.log(resp);


    // MFA is Supabase Auth MFA on the same app_session now: the session (and
    // its sessionToken, for native) already exists at `mfa_required` (aal1),
    // not just once fully 'authenticated' — persist it here too, otherwise
    // the following /mfa/challenge and /mfa/verify calls have no Bearer token
    // on native and fail with authentication_required.
    if (resp.sessionToken) {
      await saveSessionToken(resp.sessionToken);
      setAppSessionToken(resp.sessionToken);
    }

    // Newer endpoints (e.g. /register/verify-phone) return `nextStep`
    // directly instead of the legacy `status` field. Only refresh full user
    // state when nextStep says a session actually exists — e.g. login's
    // `phone_verification_required` (unconfirmed phone) carries a nextStep
    // too, but there's no session to fetch yet until that's completed, so
    // calling refreshMe()/GET /users/me here would be premature (and likely
    // 401). Callers branch on the returned resp.nextStep themselves for
    // anything not in this whitelist (mirrors the 'mfa_required' status
    // case below, which has always been left to the caller).
    if (resp.nextStep) {
      if (SESSION_ESTABLISHED_NEXT_STEPS.has(resp.nextStep)) {
        await refreshMe();
      }
      return resp;
    }

    switch (resp.status) {
      case 'authenticated':
      case 'mfa_setup_required':
      case 'mfa_setup_optional': {
        await refreshMe();
        return resp;
      }
      case 'mfa_required': {
        // Login-time only: MultiStepLoginScreen manages its own local factor
        // list/selection state from resp.mfa — nothing to persist here.
        return resp;
      }
      default:
        // email_confirmation_required / phone_confirmation_required / otp_sent
        return resp;
    }
  }

  async function logout() {
    setAppLoading?.(true);
    try {
      await authApi.logout();
    } catch (e) {
      logWarn('Backend logout failed (clearing local state anyway):', e.message || e);
    } finally {
      await clearAuthState();
      setAppLoading?.(false);
    }
  }

  // >>> REGISTRATION <<<

  async function registerEmailFlow(input) {
    // input: { email, password, inviteCode? }
    return handleAuthResponse(await authApi.registerEmail(input));
  }

  async function startPhoneRegistration(input) {
    // input: { phone }  -> { status: 'otp_sent' | 'phone_confirmation_required' }
    return authApi.startPhoneRegistration(input);
  }

  async function verifyPhoneRegistration(input) {
    // input: { phone, code }
    return handleAuthResponse(await authApi.verifyPhoneRegistration(input));
  }

  // >>> LOGIN <<<

  async function loginEmailFlow(input) {
    // input: { email, password }
    return handleAuthResponse(await authApi.loginEmail(input));
  }

  async function startPhoneLogin(input) {
    return authApi.startPhoneLogin(input);
  }

  async function verifyPhoneLogin(input) {
    return handleAuthResponse(await authApi.verifyPhoneLogin(input));
  }

  // >>> SIMPLIFIED PASSWORD-BASED FLOW <<<
  // Single phoneOrEmail+password login, phone+email+password registration
  // gated by a mandatory phone OTP, phone-based password reset. Parallel to
  // the flows above — those stay untouched and still work.

  async function loginUnified(input) {
    // input: { login, password } -> handled exactly like loginEmailFlow/
    // verifyPhoneLogin above: 'authenticated' | 'mfa_required' | ...
    return handleAuthResponse(await authApi.login(input));
  }

  async function registerUnified(input) {
    // input: { phone, email, password, confirmPassword }
    // -> { status: 'otp_sent' | 'phone_confirmation_required' } — no session
    // yet; verifyRegistrationPhone below is what actually establishes it.
    return authApi.register(input);
  }

  async function verifyRegistrationPhone(input) {
    // input: { phone, code } -> the simplified flow's dedicated verify
    // endpoint (/register/verify-phone, returns nextStep directly) — NOT
    // verifyPhoneRegistration above, which is the legacy phone-first flow's
    // endpoint (still used by MultiStepRegisterScreen.jsx).
    return handleAuthResponse(await authApi.verifyRegistrationPhone(input));
  }

  // Resends/checks the registration phone OTP. manual=false is the OTP
  // screen's own auto-check on entry (won't re-send if the previous code is
  // still active); manual=true is an explicit "Resend code" click. Either
  // way returns expiresInSeconds so the UI doesn't hardcode a cooldown.
  async function resendRegistrationPhoneOtp(phone, manual = false) {
    try {
      const resp = await authApi.resendRegistrationPhoneOtp({ phone, manual });
      return { success: true, ...resp };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // Same manual=false/true semantics as resendRegistrationPhoneOtp above.
  // Response is always the generic otp_sent_if_account_exists (see
  // authApi.js) — don't branch UI on its shape, just on success/error.
  async function forgotPasswordByPhone(phone, manual = false) {
    try {
      const resp = await authApi.forgotPasswordByPhone({ phone, manual });
      return { success: true, ...resp };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  async function verifyPasswordResetPhoneOtp(phone, code) {
    try {
      const resp = await authApi.verifyPasswordResetPhoneOtp({ phone, code });
      return { success: true, resetToken: resp?.resetToken };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  async function resetPasswordByPhone(input) {
    // input: { resetToken, newPassword, confirmPassword }
    // -> { status: 'password_updated' }. Confirmed: no sessionToken, no
    // auto-login — the backend revokes ALL of the user's sessions on
    // success, so this deliberately doesn't touch local auth state; the
    // caller routes back to sign-in.
    try {
      const resp = await authApi.resetPasswordByPhone(input);
      return { success: true, ...resp };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // >>> MFA <<<
  // Supabase Auth MFA end-to-end (no custom Twilio route anymore): enroll only
  // registers the factor, challenge is what actually sends the SMS, verify
  // raises the existing app_session's authLevel to aal2 (no new token minted).

  async function enrollMfa(input) {
    // input: { type: 'totp' | 'phone', phone? }
    // -> phone: { factorId, type: 'phone' }
    // -> totp:  { factorId, type: 'totp', qrCode, secret, uri }
    return authApi.enrollMfa(input);
  }

  async function challengeMfa(input) {
    // input: { factorId } -> { challengeId, factorId } (SMS sent here for phone factors)
    return authApi.challengeMfa(input);
  }

  async function verifyMfa(input) {
    // input: { factorId, challengeId, code } -> authenticated (aal2)
    return handleAuthResponse(await authApi.verifyMfa(input));
  }

  async function unenrollMfa(input) {
    // input: { factorId } -> { status: 'ok' }
    const result = await authApi.unenrollMfa(input);
    // Unlike verifyMfa, this doesn't go through handleAuthResponse — nothing
    // else refreshes mfa.enabled/nextStep after a factor is removed, so do
    // it explicitly here (Profile's Security block reads session.mfa.enabled
    // reactively and needs this to flip back to "off").
    await refreshMe();
    return result;
  }

  async function listMfaFactors() {
    // -> { factors: Array<{ id, type, phone?, status? }> }
    return authApi.listMfaFactors();
  }

  // >>> BACKWARDS-COMPATIBLE WRAPPERS <<<
  // Kept so screens that still reference the old method names keep working.

  async function signInWithPassword(email, password) {
    try {
      const resp = await loginEmailFlow({ email, password });
      if (resp.status === 'authenticated') return { success: true };
      if (resp.status === 'mfa_required') {
        return { success: false, mfaRequired: true, mfa: resp.mfa };
      }
      return { success: false, error: resp.status };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async function createUser(email, password, _options = {}, referralCode = null) {
    try {
      const resp = await registerEmailFlow({
        email,
        password,
        inviteCode: referralCode || null,
      });
      if (resp.status === 'email_confirmation_required') {
        return { success: true, requiresEmailConfirmation: true };
      }
      if (
        resp.status === 'authenticated' ||
        resp.status === 'mfa_setup_required' ||
        resp.status === 'mfa_setup_optional'
      ) {
        return { success: true, ...resp };
      }
      return { success: false, error: resp.status };
    } catch (e) {
      const err = String(e.message || e).toLowerCase();
      if (err.includes('already') || err.includes('exists')) {
        return { success: false, error: e.message, isUserExists: true };
      }
      return { success: false, error: e.message };
    }
  }

  async function createUserWithPhone(phone) {
    try {
      const resp = await startPhoneRegistration({ phone });
      return { success: true, ...resp };
    } catch (e) {
      const err = String(e.message || e).toLowerCase();
      if (err.includes('already') || err.includes('exists')) {
        return { success: false, error: e.message, isUserExists: true };
      }
      return { success: false, error: e.message };
    }
  }

  async function verifyPhoneOtp(phone, code) {
    try {
      const resp = await verifyPhoneRegistration({ phone, code });
      logInfo('verifyPhoneOtp resp:', resp);
      if (
        resp.status === 'authenticated' ||
        resp.status === 'mfa_setup_required' ||
        resp.status === 'mfa_setup_optional'
      ) {
        return { success: true, ...resp };
      }
      return { success: false, error: resp.status };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // >>> APP PROFILE <<<

  async function updateUser(updates) {
    try {
      const res = await fetchWithSession({
        session: apiSession,
        endpoint: '/users/me',
        method: 'PATCH',
        data: updates,
      });
      const updatedUser = res?.data?.profile ?? res?.data ?? null;
      if (updatedUser) setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      logError('Ошибка updateUser:', err.message);
      throw err;
    }
  }

  function setPendingAvatar(avatarUrl) {
    setUser((prev) => ({ ...prev, pending_avatar: avatarUrl }));
  }

  // Patch the locally-cached app profile without a network round-trip — used
  // to reflect server-pushed facts (e.g. the PHONE_CHANGED/EMAIL_CHANGED
  // WebSocket events) instantly, since the backend now owns syncing its own
  // profile record for those fields (see auth change-phone/change-email flows).
  function patchLocalUser(fields) {
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  // Same idea, but for the auth identity object (session.authUser) instead
  // of the app profile — e.g. EMAIL_CHANGED now carries `emailVerified`
  // directly, so the Profile "not confirmed" warning can update instantly
  // without waiting on a full refreshMe() round-trip.
  function patchLocalAuthUser(fields) {
    setAuthUser((prev) => (prev ? { ...prev, ...fields } : prev));
  }

  async function deleteUser() {
    try {
      await fetchWithSession({
        session: apiSession,
        endpoint: '/users/me',
        method: 'DELETE',
      });
      logInfo('Пользователь удалён');
      await logout();
    } catch (err) {
      logError('Ошибка deleteUser:', err.message);
      throw err;
    }
  }

  // Change the current (authenticated) user's password. Synchronous — no
  // email step, no logout: the app_session (cookie/sessionToken) is left
  // untouched by the backend. If MFA is enabled and the session is still
  // aal1, the backend returns 403 MFA_REQUIRED (mfa_required_for_password_change).
  async function changePassword(oldPassword, newPassword) {
    try {
      if (!isAuthenticated) {
        return { success: false, error: getAuthErrorMessage({ code: 'UNAUTHORIZED' }) };
      }
      await authApi.changePassword({ currentPassword: oldPassword, newPassword });
      return { success: true };
    } catch (e) {
      logError('changePassword error:', e.message || e);
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // Request a password-reset email for a logged-out user. The link in that
  // email points at a page hosted by the backend itself (reset-password.html)
  // — the app has no further role and no deep-link/redirect handling to do.
  async function forgotPassword(email) {
    try {
      await authApi.forgotPassword({ email });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // Change the account's own email. Applied immediately, or Supabase emails a
  // confirmation link to the new address (no in-app verify step either way —
  // see authApi.startEmailChange).
  async function updateEmail(newEmail) {
    try {
      await authApi.startEmailChange({ newEmail });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // Changes the account's own email immediately, no confirmation of any kind
  // — used by Profile's email-change modal instead of updateEmail above.
  // Refresh /users/me right after so authUser.email reflects it without
  // waiting on the EMAIL_CHANGED websocket event.
  async function updateEmailDirect(newEmail) {
    try {
      await authApi.changeEmailDirect({ newEmail });
      await refreshMe();
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // Change the account's own phone number (NOT an MFA factor — see
  // enrollMfa/unenrollMfa above for that). Two steps: start sends an SMS OTP
  // to the new number, verify completes the change.
  async function changePhoneStart(newPhone) {
    try {
      await authApi.startPhoneChange({ newPhone });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  async function changePhoneVerify(phone, code) {
    try {
      await authApi.verifyPhoneChange({ phone, code });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }

  // Static helper unchanged (test stub until a backend endpoint exists).
  async function getWhatsAppNumber() {
    return '+19876543210';
  }

  // NOTE: password-reset / create-password flows are not part of the backend
  // auth contract yet. They previously used Supabase directly (removed). Until
  // the backend exposes reset endpoints these return a soft "not implemented"
  // so the UI degrades gracefully instead of crashing. See docs/rework_auth.md.
  function notImplemented(name) {
    logWarn(`[auth] ${name} is not implemented against the backend yet.`);
    return { success: false, error: 'not_implemented' };
  }

  // >>> SUBSCRIPTION / REVEAL <<<

  function isHasSubscription() {
    if (!subscription) return false;
    const currentDate = new Date();
    const expiryDate = new Date(subscription.expiry);
    return expiryDate > currentDate;
  }

  async function refreshRevealedUsers(sessionProps = null) {
    try {
      const revealed = await getRevealedUsers(sessionProps || apiSession);
      setRevealedUsers(revealed.map((u) => u.id));
    } catch (error) {
      logError('Error refreshing revealed users:', error);
    }
  }

  async function refreshRevealProduct(sessionProps = null) {
    try {
      const revealed = await getRevealProduct(sessionProps || apiSession);
      setRevealProduct(revealed);
    } catch (error) {
      logError('Error refreshing reveal product:', error);
    }
  }

  async function refreshUserSubscription(sessionProps = null) {
    try {
      const { subscription: sub } = await getUserSubscription(
        sessionProps || apiSession
      );
      setSubscription(sub);
    } catch (error) {
      logError('Error refreshing user subscription:', error);
    }
  }

  async function tryReveal(userId, paymentOptions = {}) {
    const resolvedOptions =
      typeof paymentOptions === 'boolean'
        ? { useCoupon: paymentOptions }
        : paymentOptions;

    if (revealedUsers.includes(userId)) return;

    try {
      const data = await revealUser(userId, apiSession, resolvedOptions);
      if (data.user) {
        setRevealedUsers((prev) => [...prev, userId]);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  return {
    session: {
      // Data-loading gate used throughout the app (jobsManager, paymentsManager,
      // etc.) — true only once the backend says the user is fully inside the
      // app, not just mid-MFA-setup/verification.
      status: nextStep === 'authenticated',
      token: apiSession.token,
      // Single source of truth for auth/MFA routing — see App.js.
      nextStep,
      mfa,
      authLevel,
      authUser,
      patchLocalAuthUser,
      serverURL: API_BASE_URL,

      // New backend flows
      registerEmail: (input) => registerEmailFlow(input),
      startPhoneRegistration,
      verifyPhoneRegistration,
      loginEmail: (input) => loginEmailFlow(input),
      startPhoneLogin,
      verifyPhoneLogin,

      // Simplified password-based flow (parallel, see above)
      loginUnified,
      registerUnified,
      verifyRegistrationPhone,
      resendRegistrationPhoneOtp,
      forgotPasswordByPhone,
      verifyPasswordResetPhoneOtp,
      resetPasswordByPhone,

      enrollMfa,
      challengeMfa,
      verifyMfa,
      unenrollMfa,
      listMfaFactors,
      refreshMe,
      logout,
      signOut: logout,

      // Backwards-compatible wrappers
      signInWithPassword: (email, password) => signInWithPassword(email, password),
      createUser: (email, password, options, referralCode) =>
        createUser(email, password, options, referralCode),
      createUserWithPhone: (phone) => createUserWithPhone(phone),
      verifyPhoneOtp: (phone, code) => verifyPhoneOtp(phone, code),
      changePassword: (oldPassword, newPassword) =>
        changePassword(oldPassword, newPassword),
      changePhoneStart,
      changePhoneVerify,
      forgotPassword,
      getWhatsAppNumber: () => getWhatsAppNumber(),

      // OTP-only users (no password set yet) don't get a "create password"
      // flow for now — the button is hidden in Profile, this is just a safe
      // fallback if that code path is ever reached anyway.
      createPassword: () => notImplemented('createPassword'),
    },
    user: {
      current: user,
      update: updateUser,
      updateEmail,
      updateEmailDirect,
      delete: deleteUser,
      setPendingAvatar,
      patchLocal: patchLocalUser,
    },
    subscription: {
      current: subscription,
      isActive: isHasSubscription(),
      refresh: () => refreshUserSubscription(),
    },
    usersReveal: {
      list: revealedUsers,
      product: revealProduct,
      contains: (userId) =>
        subscription != null || revealedUsers.includes(userId),
      tryReveal,
      refresh: refreshRevealedUsers,
      appendRevealed: (userId) => {
        if (revealedUsers.includes(userId)) return;
        setRevealedUsers((prev) => [...prev, userId]);
      },
    },
    isLoader,
  };
}
