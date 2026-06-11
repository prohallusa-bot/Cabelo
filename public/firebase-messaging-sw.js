// Firebase Messaging Service Worker
// This file handles push notifications when the app is in the background

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// These values will be replaced during build or you can use environment variables
firebase.initializeApp({
  apiKey: "AIzaSyBo-C6OiXq02mmaSUHiyR1CmSYcYFsF7C0",
  authDomain: "cosmeticos-ai.firebaseapp.com",
  projectId: "cosmeticos-ai",
  storageBucket: "cosmeticos-ai.firebasestorage.app",
  messagingSenderId: "97815404592",
  appId: "1:97815404592:web:fd306f0482fa60c0338df5"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Cabelo.ai';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'cabelo-notification',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open App'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);

  event.notification.close();

  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
