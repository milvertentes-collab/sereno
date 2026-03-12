const CACHE_NAME = 'sereno-cache-v1';
const OFFLINE_URL = '/offline.html';

const ASSETS_TO_CACHE = [
    '/',
    OFFLINE_URL,
    '/manifest.json',
    '/logo.png',
    // Áudios e fontes serão cacheados dinamicamente conforme o uso
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Strategy Stale-While-Revalidate (Serve from cache, update from network)
self.addEventListener('push', (event) => {
    let data = { title: 'Sereno', body: 'Você tem uma nova notificação.', url: '/' };
    try {
        if (event.data) data = JSON.parse(event.data.text());
    } catch {}

    event.waitUntil(
        self.registration.showNotification(data.title || 'Sereno', {
            body: data.body || '',
            icon: '/logo.png',
            badge: '/logo.png',
            data: { url: data.url || '/' }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || '/';
    event.waitUntil(clients.openWindow(targetUrl));
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Don't cache Chat/API calls
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached, and kick off background update
                fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, networkResponse);
                        });
                    }
                });
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                // Cache dynamic assets (like audio files) after they are fetched
                if (networkResponse && networkResponse.status === 200) {
                    const clonableResponse = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonableResponse);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Fallback for page navigation
                if (event.request.mode === 'navigate') {
                    return caches.match(OFFLINE_URL);
                }
            });
        })
    );
});
