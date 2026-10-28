// Scripts for Firebase App and Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker with app credentials
firebase.initializeApp({
  apiKey: "AIzaSyDiVACIjjDciFNglDW803baDnY1zvxqwno",
  authDomain: "gen-lang-client-0677640824.firebaseapp.com",
  projectId: "gen-lang-client-0677640824",
  storageBucket: "gen-lang-client-0677640824.firebasestorage.app",
  messagingSenderId: "982364717887",
  appId: "1:982364717887:web:54fe277ccb21172465c98a"
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Cycle Companion';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'New cycle update available.',
    icon: '/pwa-192x192.png',
    badge: '/favicon.svg',
    tag: payload.data?.tag || 'cycle-notification',
    data: payload.data || { url: '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to bring app to focus or open it
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
