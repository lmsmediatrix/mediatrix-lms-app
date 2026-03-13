export const TableSkeleton = () => (
  <div className="w-full p-4 md:p-6 animate-pulse">
    <div className="mb-4 h-4 bg-gray-200 rounded w-1/3 md:w-1/4"></div>
    <div className="border rounded-md overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse table-fixed">
        <thead>
          <tr className="text-left text-gray-600 text-xs md:text-sm bg-gray-100 rounded-t-lg">
            <th className="p-3 md:p-4 w-1/3 md:w-1/5 sticky left-0 z-10 bg-gray-100">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </th>
            {[...Array(7)].map((_, index) => (
              <th key={index} className="p-3 md:p-4 w-[10%] md:w-[11%]">
                <div className="h-4 bg-gray-200 rounded mx-auto w-3/4"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {[...Array(5)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              <td className="py-3 px-3 md:py-3 md:pl-4 flex items-center gap-3 sticky left-0 z-10 bg-white">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-200 hidden md:block"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </td>
              {[...Array(7)].map((_, colIndex) => (
                <td key={colIndex} className="py-3 px-3 md:px-0">
                  <div className="h-4 bg-gray-200 rounded mx-auto w-1/4"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);