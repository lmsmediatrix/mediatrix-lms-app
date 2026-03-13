
export default function ModuleTabSkeleton() {
  return (
    <div className="space-y-2 sm:space-y-4">
      {/* Render 2 skeleton accordions to simulate modules */}
      {[...Array(2)].map((_, index) => (
        <div key={index} className="bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
          {/* Accordion Header */}
          <div className="flex items-stretch w-full">
            <div className="flex-1 flex items-center gap-2 py-3 sm:py-4 pl-3 sm:pl-4">
              {/* Chevron Icon Placeholder */}
              <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full" />
              {/* Title Placeholder */}
              <div className="w-32 sm:w-40 h-3 sm:h-4 bg-gray-300 rounded" />
              {/* Subtitle Placeholder */}
              <div className="w-8 sm:w-10 h-3 sm:h-4 bg-gray-300 rounded" />
            </div>
          </div>
          {/* Accordion Content (Lessons) */}
          <div className="border-t border-gray-200">
            {/* Render 2 skeleton lessons per accordion */}
            {[...Array(2)].map((_, lessonIndex) => (
              <div
                key={lessonIndex}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 sm:px-12 p-3 sm:p-4 bg-white"
              >
                {/* Lesson Number Placeholder */}
                <div className="w-full sm:w-32 mb-2 sm:mb-0">
                  <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-300 rounded" />
                </div>
                {/* Lesson Title and Icon Placeholder */}
                <div className="flex items-center gap-2 sm:gap-3 flex-1 mb-2 sm:mb-0">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full" />
                  <div className="w-36 sm:w-48 h-3 sm:h-4 bg-gray-300 rounded" />
                </div>
                {/* Date Placeholder */}
                <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}