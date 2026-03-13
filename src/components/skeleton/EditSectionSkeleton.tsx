import { IoChevronDown } from "react-icons/io5";

export default function EditSectionSkeleton() {
  return (
    <div className="pt-16 pb-6 px-4 sm:px-6 lg:py-8 lg:px-8 animate-pulse">
      {/* Back Navigation Skeleton */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 rounded" />
          <div className="w-20 sm:w-24 h-4 bg-gray-200 rounded" />
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Cover Photo Section */}
        <div className="relative h-[200px] bg-gray-200" />

        {/* Profile Section */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 relative">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            {/* Instructor Info */}
            <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-200 rounded mb-1" />
                <div className="w-40 sm:w-48 h-6 sm:h-8 bg-gray-200 rounded mb-2" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="w-16 sm:w-20 h-5 sm:h-6 bg-gray-200 rounded-full" />
                  <div className="w-24 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded" />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="w-full sm:w-32 h-10 bg-gray-200 rounded-lg" />
          </div>
        </div>

        {/* Section Information */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8">
          <div className="space-y-6">
            {/* Section Information */}
            <div>
              <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-200 rounded mb-4" />
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                  {[1, 2].map((i) => (
                    <div key={i}>
                      <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded mb-1" />
                      <div className="w-24 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>

                <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded mt-6 mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-8">
                  {[1, 2].map((i) => (
                    <div key={i}>
                      <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded mb-1" />
                      <div className="w-24 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructor Details */}
            <div>
              <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-200 rounded mb-4" />
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map((i) => (
                    <div key={i}>
                      <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-200 rounded mb-1" />
                      <div className="w-24 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="order-first lg:order-last">
            <div className="w-24 sm:w-32 h-5 sm:h-6 bg-gray-200 rounded mb-4" />
            <div className="bg-gray-50 rounded-lg p-4 sm:p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="w-24 sm:w-32 h-3 sm:h-4 bg-gray-200 rounded mb-1" />
                  <div className="w-20 sm:w-24 h-6 sm:h-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Students Section */}
        <div className="p-4 sm:p-6 lg:p-8 border-t">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-200 rounded" />
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-28 h-10 bg-gray-200 rounded-lg" />
              <div className="w-full sm:w-32 h-10 bg-gray-200 rounded-lg" />
            </div>
          </div>

          {/* Student List */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="w-24 sm:w-32 h-4 sm:h-5 bg-gray-200 rounded mb-1" />
                  <div className="w-32 sm:w-48 h-3 sm:h-4 bg-gray-200 rounded" />
                </div>
                <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone Accordion */}
        <div className="p-4 sm:p-6 lg:p-8 border-t">
          <div className="bg-gray-100 rounded-lg border border-gray-200">
            {/* Accordion Header */}
            <div className="flex items-stretch w-full">
              <div className="flex-1 flex items-center gap-2 py-4 pl-4">
                {/* Chevron Icon Placeholder */}
                <IoChevronDown className="text-gray-300" />
                {/* Title Placeholder */}
                <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
