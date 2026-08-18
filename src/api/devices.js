import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

/**
 * Register a device push token with the backend.
 * @param {object} session
 * @param {string} pushToken  — Expo push token or FCM token
 * @param {string} platform   — 'ios' | 'android' | 'web'
 * @param {string} provider   — 'expo' | 'fcm' (default 'expo')
 */
export async function registerDevice(session, pushToken, platform, provider = 'expo') {
    try {
        await fetchWithSession({
            session,
            endpoint: '/api/devices/register',
            method: 'POST',
            data: {
                pushToken,
                platform,
                provider,
            },
        });
    } catch (error) {
        logError('Error registering device push token:', error);
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
