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

firebase.initializeApp({
    apiKey: 'AIzaSyD5ZWdZBfZ2w7oW9xqh1zYDO2x_2RZIGUw',
    authDomain: 'flalx-ec11a.firebaseapp.com',
    projectId: 'flalx-ec11a',
    storageBucket: 'flalx-ec11a.firebasestorage.app',
    messagingSenderId: '433988900835',
    appId: '1:433988900835:web:47b2b57fd71ef1d9a9f2d6',
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
