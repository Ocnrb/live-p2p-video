const CACHE_NAME = 'p2p-streaming-cache-v2';

// The install event is now simpler. We don't pre-cache a fixed list of URLs.
// This makes the installation much less likely to fail.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // The skipWaiting() method allows this service worker to activate
  // as soon as it has finished installing.
  self.skipWaiting();
});

// The activate event is used to clean up old caches.
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control of open pages
    );
});

// The fetch event is the core of this service worker.
// It uses a "Network falling back to Cache" strategy.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
      return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      // 1. Try to fetch the resource from the network.
      return fetch(event.request)
        .then(response => {
          // If the request is successful, we cache a clone of the response and return it.
          if (response.status === 200) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(err => {
          // 2. If the network request fails (e.g., offline), try to serve from the cache.
          return cache.match(event.request).then(response => {
            return response; // Will be undefined if not in cache.
          });
        });
    })
  );
});

