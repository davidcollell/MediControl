
const CACHE_NAME = 'medicontrol-pro-v4';
const OFFLINE_URL = '/index.html';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hi ha xarxa, mirem de servir l'index per rutes de navegació
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const medData = event.notification.data;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
      
      if (event.action === 'mark-taken') {
        if (client) {
          client.focus();
          client.postMessage({
            type: 'MARK_TAKEN',
            medId: medData.medId,
            medName: medData.medName,
            scheduledTime: medData.scheduledTime
          });
        }
      } else if (event.action === 'snooze') {
        if (client) {
          client.postMessage({
            type: 'SNOOZE_MED',
            medId: medData.medId,
            scheduledTime: medData.scheduledTime
          });
        }
      } else {
        if (client) return client.focus();
        return clients.openWindow('/');
      }
    })
  );
});
