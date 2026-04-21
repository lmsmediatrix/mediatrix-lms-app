import Button from "../../components/common/Button";
import { FaPlus } from "react-icons/fa";
import { Navigate, useSearchParams } from "react-router-dom";
import { useFaculties } from "../../hooks/useFaculty";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import TableEmptyState from "../../components/common/TableEmptyState";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import FilterDropdownButton from "../../components/orgAdmin/FilterDropdownButton";
import ResponsiveFilterButton from "../../components/orgAdmin/ResponsiveFilterButton";
import UpsertFacultyModal from "../../components/orgAdmin/UpsertFacultyModal";
import ViewFacultyModal from "../../components/orgAdmin/ViewFacultyModal";
import DeleteFacultyModal from "../../components/orgAdmin/DeleteFacultyModal";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useDebounce } from "../../hooks/useDebounce";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";

const FACULTY_STATUS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

interface FacultyToDelete {
  id: string;
  name: string;
}

type FacultyRow = {
  _id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
};

export default function FacultyPage() {
  const { currentUser } = useAuth();
  const isCorporate = currentUser.user.organization.type === "corporate";
  const orgCode = currentUser.user.organization.code;

  if (isCorporate) {
    return <Navigate to={`/${orgCode}/admin/department`} replace />;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || ""
  );
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
  const [facultyToDelete, setFacultyToDelete] =
    useState<FacultyToDelete | null>(null);

  const { data, isLoading, isError } = useFaculties({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    filter: selectedStatus
      ? { key: "isActive", value: selectedStatus }
      : undefined,
    searchTerm: debouncedSearchTerm,
    organizationId: currentUser.user.organization._id,
    archiveStatus,  
  });

  const modal = searchParams.get("modal");

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    setSearchParams((prev) => {
      if (status) {
        prev.set("status", status);
      } else {
        prev.delete("status");
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

  const handleDeleteClick = (faculty: any) => {
    setFacultyToDelete({
      id: faculty._id,
      name: faculty.name,
    });
  };

  const facultyRows = useMemo(
    () => ((data?.faculties || []) as FacultyRow[]),
    [data?.faculties],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<FacultyRow>[] => [
      {
        key: "faculties",
        title: "Faculties",
        rows: facultyRows,
        badgeText: `${facultyRows.length} total`,
      },
    ],
    [facultyRows],
  );

  const tableColumns = useMemo(
    (): GroupedTableColumn<FacultyRow>[] => [
      {
        key: "code",
        label: "Faculty Code",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search code",
        sortAccessor: (row) => row.code || "",
        filterAccessor: (row) => row.code || "",
        className: "min-w-[170px]",
        render: (row) => <span className="font-semibold text-slate-900">{row.code}</span>,
      },
      {
        key: "name",
        label: "Faculty Name",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search name",
        sortAccessor: (row) => row.name || "",
        filterAccessor: (row) => row.name || "",
        className: "min-w-[240px]",
        render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
      },
      {
        key: "description",
        label: "Description",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search description",
        sortAccessor: (row) => row.description || "",
        filterAccessor: (row) => row.description || "",
        className: "min-w-[260px]",
        render: (row) => (
          <span className="text-sm text-slate-600 max-w-xs truncate inline-block">
            {row.description || "No description"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search status",
        sortAccessor: (row) => (row.isActive ? "active" : "inactive"),
        filterAccessor: (row) => (row.isActive ? "active" : "inactive"),
        className: "min-w-[140px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              row.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {row.isActive ? "Active" : "Inactive"}
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
                onClick: () =>
                  setSearchParams({ modal: "view-faculty", id: row._id }),
              },
              {
                key: "update",
                label: "Update",
                onClick: () =>
                  setSearchParams({ modal: "edit-faculty", id: row._id }),
                disabled: archiveStatus === "only",
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
    ],
    [archiveStatus, setSearchParams],
  );

  // Skeleton configuration for faculties
  const facultyTableColumns = [
    { width: "15%" }, // Faculty Code
    { width: "25%" }, // Faculty Name
    { width: "25%" }, // Description
    { width: "15%" }, // Status
    { width: "20%", alignment: "center" as const }, // Actions
  ];

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">Faculties</h1>
        <HoverHelpTooltip
          text="Organize and manage your instructor faculties."
          
          className="shrink-0"
        />
      </div>

      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-1 md:items-center md:gap-2 md:min-w-0">
          {/* Search Input and Mobile Filter Row */}
          <div className="flex gap-2 items-center flex-1 md:min-w-0">
            <input
              type="text"
              placeholder="Search faculties..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
            />

            {/* Mobile Filter Button - Next to search on mobile, hidden on tablet+ */}
            <div className="md:hidden">
              <ResponsiveFilterButton
                activeFiltersCount={selectedStatus ? 1 : 0}
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    value: selectedStatus,
                    options: FACULTY_STATUS,
                    onChange: handleStatusChange,
                    placeholder: "All Status",
                  },
                ]}
              />
            </div>
          </div>

          {/* Desktop Filter Buttons - Hidden on mobile & tablet */}
          <div className="hidden xl:flex gap-2 items-center flex-shrink-0">
            {/* Status Filter Button */}
            <FilterDropdownButton
              label="Status"
              value={selectedStatus}
              options={FACULTY_STATUS}
              onChange={handleStatusChange}
              placeholder="All Status"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Tablet Filter Button - Hidden on mobile and desktop */}
          <div className="hidden md:block xl:hidden">
            <ResponsiveFilterButton
              activeFiltersCount={selectedStatus ? 1 : 0}
              filters={[
                {
                  key: "status",
                  label: "Status",
                  value: selectedStatus,
                  options: FACULTY_STATUS,
                  onChange: handleStatusChange,
                  placeholder: "All Status",
                },
              ]}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-faculty" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add Faculty</span>
            <span className="sm:hidden">Add</span>
          </Button>
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

      {isLoading ? (
        <TableSkeletonClean columns={facultyTableColumns} rows={10} />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error loading faculties
        </div>
      ) : facultyRows.length === 0 ? (
        <TableEmptyState
          title="Create Your First Faculty"
          description="Start by creating a faculty. Faculties help organize your academic departments."
          colSpan={5}
          type="faculty"
          isFiltered={Boolean(searchTerm || selectedStatus || archiveStatus !== "none")}
        />
      ) : (
        <GroupedDataTable
          groups={tableGroups}
          columns={tableColumns}
          rowKey={(row) => row._id}
          tableMinWidthClassName="min-w-[1080px]"
          showPagination={false}
          cardless
          showGroupHeader={false}
          onRowClick={(row) => setSearchParams({ modal: "view-faculty", id: row._id })}
          emptyFilteredText="No matching faculties found."
        />
      )}

      {/* Pagination */}
      {!isLoading && (
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

      {/* Modals */}
      {(modal === "create-faculty" || modal === "edit-faculty") && (
        <UpsertFacultyModal isOpen={true} onClose={() => setSearchParams({})} />
      )}

      {modal === "view-faculty" && (
        <ViewFacultyModal isOpen={true} onClose={() => setSearchParams({})} />
      )}

      {facultyToDelete && (
        <DeleteFacultyModal
          isOpen={true}
          onClose={() => setFacultyToDelete(null)}
          faculty={facultyToDelete}
        />
      )}
    </div>
  );
}
