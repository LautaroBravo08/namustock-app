// Service Worker para actualizaciones automáticas
const CACHE_NAME = 'tienda-moderna-v1.0.22';
const VERSION_URL = '/version.json';

const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  VERSION_URL
];

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('SW: Instalando nueva versión');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Cache abierto:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
  );
});

// Activar service worker
self.addEventListener('activate', (event) => {
  console.log('SW: Activando nueva versión');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Tomar control de todas las pestañas inmediatamente
      return self.clients.claim();
    }).then(() => {
      // Notificar a todos los clientes que hay una nueva versión
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'NEW_VERSION_ACTIVATED',
            version: CACHE_NAME
          });
        });
      });
    })
  );
});

// Interceptar requests con estrategia Network First para archivos críticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Para version.json, siempre intentar red primero
  if (url.pathname === VERSION_URL) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Actualizar cache con nueva versión
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Si falla la red, usar cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para otros recursos, usar cache first
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // No cachear si no es una respuesta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clonar respuesta para cache
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
  );
});

// Manejar mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CHECK_VERSION') {
    // Verificar versión actual
    fetch(VERSION_URL)
      .then(response => response.json())
      .then(versionData => {
        event.ports[0].postMessage({
          type: 'VERSION_INFO',
          version: versionData.version,
          buildDate: versionData.buildDate
        });
      })
      .catch(error => {
        event.ports[0].postMessage({
          type: 'VERSION_ERROR',
          error: error.message
        });
      });
  }
});

// Verificación periódica de actualizaciones
setInterval(() => {
  fetch(VERSION_URL)
    .then(response => response.json())
    .then(versionData => {
      // Comparar con versión en cache
      caches.open(CACHE_NAME).then(cache => {
        cache.match(VERSION_URL).then(cachedResponse => {
          if (cachedResponse) {
            cachedResponse.json().then(cachedVersion => {
              if (versionData.version !== cachedVersion.version) {
                // Nueva versión detectada
                self.clients.matchAll().then((clients) => {
                  clients.forEach((client) => {
                    client.postMessage({
                      type: 'NEW_VERSION_AVAILABLE',
                      newVersion: versionData.version,
                      currentVersion: cachedVersion.version
                    });
                  });
                });
              }
            });
          }
        });
      });
    })
    .catch(error => {
      console.log('SW: Error verificando versión:', error);
    });
}, 300000); // Verificar cada 5 minutos