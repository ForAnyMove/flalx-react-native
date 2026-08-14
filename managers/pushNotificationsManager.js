import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
    getDevicePushToken,
    getWebPushToken,
    addForegroundNotificationListener,
    addNotificationResponseListener,
    onWebMessage,
} from '../src/services/pushNotificationService';
import { logError, logInfo, logWarn } from '../utils/log_util';

// ─── Notification tap handler ────────────────────────────────────────────────
/**
 * Called when the user taps a push notification (foreground or background).
 * Routes to the appropriate screen based on the `data.type` field that the
 * server includes in the FCM payload.
 *
 * To add navigation for a new notification type:
 *   1. Add a `case 'YOUR_NEW_TYPE':` entry below.
 *   2. Call the appropriate navigation action.
 */
function handleNotificationTap(response) {
    const data = response?.notification?.request?.content?.data;
    if (!data?.type) return;

    logInfo('Notification tapped:', data.type, data);

    switch (data.type) {
        // ─── Job-related ─────────────────────────────────────────────────
        case 'JOB_PROVIDER_ADDED':
        case 'JOB_EXECUTOR_ASSIGNED':
        case 'JOB_STATUS_CHANGED':
        case 'JOB_COMPLETED':
        case 'JOB_PROVIDER_SELECTED':
        case 'JOB_PROVIDER_CONFIRMED':
        case 'JOB_PROVIDER_REJECTED':
        case 'JOB_CONFIRMATION_EXPIRED':
        case 'JOB_CHARGE_COMPLETED':
        case 'JOB_CHARGE_FINAL_FAILED':
        case 'JOB_DELETED':
        case 'JOB_PAYMENT_SUCCESS':
            // TODO Phase 2: navigationRef.navigate('JobDetails', { jobId: data.jobId });
            break;

        // ─── Comments ────────────────────────────────────────────────────
        case 'COMMENT_CREATED':
        case 'COMMENT_REPLIED':
            // TODO Phase 2: navigate to comments section
            break;

        // ─── Subscriptions ───────────────────────────────────────────────
        case 'SUBSCRIPTION_CREATED':
        case 'SUBSCRIPTION_EXPIRED':
        case 'SUBSCRIPTION_RENEWAL_FAILED':
            // TODO Phase 2: navigate to subscription screen
            break;

        // ─── Security ────────────────────────────────────────────────────
        case 'SECURITY_ALERT':
            // TODO Phase 2: navigate to security settings
            break;

        default:
            break;
    }
}

/**
 * usePushNotifications — obtains the FCM token for the current platform
 * (Android native or Web) and sets up notification listeners.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ Phase 1 (current): get FCM token, log it, listen for pushes.      │
 * │ Phase 2 (later):   uncomment registerDevice() calls to send the   │
 * │                     token to the backend for server-side pushes.   │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Should be mounted once per session (i.e. only when the user is logged in).
 *
 * @param {object} session                    — session object from sessionManager
 * @param {function} [onNotification]         — called when a notification arrives in foreground
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
        if (!session?.status) return;

        let unsubForeground = () => {};
        let unsubResponse = () => {};
        let unsubTokenRefresh = () => {};

        async function init() {
            try {
                let token;

                if (Platform.OS === 'web') {
                    // ─── Web: Firebase JS SDK ────────────────────────────────────
                    // Register the Service Worker for background push delivery
                    if ('serviceWorker' in navigator) {
                        try {
                            await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                            logInfo('Firebase messaging SW registered');
                        } catch (e) {
                            logError('SW registration failed:', e);
                        }
                    }

                    token = await getWebPushToken();
                    if (!token) {
                        logWarn('usePushNotifications: web FCM token not obtained');
                        return;
                    }

                    // Listen for foreground messages on web
                    unsubForeground = onWebMessage((payload) => {
                        logInfo('Web foreground push received:', payload);
                        if (onNotification) onNotification(payload);
                    });
                } else {
                    // ─── Native (Android / iOS): expo-notifications + FCM ────────
                    token = await getDevicePushToken();

                    if (!token) {
                        logWarn('usePushNotifications: no FCM token obtained');
                        return;
                    }

                    // Native foreground listener
                    if (onNotification) {
                        unsubForeground = addForegroundNotificationListener(onNotification);
                    }

                    // Tap handler — always active
                    unsubResponse = addNotificationResponseListener(handleNotificationTap);

                    // Token refresh listener — re-register when the FCM token changes
                    const Notifications = require('expo-notifications');
                    const tokenSub = Notifications.addPushTokenListener(({ data }) => {
                        logInfo('usePushNotifications: token refreshed:', data);
                        registeredTokenRef.current = data;
                        // Phase 2: registerDevice(session, data, Platform.OS, 'fcm');
                    });
                    unsubTokenRefresh = () => tokenSub.remove();
                }

                // Avoid redundant work if the token hasn't changed
                if (registeredTokenRef.current === token) return;
                registeredTokenRef.current = token;

                logInfo('usePushNotifications: FCM token ready:', token);

                // Phase 2: uncomment when the server endpoint is ready
                // await registerDevice(session, token, Platform.OS, 'fcm');
                // logInfo('usePushNotifications: device registered on server');

            } catch (e) {
                logError('usePushNotifications: init error', e);
            }
        }

        init();

        return () => {
            unsubForeground();
            unsubResponse();
            unsubTokenRefresh();
        };
    }, [session?.status]);
}
