const CACHE_NAME = "gondolapp-v1";
const STATIC_CACHE = "gondolapp-static-v1";
const DYNAMIC_CACHE = "gondolapp-dynamic-v1";
const IMAGE_CACHE = "gondolapp-images-v1";

// Assets estáticos a cachear en instalación
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...", event);
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[SW] Precaching App Shell");
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...", event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key)) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Estrategia de caché
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET
  if (request.method !== "GET") {
    return;
  }

  // Estrategia para imágenes (Cache First)
  if (
    request.destination === "image" ||
    url.hostname === "images.openfoodfacts.org"
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            return caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, fetchResponse.clone());
              return fetchResponse;
            });
          })
        );
      })
    );
    return;
  }

  // Estrategia para API de Open Food Facts (Network First con fallback)
  if (url.hostname === "world.openfoodfacts.org") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            return caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Estrategia por defecto para otros recursos (Network First)
  event.respondWith(
    fetch(request)
      .then((response) => {
        return caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, response.clone());
          return response;
        });
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Sincronización en background
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-data") {
    event.waitUntil(
      // Aquí podrías sincronizar datos con un servidor
      Promise.resolve()
    );
  }
});

// Notificaciones push
self.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || "GondolApp";
  const options = {
    body: data.body || "Nueva notificación",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    vibrate: [200, 100, 200],
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click en notificación
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event);

  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
