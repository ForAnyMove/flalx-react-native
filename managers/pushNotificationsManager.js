import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { registerDevice } from '../src/api/devices';
import {
    getExpoPushToken,
    requestWebPermission,
    addForegroundNotificationListener,
    addNotificationResponseListener,
} from '../src/services/pushNotificationService';
import { logError, logInfo, logWarn } from '../utils/log_util';

/**
 * usePushNotifications — registers for push notifications and keeps the
 * device token in sync with the backend.
 *
 * Should be mounted once per session (i.e. only when the user is logged in).
 *
 * @param {object} session      — session object from sessionManager
 * @param {function} [onNotification]        — called when a notification arrives in foreground
 * @param {function} [onNotificationResponse] — called when the user taps a notification
 */
export default function usePushNotifications({
    session,
    onNotification,
    onNotificationResponse,
} = {}) {
    const registeredTokenRef = useRef(null);

    useEffect(() => {
        // Only run when authenticated
        if (!session?.status || !session?.token?.access_token) return;

        let unsubForeground = () => { };
        let unsubResponse = () => { };

        async function init() {
            try {
                if (Platform.OS === 'web') {
                    // ─── Web: browser Notifications API ──────────────────────────────
                    const permission = await requestWebPermission();
                    if (permission !== 'granted') {
                        logWarn('usePushNotifications: web permission not granted');
                    } else {
                        logInfo('usePushNotifications: web notifications permitted');
                        // FCM integration would go here in the future.
                        // For now, the backend falls back to email for web users.
                    }
                    return;
                }

                // ─── Native: expo-notifications ──────────────────────────────────
                const projectId =
                    Constants.expoConfig?.extra?.eas?.projectId ??
                    Constants.easConfig?.projectId;

                const token = await getExpoPushToken(projectId);

                if (!token) {
                    logWarn('usePushNotifications: no token obtained');
                    return;
                }

                // Avoid re-registering the same token on every render/re-mount
                if (registeredTokenRef.current === token) return;
                registeredTokenRef.current = token;

                await registerDevice(session, token, Platform.OS);
                logInfo('usePushNotifications: device registered with token', token);

                // ─── Listeners ────────────────────────────────────────────────────
                if (onNotification) {
                    unsubForeground = addForegroundNotificationListener(onNotification);
                }
                if (onNotificationResponse) {
                    unsubResponse = addNotificationResponseListener(onNotificationResponse);
                }
            } catch (e) {
                logError('usePushNotifications: init error', e);
            }
        }

        init();

        return () => {
            unsubForeground();
            unsubResponse();
        };
    }, [session?.status, session?.token?.access_token]);
}
