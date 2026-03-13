import { FaCalendarDays } from "react-icons/fa6";
import { IoPerson } from "react-icons/io5";
import { SiTarget } from "react-icons/si";

export default function SectionPageSkeleton() {
  return (
    <>
      {/* Title Skeleton */}
      <div className="h-8 w-full sm:w-1/2 md:w-1/3 bg-gray-200 rounded animate-pulse mb-6 md:mb-8" />

      {/* Main Content Card */}
      <div className="bg-white border rounded-lg shadow-sm">
        {/* Banner Skeleton */}
        <div className="w-full h-[150px] sm:h-[200px] bg-gray-200 animate-pulse rounded-t-lg" />

        {/* Course Info Section */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Description Column */}
            <div className="flex-grow flex flex-col">
              <div className="h-6 w-24 sm:w-32 bg-gray-200 rounded animate-pulse mb-2 sm:mb-4" />
              <div className="h-24 sm:h-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Instructor Info Column */}
            <div className="w-full md:w-1/5 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <IoPerson className="text-gray-300 text-lg" />
                <div className="h-5 w-24 sm:w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <SiTarget className="text-gray-300 text-lg" />
                <div className="h-5 w-28 sm:w-40 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <FaCalendarDays className="text-gray-300 text-lg" />
                <div className="flex flex-col gap-2">
                  <div className="h-5 w-24 sm:w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-16 sm:w-24 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}