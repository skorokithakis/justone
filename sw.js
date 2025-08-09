// Cleanup service worker - removes itself and clears caches
self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
      
      // Get all clients
      const clients = await self.clients.matchAll({ type: 'window' });
      
      // Claim control of all clients
      await self.clients.claim();
      
      // Unregister this service worker
      await self.registration.unregister();
      
      // Notify all clients to reload (optional, but ensures clean state)
      clients.forEach(client => {
        client.navigate(client.url);
      });
      
      console.log('Service worker cleaned up and unregistered');
    })()
  );
});

// Respond to fetch events by going directly to network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});