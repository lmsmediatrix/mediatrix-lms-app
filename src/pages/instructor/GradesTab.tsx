import { FaUserGraduate } from "react-icons/fa";
import { Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useGetStudentGradeBySection } from "../../hooks/useInstructor";
import { TableSkeleton } from "../../components/skeleton/TableSkeleton";
import { toast } from "react-toastify";
import { BiExport } from "react-icons/bi";
import Button from "../../components/common/Button";
import { useExportStudentGrades } from "../../hooks/useSection";
import { exportToCSVUtil } from "../../lib/exportCsvUtils";
import StudentGradesModal from "../../components/instructor/StudentGradesModal";

interface IStudent {
  _id: string;
  studentId: string;
  fullName: string;
  avatar?: string;
  assessments: {
    assessmentId: string;
    totalScore: number;
    totalPoints: number;
    type: string;
    assessmentNo: number;
    gradeMethod: string;
    percentageScore: number;
    gradeLabel: string;
    dueDate?: string;
    submittedAt?: string;
  }[];
}

const GradesContent = ({
  sectionCode,
  onStudentSelect,
}: {
  sectionCode: string;
  onStudentSelect: (student: IStudent) => void;
}) => {
  const { data, isPending, isError, error } = useGetStudentGradeBySection(sectionCode);
  const students: IStudent[] = data?.students || [];
  const headers: string[] = data?.headers || [];

  useEffect(() => {
    if (isError) {
      toast.error(error.message || "Something went wrong!");
    }
  }, [isError, error]);

  if (isPending) return <TableSkeleton />;

  if (students.length === 0) {
    return (
      <div className="w-full p-6 flex flex-col items-center justify-center text-gray-500">
        <p className="text-lg">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md overflow-x-auto">
        <div className="min-w-[600px] max-h-[600px]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-gray-600 text-sm bg-gray-100 rounded-t-lg">
                <th className="p-3 font-medium min-w-[180px]">
                  <span className="text-sm">Student Name</span>
                </th>
                {headers.map((header, index) => (
                  <th key={index} className="font-medium min-w-[80px] text-center">
                    <span className="text-sm capitalize">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map((student) => (
                <tr
                  key={student.studentId}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onStudentSelect(student)}
                >
                  <td className="py-3 pl-2 lg:pl-4 text-gray-900 flex items-center gap-2 lg:gap-3 truncate">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={`${student.fullName}'s avatar`}
                        className="w-8 h-8 lg:w-10 lg:h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <FaUserGraduate className="text-gray-500 text-lg lg:text-xl" />
                      </div>
                    )}
                    <span className="truncate text-sm font-medium">
                      {student.fullName}
                    </span>
                  </td>
                  {student.assessments.map((assessment, index) => (
                    <td
                      key={index}
                      className={`py-3 text-center text-sm lg:text-base ${
                        assessment.gradeLabel === "F" || assessment.gradeLabel === "5.00"
                          ? "text-red-400"
                          : "text-blue-400"
                      }`}
                    >
                      {assessment.gradeLabel || "-"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function GradesTab() {
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4];
  const exportStudentGrades = useExportStudentGrades();
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);

  const exportToCSV = () => {
    exportToCSVUtil({
      mutationFn: async (sectionCode) => {
        return await exportStudentGrades.mutateAsync(sectionCode);
      },
      mutationParams: sectionCode,
      filenamePrefix: `1bislms-${sectionCode}-grades`,
      toastMessages: {
        pending: `Exporting student grades data to CSV...`,
        success: `Successfully exported student grades data to CSV`,
        error: `Failed to export student grades data to CSV`,
      },
      onError: (error) => console.error("Export error:", error),
    });
  };

  return (
    <div className="max-w-7xl mx-auto md:p-4">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4 md:gap-0">
        <div className="hidden md:flex justify-center md:justify-start gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Grades</h1>
        </div>
        <div className="flex gap-2 justify-end">
          <Button onClick={exportToCSV} variant="primary" className="text-sm md:text-base">
            <BiExport /> <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="md:border rounded-lg bg-white md:border-gray-200">
        <Suspense fallback={<div>Loading sections...</div>}>
          <GradesContent
            sectionCode={sectionCode}
            onStudentSelect={setSelectedStudent}
          />
        </Suspense>
      </div>

      <StudentGradesModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        sectionCode={sectionCode}
      />
    </div>
  );
}