// Cache-busting service worker that clears all caches and then unregisters itself.
self.addEventListener('install', function(event) {
  // Skip waiting to become active immediately.
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    (async () => {
      // Delete all caches.
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );

      // Take control of all clients immediately.
      await self.clients.claim();

      // Unregister this service worker after cleanup.
      await self.registration.unregister();
      console.log('Service worker unregistered after cache cleanup');
    })()
  );
});

// Intercept fetch requests and always fetch from network (no caching).
self.addEventListener('fetch', function(event) {
  event.respondWith(fetch(event.request));
});