export default function ActivityTableSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="space-y-2">
            {/* User info skeleton */}
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        {/* Action badge skeleton */}
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        {/* Description skeleton */}
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
        {/* Path skeleton */}
        <div className="flex-1 hidden md:block">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
        {/* Method badge skeleton */}
        <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        {/* Time skeleton */}
        <div className="w-20 hidden md:block">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
}
