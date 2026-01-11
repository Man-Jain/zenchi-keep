"use client";

import { useState, useEffect, useCallback } from "react";
import {
  NotificationSettings,
  getNotificationSettings,
  setNotificationSettings,
} from "@/lib/utils/storage";
import { useNotifications } from "@/lib/hooks/useNotifications";

export default function NotificationSettingsComponent() {
  const {
    permission,
    loading: notificationLoading,
    error: notificationError,
    requestNotificationPermission,
    scheduleNotifications,
    cancelNotifications,
  } = useNotifications();

  const [settings, setSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings()
  );
  const [newTime, setNewTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const currentSettings = getNotificationSettings();
    setSettings(currentSettings);
  }, []);

  // Validate time format (HH:MM)
  const isValidTime = (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  // Add time to schedule
  const handleAddTime = useCallback(() => {
    if (!newTime.trim() || !isValidTime(newTime)) {
      return;
    }

    // Check if time already exists
    if (settings.schedule.includes(newTime)) {
      setSaveError("This time is already in your schedule");
      return;
    }

    const updatedSchedule = [...settings.schedule, newTime].sort();
    const updatedSettings: NotificationSettings = {
      ...settings,
      schedule: updatedSchedule,
    };
    setSettings(updatedSettings);
    setNewTime("");
    setSaveError(null);
  }, [newTime, settings]);

  // Remove time from schedule
  const handleRemoveTime = useCallback(
    (timeToRemove: string) => {
      const updatedSchedule = settings.schedule.filter(
        (time) => time !== timeToRemove
      );
      const updatedSettings: NotificationSettings = {
        ...settings,
        schedule: updatedSchedule,
      };
      setSettings(updatedSettings);
      setSaveError(null);
    },
    [settings]
  );

  // Toggle notifications on/off
  const handleToggleEnabled = useCallback(() => {
    const updatedSettings: NotificationSettings = {
      ...settings,
      enabled: !settings.enabled,
    };
    setSettings(updatedSettings);
    setSaveError(null);

    // If disabling, cancel scheduled notifications
    if (!updatedSettings.enabled) {
      cancelNotifications();
    }
  }, [settings, cancelNotifications]);

  // Preview notification
  const handlePreviewNotification = useCallback(async () => {
    if (permission !== "granted") {
      const granted = await requestNotificationPermission();
      if (!granted) {
        setSaveError("Notification permission is required to preview");
        return;
      }
    }

    try {
      // Fetch a random bookmark for preview
      const response = await fetch("/api/notifications/schedule");
      if (response.ok) {
        const data = await response.json();
        const bookmark = data.bookmarkPreview;

        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification(
            `Review: ${bookmark?.name || "Your bookmark"}`,
            {
              icon: "/icon.svg",
              badge: "/icon.svg",
              body: "Time to review your bookmark!",
              tag: "zenchi-keep-preview",
            }
          );

          notification.onclick = () => {
            window.focus();
            window.location.href = "/flashcards";
            notification.close();
          };

          setTimeout(() => {
            notification.close();
          }, 5000);
        }
      }
    } catch (error) {
      setSaveError("Failed to preview notification");
      console.error("Preview error:", error);
    }
  }, [permission, requestNotificationPermission]);

  // Save settings
  const handleSaveSettings = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Save to localStorage
      setNotificationSettings(settings);

      // If notifications are enabled, schedule them
      if (settings.enabled && settings.schedule.length > 0) {
        // Request permission if needed
        if (permission !== "granted") {
          const granted = await requestNotificationPermission();
          if (!granted) {
            setSaveError("Notification permission is required");
            setSaving(false);
            return;
          }
        }

        // Schedule notifications
        await scheduleNotifications(settings);
      } else {
        // Cancel notifications if disabled or no schedule
        cancelNotifications();
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save notification settings";
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  }, [
    settings,
    permission,
    requestNotificationPermission,
    scheduleNotifications,
    cancelNotifications,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Notification Settings
        </h2>
        <p className="text-slate-600 text-sm sm:text-base">
          Configure daily notifications to remind you to review your bookmarks
        </p>
      </div>

      {/* Permission Status */}
      {permission === "denied" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">
            Notification permission was denied. Please enable notifications in
            your browser settings to receive reminders.
          </p>
        </div>
      )}

      {notificationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{notificationError}</p>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <label
            htmlFor="notifications-enabled"
            className="text-base font-medium text-slate-700 cursor-pointer"
          >
            Enable Notifications
          </label>
          <p className="text-sm text-slate-500 mt-1">
            Receive daily reminders to review your bookmarks
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            id="notifications-enabled"
            checked={settings.enabled}
            onChange={handleToggleEnabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-400"></div>
        </label>
      </div>

      {/* Schedule Times */}
      {settings.enabled && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="schedule-time"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Notification Times
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Add times when you want to receive notification reminders (24-hour
              format)
            </p>

            {/* Add Time Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="time"
                id="schedule-time"
                value={newTime}
                onChange={(e) => {
                  setNewTime(e.target.value);
                  setSaveError(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all text-sm sm:text-base"
              />
              <button
                onClick={handleAddTime}
                disabled={!newTime || !isValidTime(newTime)}
                className="px-4 py-2.5 bg-sky-100 text-sky-700 rounded-lg border border-sky-200 hover:bg-sky-200 hover:border-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base touch-manipulation"
              >
                Add
              </button>
            </div>

            {/* Schedule List */}
            {settings.schedule.length > 0 ? (
              <div className="space-y-2">
                {settings.schedule.map((time) => (
                  <div
                    key={time}
                    className="flex items-center justify-between p-3 bg-sky-50 border border-sky-200 rounded-lg"
                  >
                    <span className="text-slate-700 font-medium">{time}</span>
                    <button
                      onClick={() => handleRemoveTime(time)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-all touch-manipulation"
                      aria-label={`Remove ${time}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <p className="text-slate-500 text-sm">
                  No notification times scheduled. Add a time above to get
                  started.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-700 text-sm">{saveError}</p>
        </div>
      )}

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-green-700 text-sm">
            Settings saved successfully!
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePreviewNotification}
          disabled={notificationLoading || saving}
          className="flex-1 min-h-[44px] px-4 py-3 bg-sky-100 text-sky-700 rounded-xl border border-sky-200 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-800 active:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          Preview Notification
        </button>

        <button
          onClick={handleSaveSettings}
          disabled={saving || notificationLoading || (settings.enabled && settings.schedule.length === 0)}
          className="flex-1 min-h-[44px] px-4 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 hover:border-green-300 hover:text-green-800 active:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Current Settings Display */}
      {settings.schedule.length > 0 && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-xs font-medium text-slate-600 mb-2">
            Current Schedule:
          </p>
          <p className="text-sm text-slate-700">
            {settings.enabled
              ? `Notifications enabled for ${settings.schedule.length} time${
                  settings.schedule.length !== 1 ? "s" : ""
                }: ${settings.schedule.join(", ")}`
              : "Notifications are currently disabled"}
          </p>
        </div>
      )}
    </div>
  );
}
