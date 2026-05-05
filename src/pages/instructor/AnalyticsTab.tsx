import { useState } from "react";
import { useLocation } from "react-router-dom";
import GradeChart from "../../components/instructor/GradeChart";
import { useSectionAnalytics } from "../../hooks/useSection";
import { FaUser } from "react-icons/fa";
import AnalyticsTabSkeleton from "../../components/skeleton/AnalyticsTabSkeleton";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";

interface IStudentGrade {
  id: string;
  name: string;
  avatar: string;
  finalGrade: string;
  finalPercentage?: string | null;
  assignmentAverage: string;
  quizAverage: string;
  attendance: string;
  finalExam: string;
  assessmentBreakdown?: Array<{
    assessmentId: string;
    title: string;
    type: string;
    score: number | null;
    totalPoints: number | null;
    percentage: number | null;
    attempted: boolean;
  }>;
  gradeComputation?: string | null;
  percentageComputation?: string | null;
  attendanceDetails?: {
    presentDays: number;
    totalDays: number;
  } | null;
  isPassed?: boolean | null;
}

export default function AnalyticsTab() {
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4];
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);
  const { data, isPending, isError } = useSectionAnalytics(sectionCode);
  const [selectedBreakdown, setSelectedBreakdown] = useState<IStudentGrade | null>(
    null,
  );

  // Handle loading state
  if (isPending) {
    return <AnalyticsTabSkeleton />;
  }

  // Define fallback data for error state
  const fallbackData = {
    totalStudentsEnrolled: "N/A",
    averageFinalGrade: "N/A",
    averageFinalPercentage: "N/A",
    topGradesPercent: "N/A",
    gradeData: [{}],
    individualGrades: [],
  };

  // Use actual data if no error, otherwise use fallback
  const {
    totalStudentsEnrolled,
    minPassingGrade,
    averageFinalGrade,
    averageFinalPercentage,
    topGradesPercent,
    gradeData,
    individualGrades,
  } = isError ? fallbackData : data.data;

  const passedCount = Array.isArray(individualGrades)
    ? individualGrades.filter((student: IStudentGrade) => student.isPassed === true)
        .length
    : 0;
  const assessedCount = Array.isArray(individualGrades)
    ? individualGrades.filter(
        (student: IStudentGrade) => student.finalGrade && student.finalGrade !== "--",
      ).length
    : 0;

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
              Total {learnersTerm} Enrolled
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
            <div className="text-xs text-gray-500">
              {averageFinalPercentage !== "N/A"
                ? `${averageFinalPercentage}% average percentage`
                : "N/A"}
            </div>
          </div>

          <div className="bg-[#F8FBEEFF] p-4 sm:p-6 rounded-lg space-y-2">
            <div className="text-xs sm:text-sm text-gray-600">
              % of {learnersTerm} with 1 or 1.5
            </div>
            <div className="text-xl sm:text-2xl font-bold text-[#5F751DFF]">
              {topGradesPercent}
            </div>
          </div>

          <div className="bg-[#EEF8F2] p-4 sm:p-6 rounded-lg space-y-2">
            <div className="text-xs sm:text-sm text-gray-600">
              Passed by Batch Policy{" "}
              {typeof minPassingGrade === "number"
                ? `(>= ${minPassingGrade}%)`
                : ""}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-700">
              {passedCount}/{assessedCount || totalStudentsEnrolled || 0}
            </div>
          </div>
        </div>

        <div className="w-full sm:w-2/3">
          <GradeChart data={gradeData[0]} learnersLabel={learnersTerm} />
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="w-1.5 h-8 bg-secondary"></div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Individual {learnerTerm} Grades
        </h1>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Final grade is computed as the average of available components:
        Assignment, Quiz, Exam, and Attendance (if attendance exists). Missing
        assessment attempts contribute failing defaults in the computation.
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full min-w-[600px] sm:min-w-0">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                {learnerTerm} Name
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Final Grade
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Final %
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
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                TNA Pass / Level-up
              </th>
              <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm text-gray-500 font-medium bg-[#F9FAFB]">
                Breakdown
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
                    {student.finalPercentage ? (
                      `${student.finalPercentage}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.assignmentAverage ? (
                      `${student.assignmentAverage}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.quizAverage ? (
                      `${student.quizAverage}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.attendance ? (
                      `${student.attendance}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                    {student.finalExam ? (
                      `${student.finalExam}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                    {student.isPassed === true ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        Passed / Eligible
                      </span>
                    ) : student.isPassed === false ? (
                      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
                        Not Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 align-top">
                    {student.gradeComputation || student.percentageComputation ? (
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        onClick={() => setSelectedBreakdown(student)}
                      >
                        View Formula
                      </button>
                    ) : (
                      <span className="text-xs text-primary">--</span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-gray-500"
                >
                  No {learnerTerm.toLowerCase()} grades available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBreakdown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          onClick={() => setSelectedBreakdown(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Final Grade Breakdown
                </p>
                <p className="text-xs text-slate-500">
                  {selectedBreakdown.name}
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => setSelectedBreakdown(null)}
              >
                Close
              </button>
            </div>

            <div className="mt-4 space-y-2 text-sm text-slate-700">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">Attendance breakdown</p>
                <p className="mt-1">
                  {selectedBreakdown.attendanceDetails
                    ? `${selectedBreakdown.attendanceDetails.presentDays}/${selectedBreakdown.attendanceDetails.totalDays} days (${selectedBreakdown.attendance || "--"}%)`
                    : "No attendance records yet"}
                </p>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-800">Assessment grades</p>
                {!selectedBreakdown.assessmentBreakdown ||
                selectedBreakdown.assessmentBreakdown.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-500">
                    No assessments found for this batch.
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {selectedBreakdown.assessmentBreakdown.map((item) => (
                      <div
                        key={item.assessmentId}
                        className="rounded border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
                      >
                        <p className="font-medium text-slate-800">
                          {item.title} ({item.type})
                        </p>
                        <p className="mt-0.5">
                          {item.attempted
                            ? `Score: ${item.score ?? "--"} / ${item.totalPoints ?? "--"} (${item.percentage ?? "--"}%)`
                            : "Not attempted"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedBreakdown.gradeComputation && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">Grade mapping</p>
                  <p className="mt-1">{selectedBreakdown.gradeComputation}</p>
                </div>
              )}
              {selectedBreakdown.percentageComputation && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="font-semibold text-slate-800">Percentage formula</p>
                  <p className="mt-1">{selectedBreakdown.percentageComputation}</p>
                </div>
              )}
              {!selectedBreakdown.gradeComputation &&
                !selectedBreakdown.percentageComputation && (
                  <p className="text-xs text-slate-500">No breakdown data available.</p>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
