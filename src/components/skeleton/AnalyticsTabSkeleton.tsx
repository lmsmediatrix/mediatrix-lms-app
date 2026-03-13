import { FaUser } from "react-icons/fa";

export default function AnalyticsTabSkeleton() {
  return (
    <div className="md:p-6 space-y-4">
      {/* Header Skeleton */}
      <div className="flex gap-2 items-center">
        <div className="w-1.5 h-8 bg-secondary"></div>
        <h1 className="text-xl sm:text-2xl font-bold">Grade Distribution Graph</h1>
      </div>

      {/* Stats and Chart Section */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Stats Cards Skeleton */}
        <div className="flex flex-col gap-4 w-full sm:w-1/3">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 p-4 sm:p-6 rounded-lg space-y-4 animate-pulse"
            >
              <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded"></div>
              <div className="h-6 sm:h-8 w-16 sm:w-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="w-full sm:w-2/3 h-[400px] bg-gray-100 rounded-lg animate-pulse"></div>
      </div>

      {/* Individual Grades Header Skeleton */}
      <div className="flex gap-4 items-center">
        <div className="w-1.5 h-8 bg-secondary"></div>
        <h1 className="text-xl sm:text-2xl font-bold">Individual Student Grades</h1>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full min-w-[600px] sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200 bg-[#F9FAFB]">
              {[...Array(5)].map((_, index) => (
                <th
                  key={index}
                  className="px-4 sm:px-6 py-3 sm:py-4 text-left"
                >
                  <div className="h-3 sm:h-4 w-20 sm:w-24 bg-gray-200 rounded animate-pulse"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-200 last:border-b-0"
              >
                <td className="px-4 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gray-200 animate-pulse">
                      <FaUser className="w-full h-full p-1 sm:p-1.5 text-gray-200" />
                    </div>
                    <div className="h-3 sm:h-4 w-24 sm:w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </td>
                {[...Array(4)].map((_, colIndex) => (
                  <td key={colIndex} className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-200 rounded animate-pulse"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}