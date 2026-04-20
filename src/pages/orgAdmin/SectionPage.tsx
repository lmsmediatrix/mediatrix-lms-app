import { FaPlus } from "react-icons/fa";
import { FaFileExport } from "react-icons/fa6";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import {
  useAdminSections,
  useExportSectionToCsv,
} from "../../hooks/useSection";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import ExportModal from "../../components/orgAdmin/ExportModal";
import TableEmptyState from "../../components/common/TableEmptyState";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import { ISection } from "../../types/interfaces";
import { useCoursesForDropdown } from "../../hooks/useCourse";
import { useInstructorsForDropdown } from "../../hooks/useInstructor";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useDebounce } from "../../hooks/useDebounce";
import { FiList, FiToggleLeft, FiToggleRight, FiUsers } from "react-icons/fi";
import StatsCards from "../../components/common/StatsCards";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";

export default function SectionPage() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const [selectedCourse, setSelectedCourse] = useState(
    searchParams.get("course") || ""
  );
  const [selectedInstructor, setSelectedInstructor] = useState(
    searchParams.get("instructor") || ""
  );
  const [archiveStatus, setArchiveStatus] = useState<"only" | "none">(
    (searchParams.get("archiveStatus") as "only" | "none") || "none"
  );
  const [skipLimit, setSkipLimit] = useState({
    skip: Number(searchParams.get("page") || "1") - 1,
    limit: 10,
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const exportSection = useExportSectionToCsv();

  // Define dynamic terms
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const learnerTerm = getTerm("learner", orgType);
  const instructorTerm = getTerm("instructor", orgType);
  const pageTitle = `${sectionsTerm} Overview`;
  const pageDescription = `View and manage all ${sectionsTerm.toLowerCase()} in your organization.`;
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filters: Array<{ key: string; value: string }> = [];
  if (selectedCourse) {
    filters.push({ key: "course", value: selectedCourse });
  }
  if (selectedInstructor) {
    filters.push({ key: "instructor", value: selectedInstructor });
  }
  // Always include organization filter
  filters.push({
    key: "organizationId",
    value: currentUser.user.organization._id,
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useAdminSections({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    searchTerm: debouncedSearchTerm,
    filters,
    archiveStatus,
  });
  const isInitialSectionsLoading = isLoading && !data;

  const { data: coursesData } = useCoursesForDropdown({
    organizationId: currentUser.user.organization._id,
  });

  const { data: instructorsData } = useInstructorsForDropdown({
    organizationId: currentUser.user.organization._id,
  });

  const navigate = useNavigate();
  const { orgCode } = useParams();

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

  const handleCourseChange = (course: string) => {
    setSelectedCourse(course);
    setSkipLimit((prev) => ({ ...prev, skip: 0 }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (course) {
        newParams.set("course", course);
      } else {
        newParams.delete("course");
      }
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handleInstructorChange = (instructor: string) => {
    setSelectedInstructor(instructor);
    setSkipLimit((prev) => ({ ...prev, skip: 0 }));
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (instructor) {
        newParams.set("instructor", instructor);
      } else {
        newParams.delete("instructor");
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
      const newParams = new URLSearchParams(prev);
      newParams.set("page", String(newSkip + 1));
      return newParams;
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

  // Skeleton configuration for sections
  const sectionTableColumns = [
    { width: "20%" }, // Section Code
    { width: "20%" }, // Name
    { width: "20%" }, // Instructor
    { width: "25%" }, // Course
    { width: "15%" }, // Total Students
    { width: "10%", alignment: "center" as const }, // Actions
  ];

  const exportToCSV = (type: "all" | "current") => {
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportSection.mutateAsync(params);
      },
      mutationParams:
        type === "all"
          ? { limit: 1000, filters, archiveStatus }
          : { limit: skipLimit.limit, skip: skipLimit.skip, filters, archiveStatus },
      filenamePrefix: "1bislms-sections",
      toastMessages: {
        pending: `Exporting ${type} data to CSV...`,
        success: `Successfully exported ${type} data to CSV`,
        error: `Failed to export ${type} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  const sectionRows = useMemo(
    () => ((data?.sections || []) as ISection[]),
    [data?.sections],
  );

  const batchSummaryStats = useMemo(() => {
    const shownLearners = sectionRows.reduce(
      (total, section) => total + (section.totalStudent || 0),
      0,
    );
    const avgLearnersPerBatch =
      sectionRows.length > 0 ? shownLearners / sectionRows.length : 0;

    return [
      {
        title: `Total ${sectionsTerm}`,
        value: data?.pagination?.totalItems || 0,
        change:
          archiveStatus === "only"
            ? "Archived records view"
            : "Active records view",
        icon: <FiList className="text-xl" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        iconBgColor: "bg-blue-500",
        iconTextColor: "text-white",
      },
      {
        title: `Total ${learnerTerm}s (Shown)`,
        value: shownLearners,
        change: `${learnerTerm}s across visible ${sectionsTerm.toLowerCase()}`,
        icon: <FiUsers className="text-xl" />,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        iconBgColor: "bg-emerald-500",
        iconTextColor: "text-white",
      },
      {
        title: `${learnerTerm}s per ${sectionTerm}`,
        value: Number.isFinite(avgLearnersPerBatch)
          ? avgLearnersPerBatch.toFixed(1)
          : "0.0",
        change: `Average on current page`,
        icon: <FiUsers className="text-xl" />,
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        iconBgColor: "bg-amber-500",
        iconTextColor: "text-white",
      },
      {
        title: "Records Shown",
        value: sectionRows.length,
        change: `Page ${data?.pagination?.currentPage || 1} of ${
          data?.pagination?.totalPages || 1
        }`,
        icon: <FiList className="text-xl" />,
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-700",
        iconBgColor: "bg-indigo-500",
        iconTextColor: "text-white",
      },
    ];
  }, [
    archiveStatus,
    data?.pagination?.currentPage,
    data?.pagination?.totalItems,
    data?.pagination?.totalPages,
    learnerTerm,
    sectionRows,
    sectionTerm,
    sectionsTerm,
  ]);

  const tableGroups = useMemo(
    (): GroupedTableGroup<ISection>[] => [
      {
        key: "sections",
        title: sectionsTerm,
        rows: sectionRows,
        badgeText: `${sectionRows.length} total`,
      },
    ],
    [sectionRows, sectionsTerm],
  );

  const tableColumns = useMemo(
    (): GroupedTableColumn<ISection>[] => [
      {
        key: "code",
        label: `${sectionTerm} Code`,
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search code",
        sortAccessor: (row) => row.code || "",
        filterAccessor: (row) => row.code || "",
        className: "min-w-[180px]",
        render: (row) => <span className="font-semibold text-slate-900">{row.code}</span>,
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search name",
        filterValue: searchTerm,
        onFilterChange: handleSearchChange,
        sortAccessor: (row) => row.name || "",
        filterAccessor: (row) =>
          `${row.name || ""} ${row.code || ""} ${row.course?.title || ""} ${
            row.instructor
              ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
              : ""
          }`.trim(),
        className: "min-w-[220px]",
        render: (row) => <span className="text-slate-900">{row.name}</span>,
      },
      {
        key: "instructor",
        label: instructorTerm,
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: `All ${instructorTerm}s`,
        filterValue: selectedInstructor,
        onFilterChange: handleInstructorChange,
        filterOptions:
          instructorsData?.map((instructor: any) => ({
            value: instructor._id,
            label: `${instructor.firstName} ${instructor.lastName}`,
          })) || [],
        sortAccessor: (row) =>
          row.instructor
            ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
            : "",
        filterAccessor: (row) =>
          row.instructor
            ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
            : "",
        className: "min-w-[230px]",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {row.instructor
              ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
              : "N/A"}
          </span>
        ),
      },
      {
        key: "course",
        label: "Course",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Courses",
        filterValue: selectedCourse,
        onFilterChange: handleCourseChange,
        filterOptions:
          coursesData?.map((course: any) => ({
            value: course._id,
            label: course.title,
          })) || [],
        sortAccessor: (row) => row.course?.title || "",
        filterAccessor: (row) => row.course?.title || "",
        className: "min-w-[240px]",
        render: (row) => (
          <span className="text-sm text-slate-700">{row.course?.title || "N/A"}</span>
        ),
      },
      {
        key: "students",
        label: `Total ${learnerTerm}`,
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) => row.totalStudent || 0,
        filterAccessor: (row) => String(row.totalStudent || 0),
        className: "min-w-[180px]",
        render: (row) => (
          <div className="flex flex-col text-sm text-slate-700">
            <span>
              {row.totalStudent || 0} {learnerTerm.toLowerCase()}
              {(row.totalStudent || 0) !== 1 ? "s" : ""}
            </span>
            {row.maxStudents && (
              <span className="text-xs text-slate-500">Max: {row.maxStudents}</span>
            )}
          </div>
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
                onClick: () => navigate(`/${orgCode}/admin/section/${row.code}`),
              },
              {
                key: "update",
                label: "Update",
                onClick: () => navigate(`/${orgCode}/admin/section/${row.code}`),
                disabled: archiveStatus === "only",
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
    ],
    [
      archiveStatus,
      coursesData,
      instructorTerm,
      instructorsData,
      learnerTerm,
      navigate,
      orgCode,
      searchTerm,
      sectionTerm,
      selectedCourse,
      selectedInstructor,
      toggleArchiveStatus,
    ],
  );

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm md:text-base text-slate-600">
          {pageDescription}
        </p>
      </div>

      <div className="mt-6 mb-2">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            {sectionTerm} Summary
          </h2>
        </div>
        <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCards stats={batchSummaryStats} isLoading={isInitialSectionsLoading} />
        </div>
      </div>

      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-end">
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => navigate(`/${orgCode}/admin/section/new`)}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add {sectionTerm}</span>
            <span className="sm:hidden">Create</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsExportModalOpen(true)}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FaFileExport className="size-4" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>

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

      {isInitialSectionsLoading ? (
        <TableSkeletonClean columns={sectionTableColumns} rows={10} />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error loading {sectionsTerm.toLowerCase()}
        </div>
      ) : sectionRows.length === 0 &&
        !(debouncedSearchTerm || selectedCourse || selectedInstructor || archiveStatus !== "none") ? (
        <TableEmptyState
          title={`Create Your First ${sectionTerm}`}
          description={`Start by creating a ${sectionTerm.toLowerCase()}. You'll need courses, ${instructorTerm.toLowerCase()}s, and ${learnerTerm.toLowerCase()}s first.`}
          primaryActionLabel={`Create ${sectionTerm}`}
          primaryActionPath={`/${orgCode}/admin/section/new`}
          hidePrimaryAction
          colSpan={6}
          type="section"
          isFiltered={false}
        />
      ) : (
        <div className={`transition-opacity duration-200 ${isFetching ? "opacity-70" : "opacity-100"}`}>
          <GroupedDataTable
            groups={tableGroups}
            columns={tableColumns}
            rowKey={(row) => row._id}
            tableMinWidthClassName="min-w-[1220px]"
            showPagination={false}
            cardless
            showGroupHeader={false}
            onRowClick={(row) => navigate(`/${orgCode}/admin/section/${row.code}`)}
            emptyFilteredText={`No matching ${sectionsTerm.toLowerCase()} found.`}
          />
        </div>
      )}

      {/* Pagination */}
      {!isInitialSectionsLoading && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            {data?.pagination?.totalItems || 0} result
            {data?.pagination?.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!data?.pagination?.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !data?.pagination?.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
              Page {data?.pagination?.currentPage} of{" "}
              {data?.pagination?.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!data?.pagination?.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !data?.pagination?.hasNextPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={exportToCSV}
      />
    </div>
  );
}
