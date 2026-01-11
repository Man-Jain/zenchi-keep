import { NextRequest, NextResponse } from 'next/server';
import { getRandomBookmarks, getAllBookmarks } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const excludeIdsParam = searchParams.get('excludeIds');
    
    // Parse excludeIds from query parameter (comma-separated string)
    const excludeIds = excludeIdsParam
      ? excludeIdsParam.split(',').map(id => id.trim()).filter(id => id.length > 0)
      : undefined;

    // Get all bookmarks to calculate remaining count
    const allBookmarks = await getAllBookmarks();
    const availableCount = excludeIds
      ? allBookmarks.filter(bookmark => !excludeIds.includes(bookmark.id)).length
      : allBookmarks.length;

    // Get a single random bookmark
    const randomBookmarks = await getRandomBookmarks(1, excludeIds);
    
    if (randomBookmarks.length === 0) {
      return NextResponse.json(
        { 
          bookmark: null,
          remainingCount: 0
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      bookmark: randomBookmarks[0],
      remainingCount: availableCount - 1 // Subtract 1 for the bookmark we're returning
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random bookmark' },
      { status: 500 }
    );
  }
}
