/**
 * Firebase Messaging Service Worker.
 *
 * Handles push notifications when the browser tab is NOT active (background
 * or closed).  This file MUST live at the web root (public/) so the browser
 * can scope it to '/'.
 *
 * The compat SDK is used here because Service Workers cannot use ES modules.
 */

/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Retrieve config passed dynamically via query parameters from pushNotificationsManager
const params = new URLSearchParams(self.location.search);

firebase.initializeApp({
    apiKey: params.get('apiKey'),
    authDomain: params.get('authDomain'),
    projectId: params.get('projectId'),
    storageBucket: params.get('storageBucket'),
    messagingSenderId: params.get('messagingSenderId'),
    appId: params.get('appId'),
});

const messaging = firebase.messaging();

// Activate a new SW version immediately instead of waiting for every open tab
// to close first (the browser-default lifecycle) — otherwise users who keep a
// tab open indefinitely would keep running a stale SW until they close it.
self.addEventListener('install', () => {
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// Background message handler — fires when the page is not focused or closed.
//
// The server intentionally omits `webpush.notification` from the FCM payload
// (see backend) so the browser never auto-displays anything — this handler is
// the ONLY place a notification gets shown on web. Auto-display + this manual
// call together would produce two notifications per message. title/body come
// from `data` (plain strings, already localized server-side for the
// recipient's language) rather than `payload.notification`, which native
// (android.notification / apns) still use for their own guaranteed OS-level
// display. The `payload.notification` fallback below is defensive only.
messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'Flalx';
    const body = payload.notification?.body || payload.data?.body || '';

    self.registration.showNotification(title, {
        body,
        icon: '/assets/logo/flalx-logo-large.png',
        data: payload.data,
    });
});

// Notification click handler — focuses an already-open tab on this site if
// one exists, otherwise opens a new one. `data.type` is available here for
// per-notification-type deep linking later (mirrors handleNotificationTap in
// managers/pushNotificationsManager.js on native), not wired yet.
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const targetUrl = self.location.origin + '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
