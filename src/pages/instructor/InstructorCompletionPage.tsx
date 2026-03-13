import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";

type CompletionType = "lessons" | "modules" | "assessments" | "sections";

const labelMap: Record<CompletionType, string> = {
  lessons: "Lessons",
  modules: "Modules",
  assessments: "Assessments",
  sections: "Sections",
};

export default function InstructorCompletionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const typeParam = (searchParams.get("type") || "lessons").toLowerCase();
  const completionType = (["lessons", "modules", "assessments", "sections"].includes(typeParam)
    ? typeParam
    : "lessons") as CompletionType;
  const sectionCode = searchParams.get("sectionCode") || undefined;

  const { data, isLoading } = useGetPerformanceDashboard(sectionCode);
  const students = data?.students || [];

  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const progress = student.progress;
      if (!progress) return false;
      switch (completionType) {
        case "lessons":
          return progress.completedLessons > 0;
        case "modules":
          return (progress.completedModules ?? 0) > 0;
        case "assessments":
          return progress.completedAssessments > 0;
        case "sections": {
          const totalItems =
            (progress.totalLessons || 0) + (progress.totalAssessments || 0);
          return totalItems > 0 && progress.percent === 100;
        }
        default:
          return false;
      }
    });
  }, [students, completionType]);

  const getCompletionStats = (student: any) => {
    const progress = student.progress;
    if (!progress) {
      return { value: 0, total: 0, percent: 0 };
    }
    switch (completionType) {
      case "lessons": {
        const value = progress.completedLessons || 0;
        const total = progress.totalLessons || 0;
        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
        return { value, total, percent };
      }
      case "modules": {
        const value = progress.completedModules || 0;
        const total = progress.totalModules || 0;
        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
        return { value, total, percent };
      }
      case "assessments": {
        const value = progress.completedAssessments || 0;
        const total = progress.totalAssessments || 0;
        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
        return { value, total, percent };
      }
      case "sections": {
        const percent = progress.percent || 0;
        return { value: percent, total: 100, percent };
      }
      default:
        return { value: 0, total: 0, percent: 0 };
    }
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Completed {labelMap[completionType]} Students
          </h1>
          <p className="text-gray-500 mt-1">
            {sectionCode
              ? `Section: ${sectionCode}`
              : "All sections"}{" "}
            - {filteredStudents.length} students
          </p>
        </div>
        <Button variant="link" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          Loading completion data...
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Completion
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student: any) => {
                    const stats = getCompletionStats(student);
                    const barColor =
                      stats.percent >= 100
                        ? "bg-green-500"
                        : stats.percent >= 50
                          ? "bg-blue-500"
                          : "bg-gray-400";
                    return (
                      <tr
                        key={student._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {student.name?.charAt(0)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {student.section}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${stats.percent}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 font-medium">
                              {completionType === "sections"
                                ? `${stats.percent}%`
                                : `${stats.value}/${stats.total}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() =>
                              navigate(
                                `/${orgCode}/instructor/performance/${student._id}`
                              )
                            }
                            className="text-primary hover:text-primary/80 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No students found for this completion type.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

