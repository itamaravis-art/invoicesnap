const CACHE_VERSION = 'invoicesnap-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Static assets to precache
const PRECACHE_URLS = [
  '/',
  '/login',
  '/signup',
  '/dashboard',
  '/receipts',
  '/receipts/new',
  '/reports',
  '/settings',
  '/manifest.json',
];

// Install: precache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('invoicesnap-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== IMAGE_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Strategy 1: API GET requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/') && request.method === 'GET') {
    event.respondWith(networkFirstThenCache(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy 2: Supabase Storage images - Cache first
  if (url.hostname.includes('supabase.co') && url.pathname.includes('/storage/')) {
    event.respondWith(cacheFirstThenNetwork(request, IMAGE_CACHE));
    return;
  }

  // Strategy 3: Google Fonts and Material Icons - Cache first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirstThenNetwork(request, STATIC_CACHE));
    return;
  }

  // Strategy 4: App shell pages - Cache first with network update
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(cacheFirstWithNetworkUpdate(request, STATIC_CACHE));
    return;
  }

  // Strategy 5: Static assets (JS, CSS) - Cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstThenNetwork(request, STATIC_CACHE));
    return;
  }

  // Default: Network first
  event.respondWith(networkFirstThenCache(request, DYNAMIC_CACHE));
});

// Background Sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-receipts') {
    event.waitUntil(syncOfflineReceipts());
  }
});

// Push notifications (future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'InvoiceSnap', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        dir: 'rtl',
        lang: 'he',
      })
    );
  }
});

// --- Cache Strategies ---

async function networkFirstThenCache(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // For navigation requests, return the offline page
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function cacheFirstThenNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function cacheFirstWithNetworkUpdate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => null);

  return cached || (await fetchPromise) || new Response('Offline', { status: 503 });
}

// --- Background Sync ---

async function syncOfflineReceipts() {
  // Open IndexedDB and process sync queue
  // This will be populated by the client-side offline module
  try {
    const db = await openDB();
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const items = await getAllFromStore(store);

    for (const item of items) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        if (response.ok) {
          // Remove from queue on success
          const deleteTx = db.transaction('syncQueue', 'readwrite');
          deleteTx.objectStore('syncQueue').delete(item.id);
        }
      } catch {
        // Will retry on next sync
        break;
      }
    }
  } catch {
    // IndexedDB not available or empty queue
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('invoicesnap-offline', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('receipts')) {
        db.createObjectStore('receipts', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
