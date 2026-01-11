/**
 * Custom Service Worker for Background Notifications
 * 
 * This service worker extends Workbox functionality to handle:
 * - Notification clicks to open /flashcards
 * - Background notification scheduling (via messages from client)
 * - Fetching random bookmarks when notifications trigger
 */

// Import Workbox (will be injected by next-pwa)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Storage for scheduled notifications
const scheduledNotifications = new Map();

/**
 * Fetch random bookmark from API
 * Note: In production, this should use proper authentication
 */
async function fetchRandomBookmark() {
  try {
    const response = await fetch('/api/notifications/schedule', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const bookmark = data.bookmarkPreview;
    
    if (bookmark) {
      return {
        name: bookmark.name || 'Your bookmark',
        url: bookmark.url || '/flashcards',
      };
    }
    
    return null;
  } catch (error) {
    console.error('[SW] Failed to fetch random bookmark:', error);
    return null;
  }
}

/**
 * Show a notification with bookmark preview
 */
async function showNotification(bookmark) {
  const title = `Review: ${bookmark.name}`;
  const options = {
    body: 'Time to review your bookmark!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'zenchi-keep-notification',
    requireInteraction: false,
    data: {
      url: bookmark.url,
      timestamp: Date.now(),
    },
  };

  await self.registration.showNotification(title, options);
}

/**
 * Handle notification click - open /flashcards
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/flashcards';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Handle background sync for notifications
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      (async () => {
        const bookmark = await fetchRandomBookmark();
        if (bookmark) {
          await showNotification(bookmark);
        }
      })()
    );
  }
});

/**
 * Handle periodic background sync (if supported)
 */
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      (async () => {
        const bookmark = await fetchRandomBookmark();
        if (bookmark) {
          await showNotification(bookmark);
        }
      })()
    );
  }
});

/**
 * Handle push notifications (for future use)
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  event.waitUntil(
    (async () => {
      const bookmark = await fetchRandomBookmark();
      if (bookmark) {
        await showNotification(bookmark);
      }
    })()
  );
});

/**
 * Handle messages from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      (async () => {
        const bookmark = await fetchRandomBookmark();
        if (bookmark) {
          await showNotification(bookmark);
        }
      })()
    );
  }

  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time, delay } = event.data;
    const timeoutId = setTimeout(async () => {
      const bookmark = await fetchRandomBookmark();
      if (bookmark) {
        await showNotification(bookmark);
        // Schedule next notification after showing current one
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SCHEDULE_NEXT_NOTIFICATION' });
          });
        });
      }
      scheduledNotifications.delete(time);
    }, delay);

    scheduledNotifications.set(time, timeoutId);
  }

  if (event.data && event.data.type === 'CANCEL_NOTIFICATIONS') {
    scheduledNotifications.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    scheduledNotifications.clear();
  }
});

// Initialize Workbox
if (workbox) {
  // Workbox will handle precaching and routing based on next.config.ts configuration
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
}
