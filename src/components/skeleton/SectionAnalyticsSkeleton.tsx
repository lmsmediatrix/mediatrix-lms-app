export default function SectionAnalyticsSkeleton() {
  return (
    <div className="bg-white border rounded-xl p-6 mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="bg-gray-200 h-6 w-48 rounded animate-pulse"></div>
          <div className="bg-gray-200 h-4 w-64 mt-2 rounded animate-pulse"></div>
        </div>
        <div className="w-full md:w-72">
          <div className="bg-gray-200 h-10 w-full rounded animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-[300px] md:h-[400px] bg-gray-200 rounded animate-pulse"></div>
        <div className="flex flex-col justify-center h-[300px] md:h-[400px]">
          <div className="bg-gray-200 h-6 w-32 rounded mb-4 animate-pulse"></div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-200 w-56 h-56 rounded-full mb-4 animate-pulse"></div>
            <div className="space-y-2 w-full">
              {[...Array(3)].map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between animate-pulse"
                >
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
    </div>
  );
}
