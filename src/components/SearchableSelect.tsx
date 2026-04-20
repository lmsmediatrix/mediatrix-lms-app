import { useState, useRef, useEffect, useCallback } from "react";
import { FiSearch, FiChevronDown, FiPlus } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

interface Option {
  value: string;
  label: string;
  description?: string;
  image?: string;
}

interface PaginationInfo {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (term: string) => void; // Add callback for server-side search
  placeholder?: string;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    path: string;
  };
  type?: "course" | "instructor" | "student";
  error?: boolean; // Add error prop
  // Infinite scrolling props
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  // Pagination info
  paginationInfo?: PaginationInfo;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Search...",
  className = "",
  loading = false,
  emptyMessage = "No results found.",
  emptyAction,
  error = false, // Add error prop with default value
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore,
  paginationInfo,
  disabled = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const selectedOption = options.find((opt) => opt.value === value);

  // If onSearch is provided, we're doing server-side filtering, so use all options
  // Otherwise, filter options client-side
  const filteredOptions = onSearch
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle infinite scrolling
  const handleScroll = useCallback(() => {
    if (
      !dropdownRef.current ||
      !onLoadMore ||
      !hasNextPage ||
      isFetchingNextPage
    ) {
      return;
    }

    const { scrollTop, scrollHeight, clientHeight } = dropdownRef.current;
    const scrollThreshold = scrollHeight - clientHeight - 50; // 50px threshold

    if (scrollTop >= scrollThreshold) {
      onLoadMore();
    }
  }, [onLoadMore, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const dropdown = dropdownRef.current;
    if (dropdown && isOpen) {
      dropdown.addEventListener("scroll", handleScroll);
      return () => dropdown.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, isOpen]);

  return (
    <div ref={wrapperRef} className={`relative ${isOpen ? "z-[80]" : "z-0"} ${className}`}>
      <div
        className={`flex items-center justify-between border rounded-lg px-3 py-2 bg-white ${
          disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"
        } ${error ? "border-red-500" : "border-gray-300"}
        }`}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex-1">
          {selectedOption ? (
            <span>{selectedOption.label}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <FiChevronDown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[90] w-full mt-1 bg-white border rounded-lg shadow-lg">
          <div className="border-b">
            {/* Search Bar with integrated pagination info */}
            <div className="p-2">
              <div className="flex items-center px-2 bg-gray-50 rounded">
                <FiSearch className="text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    const newTerm = e.target.value;
                    setSearchTerm(newTerm);
                    // If onSearch is provided, call it for server-side filtering
                    if (onSearch) {
                      onSearch(newTerm);
                    }
                  }}
                  className="flex-1 p-2 bg-transparent outline-none"
                  placeholder="Search..."
                  onClick={(e) => e.stopPropagation()}
                />
                {/* Pagination info integrated into search bar */}
                {paginationInfo && options.length > 0 && (
                  <div className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                    {paginationInfo.totalItems} items
                  </div>
                )}
              </div>
            </div>
            {/* Page info below search
            {paginationInfo && options.length > 0 && (
              <div className="px-3 pb-2 text-xs text-gray-500">
                Page {paginationInfo.currentPage} of {paginationInfo.totalPages}
              </div>
            )} */}
          </div>

          <div ref={dropdownRef} className="max-h-[200px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    {option.image && (
                      <img
                        src={option.image}
                        alt={option.label}
                        className="w-6 h-6 rounded-full mr-2"
                      />
                    )}
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-gray-500">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isFetchingNextPage && (
                  <div className="p-2 text-center text-gray-500 text-sm">
                    Loading more...
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center">
                <p className="text-gray-500 mb-2">{emptyMessage}</p>
                {emptyAction && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      navigate(emptyAction.path);
                    }}
                    className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mx-auto"
                  >
                    <FiPlus className="text-blue-600" />
                    {emptyAction.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
