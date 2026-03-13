
export default function GradeTabSkeleton() {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {/* Summary Section */}
      <div className="flex justify-between items-end text-sm text-gray-700">
        <div className="space-y-4">
          {/* Points from Quizzes Placeholder */}
          <div className="w-40 h-4 bg-gray-300 rounded" />
          {/* Points from Homework Placeholder */}
          <div className="w-40 h-4 bg-gray-300 rounded" />
        </div>
        {/* Average Grade Placeholder */}
        <div className="w-32 h-4 bg-gray-300 rounded" />
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-gray-100">
              <th className="py-4 px-4 text-left">
                <div className="w-28 h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-4 px-4 text-left">
                <div className="w-16 h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-4 px-4 text-left">
                <div className="w-20 h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-4 px-4 text-left">
                <div className="w-16 h-4 bg-gray-300 rounded" />
              </th>
              <th className="py-4 px-4 text-left">
                <div className="w-16 h-4 bg-gray-300 rounded" />
              </th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {[...Array(3)].map((_, index) => (
              <tr key={index} className="border-b border-gray-200">
                {/* Assessment Type Column */}
                <td className="py-4 px-4">
                  <div className="w-24 h-4 bg-gray-300 rounded" />
                </td>
                {/* Points Column */}
                <td className="py-4 px-4">
                  <div className="w-16 h-4 bg-gray-300 rounded" />
                </td>
                {/* Due Date Column */}
                <td className="py-4 px-4">
                  <div className="w-20 h-4 bg-gray-300 rounded" />
                </td>
                {/* Status Column */}
                <td className="py-4 px-4">
                  <div className="w-24 h-6 bg-gray-300 rounded-full" />
                </td>
                {/* Grade Column */}
                <td className="py-4 px-4">
                  <div className="w-12 h-4 bg-gray-300 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}