/**
 * Enhanced Service Worker for CoreV4 Mental Health Platform
 * Provides comprehensive offline support with crisis-first caching strategy
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `corev4-${CACHE_VERSION}`;
const STATIC_CACHE = `corev4-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `corev4-dynamic-${CACHE_VERSION}`;
const CRISIS_CACHE = `corev4-crisis-${CACHE_VERSION}`;
const MEDIA_CACHE = `corev4-media-${CACHE_VERSION}`;

// Critical crisis resources that must always be available offline
const CRISIS_RESOURCES = [
  '/crisis',
  '/crisis/safety-plan',
  '/crisis/emergency-contacts',
  '/wellness/breathing',
  '/api/crisis/hotlines.json',
  '/api/crisis/coping-strategies.json',
  '/offline-crisis.html'
];

// Essential app shell for offline functionality
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/fonts/inter-var.woff2'
];

// API routes that should be cached for offline access
const CACHEABLE_API_PATTERNS = [
  /\/api\/wellness\//,
  /\/api\/mood\//,
  /\/api\/journal\//,
  /\/api\/safety-plan/,
  /\/api\/crisis\//,
  /\/api\/dashboard/
];

// Network-first routes (always try fresh data)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/user\//,
  /\/api\/sync\//,
  /\/api\/notifications\//
];

// Install event - cache all critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing enhanced service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache app shell
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL);
      }),
      // Cache crisis resources with high priority
      caches.open(CRISIS_CACHE).then(cache => {
        console.log('[SW] Caching crisis resources');
        return cache.addAll(CRISIS_RESOURCES);
      }),
      // Pre-cache critical wellness data
      fetchAndCacheCriticalData()
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    }).catch(error => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating enhanced service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!cacheName.includes(CACHE_VERSION)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
      // Initialize IndexedDB for offline data
      initOfflineDatabase()
    ])
  );
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Crisis resources - cache first, always available
  if (CRISIS_RESOURCES.some(resource => url.pathname.includes(resource))) {
    event.respondWith(cacheFirst(request, CRISIS_CACHE));
    return;
  }

  // Network-first patterns
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // API requests - network with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkWithCacheFallback(request));
    return;
  }

  // Static assets - cache first
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Default - stale while revalidate
  event.respondWith(staleWhileRevalidate(request));
});

// Caching Strategies

async function cacheFirst(request, cacheName = STATIC_CACHE) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background for next time
    fetchAndCache(request, cacheName);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    // Return offline response for API requests
    if (request.url.includes('/api/')) {
      return createOfflineApiResponse(request);
    }
    throw error;
  }
}

async function networkWithCacheFallback(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful API responses
      if (CACHEABLE_API_PATTERNS.some(pattern => pattern.test(request.url))) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, response.clone());
      }
    }
    
    return response;
  } catch (error) {
    // Try cache
    const cached = await caches.match(request);
    if (cached) {
      // Add header to indicate cached response
      const headers = new Headers(cached.headers);
      headers.set('X-From-Cache', 'true');
      headers.set('X-Cache-Date', new Date().toISOString());
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    // Return offline API response
    return createOfflineApiResponse(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

// Helper Functions

function isStaticAsset(request) {
  const url = new URL(request.url);
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

async function fetchAndCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response);
    }
  } catch (error) {
    // Silent fail - this is background update
  }
}

async function fetchAndCacheCriticalData() {
  const criticalEndpoints = [
    '/api/crisis/hotlines.json',
    '/api/wellness/coping-strategies.json',
    '/api/crisis/safety-plan-template.json'
  ];
  
  const cache = await caches.open(CRISIS_CACHE);
  
  return Promise.all(
    criticalEndpoints.map(async endpoint => {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          await cache.put(endpoint, response);
        }
      } catch (error) {
        console.error(`[SW] Failed to cache ${endpoint}:`, error);
      }
    })
  );
}

function createOfflineApiResponse(request) {
  const url = new URL(request.url);
  
  // Provide meaningful offline responses for different endpoints
  const offlineData = {
    '/api/dashboard': {
      message: 'Dashboard data unavailable offline',
      offline: true,
      cachedData: true
    },
    '/api/wellness/mood': {
      message: 'Mood data will sync when online',
      offline: true,
      localOnly: true
    },
    '/api/crisis/hotlines': {
      hotlines: [
        { name: '988 Suicide & Crisis Lifeline', number: '988', available: true },
        { name: 'Crisis Text Line', number: '741741', text: 'HOME', available: true },
        { name: 'Emergency Services', number: '911', available: true }
      ],
      offline: true
    }
  };
  
  const data = offlineData[url.pathname] || {
    error: 'Offline',
    message: 'This feature requires an internet connection',
    offline: true
  };
  
  return new Response(JSON.stringify(data), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Offline-Response': 'true'
    }
  });
}

// IndexedDB for offline data storage

async function initOfflineDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CoreV4Offline', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store for offline mood entries
      if (!db.objectStoreNames.contains('moodEntries')) {
        const moodStore = db.createObjectStore('moodEntries', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        moodStore.createIndex('timestamp', 'timestamp', { unique: false });
        moodStore.createIndex('synced', 'synced', { unique: false });
      }
      
      // Store for journal entries
      if (!db.objectStoreNames.contains('journalEntries')) {
        const journalStore = db.createObjectStore('journalEntries', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        journalStore.createIndex('timestamp', 'timestamp', { unique: false });
        journalStore.createIndex('synced', 'synced', { unique: false });
      }
      
      // Store for crisis interactions
      if (!db.objectStoreNames.contains('crisisInteractions')) {
        const crisisStore = db.createObjectStore('crisisInteractions', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        crisisStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      // Store for safety plans
      if (!db.objectStoreNames.contains('safetyPlans')) {
        db.createObjectStore('safetyPlans', { keyPath: 'userId' });
      }
    };
  });
}

// Background Sync for offline data

self.addEventListener('sync', async (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  } else if (event.tag === 'sync-mood-entries') {
    event.waitUntil(syncMoodEntries());
  } else if (event.tag === 'sync-journal-entries') {
    event.waitUntil(syncJournalEntries());
  } else if (event.tag === 'sync-crisis-checkin') {
    event.waitUntil(syncCrisisCheckIn());
  }
});

async function syncOfflineData() {
  try {
    const db = await initOfflineDatabase();
    
    // Sync mood entries
    await syncDataFromStore(db, 'moodEntries', '/api/wellness/mood/sync');
    
    // Sync journal entries
    await syncDataFromStore(db, 'journalEntries', '/api/wellness/journal/sync');
    
    // Sync crisis interactions
    await syncDataFromStore(db, 'crisisInteractions', '/api/crisis/interactions/sync');
    
    // Notify clients of successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Offline data synchronized successfully'
      });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    // Retry sync after delay
    setTimeout(() => {
      self.registration.sync.register('sync-offline-data');
    }, 60000); // Retry after 1 minute
  }
}

async function syncDataFromStore(db, storeName, endpoint) {
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const index = store.index('synced');
  const unsyncedData = await index.getAll(false);
  
  if (unsyncedData.length === 0) return;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: unsyncedData })
    });
    
    if (response.ok) {
      // Mark entries as synced
      for (const entry of unsyncedData) {
        entry.synced = true;
        entry.syncedAt = new Date().toISOString();
        await store.put(entry);
      }
    }
  } catch (error) {
    console.error(`[SW] Failed to sync ${storeName}:`, error);
    throw error;
  }
}

// Push Notifications for wellness reminders

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'Time for your wellness check-in',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    tag: data.tag || 'wellness-reminder',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'check-in', title: 'Check In', icon: '/icons/check.png' },
      { action: 'snooze', title: 'Snooze 15m', icon: '/icons/clock.png' }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CoreV4 Reminder', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const notification = event.notification;
  
  if (action === 'check-in') {
    event.waitUntil(
      clients.openWindow('/wellness/check-in')
    );
  } else if (action === 'snooze') {
    // Schedule reminder for 15 minutes
    event.waitUntil(
      scheduleReminder(15)
    );
  } else {
    // Default action - open the URL from notification data
    event.waitUntil(
      clients.openWindow(notification.data.url)
    );
  }
});

async function scheduleReminder(minutes) {
  // Store reminder in IndexedDB for later
  const db = await initOfflineDatabase();
  // Implementation for scheduling future reminder
  
  // For now, just log
  console.log(`[SW] Reminder snoozed for ${minutes} minutes`);
}

// Periodic Background Sync for regular data updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-crisis-resources') {
    event.waitUntil(updateCrisisResources());
  } else if (event.tag === 'wellness-check') {
    event.waitUntil(performWellnessCheck());
  }
});

async function updateCrisisResources() {
  try {
    await fetchAndCacheCriticalData();
    console.log('[SW] Crisis resources updated');
  } catch (error) {
    console.error('[SW] Failed to update crisis resources:', error);
  }
}

async function performWellnessCheck() {
  // Check if user needs a wellness reminder
  const lastCheckIn = await getLastCheckIn();
  const hoursSinceCheckIn = (Date.now() - lastCheckIn) / (1000 * 60 * 60);
  
  if (hoursSinceCheckIn > 24) {
    self.registration.showNotification('Wellness Check-In', {
      body: 'How are you feeling today? Take a moment to check in.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: 'wellness-check',
      actions: [
        { action: 'check-in', title: 'Check In Now' },
        { action: 'later', title: 'Remind Me Later' }
      ]
    });
  }
}

async function getLastCheckIn() {
  // Get last check-in time from IndexedDB
  try {
    const db = await initOfflineDatabase();
    // Implementation to get last check-in
    return Date.now() - (25 * 60 * 60 * 1000); // Default to 25 hours ago
  } catch {
    return 0;
  }
}

console.log('[SW] Enhanced service worker loaded');