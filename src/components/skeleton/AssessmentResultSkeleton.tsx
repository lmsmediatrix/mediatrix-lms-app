export default function AssessmentResultSkeleton() {
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4 sm:px-6 lg:px-8 relative animate-pulse">
      <div className="w-full max-w-4xl">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 sm:p-8 border-t-8 border-gray-300">
            <div className="flex flex-col items-center mb-6">
              {/* Logo Placeholder */}
              <div className="h-16 sm:h-20 w-32 bg-gray-300 rounded mb-4"></div>
              {/* Organization Name Placeholder */}
              <div className="h-6 sm:h-7 w-48 bg-gray-300 rounded mb-2"></div>
              {/* Assessment Title Placeholder */}
              <div className="h-8 sm:h-9 w-64 bg-gray-300 rounded mb-2"></div>
              {/* Description Placeholder */}
              <div className="h-5 w-80 bg-gray-300 rounded mt-2"></div>
            </div>
            <div className="bg-gray-50 rounded-md p-4 sm:p-6 border border-gray-200">
              {/* Assessment Details Title Placeholder */}
              <div className="h-6 w-1/3 bg-gray-300 rounded mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="flex flex-col">
                    <div className="h-4 w-24 bg-gray-300 rounded mb-1"></div>
                    <div className="h-4 w-36 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
              {/* Start Button Placeholder */}
              <div className="mt-6 flex justify-end">
                <div className="h-10 w-32 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}