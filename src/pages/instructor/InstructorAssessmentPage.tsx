import { useLocation, useNavigate } from "react-router-dom";
import Accordion from "../../components/common/Accordion";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { FaUser } from "react-icons/fa"; // Import the user icon from react-icons
import { useGetStudentAssessment } from "../../hooks/useAssessment";
import { IoArrowBack } from "react-icons/io5";
import InstructorAssessmentSkeleton from "../../components/skeleton/InstructorAssessmentSkeleton";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";

export default function InstructorAssessmentPage() {
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4] as string;
  const assessmentId = location.pathname.split("/")[6] as string;
  const { data, isPending } = useGetStudentAssessment(
    sectionCode || "",
    assessmentId || "",
  );
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnersTerm = getTerm("learner", orgType, true);

  const submitted = !isPending ? data?.data?.submitted || [] : [];
  const notSubmitted = !isPending ? data?.data?.notSubmitted || [] : [];
  const assessmentInfo = !isPending ? data?.data?.assessmentInfo || null : null;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not Submitted";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const navigateToAssessmentResult = (studentId: string) => {
    if (!assessmentInfo.assessmentNo) return; // Remove this line if assessmentNo is stable
    navigate(`student/${studentId}`, {
      state: {
        assessmentNo: assessmentInfo.assessmentNo,
        assessmentType: assessmentInfo.type,
      },
    });
  };

  // Avatar component to handle both image and placeholder
  const StudentAvatar = ({
    src,
    alt,
  }: {
    src?: string;
    alt: string;
    name: string;
  }) => {
    return src ? (
      <img
        src={src}
        alt={alt}
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <FaUser className="text-gray-500 text-xl" />
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto py-4 md:py-10 px-4 md:px-8">
      <button
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors md:mb-4"
        onClick={() => navigate(-1)}
      >
        <IoArrowBack className="text-lg" />
        Go Back
      </button>

      {isPending ? (
        <InstructorAssessmentSkeleton />
      ) : (
        <>
          <div className="flex justify-between mb-4 md:mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold pt-4">
                <span className="capitalize">
                  {assessmentInfo.type} {assessmentInfo.assessmentNo}:{" "}
                </span>
                <span className="font-normal text-gray-600">
                  {assessmentInfo?.title || "Sample Exam Title"}
                </span>
              </h1>
              <p className="text-gray-500 mt-2">
                Due Date:{" "}
                <span className="text-gray-700 font-semibold">
                  {formatDateMMMDDYYY(assessmentInfo?.dueDate, true)}
                </span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Submitted Students Accordion */}
            <Accordion
              title="Submitted"
              subtitle={`(${submitted.length})`}
              defaultExpanded={true}
            >
              <div className="divide-y divide-gray-200">
                {submitted.length === 0 ? (
                  <div className="px-16 py-4 text-center text-gray-500">
                    No submissions yet
                  </div>
                ) : (
                  submitted.map((student: any) => (
                    <div
                      onClick={() => navigateToAssessmentResult(student._id)}
                      key={student._id}
                      className="flex items-center justify-between px-2 md:px-16 py-4 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex gap-4 items-center">
                        <StudentAvatar
                          src={student.avatar}
                          alt={`${student.studentName}'s avatar`}
                          name={student.studentName}
                        />
                        <div className="flex flex-col">
                          <span className="text-gray-900">
                            {student.studentName}
                          </span>
                          <span className="text-sm text-gray-500 hidden md:block">
                            Score: {student.result.totalScore}/
                            {assessmentInfo?.totalPoints}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-16">
                        <span className="text-xs md:text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full">
                          Submitted: {formatDate(student.result.endTime)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Accordion>

            {/* Not Submitted Students Accordion */}
            <Accordion
              title="Not Submitted"
              subtitle={`(${notSubmitted.length})`}
              defaultExpanded={true}
            >
              <div className="divide-y divide-gray-200">
                {notSubmitted.length === 0 ? (
                  <div className="px-16 py-4 text-center text-gray-500">
                    All {learnersTerm.toLowerCase()} have submitted
                  </div>
                ) : (
                  notSubmitted.map((student: any) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between px-2 md:px-16 py-4 bg-white hover:bg-gray-50"
                    >
                      <div className="flex gap-4 items-center">
                        <StudentAvatar
                          src={student.avatar}
                          alt={`${student.studentName}'s avatar`}
                          name={student.studentName}
                        />
                        <div className="flex flex-col">
                          <span className="text-gray-900">
                            {student.studentName}
                          </span>
                          <span className="text-sm text-gray-500 hidden md:block">
                            Score: Not Submitted
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-16">
                        <span className="text-xs md:text-sm text-gray-700 bg-gray-50 px-3 py-1 rounded-full">
                          Not Submitted
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
}
