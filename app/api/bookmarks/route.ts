import { NextRequest, NextResponse } from 'next/server';
import { getBookmarks } from '@/lib/notion';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageSizeParam = searchParams.get('pageSize') || '10';
    const pageSize = Math.min(Math.max(parseInt(pageSizeParam) || 10, 1), 100); // Limit between 1-100
    const cursor = searchParams.get('cursor') || undefined;
    const search = searchParams.get('search')?.trim() || undefined;

    const result = await getBookmarks(pageSize, cursor, search);

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    );
  }
}
