// localStorage helpers for client-side tracking

export interface ReviewState {
  reviewedIds: string[]; // IDs of reviewed bookmarks this session
  skippedIds: string[]; // IDs of skipped bookmarks
  lastReviewDate: string; // Date of last review session (ISO date string)
  sessionStats: {
    reviewed: number;
    skipped: number;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  schedule: string[]; // Array of time strings: ["09:00", "14:00", "20:00"]
  lastNotificationDate: string; // ISO date string - Track when last notification was sent
}

const REVIEW_STATE_KEY = "zenchi-keep-review-state";
const NOTIFICATION_SETTINGS_KEY = "zenchi-keep-notification-settings";

/**
 * Get review state from localStorage
 * Returns default state if not found or invalid
 */
export function getReviewState(): ReviewState {
  if (typeof window === "undefined") {
    // Server-side: return default state
    return {
      reviewedIds: [],
      skippedIds: [],
      lastReviewDate: "",
      sessionStats: {
        reviewed: 0,
        skipped: 0,
      },
    };
  }

  try {
    const stored = localStorage.getItem(REVIEW_STATE_KEY);
    if (!stored) {
      return {
        reviewedIds: [],
        skippedIds: [],
        lastReviewDate: "",
        sessionStats: {
          reviewed: 0,
          skipped: 0,
        },
      };
    }

    const parsed = JSON.parse(stored) as ReviewState;
    // Validate structure
    if (
      Array.isArray(parsed.reviewedIds) &&
      Array.isArray(parsed.skippedIds) &&
      typeof parsed.lastReviewDate === "string" &&
      parsed.sessionStats &&
      typeof parsed.sessionStats.reviewed === "number" &&
      typeof parsed.sessionStats.skipped === "number"
    ) {
      return parsed;
    }

    // Invalid structure, return default
    return {
      reviewedIds: [],
      skippedIds: [],
      lastReviewDate: "",
      sessionStats: {
        reviewed: 0,
        skipped: 0,
      },
    };
  } catch (error) {
    console.error("Error reading review state from localStorage:", error);
    return {
      reviewedIds: [],
      skippedIds: [],
      lastReviewDate: "",
      sessionStats: {
        reviewed: 0,
        skipped: 0,
      },
    };
  }
}

/**
 * Save review state to localStorage
 */
export function setReviewState(state: ReviewState): void {
  if (typeof window === "undefined") {
    return; // Server-side: no-op
  }

  try {
    localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving review state to localStorage:", error);
  }
}

/**
 * Get notification settings from localStorage
 * Returns default settings if not found or invalid
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") {
    // Server-side: return default settings
    return {
      enabled: false,
      schedule: [],
      lastNotificationDate: "",
    };
  }

  try {
    const stored = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (!stored) {
      return {
        enabled: false,
        schedule: [],
        lastNotificationDate: "",
      };
    }

    const parsed = JSON.parse(stored) as NotificationSettings;
    // Validate structure
    if (
      typeof parsed.enabled === "boolean" &&
      Array.isArray(parsed.schedule) &&
      typeof parsed.lastNotificationDate === "string"
    ) {
      return parsed;
    }

    // Invalid structure, return default
    return {
      enabled: false,
      schedule: [],
      lastNotificationDate: "",
    };
  } catch (error) {
    console.error("Error reading notification settings from localStorage:", error);
    return {
      enabled: false,
      schedule: [],
      lastNotificationDate: "",
    };
  }
}

/**
 * Save notification settings to localStorage
 */
export function setNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") {
    return; // Server-side: no-op
  }

  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving notification settings to localStorage:", error);
  }
}
