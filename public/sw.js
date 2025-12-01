const CACHE_VERSION = "v2";
const CACHE_NAME = `gondolapp-${CACHE_VERSION}`;
const STATIC_CACHE = `gondolapp-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `gondolapp-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `gondolapp-images-${CACHE_VERSION}`;
const API_CACHE = `gondolapp-api-${CACHE_VERSION}`;

// Assets estáticos a cachear en instalación
const STATIC_ASSETS = [
  "/",
  "/offline.html",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/favicon.svg",
  "/icon-scan.svg",
  "/icon-list.svg",
  "/icon-calendar.svg",
];

// Instalación del Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...", CACHE_VERSION);
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Precaching App Shell");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting on first install when there's no active service worker
        // For updates, wait for the SKIP_WAITING message
        if (!self.registration.active) {
          return self.skipWaiting();
        }
      })
  );
});

// Activación del Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...", CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // Delete old caches that don't match current version
          if (
            key.startsWith("gondolapp-") &&
            ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(key)
          ) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Message handler for skip waiting
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[SW] Skip waiting requested, activating new service worker...");
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

// Estrategia de caché
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests que no sean GET
  if (request.method !== "GET") {
    return;
  }

  // Ignorar chrome-extension y otros protocolos
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Ignorar hot-reload en desarrollo
  if (url.pathname.includes("_next/webpack-hmr")) {
    return;
  }

  // Open Food Facts API - Network First con cache fallback
  if (url.hostname === "world.openfoodfacts.org") {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 10000));
    return;
  }

  // Open Food Facts Images - Cache First
  if (url.hostname === "images.openfoodfacts.org") {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // API routes - Network First
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstWithCache(request, API_CACHE, 5000));
    return;
  }

  // Estrategia para imágenes locales (Cache First)
  if (request.destination === "image" || isImagePath(url.pathname)) {
    event.respondWith(cacheFirstWithNetwork(request, IMAGE_CACHE));
    return;
  }

  // Static assets (JS, CSS) - Stale While Revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Navigation requests - Network First with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Default - Network First con fallback a cache
  event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE, 5000));
});

// Network First con timeout y cache fallback
async function networkFirstWithCache(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) {
      console.log("[SW] Serving from cache (network failed):", request.url);
      return cached;
    }
    
    // Return offline JSON for API requests
    if (request.url.includes("/api/")) {
      return new Response(
        JSON.stringify({ error: "Offline", offline: true }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    throw error;
  }
}

// Cache First con network fallback
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log("[SW] Network failed for image:", request.url);
    // Return transparent placeholder for failed images
    return new Response("", { status: 404 });
  }
}

// Stale While Revalidate
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// Navigation handler con offline fallback
// Fallback chain: cached page → cached offline.html → hardcoded HTML
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try to return cached page
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline page
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) {
      return offlinePage;
    }
    
    // Fallback response
    return new Response(
      "<html><body><h1>Sin conexión</h1><p>Por favor, verifica tu conexión a internet.</p></body></html>",
      {
        status: 503,
        headers: { "Content-Type": "text/html" },
      }
    );
  }
}

function isStaticAsset(pathname) {
  return (
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".woff2") ||
    pathname.endsWith(".woff") ||
    pathname.includes("/_next/static/")
  );
}

function isImagePath(pathname) {
  return (
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".avif") ||
    pathname.endsWith(".ico")
  );
}

// Sincronización en background
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-data") {
    event.waitUntil(syncData());
  }
  
  if (event.tag === "sync-products") {
    event.waitUntil(syncProducts());
  }
});

async function syncData() {
  // Placeholder for data sync logic
  console.log("[SW] Syncing data...");
  return Promise.resolve();
}

async function syncProducts() {
  // Placeholder for product sync logic
  console.log("[SW] Syncing products...");
  return Promise.resolve();
}

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
    tag: data.tag || "gondolapp-notification",
    renotify: true,
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Click en notificación
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      return clients.openWindow(urlToOpen);
    })
  );
});
