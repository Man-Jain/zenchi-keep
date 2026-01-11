/**
 * Custom Service Worker for Background Notifications
 * 
 * This service worker extends the Workbox-generated service worker from next-pwa
 * to handle background notifications, notification clicks, and scheduling.
 * 
 * Features:
 * - Background notification scheduling
 * - Notification click handling to open /flashcards
 * - Fetch random bookmark when notification triggers
 * - Schedule next notification after current one
 */

declare const self: ServiceWorkerGlobalScope;
declare const workbox: any;
declare const clients: Clients;

// Import Workbox (will be available at runtime)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

// Storage keys
const NOTIFICATION_SETTINGS_KEY = 'zenchi-keep-notification-settings';
const SCHEDULED_NOTIFICATIONS_KEY = 'zenchi-keep-scheduled-notifications';

interface NotificationSettings {
  enabled: boolean;
  schedule: string[];
  lastNotificationDate: string;
}

interface ScheduledNotification {
  id: string;
  time: string;
  scheduledTime: number;
}

/**
 * Get notification settings from IndexedDB or localStorage
 */
async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    // Try to get from IndexedDB first
    const db = await openDB();
    const settings = await getFromDB(db, 'settings', NOTIFICATION_SETTINGS_KEY);
    if (settings) {
      return settings;
    }
  } catch (error) {
    console.log('[SW] IndexedDB not available, trying other methods');
  }

  // Fallback: try to get from cache or return null
  return null;
}

/**
 * Get value from IndexedDB
 */
async function getFromDB<T>(db: IDBDatabase, storeName: string, key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Put value to IndexedDB
 */
async function putToDB<T>(db: IDBDatabase, storeName: string, value: T, key?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = key ? store.put(value, key) : store.put(value);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Open IndexedDB database
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('zenchi-keep-sw', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('notifications')) {
        db.createObjectStore('notifications', { keyPath: 'id' });
      }
    };
  });
}

/**
 * Fetch random bookmark from API
 */
async function fetchRandomBookmark(): Promise<{ name: string; url: string } | null> {
  try {
    const response = await fetch('/api/notifications/schedule', {
      headers: {
        'X-API-Key': process.env.API_KEY || '',
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
async function showNotification(bookmark: { name: string; url: string }): Promise<void> {
  const title = `Review: ${bookmark.name}`;
  const options: NotificationOptions = {
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
 * Calculate next notification time based on schedule
 */
function calculateNextNotificationTime(schedule: string[]): number | null {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Parse schedule times and convert to minutes since midnight
  const scheduleMinutes = schedule
    .map((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    })
    .sort((a, b) => a - b);

  // Find next time today
  for (const scheduledMinutes of scheduleMinutes) {
    if (scheduledMinutes > currentTime) {
      const nextNotification = new Date(now);
      nextNotification.setHours(
        Math.floor(scheduledMinutes / 60),
        scheduledMinutes % 60,
        0,
        0
      );
      return nextNotification.getTime();
    }
  }

  // If no time found today, use first time tomorrow
  const firstTimeTomorrow = scheduleMinutes[0];
  const [hours, minutes] = [
    Math.floor(firstTimeTomorrow / 60),
    firstTimeTomorrow % 60,
  ];
  const nextNotification = new Date(now);
  nextNotification.setDate(nextNotification.getDate() + 1);
  nextNotification.setHours(hours, minutes, 0, 0);
  return nextNotification.getTime();
}

/**
 * Schedule next notification
 */
async function scheduleNextNotification(): Promise<void> {
  const settings = await getNotificationSettings();
  
  if (!settings || !settings.enabled || !settings.schedule || settings.schedule.length === 0) {
    return;
  }

  const nextTime = calculateNextNotificationTime(settings.schedule);
  if (!nextTime) {
    return;
  }

  const delay = nextTime - Date.now();
  if (delay < 0) {
    // Time has passed, schedule for next occurrence
    return;
  }

  // Store scheduled notification
  const scheduledNotification: ScheduledNotification = {
    id: `notification-${nextTime}`,
    time: new Date(nextTime).toISOString(),
    scheduledTime: nextTime,
  };

  try {
    const db = await openDB();
    await putToDB(db, 'notifications', scheduledNotification);
  } catch (error) {
    console.error('[SW] Failed to store scheduled notification:', error);
  }

  // Schedule using setTimeout (will be handled by periodic background sync in production)
  setTimeout(async () => {
    const bookmark = await fetchRandomBookmark();
    if (bookmark) {
      await showNotification(bookmark);
      // Schedule next notification after showing current one
      await scheduleNextNotification();
    }
  }, delay);
}

/**
 * Handle notification click - open /flashcards
 */
self.addEventListener('notificationclick', (event: NotificationEvent) => {
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
          if (client.url === urlToOpen && 'focus' in client) {
            return (client as WindowClient).focus();
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
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      (async () => {
        const settings = await getNotificationSettings();
        if (settings && settings.enabled) {
          await scheduleNextNotification();
        }
      })()
    );
  }
});

/**
 * Handle periodic background sync (if supported)
 */
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      (async () => {
        const settings = await getNotificationSettings();
        if (settings && settings.enabled) {
          const bookmark = await fetchRandomBookmark();
          if (bookmark) {
            await showNotification(bookmark);
            await scheduleNextNotification();
          }
        }
      })()
    );
  }
});

/**
 * Handle push notifications (for future use)
 */
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) {
    return;
  }

  event.waitUntil(
    (async () => {
      const bookmark = await fetchRandomBookmark();
      if (bookmark) {
        await showNotification(bookmark);
        await scheduleNextNotification();
      }
    })()
  );
});

/**
 * Handle messages from client
 */
self.addEventListener('message', (event: MessageEvent) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'SYNC_NOTIFICATIONS') {
    event.waitUntil(scheduleNextNotification());
  }

  if (event.data && event.data.type === 'UPDATE_NOTIFICATION_SETTINGS') {
    event.waitUntil(
      (async () => {
        const settings = event.data.settings;
        try {
          const db = await openDB();
          await putToDB(db, 'settings', settings, NOTIFICATION_SETTINGS_KEY);
          // Reschedule notifications with new settings
          await scheduleNextNotification();
        } catch (error) {
          console.error('[SW] Failed to update notification settings:', error);
        }
      })()
    );
  }
});

// Precache and route static assets (Workbox)
if (workbox && workbox.precaching) {
  precacheAndRoute(self.__WB_MANIFEST || []);
}

// Register routes for API caching
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'zenchi-keep-api-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response && response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Register routes for page caching
registerRoute(
  ({ url }) => url.pathname === '/flashcards' || url.pathname === '/settings',
  new CacheFirst({
    cacheName: 'zenchi-keep-pages-cache',
  })
);

// Initialize notification scheduling on service worker activation
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      // Start scheduling notifications
      await scheduleNextNotification();
    })()
  );
});

export {};
