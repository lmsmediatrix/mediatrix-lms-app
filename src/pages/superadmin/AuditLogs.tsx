import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useExportAuditLog, useSearchAudit } from "../../hooks/useAudit";
import Button from "../../components/common/Button";
import { BiExport } from "react-icons/bi";
import { IoSearchOutline } from "react-icons/io5";
import { formatDateTimeAgo } from "../../lib/dateUtils";
import ErrorDisplay from "../../components/ErrorHandler";
import ActivityTableSkeleton from "../../components/skeleton/ActivityTableSkeleton";
import ActivityMobileSkeleton from "../../components/skeleton/ActivityMobileSkeleton";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import { useDebounce } from "../../hooks/useDebounce";
import AuditLogDetailsModal from "../../components/common/AuditLogDetailsModal";

// Define interfaces for type safety
interface AuditLog {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  type: string;
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO";
  entity: {
    type: string;
    id: string;
  };
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  description: string;
  timestamp: string;
}

interface Pagination {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface AuditData {
  auditLogs: AuditLog[];
  pagination: Pagination;
  count: number;
}

export default function AuditLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [skipLimit, setSkipLimit] = useState({
    skip: Math.max(0, Number(searchParams.get("page") || "1") - 1) || 0,
    limit: 10,
  });
  const [exportError, setExportError] = useState<string | null>(null);
  const exportAudit = useExportAuditLog();
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

  // Update search params when debounced search term changes
  useEffect(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (debouncedSearchTerm) {
        newParams.set("search", debouncedSearchTerm);
      } else {
        newParams.delete("search");
      }
      return newParams;
    });
  }, [debouncedSearchTerm, setSearchParams]);

  const { data, isPending, isError, error, refetch } = useSearchAudit({
    searchTerm: debouncedSearchTerm,
    skip: skipLimit.skip,
    limit: skipLimit.limit,
  }) as {
    data: AuditData;
    isPending: boolean;
    isError: boolean;
    error: Error;
    refetch: () => void;
  };

  const handleSearchChange = useCallback((search: string) => {
    setSearchTerm(search);
  }, []);

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

  const exportToCSV = () => {
    setExportError(null);
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportAudit.mutateAsync(params);
      },
      mutationParams: {
        limit: skipLimit.limit,
        skip: skipLimit.skip,
        searchTerm: debouncedSearchTerm,
      },
      filenamePrefix: "1bislms-audit-logs",
      toastMessages: {
        pending: `Exporting audit logs to CSV...`,
        success: `Successfully exported audit logs to CSV`,
        error: `Failed to export audit logs to CSV`,
      },
      onError: (error) => {
        console.error("Export error:", error);
        setExportError("Failed to export audit logs. Please try again.");
      },
    });
  };

  return (
    <div className=" lg:py-6 py-12 px-4 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Audit Logs</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full md:w-auto"
            aria-label="Export audit logs to CSV"
          >
            <BiExport className="mr-2" /> Export
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-md">
          {exportError}
          <button
            onClick={exportToCSV}
            className="ml-2 text-sm underline hover:text-red-600"
            aria-label="Retry exporting audit logs"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
          <IoSearchOutline
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
          />
        </div>
        <input
          type="text"
          placeholder="Search audits..."
          aria-label="Search audit logs"
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm md:text-base shadow-sm"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="hidden md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  aria-label="User information"
                >
                  User
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  aria-label="Audit type"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  aria-label="Severity level"
                >
                  Severity
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  aria-label="Entity type"
                >
                  Entity
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  aria-label="Description"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider"
                  aria-label="Timestamp"
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isError ? (
                <tr>
                  <td colSpan={6} className="px-0 py-8">
                    <div className="max-w-2xl mx-auto transform transition-all duration-300 hover:scale-[1.01] px-4">
                      <ErrorDisplay error={error} onRetry={() => refetch()} />
                    </div>
                  </td>
                </tr>
              ) : isPending ? (
                Array(8)
                  .fill(0)
                  .map((_, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <ActivityTableSkeleton />
                      </td>
                    </tr>
                  ))
              ) : data?.auditLogs?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500 text-sm"
                  >
                    No audit logs found
                  </td>
                </tr>
              ) : (
                data?.auditLogs?.map((audit: AuditLog) => (
                  <tr
                    key={audit._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedAudit(audit)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {audit.user?.firstName} {audit.user?.lastName}
                        </div>
                        <div className="text-gray-500 truncate">{audit.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {audit.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          audit.severity === "HIGH"
                            ? " text-red-800"
                            : audit.severity === "MEDIUM"
                            ? " text-yellow-800"
                            : audit.severity === "INFO"
                            ? " text-blue-800"
                            : " text-green-800"
                        }`}
                      >
                        {audit.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">{audit.entity?.type}</td>
                    <td className="px-6 py-4 text-sm line-clamp-1">{audit.description}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate">
                      {formatDateTimeAgo(audit.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-gray-200">
          {isError ? (
            <div className="py-8 px-4 transform transition-all duration-300 hover:scale-[1.01]">
              <ErrorDisplay error={error} onRetry={() => refetch()} />
            </div>
          ) : isPending ? (
            Array(8)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="p-4 border-b border-gray-100">
                  <ActivityMobileSkeleton />
                </div>
              ))
          ) : data?.auditLogs?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No audit logs found
            </div>
          ) : (
            data?.auditLogs?.map((audit: AuditLog) => (
              <div
                key={audit._id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedAudit(audit)}
              >
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">
                      {audit.user?.firstName} {audit.user?.lastName}
                    </div>
                    <div className="text-gray-500">{audit.user?.email}</div>
                  </div>
                  <div>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {audit.type}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        audit.severity === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : audit.severity === "MEDIUM"
                          ? "bg-yellow-100 text-yellow-800"
                          : audit.severity === "INFO"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {audit.severity}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    Entity: {audit.entity?.type}
                  </div>
                  <div>{audit.description}</div>
                  <div className="text-gray-500">
                    {formatDateTimeAgo(audit.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!isPending && data?.pagination && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 text-sm text-gray-500 gap-4">
          <span>
            {data.pagination.totalItems} result
            {data.pagination.totalItems !== 1 ? "s" : ""}
          </span>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={() => handlePageChange(skipLimit.skip - 1)}
              disabled={!data.pagination.hasPreviousPage}
              className={`px-4 py-2 rounded-md border border-[#3E5B93] transition-all duration-300 w-full md:w-auto ${
                !data.pagination.hasPreviousPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#3E5B93] hover:bg-[#3E5B93] hover:text-white"
              }`}
              aria-label="Go to previous page"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-gray-100 rounded-md font-medium text-center">
              Page {data.pagination.currentPage} of {data.pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(skipLimit.skip + 1)}
              disabled={!data.pagination.hasNextPage}
              className={`px-4 py-2 rounded-md border border-[#3E5B93] transition-all duration-300 w-full md:w-auto ${
                !data.pagination.hasNextPage
                  ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                  : "text-[#3E5B93] hover:bg-[#3E5B93] hover:text-white"
              }`}
              aria-label="Go to next page"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedAudit && (
        <AuditLogDetailsModal
          isOpen={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
          audit={selectedAudit}
        />
      )}
    </div>
  );
}
