// Service Worker for Hábitos en Pareja PWA
// Handles: offline caching + FCM background notifications

const CACHE_NAME = 'habitos-v1';
const STATIC_ASSETS = ['/', '/home', '/together', '/settings'];

// Install - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push notifications from FCM
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { notification: { title: 'Hábitos', body: event.data.text() } };
  }

  const notification = data.notification || data;
  const title = notification.title || '¡Hábitos en Pareja!';
  const options = {
    body: notification.body || 'Revisa tus hábitos de hoy',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'habitos-reminder',
    renotify: true,
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click - open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/home');
      })
  );
});
