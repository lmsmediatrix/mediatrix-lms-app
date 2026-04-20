import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import UpsertInstructorModal from "../../components/instructor/UpsertInstructorModal";
import { PlusIcon } from "@/components/ui/plus-icon";

import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { dateFilter, IInstructor } from "../../types/interfaces";
import { useMemo, useState, Suspense } from "react";
import BulkImportInstructorModal from "../../components/instructor/BulkImportInstructorModal";
import StatsCards from "../../components/common/StatsCards";
import { generateStats } from "../../components/common/statUtils";
import { CgChevronDown } from "react-icons/cg";
import {
  useExportInstructorToCsv,
  useSearchInstructors,
} from "../../hooks/useInstructor";
import { useGetUserMetrics } from "../../hooks/useUser";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import DeleteInstructorModal from "../../components/instructor/DeleteInstructorModal";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import ExportModal from "../../components/orgAdmin/ExportModal";
import TableEmptyState from "../../components/common/TableEmptyState";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { MdLockReset } from "react-icons/md";
import { FiToggleLeft, FiToggleRight } from "react-icons/fi";
import ResetUserPassword from "../../components/ResetUserPassword";
import { useDebounce } from "../../hooks/useDebounce";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";

const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "probationary",
  "internship",
  "freelance",
  "temporary",
  "volunteer",
  "retired",
];

export default function InstructorDatabase() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<dateFilter>("month");
  const [resetUserPassword, setResetUserPassword] =
    useState<IInstructor | null>(null);
  const [filters, setFilters] = useState({
    employmentType: searchParams.get("employmentType") || "",
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const exportInstructor = useExportInstructorToCsv();

  const instructorTerm = getTerm("instructor", orgType);
  const instructorsTerm = getTerm("instructor", orgType, true);
  const pageTitle = `${instructorsTerm} Overview`;
  const pageDescription = `View and manage all ${instructorsTerm.toLowerCase()} in your organization.`;

  const { data: metricsData, isPending: isMetricsDataPending } =
    useGetUserMetrics("instructor", selectedPeriod);

  // Create filters array for API call
  const filtersArray = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => ({ key, value }));

  const {
    data: teachersData,
    isPending: isTeachersPending,
    isFetching: isTeachersFetching,
  } = useSearchInstructors({
      skip: skipLimit.skip,
      limit: skipLimit.limit,
      searchTerm: debouncedSearchTerm,
      filter:
        filtersArray.length > 0
          ? filtersArray[0] // Use first filter for now, will need to update API to support multiple filters
          : { key: "role", value: "instructor" },
      organizationId: currentUser.user.organization._id,
      archiveStatus,
    });
  const isInitialTeachersLoading = isTeachersPending && !teachersData;

  const modal = searchParams.get("modal");
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
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

  const handleDeleteClick = (instructor: any) => {
    setInstructorToDelete({
      id: instructor._id,
      name: `${instructor.firstName} ${instructor.lastName}`,
    });
  };

  const exportToCSV = (type: "all" | "current") => {
    const filter =
      filtersArray.length > 0
        ? filtersArray[0]
        : { key: "role", value: "student" };
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportInstructor.mutateAsync(params);
      },
      mutationParams: {
        limit: type === "all" ? 1000 : skipLimit.limit,
        skip: type === "all" ? undefined : skipLimit.skip,
        filter,
      },
      filenamePrefix: "1bislms-instructors",
      toastMessages: {
        pending: `Exporting ${type} data to CSV...`,
        success: `Successfully exported ${type} data to CSV`,
        error: `Failed to export ${type} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  // Skeleton configuration based on organization type
  const instructorTableColumns = [
    { width: "30%", hasAvatar: true }, // Instructor name with avatar
    ...(orgType === "school" ? [{ width: "20%" }] : []), // Faculty (school only)
    { width: "20%" }, // Type
    { width: "20%" }, // Created At
    { width: "10%", alignment: "center" as const }, // Actions
  ];

  const TIME_PERIODS = [
    { display: "Today", value: "today" },
    { display: "This Week", value: "week" },
    { display: "This Month", value: "month" },
    { display: "This Year", value: "year" },
  ] as const;

  const handleFilterSelect = (period: dateFilter) => {
    setSelectedPeriod(period);
    setIsFilterOpen(false);
  };

  const instructorRows = useMemo(
    () => ((teachersData?.instructors || []) as IInstructor[]),
    [teachersData?.instructors],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<IInstructor>[] => [
      {
        key: "instructors",
        title: instructorsTerm,
        rows: instructorRows,
        badgeText: `${instructorRows.length} total`,
      },
    ],
    [instructorRows, instructorsTerm],
  );

  const tableColumns = useMemo((): GroupedTableColumn<IInstructor>[] => {
    const columns: GroupedTableColumn<IInstructor>[] = [
      {
        key: "instructorName",
        label: `${instructorTerm} Name`,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${instructorTerm.toLowerCase()}`,
        filterValue: searchTerm,
        onFilterChange: handleSearchChange,
        sortAccessor: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        filterAccessor: (row) =>
          `${row.firstName || ""} ${row.lastName || ""} ${row.email || ""}`.trim(),
        className: "min-w-[280px]",
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={`${row.firstName} ${row.lastName} avatar`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                {`${row.firstName?.[0] ?? ""}${row.lastName?.[0] ?? ""}`}
              </span>
            )}
            <div>
              <span className="text-slate-900">{`${row.firstName} ${row.lastName}`}</span>
              <p className="text-xs text-slate-500">{row.email}</p>
            </div>
          </div>
        ),
      },
      ...(orgType === "school"
        ? [
            {
              key: "faculty",
              label: "Faculty",
              sortable: true,
              filterable: true,
              filterPlaceholder: "Search faculty",
              sortAccessor: (row: IInstructor) =>
                row.faculty
                  ? typeof row.faculty === "string"
                    ? row.faculty
                    : row.faculty.name
                  : "",
              filterAccessor: (row: IInstructor) =>
                row.faculty
                  ? typeof row.faculty === "string"
                    ? row.faculty
                    : row.faculty.name
                  : "",
              className: "min-w-[180px]",
              render: (row: IInstructor) => (
                <span className="text-sm text-slate-600">
                  {row.faculty
                    ? typeof row.faculty === "string"
                      ? row.faculty
                      : row.faculty.name
                    : "N/A"}
                </span>
              ),
            } as GroupedTableColumn<IInstructor>,
          ]
        : []),
      {
        key: "type",
        label: "Type",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Types",
        filterValue: filters.employmentType,
        onFilterChange: (value) => handleFilterChange("employmentType", value),
        filterOptions: EMPLOYMENT_TYPES.map((type) => ({
          value: type,
          label: type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        })),
        sortAccessor: (row) => row.employmentType || "",
        filterAccessor: (row) => row.employmentType || "",
        className: "min-w-[170px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.employmentType === "full_time"
                ? "bg-blue-100 text-blue-800"
                : row.employmentType === "part_time"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {row.employmentType
              ? row.employmentType
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : "N/A"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search date",
        sortAccessor: (row) => new Date(row.createdAt || 0).getTime(),
        filterAccessor: (row) => formatDateMMMDDYYY(row.createdAt),
        className: "min-w-[160px]",
        render: (row) => <span className="text-sm text-slate-600">{formatDateMMMDDYYY(row.createdAt)}</span>,
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
                onClick: () => navigate(row._id),
              },
              {
                key: "update",
                label: "Update",
                onClick: () =>
                  setSearchParams({
                    modal: "edit-instructor",
                    id: row._id,
                  }),
                disabled: archiveStatus === "only",
              },
              {
                key: "reset-password",
                label: "Reset Password",
                icon: <MdLockReset className="size-4" />,
                onClick: () => setResetUserPassword(row),
                disabled: archiveStatus === "only",
              },
              {
                key: "import",
                label: `Import ${instructorsTerm}`,
                onClick: () => setIsBulkImportOpen(true),
              },
              {
                key: "export",
                label: "Export CSV",
                onClick: () => setIsExportModalOpen(true),
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
              {
                key: "delete",
                label: "Delete",
                onClick: () => handleDeleteClick(row),
                disabled: archiveStatus === "only",
                danger: true,
              },
            ]}
          />
        ),
      },
    ];

    return columns;
  }, [
    archiveStatus,
    filters.employmentType,
    instructorTerm,
    instructorsTerm,
    navigate,
    orgType,
    searchTerm,
    setSearchParams,
    toggleArchiveStatus,
  ]);

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm md:text-base text-slate-600">
          {pageDescription}
        </p>
      </div>

      {/* Summary Cards Section */}
      <div className="mb-2">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Instructor Summary
          </h2>
          <div className="relative">
            <Button
              variant="cancel"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2"
            >
              <span className="capitalize flex justify-center items-center gap-2">
                {selectedPeriod === "week"
                  ? "This Week"
                  : selectedPeriod === "month"
                  ? "This Month"
                  : selectedPeriod === "year"
                  ? "This Year"
                  : selectedPeriod}
                <CgChevronDown />
              </span>
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10">
                <ul className="py-1">
                  {TIME_PERIODS.map((period) => (
                    <li
                      key={period.value}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                        selectedPeriod === period.value
                          ? "bg-gray-100 font-medium"
                          : ""
                      }`}
                      onClick={() =>
                        handleFilterSelect(period.value as dateFilter)
                      }
                    >
                      {period.display}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <Suspense
          fallback={
            <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCards stats={[]} isLoading={true} />
            </div>
          }
        >
          <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCards
              stats={generateStats(metricsData, "instructor", selectedPeriod)}
              isLoading={isMetricsDataPending}
            />
          </div>
        </Suspense>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-end">
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-instructor" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">Add {instructorTerm}</span>
            <span className="sm:hidden">Add</span>
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

      {isInitialTeachersLoading ? (
        <TableSkeletonClean columns={instructorTableColumns} rows={5} />
      ) : instructorRows.length === 0 &&
        !(debouncedSearchTerm || filters.employmentType || archiveStatus !== "none") ? (
        <TableEmptyState
          title={`Add Your First ${instructorTerm}`}
          description={`Start by adding ${instructorsTerm.toLowerCase()} who will teach your courses.`}
          secondaryActionLabel="Bulk Import"
          onSecondaryAction={() => setIsBulkImportOpen(true)}
          colSpan={orgType === "school" ? 5 : 4}
          type="instructor"
          isFiltered={false}
        />
      ) : (
        <div className={`transition-opacity duration-200 ${isTeachersFetching ? "opacity-70" : "opacity-100"}`}>
          <GroupedDataTable
            groups={tableGroups}
            columns={tableColumns}
            rowKey={(row) => row._id}
            tableMinWidthClassName={orgType === "school" ? "min-w-[1080px]" : "min-w-[900px]"}
            showPagination={false}
            cardless
            showGroupHeader={false}
            onRowClick={(row) => navigate(row._id)}
            emptyFilteredText={`No matching ${instructorsTerm.toLowerCase()} found.`}
          />
        </div>
      )}

      {!isInitialTeachersLoading && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            {teachersData?.pagination?.totalItems || 0} result
            {teachersData?.pagination?.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!teachersData?.pagination?.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !teachersData?.pagination?.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
              Page {teachersData?.pagination?.currentPage} of{" "}
              {teachersData?.pagination?.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!teachersData?.pagination?.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !teachersData?.pagination?.hasNextPage
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
      {(modal === "create-instructor" || modal === "edit-instructor") && (
        <UpsertInstructorModal
          isOpen={true}
          onClose={() => setSearchParams({})}
        />
      )}

      <DeleteInstructorModal
        isOpen={!!instructorToDelete}
        onClose={() => setInstructorToDelete(null)}
        instructorId={instructorToDelete?.id || ""}
        instructorName={instructorToDelete?.name || ""}
      />

      <BulkImportInstructorModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={exportToCSV}
      />

      {resetUserPassword && (
        <ResetUserPassword
          isOpen={!!resetUserPassword}
          onClose={() => setResetUserPassword(null)}
          user={resetUserPassword}
        />
      )}
    </div>
  );
}
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import UpsertInstructorModal from "../../components/instructor/UpsertInstructorModal";
import { PlusIcon } from "@/components/ui/plus-icon";

import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { dateFilter, IInstructor } from "../../types/interfaces";
import { useMemo, useState, Suspense } from "react";
import BulkImportInstructorModal from "../../components/instructor/BulkImportInstructorModal";
import StatsCards from "../../components/common/StatsCards";
import { generateStats } from "../../components/common/statUtils";
import { CgChevronDown } from "react-icons/cg";
import {
  useExportInstructorToCsv,
  useSearchInstructors,
} from "../../hooks/useInstructor";
import { useGetUserMetrics } from "../../hooks/useUser";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import DeleteInstructorModal from "../../components/instructor/DeleteInstructorModal";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import ExportModal from "../../components/orgAdmin/ExportModal";
import TableEmptyState from "../../components/common/TableEmptyState";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { MdLockReset } from "react-icons/md";
import { FiToggleLeft, FiToggleRight, FiUpload } from "react-icons/fi";
import { FaFileExport } from "react-icons/fa6";
import ResetUserPassword from "../../components/ResetUserPassword";
import { useDebounce } from "../../hooks/useDebounce";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";

const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "probationary",
  "internship",
  "freelance",
  "temporary",
  "volunteer",
  "retired",
];

export default function InstructorDatabase() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<dateFilter>("month");
  const [resetUserPassword, setResetUserPassword] =
    useState<IInstructor | null>(null);
  const [filters, setFilters] = useState({
    employmentType: searchParams.get("employmentType") || "",
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
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const exportInstructor = useExportInstructorToCsv();

  const instructorTerm = getTerm("instructor", orgType);
  const instructorsTerm = getTerm("instructor", orgType, true);
  const pageTitle = `${instructorsTerm} Overview`;
  const pageDescription = `View and manage all ${instructorsTerm.toLowerCase()} in your organization.`;

  const { data: metricsData, isPending: isMetricsDataPending } =
    useGetUserMetrics("instructor", selectedPeriod);

  // Create filters array for API call
  const filtersArray = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => ({ key, value }));

  const {
    data: teachersData,
    isPending: isTeachersPending,
    isFetching: isTeachersFetching,
  } = useSearchInstructors({
      skip: skipLimit.skip,
      limit: skipLimit.limit,
      searchTerm: debouncedSearchTerm,
      filter:
        filtersArray.length > 0
          ? filtersArray[0] // Use first filter for now, will need to update API to support multiple filters
          : { key: "role", value: "instructor" },
      organizationId: currentUser.user.organization._id,
      archiveStatus,
    });
  const isInitialTeachersLoading = isTeachersPending && !teachersData;

  const modal = searchParams.get("modal");
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
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

  const handleDeleteClick = (instructor: any) => {
    setInstructorToDelete({
      id: instructor._id,
      name: `${instructor.firstName} ${instructor.lastName}`,
    });
  };

  const exportToCSV = (type: "all" | "current") => {
    const filter =
      filtersArray.length > 0
        ? filtersArray[0]
        : { key: "role", value: "student" };
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportInstructor.mutateAsync(params);
      },
      mutationParams: {
        limit: type === "all" ? 1000 : skipLimit.limit,
        skip: type === "all" ? undefined : skipLimit.skip,
        filter,
      },
      filenamePrefix: "1bislms-instructors",
      toastMessages: {
        pending: `Exporting ${type} data to CSV...`,
        success: `Successfully exported ${type} data to CSV`,
        error: `Failed to export ${type} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  // Skeleton configuration based on organization type
  const instructorTableColumns = [
    { width: "30%", hasAvatar: true }, // Instructor name with avatar
    ...(orgType === "school" ? [{ width: "20%" }] : []), // Faculty (school only)
    { width: "20%" }, // Type
    { width: "20%" }, // Created At
    { width: "10%", alignment: "center" as const }, // Actions
  ];

  const TIME_PERIODS = [
    { display: "Today", value: "today" },
    { display: "This Week", value: "week" },
    { display: "This Month", value: "month" },
    { display: "This Year", value: "year" },
  ] as const;

  const handleFilterSelect = (period: dateFilter) => {
    setSelectedPeriod(period);
    setIsFilterOpen(false);
  };

  const instructorRows = useMemo(
    () => ((teachersData?.instructors || []) as IInstructor[]),
    [teachersData?.instructors],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<IInstructor>[] => [
      {
        key: "instructors",
        title: instructorsTerm,
        rows: instructorRows,
        badgeText: `${instructorRows.length} total`,
      },
    ],
    [instructorRows, instructorsTerm],
  );

  const tableColumns = useMemo((): GroupedTableColumn<IInstructor>[] => {
    const columns: GroupedTableColumn<IInstructor>[] = [
      {
        key: "instructorName",
        label: `${instructorTerm} Name`,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${instructorTerm.toLowerCase()}`,
        filterValue: searchTerm,
        onFilterChange: handleSearchChange,
        sortAccessor: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        filterAccessor: (row) =>
          `${row.firstName || ""} ${row.lastName || ""} ${row.email || ""}`.trim(),
        className: "min-w-[280px]",
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={`${row.firstName} ${row.lastName} avatar`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                {`${row.firstName?.[0] ?? ""}${row.lastName?.[0] ?? ""}`}
              </span>
            )}
            <div>
              <span className="text-slate-900">{`${row.firstName} ${row.lastName}`}</span>
              <p className="text-xs text-slate-500">{row.email}</p>
            </div>
          </div>
        ),
      },
      ...(orgType === "school"
        ? [
            {
              key: "faculty",
              label: "Faculty",
              sortable: true,
              filterable: true,
              filterPlaceholder: "Search faculty",
              sortAccessor: (row: IInstructor) =>
                row.faculty
                  ? typeof row.faculty === "string"
                    ? row.faculty
                    : row.faculty.name
                  : "",
              filterAccessor: (row: IInstructor) =>
                row.faculty
                  ? typeof row.faculty === "string"
                    ? row.faculty
                    : row.faculty.name
                  : "",
              className: "min-w-[180px]",
              render: (row: IInstructor) => (
                <span className="text-sm text-slate-600">
                  {row.faculty
                    ? typeof row.faculty === "string"
                      ? row.faculty
                      : row.faculty.name
                    : "N/A"}
                </span>
              ),
            } as GroupedTableColumn<IInstructor>,
          ]
        : []),
      {
        key: "type",
        label: "Type",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Types",
        filterValue: filters.employmentType,
        onFilterChange: (value) => handleFilterChange("employmentType", value),
        filterOptions: EMPLOYMENT_TYPES.map((type) => ({
          value: type,
          label: type
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        })),
        sortAccessor: (row) => row.employmentType || "",
        filterAccessor: (row) => row.employmentType || "",
        className: "min-w-[170px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.employmentType === "full_time"
                ? "bg-blue-100 text-blue-800"
                : row.employmentType === "part_time"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {row.employmentType
              ? row.employmentType
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")
              : "N/A"}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search date",
        sortAccessor: (row) => new Date(row.createdAt || 0).getTime(),
        filterAccessor: (row) => formatDateMMMDDYYY(row.createdAt),
        className: "min-w-[160px]",
        render: (row) => <span className="text-sm text-slate-600">{formatDateMMMDDYYY(row.createdAt)}</span>,
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
                onClick: () => navigate(row._id),
              },
              {
                key: "update",
                label: "Update",
                onClick: () =>
                  setSearchParams({
                    modal: "edit-instructor",
                    id: row._id,
                  }),
                disabled: archiveStatus === "only",
              },
              {
                key: "reset-password",
                label: "Reset Password",
                icon: <MdLockReset className="size-4" />,
                onClick: () => setResetUserPassword(row),
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
              {
                key: "delete",
                label: "Delete",
                onClick: () => handleDeleteClick(row),
                disabled: archiveStatus === "only",
                danger: true,
              },
            ]}
          />
        ),
      },
    ];

    return columns;
  }, [
    archiveStatus,
    filters.employmentType,
    instructorTerm,
    instructorsTerm,
    navigate,
    orgType,
    searchTerm,
    setSearchParams,
    toggleArchiveStatus,
  ]);

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          {pageTitle}
        </h1>
        <p className="mt-1 text-sm md:text-base text-slate-600">
          {pageDescription}
        </p>
      </div>

      {/* Summary Cards Section */}
      <div className="mb-2">
        <div className="flex justify-between mb-2">
          <h2 className="text-xl md:text-2xl font-bold text-slate-900">
            Instructor Summary
          </h2>
          <div className="relative">
            <Button
              variant="cancel"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2"
            >
              <span className="capitalize flex justify-center items-center gap-2">
                {selectedPeriod === "week"
                  ? "This Week"
                  : selectedPeriod === "month"
                  ? "This Month"
                  : selectedPeriod === "year"
                  ? "This Year"
                  : selectedPeriod}
                <CgChevronDown />
              </span>
            </Button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-10">
                <ul className="py-1">
                  {TIME_PERIODS.map((period) => (
                    <li
                      key={period.value}
                      className={`px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm ${
                        selectedPeriod === period.value
                          ? "bg-gray-100 font-medium"
                          : ""
                      }`}
                      onClick={() =>
                        handleFilterSelect(period.value as dateFilter)
                      }
                    >
                      {period.display}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <Suspense
          fallback={
            <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCards stats={[]} isLoading={true} />
            </div>
          }
        >
          <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCards
              stats={generateStats(metricsData, "instructor", selectedPeriod)}
              isLoading={isMetricsDataPending}
            />
          </div>
        </Suspense>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-end">
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-instructor" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">Add {instructorTerm}</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsBulkImportOpen(true)}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FiUpload className="size-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
            <span className="sm:hidden">Upload</span>
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

      {isInitialTeachersLoading ? (
        <TableSkeletonClean columns={instructorTableColumns} rows={5} />
      ) : instructorRows.length === 0 &&
        !(debouncedSearchTerm || filters.employmentType || archiveStatus !== "none") ? (
        <TableEmptyState
          title={`Add Your First ${instructorTerm}`}
          description={`Start by adding ${instructorsTerm.toLowerCase()} who will teach your courses.`}
          primaryActionLabel={`Add ${instructorTerm}`}
          primaryActionPath="?modal=create-instructor"
          hidePrimaryAction
          colSpan={orgType === "school" ? 5 : 4}
          type="instructor"
          isFiltered={false}
        />
      ) : (
        <div className={`transition-opacity duration-200 ${isTeachersFetching ? "opacity-70" : "opacity-100"}`}>
          <GroupedDataTable
            groups={tableGroups}
            columns={tableColumns}
            rowKey={(row) => row._id}
            tableMinWidthClassName={orgType === "school" ? "min-w-[1080px]" : "min-w-[900px]"}
            showPagination={false}
            cardless
            showGroupHeader={false}
            onRowClick={(row) => navigate(row._id)}
            emptyFilteredText={`No matching ${instructorsTerm.toLowerCase()} found.`}
          />
        </div>
      )}

      {!isInitialTeachersLoading && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            {teachersData?.pagination?.totalItems || 0} result
            {teachersData?.pagination?.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!teachersData?.pagination?.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !teachersData?.pagination?.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
              Page {teachersData?.pagination?.currentPage} of{" "}
              {teachersData?.pagination?.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!teachersData?.pagination?.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !teachersData?.pagination?.hasNextPage
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
      {(modal === "create-instructor" || modal === "edit-instructor") && (
        <UpsertInstructorModal
          isOpen={true}
          onClose={() => setSearchParams({})}
        />
      )}

      <DeleteInstructorModal
        isOpen={!!instructorToDelete}
        onClose={() => setInstructorToDelete(null)}
        instructorId={instructorToDelete?.id || ""}
        instructorName={instructorToDelete?.name || ""}
      />

      <BulkImportInstructorModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={exportToCSV}
      />

      {resetUserPassword && (
        <ResetUserPassword
          isOpen={!!resetUserPassword}
          onClose={() => setResetUserPassword(null)}
          user={resetUserPassword}
        />
      )}
    </div>
  );
}
