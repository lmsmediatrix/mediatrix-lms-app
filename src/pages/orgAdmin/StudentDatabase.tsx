import { PlusIcon } from "@/components/ui/plus-icon";
import { useSearchParams, useNavigate } from "react-router-dom";
import Button from "../../components/common/Button";
import UpsertStudentModal from "../../components/student/UpsertStudentModal";
import BulkImportStudentModal from "../../components/student/BulkImportStudentModal";
import { useMemo, useState, Suspense } from "react";
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
import { useProgramsForDropdown } from "../../hooks/useProgram";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import ResetUserPassword from "../../components/ResetUserPassword";
import { MdLockReset } from "react-icons/md";
import {
  FiList,
  FiToggleLeft,
  FiToggleRight,
  FiUserCheck,
  FiUserX,
  FiUsers,
} from "react-icons/fi";
import { useDebounce } from "../../hooks/useDebounce";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";

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
  const pageTitle = `${learnersTerm} Overview`;
  const pageDescription = `View and manage all ${learnersTerm.toLowerCase()} in your organization.`;

  const { data: metricsData, isPending: isMetricsDataPending } =
    useGetUserMetrics("student", selectedPeriod);

  // Create filters array for API call
  const filtersArray = Object.entries(filters)
    .filter(([_, value]) => value !== "")
    .map(([key, value]) => ({ key, value }));

  const {
    data: studentsData,
    isPending: isStudentsPending,
    isFetching: isStudentsFetching,
  } = useSearchStudents({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    searchTerm: debouncedSearchTerm,
    filter: { key: "role", value: "student" },
    filters: filtersArray,
    archiveStatus,
    organizationId: currentUser.user.organization._id,
  });
  const isInitialStudentsLoading = isStudentsPending && !studentsData;

  // Program dropdown hook (only for school organizations)
  const { data: programsData } = useProgramsForDropdown({
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

  // Skeleton configuration based on organization type
  const studentTableColumns = [
    { width: "30%", hasAvatar: true }, // Student name with avatar
    ...(orgType === "school" ? [{ width: "15%" }] : []), // Student ID (school only)
    ...(orgType === "school" ? [{ width: "20%" }] : []), // Program (school only)
    ...(orgType === "corporate" ? [{ width: "18%" }, { width: "12%" }, { width: "20%" }] : []), // Department, tag, direct manager
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
    exportToCSVUtil({
      mutationFn: async (params) => await exportStudent.mutateAsync(params),
      mutationParams: {
        limit: type === "all" ? 1000 : skipLimit.limit,
        skip: type === "all" ? undefined : skipLimit.skip,
        filter: { key: "role", value: "student" },
        filters: filtersArray,
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

  const studentRows = useMemo(
    () =>
      ((studentsData?.students || []).filter(
        (student: any) => student.role === "student",
      ) as IStudent[]),
    [studentsData?.students],
  );

  const employeeSummaryStats = useMemo(
    () => [
      {
        title: `Total ${learnersTerm}`,
        value: studentsData?.pagination?.totalItems || 0,
        change:
          archiveStatus === "only"
            ? "Archived records view"
            : "Active records view",
        icon: <FiUsers className="text-xl" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        iconBgColor: "bg-blue-500",
        iconTextColor: "text-white",
      },
      {
        title: "Active (Shown)",
        value: studentRows.filter((student) => student.status === "active")
          .length,
        change: "Active records on current page",
        icon: <FiUserCheck className="text-xl" />,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        iconBgColor: "bg-emerald-500",
        iconTextColor: "text-white",
      },
      {
        title: "Inactive (Shown)",
        value: studentRows.filter((student) => student.status === "inactive")
          .length,
        change: "Inactive records on current page",
        icon: <FiUserX className="text-xl" />,
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        iconBgColor: "bg-amber-500",
        iconTextColor: "text-white",
      },
      {
        title: "Records Shown",
        value: studentRows.length,
        change: `Page ${studentsData?.pagination?.currentPage || 1} of ${
          studentsData?.pagination?.totalPages || 1
        }`,
        icon: <FiList className="text-xl" />,
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-700",
        iconBgColor: "bg-indigo-500",
        iconTextColor: "text-white",
      },
    ],
    [
      archiveStatus,
      learnersTerm,
      studentRows,
      studentsData?.pagination?.currentPage,
      studentsData?.pagination?.totalItems,
      studentsData?.pagination?.totalPages,
    ],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<IStudent>[] => [
      {
        key: "students",
        title: learnersTerm,
        rows: studentRows,
        badgeText: `${studentRows.length} total`,
      },
    ],
    [learnersTerm, studentRows],
  );

  const tableColumns = useMemo((): GroupedTableColumn<IStudent>[] => {
    const getDepartmentName = (row: IStudent): string => {
      const department = row.person?.department;
      if (!department) {
        return "Unassigned";
      }

      if (typeof department === "string") {
        return /^[a-fA-F0-9]{24}$/.test(department) ? "Unassigned" : department;
      }

      return department.name || "Unassigned";
    };

    const getDirectManagerName = (row: IStudent): string => {
      if (!row.directTo) {
        return "None";
      }

      if (typeof row.directTo === "string") {
        return "Assigned";
      }

      const fullName = `${row.directTo.firstName || ""} ${row.directTo.lastName || ""}`.trim();
      return fullName || "Assigned";
    };

    const columns: GroupedTableColumn<IStudent>[] = [
      {
        key: "studentName",
        label: `${learnerTerm} Name`,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
        filterValue: searchTerm,
        onFilterChange: handleSearchChange,
        sortAccessor: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        filterAccessor: (row) =>
          `${row.firstName || ""} ${row.lastName || ""} ${row.email || ""} ${getDepartmentName(row)} ${getDirectManagerName(row)}`.trim(),
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
              key: "studentId",
              label: `${learnerTerm} ID`,
              sortable: true,
              filterable: true,
              filterPlaceholder: `Search ${learnerTerm.toLowerCase()} ID`,
              sortAccessor: (row: IStudent) => row.studentId || "",
              filterAccessor: (row: IStudent) => row.studentId || "",
              className: "min-w-[160px]",
              render: (row: IStudent) => (
                <span className="font-medium text-slate-700">{row.studentId || "N/A"}</span>
              ),
            } as GroupedTableColumn<IStudent>,
            {
              key: "program",
              label: "Program",
              sortable: true,
              filterable: true,
              filterVariant: "select",
              filterSelectAllLabel: "All Programs",
              filterValue: filters.program,
              onFilterChange: (value: string) => handleFilterChange("program", value),
              filterOptions:
                programsData?.map((program: any) => ({
                  value: program._id,
                  label: program.code || program.name,
                })) || [],
              sortAccessor: (row: IStudent) =>
                ((row as any).program?.code || row.program?.name || "") as string,
              filterAccessor: (row: IStudent) =>
                `${(row as any).program?.code || ""} ${row.program?.name || ""}`.trim(),
              className: "min-w-[170px]",
              render: (row: IStudent) => (
                <span className="text-sm text-slate-600">
                  {(row as any).program?.code || row.program?.name || "N/A"}
                </span>
              ),
            } as GroupedTableColumn<IStudent>,
          ]
        : []),
      ...(orgType === "corporate"
        ? [
            {
              key: "department",
              label: "Department",
              sortable: true,
              sortAccessor: (row: IStudent) => getDepartmentName(row),
              className: "min-w-[170px]",
              render: (row: IStudent) => (
                <span className="text-sm text-slate-700">{getDepartmentName(row)}</span>
              ),
            } as GroupedTableColumn<IStudent>,
            {
              key: "subrole",
              label: "Tag",
              sortable: true,
              sortAccessor: (row: IStudent) => row.subrole || "",
              className: "min-w-[130px]",
              render: (row: IStudent) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    row.subrole === "manager"
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {row.subrole === "manager" ? "Manager" : "Employee"}
                </span>
              ),
            } as GroupedTableColumn<IStudent>,
            {
              key: "directTo",
              label: "Direct To",
              sortable: true,
              sortAccessor: (row: IStudent) => getDirectManagerName(row),
              className: "min-w-[180px]",
              render: (row: IStudent) => (
                <span className="text-sm text-slate-700">{getDirectManagerName(row)}</span>
              ),
            } as GroupedTableColumn<IStudent>,
          ]
        : []),
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterValue: filters.status,
        onFilterChange: (value: string) => handleFilterChange("status", value),
        filterOptions: STUDENT_STATUS.map((status) => ({
          value: status,
          label: status.charAt(0).toUpperCase() + status.slice(1),
        })),
        sortAccessor: (row) => row.status || "",
        filterAccessor: (row) => row.status || "",
        className: "min-w-[130px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.status === "active"
                ? "bg-green-100 text-green-800"
                : row.status === "inactive"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
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
                onClick: () => navigate(row._id),
              },
              {
                key: "update",
                label: "Update",
                onClick: () =>
                  setSearchParams({
                    modal: "edit-student",
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
                label: `Import ${learnersTerm}`,
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
    filters.program,
    filters.status,
    handleSearchChange,
    learnerTerm,
    learnersTerm,
    navigate,
    orgType,
    programsData,
    searchTerm,
    setSearchParams,
    toggleArchiveStatus,
  ]);

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

      {orgType === "corporate" && (
        <div className="mb-2">
          <div className="flex justify-between mb-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              {learnerTerm} Summary
            </h2>
          </div>
          <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCards
              stats={employeeSummaryStats}
              isLoading={isInitialStudentsLoading}
            />
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-end">
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-student" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <PlusIcon size={14} />
            <span className="hidden sm:inline">Add {learnerTerm}</span>
            <span className="sm:hidden">Add</span>
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

      {isInitialStudentsLoading ? (
        <TableSkeletonClean columns={studentTableColumns} rows={5} />
      ) : studentRows.length === 0 &&
        !(debouncedSearchTerm || filters.status || filters.program || archiveStatus !== "none") ? (
        <TableEmptyState
          title={`Add Your First ${learnerTerm}`}
          description={`Start by adding ${learnersTerm.toLowerCase()} who will take your courses.`}
          secondaryActionLabel="Bulk Import"
          onSecondaryAction={() => setIsBulkImportOpen(true)}
          colSpan={orgType === "school" ? 5 : 6}
          type="student"
          isFiltered={false}
        />
      ) : (
        <div className={`transition-opacity duration-200 ${isStudentsFetching ? "opacity-70" : "opacity-100"}`}>
          <GroupedDataTable
            groups={tableGroups}
            columns={tableColumns}
            rowKey={(row) => row._id}
            tableMinWidthClassName={orgType === "school" ? "min-w-[1100px]" : "min-w-[1120px]"}
            showPagination={false}
            cardless
            showGroupHeader={false}
            onRowClick={(row) => navigate(row._id)}
            emptyFilteredText={`No matching ${learnersTerm.toLowerCase()} found.`}
          />
        </div>
      )}

      {/* Pagination */}
      {!isInitialStudentsLoading && (
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
