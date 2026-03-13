import { useState, useRef, useEffect } from "react";
import { IoFilterOutline } from "react-icons/io5";
import Button from "../common/Button";
import FilterDropdownButton, { FilterOption } from "./FilterDropdownButton";

interface FilterConfig {
  key: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}

interface ResponsiveFilterButtonProps {
  filters: FilterConfig[];
  activeFiltersCount: number;
  className?: string;
}

export default function ResponsiveFilterButton({
  filters,
  activeFiltersCount,
  className = "",
}: ResponsiveFilterButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearAllFilters = () => {
    filters.forEach((filter) => filter.onChange(""));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Mobile & Tablet Filter Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 h-[42px] flex-shrink-0 text-sm md:text-sm"
      >
        <IoFilterOutline className="w-4 h-4" />
        <span className="text-sm">Filters</span>
        {activeFiltersCount > 0 && (
          <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-1">
            {activeFiltersCount}
          </span>
        )}
      </Button>

      {/* Mobile & Tablet Filter Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-72 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg z-50 border">
          <div className="p-3 md:p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base md:text-sm font-medium">Filters</h3>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm md:text-xs text-primary hover:text-primary-dark"
                >
                  Clear All
                </button>
              )}
            </div>
            {/* Filter Options */}
            <div className="space-y-2 md:space-y-1.5">
              {filters.map((filter) => (
                <div key={filter.key}>
                  <label className="block text-sm md:text-xs font-medium text-gray-700 mb-1">
                    {filter.label}
                  </label>
                  <FilterDropdownButton
                    label={filter.label}
                    value={filter.value}
                    options={filter.options}
                    onChange={filter.onChange}
                    loading={filter.loading}
                    placeholder={filter.placeholder}
                    isMobileTablet={true}
                  />
                </div>
              ))}
            </div>
            {/* Apply Button */}
            <div className="pt-2 border-t">
              <Button
                variant="primary"
                onClick={() => setIsOpen(false)}
                className="w-full py-2 md:py-1.5 text-sm md:text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
