interface FeaturedCardProps {
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

export default function FeaturedCard({ name, link, type, status }: FeaturedCardProps) {
  const domain = getDomainFromUrl(link);
  const faviconUrl = getFaviconUrl(domain);

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block w-full rounded-lg sm:rounded-xl bg-white border border-slate-200 p-4 sm:p-5 transition-all hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100 hover:-translate-y-0.5 active:translate-y-0 touch-manipulation overflow-hidden"
    >
      <div className="flex gap-3 mb-3">
        {faviconUrl && (
          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
            <img
              src={faviconUrl}
              alt={domain}
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-sky-600 transition-colors break-words mb-1 line-clamp-2">
            {name}
          </h3>
          <p className="text-xs text-slate-500 break-all overflow-hidden line-clamp-1">
            {link}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full bg-cyan-100 px-2 sm:px-3 py-1 text-xs font-medium text-cyan-700 whitespace-nowrap">
          {type}
        </span>
        <span className="inline-flex items-center rounded-full bg-sky-100 px-2 sm:px-3 py-1 text-xs font-medium text-sky-700 whitespace-nowrap">
          {status}
        </span>
      </div>
    </a>
  );
}
