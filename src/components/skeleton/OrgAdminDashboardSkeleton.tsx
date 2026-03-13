import DashboardHeader from "../common/DashboardHeader";
import StatCard from "../common/StatCard";

export default function OrgAdminDashboardSkeleton() {
  return (
    <div className="bg-gray-50">
      {/* Dashboard Header Skeleton */}
      <DashboardHeader
        statCard={
          <div className="flex gap-2 lg:gap-4">
            <StatCard label="" value={0} icon="courses" loading={true} />
            <StatCard label="" value={0} icon="students" loading={true} />
          </div>
        }
      />

      {/* Main Layout */}
      <div className="w-full p-4">
        {/* Main Panel - Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white border rounded-lg p-6 h-32 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="bg-gray-200 h-6 w-24 rounded"></div>
                <div className="bg-gray-200 h-8 w-8 rounded-full"></div>
              </div>
              <div className="bg-gray-200 h-8 w-16 rounded"></div>
            </div>
          ))}
        </div>

        {/* Section Chart and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border rounded-lg p-4 h-[300px] md:h-[440px] animate-pulse">
            <div className="mb-1">
              <div className="bg-gray-200 h-6 w-48 rounded"></div>
              <div className="bg-gray-200 h-4 w-64 mt-2 rounded"></div>
            </div>
            <div className="h-[calc(100%-2rem)] bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white border rounded-lg p-6 h-[300px] md:h-[440px] animate-pulse flex flex-col justify-center">
            <div className="bg-gray-200 h-6 w-32 rounded mb-4"></div>
            <div className="flex flex-col items-center">
              <div className="bg-gray-200 w-56 h-56 rounded-full mb-4"></div>
              <div className="space-y-2 w-full">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="bg-gray-200 w-3 h-3 rounded-full mr-2"></div>
                      <div className="bg-gray-200 h-4 w-24 rounded"></div>
                    </div>
                    <div className="bg-gray-200 h-4 w-12 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white border rounded-xl p-6 flex flex-col animate-pulse"
            >
              <div className="bg-gray-200 h-6 w-40 rounded mb-4"></div>
              <div className="flex-1 space-y-3 mb-4">
                {[...Array(3)].map((_, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between"
                  >
                    <div className="bg-gray-200 h-4 w-32 rounded"></div>
                    <div className="bg-gray-200 h-6 w-24 rounded-full"></div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-200 h-10 w-full rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
