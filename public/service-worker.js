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

  // Skip requests for Vite assets and ES modules during development
  if (url.pathname.includes('/@vite/') || 
      url.pathname.includes('/@fs/') ||
      url.pathname.includes('/node_modules/') ||
      url.searchParams.has('import') ||
      request.destination === 'script' && url.pathname.includes('/assets/js/')) {
    // Let these pass through to network without interception
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Only intercept navigation requests and critical assets for offline support
  if (request.destination === 'document' || 
      url.pathname === '/' ||
      url.pathname === '/offline.html' ||
      url.pathname === '/manifest.json' ||
      request.destination === 'image') {
    
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
              if (!response || response.status !== 200) {
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
  }
  
  // For all other requests (JS modules, CSS, etc.), let them pass through
  // This prevents the service worker from interfering with Vite's module loading
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

// Enhanced push notifications for wellness reminders and crisis alerts
self.addEventListener('push', (event) => {
  let notificationData = {};
  let title = 'CoreV4 Mental Health';
  
  // Parse notification data
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = { body: event.data.text() };
    }
  }
  
  // Define different notification types with specific configurations
  const notificationTypes = {
    'medication': {
      title: '💊 Medication Reminder',
      icon: '/icons/medication-icon.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'taken', title: '✅ Taken' },
        { action: 'snooze', title: '⏰ Snooze 10min' },
        { action: 'skip', title: '❌ Skip' }
      ]
    },
    'mood-checkin': {
      title: '🌈 Daily Check-In',
      icon: '/icons/mood-icon.png',
      vibrate: [200, 100, 200],
      actions: [
        { action: 'log-mood', title: '📝 Log Mood' },
        { action: 'remind-later', title: '⏰ Later' }
      ]
    },
    'breathing': {
      title: '🧘 Mindfulness Break',
      icon: '/icons/breathing-icon.png',
      vibrate: [200],
      actions: [
        { action: 'start-breathing', title: '🌬️ Start' },
        { action: 'dismiss', title: '❌ Not now' }
      ]
    },
    'crisis-alert': {
      title: '🚨 Crisis Alert',
      icon: '/icons/crisis-icon.png',
      vibrate: [500, 200, 500, 200, 500],
      requireInteraction: true,
      actions: [
        { action: 'view-crisis', title: '🆘 View Resources' },
        { action: 'call-988', title: '📞 Call 988' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ],
      silent: false
    },
    'crisis-followup': {
      title: '💙 Wellness Check',
      icon: '/icons/heart-icon.png',
      vibrate: [100, 50, 100],
      requireInteraction: true,
      actions: [
        { action: 'feeling-better', title: '😊 Better' },
        { action: 'need-support', title: '🤝 Need Support' },
        { action: 'call-hotline', title: '📞 Call 988' }
      ]
    },
    'therapy-reminder': {
      title: '🗓️ Therapy Session',
      icon: '/icons/therapy-icon.png',
      vibrate: [500],
      requireInteraction: true,
      actions: [
        { action: 'confirm', title: '✅ Confirmed' },
        { action: 'reschedule', title: '📅 Reschedule' }
      ]
    }
  };
  
  // Get notification configuration based on type
  const type = notificationData.type || 'mood-checkin';
  const config = notificationTypes[type] || notificationTypes['mood-checkin'];
  
  const options = {
    body: notificationData.body || 'Time for your wellness check-in',
    icon: config.icon,
    badge: '/icons/badge-72x72.png',
    vibrate: config.vibrate,
    requireInteraction: config.requireInteraction || false,
    silent: config.silent || false,
    actions: config.actions,
    tag: notificationData.tag || type,
    data: {
      ...notificationData,
      dateOfArrival: Date.now(),
      type: type
    },
    timestamp: Date.now(),
    renotify: notificationData.urgency === 'high'
  };
  
  // Use specific title or default
  title = config.title;
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  const type = data?.type || 'default';
  
  // Handle different notification actions
  const handleAction = async () => {
    switch (action) {
      // Medication actions
      case 'taken':
        await logAction('medication_taken', data);
        return;
      case 'snooze':
        scheduleSnoozeNotification(type, 10); // 10 minutes
        return;
      case 'skip':
        await logAction('medication_skipped', data);
        return;
        
      // Mood check-in actions
      case 'log-mood':
        return clients.openWindow('/wellness/mood-tracker');
      case 'remind-later':
        scheduleSnoozeNotification('mood-checkin', 60); // 1 hour
        return;
        
      // Breathing exercise actions
      case 'start-breathing':
        return clients.openWindow('/wellness/breathing');
        
      // Crisis actions
      case 'view-crisis':
        return clients.openWindow('/crisis');
      case 'call-988':
      case 'call-hotline':
        return clients.openWindow('tel:988');
      case 'need-support':
        return clients.openWindow('/crisis');
      case 'feeling-better':
        await logAction('crisis_followup', { status: 'better' });
        return;
        
      // Therapy actions
      case 'confirm':
        await logAction('therapy_confirmed', data);
        return;
      case 'reschedule':
        return clients.openWindow('/schedule/therapy');
        
      // Default action
      case 'dismiss':
        return;
      default:
        // Open main app
        return clients.openWindow('/');
    }
  };
  
  event.waitUntil(handleAction());
});

// Helper function to schedule snooze notifications
function scheduleSnoozeNotification(type, delayMinutes) {
  setTimeout(() => {
    const messages = {
      'medication': 'Don\'t forget your medication',
      'mood-checkin': 'How are you feeling today?',
      'breathing': 'Time for a mindful breathing break',
      'default': 'Wellness reminder'
    };
    
    self.registration.showNotification('Reminder', {
      body: messages[type] || messages.default,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `${type}-snooze`,
      data: { type: type, snoozed: true }
    });
  }, delayMinutes * 60 * 1000);
}

// Generic action logging function
async function logAction(action, data) {
  try {
    const endpoint = getEndpointForAction(action);
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: action,
        data: data,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error(`Failed to log action ${action}:`, error);
  }
}

// Get appropriate endpoint for different actions
function getEndpointForAction(action) {
  const endpoints = {
    'medication_taken': '/api/wellness/medication/log',
    'medication_skipped': '/api/wellness/medication/log',
    'crisis_followup': '/api/crisis/followup',
    'therapy_confirmed': '/api/schedule/therapy/confirm'
  };
  
  return endpoints[action] || '/api/notifications/action';
}

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