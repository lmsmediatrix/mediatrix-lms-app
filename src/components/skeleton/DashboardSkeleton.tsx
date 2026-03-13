import DashboardHeader from "../common/DashboardHeader";
import StatCard from "../common/StatCard";

export default function DashboardSkeleton() {
  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden">
      <DashboardHeader
        statCard={
          <div className="flex gap-2 lg:gap-4">
            <StatCard label="" value={0} icon="courses" loading={true} />
            <StatCard label="" value={0} icon="students" loading={true} />
          </div>
        }
      />

      {/* Main Layout */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] max-w-[1400px] mx-auto w-full p-4">
        {/* Main Panel Skeleton */}
        <div className="p-0 lg:p-4">
          {/* Student Summary Section */}
          <div className="flex items-center justify-between py-4 lg:py-8">
            <div className="h-6 w-40 lg:h-8 lg:w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="h-24 lg:h-28 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-24 lg:h-28 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-24 lg:h-28 bg-gray-200 rounded-lg animate-pulse hidden lg:block" />
          </div>

          {/* Side Panel in Mobile View */}
          <div className="lg:hidden pt-4">
            <div className="space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mt-4" />
              <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* My Sections Section */}
          <div className="flex items-center justify-between py-4 lg:py-8">
            <div className="h-6 w-40 lg:h-8 lg:w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-20 lg:h-6 lg:w-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            <div className="h-40 lg:h-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-40 lg:h-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-40 lg:h-48 bg-gray-200 rounded-lg animate-pulse hidden xl:block" />
          </div>
        </div>

        {/* Side Panel in Desktop View */}
        <div className="hidden lg:block min-h-screen bg-white p-4 w-full lg:w-[300px]">
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mt-4" />
            <div className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}