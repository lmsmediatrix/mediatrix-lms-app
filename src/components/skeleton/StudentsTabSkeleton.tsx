import { BiExport } from "react-icons/bi";
import Button from "../common/Button";


export default function StudentsTabSkeleton() {
  return (
    <div className="animate-pulse p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Class List</h2>
        <div className="flex gap-2 items-center">

          <Button variant="primary" className="hidden md:flex">
            <BiExport /> Export
          </Button>
        </div>
      </div>
      {/* Header Section */}
      

      {/* Table Section */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          {/* Table Header */}
          <thead>
            <tr className="border-b border-gray-200 bg-[#F9FAFB]">
              <th className="px-6 py-4 text-left border-r border-gray-200">
                <div className="w-20 h-4 bg-gray-300 rounded" />
              </th>
              <th className="px-6 py-4 text-left border-r border-gray-200">
                <div className="w-20 h-4 bg-gray-300 rounded" />
              </th>
              <th className="px-6 py-4 text-left border-r border-gray-200">
                <div className="w-20 h-4 bg-gray-300 rounded" />
              </th>
              <th className="px-6 py-4 text-left">
                <div className="w-20 h-4 bg-gray-300 rounded" />
              </th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {[...Array(8)].map((_, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 last:border-b-0"
              > 
                {/* Student Column */}
                <td className="px-6 py-4 border-r border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-full" />
                    <div className="w-40 h-4 bg-gray-300 rounded" />
                  </div>
                </td>
                {/* Program Column */}
                <td className="px-6 py-4 border-r border-gray-200">
                  <div className="w-32 h-4 bg-gray-300 rounded" />
                </td>
                {/* Email Column */}
                <td className="px-6 py-4 border-r border-gray-200">
                  <div className="w-48 h-4 bg-gray-300 rounded" />
                </td>
                {/* Details Column */}
                <td className="px-6 py-4">
                  <div className="w-16 h-4 bg-gray-300 rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
