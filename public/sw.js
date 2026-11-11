// Service Worker PANJI PARISADA
const CACHE_NAME = 'panji-parisada-v0.1.0';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', () => {
  // Biarkan browser menangani request jaringan standar
});

