const CACHE_NAME = 'medicontrol-v3';

self.addEventListener('install', (event) => {
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
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {});
    })
  );
});

// GESTIÓ DE NOTIFICACIONS MILLORADA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const medData = event.notification.data;

  if (event.action === 'mark-taken') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
        if (client) {
          client.focus();
          client.postMessage({
            type: 'MARK_TAKEN',
            medId: medData.medId,
            medName: medData.medName,
            scheduledTime: medData.scheduledTime
          });
        } else {
          clients.openWindow('/').then(windowClient => {
            setTimeout(() => {
              windowClient.postMessage({
                type: 'MARK_TAKEN',
                medId: medData.medId,
                medName: medData.medName,
                scheduledTime: medData.scheduledTime
              });
            }, 2000);
          });
        }
      })
    );
  } else if (event.action === 'snooze') {
    // L'acció de postposar delega a l'app la reprogramació
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
        if (client) {
          client.postMessage({
            type: 'SNOOZE_MED',
            medId: medData.medId,
            scheduledTime: medData.scheduledTime
          });
        } else {
          clients.openWindow('/').then(windowClient => {
            setTimeout(() => {
              windowClient.postMessage({
                type: 'SNOOZE_MED',
                medId: medData.medId,
                scheduledTime: medData.scheduledTime
              });
            }, 2000);
          });
        }
      })
    );
  } else {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
    );
  }
});
