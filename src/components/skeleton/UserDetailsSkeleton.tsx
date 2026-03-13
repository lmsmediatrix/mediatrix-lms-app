// Skeleton for Instructor Details (only the top section)
export default function UserDetailsSkeleton() {
  return (
    <div className="flex-1 border rounded-xl p-6 space-y-8 h-fit">
      <div className="flex items-start space-x-4">
        <div className="w-28 h-28 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex justify-between flex-1">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded mt-2 animate-pulse" />
            <div className="mt-2 flex space-x-2">
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-6 w-32 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
      <div>
        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
        <div className="mt-2 h-24 w-full bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-5 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded mt-1 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
