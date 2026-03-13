import { FaCalendarAlt } from "react-icons/fa";

const dayAbbr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyScheduleSkeleton() {
  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mb-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-200 animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-2">
        {dayAbbr.map((_, dayIndex) => (
          <div key={dayIndex} className="border rounded-lg bg-white">
            <div className="p-3 border-b">
              <div className="flex justify-between">
                <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
            <div className="p-2 max-h-[400px] overflow-y-auto space-y-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="p-3 rounded border bg-gray-100">
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mt-1" />
                    </div>
                    <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCalendarAlt className="h-3 w-3 text-gray-200" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
