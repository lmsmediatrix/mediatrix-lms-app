
export default function LessonsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-10 px-8 animate-pulse">
      {/* Breadcrumbs Skeleton */}
      <div className="mb-6">
        <div className="h-4 w-40 bg-gray-200 rounded"></div>
      </div>

      {/* Title Skeleton */}
      <div className="h-9 w-1/2 bg-gray-200 rounded"></div>

      {/* Main Content Section Skeleton */}
      <div className="mt-6 w-full h-[400px] bg-gray-200 rounded-lg"></div>

      {/* Two Column Layout Skeleton */}
      <div className="mt-6 flex gap-4 bg-white border p-6">
        {/* Left Column - Instructions Skeleton */}
        <div className="flex-1 h-fit bg-gray-100 rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {/* Instructor Info Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex gap-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2">
              <div className="h-5 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-full bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
            </div>

            {/* Files Section Skeleton */}
            <div className="mt-4">
              <div className="h-5 w-24 bg-gray-200 rounded mb-4"></div>
              <div className="flex flex-wrap gap-4">
                {[...Array(3)].map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center w-40 gap-3 py-2 bg-gray-200 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    <div className="h-3 w-24 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}