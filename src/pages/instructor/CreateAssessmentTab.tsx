import { IoAdd } from "react-icons/io5";
import Accordion from "../../components/common/Accordion";
import { AiOutlineDelete, AiOutlineEdit, AiOutlineEye } from "react-icons/ai";
import { FaRegCalendar } from "react-icons/fa6";
import CreateAssessmentModal from "../../components/instructor/CreateAssessmentModal";
import Button from "../../components/common/Button";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import { toast } from "react-toastify";
import Dialog from "../../components/common/Dialog";
import { useDeleteAssessment } from "../../hooks/useAssessment";
import { IAssessment } from "../../types/interfaces";
import { useSectionAssessment } from "../../hooks/useSection";
import AssessmentTabSkeleton from "../../components/skeleton/AssessmentTabSkeleton";

interface CreateAssessmentTabProps {
  sectionName?: string;
  sectionCode: string;
}

export default function CreateAssessmentTab({
  sectionName,
  sectionCode,
}: CreateAssessmentTabProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const location = useLocation();
  const navigate = useNavigate();
  const deleteAssessment = useDeleteAssessment();
  const { data: assessmentData, isPending } = useSectionAssessment(sectionCode);

  // Handle loading state
  if (isPending || !assessmentData) {
    return <AssessmentTabSkeleton />;
  }

  const assessments: IAssessment[] = assessmentData.data.assessment || [];

  const onDeleteAssessment = (assessmentId: string) => {
    setSearchParams({
      tab: "assessments",
      modal: "delete-assessment",
      assessmentId: assessmentId,
    });
  };

  const handleDelete = (assessmentId: string) => {
    toast.promise(
      deleteAssessment.mutateAsync(assessmentId, {
        onSuccess: () => {
          handleCloseModal();
        },
      }),
      {
        pending: "Deleting assessment...",
        success: "Assessment deleted successfully",
        error: "Failed to delete assessment",
      }
    );
  };

  const handleCloseModal = () => {
    setSearchParams({ tab: "assessments" });
  };

  const currentDate = new Date();
  const currentAssessments = assessments.filter(
    (assessment) => new Date(assessment.endDate) >= currentDate
  );
  const completedAssessments = assessments.filter(
    (assessment) => new Date(assessment.endDate) < currentDate
  );

  const navigateToPreviewAssessment = (assessmentId: string) => {
    console.log(`navigating to assessment/${assessmentId}/preview`);
    navigate(
      location.pathname.replace("manage", `assessment/${assessmentId}/preview`)
    );
  };

  return (
    <div className="bg-white md:shadow rounded-lg max-w-5xl mx-auto">
      <div className="flex justify-between border-b p-4">
        <div className="flex gap-2 items-center">
          <div className="bg-accent w-1.5 md:w-2 h-8 md:h-12" />
          <h2 className="text-lg md:text-xl font-bold">Assessments</h2>
        </div>
        <button
          onClick={() =>
            setSearchParams({ tab: "assessments", modal: "create-assessment" })
          }
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#8FB02C] border border-[#8FB02C] rounded-lg hover:bg-[#8fb02c22]"
        >
          <IoAdd className="text-lg" />
          Assessment
        </button>
      </div>

      <div className="space-y-2 py-2 md:p-6">
        <Accordion
          title="Current Assessments"
          subtitle={`(${currentAssessments.length})`}
          defaultExpanded={true}
        >
          <div className="divide-y divide-gray-200">
            {currentAssessments.length === 0 ? (
              <div className="px-2 md:px-16 py-4 text-center text-gray-500">
                No current assessments available
              </div>
            ) : (
              currentAssessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className="flex items-center justify-between px-2 md:px-16 py-4 bg-white hover:bg-gray-50"
                >
                  <div className="flex gap-4 md:gap-16 items-center">
                    <div className="flex gap-2 w-24">
                      <p className="text-green-500 capitalize">
                        {assessment.type} {assessment.assessmentNo}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-sm md:text-base">
                        {assessment.title}
                      </span>
                      <span className="hidden md:inline text-xs md:text-sm text-gray-500">
                        {assessment.numberOfItems} questions |{" "}
                        {assessment.totalPoints} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center md:gap-16">
                    <span className="flex items-center gap-2 text-xs md:text-sm text-green-700 bg-green-50 px-2 md:px-3 py-1 rounded-full">
                      <FaRegCalendar className="text-base md:text-lg" />
                      {formatDateMMMDDYYY(assessment.endDate)}
                    </span>

                    <div className="flex items-center md:gap-4">
                      <button
                        onClick={() =>
                          setSearchParams({
                            tab: "assessments",
                            modal: "edit-assessment",
                            assessmentId: assessment._id,
                          })
                        }
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <AiOutlineEdit className="text-base md:text-lg" />
                      </button>
                      <button
                        onClick={() =>
                          navigateToPreviewAssessment(assessment._id)
                        }
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <AiOutlineEye
                          onClick={() =>
                            navigateToPreviewAssessment(assessment._id)
                          }
                          className="text-base md:text-lg"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAssessment(assessment._id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <AiOutlineDelete className="text-base md:text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Accordion>

        <Accordion
          title="Completed Assessments"
          subtitle={`(${completedAssessments.length})`}
          defaultExpanded={true}
        >
          <div className="divide-y divide-gray-200">
            {completedAssessments.length === 0 ? (
              <div className="px-2 md:px-16 py-4 text-center text-gray-500">
                No completed assessments available
              </div>
            ) : (
              completedAssessments.map((assessment) => (
                <div
                  key={assessment._id}
                  className="flex items-center justify-between px-2 md:px-16 py-4 bg-white hover:bg-gray-50"
                >
                  <div className="flex gap-4 md:gap-16 items-center">
                    <div className="flex gap-2 w-24">
                      <p className="text-green-500 capitalize">
                        {assessment.type} {assessment.assessmentNo}
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-900 text-sm md:text-base">
                        {assessment.title}
                      </span>
                      <span className="hidden md:inline text-xs md:text-sm text-gray-500">
                        {assessment.numberOfItems} questions |{" "}
                        {assessment.totalPoints} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center md:gap-16">
                    <span className="flex items-center gap-2 text-xs md:text-sm text-green-700 bg-green-50 px-2 md:px-3 py-1 rounded-full">
                      <FaRegCalendar className="text-base md:text-lg" />
                      {formatDateMMMDDYYY(assessment.endDate)}
                    </span>

                    <div className="flex items-center md:gap-4">
                      <button
                        onClick={() =>
                          setSearchParams({
                            tab: "assessments",
                            modal: "edit-assessment",
                            assessmentId: assessment._id,
                          })
                        }
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <AiOutlineEdit className="text-base md:text-lg" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <AiOutlineEye
                          onClick={() =>
                            navigateToPreviewAssessment(assessment._id)
                          }
                          className="text-base md:text-lg"
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAssessment(assessment._id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <AiOutlineDelete className="text-base md:text-lg" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Accordion>
      </div>

      <div className="border-t flex justify-between p-2 md:p-4">
        <Button onClick={() => navigate("?tab=announcements")} variant="cancel">
          <FaArrowLeft />
          Back
        </Button>
        <Button onClick={() => navigate("?tab=grades")} variant="outline">
          Next <FaArrowRight />
        </Button>
      </div>

      {(modal === "create-assessment" || modal === "edit-assessment") && (
        <CreateAssessmentModal
          isOpen={true}
          onClose={() => setSearchParams({ tab: "assessments" })}
          sectionName={sectionName}
        />
      )}
      {modal === "delete-assessment" && searchParams.get("assessmentId") && (
        <Dialog
          isOpen={true}
          onClose={handleCloseModal}
          title="Delete Assessment"
          contentClassName="w-[50vw]"
          backdrop="blur"
        >
          <div>
            <p>Are you sure you want to delete this assessment?</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                onClick={handleCloseModal}
                variant="cancel"
                className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleDelete(searchParams.get("assessmentId")!);
                }}
                variant="destructive"
                isLoading={deleteAssessment.isPending}
                isLoadingText="Deleting assessment..."
              >
                Delete
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
