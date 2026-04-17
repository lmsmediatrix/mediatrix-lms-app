import { useSearchParams } from "react-router-dom";
import StudentModal from "../../components/student/StudentModal";

import EmptyStudentsState from "../../components/instructor/EmptyStudentsState";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import {
  useExportSectionStudent,
  useSectionStudent,
} from "../../hooks/useSection";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";
import StudentsTabSkeleton from "../../components/skeleton/StudentsTabSkeleton";
import { IStudent } from "../../types/interfaces";
import Button from "../../components/common/Button";
import { BiExport } from "react-icons/bi";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import { useState } from "react";

interface StudentsTabProps {
  sectionCode: string;
}

type StudentProgress = {
  percent?: number;
};

export default function StudentsTab({ sectionCode }: StudentsTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [skipLimit, setSkipLimit] = useState({
    skip: Number(searchParams.get("page") || "1") - 1,
    limit: 8,
  });
  const { data: studentData, isPending } = useSectionStudent({
    sectionCode,
    skip: skipLimit.skip,
    limit: skipLimit.limit,
    withPagination: true,
  });
  const { data: performanceData } = useGetPerformanceDashboard(sectionCode);
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const studentId = searchParams.get("studentId");
  const exportStudents = useExportSectionStudent();

  const learnerTerm = getTerm("learner", orgType, true);
  const groupTerm = getTerm("group", orgType);
  const completionMap = new Map<string, StudentProgress>(
    (performanceData?.students || []).map(
      (student: any) =>
        [student._id, student.progress ?? {}] as [string, StudentProgress],
    ),
  );
  const columnCount = orgType === "school" ? 5 : 4;

  if (isPending || !studentData) return <StudentsTabSkeleton />;
  const students = studentData?.data?.student;

  const exportToCSV = () => {
    exportToCSVUtil({
      mutationFn: async (sectionCode) => {
        return await exportStudents.mutateAsync(sectionCode);
      },
      mutationParams: sectionCode,
      filenamePrefix: `1bislms-${sectionCode}-students`,
      toastMessages: {
        pending: `Exporting ${learnerTerm.toLowerCase()} data to CSV...`,
        success: `Successfully exported ${learnerTerm.toLowerCase()} data to CSV`,
        error: `Failed to export ${learnerTerm.toLowerCase()} data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  // const handleSearchChange = (search: string) => {
  //   setSearchTerm(search);
  //   setSearchParams((prev) => {
  //     const newParams = new URLSearchParams(prev);
  //     if (search) {
  //       newParams.set("search", search);
  //     } else {
  //       newParams.delete("search");
  //     }
  //     return newParams;
  //   });
  // };

  const handlePageChange = (newSkip: number) => {
    setSkipLimit((prev) => ({
      ...prev,
      skip: newSkip,
    }));
    setSearchParams((prev) => {
      prev.set("page", String(newSkip + 1));
      return prev;
    });
  };

  return (
    <div className="md:p-4">
      {studentId && <StudentModal />}

      <div className="flex justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold ">{learnerTerm} List</h2>
          <p className="text-gray-600 text-sm md:text-lg">
            ({students?.length})
          </p>
          {/* <input
            type="text"
            placeholder={`Search ${learnerTerm.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 md:max-w-[400px] px-4 py-2.5 h-[42px] border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-base md:text-sm"
          /> */}
        </div>
        <div className="">
          <Button onClick={exportToCSV} variant="primary">
            <BiExport /> <span className="hidden md:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg  overflow-auto">
        <table className="w-full min-w-[600px] ">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB] border-r border-gray-200">
                {learnerTerm}
              </th>
              {orgType === "school" && (
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB] border-r border-gray-200">
                  Program
                </th>
              )}
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB] border-r border-gray-200">
                Email
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB] border-r border-gray-200">
                Completion
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map((student: IStudent) => (
                <tr
                  key={student._id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4 border-r border-gray-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={`${student.firstName} ${student.lastName}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium text-xs sm:text-sm">
                            {student.firstName?.[0]}
                            {student.lastName?.[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {student.firstName} {student.lastName}
                      </span>
                    </div>
                  </td>
                  {orgType === "school" && (
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 border-r border-gray-200 truncate">
                      {student.program?.name}
                    </td>
                  )}
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 border-r border-gray-200 truncate">
                    {student.email}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 border-r border-gray-200">
                    {completionMap.get(student._id) ? (
                      (() => {
                        const progress = completionMap.get(student._id);
                        const percent = Math.round(progress?.percent || 0);
                        const barColor =
                          percent === 100
                            ? "bg-green-500"
                            : percent >= 50
                              ? "bg-blue-500"
                              : "bg-gray-400";
                        return (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {percent}%
                            </span>
                            {percent === 100 && (
                              <span className="text-[10px] font-semibold text-green-600">
                                Completed
                              </span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-blue-600">
                    <button
                      onClick={() =>
                        setSearchParams({
                          studentId: student._id,
                          tab: "students",
                        })
                      }
                      className="hover:text-blue-800 whitespace-nowrap"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="py-8">
                  <EmptyStudentsState
                    learnersLabel={learnerTerm}
                    groupLabel={groupTerm}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
        <span>
          {studentData?.data.pagination?.totalItems || 0} result
          {studentData?.data.pagination?.totalItems !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => handlePageChange(skipLimit.skip - 1)}
            disabled={!studentData?.data.pagination?.hasPreviousPage}
            className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
              !studentData?.data.pagination?.hasPreviousPage
                ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
            }`}
          >
            Previous
          </button>

          <span className="px-4 py-2 bg-gray-100 rounded-md font-medium">
            Page {studentData?.data.pagination?.currentPage} of{" "}
            {studentData?.data.pagination?.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(skipLimit.skip + 1)}
            disabled={!studentData?.data.pagination?.hasNextPage}
            className={`px-4 py-2 rounded-md border border-[#60B2F0] transition-all duration-300 ${
              !studentData?.data.pagination?.hasNextPage
                ? "opacity-50 cursor-not-allowed border-gray-300 text-gray-400"
                : "text-[#60B2F0] hover:bg-[#60B2F0] hover:text-white"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
