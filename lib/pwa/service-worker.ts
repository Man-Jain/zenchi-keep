/**
 * PWA Service Worker
 * Handles offline caching for bookmark pages and API responses
 * 
 * NOTE: This file serves as documentation/reference for the service worker logic.
 * next-pwa automatically generates the service worker based on runtimeCaching
 * configuration in next.config.ts. The actual service worker is generated at
 * build time and placed in the public/ directory.
 * 
 * This service worker caches:
 * - Bookmark pages (/)
 * - Flashcard pages (/flashcards)
 * - Settings pages (/settings)
 * - API routes (/api/bookmarks, /api/flashcards/random)
 */

// Service worker types
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'zenchi-keep-v1';
const API_CACHE_NAME = 'zenchi-keep-api-v1';

// Routes to cache for offline access
const CACHE_ROUTES = [
  '/',
  '/flashcards',
  '/settings',
];

// API routes to cache
const API_ROUTES = [
  '/api/bookmarks',
  '/api/flashcards/random',
];

/**
 * Install event - cache static assets and pages
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      // Cache the main pages
      return cache.addAll(CACHE_ROUTES.map(route => new Request(route, { cache: 'reload' })));
    })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

/**
 * Fetch event - serve from cache when offline, update cache when online
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle API routes with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
    return;
  }
  
  // Handle page routes with cache-first strategy
  if (CACHE_ROUTES.includes(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }
  
  // For other requests, use network-first
  event.respondWith(networkFirstStrategy(request, CACHE_NAME));
});

/**
 * Network-first strategy: Try network first, fallback to cache
 * Good for API routes that need fresh data but should work offline
 */
async function networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    // Clone the response because it can only be consumed once
    const responseClone = networkResponse.clone();
    
    // Update cache in background
    caches.open(cacheName).then((cache) => {
      cache.put(request, responseClone);
    });
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return a basic offline response for API routes
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ error: 'Offline: No cached data available' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    // For pages, return a basic offline page
    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

/**
 * Cache-first strategy: Try cache first, fallback to network
 * Good for static pages and assets
 */
async function cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Clone the response because it can only be consumed once
    const responseClone = networkResponse.clone();
    
    // Update cache
    caches.open(cacheName).then((cache) => {
      cache.put(request, responseClone);
    });
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Both cache and network failed:', request.url);
    
    // If it's a page request, return a basic offline page
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response(
        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your connection and try again.</p></body></html>',
        {
          status: 503,
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }
    
    throw error;
  }
}

// Export empty object for TypeScript module recognition
export {};
