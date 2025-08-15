const CACHE_NAME = ‘habits-tracker-v1.0.0’;
const STATIC_CACHE = ‘habits-static-v1.0.0’;
const DYNAMIC_CACHE = ‘habits-dynamic-v1.0.0’;

// Assets to cache on install
const STATIC_ASSETS = [
‘/’,
‘/index.html’,
‘/manifest.json’,
‘/icons/icon-192x192.png’,
‘/icons/icon-512x512.png’
];

// Install event - cache static assets
self.addEventListener(‘install’, event => {
console.log(’[SW] Installing service worker’);
event.waitUntil(
caches.open(STATIC_CACHE)
.then(cache => {
console.log(’[SW] Caching static assets’);
return cache.addAll(STATIC_ASSETS);
})
.then(() => {
console.log(’[SW] Static assets cached successfully’);
return self.skipWaiting();
})
.catch(error => {
console.error(’[SW] Error caching static assets:’, error);
})
);
});

// Activate event - clean up old caches
self.addEventListener(‘activate’, event => {
console.log(’[SW] Activating service worker’);
event.waitUntil(
caches.keys()
.then(cacheNames => {
return Promise.all(
cacheNames.map(cache => {
if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
console.log(’[SW] Deleting old cache:’, cache);
return caches.delete(cache);
}
})
);
})
.then(() => {
console.log(’[SW] Service worker activated’);
return self.clients.claim();
})
);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener(‘fetch’, event => {
const { request } = event;

// Skip non-GET requests
if (request.method !== ‘GET’) {
return;
}

// Skip chrome-extension and other non-http requests
if (!request.url.startsWith(‘http’)) {
return;
}

event.respondWith(
caches.match(request)
.then(response => {
// Return cached version if available
if (response) {
console.log(’[SW] Serving from cache:’, request.url);
return response;
}

```
    // Clone the request for caching
    const requestClone = request.clone();

    return fetch(request)
      .then(response => {
        // Skip caching if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response for caching
        const responseClone = response.clone();

        // Cache dynamic content
        caches.open(DYNAMIC_CACHE)
          .then(cache => {
            cache.put(requestClone, responseClone);
            console.log('[SW] Cached dynamic resource:', request.url);
          });

        return response;
      })
      .catch(error => {
        console.error('[SW] Fetch failed:', error);
        
        // Return offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/');
        }
        
        // For other requests, you could return a default offline resource
        throw error;
      });
  })
```

);
});

// Background sync for habit updates (when online again)
self.addEventListener(‘sync’, event => {
console.log(’[SW] Background sync triggered:’, event.tag);

if (event.tag === ‘habits-sync’) {
event.waitUntil(
// Here you could implement sync logic with a backend
console.log(’[SW] Syncing habits data…’)
);
}
});

// Push notification handling
self.addEventListener(‘push’, event => {
console.log(’[SW] Push notification received’);

const options = {
body: event.data ? event.data.text() : ‘Don't forget to complete your daily habits!’,
icon: ‘/icons/icon-192x192.png’,
badge: ‘/icons/icon-72x72.png’,
vibrate: [100, 50, 100],
data: {
dateOfArrival: Date.now(),
primaryKey: 1
},
actions: [
{
action: ‘open’,
title: ‘Open App’,
icon: ‘/icons/icon-96x96.png’
},
{
action: ‘close’,
title: ‘Close’,
icon: ‘/icons/icon-96x96.png’
}
]
};

event.waitUntil(
self.registration.showNotification(‘Daily Habits Reminder’, options)
);
});

// Notification click handling
self.addEventListener(‘notificationclick’, event => {
console.log(’[SW] Notification clicked:’, event.action);

event.notification.close();

if (event.action === ‘open’ || !event.action) {
event.waitUntil(
clients.openWindow(’/’)
);
}
});

// Message handling from main thread
self.addEventListener(‘message’, event => {
console.log(’[SW] Message received:’, event.data);

if (event.data && event.data.type === ‘SKIP_WAITING’) {
self.skipWaiting();
}

if (event.data && event.data.type === ‘GET_VERSION’) {
event.ports[0].postMessage({
version: CACHE_NAME
});
}
});
