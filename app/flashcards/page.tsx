"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFlashcards } from "@/lib/hooks/useFlashcards";
import Flashcard from "@/components/Flashcard";
import FlashcardControls from "@/components/FlashcardControls";
import SwipeHandler from "@/components/SwipeHandler";

export default function FlashcardsPage() {
  const router = useRouter();
  const {
    currentBookmark,
    reviewedCount,
    skippedCount,
    loading,
    error,
    fetchRandomBookmark,
    markAsReviewed,
    skipBookmark,
    resetSession,
  } = useFlashcards();

  // Fetch initial bookmark on mount
  useEffect(() => {
    fetchRandomBookmark();
  }, [fetchRandomBookmark]);

  const handleMarkAsReviewed = () => {
    markAsReviewed();
    // Fetch next bookmark immediately
    fetchRandomBookmark();
  };

  const handleSkip = () => {
    skipBookmark();
    // Fetch next bookmark immediately
    fetchRandomBookmark();
  };

  const handleEndSession = () => {
    resetSession();
    router.push("/");
  };

  const handleOpenLink = () => {
    if (currentBookmark) {
      window.open(currentBookmark.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 flex flex-col">
      {/* Session Stats Header */}
      <div className="w-full px-4 sm:px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Flashcard Review
          </h1>
          <div className="flex items-center gap-4 sm:gap-6 text-sm sm:text-base">
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Reviewed:</span>
              <span className="font-semibold text-green-700">{reviewedCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600">Skipped:</span>
              <span className="font-semibold text-red-700">{skippedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {loading && !currentBookmark ? (
            // Loading State
            <div className="text-center">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-sky-300 border-r-transparent mb-4"></div>
              <p className="text-slate-600 font-medium text-lg">
                Loading bookmark...
              </p>
            </div>
          ) : error ? (
            // Error State
            <div className="text-center bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 p-8 sm:p-12">
              <div className="text-sky-400 text-5xl sm:text-6xl mb-4">⚠️</div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-700 mb-2">
                {error}
              </h2>
              <p className="text-slate-600 mb-6">
                {error === "No more bookmarks available"
                  ? "You've reviewed all available bookmarks. Start a new session to review them again."
                  : "Something went wrong while fetching a bookmark."}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={fetchRandomBookmark}
                  className="px-6 py-3 rounded-xl bg-sky-300 text-sky-800 hover:bg-sky-400 transition-all shadow-lg shadow-sky-200 font-medium"
                >
                  Try Again
                </button>
                {error === "No more bookmarks available" && (
                  <button
                    onClick={() => {
                      resetSession();
                      fetchRandomBookmark();
                    }}
                    className="px-6 py-3 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition-all border border-green-200 font-medium"
                  >
                    Start New Session
                  </button>
                )}
              </div>
            </div>
          ) : currentBookmark ? (
            // Flashcard Content
            <div className="space-y-6">
              <SwipeHandler
                onSwipeLeft={handleSkip}
                onSwipeRight={handleMarkAsReviewed}
                disabled={loading}
              >
                <Flashcard bookmark={currentBookmark} />
              </SwipeHandler>

              <FlashcardControls
                onSkip={handleSkip}
                onMarkReviewed={handleMarkAsReviewed}
                onEndSession={handleEndSession}
                onOpenLink={handleOpenLink}
                disabled={loading}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
