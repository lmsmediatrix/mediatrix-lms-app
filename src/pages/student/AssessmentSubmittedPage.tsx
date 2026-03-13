import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";

export default function AssessmentSubmittedPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const location = useLocation();
  const sectionCode = location.pathname.split("/")[4];

  useEffect(() => {
    localStorage.removeItem("assessment");
  }, []);

  const handleBackToSection = () => {
    navigate(
      sectionCode
        ? `/${currentUser.user.organization.code}/student/sections/${sectionCode}?tab=assessments`
        : `/${currentUser.user.organization.code}/student/sections/`,
      { replace: true }
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-8 border-t-8 border-primary">
            <h1 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 mb-4">
              Assessment Submitted Successfully
            </h1>
            <p className="text-gray-500 text-base sm:text-lg font-sans mb-6">
              Thank you for completing the assessment. Your responses have been
              recorded.
            </p>
            <div className="flex justify-end gap-4 mt-12">
              <Button
                variant="outline"
                onClick={handleBackToSection}
                className="w-full sm:w-auto"
              >
                Go Back to Section Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}