import { IoChevronDown } from "react-icons/io5";

export default function AnnouncementTabSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Current Announcements Accordion */}
      <div className="bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
        {/* Accordion Header */}
        <div className="flex items-stretch w-full">
          <div className="flex-1 flex items-center gap-2 py-3 sm:py-4 pl-3 sm:pl-4">
            {/* Chevron Icon Placeholder */}
            <IoChevronDown />
            {/* Title Placeholder */}
            <div className="w-32 sm:w-40 h-3 sm:h-4 bg-gray-300 rounded" />
            {/* Subtitle Placeholder */}
            <div className="w-8 sm:w-10 h-3 sm:h-4 bg-gray-300 rounded" />
          </div>
        </div>
        {/* Accordion Content (Table) */}
        <div className="border-t border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse min-w-[500px]">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="py-3 sm:py-4 px-3 sm:px-4 w-[15%] sm:w-[20%]">
                    <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-300 rounded" />
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-4 w-[30%] sm:w-[35%]">
                    <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-300 rounded" />
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-4 w-[55%] sm:w-[45%]">
                    <div className="w-24 sm:w-32 h-3 sm:h-4 bg-gray-300 rounded" />
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {[...Array(2)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200 bg-white">
                    {/* Date Column */}
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-300 rounded" />
                    </td>
                    {/* Title Column */}
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full" />
                        <div className="w-32 sm:w-40 h-3 sm:h-4 bg-gray-300 rounded" />
                      </div>
                    </td>
                    {/* Message Summary Column */}
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="w-48 sm:w-64 h-3 sm:h-4 bg-gray-300 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Past Announcements Accordion */}
      <div className="bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
        {/* Accordion Header */}
        <div className="flex items-stretch w-full">
          <div className="flex-1 flex items-center gap-2 py-3 sm:py-4 pl-3 sm:pl-4">
            {/* Chevron Icon Placeholder */}
            < IoChevronDown />
            {/* Title Placeholder */}
            <div className="w-32 sm:w-40 h-3 sm:h-4 bg-gray-300 rounded" />
            {/* Subtitle Placeholder */}
            <div className="w-8 sm:w-10 h-3 sm:h-4 bg-gray-300 rounded" />
          </div>
        </div>
        {/* Accordion Content (Table) */}
        <div className="border-t border-gray-200 px-4 sm:px-6 md:px-8 py-3 sm:py-4">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse min-w-[500px]">
              {/* Table Header */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="py-3 sm:py-4 px-3 sm:px-4 w-[15%] sm:w-[20%]">
                    <div className="w-12 sm:w-16 h-3 sm:h-4 bg-gray-300 rounded" />
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-4 w-[30%] sm:w-[35%]">
                    <div className="w-16 sm:w-20 h-3 sm:h-4 bg-gray-300 rounded" />
                  </th>
                  <th className="py-3 sm:py-4 px-3 sm:px-4 w-[55%] sm:w-[45%]">
                    <div className="w-24 sm:w-32 h-3 sm:h-4 bg-gray-300 rounded" />
                  </th>
                </tr>
              </thead>
              {/* Table Body */}
              <tbody>
                {[...Array(2)].map((_, index) => (
                  <tr key={index} className="border-b border-gray-200 bg-white">
                    {/* Date Column */}
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="w-20 sm:w-24 h-3 sm:h-4 bg-gray-300 rounded" />
                    </td>
                    {/* Title Column */}
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full" />
                        <div className="w-32 sm:w-40 h-3 sm:h-4 bg-gray-300 rounded" />
                      </div>
                    </td>
                    {/* Message Summary Column */}
                    <td className="py-3 sm:py-4 px-3 sm:px-4">
                      <div className="w-48 sm:w-64 h-3 sm:h-4 bg-gray-300 rounded" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}