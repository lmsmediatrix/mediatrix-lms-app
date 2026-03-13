import { FaUser } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";

export default function InstructorAssessmentSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-4 animate-pulse">
      {/* Header Section */}
      <div className="w-1/2 mb-8">
        <div className="h-8 w-3/4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
      </div>

      {/* Accordions */}
      <div className="space-y-4">
        {/* Submitted Accordion */}
        <div className="bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-stretch w-full">
            <div className="flex-1 flex items-center gap-2 py-4 pl-4">
              <IoChevronDown className="text-gray-300 text-lg" />
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
              <div className="h-4 w-12 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {[1, 2].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-16 py-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-xl" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-40 bg-gray-300 rounded"></div>
                    <div className="h-3 w-24 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-32 bg-gray-300 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Not Submitted Accordion */}
        <div className="bg-gray-100 rounded-lg border border-gray-200">
          <div className="flex items-stretch w-full">
            <div className="flex-1 flex items-center gap-2 py-4 pl-4">
              <IoChevronDown className="text-gray-300 text-lg" />
              <div className="h-4 w-32 bg-gray-300 rounded"></div>
              <div className="h-4 w-12 bg-gray-300 rounded"></div>
            </div>
          </div>
          <div className="border-t border-gray-200 divide-y divide-gray-200">
            {[1, 2].map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-16 py-4"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-400 text-xl" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="h-4 w-40 bg-gray-300 rounded"></div>
                    <div className="h-3 w-24 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="h-6 w-32 bg-gray-300 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}