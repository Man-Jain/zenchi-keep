"use client";

interface FlashcardControlsProps {
  onSkip: () => void;
  onMarkReviewed: () => void;
  onEndSession: () => void;
  onOpenLink: () => void;
  disabled?: boolean;
}

export default function FlashcardControls({
  onSkip,
  onMarkReviewed,
  onEndSession,
  onOpenLink,
  disabled = false,
}: FlashcardControlsProps) {
  return (
    <div className="flex items-center justify-between gap-4 mt-6">
      {/* Skip Button - Left */}
      <button
        onClick={onSkip}
        disabled={disabled}
        className="flex-1 min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-3 bg-red-50 text-red-700 rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 hover:text-red-800 active:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-base sm:text-lg touch-manipulation flex items-center justify-center gap-2"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span className="hidden sm:inline">Skip</span>
      </button>

      {/* Center Actions */}
      <div className="flex items-center gap-2">
        {/* Open Link Icon Button */}
        <button
          onClick={onOpenLink}
          disabled={disabled}
          className="min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center bg-sky-100 text-sky-700 rounded-xl border border-sky-200 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-800 active:bg-sky-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
          aria-label="Open link in new tab"
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
              d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
            />
          </svg>
        </button>

        {/* End Session Button */}
        <button
          onClick={onEndSession}
          className="min-h-[44px] sm:min-h-[48px] px-3 sm:px-4 py-3 bg-slate-100 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-200 hover:border-slate-300 hover:text-slate-800 active:bg-slate-300 transition-all font-medium text-sm sm:text-base touch-manipulation flex items-center justify-center gap-2"
          aria-label="End session"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span className="hidden sm:inline">End</span>
        </button>
      </div>

      {/* Mark as Reviewed Button - Right */}
      <button
        onClick={onMarkReviewed}
        disabled={disabled}
        className="flex-1 min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200 hover:bg-green-100 hover:border-green-300 hover:text-green-800 active:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-base sm:text-lg touch-manipulation flex items-center justify-center gap-2"
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
            d="M4.5 12.75l6 6 9-13.5"
          />
        </svg>
        <span className="hidden sm:inline">Reviewed</span>
      </button>
    </div>
  );
}
