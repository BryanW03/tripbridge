// sw.js – TripBridge Service Worker
// Cache-first for app shell, network-first for API data

const CACHE_NAME = 'tripbridge-v1';

// App shell – static assets to cache immediately
const SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/router.js',
  '/styles/main.css',
  '/api/countriesAPI.js',
  '/api/amadeusAPI.js',
  '/components/homeView.js',
  '/components/countryCard.js',
  '/components/flightsView.js',
  '/components/currencyConverter.js',
  '/components/itinerary.js',
  '/components/favoritesView.js',
  '/storage/favorites.js',
  '/utils/domHelpers.js',
  '/utils/animations.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap',
];

// Install: pre-cache shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(SHELL.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET
  if (e.request.method !== 'GET') return;

  // API calls: network-first, fall through on error
  if (
    url.hostname.includes('restcountries.com') ||
    url.hostname.includes('amadeus.com') ||
    url.hostname.includes('er-api.com')
  ) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Google Fonts: cache-first
  if (url.hostname.includes('fonts.g')) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // App shell: cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      });
    }).catch(() => {
      // Offline fallback
      if (e.request.destination === 'document') {
        return caches.match('/index.html');
      }
    })
  );
});
