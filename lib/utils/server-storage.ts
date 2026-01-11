// Server-side storage for notification settings
// In production, this could be replaced with a database

import { NotificationSettings } from './storage';

// Simple in-memory storage for notification settings
// This is shared across all API routes
const settingsStore = new Map<string, NotificationSettings>();

/**
 * Get notification settings from server-side store
 */
export function getServerNotificationSettings(userId: string): NotificationSettings | undefined {
  return settingsStore.get(userId);
}

/**
 * Set notification settings in server-side store
 */
export function setServerNotificationSettings(userId: string, settings: NotificationSettings): void {
  settingsStore.set(userId, settings);
}

/**
 * Get the settings store (for direct access if needed)
 */
export function getSettingsStore(): Map<string, NotificationSettings> {
  return settingsStore;
}
