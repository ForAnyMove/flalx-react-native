import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

/**
 * Register a device push token with the backend.
 * @param {object} session
 * @param {string} pushToken  — Expo push token
 * @param {string} platform   — 'ios' | 'android' | 'web'
 */
export async function registerDevice(session, pushToken, platform) {
    try {
        await fetchWithSession({
            session,
            endpoint: '/devices/register',
            method: 'POST',
            data: {
                pushToken,
                platform,
                provider: 'expo',
            },
        });
    } catch (error) {
        logError('Error registering device push token:', error);
        throw error;
    }
}
