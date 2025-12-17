const CACHE_NAME = 'medicontrol-v2';

// Instal·lació: Forçar l'activació immediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activació: Netejar caches antigues i reclamar clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Esborrant cache antiga:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptar peticiones
self.addEventListener('fetch', (event) => {
  // Ignorar peticions que no siguin GET (ex: API calls POST)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ESTRATÈGIA 1: Navegació (HTML) -> Network First, fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // ESTRATÈGIA 2: Assets estàtics (JS, CSS, Imatges) -> Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback
      });
    })
  );
});

// GESTIÓ DE NOTIFICACIONS
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'mark-taken') {
    // L'usuari ha clicat el botó "Prendre"
    const medData = event.notification.data;
    
    // Intentem comunicar-nos amb una finestra oberta per actualitzar la UI
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Busquem si l'app està oberta
        const client = clientList.find(c => c.visibilityState === 'visible') || clientList[0];
        
        if (client) {
          // Si està oberta, enviem missatge i foquem
          client.focus();
          client.postMessage({
            type: 'MARK_TAKEN',
            medId: medData.medId,
            medName: medData.medName
          });
        } else {
          // Si no està oberta, podríem obrir-la (opcional) o simplement confiar que el proper cop que s'obri es sincronitzi
          if (clients.openWindow) {
             clients.openWindow('/').then(windowClient => {
                // Esperem que carregui una mica
                setTimeout(() => {
                  windowClient.postMessage({
                    type: 'MARK_TAKEN',
                    medId: medData.medId,
                    medName: medData.medName
                  });
                }, 1000);
             });
          }
        }
      })
    );
  } else {
    // Clic normal a la notificació (obrir app)
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});