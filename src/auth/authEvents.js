/**
 * Tiny pub-sub letting the shared transport layer (src/api/apiBase.js,
 * src/auth/authApi.js) notify the auth store (managers/sessionManager.js) of
 * a `nextStep` seen in an error response — even when the call that hit 401/403
 * came from an unrelated business screen (jobs, payments, ...) that knows
 * nothing about auth routing.
 *
 * Only one listener is ever needed since there is a single sessionManager
 * instance for the whole app.
 */

let listener = null;

/**
 * @param {(nextStep: string) => void} fn
 */
export function setGlobalAuthHandler(fn) {
  listener = fn;
}

/**
 * @param {string} [nextStep]
 */
export function notifyAuthState(nextStep) {
  if (nextStep && listener) {
    listener(nextStep);
  }
}
