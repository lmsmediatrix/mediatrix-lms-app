import Button from "../../components/common/Button";
import { FaPlus } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { usePrograms } from "../../hooks/useProgram";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import TableEmptyState from "../../components/common/TableEmptyState";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import UpsertProgramModal from "../../components/orgAdmin/UpsertProgramModal";
import ViewProgramModal from "../../components/orgAdmin/ViewProgramModal";
import DeleteProgramModal from "../../components/orgAdmin/DeleteProgramModal";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useDebounce } from "../../hooks/useDebounce";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import { getTerm } from "../../lib/utils";

interface ProgramToDelete {
  id: string;
  name: string;
}

type ProgramRow = {
  _id: string;
  code: string;
  name: string;
  description?: string;
};

export default function ProgramPage() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnersTerm = getTerm("learner", orgType, true);
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [programToDelete, setProgramToDelete] =
    useState<ProgramToDelete | null>(null);

  const { data, isLoading, isError } = usePrograms({
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    searchTerm: debouncedSearchTerm,
    organizationId: currentUser.user.organization._id,
    archiveStatus,
  });

  const modal = searchParams.get("modal");

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

  const handleDeleteClick = (program: any) => {
    setProgramToDelete({
      id: program._id,
      name: program.name,
    });
  };

  // Skeleton configuration for programs
  const programTableColumns = [
    { width: "20%" }, // Program Code
    { width: "35%" }, // Program Name
    { width: "30%" }, // Description
    { width: "15%", alignment: "center" as const }, // Actions
  ];

  const programRows = useMemo(
    () => ((data?.programs || []) as ProgramRow[]),
    [data?.programs],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<ProgramRow>[] => [
      {
        key: "programs",
        title: "Programs",
        rows: programRows,
        badgeText: `${programRows.length} total`,
      },
    ],
    [programRows],
  );

  const tableColumns = useMemo(
    (): GroupedTableColumn<ProgramRow>[] => [
      {
        key: "code",
        label: "Program Code",
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
        label: "Program Name",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search name",
        sortAccessor: (row) => row.name || "",
        filterAccessor: (row) => row.name || "",
        className: "min-w-[260px]",
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
        className: "min-w-[280px]",
        render: (row) => (
          <span className="line-clamp-2 text-sm text-slate-600">
            {row.description || "No description"}
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
                onClick: () => setSearchParams({ modal: "view-program", id: row._id }),
              },
              {
                key: "update",
                label: "Update",
                onClick: () => setSearchParams({ modal: "edit-program", id: row._id }),
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

  const tableToolbarActions = (
    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
      <Button
        variant="primary"
        onClick={() => setSearchParams({ modal: "create-program" })}
        className="whitespace-nowrap text-sm"
      >
        <FaPlus />
        <span className="hidden sm:inline">Add Program</span>
        <span className="sm:hidden">Add</span>
      </Button>
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
  );

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-3xl font-bold">Programs</h1>
        <HoverHelpTooltip
          text={`Organize and manage your ${learnersTerm.toLowerCase()} programs.`}
          
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
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
            />
          </div>
        </div>

      </div>
      {isLoading ? (
        <TableSkeletonClean columns={programTableColumns} rows={10} />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error loading programs
        </div>
      ) : programRows.length === 0 ? (
        <TableEmptyState
          title="Create Your First Program"
          description="Start by creating a program. Programs help organize your academic offerings."
          colSpan={4}
        />
      ) : (
        <GroupedDataTable
          groups={tableGroups}
          columns={tableColumns}
          rowKey={(row) => row._id}
          tableMinWidthClassName="min-w-[980px]"
          showPagination={false}
          cardless
          showGroupHeader={false}
          onRowClick={(row) => setSearchParams({ modal: "view-program", id: row._id })}
          toolbarRight={tableToolbarActions}
          emptyFilteredText="No matching programs found."
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
      {(modal === "create-program" || modal === "edit-program") && (
        <UpsertProgramModal isOpen={true} onClose={() => setSearchParams({})} />
      )}
      {modal === "view-program" && (
        <ViewProgramModal isOpen={true} onClose={() => setSearchParams({})} />
      )}
      {programToDelete && (
        <DeleteProgramModal
          isOpen={true}
          onClose={() => setProgramToDelete(null)}
          programId={programToDelete.id}
          programName={programToDelete.name}
        />
      )}
    </div>
  );
}
