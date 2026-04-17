import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useAuth } from "../../context/AuthContext";
import { useGetTakeAssessment } from "../../hooks/useAssessment";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";

export default function TakeAssessmentModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4];
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const assessmentId = searchParams.get("id");
  const { data: assessment, isPending } = useGetTakeAssessment(
    assessmentId ? assessmentId : ""
  );

  if (isPending) {
    return (
      <Dialog
        title="Loading Assessment"
        backdrop="dark"
        isOpen={!!assessmentId}
        onClose={() => setSearchParams({ tab: "assessments" })}
        size="full"
        contentClassName="w-full md:w-[35vw] md:min-w-[450px]"
        showCloseButton={false}
      >
        <div className="space-y-4 animate-pulse">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-10">
          <div className="h-10 bg-gray-200 rounded w-20"></div>
          <div className="h-10 bg-gray-200 rounded w-28"></div>
        </div>
      </Dialog>
    );
  }

  const orgCode = currentUser.user.organization.code;
  const currentDate = new Date();
  const dueDate = new Date(assessment.endDate);
  const trimTime = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const isAvailable = trimTime(currentDate) <= trimTime(dueDate);


  return (
    <Dialog
      title={`${assessment.title}`}
      backdrop="dark"
      isOpen={!!assessmentId}
      onClose={() => setSearchParams({ tab: "assessments" })}
      size="full"
      contentClassName="w-full md:w-[35vw] md:min-w-[450px]"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div>
          <div className="text-gray-600 font-bold mb-2 capitalize">
            {assessment.type} Title
          </div>
          <div className="bg-gray-100 p-3 rounded-md">{assessment.title}</div>
        </div>

        <div>
          <div className="text-gray-600 font-bold mb-2">Grading Method</div>
          <div className="bg-gray-100 p-3 rounded-md capitalize">
            {assessment.gradeMethod}
          </div>
        </div>

        <div>
          <div className="text-gray-600 font-bold mb-2">
            Number of Questions
          </div>
          <div className="bg-gray-100 p-3 rounded-md">
            {assessment.numberOfItems}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-600 font-bold mb-2">
              Remaining Attempts
            </div>
            <div className="bg-gray-100 p-3 rounded-md">
              <span
                className={
                  assessment.remainingAttempts === 0 ? `text-red-600` : ""
                }
              >
                {assessment.remainingAttempts}
              </span>{" "}
              / {assessment.attemptsAllowed}
            </div>
          </div>
          <div>
            <div className="text-gray-600 font-bold mb-2">Time Limit</div>
            <div className="bg-gray-100 p-3 rounded-md">
              {assessment.timeLimit} minutes
            </div>
          </div>
        </div>

        <div>
          <div className="text-gray-600 font-bold mb-2">Due Date</div>
          <div className="bg-gray-100 p-3 rounded-md flex items-center gap-2">
            <span className={!isAvailable ? `text-red-600` : ""}>
              {formatDateMMMDDYYY(assessment.endDate)}
            </span>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <div className="text-yellow-800 font-semibold mb-2">
            Important Notice
          </div>
          <p className="text-yellow-700 text-sm">
            Once you begin this assessment, you must complete it in one sitting.
            Exiting the assessment or switching tabs is strictly monitored and
            may result in automatic submission or disqualification. Ensure you
            are in a distraction-free environment before starting.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button
          variant="cancel"
          onClick={() => setSearchParams({ tab: "assessments" })}
        >
          Close
        </Button>
        <Button
          variant="primary"
          onClick={() =>
            navigate(
              `/${orgCode}/student/sections/${sectionCode}/assessment/${assessment._id}`
            )
          }
          disabled={assessment.remainingAttempts === 0 || !isAvailable}
        >
          Start <span className="capitalize">{assessment.type}</span>
        </Button>
      </div>
    </Dialog>
  );
}
