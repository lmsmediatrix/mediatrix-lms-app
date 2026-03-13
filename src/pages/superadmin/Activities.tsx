import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useExportActivityLog,
  useSearchActivity,
} from "../../hooks/useActivity";
import Button from "../../components/common/Button";
import { BiExport } from "react-icons/bi";
import { IoSearchOutline } from "react-icons/io5";
import { formatDateTimeAgo } from "../../lib/dateUtils";
import ErrorDisplay from "../../components/ErrorHandler";
import ActivityTableSkeleton from "../../components/skeleton/ActivityTableSkeleton";
import ActivityMobileSkeleton from "../../components/skeleton/ActivityMobileSkeleton";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import ActivityLogDetailsModal from "../../components/common/ActivityLogDetailsModal";

export default function Activities() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [skipLimit, setSkipLimit] = useState({
    skip: Number(searchParams.get("page") || "1") - 1,
    limit: 10,
  });
  const exportActivity = useExportActivityLog();
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  const { data, isPending, isError, error, refetch } = useSearchActivity({
    searchTerm,
    skip: skipLimit.skip,
    limit: skipLimit.limit,
  });

  // Error handling is now integrated into the table structure

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

  const exportToCSV = () => {
    exportToCSVUtil({
      mutationFn: async (params) => {
        return await exportActivity.mutateAsync(params);
      },
      mutationParams: { limit: skipLimit.limit, skip: skipLimit.skip },
      filenamePrefix: "1bislms-activity-logs",
      toastMessages: {
        pending: `Exporting activity logs to CSV...`,
        success: `Successfully exported activity logs to CSV`,
        error: `Failed to export activity logs to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  return (
    <div className="py-12 lg:py-6 px-4 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between mb-6 md:mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Activity Logs</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="w-full md:w-auto"
          >
            <BiExport className="mr-2" /> Export
          </Button>
        </div>
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <IoSearchOutline className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search activities..."
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                  Path
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-primary uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isError ? (
                <tr>
                  <td colSpan={6} className="px-0 py-8">
                    <div className="max-w-2xl mx-auto transform transition-all duration-300 hover:scale-[1.01] px-4">
                      <ErrorDisplay
                        error={error as Error}
                        onRetry={() => refetch()}
                      />
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
              ) : data?.activityLogs?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500 text-sm"
                  >
                    No activities found
                  </td>
                </tr>
              ) : (
                data?.activityLogs?.map((activity: any) => (
                  <tr
                    key={activity._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {activity.userId?.firstName}{" "}
                          {activity.userId?.lastName}
                        </div>
                        <div className="text-gray-500 truncate">
                          {activity.userId?.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        {activity.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm line-clamp-1">
                      {activity.description}
                    </td>
                    <td className="px-6 py-4 text-sm">{activity.path}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          activity.method === "GET"
                            ? "bg-blue-100 text-blue-800"
                            : activity.method === "POST"
                            ? "bg-green-100 text-green-800"
                            : activity.method === "PUT"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {activity.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 truncate">
                      {formatDateTimeAgo(activity.createdAt)}
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
              <ErrorDisplay error={error as Error} onRetry={() => refetch()} />
            </div>
          ) : isPending ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <div key={index} className="p-4 border-b border-gray-100">
                  <ActivityMobileSkeleton />
                </div>
              ))
          ) : data?.activityLogs?.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No activities found
            </div>
          ) : (
            data?.activityLogs?.map((activity: any) => (
              <div
                key={activity._id}
                className="p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <div className="font-medium text-gray-900">
                      {activity.userId?.firstName} {activity.userId?.lastName}
                    </div>
                    <div className="text-gray-500">
                      {activity.userId?.email}
                    </div>
                  </div>
                  <div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      {activity.action}
                    </span>
                  </div>
                  <div>{activity.description}</div>
                  <div className="text-gray-600">Path: {activity.path}</div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        activity.method === "GET"
                          ? "bg-blue-100 text-blue-800"
                          : activity.method === "POST"
                          ? "bg-green-100 text-green-800"
                          : activity.method === "PUT"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {activity.method}
                    </span>
                  </div>
                  <div className="text-gray-500">
                    {formatDateTimeAgo(activity.createdAt)}
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
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedActivity && (
        <ActivityLogDetailsModal
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          activity={selectedActivity}
        />
      )}
    </div>
  );
}
