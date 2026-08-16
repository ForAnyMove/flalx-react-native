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

// Background message handler — fires when the page is not focused or closed.
messaging.onBackgroundMessage((payload) => {
    const { title, body } = payload.notification || {};

    self.registration.showNotification(title || 'Flalx', {
        body: body || '',
        icon: '/assets/logo/flalx-logo-large.png',
        data: payload.data,
    });
});
