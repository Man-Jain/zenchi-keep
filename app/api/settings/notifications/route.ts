import { NextRequest, NextResponse } from 'next/server';
import { NotificationSettings } from '@/lib/utils/storage';
import { getServerNotificationSettings, setServerNotificationSettings } from '@/lib/utils/server-storage';

/**
 * Validate API key from request headers
 * Returns true if valid, false otherwise
 */
function validateApiKey(request: NextRequest): boolean {
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
 * GET /api/settings/notifications
 * Retrieves user's notification settings
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

    // Return default settings if not found
    if (!settings) {
      return NextResponse.json({
        enabled: false,
        schedule: [],
        lastNotificationDate: '',
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve notification settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/notifications
 * Saves user's notification settings
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Validate NotificationSettings structure
    if (
      typeof body.enabled !== 'boolean' ||
      !Array.isArray(body.schedule) ||
      typeof body.lastNotificationDate !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Invalid notification settings format' },
        { status: 400 }
      );
    }

    // Validate schedule array contains valid time strings (HH:MM format)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!body.schedule.every((time: string) => timeRegex.test(time))) {
      return NextResponse.json(
        { error: 'Invalid time format in schedule. Use HH:MM format (e.g., "09:00")' },
        { status: 400 }
      );
    }

    const settings: NotificationSettings = {
      enabled: body.enabled,
      schedule: body.schedule,
      lastNotificationDate: body.lastNotificationDate || '',
    };

    const userId = getUserId(request);
    setServerNotificationSettings(userId, settings);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('API Error:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save notification settings' },
      { status: 500 }
    );
  }
}
