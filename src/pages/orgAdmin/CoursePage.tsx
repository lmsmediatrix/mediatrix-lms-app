import Button from "../../components/common/Button";
import { FaPlus } from "react-icons/fa";
import {
  FiBookOpen,
  FiCheckCircle,
  FiDownload,
  FiEdit3,
  FiList,
  FiToggleLeft,
  FiToggleRight,
  FiUpload,
} from "react-icons/fi";
import { useSearchParams } from "react-router-dom";
import UpsertCourseModal from "../../components/orgAdmin/UpsertCourseModal";
import DeleteCourseModal from "../../components/orgAdmin/DeleteCourseModal";
import { useCourses, useExportCourseToCsv } from "../../hooks/useCourse";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import ExportModal from "../../components/orgAdmin/ExportModal";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import ViewCourseModal from "../../components/orgAdmin/ViewCourseModal";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import { useCategoriesForDropdown } from "../../hooks/useCategory";
import { useDebounce } from "../../hooks/useDebounce";
import StatsCards from "../../components/common/StatsCards";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import { toast } from "react-toastify";
import { PanelLeft } from "@/components/animate-ui/icons/panel-left";

interface CourseToDelete {
  id: string;
  title: string;
}

type CourseRow = {
  _id: string;
  code: string;
  title: string;
  category?: { _id?: string; name?: string };
  level: string;
  status: string;
};

const STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advance", label: "Advance" },
];

export default function CoursePage() {
  const { currentUser } = useAuth();
  const isCorporate = currentUser.user.organization.type === "corporate";
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    level: searchParams.get("level") || "",
    category: isCorporate ? "" : searchParams.get("category") || "",
  });
  const [archiveStatus, setArchiveStatus] = useState<"only" | "none">(
    (searchParams.get("archiveStatus") as "only" | "none") || "none"
  );
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const [skipLimit, setSkipLimit] = useState({
    skip: Number(searchParams.get("page") || "1") - 1,
    limit: 10,
  });
  const [courseToDelete, setCourseToDelete] = useState<CourseToDelete | null>(
    null
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

  const filtersArray = Object.entries(filters)
    .filter(
      ([key, value]) => value !== "" && (!isCorporate || key !== "category")
    )
    .map(([key, value]) => ({ key, value }));

  const { data, isLoading, isError } = useCourses({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    filters: filtersArray.length > 0 ? filtersArray : undefined,
    searchTerm: debouncedSearchTerm,
    organizationId: currentUser.user.organization._id,
    archiveStatus,
  });

  const { data: categoriesData } = useCategoriesForDropdown({
    organizationId: currentUser.user.organization._id,
    enabled: !isCorporate,
  });

  const exportCourse = useExportCourseToCsv();

  const modal = searchParams.get("modal");

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
    if (isCorporate && filterType === "category") {
      return;
    }
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    setSkipLimit((prev) => ({ ...prev, skip: 0 }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set(filterType, value);
      } else {
        newParams.delete(filterType);
      }
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setSkipLimit((prev) => ({ ...prev, skip: 0 }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (search) {
        newParams.set("search", search);
      } else {
        newParams.delete("search");
      }
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handlePageChange = (newSkip: number) => {
    setSkipLimit((prev) => ({
      ...prev,
      skip: newSkip,
    }));
    setSearchParams((prev) => {
      prev.set("page", String(newSkip + 1));
      return prev;
    });
  };

  const toggleArchiveStatus = () => {
    const newStatus = archiveStatus === "only" ? "none" : "only";
    setArchiveStatus(newStatus);
    setSkipLimit((prev) => ({ ...prev, skip: 0 }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("archiveStatus", newStatus);
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handleDeleteClick = (course: any) => {
    setCourseToDelete({
      id: course._id,
      title: course.title,
    });
  };

  const exportToCSV = (type: "all" | "current") => {
    const filter =
      filtersArray.length > 0
        ? filtersArray[0]
        : { key: "role", value: "student" };
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportCourse.mutateAsync(params);
      },
      mutationParams: {
        limit: type === "all" ? 1000 : skipLimit.limit,
        skip: type === "all" ? undefined : skipLimit.skip,
        filter,
      },
      filenamePrefix: "1bislms-courses",
      toastMessages: {
        pending: `Exporting ${type} data to CSV...`,
        success: `Successfully exported ${type} data to CSV`,
        error: `Failed to export ${type} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  const courseTableColumns = [
    { width: "120px" }, // Course Code
    { width: "300px" }, // Course
    ...(!isCorporate ? [{ width: "150px" }] : []), // Category (school only)
    { width: "120px" }, // Level
    { width: "120px" }, // Status
    { width: "140px", alignment: "center" as const }, // Actions
  ];

  const courseRows = useMemo(
    () => ((data?.courses || []) as CourseRow[]),
    [data?.courses],
  );

  const courseSummaryStats = useMemo(
    () => [
      {
        title: "Total Courses",
        value: data?.pagination?.totalItems || 0,
        change: archiveStatus === "only" ? "Archived records view" : "Active records view",
        icon: <FiBookOpen className="text-xl" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-600",
        iconBgColor: "bg-blue-500",
        iconTextColor: "text-white",
      },
      {
        title: "Published (Shown)",
        value: courseRows.filter((course) => course.status === "published").length,
        change: "Published courses on current page",
        icon: <FiCheckCircle className="text-xl" />,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        iconBgColor: "bg-emerald-500",
        iconTextColor: "text-white",
      },
      {
        title: "Draft (Shown)",
        value: courseRows.filter((course) => course.status === "draft").length,
        change: "Draft courses on current page",
        icon: <FiEdit3 className="text-xl" />,
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        iconBgColor: "bg-amber-500",
        iconTextColor: "text-white",
      },
      {
        title: "Records Shown",
        value: courseRows.length,
        change: `Page ${data?.pagination?.currentPage || 1} of ${data?.pagination?.totalPages || 1}`,
        icon: <FiList className="text-xl" />,
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-700",
        iconBgColor: "bg-indigo-500",
        iconTextColor: "text-white",
      },
    ],
    [archiveStatus, courseRows, data?.pagination?.currentPage, data?.pagination?.totalItems, data?.pagination?.totalPages],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<CourseRow>[] => [
      {
        key: "courses",
        title: "Courses",
        rows: courseRows,
        badgeText: `${courseRows.length} total`,
      },
    ],
    [courseRows],
  );

  const tableColumns = useMemo((): GroupedTableColumn<CourseRow>[] => {
    const baseColumns: GroupedTableColumn<CourseRow>[] = [
      {
        key: "code",
        label: "Course Code",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search code",
        sortAccessor: (row) => row.code || "",
        filterAccessor: (row) => row.code || "",
        className: "min-w-[140px] hidden md:table-cell",
        render: (row) => <span className="font-semibold text-slate-900">{row.code}</span>,
      },
      {
        key: "course",
        label: "Course",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search course",
        filterValue: searchTerm,
        onFilterChange: handleSearchChange,
        sortAccessor: (row) => row.title || "",
        filterAccessor: (row) =>
          `${row.title || ""} ${row.code || ""} ${row.category?.name || ""}`.trim(),
        className: "min-w-[280px]",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{row.title}</span>
            <div className="md:hidden text-xs text-slate-500 mt-1 space-y-1">
              <div>Code: {row.code}</div>
              {!isCorporate && <div>Category: {row.category?.name || "N/A"}</div>}
              <div>
                Level:{" "}
                {row.level
                  ? row.level.charAt(0).toUpperCase() + row.level.slice(1)
                  : "N/A"}
              </div>
            </div>
          </div>
        ),
      },
      ...(!isCorporate
        ? [
            {
              key: "category",
              label: "Category",
              sortable: true,
              filterable: true,
              filterVariant: "select",
              filterSelectAllLabel: "All Categories",
              filterValue: filters.category,
              onFilterChange: (value: string) => handleFilterChange("category", value),
              filterOptions:
                categoriesData?.map((category: any) => ({
                  value: category._id,
                  label: category.name,
                })) || [],
              sortAccessor: (row: CourseRow) => row.category?.name || "",
              filterAccessor: (row: CourseRow) => row.category?.name || "",
              className: "min-w-[180px] hidden md:table-cell",
              render: (row: CourseRow) => (
                <span className="text-sm text-slate-600">{row.category?.name || "N/A"}</span>
              ),
            } as GroupedTableColumn<CourseRow>,
          ]
        : []),
      {
        key: "level",
        label: "Level",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Levels",
        filterValue: filters.level,
        onFilterChange: (value: string) => handleFilterChange("level", value),
        filterOptions: LEVEL_OPTIONS,
        sortAccessor: (row) => row.level || "",
        filterAccessor: (row) => row.level || "",
        className: "min-w-[130px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-600">
            {row.level ? row.level.charAt(0).toUpperCase() + row.level.slice(1) : "N/A"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterValue: filters.status,
        onFilterChange: (value: string) => handleFilterChange("status", value),
        filterOptions: STATUS_OPTIONS,
        sortAccessor: (row) => row.status || "",
        filterAccessor: (row) => row.status || "",
        className: "min-w-[130px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.status === "published"
                ? "bg-green-100 text-green-800"
                : row.status === "draft"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {row.status
              ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
              : "N/A"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[120px]",
        render: (row) => (
          <ActionMenuButton
            buttonClassName="!px-2 !py-1.5"
            items={[
              {
                key: "view",
                label: "View",
                onClick: () => setSearchParams({ modal: "view-course", id: row._id }),
              },
              {
                key: "update",
                label: "Update",
                onClick: () => setSearchParams({ modal: "edit-course", id: row._id }),
                disabled: archiveStatus === "only",
              },
              {
                key: "delete",
                label: "Archive",
                onClick: () => handleDeleteClick(row),
                disabled: archiveStatus === "only",
                danger: true,
              },
              {
                key: "archive-toggle",
                label: archiveStatus === "only" ? "Show Active" : "Show Archived",
                icon:
                  archiveStatus === "only" ? (
                    <FiToggleLeft className="size-4" />
                  ) : (
                    <FiToggleRight className="size-4" />
                  ),
                onClick: toggleArchiveStatus,
              },
            ]}
          />
        ),
      },
    ];

    return baseColumns;
  }, [
    archiveStatus,
    categoriesData,
    filters.category,
    filters.level,
    filters.status,
    isCorporate,
    searchTerm,
    setSearchParams,
    toggleArchiveStatus,
  ]);

  const hasActiveFilters = Boolean(
    debouncedSearchTerm ||
      filters.status ||
      filters.level ||
      (!isCorporate && filters.category) ||
      archiveStatus !== "none",
  );

  return (
    <div className=" pt-14 pb-6 px-6 lg:p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Courses Overview
        </h1>
        <HoverHelpTooltip
          text="View and manage all courses linked to your sections and learning tracks."
          
          className="shrink-0"
        />
      </div>

      <div className="mt-6 mb-2">
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCards stats={courseSummaryStats} isLoading={isLoading} />
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-end">
        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0 flex-wrap md:flex-nowrap md:items-center">
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-course" })}
            className="whitespace-nowrap text-sm h-[42px] flex-1 md:flex-initial"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add Course</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <div
            className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-out ${
              isImportExportOpen
                ? "max-w-[520px] opacity-100 translate-x-0"
                : "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
            }`}
          >
            <Button
              variant="outline"
              onClick={() => toast.info("Bulk import for courses is coming soon.")}
              className={`whitespace-nowrap text-sm h-[42px] transition-all duration-300 ${
                isImportExportOpen ? "scale-100" : "scale-95"
              }`}
            >
              <FiUpload className="size-4" />
              <span>Import</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(true)}
              className={`whitespace-nowrap text-sm h-[42px] transition-all duration-300 ${
                isImportExportOpen ? "scale-100" : "scale-95"
              }`}
            >
              <FiDownload className="size-4" />
              <span>Export</span>
            </Button>
          </div>
          <Button
            variant={isImportExportOpen ? "outline" : "primary"}
            onClick={() => setIsImportExportOpen((prev) => !prev)}
            className="text-sm h-[42px] !px-4 md:!px-4"
          >
            <PanelLeft
              size={15}
              animate={isImportExportOpen ? "default" : false}
              animateOnHover
            />
            <span className="sr-only">Toggle import and export actions</span>
          </Button>
          {/* Archive Status Toggle Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleArchiveStatus}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3E5B93] focus:ring-offset-2 ${
                archiveStatus === "only" ? "bg-gray-200" : "bg-primary"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  archiveStatus === "only" ? "translate-x-1" : "translate-x-6"
                }`}
              />
            </button>
            <span className="text-sm text-gray-600 hidden lg:inline whitespace-nowrap">
              {archiveStatus === "only" ? "Archived" : "Active"}
            </span>
            <span className="text-sm text-gray-600 lg:hidden">
              {archiveStatus === "only" ? "Archived" : "Active"}
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeletonClean columns={courseTableColumns} rows={10} />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error loading courses
        </div>
      ) : courseRows.length === 0 && !hasActiveFilters ? (
        <TableEmptyState
          title="Create Your First Course"
          description="Start by creating a course. You'll need courses before you can create sections."
          colSpan={isCorporate ? 5 : 6}
          type="course"
          isFiltered={false}
        />
      ) : (
        <GroupedDataTable
          groups={tableGroups}
          columns={tableColumns}
          rowKey={(row) => row._id}
          tableMinWidthClassName={isCorporate ? "min-w-[980px]" : "min-w-[1120px]"}
          showPagination={false}
          cardless
          showGroupHeader={false}
          onRowClick={(row) => setSearchParams({ modal: "view-course", id: row._id })}
          emptyFilteredText="No matching courses found."
        />
      )}

      {/* Pagination */}
      {!isLoading && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            {data?.pagination.totalItems || 0} result
            {data?.pagination.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!data?.pagination.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !data?.pagination.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
              Page {data?.pagination.currentPage} of{" "}
              {data?.pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!data?.pagination.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !data?.pagination.hasNextPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {(modal === "create-course" || modal === "edit-course") && (
        <UpsertCourseModal isOpen={true} onClose={() => setSearchParams({})} />
      )}
      {modal === "view-course" && (
        <ViewCourseModal isOpen={true} onClose={() => setSearchParams({})} />
      )}
      {courseToDelete && (
        <DeleteCourseModal
          isOpen={true}
          onClose={() => setCourseToDelete(null)}
          courseId={courseToDelete.id}
          courseTitle={courseToDelete.title}
        />
      )}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={exportToCSV}
      />
    </div>
  );
}
