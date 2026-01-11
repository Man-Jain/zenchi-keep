import { NextRequest, NextResponse } from 'next/server';
import { getRandomBookmarks } from '@/lib/notion';
import { getServerNotificationSettings } from '@/lib/utils/server-storage';

/**
 * Validate API key from request headers
 * Returns true if valid, false otherwise
 * Note: API key is optional for local development
 */
function validateApiKey(request: NextRequest): boolean {
  // If no API_KEY is set in environment, skip validation (for local development)
  if (!process.env.API_KEY) {
    return true;
  }

  // Check for API key in Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7);
    const expectedApiKey = process.env.API_KEY;
    if (expectedApiKey && apiKey === expectedApiKey) {
      return true;
    }
  }

  // Check for API key in X-API-Key header (alternative method)
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader) {
    const expectedApiKey = process.env.API_KEY;
    if (expectedApiKey && apiKeyHeader === expectedApiKey) {
      return true;
    }
  }

  return false;
}

/**
 * Get user ID from request (could be from auth token, session, etc.)
 * For now, using a simple approach - in production, extract from JWT or session
 */
function getUserId(request: NextRequest): string {
  // For MVP, use a default user ID
  // In production, extract from authenticated session/JWT
  return 'default-user';
}

/**
 * Calculate the next scheduled notification time based on schedule array
 * Returns ISO date string of next notification time, or null if no schedule
 */
function calculateNextNotificationTime(schedule: string[]): string | null {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight

  // Parse schedule times and convert to minutes since midnight
  const scheduleMinutes = schedule
    .map((time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    })
    .sort((a, b) => a - b); // Sort ascending

  // Find next time today
  for (const scheduledMinutes of scheduleMinutes) {
    if (scheduledMinutes > currentTime) {
      const nextNotification = new Date(now);
      nextNotification.setHours(Math.floor(scheduledMinutes / 60), scheduledMinutes % 60, 0, 0);
      return nextNotification.toISOString();
    }
  }

  // If no time found today, use first time tomorrow
  const firstTimeTomorrow = scheduleMinutes[0];
  const [hours, minutes] = [Math.floor(firstTimeTomorrow / 60), firstTimeTomorrow % 60];
  const nextNotification = new Date(now);
  nextNotification.setDate(nextNotification.getDate() + 1);
  nextNotification.setHours(hours, minutes, 0, 0);
  return nextNotification.toISOString();
}

/**
 * GET /api/notifications/schedule
 * Returns next scheduled notification time and random bookmark preview
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    const userId = getUserId(request);
    const settings = getServerNotificationSettings(userId);

    // If no settings or notifications disabled, return null for next time
    if (!settings || !settings.enabled || !settings.schedule || settings.schedule.length === 0) {
      // Still return a random bookmark preview even if notifications are disabled
      const randomBookmarks = await getRandomBookmarks(1);
      return NextResponse.json({
        nextNotificationTime: null,
        bookmarkPreview: randomBookmarks.length > 0 ? randomBookmarks[0] : null,
      });
    }

    // Calculate next notification time
    const nextNotificationTime = calculateNextNotificationTime(settings.schedule);

    // Get random bookmark preview
    const randomBookmarks = await getRandomBookmarks(1);
    const bookmarkPreview = randomBookmarks.length > 0 ? randomBookmarks[0] : null;

    return NextResponse.json({
      nextNotificationTime,
      bookmarkPreview,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to get notification schedule' },
      { status: 500 }
    );
  }
}
