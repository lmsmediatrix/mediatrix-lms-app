import { useState } from "react";
import { useLocation } from "react-router-dom";
import GradeChart from "../../components/instructor/GradeChart";
import { useSectionAnalytics } from "../../hooks/useSection";
import { FaUser } from "react-icons/fa";
import AnalyticsTabSkeleton from "../../components/skeleton/AnalyticsTabSkeleton";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import Button from "../../components/common/Button";
import FinalGradeBreakdownModal from "../../components/common/FinalGradeBreakdownModal";
import { FiDownload } from "react-icons/fi";
import { toast } from "react-toastify";
import { generateTimestamp } from "../../lib/dateUtils";

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
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

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

  const buildAssessmentBreakdownText = (student: IStudentGrade): string => {
    if (
      !Array.isArray(student.assessmentBreakdown) ||
      student.assessmentBreakdown.length === 0
    ) {
      return "No assessment breakdown";
    }

    return student.assessmentBreakdown
      .map((item) => {
        if (!item.attempted) {
          return `${item.title} (${item.type}): Not attempted`;
        }
        return `${item.title} (${item.type}): ${item.score ?? "--"}/${item.totalPoints ?? "--"} (${item.percentage ?? "--"}%)`;
      })
      .join(" | ");
  };

  const buildAttendanceBreakdownText = (student: IStudentGrade): string =>
    student.attendanceDetails
      ? `${student.attendanceDetails.presentDays}/${student.attendanceDetails.totalDays} days (${student.attendance || "--"}%)`
      : "No attendance records yet";

  const exportRows = (Array.isArray(individualGrades) ? individualGrades : []).map(
    (student: IStudentGrade) => ({
      [`${learnerTerm} Name`]: student.name || "--",
      "Final Grade": student.finalGrade || "--",
      "Final %": student.finalPercentage ? `${student.finalPercentage}%` : "--",
      "Assignment Avg": student.assignmentAverage ? `${student.assignmentAverage}%` : "--",
      "Quiz Avg": student.quizAverage ? `${student.quizAverage}%` : "--",
      Attendance: student.attendance ? `${student.attendance}%` : "--",
      Exam: student.finalExam ? `${student.finalExam}%` : "--",
      "TNA Pass / Level-up":
        student.isPassed === true
          ? "Passed / Eligible"
          : student.isPassed === false
            ? "Not Passed"
            : "Pending",
      "Attendance Breakdown": buildAttendanceBreakdownText(student),
      "Assessment Breakdown": buildAssessmentBreakdownText(student),
      "Grade Mapping": student.gradeComputation || "N/A",
      "Percentage Formula": student.percentageComputation || "N/A",
    }),
  );

  const exportColumns = [
    `${learnerTerm} Name`,
    "Final Grade",
    "Final %",
    "Assignment Avg",
    "Quiz Avg",
    "Attendance",
    "Exam",
    "TNA Pass / Level-up",
    "Attendance Breakdown",
    "Assessment Breakdown",
    "Grade Mapping",
    "Percentage Formula",
  ] as const;

  const escapeCsvValue = (value: string): string => {
    const normalized = value.replace(/"/g, '""');
    return `"${normalized}"`;
  };

  const handleExportCsv = async () => {
    if (!exportRows.length) {
      toast.info(`No ${learnerTerm.toLowerCase()} grade data to export.`);
      return;
    }

    setIsExportingCsv(true);
    try {
      await toast.promise(
        (async () => {
          const csvLines: string[] = [];
          csvLines.push(exportColumns.map((column) => escapeCsvValue(column)).join(","));
          exportRows.forEach((row) => {
            csvLines.push(
              exportColumns
                .map((column) => escapeCsvValue(String(row[column] ?? "")))
                .join(","),
            );
          });

          const blob = new Blob([csvLines.join("\n")], {
            type: "text/csv;charset=utf-8;",
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `analytics-all-${learnersTerm.toLowerCase()}-grades-${generateTimestamp()}.csv`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        })(),
        {
          pending: "Exporting all employee grades to CSV...",
          success: "Employee grades exported to CSV",
          error: "Failed to export employee grades to CSV",
        },
      );
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportPdf = async () => {
    if (!exportRows.length) {
      toast.info(`No ${learnerTerm.toLowerCase()} grade data to export.`);
      return;
    }

    setIsExportingPdf(true);
    try {
      await toast.promise(
        (async () => {
          const [{ jsPDF }, autoTableModule] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
          ]);
          const autoTable = autoTableModule.default;
          const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
          });

          doc.setFontSize(14);
          doc.text(`Analytics - All ${learnersTerm} Grades`, 30, 30);
          doc.setFontSize(9);
          doc.setTextColor(100);
          doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 30, 45);

          autoTable(doc, {
            startY: 56,
            head: [exportColumns.map((column) => String(column))],
            body: exportRows.map((row) =>
              exportColumns.map((column) => String(row[column] ?? "")),
            ),
            styles: {
              fontSize: 6.5,
              cellPadding: 2.5,
              overflow: "linebreak",
            },
            headStyles: {
              fillColor: [30, 64, 175],
              textColor: [255, 255, 255],
              fontStyle: "bold",
              fontSize: 7,
            },
            margin: { top: 40, right: 20, bottom: 24, left: 20 },
            theme: "grid",
          });

          doc.save(
            `analytics-all-${learnersTerm.toLowerCase()}-grades-${generateTimestamp()}.pdf`,
          );
        })(),
        {
          pending: "Exporting all employee grades to PDF...",
          success: "Employee grades exported to PDF",
          error: "Failed to export employee grades to PDF",
        },
      );
    } finally {
      setIsExportingPdf(false);
    }
  };

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

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
        <div className="order-1 min-w-0 w-full lg:order-2">
          <GradeChart data={gradeData[0]} learnersLabel={learnersTerm} />
        </div>

        <div className="order-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:order-1 lg:grid-cols-1">
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
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-1.5 h-8 bg-secondary"></div>
        <h1 className="text-xl sm:text-2xl font-bold">
          Individual {learnerTerm} Grades
        </h1>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            className="h-9 px-3 text-xs sm:text-sm"
            onClick={() => void handleExportCsv()}
            isLoading={isExportingCsv}
            isLoadingText="Exporting..."
          >
            <FiDownload className="mr-1" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            className="h-9 px-3 text-xs sm:text-sm"
            onClick={() => void handleExportPdf()}
            isLoading={isExportingPdf}
            isLoadingText="Exporting..."
          >
            <FiDownload className="mr-1" />
            Export PDF
          </Button>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Final grade is computed as the average of available components:
        Assignment, Quiz, Exam, and Attendance (if attendance exists). Missing
        assessment attempts contribute failing defaults in the computation.
      </div>

      <div className="w-full overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-[16%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                {learnerTerm} Name
              </th>
              <th className="w-[9%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                Final Grade
              </th>
              <th className="w-[10%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                Final %
              </th>
              <th className="w-[11%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                Assignment Avg
              </th>
              <th className="w-[9%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                Quiz Avg
              </th>
              <th className="w-[9%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                Attendance
              </th>
              <th className="w-[8%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
                Exam
              </th>
              <th className="w-[16%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB] whitespace-nowrap">
                TNA Pass / Level-up
              </th>
              <th className="w-[12%] px-3 py-3 text-left text-xs text-gray-500 font-medium bg-[#F9FAFB]">
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
                  <td className="px-3 py-3">
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
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {student.finalGrade ? (
                      student.finalGrade
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {student.finalPercentage ? (
                      `${student.finalPercentage}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {student.assignmentAverage ? (
                      `${student.assignmentAverage}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {student.quizAverage ? (
                      `${student.quizAverage}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {student.attendance ? (
                      `${student.attendance}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {student.finalExam ? (
                      `${student.finalExam}%`
                    ) : (
                      <span className="text-primary">--</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">
                    {student.isPassed === true ? (
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                        Passed / Eligible
                      </span>
                    ) : student.isPassed === false ? (
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
                        Not Passed
                      </span>
                    ) : (
                      <span className="inline-flex items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top">
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

      <FinalGradeBreakdownModal
        isOpen={Boolean(selectedBreakdown)}
        onClose={() => setSelectedBreakdown(null)}
        subTitle={selectedBreakdown?.name || ""}
        data={selectedBreakdown}
      />
    </div>
  );
}
