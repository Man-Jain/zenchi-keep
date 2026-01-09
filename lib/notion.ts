const DATABASE_ID = process.env.NOTION_DATABASE_ID;
if (!DATABASE_ID) {
  throw new Error("NOTION_DATABASE_ID is not set in environment variables");
}

export interface Bookmark {
  id: string;
  name: string;
  link: string;
  type: string;
  status: string;
}

// Simple in-memory cache
let cachedBookmarks: Bookmark[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getBookmarks(
  pageSize: number = 10,
  startCursor?: string,
  searchQuery?: string
) {
  try {
    const apiKey = process.env.NOTION_API_KEY;
    if (!apiKey) {
      throw new Error("NOTION_API_KEY is not set in environment variables");
    }

    // Use direct API call since databases.query is not available in this client version
    const url = `https://api.notion.com/v1/databases/${DATABASE_ID}/query`;
    
    // Build filter if search query is provided
    // Sanitize search query to prevent injection
    const sanitizedQuery = searchQuery?.trim().slice(0, 100); // Limit length
    const filter = sanitizedQuery
      ? {
          property: "Name",
          title: {
            contains: sanitizedQuery,
          },
        }
      : undefined;

    const body: any = {
      page_size: pageSize,
      sorts: [
        {
          timestamp: "created_time",
          direction: "descending",
        },
      ],
    };

    if (startCursor) {
      body.start_cursor = startCursor;
    }

    if (filter) {
      body.filter = filter;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Notion API error: ${response.status}`, errorText);
      throw new Error(`Notion API error: ${response.status}`);
    }

    const data = await response.json();

    const bookmarks: Bookmark[] = data.results.map((page: any) => {
      const properties = page.properties;

      return {
        id: page.id,
        name: properties.Name?.title?.[0]?.plain_text || "Untitled",
        link: properties.Link?.url || "#",
        type: properties.Type?.select?.name || "Unknown",
        status: properties.Status?.select?.name || "Unknown",
      };
    });

    return {
      bookmarks,
      hasMore: data.has_more,
      nextCursor: data.next_cursor || undefined,
    };
  } catch (error) {
    console.error("Error fetching bookmarks from Notion:", error);
    throw error;
  }
}

// Fetch all bookmarks by paginating through all pages
export async function getAllBookmarks(): Promise<Bookmark[]> {
  // Check cache first
  const now = Date.now();
  if (cachedBookmarks && now - cacheTimestamp < CACHE_TTL) {
    return cachedBookmarks;
  }

  const allBookmarks: Bookmark[] = [];
  let cursor: string | undefined = undefined;
  let hasMore = true;

  while (hasMore) {
    const result = await getBookmarks(100, cursor); // Fetch 100 at a time for efficiency
    allBookmarks.push(...result.bookmarks);
    hasMore = result.hasMore;
    cursor = result.nextCursor;
  }

  // Cache the results
  cachedBookmarks = allBookmarks;
  cacheTimestamp = now;

  return allBookmarks;
}

// Get 3 random featured bookmarks
export async function getFeaturedBookmarks(): Promise<Bookmark[]> {
  const allBookmarks = await getAllBookmarks();
  
  if (allBookmarks.length === 0) {
    return [];
  }

  // Pick 3 random items
  const featured: Bookmark[] = [];
  const available = [...allBookmarks];
  
  for (let i = 0; i < 3 && available.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    featured.push(available[randomIndex]);
    available.splice(randomIndex, 1); // Remove to avoid duplicates
  }

  return featured;
}
