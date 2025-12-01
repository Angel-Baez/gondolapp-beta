const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Custom service worker path (we maintain our own sw.js)
  sw: "sw.js",
  // Don't generate workbox files - we use custom sw.js
  buildExcludes: [/middleware-manifest\.json$/],
  // Runtime caching strategies
  runtimeCaching: [
    // Open Food Facts API - Network First with cache fallback
    {
      urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "openfoodfacts-api",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Product images from Open Food Facts - Cache First
    {
      urlPattern: /^https:\/\/images\.openfoodfacts\.org\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "openfoodfacts-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Google Fonts - Cache First (long TTL)
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 año
        },
      },
    },
    // Static images - Cache First
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
        },
      },
    },
    // JS and CSS - Stale While Revalidate
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
        },
      },
    },
    // Internal API routes - Network First
    {
      urlPattern: /^\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 1 día
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use empty turbopack config to silence the error, but the build will use webpack due to next-pwa
  turbopack: {},
  images: {
    remotePatterns: [],
    // 🚀 Optimizaciones para LCP y performance
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 días
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

module.exports = withPWA(nextConfig);
