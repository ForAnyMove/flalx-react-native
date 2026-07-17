import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../../utils/log_util';

// Snooze for the MFA "consider setting this up" popup (components/modals/
// MfaRecommendationModal.jsx) — persisted as a target timestamp so it
// survives reloads/app restarts, same web-localStorage/native-AsyncStorage
// split as src/auth/emailResendCooldown.js. Scoped to the specific user id
// (stored alongside the timestamp) so one account's dismissal never
// suppresses the popup for a different user on the same device.
const STORAGE_KEY = 'mfa_recommend_next_show';

export const MFA_RECOMMEND_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

async function readRaw() {
  try {
    const raw = Platform.OS === 'web'
      ? (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
      : await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logError('mfaRecommendCooldown read error:', e);
    return null;
  }
}

async function writeRaw(value) {
  try {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, raw);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    logError('mfaRecommendCooldown write error:', e);
  }
}

/**
 * @param {string} userId
 * @returns {Promise<number | null>} target timestamp (ms) if the popup is
 *   still snoozed for this exact user, else null.
 */
export async function getMfaRecommendCooldownUntil(userId) {
  const stored = await readRaw();
  if (!stored || stored.userId !== userId || !stored.until) return null;
  if (stored.until <= Date.now()) return null;
  return stored.until;
}

/**
 * Record that the user acted on the popup in some way (dismissed, closed,
 * or even just clicked "Enable" without finishing setup) — called at the
 * moment of the click, not just on final close, per the "fixate immediately"
 * requirement.
 */
export async function setMfaRecommendCooldownUntil(userId, until) {
  await writeRaw({ userId, until });
}
