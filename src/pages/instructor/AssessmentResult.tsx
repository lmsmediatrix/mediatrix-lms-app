import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  useGetStudentsAssessmentResult,
  useUpdateAssessmentResult,
} from "../../hooks/useAssessment";
import Button from "../../components/common/Button";
import { toast } from "react-toastify";
import AssessmentResultSkeleton from "../../components/skeleton/AssessmentResultSkeleton";
import { IoArrowBack } from "react-icons/io5";
import AssessmentResultQuestion from "../../components/instructor/AssessmentResultQuestion";

export default function AssessmentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathList = location.pathname.split("/");
  if (!location.state) {
    const newPath = pathList.slice(0, -2).join("/");
    navigate(newPath);
    return null;
  }
  const { assessmentNo, assessmentType } = location.state;
  const studentId = pathList.pop();
  const assessmentId = pathList[6];
  const sectionCode = pathList[4];
  const updateAssessment = useUpdateAssessmentResult();
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const { data, isPending } = useGetStudentsAssessmentResult(
    studentId || "",
    assessmentNo,
    assessmentType,
    sectionCode
  );

  const [editedPoints, setEditedPoints] = useState<{ [key: string]: number }>({});
  const totalQuestions = data?.data?.result?.answers?.length ?? 0;

  useEffect(() => {
    if (totalQuestions === 0) {
      setCurrentQuestionIndex(0);
      return;
    }
    setCurrentQuestionIndex((prev) => Math.min(prev, totalQuestions - 1));
  }, [totalQuestions]);

  const handlePointsChange = (questionId: string, points: number) => {
    setEditedPoints((prev) => ({
      ...prev,
      [questionId]: points,
    }));
  };

  const handleSaveChanges = () => {
    const formattedAnswers = Object.entries(editedPoints).map(
      ([questionId, pointsEarned]) => ({
        questionId,
        pointsEarned,
      })
    );

    const payload = {
      answers: formattedAnswers,
      studentId: studentId || "",
      assessmentId,
    };

    toast.promise(
      updateAssessment.mutateAsync(payload, {
        onSuccess: () => {
          setEditedPoints({});
        },
        onError: () => {
          toast.error("Failed to update assessment results");
        },
      }),
      {
        pending: "Updating assessment results...",
        success: "Assessment results updated successfully",
      }
    );
  };

  if (isPending) {
    return <AssessmentResultSkeleton />;
  }

  if (!data || !data.data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">
          No assessment data available
        </div>
      </div>
    );
  }

  const {
    result: {
      answers,
      totalScore,
      passingScore,
      isPassed,
      startTime,
      endTime,
      attemptNumber,
    },
    studentInfo: { firstName, lastName, studentId: studentRoll },
    assessmentInfo: { title, type, totalPoints },
  } = data.data;
  const currentAnswer =
    totalQuestions > 0 ? answers[currentQuestionIndex] : null;
  const canGoPrevious = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < totalQuestions - 1;

  const goToPreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
    setPointsError(null);
  };

  const goToNextQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
    setPointsError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-4 md:py-10 px-4 sm:px-6 lg:px-14">
      <button
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors mb-4"
        onClick={() => navigate(-1)}
      >
        <IoArrowBack className="text-lg" />
        Go Back
      </button>

      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
          <div className="p-4 md:p-6 border-t-8 border-primary rounded-t-lg">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Assessment Results
            </h1>
            <p className="text-gray-600 text-lg capitalize">
              {title} - {type}
            </p>
          </div>
        </div>

        {/* Student and Result Summary Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Student Info Card */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Student Information
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-900">
                  {firstName} {lastName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Student ID:</span>
                <span className="font-medium text-gray-900">{studentRoll}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Section:</span>
                <span className="font-medium text-gray-900">{sectionCode}</span>
              </div>
            </div>
          </div>

          {/* Result Summary Card */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Result Summary
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium text-gray-900">
                  {totalScore} / {totalPoints}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Passing Score:</span>
                <span className="font-medium text-gray-900">
                  {passingScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span
                  className={`font-medium px-2 py-1 rounded-full text-sm ${
                    isPassed
                      ? "text-green-600 bg-green-100"
                      : "text-red-600 bg-red-100"
                  }`}
                >
                  {isPassed ? "Passed" : "Failed"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Attempt:</span>
                <span className="font-medium text-gray-900">
                  {attemptNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Time Information */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Assessment Duration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-gray-600">Started:</span>
              <span className="font-medium text-gray-900">
                {new Date(startTime).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium text-gray-900">
                {new Date(endTime).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Question Results */}
        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mt-4">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Detailed Question Results
          </h2>
          <div className="space-y-4">
            {totalQuestions > 0 && currentAnswer ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={goToPreviousQuestion}
                      disabled={!canGoPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="primary"
                      onClick={goToNextQuestion}
                      disabled={!canGoNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                <AssessmentResultQuestion
                  pointsError={pointsError}
                  setPointsError={setPointsError}
                  key={currentAnswer.questionId}
                  question={{
                    _id: currentAnswer.questionId,
                    questionText: currentAnswer.questionText,
                    type: currentAnswer.questionType,
                    questionImage: currentAnswer.questionImage,
                    options: currentAnswer.options,
                    points: currentAnswer.points,
                  }}
                  index={currentQuestionIndex}
                  resultData={{
                    answer: currentAnswer.answer,
                    correctAnswer:
                      currentAnswer.correctAnswer ||
                      currentAnswer.options?.find(
                        (opt: { isCorrect: boolean }) => opt.isCorrect
                      )?.text ||
                      currentAnswer.options?.find(
                        (opt: { isCorrect: boolean }) => opt.isCorrect
                      )?.option,
                    isCorrect: currentAnswer.isCorrect,
                    pointsEarned:
                      editedPoints[currentAnswer.questionId] !== undefined
                        ? editedPoints[currentAnswer.questionId]
                        : currentAnswer.pointsEarned,
                  }}
                  onPointsChange={handlePointsChange}
                />
              </>
            ) : (
              <div className="text-sm text-gray-500">
                No detailed question results available.
              </div>
            )}
          </div>
        </div>

        {/* Save Changes Button */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            onClick={handleSaveChanges}
            disabled={
              updateAssessment.isPending ||
              Object.keys(editedPoints).length === 0 ||
              pointsError !== null
            }
            isLoading={updateAssessment.isPending}
            isLoadingText="Saving..."
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
