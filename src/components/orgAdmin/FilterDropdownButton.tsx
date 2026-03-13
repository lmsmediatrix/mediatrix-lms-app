import { useState, useRef, useEffect } from "react";
import { IoFilterOutline, IoClose, IoChevronDown } from "react-icons/io5";
import Button from "../common/Button";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownButtonProps {
  label: string; // e.g., "Status", "Level", "Category"
  value: string; // Current selected value
  options: FilterOption[]; // Available options
  onChange: (value: string) => void; // Callback when selection changes
  loading?: boolean; // For dynamic options that are being fetched
  placeholder?: string; // Placeholder when no option selected
  className?: string; // Additional styling
  disabled?: boolean; // Disable the dropdown
  isMobile?: boolean; // Whether this is being used in mobile context (deprecated, use isMobileTablet)
  isMobileTablet?: boolean; // Whether this is being used in mobile/tablet context
}

export default function FilterDropdownButton({
  label,
  value,
  options,
  onChange,
  loading = false,
  placeholder,
  className = "",
  disabled = false,
  isMobile = false,
  isMobileTablet = false,
}: FilterDropdownButtonProps) {
  // Support both old and new prop names for backward compatibility
  const isCompactView = isMobileTablet || isMobile;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Find the selected option to display its label
  const selectedOption = options.find((option) => option.value === value);
  const displayLabel = selectedOption?.label || placeholder || `All ${label}`;

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsDropdownOpen(false);
  };

  const handleClearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={`relative flex-shrink-0 ${className}`} ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() =>
          !disabled && !loading && setIsDropdownOpen(!isDropdownOpen)
        }
        className={`flex items-center gap-1 ${
          isCompactView
            ? "px-3 w-full h-[42px] md:h-[36px] justify-between" // Mobile: 42px, Tablet: 36px
            : "px-3 w-[160px] h-[42px] justify-start" // Desktop: fixed width, left-aligned
        }`}
        disabled={disabled || loading}
      >
        <IoFilterOutline
          className={`${
            isCompactView
              ? "w-5 h-5"
              : "mx-auto xl:m-0 hidden xl:inline w-4 h-4"
          }`}
        />
        <span
          className={`truncate ${
            isCompactView
              ? "text-base md:text-sm max-w-[120px]"
              : "text-sm hidden xl:inline max-w-[90px]"
          }`}
        >
          {loading ? "Loading..." : displayLabel}
        </span>
        {value ? (
          <IoClose
            className={`text-gray-500 hover:text-gray-700 cursor-pointer z-20 ${
              isCompactView ? "w-5 h-5" : "w-4 h-4 ml-auto"
            }`}
            onClick={handleClearFilter}
          />
        ) : (
          <IoChevronDown
            className={`${isCompactView ? "ml-1 w-5 h-5" : "ml-auto w-4 h-4"}`}
          />
        )}
      </Button>

      {isDropdownOpen && !loading && !disabled && (
        <div
          className={`absolute ${
            isCompactView
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left"
          } mt-2 ${
            isCompactView ? "w-64 max-w-[calc(100vw-2rem)]" : "w-48 min-w-max"
          } bg-white rounded-md shadow-lg z-50 border`}
        >
          <ul className="py-1 max-h-60 overflow-y-auto">
            {/* "All" option to clear filter */}
            <li
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                isCompactView
                  ? "text-sm md:text-xs min-h-[40px] md:min-h-[36px] flex items-center"
                  : "text-sm"
              }`}
              onClick={() => handleOptionSelect("")}
            >
              All {label}
            </li>

            {/* Separator */}
            {options.length > 0 && (
              <li className="border-t border-gray-200 my-1"></li>
            )}

            {/* Filter options */}
            {options.map((option) => (
              <li
                key={option.value}
                className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                  isCompactView
                    ? "text-sm md:text-xs min-h-[40px] md:min-h-[36px] flex items-center"
                    : "text-sm"
                } ${value === option.value ? "bg-blue-50 text-blue-700" : ""}`}
                onClick={() => handleOptionSelect(option.value)}
              >
                {option.label}
              </li>
            ))}

            {/* No options message */}
            {options.length === 0 && (
              <li
                className={`px-4 py-2 text-gray-500 italic ${
                  isCompactView
                    ? "text-sm md:text-xs min-h-[40px] md:min-h-[36px] flex items-center"
                    : "text-sm"
                }`}
              >
                No {label.toLowerCase()} options available
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
