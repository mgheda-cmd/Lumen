// Lumen Charts - Service Worker pour Notifications Push PWA (iPhone & Android)
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = { body: event.data.text() };
    }
  }
  const title = data.title || '🔔 Signal Lumen Charts';
  const options = {
    body: data.body || 'Nouvelle opportunité Stratégie MM',
    icon: './favicon.ico',
    badge: './favicon.ico',
    tag: 'lumen-signal',
    requireInteraction: true,
    data: data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
