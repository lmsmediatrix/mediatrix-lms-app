import { useMemo, useState } from "react";

type SortDirection = "asc" | "desc";

export interface GroupedTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterPlaceholder?: string;
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
  emptyFilteredText?: string;
  tableMinWidthClassName?: string;
  onRowClick?: (row: T) => void;
}

export default function GroupedDataTable<T extends object>({
  groups,
  columns,
  rowKey,
  pageSize = 5,
  emptyFilteredText = "No matching rows found.",
  tableMinWidthClassName = "min-w-[980px]",
  onRowClick,
}: GroupedDataTableProps<T>) {
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

  const getSortState = (groupKey: string) =>
    sortByGroup[groupKey] || { key: firstSortableColumn, direction: "asc" as SortDirection };

  const getFiltersState = (groupKey: string) => filtersByGroup[groupKey] || {};

  const toggleSort = (groupKey: string, key: string) => {
    setSortByGroup((prev) => {
      const current = prev[groupKey] || { key: firstSortableColumn, direction: "asc" as SortDirection };
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
    if (activeKey !== targetKey) return "\u2195";
    return activeDirection === "asc" ? "\u2191" : "\u2193";
  };

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const sortState = getSortState(group.key);
        const groupFilters = getFiltersState(group.key);

        const filteredRows = group.rows.filter((row) =>
          columns.every((column) => {
            if (!column.filterable) return true;
            const filterValue = (groupFilters[column.key] || "").trim().toLowerCase();
            if (!filterValue) return true;

            const accessor = column.filterAccessor
              ? column.filterAccessor(row)
              : String((row as Record<string, unknown>)[column.key] ?? "");

            return accessor.toLowerCase().includes(filterValue);
          }),
        );

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
            comparison = String(aValue ?? "").localeCompare(String(bValue ?? ""), undefined, {
              sensitivity: "base",
            });
          }

          return sortState.direction === "asc" ? comparison : -comparison;
        });

        const requestedPage = pageByGroup[group.key] || 1;
        const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
        const currentPage = Math.min(requestedPage, totalPages);
        const pageStartIndex = (currentPage - 1) * pageSize;
        const pagedRows = sortedRows.slice(pageStartIndex, pageStartIndex + pageSize);

        return (
          <div
            key={group.key}
            className="rounded-2xl border shadow-sm overflow-hidden"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)",
              borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
            }}
          >
            <div
              className="px-5 py-3 border-b flex items-center justify-between"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
              }}
            >
              <span className="text-sm font-semibold text-gray-800">{group.title}</span>
              {group.badgeText && (
                <span
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                  style={{
                    color: "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                    backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                    borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                  }}
                >
                  {group.badgeText}
                </span>
              )}
            </div>

            <div className="bg-white overflow-x-auto">
              <table className={`w-full ${tableMinWidthClassName}`}>
                <thead>
                  <tr
                    className="border-b"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 5%, white 95%)",
                      borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                    }}
                  >
                    {columns.map((column) => {
                      const alignClass = column.align === "right" ? "text-right" : "text-left";
                      return (
                        <th
                          key={column.key}
                          className={`px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider ${alignClass} ${column.className || ""}`}
                        >
                          {column.sortable ? (
                            <button
                              type="button"
                              onClick={() => toggleSort(group.key, column.key)}
                              className="inline-flex items-center gap-1 hover:text-gray-700"
                            >
                              {column.label}
                              <span className="text-[10px]">
                                {getSortIndicator(
                                  sortState.key,
                                  sortState.direction,
                                  column.key,
                                )}
                              </span>
                            </button>
                          ) : (
                            column.label
                          )}
                        </th>
                      );
                    })}
                  </tr>
                  <tr
                    className="border-b"
                    style={{
                      borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                      backgroundColor: "white",
                    }}
                  >
                    {columns.map((column) => {
                      const alignClass = column.align === "right" ? "text-right" : "text-left";
                      return (
                        <th key={`${column.key}-search`} className={`px-5 py-2 ${alignClass}`}>
                          {column.filterable ? (
                            <input
                              type="text"
                              value={groupFilters[column.key] || ""}
                              onChange={(e) =>
                                updateFilter(group.key, column.key, e.target.value)
                              }
                              placeholder={column.filterPlaceholder || `Search ${column.label.toLowerCase()}`}
                              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          ) : null}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody
                  className="divide-y"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                  }}
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
                        className={`transition-colors hover:brightness-[0.98] ${onRowClick ? "cursor-pointer" : ""}`}
                        style={{ backgroundColor: "white" }}
                        onClick={() => onRowClick?.(row)}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            "white")
                        }
                      >
                        {columns.map((column) => {
                          const alignClass = column.align === "right" ? "text-right" : "text-left";
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
          </div>
        );
      })}
    </div>
  );
}
