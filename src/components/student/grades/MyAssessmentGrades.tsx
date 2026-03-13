import { useGetGradesByStudentSection } from "../../../hooks/useStudentAssessmentGrade";

interface MyAssessmentGradesProps {
  studentId: string;
  sectionId: string;
}

const MyAssessmentGrades: React.FC<MyAssessmentGradesProps> = ({
  studentId,
  sectionId,
}) => {
  const { data, isLoading, isError, error } = useGetGradesByStudentSection(
    studentId,
    sectionId,
  );

  const grades: any[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-gray-500 text-sm">Loading your grades...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-red-500 text-sm">
          {error instanceof Error ? error.message : "Failed to load grades."}
        </p>
      </div>
    );
  }

  if (grades.length === 0) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-gray-400 text-sm">
          No grade records found for this section.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Assessment
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Type
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Score
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Percentage
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Grade Label
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {grades.map((grade) => (
            <tr key={grade._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-800">
                {grade.assessmentId?.title ?? grade.assessmentId ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-600 capitalize">
                {grade.assessmentId?.type ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {grade.score} / {grade.totalPoints}
              </td>
              <td className="px-4 py-3 text-gray-700">
                {grade.percentage != null
                  ? `${grade.percentage.toFixed(2)}%`
                  : "—"}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-800">
                {grade.gradeLabel ?? "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    grade.status === "graded"
                      ? "bg-green-100 text-green-700"
                      : grade.status === "returned"
                        ? "bg-yellow-100 text-yellow-700"
                        : grade.status === "late"
                          ? "bg-red-100 text-red-700"
                          : grade.status === "submitted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {grade.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MyAssessmentGrades;
