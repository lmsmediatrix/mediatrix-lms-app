// Skeleton for Sections
export default function SectionsSkeleton() {
  return (
    <div className="mt-6 border rounded-xl p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center space-x-2">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-28 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="border-b pb-4 last:border-b-0">
          <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex space-x-4">
            <div className="w-96 h-40 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}