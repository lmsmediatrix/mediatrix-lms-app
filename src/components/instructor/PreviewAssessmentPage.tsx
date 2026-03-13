import { useLocation, useNavigate } from "react-router-dom";
import AssessmentQuestion from "../../components/student/AssessmentQuestions";
import { useGetAssessmentById } from "../../hooks/useAssessment";
import { useGetOrganizationName } from "../../hooks/useOrganization";
import { useAuth } from "../../context/AuthContext";
import AssessmentResultSkeleton from "../../components/skeleton/AssessmentResultSkeleton";
import AssessmentHeader from "../../components/student/AssessmentHeader";
import { IQuestion } from "../../types/interfaces";
import { IoArrowBack } from "react-icons/io5";

export default function PreviewAssessmentPage() {
  const location = useLocation();
  const assessmentId = location.pathname.split("/")[6];
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const { data: orgData, isLoading: isOrgLoading } = useGetOrganizationName(
    currentUser?.user?.organization._id || ""
  );
  const { data, isPending } = useGetAssessmentById(assessmentId || "", true, true);

  if (isPending || isOrgLoading) {
    return <AssessmentResultSkeleton />;
  }

  if (data?.remainingAttempts === 0) {
    navigate(`submitted`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <button
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors md:mb-4"
          onClick={() => navigate(-1)}
        >
          <IoArrowBack className="text-lg" />
          Go Back
        </button>
        <AssessmentHeader
          data={data}
          hasStarted={false}
          onStart={() => {}}
          hideStartButton={true}
          orgData={orgData}
          isOrgLoading={isOrgLoading}
        />

        <div className="space-y-6">
          {data?.questions.map((question: IQuestion, index: number) => (
            <AssessmentQuestion
              key={question._id}
              question={question}
              index={index}
              onAnswerChange={() => {}}
              initialAnswer={undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}