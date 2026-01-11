"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BookmarkCard from "@/components/BookmarkCard";
import FeaturedCard from "@/components/FeaturedCard";
import Pagination from "@/components/Pagination";

interface Bookmark {
  id: string;
  name: string;
  link: string;
  type: string;
  status: string;
}

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [featuredBookmarks, setFeaturedBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const pageSize = 30;

  const fetchBookmarks = async (cursor?: string, pageNumber?: number, search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        pageSize: pageSize.toString(),
      });
      if (cursor) {
        params.append("cursor", cursor);
      }
      if (search && search.trim()) {
        params.append("search", search.trim());
      }

      const response = await fetch(`/api/bookmarks?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch bookmarks");
      }

      const data = await response.json();
      setBookmarks(data.bookmarks);
      setHasMore(data.hasMore);
      setCurrentCursor(data.nextCursor);

      // Update current page if provided
      if (pageNumber !== undefined) {
        setCurrentPage(pageNumber);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedBookmarks = async () => {
    try {
      const response = await fetch("/api/bookmarks/featured");
      if (response.ok) {
        const data = await response.json();
        setFeaturedBookmarks(data.bookmarks);
      }
    } catch (err) {
      // Silently fail for featured bookmarks, don't block the main list
      console.error("Failed to fetch featured bookmarks:", err);
    }
  };

  // Debounce search query and refetch when it changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refetch bookmarks when search query changes
  useEffect(() => {
    // Reset pagination when searching
    setCursorHistory([]);
    setCurrentPage(1);
    setCurrentCursor(undefined);
    fetchBookmarks(undefined, 1, debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    fetchBookmarks();
    fetchFeaturedBookmarks();
  }, []);

  const handleNext = () => {
    if (currentCursor) {
      const newHistory = [...cursorHistory, currentCursor];
      setCursorHistory(newHistory);
      setCurrentPage(currentPage + 1);
      fetchBookmarks(currentCursor, currentPage + 1, debouncedSearchQuery);
    }
  };

  const handlePrevious = () => {
    if (cursorHistory.length > 0) {
      const newHistory = [...cursorHistory];
      newHistory.pop();
      setCursorHistory(newHistory);
      const previousCursor =
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : undefined;
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      fetchBookmarks(previousCursor, newPage, debouncedSearchQuery);
    } else {
      setCurrentPage(1);
      fetchBookmarks(undefined, 1, debouncedSearchQuery);
    }
  };

  if (loading && bookmarks.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-sky-300 border-r-transparent"></div>
          <p className="mt-4 text-slate-600 font-medium">
            Loading bookmarks...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-sky-400 text-5xl sm:text-6xl mb-3 sm:mb-4">⚠️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2">
            Error Loading Bookmarks
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => fetchBookmarks()}
            className="px-5 py-2.5 sm:px-6 rounded-xl bg-sky-300 text-sky-800 hover:bg-sky-400 transition-all shadow-lg shadow-sky-200 font-medium text-sm sm:text-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-5 py-8 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-8 max-w-6xl">
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4 sm:mb-5">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-1 sm:mb-2 flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-sky-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
                <span>Zenchi - Complete Knowledge</span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base">
                Your saved bookmarks from Notion
              </p>
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/flashcards"
                className="min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-100 text-sky-700 rounded-xl border border-sky-200 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-800 active:bg-sky-300 transition-all font-medium text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
                <span className="hidden sm:inline">Flashcards</span>
              </Link>
              
              <Link
                href="/settings"
                className="min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 sm:py-3 bg-sky-100 text-sky-700 rounded-xl border border-sky-200 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-800 active:bg-sky-300 transition-all font-medium text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5 sm:w-6 sm:h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="hidden sm:inline">Settings</span>
              </Link>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-slate-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks by title..."
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-lg border border-slate-300 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-sky-400 transition-all text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5 text-slate-400 hover:text-slate-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </header>

        {featuredBookmarks.length > 0 && (
          <div className="mb-6 sm:mb-8 md:mb-10">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-700 mb-3 sm:mb-4 md:mb-5">
              Featured Links
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featuredBookmarks.map((bookmark) => (
                <FeaturedCard
                  key={bookmark.id}
                  name={bookmark.name}
                  link={bookmark.link}
                  type={bookmark.type}
                  status={bookmark.status}
                />
              ))}
            </div>
          </div>
        )}

        {bookmarks.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-slate-600 text-base sm:text-lg font-medium">
              No bookmarks found.
            </p>
          </div>
        ) : (
          <>
            {debouncedSearchQuery.trim() && (
              <div className="mb-4 px-4 sm:px-5 py-2 bg-sky-50 border border-sky-200 rounded-lg">
                <p className="text-sm text-slate-600">
                  Showing results for "{debouncedSearchQuery}"
                </p>
              </div>
            )}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-200 shadow-lg sm:shadow-xl shadow-slate-200/50 overflow-hidden">
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  name={bookmark.name}
                  link={bookmark.link}
                  type={bookmark.type}
                  status={bookmark.status}
                />
              ))}
            </div>

            <Pagination
              hasMore={hasMore}
              onNext={handleNext}
              onPrevious={handlePrevious}
              canGoPrevious={cursorHistory.length > 0}
              currentPage={currentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
