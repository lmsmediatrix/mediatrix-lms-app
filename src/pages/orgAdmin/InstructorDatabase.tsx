import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import UpsertInstructorModal from "../../components/instructor/UpsertInstructorModal";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PlusIcon } from "@/components/ui/plus-icon";

import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { dateFilter, IInstructor } from "../../types/interfaces";
import { useState, Suspense } from "react";
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
import FilterDropdownButton from "../../components/orgAdmin/FilterDropdownButton";
import ResponsiveFilterButton from "../../components/orgAdmin/ResponsiveFilterButton";
import { useFacultiesForDropdown } from "../../hooks/useFaculty";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { MdLockReset } from "react-icons/md";
import ResetUserPassword from "../../components/ResetUserPassword";
import { useDebounce } from "../../hooks/useDebounce";

const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "probationary",
  "internship",
  "freelance",
  "temporary",
  "volunteer",
  "retired",
  "resigned",
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
    faculty: searchParams.get("faculty") || "",
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

  const { data: metricsData, isPending: isMetricsDataPending } =
    useGetUserMetrics("instructor", selectedPeriod);

  // Create filters array for API call
  const filtersArray = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => ({ key, value }));

  const { data: teachersData, isPending: isTeachersPending } =
    useSearchInstructors({
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

  // Faculty dropdown hook (only for school organizations)
  const { data: facultiesData, isLoading: isLoadingFaculties } =
    useFacultiesForDropdown({
      organizationId: currentUser.user.organization._id,
    });

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
    setSearchParams((prev) => {
      if (value) {
        prev.set(filterType, value);
      } else {
        prev.delete(filterType);
      }
      return prev;
    });
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (search) {
        newParams.set("search", search);
      } else {
        newParams.delete("search");
      }
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

  // Table columns
  const tableColumns = [
    { key: "instructorName", header: `${instructorTerm} Name`, width: "30%" },
    ...(orgType === "school"
      ? [{ key: "faculty", header: "Faculty", width: "20%" }]
      : []),
    { key: "type", header: "Type", width: "20%" },
    { key: "createdAt", header: "Created At", width: "20%" },
    { key: "actions", header: "Actions", width: "10%" },
  ];

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

  const renderTableRows = () => {
    if (!teachersData?.instructors || teachersData.instructors.length === 0) {
      const isFiltered = Boolean(
        searchTerm ||
          filters.employmentType ||
          filters.faculty ||
          archiveStatus !== "none"
      );
      return (
        <TableEmptyState
          title={`Add Your First ${instructorTerm}`}
          description={`Start by adding ${instructorsTerm.toLowerCase()} who will teach your courses.`}
          primaryActionLabel={`Add ${instructorTerm}`}
          primaryActionPath="?modal=create-instructor"
          secondaryActionLabel="Bulk Import"
          onSecondaryAction={() => setIsBulkImportOpen(true)}
          colSpan={5}
          type="instructor"
          isFiltered={isFiltered}
        />
      );
    }

    return teachersData.instructors.map((instructor: any) => (
      <tr
        key={instructor._id}
        className={` border-gray-200 hover:bg-gray-100 cursor-pointer ${
          archiveStatus === "only" ? "text-gray-500 line-through" : ""
        }`}
        onClick={() => navigate(instructor._id)}
      >
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            {instructor.avatar ? (
              <img
                src={instructor.avatar}
                alt={`${instructor.firstName} ${instructor.lastName}'s avatar`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                {`${instructor.firstName?.[0] ?? ""}${
                  instructor.lastName?.[0] ?? ""
                }`}
              </span>
            )}
            <div>
              <span>{`${instructor.firstName} ${instructor.lastName}`}</span>
              <p className="text-sm text-gray-500">{instructor.email}</p>
            </div>
          </div>
        </td>
        {orgType === "school" && (
          <td className="py-4 px-4">
            {instructor.faculty
              ? typeof instructor.faculty === "string"
                ? instructor.faculty
                : instructor.faculty.name
              : "N/A"}
          </td>
        )}
        <td className="py-4 px-4">
          <div className="flex items-center">
            <span
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-center whitespace-normal break-words ${
                instructor.employmentType === "full_time"
                  ? "bg-blue-100 text-blue-800"
                  : instructor.employmentType === "part_time"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {instructor.employmentType
                ? instructor.employmentType
                    .split("_")
                    .map(
                      (word: any) =>
                        word.charAt(0).toUpperCase() + word.slice(1)
                    )
                    .join(" ")
                : "N/A"}
            </span>
          </div>
        </td>
        <td className="py-4 px-4">
          {formatDateMMMDDYYY(instructor.createdAt)}
        </td>
        <td className="py-4 px-4">
          <div className="flex">
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                setResetUserPassword(instructor);
              }}
              className={`p-2 rounded-full ${
                archiveStatus === "only"
                  ? "cursor-not-allowed text-gray-700"
                  : "hover:bg-gray-200"
              }`}
              disabled={archiveStatus === "only"}
            >
              <MdLockReset className="size-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                if (archiveStatus !== "only") {
                  setSearchParams({
                    modal: "edit-instructor",
                    id: instructor._id,
                  });
                }
              }}
              className={`p-2 rounded-full ${
                archiveStatus === "only"
                  ? "cursor-not-allowed text-gray-400"
                  : "hover:bg-gray-200"
              }`}
              disabled={archiveStatus === "only"}
            >
              <FiEdit2 className="size-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                if (archiveStatus !== "only") {
                  handleDeleteClick(instructor);
                }
              }}
              className={`p-2 rounded-full ${
                archiveStatus === "only"
                  ? "cursor-not-allowed text-gray-400"
                  : "hover:bg-gray-200 text-red-500"
              }`}
              disabled={archiveStatus === "only"}
            >
              <FiTrash2 className="size-4" />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      {/* Overview Cards Section */}
      {orgType === "school" && (
        <>
          <div className="flex justify-between mb-2">
            <h2 className="text-3xl font-bold">Overview</h2>
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
        </>
      )}

      {/* Table Section */}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-1 md:items-center md:gap-2 md:min-w-0">
          {/* Search Input */}
          <div className="flex gap-2 items-center flex-1 md:min-w-0">
            <input
              type="text"
              placeholder={`Search ${instructorsTerm.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
            />

            {/* Mobile Filter Button - Next to search on mobile, hidden on tablet+ */}
            <div className="md:hidden">
              <ResponsiveFilterButton
                activeFiltersCount={
                  (filters.employmentType ? 1 : 0) + (filters.faculty ? 1 : 0)
                }
                filters={[
                  {
                    key: "employmentType",
                    label: "Type",
                    value: filters.employmentType,
                    options: EMPLOYMENT_TYPES.map((type) => ({
                      value: type,
                      label: type
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" "),
                    })),
                    onChange: (value: string) =>
                      handleFilterChange("employmentType", value),
                    placeholder: "All Types",
                  },
                  ...(orgType === "school"
                    ? [
                        {
                          key: "faculty",
                          label: "Faculty",
                          value: filters.faculty,
                          options:
                            facultiesData?.map((faculty: any) => ({
                              value: faculty._id,
                              label: faculty.name,
                            })) || [],
                          onChange: (value: string) =>
                            handleFilterChange("faculty", value),
                          loading: isLoadingFaculties,
                          placeholder: "All Faculties",
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </div>

          {/* Desktop Filter Buttons - Hidden on mobile & tablet */}
          <div className="hidden xl:flex gap-2 items-center flex-shrink-0">
            {/* Employment Type Filter Button */}
            <FilterDropdownButton
              label="Type"
              value={filters.employmentType}
              options={EMPLOYMENT_TYPES.map((type) => ({
                value: type,
                label: type
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" "),
              }))}
              onChange={(value) => handleFilterChange("employmentType", value)}
              placeholder="All Types"
            />

            {/* Faculty Filter Button (only for school organizations) */}
            {orgType === "school" && (
              <FilterDropdownButton
                label="Faculty"
                value={filters.faculty}
                options={
                  facultiesData?.map((faculty: any) => ({
                    value: faculty._id,
                    label: faculty.name,
                  })) || []
                }
                onChange={(value) => handleFilterChange("faculty", value)}
                loading={isLoadingFaculties}
                placeholder="All Faculties"
              />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Tablet Filter Button - Hidden on mobile and desktop */}
          <div className="hidden md:block xl:hidden">
            <ResponsiveFilterButton
              activeFiltersCount={
                (filters.employmentType ? 1 : 0) + (filters.faculty ? 1 : 0)
              }
              filters={[
                {
                  key: "employmentType",
                  label: "Type",
                  value: filters.employmentType,
                  options: EMPLOYMENT_TYPES.map((type) => ({
                    value: type,
                    label: type
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" "),
                  })),
                  onChange: (value: string) =>
                    handleFilterChange("employmentType", value),
                  placeholder: "All Types",
                },
                ...(orgType === "school"
                  ? [
                      {
                        key: "faculty",
                        label: "Faculty",
                        value: filters.faculty,
                        options:
                          facultiesData?.map((faculty: any) => ({
                            value: faculty._id,
                            label: faculty.name,
                          })) || [],
                        onChange: (value: string) =>
                          handleFilterChange("faculty", value),
                        loading: isLoadingFaculties,
                        placeholder: "All Faculties",
                      },
                    ]
                  : []),
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-instructor" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">Add {instructorTerm}</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <ActionMenuButton
            entityTerm={instructorTerm}
            onBulkImport={() => setIsBulkImportOpen(true)}
            onExport={() => setIsExportModalOpen(true)}
          />
          {/* Archive Status Toggle Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newStatus = archiveStatus === "only" ? "none" : "only";
                setArchiveStatus(newStatus);
                setSkipLimit((prev) => ({ ...prev, skip: 0 }));
                setSearchParams((prev) => {
                  prev.set("archiveStatus", newStatus);
                  prev.set("page", "1");
                  return prev;
                });
              }}
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

      {isTeachersPending ? (
        <TableSkeletonClean columns={instructorTableColumns} rows={5} />
      ) : (
        <Table columns={tableColumns} scrollable={true} maxHeight="370px">
          {renderTableRows()}
        </Table>
      )}

      {!isTeachersPending && (
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
