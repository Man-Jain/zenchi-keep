interface PaginationProps {
  hasMore: boolean;
  onNext: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
  currentPage: number;
}

export default function Pagination({
  hasMore,
  onNext,
  onPrevious,
  canGoPrevious,
  currentPage,
}: PaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 md:mt-10">
      <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 sm:py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm active:bg-slate-100 font-medium text-sm sm:text-base touch-manipulation min-w-[100px] sm:min-w-0"
        >
          Previous
        </button>
        
        <div className="flex items-center">
          <span className="px-3 sm:px-4 py-2 text-slate-700 font-medium text-sm sm:text-base">
            Page {currentPage}
          </span>
        </div>
        
        <button
          onClick={onNext}
          disabled={!hasMore}
          className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 sm:py-2.5 rounded-lg border border-slate-300 bg-white text-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm active:bg-slate-100 font-medium text-sm sm:text-base touch-manipulation min-w-[100px] sm:min-w-0"
        >
          Next
        </button>
      </div>
    </div>
  );
}
