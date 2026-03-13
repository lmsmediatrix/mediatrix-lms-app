import { useNavigate, useSearchParams } from "react-router-dom";
import { useSectionAssessment } from "../../hooks/useSection";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { IAssessment } from "../../types/interfaces";
import { GrAnnounce } from "react-icons/gr";
import { useAuth } from "../../context/AuthContext";
import InstructorTableEmptyState from "../../components/instructor/InstructorTableEmptyState";
import TakeAssessmentModal from "../../components/student/TakeAssessmentModal";
import Table from "../../components/common/Table";
import AssessmentTabSkeleton from "../../components/skeleton/AssessmentTabSkeleton";

interface AssessmentTabProps {
  sectionCode: string;
}

export default function AssessmentTab({ sectionCode }: AssessmentTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const role = currentUser.user.role;
  const assessmentId = searchParams.get("id");
  const { data: assessmentData, isPending } = useSectionAssessment(sectionCode);
  if (isPending || !assessmentData) return <AssessmentTabSkeleton />;

  const totalAssessments =
    assessmentData.data.count || assessmentData.data.assessment?.length || 0;
  const pendingAssessments = assessmentData.data.newAssessmentCount || 0;
  const completedAssessments = totalAssessments - pendingAssessments;
  const assessmentPercent =
    totalAssessments > 0
      ? Math.round((completedAssessments / totalAssessments) * 100)
      : 0;

  const columns = [
    {
      key: "dueDate",
      header: "Due Date",
      width: "20%",
    },
    {
      key: "type",
      header: "Type",
      width: "20%",
    },
    { key: "title", header: "Title", width: "40%" },
    { key: "numberOfItems", header: "Number of items", width: "20%" },
  ];

  const renderTableRows = (assessments: IAssessment[]) => {
    return assessments.map((assessment, index) => (
      <tr
        key={index}
        className={`border-b border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-all`}
        onClick={() => handleAssessmentClick(assessment._id)}
      >
        <td className="px-2 py-1 md:py-4 md:px-6">
          {formatDateMMMDDYYY(assessment.endDate)}
        </td>
        <td className="px-2 py-1 md:py-4 md:px-6">
          <span className="flex items-center font-semibold capitalize">
            {assessment.type} {assessment.assessmentNo}{" "}
          </span>
        </td>
        <td className="px-2 py-1 md:py-4 md:px-6">
          <div className="flex items-center gap-2 linec">
            <span>
              <GrAnnounce />
            </span>
            <span>{assessment.title}</span>
            {assessmentData.data.newAssessmentId?.includes(assessment._id) && (
              <span className="ml-2 bg-primary text-white text-xs font-semibold px-2 py-1 rounded">
                New
              </span>
            )}
          </div>
        </td>
        <td className="px-2 py-1 md:py-4 md:px-6">
          <span className="text-sm text-gray-500">
            {assessment.numberOfItems} questions | {assessment.totalPoints} pts
          </span>
        </td>
      </tr>
    ));
  };

  const handleAssessmentClick = (id: string) => {
    if (role === "student") {
      const tab = searchParams.get("tab");
      setSearchParams({ tab: tab ?? "", id });
    } else {
      navigate(`assessment/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Assessment Progress (student only) */}
      {role === "student" && totalAssessments > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Assessment Progress
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${assessmentPercent}%` }}
              />
            </div>
            <span className="text-sm font-bold text-primary min-w-[3rem]">
              {assessmentPercent}%
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {completedAssessments} of {totalAssessments} assessments completed
          </p>
        </div>
      )}

      {assessmentData.data.assessment.length === 0 ? (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-[#F9FAFB] border-b border-gray-200 py-3 px-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-700">Assessments</h3>
            </div>
          </div>
          <div className="p-4">
            {currentUser.user.role === "instructor" ? (
              <InstructorTableEmptyState
                title="Create Your First Assessment"
                description="Start by creating an assessment to evaluate your students' understanding of the course material."
                primaryActionLabel="Add Assessment"
                primaryActionPath="manage?tab=assessments&modal=create-assessment"
                type="assessment"
              />
            ) : (
              <div className="text-center text-gray-500 py-8">
                No assessment available
              </div>
            )}
          </div>
        </div>
      ) : (
        <Table columns={columns}>
          {renderTableRows(assessmentData.data.assessment)}
        </Table>
      )}
      {assessmentId && <TakeAssessmentModal />}
    </div>
  );
}
