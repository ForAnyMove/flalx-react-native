import { Platform } from 'react-native';
import { logError, logInfo, logWarn } from '../../utils/log_util';

// expo-notifications is only usable on native (iOS / Android).
// On web we fall back to the browser Notifications API.
let Notifications = null;
if (Platform.OS !== 'web') {
    Notifications = require('expo-notifications');
}

// ─── Foreground notification behaviour ───────────────────────────────────────
// Show banner + play sound even when the app is in the foreground.
if (Notifications) {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
        }),
    });
}

/**
 * Request notification permissions and return the Expo push token.
 * Returns `null` when:
 *   - Platform is web (use requestWebPermission instead)
 *   - User denies permission
 *   - Running in an environment without a real device (simulator without
 *     projectId configured)
 *
 * @param {string} [projectId] — Expo project ID from app.json `extra.eas.projectId`
 * @returns {Promise<string|null>}
 */
export async function getExpoPushToken(projectId) {
    if (Platform.OS === 'web') {
        logWarn('getExpoPushToken: not supported on web, use requestWebPermission');
        return null;
    }

    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            logWarn('Push notification permission not granted');
            return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
        );
        logInfo('Expo push token obtained:', tokenData.data);
        return tokenData.data;
    } catch (e) {
        logError('Error obtaining Expo push token:', e);
        return null;
    }
}

/**
 * Request browser notification permission (web only).
 * Returns `'granted' | 'denied' | 'default' | 'unsupported'`.
 */
export async function requestWebPermission() {
    if (Platform.OS !== 'web') return 'unsupported';

    if (!('Notification' in window)) {
        logWarn('Browser does not support notifications');
        return 'unsupported';
    }

    if (Notification.permission === 'granted') return 'granted';

    const result = await Notification.requestPermission();
    logInfo('Web notification permission:', result);
    return result;
}

/**
 * Register a listener for notifications received while the app is in the
 * foreground. Returns an unsubscribe function.
 *
 * @param {function} handler — (notification) => void
 * @returns {function} unsubscribe
 */
export function addForegroundNotificationListener(handler) {
    if (!Notifications) return () => { };
    const sub = Notifications.addNotificationReceivedListener(handler);
    return () => sub.remove();
}

/**
 * Register a listener for when the user taps a notification
 * (foreground or background). Returns an unsubscribe function.
 *
 * @param {function} handler — (response) => void
 * @returns {function} unsubscribe
 */
export function addNotificationResponseListener(handler) {
    if (!Notifications) return () => { };
    const sub = Notifications.addNotificationResponseReceivedListener(handler);
    return () => sub.remove();
}
