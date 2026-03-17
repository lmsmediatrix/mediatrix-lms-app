import { FaUserGraduate } from "react-icons/fa";
import Dialog from "../common/Dialog";
import Button from "../common/Button";

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

const formatDueDate = (d: string | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

const formatSubmittedAt = (d: string | undefined) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

interface StudentGradesModalProps {
  student: IStudent | null;
  onClose: () => void;
  sectionCode: string;
}

const StudentGradesModal: React.FC<StudentGradesModalProps> = ({
  student,
  onClose,
  sectionCode,
}) => {
  if (!student) return null;

  return (
    <Dialog
      isOpen={!!student}
      onClose={onClose}
      title="Student Grade"
      subTitle={sectionCode}
      size="xl"
      position="center"
      backdrop="dark"
      animation="pop"
      contentClassName="bg-white rounded-lg"
      showCloseButton={true}
    >
      <div className="relative">
        <div className="absolute left-0 top-0 right-0 h-16 bg-accent" />
        <div className="w-fit mx-auto flex flex-col items-center gap-3 mb-4 relative pt-4">
          {student.avatar ? (
            <img
              src={student.avatar}
              alt={`${student.fullName}'s avatar`}
              className="w-24 h-24 rounded-full object-cover shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <FaUserGraduate className="text-gray-500 text-3xl" />
            </div>
          )}
          <h2 className="text-xl font-bold text-primary text-center">
            {student.fullName}
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {student.assessments.map((assessment, index) => {
          const dueStr = formatDueDate(assessment.dueDate);
          const submittedStr = formatSubmittedAt(assessment.submittedAt);
          return (
            <div key={index} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
              <p className="mb-2 text-base font-medium text-gray-800">
                {assessment.type + " " + assessment.assessmentNo}
              </p>
              <p className="bg-gray-200 p-2 rounded-md text-base">
                {assessment.gradeLabel || "-"}
              </p>
              {(dueStr || submittedStr) && (
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-gray-500">
                  {dueStr && <span>Due: {dueStr}</span>}
                  {submittedStr && <span>Submitted: {submittedStr}</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-end mt-6">
        <Button type="button" variant="cancel" onClick={onClose}>
          Close
        </Button>
      </div>
    </Dialog>
  );
};

export default StudentGradesModal;
