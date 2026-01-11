"use client";

import { useState, useCallback, useEffect } from "react";
import { NotificationSettings } from "@/lib/utils/storage";

type NotificationPermission = "default" | "granted" | "denied";

interface UseNotificationsReturn {
  permission: NotificationPermission;
  loading: boolean;
  error: string | null;
  requestNotificationPermission: () => Promise<boolean>;
  scheduleNotifications: (settings: NotificationSettings) => Promise<void>;
  cancelNotifications: () => void;
  checkPermissionStatus: () => NotificationPermission;
}

// Store scheduled notification timeouts
const scheduledTimeouts = new Map<string, NodeJS.Timeout>();

/**
 * Make API request
 * Note: API routes may require authentication in production
 * For now, using plain fetch - authentication should be handled server-side
 */
async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, options);
}

/**
 * Show a notification using the browser Notification API
 */
async function showNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<void> {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications");
  }

  if (Notification.permission !== "granted") {
    throw new Error("Notification permission not granted");
  }

  // Show notification
  const notification = new Notification(title, {
    icon: "/icon.svg",
    badge: "/icon.svg",
    tag: "zenchi-keep-notification",
    requireInteraction: false,
    ...options,
  });

  // Handle notification click - open flashcards page
  notification.onclick = () => {
    window.focus();
    window.location.href = "/flashcards";
    notification.close();
  };

  // Auto-close after 5 seconds
  setTimeout(() => {
    notification.close();
  }, 5000);
}

/**
 * Send message to service worker
 */
async function sendMessageToSW(message: any): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration.active) {
      registration.active.postMessage(message);
    }
  } catch (error) {
    console.error("Failed to send message to service worker:", error);
  }
}

/**
 * Register background sync for notifications
 */
async function registerBackgroundSync(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ("sync" in registration) {
      await (registration as any).sync.register("sync-notifications");
    }
  } catch (error) {
    console.error("Failed to register background sync:", error);
  }
}

/**
 * Schedule a notification for a specific time
 * Also registers with service worker for background notifications
 */
function scheduleNotificationForTime(
  time: string,
  bookmarkTitle: string,
  bookmarkUrl: string
): string | null {
  const [hours, minutes] = time.split(":").map(Number);
  const now = new Date();
  const scheduledTime = new Date(now);
  scheduledTime.setHours(hours, minutes, 0, 0);

  // If the time has passed today, schedule for tomorrow
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const delay = scheduledTime.getTime() - now.getTime();
  
  // Schedule client-side notification (works when app is open)
  const timeoutId = setTimeout(async () => {
    try {
      await showNotification(`Review: ${bookmarkTitle}`, {
        body: `Time to review your bookmark!`,
        data: { url: bookmarkUrl },
      });
      
      // Schedule next notification after showing current one
      // This will be handled by the service worker message handler
      await sendMessageToSW({ type: "SCHEDULE_NEXT_NOTIFICATION" });
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }, delay);

  // Also register with service worker for background notifications
  sendMessageToSW({
    type: "SCHEDULE_NOTIFICATION",
    time,
    delay,
  });

  const scheduleId = `${time}-${scheduledTime.getTime()}`;
  scheduledTimeouts.set(scheduleId, timeoutId);
  return scheduleId;
}

export function useNotifications(): UseNotificationsReturn {
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }
    return Notification.permission as NotificationPermission;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check permission status on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  const cancelNotifications = useCallback(() => {
    // Clear all scheduled timeouts
    scheduledTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    scheduledTimeouts.clear();
    
    // Cancel service worker notifications
    sendMessageToSW({ type: "CANCEL_NOTIFICATIONS" });
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setError("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      setPermission("granted");
      return true;
    }

    if (Notification.permission === "denied") {
      setPermission("denied");
      setError("Notification permission was previously denied");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      const granted = result === "granted";
      setPermission(result as NotificationPermission);

      if (!granted) {
        setError("Notification permission was denied");
      }

      return granted;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to request notification permission";
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleNotifications = useCallback(
    async (settings: NotificationSettings): Promise<void> => {
      if (typeof window === "undefined") {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Check permission first
        if (Notification.permission !== "granted") {
          const granted = await requestNotificationPermission();
          if (!granted) {
            throw new Error("Notification permission is required to schedule notifications");
          }
        }

        // Clear existing scheduled notifications
        cancelNotifications();

        if (!settings.enabled || !settings.schedule || settings.schedule.length === 0) {
          setLoading(false);
          return;
        }

        // Get bookmark preview for notifications
        const scheduleResponse = await apiFetch("/api/notifications/schedule");
        if (!scheduleResponse.ok) {
          throw new Error("Failed to fetch notification schedule");
        }

        const scheduleData = await scheduleResponse.json();
        const bookmarkPreview = scheduleData.bookmarkPreview;

        // Schedule notifications for each time in the schedule
        const bookmarkTitle = bookmarkPreview?.name || "Your bookmark";
        const bookmarkUrl = bookmarkPreview?.url || "";

        for (const time of settings.schedule) {
          scheduleNotificationForTime(time, bookmarkTitle, bookmarkUrl);
        }

        // Register background sync for notifications (works when app is closed)
        await registerBackgroundSync();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to schedule notifications";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [requestNotificationPermission, cancelNotifications]
  );

  const checkPermissionStatus = useCallback((): NotificationPermission => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "default";
    }

    const currentPermission = Notification.permission as NotificationPermission;
    setPermission(currentPermission);
    return currentPermission;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelNotifications();
    };
  }, [cancelNotifications]);

  return {
    permission,
    loading,
    error,
    requestNotificationPermission,
    scheduleNotifications,
    cancelNotifications,
    checkPermissionStatus,
  };
}
