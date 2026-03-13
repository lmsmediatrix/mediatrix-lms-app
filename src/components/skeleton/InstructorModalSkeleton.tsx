export default function InstructorModalSkeleton() {
  return (
    <div className="space-y-6 w-full">
      {/* Avatar and Name Skeleton */}
      <div className="flex flex-col items-center text-center">
        <div className="w-24 h-24 rounded-full bg-gray-200 animate-pulse mb-3"></div>
        <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1"></div>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
      </div>

      {/* Contact Information Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 border border-gray-200 rounded-md p-3">
          <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Social Accounts Skeleton */}
      <div className="text-center">
        <div className="h-5 w-32 mx-auto bg-gray-200 rounded animate-pulse mb-3"></div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}