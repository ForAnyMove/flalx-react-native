import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import {
    getDevicePushToken,
    getWebPushToken,
    addForegroundNotificationListener,
    addNotificationResponseListener,
    onWebMessage,
} from '../src/services/pushNotificationService';
import { registerDevice } from '../src/api/devices';
import { logError, logInfo, logWarn } from '../utils/log_util';

// Module-level (not per-hook-instance) so sessionManager.logout() can read the
// last-registered token to unregister it from the backend before the session
// (and its auth header) is torn down. Safe because usePushNotifications is
// mounted exactly once per app (see App.js).
let lastRegisteredToken = null;

export function getRegisteredPushToken() {
    return lastRegisteredToken;
}

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
                    let swRegistration;
                    if ('serviceWorker' in navigator) {
                        try {
                            // Build the query string with process.env values to pass config securely to the static Service Worker
                            const swUrl = `/firebase-messaging-sw.js?apiKey=${process.env.EXPO_PUBLIC_FIREBASE_API_KEY}&authDomain=${process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN}&projectId=${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}&storageBucket=${process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET}&messagingSenderId=${process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}&appId=${process.env.EXPO_PUBLIC_FIREBASE_APP_ID}`;
                            swRegistration = await navigator.serviceWorker.register(swUrl);
                            logInfo('Firebase messaging SW registered');
                        } catch (e) {
                            logError('SW registration failed:', e);
                        }
                    }

                    // Pass the registration through so getToken() reuses our SW
                    // (with the config baked into its query string) instead of
                    // trying to register its own default, unconfigured one.
                    token = await getWebPushToken(swRegistration);
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
                        lastRegisteredToken = data;
                        registerDevice(session, data, Platform.OS, 'fcm').catch((e) =>
                            logError('usePushNotifications: token refresh registration failed', e)
                        );
                    });
                    unsubTokenRefresh = () => tokenSub.remove();
                }

                // Avoid redundant work if the token hasn't changed
                if (registeredTokenRef.current === token) return;
                registeredTokenRef.current = token;
                lastRegisteredToken = token;

                logInfo('usePushNotifications: FCM token ready:', token);

                await registerDevice(session, token, Platform.OS, 'fcm');
                logInfo('usePushNotifications: device registered on server');

            } catch (e) {
                logError('usePushNotifications: init error', e);
            }
        }

        init();

        return () => {
            unsubForeground();
            unsubResponse();
            unsubTokenRefresh();
            // Reset dedup state on session change (e.g. logout) — sessionManager
            // already unregistered lastRegisteredToken on the server by this
            // point, so the next login must be free to re-register the same
            // FCM token instead of skipping it as "unchanged".
            registeredTokenRef.current = null;
            lastRegisteredToken = null;
        };
    }, [session?.status]);
}
