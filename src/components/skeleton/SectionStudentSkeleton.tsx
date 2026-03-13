import { FaUserPlus } from "react-icons/fa";

const SectionStudentsSkeleton = () => {
  // Simulate 5 placeholder student cards for the grid
  const skeletonCards = Array(5).fill(null);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h3 className="text-lg sm:text-xl font-semibold">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <span className="font-normal text-gray-400">
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse inline-block" />
          </span>
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            disabled
            className="bg-gray-200 text-transparent px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base justify-center animate-pulse"
          >
            <FaUserPlus className="text-sm text-gray-400" />
            <span className="h-4 w-24 bg-gray-200 rounded" />
          </button>
          <button
            disabled
            className="bg-gray-200 text-transparent px-3 sm:px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base justify-center animate-pulse"
          >
            <span className="h-4 w-24 bg-gray-200 rounded" />
          </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-h-[400px] overflow-y-auto">
        {skeletonCards.map((_, index) => (
          <div
            key={index}
            className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 animate-pulse"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0" />
            <div className="text-center flex-1">
              <p className="h-4 w-24 bg-gray-200 rounded mx-auto mb-2" />
              <p className="h-3 w-32 bg-gray-200 rounded mx-auto" />
            </div>
            <div className="p-2 rounded-full">
              <div className="w-4 h-4 bg-gray-200 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SectionStudentsSkeleton;
