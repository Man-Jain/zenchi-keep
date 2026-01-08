interface BookmarkCardProps {
  name: string;
  link: string;
  type: string;
  status: string;
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
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}

export default function BookmarkCard({ name, link, type, status }: BookmarkCardProps) {
  const domain = getDomainFromUrl(link);
  const faviconUrl = getFaviconUrl(domain);

  return (
    <div className="py-3 px-4 sm:px-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50 transition-all">
      <div className="flex items-start gap-3">
        {faviconUrl && (
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center mt-0.5">
            <img
              src={faviconUrl}
              alt={domain}
              className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-sm font-semibold text-slate-700 truncate">
                  {name}
                </h3>
                <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-medium text-cyan-700">
                  {type}
                </span>
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                  {status}
                </span>
              </div>
            </div>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-sky-100 text-sky-600 rounded-lg border border-sky-200 hover:bg-sky-200 hover:border-sky-300 hover:text-sky-700 active:bg-sky-300 active:border-sky-400 transition-all touch-manipulation"
              aria-label="Visit link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
            </a>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {link}
          </p>
        </div>
      </div>
    </div>
  );
}
