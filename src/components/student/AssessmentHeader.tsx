import Button from "../../components/common/Button";
import { IAssessment } from "../../types/interfaces";

interface AssessmentHeaderProps {
  data: IAssessment | undefined;
  hasStarted: boolean;
  onStart: () => void;
  hideStartButton?: boolean;
  orgData: any; // Adjust type based on your useGetOrganizationName response
  isOrgLoading: boolean;
}

export default function AssessmentHeader({
  data,
  hasStarted,
  onStart,
  hideStartButton = false,
  orgData,
  isOrgLoading,
}: AssessmentHeaderProps) {
  const { name, branding } = orgData?.data || {
    name: "",
    branding: { logo: "" },
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="p-6 sm:p-8 border-t-8 border-primary">
        <div className="flex flex-col items-center mb-6">
          {isOrgLoading ? (
            <div className="h-16 sm:h-20 w-32 bg-gray-300 rounded animate-pulse mb-4"></div>
          ) : (
            branding?.logo && (
              <img
                src={branding.logo}
                alt={`${name} Logo`}
                className="h-16 sm:h-20 w-auto mb-4"
              />
            )
          )}
          <h2 className="text-xl sm:text-2xl font-sans font-semibold text-gray-900 uppercase">
            {isOrgLoading ? (
              <div className="h-6 sm:h-7 w-48 bg-gray-300 rounded animate-pulse"></div>
            ) : (
              name
            )}
          </h2>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 mt-2 text-center">
            {data?.title}
          </h1>
          <p className="text-gray-700 text-base sm:text-lg font-sans mt-2 text-center">
            {data?.description || "No description provided."}
          </p>
        </div>
        <div className="bg-gray-50 rounded-md p-4 sm:p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800 font-sans mb-4">
            Assessment Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm sm:text-base">
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Due Date</span>
              <span className="font-medium text-gray-900">
                {data?.endDate
                  ? new Date(data.endDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not specified"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Time Limit</span>
              <span className="font-medium text-gray-900">
                {data?.timeLimit
                  ? `${data.timeLimit} minutes`
                  : "Not specified"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Attempts Allowed</span>
              <span className="font-medium text-gray-900">
                {data?.attemptsAllowed || "Not specified"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Number of Items</span>
              <span className="font-medium text-gray-900">
                {data?.numberOfItems || "Not specified"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Grade Method</span>
              <span className="font-medium text-gray-900 capitalize">
                {data?.gradeMethod || "Not specified"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Assessment Type</span>
              <span className="font-medium text-gray-900 capitalize">
                {data?.type || "Not specified"}
              </span>
            </div>
            {hasStarted && (
              <div className="flex flex-col">
                <span className="text-gray-600 font-sans">Total Points</span>
                <span className="font-medium text-gray-900">
                  {data?.totalPoints || "Not specified"}
                </span>
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-gray-600 font-sans">Passing Score</span>
              <span className="font-medium text-gray-900">
                {data?.passingScore || "Not specified"}
              </span>
            </div>
          </div>

          {!hasStarted && !hideStartButton && (
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={onStart}>
                Start {data?.type || "Assessment"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
