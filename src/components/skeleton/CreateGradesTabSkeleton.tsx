export default function CreateGradesTabSkeleton() {
  return (
    <div className="bg-white md:shadow rounded-lg max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex justify-between border-b p-4">
        <div className="flex gap-2 items-center">
          <div className="bg-gray-300 w-2 h-8 md:h-12" />
          <div className="h-6 md:h-8 w-40 bg-gray-300 rounded" />
        </div>
      </div>

      {/* Form Skeleton */}
      <div className="space-y-6 py-2 md:p-6">
        <div className="space-y-4">
          {/* Grading Method and Total Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-24 bg-gray-300 rounded mb-2" />
              <div className="h-10 w-full bg-gray-300 rounded" />
            </div>
            <div>
              <div className="h-4 w-32 bg-gray-300 rounded mb-2" />
              <div className="flex items-center gap-4">
                <div className="h-6 w-12 bg-gray-300 rounded" />
                <div className="h-4 w-48 bg-gray-300 rounded" />
              </div>
            </div>
          </div>

          {/* Grades Distribution */}
          <div>
            <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-4 w-36 bg-gray-300 rounded mb-2" />
                <div className="h-10 w-full bg-gray-300 rounded" />
              </div>
              <div>
                <div className="h-4 w-36 bg-gray-300 rounded mb-2" />
                <div className="h-10 w-full bg-gray-300 rounded" />
              </div>
            </div>

            {/* Categories Table */}
            <div className="space-y-4 mt-4">
              <div className="w-full rounded-lg border border-gray-200">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 w-[50%]">
                        <div className="h-4 w-20 bg-gray-300 rounded" />
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 w-[40%]">
                        <div className="h-4 w-20 bg-gray-300 rounded" />
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 w-[10%]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 bg-white"
                      >
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          <div className="h-10 w-full bg-gray-300 rounded" />
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          <div className="h-10 w-full bg-gray-300 rounded" />
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-3 text-center">
                          <div className="h-6 w-6 bg-gray-300 rounded-full mx-auto" />
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 md:py-4 px-2 md:px-4">
                        <div className="h-10 w-full md:w-40 bg-gray-300 rounded" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grading Scale */}
            <div className="space-y-4 mt-4">
              <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
              <div className="w-full rounded-lg border border-gray-200">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 w-[30%]">
                        <div className="h-4 w-20 bg-gray-300 rounded" />
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 w-[60%]">
                        <div className="h-4 w-20 bg-gray-300 rounded" />
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 w-[10%]" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 bg-white"
                      >
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          <div className="h-10 w-full bg-gray-300 rounded" />
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-10 w-[45%] bg-gray-300 rounded" />
                            <span>-</span>
                            <div className="h-10 w-[45%] bg-gray-300 rounded" />
                          </div>
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-3 text-center">
                          <div className="flex justify-center gap-2">
                            <div className="h-6 w-6 bg-gray-300 rounded-full" />
                            <div className="h-6 w-6 bg-gray-300 rounded-full" />
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 md:py-4 px-2 md:px-4">
                        <div className="h-10 w-full md:w-40 bg-gray-300 rounded" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="border-t flex justify-between p-2 md:p-4">
        <div className="h-10 w-24 bg-gray-300 rounded" />
        <div className="h-10 w-24 bg-gray-300 rounded" />
      </div>
    </div>
  );
}
