import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { logError } from '../../utils/log_util';

/**
 * Storage for the backend opaque app session token.
 *
 * NOTE: This token is NOT a Supabase access/refresh token. It is our own
 * backend session token. Supabase tokens must never be stored on the client.
 *
 * Transport model:
 *   - Web: the backend uses an HttpOnly cookie, so there is nothing to store
 *     client-side. These helpers are no-ops on web (getSessionToken -> null).
 *   - Native (iOS/Android): token is stored in expo-secure-store and sent as
 *     `Authorization: Bearer <app_session_token>`.
 */

const AUTH_SESSION_KEY = 'app_session_token';

const isWeb = Platform.OS === 'web';
let cachedSessionToken = undefined

/**
 * Persist the backend app session token (native only).
 * @param {string} token
 */
export async function saveSessionToken(token) {
  if (isWeb || !token) return;
  try {
    await SecureStore.setItemAsync(AUTH_SESSION_KEY, token);
  } catch (e) {
    logError('Failed to save session token:', e);
  }
}

/**
 * Read the backend app session token. Returns null on web (cookie transport).
 * @returns {Promise<string | null>}
 */
export async function getSessionToken() {
  if (isWeb) return null;
  try {
    return await SecureStore.getItemAsync(AUTH_SESSION_KEY);
  } catch (e) {
    logError('Failed to read session token:', e);
    return null;
  }
}

/**
 * Remove the backend app session token (native only).
 */
export async function clearSessionToken() {
  if (isWeb) return;
  try {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
  } catch (e) {
    logError('Failed to clear session token:', e);
  }
}
