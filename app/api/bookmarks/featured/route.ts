import { NextResponse } from 'next/server';
import { getFeaturedBookmarks } from '@/lib/notion';

export async function GET() {
  try {
    const featured = await getFeaturedBookmarks();
    return NextResponse.json({ bookmarks: featured });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured bookmarks' },
      { status: 500 }
    );
  }
}
