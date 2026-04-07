import Button from "../../components/common/Button";
import { FaPlus } from "react-icons/fa";
import { Navigate, useSearchParams } from "react-router-dom";
import { useCategories } from "../../hooks/useCategory";
import { useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import TableEmptyState from "../../components/common/TableEmptyState";
import FilterDropdownButton from "../../components/orgAdmin/FilterDropdownButton";
import ResponsiveFilterButton from "../../components/orgAdmin/ResponsiveFilterButton";
import UpsertCategoryModal from "../../components/orgAdmin/UpsertCategoryModal";
import ViewCategoryModal from "../../components/orgAdmin/ViewCategoryModal";
import DeleteCategoryModal from "../../components/orgAdmin/DeleteCategoryModal";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useDebounce } from "../../hooks/useDebounce";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";

const CATEGORY_STATUS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

interface CategoryToDelete {
  id: string;
  name: string;
}

type CategoryTableRow = {
  _id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
};

export default function CategoryPage() {
  const { currentUser } = useAuth();
  const isCorporate = currentUser.user.organization.type === "corporate";
  const orgCode = currentUser.user.organization.code;

  if (isCorporate) {
    return <Navigate to={`/${orgCode}/admin/course`} replace />;
  }

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<string>(
    searchParams.get("status") || "" // No default filter
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
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryToDelete | null>(null);

  const { data, isLoading, isError } = useCategories({
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

  const handleDeleteClick = (category: any) => {
    setCategoryToDelete({
      id: category._id,
      name: category.name,
    });
  };

  // Skeleton configuration for categories
  const categoryTableColumns = [
    { width: "40%" }, // Category Name
    { width: "20%" }, // Status
    { width: "20%" }, // Created
    { width: "20%", alignment: "center" as const }, // Actions
  ];

  const categoryRows = useMemo(
    () => ((data?.categories || []) as CategoryTableRow[]),
    [data?.categories],
  );

  const tableGroups = useMemo(
    (): GroupedTableGroup<CategoryTableRow>[] => [
      {
        key: "categories",
        title: "Categories",
        rows: categoryRows,
        badgeText: `${categoryRows.length} total`,
      },
    ],
    [categoryRows],
  );

  const tableColumns = useMemo(
    (): GroupedTableColumn<CategoryTableRow>[] => [
      {
        key: "name",
        label: "Category Name",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search category",
        sortAccessor: (row) => row.name || "",
        filterAccessor: (row) => row.name || "",
        className: "min-w-[260px]",
        render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>,
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search status",
        sortAccessor: (row) => (row.isActive ? "active" : "inactive"),
        filterAccessor: (row) => (row.isActive ? "active" : "inactive"),
        className: "min-w-[180px]",
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
        key: "createdAt",
        label: "Created",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search date",
        sortAccessor: (row) => new Date(row.createdAt || 0).getTime(),
        filterAccessor: (row) => new Date(row.createdAt || "").toLocaleDateString(),
        className: "min-w-[170px]",
        render: (row) => (
          <span className="text-sm text-slate-600">
            {new Date(row.createdAt).toLocaleDateString()}
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
                  setSearchParams({ modal: "view-category", id: row._id }),
              },
              {
                key: "update",
                label: "Update",
                onClick: () =>
                  setSearchParams({ modal: "edit-category", id: row._id }),
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

  return (
    <div className="pt-14 pb-6 px-6 lg:p-6">
      <h1 className="text-3xl font-bold">Categories</h1>
      <p className="text-gray-400">
        Organize and manage your course categories.
      </p>{" "}
      <div className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        {/* Search and Filter */}
        <div className="flex flex-col gap-3 md:flex-row md:flex-1 md:items-center md:gap-2 md:min-w-0">
          {/* Search Input and Mobile Filter Row */}
          <div className="flex gap-2 items-center flex-1 md:min-w-0">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
            />

            {/* Mobile Filter Button - Next to search on mobile, hidden on tablet+ */}
            <div className="md:hidden">
              <ResponsiveFilterButton
                filters={[
                  {
                    key: "status",
                    label: "Status",
                    value: selectedStatus,
                    options: CATEGORY_STATUS,
                    onChange: handleStatusChange,
                    placeholder: "All Status",
                  },
                ]}
                activeFiltersCount={selectedStatus ? 1 : 0}
              />
            </div>
          </div>

          {/* Desktop Filter Buttons - Hidden on mobile & tablet */}
          <div className="hidden xl:flex items-center gap-2 flex-shrink-0">
            {/* Status Filter Button */}
            <FilterDropdownButton
              label="Status"
              value={selectedStatus}
              options={CATEGORY_STATUS}
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
              filters={[
                {
                  key: "status",
                  label: "Status",
                  value: selectedStatus,
                  options: CATEGORY_STATUS,
                  onChange: handleStatusChange,
                  placeholder: "All Status",
                },
              ]}
              activeFiltersCount={selectedStatus ? 1 : 0}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setSearchParams({ modal: "create-category" })}
            className="whitespace-nowrap text-sm flex-1 md:flex-initial"
          >
            <FaPlus />
            <span className="hidden sm:inline">Add Category</span>
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
        <TableSkeletonClean columns={categoryTableColumns} rows={10} />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Error loading categories
        </div>
      ) : categoryRows.length === 0 ? (
        <TableEmptyState
          title="Create Your First Category"
          description="Start by creating a category. Categories help organize your courses."
          primaryActionLabel="Add Category"
          primaryActionPath="?modal=create-category"
          colSpan={4}
          type="category"
          isFiltered={Boolean(searchTerm || selectedStatus || archiveStatus !== "none")}
        />
      ) : (
        <GroupedDataTable
          groups={tableGroups}
          columns={tableColumns}
          rowKey={(row) => row._id}
          tableMinWidthClassName="min-w-[940px]"
          showPagination={false}
          cardless
          showGroupHeader={false}
          onRowClick={(row) =>
            setSearchParams({ modal: "view-category", id: row._id })
          }
          emptyFilteredText="No matching categories found."
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
      {(modal === "create-category" || modal === "edit-category") && (
        <UpsertCategoryModal
          isOpen={true}
          onClose={() => setSearchParams({})}
        />
      )}
      {modal === "view-category" && (
        <ViewCategoryModal isOpen={true} onClose={() => setSearchParams({})} />
      )}
      {categoryToDelete && (
        <DeleteCategoryModal
          isOpen={true}
          onClose={() => setCategoryToDelete(null)}
          categoryId={categoryToDelete.id}
          categoryName={categoryToDelete.name}
        />
      )}
    </div>
  );
}
