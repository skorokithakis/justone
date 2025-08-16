// Self-unregistering service worker
// This file exists only to unregister any previously installed service workers

self.addEventListener('install', () => {
  // Skip waiting to become active immediately.
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  // Unregister this service worker immediately after activation.
  self.registration.unregister().then(() => {
    console.log('Service worker unregistered successfully');
  }).catch((error) => {
    console.error('Failed to unregister service worker:', error);
  });

  // Clear all caches to ensure clean state.
  caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('Deleting cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  });
});