// GymPulse Lightweight Service Worker for 24/7 PWA installation
const CACHE_NAME = 'gympulse-portal-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Let network handle downloads & external assets directly
  if (event.request.url.includes('/releases/') || event.request.url.includes('.zip')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
