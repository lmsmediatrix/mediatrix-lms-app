import { KeyboardEvent, useEffect, useState } from "react";

type PaginationTone = "sky" | "indigo";

interface PageJumpPaginationProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  tone?: PaginationTone;
  stackOnMobile?: boolean;
}

const TONE_CLASSES: Record<PaginationTone, string> = {
  sky: "border-[#60B2F0]/40 text-[#3A8ECF] hover:border-[#60B2F0] hover:bg-[#EAF6FF]",
  indigo:
    "border-[#3E5B93]/40 text-[#3E5B93] hover:border-[#3E5B93] hover:bg-[#EDF1FA]",
};

const TONE_SOLID_CLASSES: Record<PaginationTone, string> = {
  sky: "border-[#60B2F0] bg-[#60B2F0] text-white hover:border-[#4FA6E6] hover:bg-[#4FA6E6] focus-visible:ring-[#60B2F0]/35",
  indigo:
    "border-[#3E5B93] bg-[#3E5B93] text-white hover:border-[#334B79] hover:bg-[#334B79] focus-visible:ring-[#3E5B93]/35",
};

export default function PageJumpPagination({
  totalItems,
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  tone = "sky",
  stackOnMobile = false,
}: PageJumpPaginationProps) {
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safeCurrentPage = Math.min(Math.max(1, currentPage || 1), safeTotalPages);
  const [pageInput, setPageInput] = useState(String(safeCurrentPage));

  useEffect(() => {
    setPageInput(String(safeCurrentPage));
  }, [safeCurrentPage]);

  const jumpToPage = () => {
    const parsed = Number.parseInt(pageInput.trim(), 10);
    if (Number.isNaN(parsed)) {
      setPageInput(String(safeCurrentPage));
      return;
    }
    const targetPage = Math.min(Math.max(1, parsed), safeTotalPages);
    setPageInput(String(targetPage));
    if (targetPage !== safeCurrentPage) {
      onPageChange(targetPage);
    }
  };

  const handleInputEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      jumpToPage();
    }
  };

  const controlContainerClassName = stackOnMobile
    ? "flex flex-col md:flex-row gap-2 w-full md:w-auto rounded-2xl border border-gray-200 bg-white/90 p-1.5 shadow-sm"
    : "flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/90 p-1.5 shadow-sm";

  const actionButtonClassName = stackOnMobile
    ? "h-10 px-4 rounded-xl border font-medium transition-all duration-200 w-full md:w-auto focus:outline-none focus-visible:ring-4"
    : "h-10 px-4 rounded-xl border font-medium transition-all duration-200 focus:outline-none focus-visible:ring-4";

  return (
    <div
      className={`flex ${
        stackOnMobile
          ? "flex-col md:flex-row gap-4"
          : "justify-between items-center"
      } justify-between items-center mt-4 text-sm text-gray-500`}
    >
      <span>
        {totalItems || 0} result
        {totalItems !== 1 ? "s" : ""}
      </span>

      <div className={controlContainerClassName}>
        <button
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={!hasPreviousPage}
          className={`${actionButtonClassName} ${
            !hasPreviousPage
              ? "opacity-45 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
              : `${TONE_CLASSES[tone]} bg-white focus-visible:ring-gray-200`
          }`}
        >
          Previous
        </button>

        <span className="inline-flex h-10 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 font-medium text-gray-700 text-center">
          Page {safeCurrentPage} of {safeTotalPages}
        </span>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1">
          <input
            type="number"
            min={1}
            max={safeTotalPages}
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            onKeyDown={handleInputEnter}
            onBlur={jumpToPage}
            className="h-8 w-16 rounded-lg border border-gray-200 bg-white px-2 text-center font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300 md:w-20"
            aria-label="Go to page"
          />
          <button
            onClick={jumpToPage}
            disabled={safeTotalPages <= 1}
            className={`h-8 px-3 rounded-lg border font-medium transition-all duration-200 focus:outline-none focus-visible:ring-4 ${
              safeTotalPages <= 1
                ? "opacity-45 cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : TONE_SOLID_CLASSES[tone]
            }`}
          >
            Go
          </button>
        </div>

        <button
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={!hasNextPage}
          className={`${actionButtonClassName} ${
            !hasNextPage
              ? "opacity-45 cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
              : `${TONE_CLASSES[tone]} bg-white focus-visible:ring-gray-200`
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
