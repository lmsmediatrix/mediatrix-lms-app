
export default function AssessmentTabSkeleton() {
  return (
    <div className="">
      <div className="overflow-x-auto rounded-lg border border-gray-200 animate-pulse">
        <table className="w-full border-collapse min-w-[500px]">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="py-3 sm:py-4 px-3 sm:px-6 w-[20%] sm:w-[25%]">
                <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-6 w-[20%] sm:w-[20%]">
                <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-6 w-[40%] sm:w-[35%]">
                <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-3 sm:py-4 px-3 sm:px-6 w-[20%] sm:w-[20%]">
                <div className="w-24 sm:w-28 h-3 sm:h-4 bg-gray-300 rounded" />
              </th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {[...Array(2)].map((_, index) => (
              <tr key={index} className="border-b border-gray-200 bg-white">
                {/* Due Date Column */}
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-300 rounded" />
                </td>
                {/* Type Column */}
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-300 rounded" />
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full" />
                  </div>
                </td>
                {/* Title Column */}
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full" />
                    <div className="w-32 sm:w-40 h-3 sm:h-4 bg-gray-300 rounded" />
                  </div>
                </td>
                {/* Number of Items Column */}
                <td className="py-3 sm:py-4 px-3 sm:px-6">
                  <div className="w-28 sm:w-32 h-3 sm:h-4 bg-gray-300 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}