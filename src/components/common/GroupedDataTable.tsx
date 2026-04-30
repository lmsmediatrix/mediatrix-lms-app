import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ArrowDownUpIcon } from "@/components/ui/arrow-down-up-icon";

type SortDirection = "asc" | "desc";

interface GroupedTableFilterOption {
  value: string;
  label: string;
}

interface TableFilterSelectProps {
  value: string;
  options: GroupedTableFilterOption[];
  placeholder: string;
  onChange: (value: string) => void;
}

function TableFilterSelect({
  value,
  options,
  placeholder,
  onChange,
}: TableFilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    width: number;
  }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
      });
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-all duration-150 hover:border-slate-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{displayValue}</span>
        <svg
          className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[9999] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            style={menuStyle}
          >
            <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                    value === ""
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {placeholder}
                </button>
              </li>
              {options.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                      value === option.value
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}

export interface GroupedTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterPlaceholder?: string;
  filterVariant?: "text" | "select";
  filterOptions?: GroupedTableFilterOption[];
  filterSelectAllLabel?: string;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  sortAccessor?: (row: T) => string | number;
  filterAccessor?: (row: T) => string;
  className?: string;
  align?: "left" | "right";
  render: (row: T) => React.ReactNode;
}

export interface GroupedTableGroup<T> {
  key: string;
  title: string;
  rows: T[];
  badgeText?: string;
}

interface GroupedDataTableProps<T> {
  groups: GroupedTableGroup<T>[];
  columns: GroupedTableColumn<T>[];
  rowKey: (row: T, index: number) => string;
  pageSize?: number;
  showPagination?: boolean;
  showColumnFilters?: boolean;
  emptyFilteredText?: string;
  tableMinWidthClassName?: string;
  onRowClick?: (row: T) => void;
  cardless?: boolean;
  showGroupHeader?: boolean;
  collapsibleGroups?: boolean;
  defaultGroupsCollapsed?: boolean;
  toolbarRight?: React.ReactNode;
  onVisibleRowsChange?: (rowsByGroup: Record<string, T[]>) => void;
}

export default function GroupedDataTable<T extends object>({
  groups,
  columns,
  rowKey,
  pageSize = 5,
  showPagination = true,
  showColumnFilters = true,
  emptyFilteredText = "No matching rows found.",
  tableMinWidthClassName = "min-w-[980px]",
  onRowClick,
  cardless = false,
  showGroupHeader = true,
  collapsibleGroups = false,
  defaultGroupsCollapsed = false,
  toolbarRight,
  onVisibleRowsChange,
}: GroupedDataTableProps<T>) {
  const [areFiltersVisible, setAreFiltersVisible] = useState(showColumnFilters);

  useEffect(() => {
    if (!showColumnFilters) {
      setAreFiltersVisible(false);
      return;
    }
    setAreFiltersVisible(true);
  }, [showColumnFilters]);

  const triggerRowClick = (
    row: T,
    event?: ReactMouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>,
  ) => {
    if (!onRowClick) return;

    const target = event?.target as HTMLElement | null;
    if (
      target?.closest(
        "button, a, input, select, textarea, [contenteditable='true'], [data-row-click-stop='true']",
      )
    ) {
      return;
    }

    onRowClick(row);
  };

  const firstSortableColumn = useMemo(
    () => columns.find((c) => c.sortable)?.key || columns[0]?.key || "",
    [columns],
  );

  const [pageByGroup, setPageByGroup] = useState<Record<string, number>>({});
  const [sortByGroup, setSortByGroup] = useState<
    Record<string, { key: string; direction: SortDirection }>
  >({});
  const [filtersByGroup, setFiltersByGroup] = useState<
    Record<string, Record<string, string>>
  >({});
  const [collapsedByGroup, setCollapsedByGroup] = useState<
    Record<string, boolean>
  >({});
  const visibleRowsByGroupRef = useRef<Record<string, T[]>>({});

  useEffect(() => {
    setCollapsedByGroup((prev) => {
      const next: Record<string, boolean> = {};
      groups.forEach((group) => {
        next[group.key] = prev[group.key] ?? defaultGroupsCollapsed;
      });
      return next;
    });
  }, [groups, defaultGroupsCollapsed]);

  useEffect(() => {
    if (!onVisibleRowsChange) return;
    onVisibleRowsChange(visibleRowsByGroupRef.current);
  }, [
    onVisibleRowsChange,
    groups,
    columns,
    pageByGroup,
    sortByGroup,
    filtersByGroup,
    showPagination,
    pageSize,
    showColumnFilters,
    areFiltersVisible,
  ]);

  const getSortState = (groupKey: string) =>
    sortByGroup[groupKey] || {
      key: firstSortableColumn,
      direction: "asc" as SortDirection,
    };

  const getFiltersState = (groupKey: string) => filtersByGroup[groupKey] || {};

  const toggleSort = (groupKey: string, key: string) => {
    setSortByGroup((prev) => {
      const current = prev[groupKey] || {
        key: firstSortableColumn,
        direction: "asc" as SortDirection,
      };
      if (current.key === key) {
        return {
          ...prev,
          [groupKey]: {
            key,
            direction: current.direction === "asc" ? "desc" : "asc",
          },
        };
      }
      return {
        ...prev,
        [groupKey]: { key, direction: "asc" },
      };
    });
    setPageByGroup((prev) => ({ ...prev, [groupKey]: 1 }));
  };

  const updateFilter = (groupKey: string, columnKey: string, value: string) => {
    setFiltersByGroup((prev) => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || {}),
        [columnKey]: value,
      },
    }));
    setPageByGroup((prev) => ({ ...prev, [groupKey]: 1 }));
  };

  const getSortIndicator = (
    activeKey: string,
    activeDirection: SortDirection,
    targetKey: string,
  ) => {
    const isActive = activeKey === targetKey;
    const isAsc = isActive && activeDirection === "asc";
    const isDesc = isActive && activeDirection === "desc";
    const direction = isAsc ? "asc" : isDesc ? "desc" : null;

    return (
      <ArrowDownUpIcon
        size={14}
        className={cn(
          "text-slate-400 transition-transform duration-200",
          direction === "desc" && "rotate-180",
          direction && "text-slate-700",
        )}
      />
    );
  };

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const sortState = getSortState(group.key);
        const groupFilters = getFiltersState(group.key);
        const isCollapsed = collapsibleGroups
          ? Boolean(collapsedByGroup[group.key])
          : false;

        const filteredRows = showColumnFilters
          ? group.rows.filter((row) =>
              columns.every((column) => {
                if (!column.filterable) return true;
                if (column.onFilterChange && column.filterValue !== undefined) {
                  return true;
                }
                const filterValue = (
                  column.filterValue ??
                  groupFilters[column.key] ??
                  ""
                )
                  .trim()
                  .toLowerCase();
                if (!filterValue) return true;

                const accessor = column.filterAccessor
                  ? column.filterAccessor(row)
                  : String((row as Record<string, unknown>)[column.key] ?? "");

                const normalizedAccessor = accessor.toLowerCase();
                if (column.filterVariant === "select") {
                  return normalizedAccessor === filterValue;
                }

                return normalizedAccessor.includes(filterValue);
              }),
            )
          : group.rows;

        const sortedRows = [...filteredRows].sort((a, b) => {
          const column = columns.find((c) => c.key === sortState.key);
          if (!column || !column.sortable) return 0;

          const aValue = column.sortAccessor
            ? column.sortAccessor(a)
            : (a as Record<string, unknown>)[column.key];
          const bValue = column.sortAccessor
            ? column.sortAccessor(b)
            : (b as Record<string, unknown>)[column.key];

          let comparison = 0;
          if (typeof aValue === "number" && typeof bValue === "number") {
            comparison = aValue - bValue;
          } else {
            comparison = String(aValue ?? "").localeCompare(
              String(bValue ?? ""),
              undefined,
              {
                sensitivity: "base",
              },
            );
          }

          return sortState.direction === "asc" ? comparison : -comparison;
        });

        const requestedPage = pageByGroup[group.key] || 1;
        const totalPages = showPagination
          ? Math.max(1, Math.ceil(sortedRows.length / pageSize))
          : 1;
        const currentPage = showPagination
          ? Math.min(requestedPage, totalPages)
          : 1;
        const pageStartIndex = showPagination
          ? (currentPage - 1) * pageSize
          : 0;
        const pagedRows = showPagination
          ? sortedRows.slice(pageStartIndex, pageStartIndex + pageSize)
          : sortedRows;
        visibleRowsByGroupRef.current[group.key] = pagedRows;

        return (
          <div
            key={group.key}
            className={
              cardless
                ? "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)]"
                : "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_35px_-22px_rgba(15,23,42,0.45)]"
            }
          >
            {(showColumnFilters || toolbarRight) && (
              <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-3 flex items-center justify-between gap-3">
                {showColumnFilters ? (
                  <button
                    type="button"
                    onClick={() => setAreFiltersVisible((prev) => !prev)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    <svg
                      className="h-4 w-4 text-slate-500"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 5H17M6 10H14M8 15H12"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {areFiltersVisible ? "Hide Filters" : "Show Filters"}
                  </button>
                ) : (
                  <div />
                )}
                {toolbarRight ? <div className="min-w-0">{toolbarRight}</div> : null}
              </div>
            )}

            {showGroupHeader && (
              <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                {collapsibleGroups ? (
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-3 text-left"
                    onClick={() =>
                      setCollapsedByGroup((prev) => ({
                        ...prev,
                        [group.key]: !isCollapsed,
                      }))
                    }
                    aria-expanded={!isCollapsed}
                    aria-controls={`group-content-${group.key}`}
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {group.title}
                    </span>
                    <span className="flex items-center gap-2">
                      {group.badgeText && (
                        <span
                          className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                          style={{
                            color:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                            backgroundColor:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                            borderColor:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                          }}
                        >
                          {group.badgeText}
                        </span>
                      )}
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
                        aria-hidden="true"
                      >
                        {isCollapsed ? "\u25be" : "\u25b4"}
                      </span>
                    </span>
                  </button>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-gray-800">
                      {group.title}
                    </span>
                    {group.badgeText && (
                      <span
                        className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                        style={{
                          color:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                          backgroundColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                          borderColor:
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                        }}
                      >
                        {group.badgeText}
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {!isCollapsed && (
              <div
                id={`group-content-${group.key}`}
                className="bg-white overflow-x-auto"
              >
                <table className={`w-full border-collapse text-sm ${tableMinWidthClassName}`}>
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {columns.map((column) => {
                        const alignClass =
                          column.align === "right" ? "text-right" : "text-left";
                        return (
                            <th
                              key={column.key}
                              className={`px-5 py-3 text-sm font-semibold text-slate-600 ${alignClass} ${column.className || ""}`}
                            >
                              {column.sortable ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSort(group.key, column.key)
                                  }
                                  className="inline-flex h-5 items-center gap-1.5 leading-none hover:text-slate-800"
                                >
                                  {column.label}
                                  <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center leading-none">
                                    {getSortIndicator(
                                      sortState.key,
                                      sortState.direction,
                                    column.key,
                                  )}
                                </span>
                              </button>
                            ) : (
                              <span className="inline-flex h-5 items-center leading-none">
                                {column.label}
                              </span>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                    {showColumnFilters && areFiltersVisible && (
                      <tr className="border-b border-slate-100 bg-white">
                        {columns.map((column) => {
                          const alignClass =
                            column.align === "right"
                              ? "text-right"
                              : "text-left";
                          return (
                            <th
                              key={`${column.key}-search`}
                              className={`px-5 py-2 ${alignClass}`}
                            >
                              {column.filterable ? (
                                column.filterVariant === "select" ? (
                                  <TableFilterSelect
                                    value={
                                      column.filterValue ??
                                      groupFilters[column.key] ??
                                      ""
                                    }
                                    options={column.filterOptions || []}
                                    placeholder={
                                      column.filterSelectAllLabel ||
                                      column.filterPlaceholder ||
                                      `All ${column.label}`
                                    }
                                    onChange={(nextValue) => {
                                      if (column.onFilterChange) {
                                        column.onFilterChange(nextValue);
                                      }
                                      if (column.filterValue === undefined) {
                                        updateFilter(
                                          group.key,
                                          column.key,
                                          nextValue,
                                        );
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="relative">
                                    <svg
                                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                      viewBox="0 0 20 20"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      aria-hidden="true"
                                    >
                                      <circle
                                        cx="9"
                                        cy="9"
                                        r="6"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                      />
                                      <path
                                        d="M13.5 13.5L17 17"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <input
                                      type="text"
                                      value={
                                        column.filterValue ??
                                        groupFilters[column.key] ??
                                        ""
                                      }
                                      onChange={(e) => {
                                        const nextValue = e.target.value;
                                        if (column.onFilterChange) {
                                          column.onFilterChange(nextValue);
                                        }
                                        if (column.filterValue === undefined) {
                                          updateFilter(
                                            group.key,
                                            column.key,
                                            nextValue,
                                          );
                                        }
                                      }}
                                      placeholder={
                                        column.filterPlaceholder ||
                                        `Search ${column.label.toLowerCase()}`
                                      }
                                      className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                  </div>
                                )
                              ) : null}
                            </th>
                          );
                        })}
                      </tr>
                    )}
                  </thead>

                  <tbody
                    className="divide-y divide-slate-100"
                  >
                    {pagedRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-5 py-8 text-center text-sm text-gray-500"
                        >
                          {emptyFilteredText}
                        </td>
                      </tr>
                    ) : (
                      pagedRows.map((row, index) => (
                        <tr
                          key={rowKey(row, index)}
                          className={`bg-white transition-colors duration-150 hover:bg-slate-50/80 ${onRowClick ? "cursor-pointer" : ""}`}
                          onClick={(event) => triggerRowClick(row, event)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              triggerRowClick(row, event);
                            }
                          }}
                          tabIndex={onRowClick ? 0 : undefined}
                        >
                          {columns.map((column) => {
                            const alignClass =
                              column.align === "right"
                                ? "text-right"
                                : "text-left";
                            return (
                              <td
                                key={`${rowKey(row, index)}-${column.key}`}
                                className={`px-5 py-4 ${alignClass} ${column.className || ""}`}
                              >
                                {column.render(row)}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {showPagination && !isCollapsed && (
              <div className="bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  {sortedRows.length === 0
                    ? 0
                    : `${pageStartIndex + 1}-${Math.min(
                        pageStartIndex + pageSize,
                        sortedRows.length,
                      )}`}{" "}
                  of {sortedRows.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPageByGroup((prev) => ({
                        ...prev,
                        [group.key]: Math.max(1, currentPage - 1),
                      }))
                    }
                    disabled={currentPage <= 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600 min-w-[70px] text-center">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPageByGroup((prev) => ({
                        ...prev,
                        [group.key]: Math.min(totalPages, currentPage + 1),
                      }))
                    }
                    disabled={currentPage >= totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
