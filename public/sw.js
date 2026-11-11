// Service Worker PANJI PARISADA
const CACHE_NAME = 'panji-parisada-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Biarkan browser menangani request jaringan standar
});
