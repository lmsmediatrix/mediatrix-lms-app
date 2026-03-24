import { PlusIcon } from "@/components/ui/plus-icon";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import Table from "../../components/common/Table";
import Button from "../../components/common/Button";
import UpsertStudentModal from "../../components/student/UpsertStudentModal";
import BulkImportStudentModal from "../../components/student/BulkImportStudentModal";
import { useState, Suspense } from "react";
import StatsCards from "../../components/common/StatsCards";
import { dateFilter, IStudent } from "../../types/interfaces";
import { generateStats } from "../../components/common/statUtils";
import { CgChevronDown } from "react-icons/cg";
import {
  useExportStudentToCsv,
  useSearchStudents,
} from "../../hooks/useStudent";

import { useGetUserMetrics } from "../../hooks/useUser";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import DeleteStudentModal from "../../components/student/DeleteStudentModal";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import ExportModal from "../../components/orgAdmin/ExportModal";
import TableEmptyState from "../../components/common/TableEmptyState";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import FilterDropdownButton from "../../components/orgAdmin/FilterDropdownButton";
import ResponsiveFilterButton from "../../components/orgAdmin/ResponsiveFilterButton";
import { useProgramsForDropdown } from "../../hooks/useProgram";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import ResetUserPassword from "../../components/ResetUserPassword";
import { MdLockReset } from "react-icons/md";
import { useDebounce } from "../../hooks/useDebounce";

const STUDENT_STATUS = ["active", "inactive"];

export default function StudentDatabase() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<dateFilter>("month");
  const [resetUserPassword, setResetUserPassword] = useState<IStudent | null>(
    null
  );
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    program: searchParams.get("program") || "",
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
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false); // State for ExportModal

  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);

  const { data: metricsData, isPending: isMetricsDataPending } =
    useGetUserMetrics("student", selectedPeriod);

  // Create filters array for API call
  const filtersArray = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => ({ key, value }));

  const { data: studentsData, isPending: isStudentsPending } =
    useSearchStudents({
      skip: skipLimit.skip,
      limit: skipLimit.limit,
      searchTerm: debouncedSearchTerm,
      filter:
        filtersArray.length > 0
          ? filtersArray[0] // Use first filter for now, will need to update API to support multiple filters
          : { key: "role", value: "student" },
      archiveStatus,
      organizationId: currentUser.user.organization._id,
    });

  // Program dropdown hook (only for school organizations)
  const { data: programsData, isLoading: isLoadingPrograms } =
    useProgramsForDropdown({
      organizationId: currentUser.user.organization._id,
    });

  const exportStudent = useExportStudentToCsv();

  const modal = searchParams.get("modal");
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

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

  const tableColumns = [
    {
      key: "studentName",
      header: `${learnerTerm} name`,
      width: "30%",
    },
    ...(orgType === "school"
      ? [
          {
            key: "studentId",
            header: `${learnerTerm} ID`,
            width: "15%",
          },
        ]
      : []),
    ...(orgType === "school"
      ? [{ key: "program", header: "Program", width: "20%" }]
      : []),
    { key: "status", header: "Status", width: "10%" },
    { key: "actions", header: "Actions", width: "10%" },
  ];

  // Skeleton configuration based on organization type
  const studentTableColumns = [
    { width: "30%", hasAvatar: true }, // Student name with avatar
    ...(orgType === "school" ? [{ width: "15%" }] : []), // Student ID (school only)
    ...(orgType === "school" ? [{ width: "20%" }] : []), // Program (school only)
    { width: "10%" }, // Status
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

  const handleDeleteClick = (student: any) => {
    setStudentToDelete({
      id: student._id,
      name: `${student.firstName} ${student.lastName}`,
    });
  };

  const exportToCSV = (type: "all" | "current") => {
    const filter =
      filtersArray.length > 0
        ? filtersArray[0]
        : { key: "role", value: "student" };

    exportToCSVUtil({
      mutationFn: async (params) => await exportStudent.mutateAsync(params),
      mutationParams: {
        limit: type === "all" ? 1000 : skipLimit.limit,
        skip: type === "all" ? undefined : skipLimit.skip,
        filter,
      },
      filenamePrefix: "1bislms-students",
      toastMessages: {
        pending: `Exporting ${type} data to CSV...`,
        success: `Successfully exported ${type} data to CSV`,
        error: `Failed to export ${type} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  const renderTableRows = () => {
    if (!studentsData?.students || studentsData.students.length === 0) {
      const isFiltered = Boolean(
        searchTerm ||
          filters.status ||
          filters.program ||
          archiveStatus !== "none"
      );
      return (
        <TableEmptyState
          title={`Add Your First ${learnerTerm}`}
          description={`Start by adding ${learnersTerm.toLowerCase()} who will take your courses.`}
          primaryActionLabel={`Add ${learnerTerm}`}
          primaryActionPath="?modal=create-student"
          secondaryActionLabel="Bulk Import"
          onSecondaryAction={() => setIsBulkImportOpen(true)}
          colSpan={orgType === "school" ? 5 : 3}
          type="student"
          isFiltered={isFiltered}
        />
      );
    }

    return studentsData.students
      .filter((student: any) => student.role === "student")
      .map((student: any) => (
        <tr
          key={student._id}
          onClick={() => navigate(student._id)}
          className={`border-b border-gray-200 hover:bg-gray-100 cursor-pointer ${
            archiveStatus === "only" ? "text-gray-500 line-through" : ""
          }`}
        >
          <td className="py-4 px-4">
            <div className="flex items-center gap-3">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={`${student.firstName} ${student.lastName}'s avatar`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                  {`${student.firstName?.[0] ?? ""}${
                    student.lastName?.[0] ?? ""
                  }`}
                </span>
              )}
              <div>
                <span>{`${student.firstName} ${student.lastName}`}</span>
                <p className="text-sm text-gray-500">{student.email}</p>
              </div>
            </div>
          </td>
          {orgType === "school" && (
            <td className="py-4 px-4">
              <span className="font-medium">{student.studentId}</span>
            </td>
          )}
          {orgType === "school" && (
            <td className="py-4 px-4 text-gray-600">
              {student.program?.code || "N/A"}
            </td>
          )}
          <td className="py-4 px-4">
            <div className="flex items-center">
              <span
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm text-center whitespace-normal break-words ${
                  student.status === "active"
                    ? "bg-green-100 text-green-800"
                    : student.status === "inactive"
                    ? "bg-red-100 text-red-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {student.status
                  ? student.status.charAt(0).toUpperCase() +
                    student.status.slice(1)
                  : "N/A"}
              </span>
            </div>
          </td>
          <td className="py-4 px-4">
            <div className="flex">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click
                  setResetUserPassword(student);
                }}
                className={`p-2 rounded-full ${
                  archiveStatus === "only"
                    ? "cursor-not-allowed text-gray-400"
                    : "hover:bg-gray-200"
                }`}
                disabled={archiveStatus === "only"}
              >
                <MdLockReset className="size-6 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click

                  if (archiveStatus !== "only") {
                    setSearchParams({
                      modal: "edit-student",
                      id: student._id,
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
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent row click

                  if (archiveStatus !== "only") {
                    handleDeleteClick(student);
                  }
                }}
                className={`p-2 rounded-full ${
                  archiveStatus === "only"
                    ? "cursor-not-allowed text-gray-400"
                    : "hover:bg-gray-200 text-red-600"
                }`}
                disabled={archiveStatus === "only"}
              >
                <FiTrash2 className="w-4 h-4" />
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
              <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
                <StatsCards stats={[]} isLoading={true} />
              </div>
            }
          >
            <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ">
              <StatsCards
                stats={generateStats(metricsData, "student", selectedPeriod)}
                isLoading={isMetricsDataPending}
              />
            </div>
          </Suspense>
        </>
      )}

      {/* Table Section */}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        {/* Search Input */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-1 md:items-center md:gap-2 md:min-w-0">
          {/* Search Input */}
          <div className="flex gap-2 items-center flex-1 md:min-w-0">
            <input
              type="text"
              placeholder={`Search ${learnersTerm.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
            />

            {/* Mobile Filter Button - Next to search on mobile, hidden on tablet+ */}
            <div className="md:hidden">
              <ResponsiveFilterButton
                activeFiltersCount={
                  (filters.status ? 1 : 0) + (filters.program ? 1 : 0)
                }
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    value: filters.status,
                    options: STUDENT_STATUS.map((status) => ({
                      value: status,
                      label: status.charAt(0).toUpperCase() + status.slice(1),
                    })),
                    onChange: (value: string) =>
                      handleFilterChange("status", value),
                    placeholder: "All Status",
                  },
                  ...(orgType === "school"
                    ? [
                        {
                          key: "program",
                          label: "Program",
                          value: filters.program,
                          options:
                            programsData?.map((program: any) => ({
                              value: program._id,
                              label: program.name,
                            })) || [],
                          onChange: (value: string) =>
                            handleFilterChange("program", value),
                          loading: isLoadingPrograms,
                          placeholder: "All Programs",
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </div>

          {/* Desktop Filter Buttons - Hidden on mobile & tablet */}
          <div className="hidden xl:flex gap-2 items-center flex-shrink-0">
            {/* Status Filter Button */}
            <FilterDropdownButton
              label="Status"
              value={filters.status}
              options={STUDENT_STATUS.map((status) => ({
                value: status,
                label: status.charAt(0).toUpperCase() + status.slice(1),
              }))}
              onChange={(value) => handleFilterChange("status", value)}
              placeholder="All Status"
            />

            {/* Program Filter Button (only for school organizations) */}
            {orgType === "school" && (
              <FilterDropdownButton
                label="Program"
                value={filters.program}
                options={
                  programsData?.map((program: any) => ({
                    value: program._id,
                    label: program.code,
                  })) || []
                }
                onChange={(value) => handleFilterChange("program", value)}
                loading={isLoadingPrograms}
                placeholder="All Programs"
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
                (filters.status ? 1 : 0) + (filters.program ? 1 : 0)
              }
              filters={[
                {
                  key: "status",
                  label: "Status",
                  value: filters.status,
                  options: STUDENT_STATUS.map((status) => ({
                    value: status,
                    label: status.charAt(0).toUpperCase() + status.slice(1),
                  })),
                  onChange: (value: string) =>
                    handleFilterChange("status", value),
                  placeholder: "All Status",
                },
                ...(orgType === "school"
                  ? [
                      {
                        key: "program",
                        label: "Program",
                        value: filters.program,
                        options:
                          programsData?.map((program: any) => ({
                            value: program._id,
                            label: program.name,
                          })) || [],
                        onChange: (value: string) =>
                          handleFilterChange("program", value),
                        loading: isLoadingPrograms,
                        placeholder: "All Programs",
                      },
                    ]
                  : []),
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-student" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">Add {learnerTerm}</span>
            <span className="sm:hidden">Add</span>
          </Button>
          <ActionMenuButton
            entityTerm={learnerTerm}
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

      {isStudentsPending ? (
        <TableSkeletonClean columns={studentTableColumns} rows={5} />
      ) : (
        <Table columns={tableColumns} scrollable={true} maxHeight="370px">
          {renderTableRows()}
        </Table>
      )}

      {/* Pagination */}
      {!isStudentsPending && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
          <span>
            {studentsData?.pagination?.totalItems || 0} result
            {studentsData?.pagination?.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!studentsData?.pagination?.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !studentsData?.pagination?.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
              }`}
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
              Page {studentsData?.pagination?.currentPage} of{" "}
              {studentsData?.pagination?.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!studentsData?.pagination?.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
                !studentsData?.pagination?.hasNextPage
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
      {(modal === "create-student" || modal === "edit-student") && (
        <UpsertStudentModal isOpen={true} onClose={() => setSearchParams({})} />
      )}

      <DeleteStudentModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        studentId={studentToDelete?.id || ""}
        studentName={studentToDelete?.name || ""}
      />

      <BulkImportStudentModal
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
