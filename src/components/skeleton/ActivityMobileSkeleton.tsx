export default function ActivityMobileSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {/* User info skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      {/* Action badge skeleton */}
      <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      
      {/* Description skeleton */}
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      
      {/* Path skeleton */}
      <div className="flex items-center space-x-2 mt-2">
        <div className="text-xs text-gray-400 w-10">Path:</div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
      
      {/* Method badge skeleton */}
      <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
      
      {/* Time skeleton */}
      <div className="h-3 bg-gray-200 rounded w-1/3 mt-2"></div>
    </div>
  );
}
