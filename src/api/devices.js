import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

/**
 * Register a device push token with the backend.
 * @param {object} session
 * @param {string} pushToken  — Expo push token or FCM token
 * @param {string} platform   — 'ios' | 'android' | 'web'
 * @param {string} provider   — 'expo' | 'fcm' (default 'expo')
 * @param {string} [language] — current i18n language on this device (e.g. 'en' | 'he' | 'ru'),
 *   so the backend can localize push notification text per-device rather than per-account —
 *   language here is device-local (see managers/languageManager.js), not an account setting.
 */
export async function registerDevice(session, pushToken, platform, provider = 'expo', language) {
    try {
        await fetchWithSession({
            session,
            endpoint: '/api/devices/register',
            method: 'POST',
            data: {
                pushToken,
                platform,
                provider,
                language,
            },
        });
    } catch (error) {
        logError('Error registering device push token:', error);
        throw error;
    }
}

/**
 * Update the language stored for an already-registered device — called when
 * the user switches the in-app language without re-logging in, so push
 * notification text doesn't stay stuck on whatever language was active at
 * registration time.
 * @param {object} session
 * @param {string} pushToken — the same token that was registered
 * @param {string} language  — new i18n language (e.g. 'en' | 'he' | 'ru')
 */
export async function updateDeviceLanguage(session, pushToken, language) {
    try {
        await fetchWithSession({
            session,
            endpoint: '/api/devices/language',
            method: 'POST',
            data: {
                pushToken,
                language,
            },
        });
    } catch (error) {
        logError('Error updating device language:', error);
        throw error;
    }
}

/**
 * Unregister a device push token from the backend (e.g. on logout).
 * @param {object} session
 * @param {string} pushToken — the same token that was registered
 */
export async function unregisterDevice(session, pushToken) {
    try {
        await fetchWithSession({
            session,
            endpoint: '/api/devices/unregister',
            method: 'POST',
            data: {
                pushToken,
            },
        });
    } catch (error) {
        logError('Error unregistering device push token:', error);
        throw error;
    }
}
