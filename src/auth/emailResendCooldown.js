import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../../utils/log_util';

// "Resend confirmation email" cooldown for UpdateEmailModal — persisted as a
// target timestamp so it survives reloads/app restarts, same web-
// localStorage/native-AsyncStorage split as managers/themeManager.js /
// languageManager.js. Scoped to the specific email it was set for (stored
// alongside the timestamp) so a stale cooldown never applies to a different
// address.
const STORAGE_KEY = 'email_confirm_resend_cooldown';

async function readRaw() {
  try {
    const raw = Platform.OS === 'web'
      ? (typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null)
      : await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    logError('emailResendCooldown read error:', e);
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
    logError('emailResendCooldown write error:', e);
  }
}

/**
 * @param {string} email
 * @returns {Promise<number | null>} target timestamp (ms) if a cooldown is
 *   still active for this exact email, else null.
 */
export async function getResendCooldownUntil(email) {
  const stored = await readRaw();
  if (!stored || stored.email !== email || !stored.until) return null;
  if (stored.until <= Date.now()) return null;
  return stored.until;
}

export async function setResendCooldownUntil(email, until) {
  await writeRaw({ email, until });
}
