// components/skeletons/OrganizationPageSkeleton.tsx

import DashboardHeader from "../common/DashboardHeader";

export const TableRowSkeleton = () => (
  <div className="animate-pulse p-4 border-b md:table-row">
    <div className="flex flex-col gap-4 md:contents">
      <div className="md:td px-6 py-4">
        <div className="h-4 w-4 bg-gray-200 rounded"></div>
      </div>
      <div className="md:td px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="md:td px-6 py-4">
        <div className="h-4 w-48 bg-gray-200 rounded"></div>
      </div>
      <div className="md:td px-6 py-4">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
      </div>
      <div className="md:td px-6 py-4">
        <div className="h-4 w-16 bg-gray-200 rounded"></div>
      </div>
      <div className="md:td px-6 py-4">
        <div className="h-4 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

export const OrganizationPageSkeleton = () => {
  return (
    <div>
      <DashboardHeader coverPhoto="" noGreetings={true}>
        <div className="flex flex-col md:flex-row gap-6 items-center animate-pulse">
          <div className="h-[150px] w-full md:h-[200px] md:w-[200px] overflow-hidden rounded-lg bg-gray-200"></div>
          <div className="space-y-4 w-full">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="h-9 w-48 bg-gray-200 rounded"></div>
              <div className="h-6 w-6 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </DashboardHeader>

      <div className="max-w-6xl mx-auto py-8 md:py-14 px-4">
        <div className="flex flex-col md:flex-row justify-between mb-7 gap-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="h-10 w-full md:w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-full md:w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="hidden md:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[1, 2, 3, 4].map((index) => (
                  <TableRowSkeleton key={index} />
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};
