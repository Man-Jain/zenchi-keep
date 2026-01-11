"use client";

import { useEffect, useState } from "react";

/**
 * Service Worker Registration Component
 * Handles service worker registration and update notifications
 * 
 * This component:
 * - Registers the service worker (if not already registered by next-pwa)
 * - Listens for service worker updates
 * - Shows update notification when new version is available
 * - Handles service worker update installation
 */
export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only run in browser
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Wait for service worker to be ready (registered by next-pwa)
    let updateInterval: NodeJS.Timeout | null = null;

    const setupServiceWorker = async () => {
      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;
        setSwRegistration(registration);

        // Check for updates periodically
        const checkForUpdates = () => {
          registration.update();
        };

        // Check for updates every hour
        updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);

        // Listen for service worker updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New service worker is installed and waiting
              setUpdateAvailable(true);
            }
          });
        });

        // Listen for controller change (service worker activated)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          // Reload page to use new service worker
          window.location.reload();
        });
      } catch (error) {
        console.error("[Service Worker] Setup failed:", error);
      }
    };

    setupServiceWorker();

    // Cleanup function
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, []);

  const handleUpdate = () => {
    if (!swRegistration || !swRegistration.waiting) {
      return;
    }

    // Tell the waiting service worker to skip waiting and activate
    swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    
    // Reload page to use new service worker
    window.location.reload();
  };

  // Don't render anything if no update available
  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50">
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-800">
            New version available
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Update to get the latest features
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUpdateAvailable(false)}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleUpdate}
            className="px-4 py-1.5 text-sm bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors font-medium"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
