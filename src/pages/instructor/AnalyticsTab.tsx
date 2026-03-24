import { useLocation } from "react-router-dom";
import GradeChart from "../../components/instructor/GradeChart";
import { useSectionAnalytics } from "../../hooks/useSection";
import { FaUser } from "react-icons/fa";
import AnalyticsTabSkeleton from "../../components/skeleton/AnalyticsTabSkeleton";

interface IStudentGrade {
  id: string;
  name: string;
  avatar: string;
  finalGrade: string;
  assignmentAverage: string;
  quizAverage: string;
  attendance: string;
  finalExam: string;
}

export default function AnalyticsTab() {
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4];
  const { data, isPending, isError } = useSectionAnalytics(sectionCode);

  // Handle loading state
  if (isPending) {
    return <AnalyticsTabSkeleton />;
  }

  // Define fallback data for error state
  const fallbackData = {
    totalStudentsEnrolled: "N/A",
    averageFinalGrade: "N/A",
    topGradesPercent: "N/A",
    gradeData: [{}],
    individualGrades: [],
  };

  // Use actual data if no error, otherwise use fallback
  const {
    totalStudentsEnrolled,
    averageFinalGrade,
    topGradesPercent,
    gradeData,
    individualGrades,
  } = isError ? fallbackData : data.data;

  return (
    <div className="p-2 sm:p-6 space-y-6">
      <div className="flex gap-2 items-center">
        <div className="w-1.5 h-8 bg-secondary"></div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Grade Distribution Graph
        </h1>
      </div>

      {isError && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          <p>Failed to load grade data. Please try again later.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col gap-4 w-full sm:w-1/3">
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg space-y-2">
            <div className="text-xs sm:text-sm text-gray-600">
              Total Students Enrolled
            </div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-500">
              {totalStudentsEnrolled}
            </div>
          </div>

          <div className="bg-[#F4F6FAFF] p-4 sm:p-6 rounded-lg space-y-2">
            <div className="text-xs sm:text-sm text-gray-600">
              Average Final Grade
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#3E5B93FF]">
              {averageFinalGrade}
            </div>
          </div>

          <div className="bg-[#F8FBEEFF] p-4 sm:p-6 rounded-lg space-y-2">
            <div className="text-xs sm:text-sm text-gray-600">
              % of Students with 1 or 1.5
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#5F751DFF]">
              {topGradesPercent}
            </div>
          </div>
        </div>

        <div className="w-full sm:w-2/3">
          <GradeChart data={gradeData[0]} />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-1.5 h-8 bg-secondary"></div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Individual Student Grades
        </h1>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full min-w-[600px] sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Student Name
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Final Grade
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Assignment Avg
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Quiz Avg
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Attendance
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Exam
              </th>
            </tr>
          </thead>
          <tbody>
            {individualGrades?.length > 0 ? (
              individualGrades.map((student: IStudentGrade) => (
                <tr
                  key={student.id}
                  className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                >
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden bg-gray-100">
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUser className="w-full h-full p-1 sm:p-1.5 text-gray-400" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-900">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.finalGrade ? (
                      student.finalGrade
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.assignmentAverage ? (
                      student.assignmentAverage
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.quizAverage ? (
                      student.quizAverage
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.attendance ? (
                      student.attendance
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.finalExam ? (
                      student.finalExam
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500"
                >
                  No student grades available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
