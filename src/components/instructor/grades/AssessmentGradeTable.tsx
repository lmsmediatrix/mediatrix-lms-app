import { useState } from "react";
import {
  useGetGradesByAssessment,
  useDeleteStudentAssessmentGrade,
} from "../../../hooks/useStudentAssessmentGrade";
import GradeInputForm from "./GradeInputForm";

interface AssessmentGradeTableProps {
  assessmentId: string;
}

const AssessmentGradeTable: React.FC<AssessmentGradeTableProps> = ({
  assessmentId,
}) => {
  const [editingGrade, setEditingGrade] = useState<any | null>(null);

  const { data, isLoading, isError, error } =
    useGetGradesByAssessment(assessmentId);

  const deleteGrade = useDeleteStudentAssessmentGrade();

  const grades: any[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-gray-500 text-sm">Loading grades...</p>
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
          No grade records for this assessment yet.
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
              Student
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Score
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Total Points
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
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Submitted At
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {grades.map((grade) => (
            <tr key={grade._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-800">
                {grade.studentId?.firstName
                  ? `${grade.studentId.firstName} ${grade.studentId.lastName}`
                  : (grade.studentId ?? "—")}
              </td>
              <td className="px-4 py-3 text-gray-700">{grade.score}</td>
              <td className="px-4 py-3 text-gray-700">{grade.totalPoints}</td>
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
              <td className="px-4 py-3 text-gray-500">
                {grade.submittedAt
                  ? new Date(grade.submittedAt).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3 flex gap-2">
                <button
                  className="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 transition"
                  onClick={() => setEditingGrade(grade)}
                >
                  Edit
                </button>
                <button
                  className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200 transition"
                  onClick={() => deleteGrade.mutate(grade._id)}
                  disabled={deleteGrade.isPending}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingGrade && (
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Edit Grade
          </h3>
          <GradeInputForm
            assessmentId={assessmentId}
            studentId={String(
              editingGrade.studentId?._id ?? editingGrade.studentId,
            )}
            existingGrade={editingGrade}
            onClose={() => setEditingGrade(null)}
          />
        </div>
      )}
    </div>
  );
};

export default AssessmentGradeTable;
