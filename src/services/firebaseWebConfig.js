/**
 * Firebase Web SDK configuration.
 *
 * Used exclusively on the web platform to obtain an FCM push token and
 * listen for foreground messages.  On native (Android/iOS) push
 * notifications are handled entirely by expo-notifications + the native
 * google-services.json / GoogleService-Info.plist configuration.
 *
 * ──────────────────────────────────────────────────────────────────────
 * HOW TO FILL IN THE VALUES BELOW:
 * 1. Firebase Console → ⚙ Project Settings → General → «Your apps»
 *    → Web app → copy the firebaseConfig object.
 * 2. Firebase Console → ⚙ Project Settings → Cloud Messaging
 *    → «Web Push certificates» → Generate key pair → copy the key.
 * ──────────────────────────────────────────────────────────────────────
 */
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { Platform } from 'react-native';
import { logInfo, logError, logWarn } from '../../utils/log_util';

let messaging = null;

// ─── Firebase Web App config ─────────────────────────────────────────
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// VAPID key for Web Push
const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;

/**
 * Initialise Firebase Messaging for the web platform.
 * Safe to call multiple times — subsequent calls return the cached instance.
 *
 * @returns {import('firebase/messaging').Messaging | null}
 */
export function initWebMessaging() {
    if (Platform.OS !== 'web') return null;
    if (messaging) return messaging;

    try {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        logInfo('Firebase Web Messaging initialised');
        return messaging;
    } catch (e) {
        logError('Firebase Web Messaging init failed:', e);
        return null;
    }
}

/**
 * Obtain an FCM token for the web platform.
 * Requests browser notification permission if not yet granted.
 *
 * @returns {Promise<string|null>}
 */
export async function getWebFCMToken() {
    if (Platform.OS !== 'web') return null;

    if (!messaging) initWebMessaging();
    if (!messaging) return null;

    try {
        if (!('Notification' in window)) {
            logWarn('Browser does not support notifications');
            return null;
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            logWarn('Web notification permission not granted');
            return null;
        }

        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        logInfo('Web FCM token obtained:', token);
        return token;
    } catch (error) {
        logError('Error getting web FCM token:', error);
        return null;
    }
}

/**
 * Subscribe to foreground messages (tab is active/visible).
 *
 * @param {function} handler — (payload) => void
 * @returns {function} unsubscribe
 */
export function onWebMessage(handler) {
    if (!messaging) initWebMessaging();
    if (!messaging) return () => { };
    return onMessage(messaging, handler);
}
