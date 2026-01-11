"use client";

import { Bookmark } from "@/lib/notion";

interface FlashcardProps {
  bookmark: Bookmark;
}

function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function getFaviconUrl(domain: string): string {
  if (!domain) return '';
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

export default function Flashcard({ bookmark }: FlashcardProps) {
  const domain = getDomainFromUrl(bookmark.link);
  const faviconUrl = getFaviconUrl(domain);

  return (
    <div className="min-h-[60vh] bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 p-6 sm:p-8 md:p-10 flex flex-col">
      {/* Favicon and Domain */}
      <div className="flex items-center gap-4 mb-6">
        {faviconUrl && (
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            <img
              src={faviconUrl}
              alt={domain}
              className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm sm:text-base text-slate-500 truncate">
            {domain || bookmark.link}
          </p>
        </div>
      </div>

      {/* Bookmark Name - Large */}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-6 break-words flex-1">
        {bookmark.name}
      </h2>

      {/* URL Display */}
      <div className="mb-6">
        <p className="text-sm sm:text-base text-slate-600 break-all">
          {bookmark.link}
        </p>
      </div>

      {/* Type and Status Badges */}
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="inline-flex items-center rounded-full bg-cyan-100 px-4 py-2 text-sm font-medium text-cyan-700">
          {bookmark.type}
        </span>
        <span className="inline-flex items-center rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
          {bookmark.status}
        </span>
      </div>

      {/* Visit Link Button */}
      <a
        href={bookmark.link}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-sky-100 text-sky-700 rounded-xl border border-sky-200 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-800 active:bg-sky-300 transition-all font-medium text-base touch-manipulation"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
          />
        </svg>
        <span>Visit Link</span>
      </a>
    </div>
  );
}
