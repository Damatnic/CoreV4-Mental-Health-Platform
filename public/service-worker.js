/**
 * Service Worker for Astral Core Mental Health App
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'astral-core-v4-cache-v1';
const DYNAMIC_CACHE = 'astral-core-dynamic-v1';
const OFFLINE_URL = '/offline.html';

// Critical assets to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Critical CSS and JS will be added dynamically
];

// API endpoints to cache responses for offline access
const API_CACHE_ROUTES = [
  '/api/dashboard',
  '/api/crisis/hotlines',
  '/api/wellness/activities',
  '/api/safety-plan',
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip unsupported URL schemes (chrome-extension, etc.)
  const supportedSchemes = ['http:', 'https:'];
  if (!supportedSchemes.includes(url.protocol)) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          // Return cached version
          return response;
        }

        // Fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Additional safety check - only cache http/https requests
            const requestUrl = new URL(request.url);
            if (!['http:', 'https:'].includes(requestUrl.protocol)) {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to dynamic cache
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache).catch((error) => {
                  console.warn('[Service Worker] Failed to cache request:', request.url, error);
                });
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return placeholder for images
            if (request.destination === 'image') {
              return new Response(
                '<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
          });
      })
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    // Cache successful responses (only for supported schemes)
    if (response.ok) {
      const requestUrl = new URL(request.url);
      if (['http:', 'https:'].includes(requestUrl.protocol)) {
        const responseToCache = response.clone();
        cache.put(request, responseToCache).catch((error) => {
          console.warn('[Service Worker] Failed to cache API request:', request.url, error);
        });
      }
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Add header to indicate cached response
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Time', new Date().toISOString());
      
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers
      });
    }
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: 'Network error',
        offline: true,
        message: 'This feature requires an internet connection'
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncOfflineData());
  }
  
  if (event.tag === 'sync-mood-entries') {
    event.waitUntil(syncMoodEntries());
  }
  
  if (event.tag === 'sync-crisis-checkin') {
    event.waitUntil(syncCrisisCheckIn());
  }
});

// Sync offline data
async function syncOfflineData() {
  try {
    // Get pending data from IndexedDB
    const pendingData = await getPendingData();
    
    if (pendingData.length > 0) {
      // Send to server
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: pendingData })
      });
      
      if (response.ok) {
        // Clear synced data
        await clearPendingData();
        
        // Notify clients
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_COMPLETE',
              data: 'Data synced successfully'
            });
          });
        });
      }
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// Sync mood entries
async function syncMoodEntries() {
  // Implementation for syncing mood tracking data
  console.log('[Service Worker] Syncing mood entries...');
}

// Sync crisis check-in
async function syncCrisisCheckIn() {
  // Implementation for syncing crisis check-in data
  console.log('[Service Worker] Syncing crisis check-in...');
}

// Push notifications for medication reminders and check-ins
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Time for your wellness check-in',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'check-in',
        title: 'Check In',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'snooze',
        title: 'Snooze',
        icon: '/icons/clock.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Astral Core', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'check-in') {
    event.waitUntil(
      clients.openWindow('/wellness/check-in')
    );
  } else if (event.action === 'snooze') {
    // Schedule another notification in 15 minutes
    setTimeout(() => {
      self.registration.showNotification('Reminder', {
        body: 'Time for your wellness check-in',
        icon: '/icons/icon-192x192.png'
      });
    }, 15 * 60 * 1000);
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingData() {
  // Implementation to get pending data from IndexedDB
  return [];
}

async function clearPendingData() {
  // Implementation to clear pending data from IndexedDB
}

// Pre-cache dynamic content when online
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload;
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(urlsToCache))
        .then(() => {
          // Send response back if ports are available
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        })
        .catch((error) => {
          console.error('[Service Worker] Cache URLs failed:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
        })
    );
  }
  
  if (event.data.type === 'SKIP_WAITING') {
    event.waitUntil(self.skipWaiting());
    // Send acknowledgment if ports are available
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ success: true });
    }
  }
});

console.log('[Service Worker] Loaded');