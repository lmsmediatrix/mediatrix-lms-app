import Button from "../../components/common/Button";
import Table from "../../components/common/Table";
import { FaPlus, FaEye } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { usePrograms } from "../../hooks/useProgram";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import TableEmptyState from "../../components/common/TableEmptyState";
import UpsertProgramModal from "../../components/orgAdmin/UpsertProgramModal";
import ViewProgramModal from "../../components/orgAdmin/ViewProgramModal";
import DeleteProgramModal from "../../components/orgAdmin/DeleteProgramModal";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useDebounce } from "../../hooks/useDebounce";

interface ProgramToDelete {
  id: string;
  name: string;
}

export default function ProgramPage() {
  const { currentUser } = useAuth();
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

  const columns = [
    { key: "code", header: "Program Code", width: "20%" },
    { key: "name", header: "Program Name", width: "35%" },
    { key: "description", header: "Description", width: "30%" },
    { key: "actions", header: "Actions", width: "15%" },
  ];

  // Skeleton configuration for programs
  const programTableColumns = [
    { width: "20%" }, // Program Code
    { width: "35%" }, // Program Name
    { width: "30%" }, // Description
    { width: "15%", alignment: "center" as const }, // Actions
  ];

  const renderTableRows = () => {
    if (isError) {
      return (
        <tr className="border-b border-gray-200">
          <td colSpan={4} className="py-4 px-4 text-center text-gray-500">
            Error loading programs
          </td>
        </tr>
      );
    }

    if (!data?.programs || data.programs.length === 0) {
      return (
        <TableEmptyState
          title="Create Your First Program"
          description="Start by creating a program. Programs help organize your academic offerings."
          primaryActionLabel="Add Program"
          primaryActionPath="?modal=create-program"
          colSpan={4}
        />
      );
    }

    return data.programs.map((program: any) => (
      <tr
        key={program._id}
        className={`border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
          archiveStatus === "only" ? "text-gray-500 line-through" : ""
        }`}
        onClick={() => setSearchParams({ modal: "view-program", id: program._id })}
      >
        <td className="py-4 px-4">
          <span className="font-semibold">{program.code}</span>
        </td>
        <td className="py-4 px-4">
          <span className="font-semibold">{program.name}</span>
        </td>
        <td className="py-4 px-4 text-gray-600">
          <span className="line-clamp-2">{program.description}</span>
        </td>
        <td className="py-4 px-4">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSearchParams({ modal: "view-program", id: program._id })
              }}
              className="p-2 rounded-full hover:bg-gray-100 text-primary"
              title="View Program Details"
            >
              <FaEye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (archiveStatus !== "only") {
                  setSearchParams({ modal: "edit-program", id: program._id });
                }
              }}
              className={`p-2 rounded-full ${
                archiveStatus === "only"
                  ? "cursor-not-allowed text-gray-400"
                  : "hover:bg-gray-100"
              }`}
              disabled={archiveStatus === "only"}
              title="Edit Program"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (archiveStatus !== "only") {
                  handleDeleteClick(program);
                }
              }}
              className={`p-2 rounded-full ${
                archiveStatus === "only"
                  ? "cursor-not-allowed text-gray-400"
                  : "hover:bg-gray-100 text-red-500"
              }`}
              disabled={archiveStatus === "only"}
              title="Delete Program"
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
      <h1 className="text-3xl font-bold">Programs</h1>
      <p className="text-gray-400">
        Organize and manage your student programs.
      </p>{" "}
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

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-program" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add Program</span>
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
        <TableSkeletonClean columns={programTableColumns} rows={10} />
      ) : (
        <Table columns={columns} scrollable={true} maxHeight="580px">
          {renderTableRows()}
        </Table>
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
