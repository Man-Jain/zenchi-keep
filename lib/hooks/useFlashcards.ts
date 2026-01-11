"use client";

import { useState, useCallback } from "react";
import { Bookmark } from "@/lib/notion";
import {
  getReviewState,
  setReviewState,
  type ReviewState,
} from "@/lib/utils/storage";

interface UseFlashcardsReturn {
  currentBookmark: Bookmark | null;
  reviewedCount: number;
  skippedCount: number;
  loading: boolean;
  error: string | null;
  fetchRandomBookmark: () => Promise<void>;
  markAsReviewed: () => void;
  skipBookmark: () => void;
  resetSession: () => void;
}

export function useFlashcards(): UseFlashcardsReturn {
  const [currentBookmark, setCurrentBookmark] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize counts from localStorage
  const getCounts = useCallback(() => {
    const state = getReviewState();
    return {
      reviewed: state.sessionStats.reviewed,
      skipped: state.sessionStats.skipped,
    };
  }, []);

  const [reviewedCount, setReviewedCount] = useState(() => getCounts().reviewed);
  const [skippedCount, setSkippedCount] = useState(() => getCounts().skipped);

  const fetchRandomBookmark = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const state = getReviewState();
      const excludeIds = [...state.reviewedIds, ...state.skippedIds];

      // Build query parameter for excludeIds
      const excludeIdsParam =
        excludeIds.length > 0 ? excludeIds.join(",") : undefined;

      const url = `/api/flashcards/random${
        excludeIdsParam ? `?excludeIds=${encodeURIComponent(excludeIdsParam)}` : ""
      }`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch random bookmark");
      }

      const data = await response.json();

      if (!data.bookmark) {
        setError("No more bookmarks available");
        setCurrentBookmark(null);
        return;
      }

      setCurrentBookmark(data.bookmark);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      setCurrentBookmark(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsReviewed = useCallback(() => {
    if (!currentBookmark) return;

    const state = getReviewState();
    const updatedState: ReviewState = {
      ...state,
      reviewedIds: [...state.reviewedIds, currentBookmark.id],
      sessionStats: {
        reviewed: state.sessionStats.reviewed + 1,
        skipped: state.sessionStats.skipped,
      },
      lastReviewDate: new Date().toISOString().split("T")[0], // ISO date string (YYYY-MM-DD)
    };

    setReviewState(updatedState);
    setReviewedCount(updatedState.sessionStats.reviewed);
    setCurrentBookmark(null);
  }, [currentBookmark]);

  const skipBookmark = useCallback(() => {
    if (!currentBookmark) return;

    const state = getReviewState();
    const updatedState: ReviewState = {
      ...state,
      skippedIds: [...state.skippedIds, currentBookmark.id],
      sessionStats: {
        reviewed: state.sessionStats.reviewed,
        skipped: state.sessionStats.skipped + 1,
      },
      lastReviewDate: new Date().toISOString().split("T")[0], // ISO date string (YYYY-MM-DD)
    };

    setReviewState(updatedState);
    setSkippedCount(updatedState.sessionStats.skipped);
    setCurrentBookmark(null);
  }, [currentBookmark]);

  const resetSession = useCallback(() => {
    const defaultState: ReviewState = {
      reviewedIds: [],
      skippedIds: [],
      lastReviewDate: "",
      sessionStats: {
        reviewed: 0,
        skipped: 0,
      },
    };

    setReviewState(defaultState);
    setReviewedCount(0);
    setSkippedCount(0);
    setCurrentBookmark(null);
    setError(null);
  }, []);

  return {
    currentBookmark,
    reviewedCount,
    skippedCount,
    loading,
    error,
    fetchRandomBookmark,
    markAsReviewed,
    skipBookmark,
    resetSession,
  };
}
