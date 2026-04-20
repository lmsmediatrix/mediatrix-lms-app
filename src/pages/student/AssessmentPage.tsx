import { useLocation, useNavigate } from "react-router-dom";
import AssessmentQuestion from "../../components/student/AssessmentQuestions";
import Button from "../../components/common/Button";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { IQuestion } from "../../types/interfaces";
import {
  useGetAssessmentById,
  useSubmitAssessment,
} from "../../hooks/useAssessment";
import { useGetOrganizationName } from "../../hooks/useOrganization";
import AssessmentTimer from "../../components/student/AssessmentTimer";
import AssessmentResultSkeleton from "../../components/skeleton/AssessmentResultSkeleton";
import AssessmentHeader from "../../components/student/AssessmentHeader";

export default function AssessmentPage() {
  const location = useLocation();
  const assessmentId = location.pathname.split("/").pop();
  const submitAssessment = useSubmitAssessment();
  const { currentUser } = useAuth();
  const studentId = currentUser?.user?.id;
  const navigate = useNavigate();

  const { data: orgData, isLoading: isOrgLoading } = useGetOrganizationName(
    currentUser?.user?.organization._id || ""
  );

  const [hasStarted, setHasStarted] = useState(false);
  const { data, isPending } = useGetAssessmentById(
    assessmentId || "",
    hasStarted,
    true
  );
  const [startTime, setStartTime] = useState<string | null>(null);
  const [answers, setAnswers] = useState<
    { questionId: string; answer: string | string[] }[]
  >([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showUnansweredModal, setShowUnansweredModal] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [unansweredQuestionIds, setUnansweredQuestionIds] = useState<string[]>(
    []
  );

  const storageKey = `assessment`;

  useEffect(() => {
    const savedState = localStorage.getItem(storageKey);
    if (savedState && assessmentId) {
      const {
        assessmentId: storedAssessmentId,
        hasStarted,
        startTime,
        answers,
      } = JSON.parse(savedState);
      if (storedAssessmentId === assessmentId) {
        setHasStarted(hasStarted);
        setStartTime(startTime);
        setAnswers(answers);
      } else {
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey, assessmentId]);

  useEffect(() => {
    if (hasStarted && !isSubmitted && assessmentId) {
      const state = { assessmentId, hasStarted, startTime, answers };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [hasStarted, startTime, answers, isSubmitted, storageKey, assessmentId]);

  useEffect(() => {
    if (isSubmitted) {
      localStorage.removeItem(storageKey);
    }
  }, [isSubmitted, storageKey]);

  const questions = data?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion =
    totalQuestions > 0 ? questions[currentQuestionIndex] : null;
  const canGoPrevious = currentQuestionIndex > 0;
  const canGoNext = currentQuestionIndex < totalQuestions - 1;

  useEffect(() => {
    if (!hasStarted || totalQuestions === 0) {
      setCurrentQuestionIndex(0);
      return;
    }

    setCurrentQuestionIndex((prev) => Math.min(prev, totalQuestions - 1));
  }, [hasStarted, totalQuestions]);

  useEffect(() => {
    if (!hasStarted || isSubmitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowLeaveModal(true);
      e.returnValue =
        "Are you sure you want to leave? Your progress will be saved.";
    };

    const handlePopState = (e: PopStateEvent) => {
      if (hasStarted && !isSubmitted) {
        e.preventDefault();
        setShowLeaveModal(true);
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [hasStarted, isSubmitted]);

  const handleStart = () => {
    setHasStarted(true);
    setStartTime(new Date().toISOString());
    window.history.pushState(null, "", window.location.href);
  };

  const handleAnswerChange = (
    questionId: string,
    answer: string | string[]
  ) => {
    setAnswers((prev) => {
      const updated = prev.filter((a) => a.questionId !== questionId);
      return [...updated, { questionId, answer }];
    });
    setUnansweredQuestionIds((prev) => prev.filter((id) => id !== questionId));
  };

  // Function to clear timer cookies
  const clearTimerCookies = () => {
    document.cookie =
      "assessment_time_remaining=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
    document.cookie =
      "assessment_start_time=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;";
  };

  const handleSubmit = (forceSubmit: boolean = false) => {
    if (!studentId || !assessmentId || !startTime) {
      toast.error("Missing required information");
      return;
    }

    const isQuestionUnanswered = (question: IQuestion) => {
      if (!question._id) return true;

      const existingAnswer = answers.find((a) => a.questionId === question._id);
      if (!existingAnswer) return true;

      if (question.type === "enumeration") {
        if (!Array.isArray(existingAnswer.answer)) {
          return true;
        }

        const normalizedAnswers = existingAnswer.answer
          .map((ans) => (typeof ans === "string" ? ans.trim() : ""))
          .filter((ans) => ans !== "");

        return normalizedAnswers.length === 0;
      }

      if (Array.isArray(existingAnswer.answer)) {
        return existingAnswer.answer.length === 0;
      }

      return !existingAnswer.answer;
    };

    // Check for unanswered questions
    const unansweredQuestions = data?.questions.filter((question: IQuestion) =>
      isQuestionUnanswered(question)
    );

    // If there are unanswered questions and not forcing submission, show modal
    if (unansweredQuestions?.length > 0 && !forceSubmit) {
      setUnansweredQuestionIds(
        (unansweredQuestions as IQuestion[])
          .map((q: IQuestion) => q._id)
          .filter((id): id is string => !!id)
      );
      setShowUnansweredModal(true);
      return;
    }

    // Construct payload with all questions, including unanswered ones
    const allAnswers =
      data?.questions
        .filter((question: IQuestion) => question._id)
        .map((question: IQuestion) => {
          const existingAnswer = answers.find(
            (a) => a.questionId === question._id
          );
          const isEnumeration = question.type === "enumeration";
          const isMultiAnswer = question.type === "checkbox" || isEnumeration;
          return {
            questionId: question._id,
            answer: existingAnswer
              ? existingAnswer.answer
              : isMultiAnswer
              ? []
              : "",
          };
        }) || [];

    const payload = {
      assessmentId,
      answers: allAnswers,
      startTime,
    };

    submitAssessment.mutate(payload, {
      onSuccess: () => {
        // Clear timer cookies before resetting state
        clearTimerCookies();
        setIsSubmitted(true);
        setHasStarted(false);
        setStartTime(null);
        setAnswers([]);
        setShowLeaveModal(false);
        setShowUnansweredModal(false);
        setUnansweredQuestionIds([]);
        navigate(`submitted`, { replace: true });
      },
      onError: () => toast.error("Failed to submit assessment"),
    });
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  };

  const handleReviewAnswers = () => {
    const firstUnansweredIndex = questions.findIndex(
      (question: IQuestion) =>
        question._id ? unansweredQuestionIds.includes(question._id) : false
    );

    if (firstUnansweredIndex >= 0) {
      setCurrentQuestionIndex(firstUnansweredIndex);
    }

    setShowUnansweredModal(false);
  };

  if (isPending || isOrgLoading) {
    return <AssessmentResultSkeleton />;
  }

  if (data?.remainingAttempts === 0) {
    navigate(`submitted`, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-10 px-4 sm:px-6 lg:px-8 relative">
      {hasStarted && (
        <AssessmentTimer
          hasStarted={hasStarted}
          timeLimit={data?.timeLimit}
          onTimeUp={() => handleSubmit(true)} // Force submit on time up
        />
      )}

      <div className="w-full max-w-4xl">
        <AssessmentHeader
          data={data}
          hasStarted={hasStarted}
          onStart={handleStart}
          orgData={orgData}
          isOrgLoading={isOrgLoading}
        />

        {hasStarted && (
          <div className="space-y-6">
            {currentQuestion ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onClick={handlePreviousQuestion}
                      disabled={!canGoPrevious}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="next"
                      onClick={handleNextQuestion}
                      disabled={!canGoNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                <AssessmentQuestion
                  key={currentQuestion._id || `question-${currentQuestionIndex}`}
                  question={currentQuestion}
                  index={currentQuestionIndex}
                  onAnswerChange={handleAnswerChange}
                  initialAnswer={
                    answers.find((a) => a.questionId === currentQuestion._id)
                      ?.answer
                  }
                  isUnanswered={
                    currentQuestion._id
                      ? unansweredQuestionIds.includes(currentQuestion._id)
                      : false
                  }
                />
              </>
            ) : (
              <div className="text-sm text-gray-500">
                No questions available for this assessment.
              </div>
            )}
          </div>
        )}

        {hasStarted && (
          <div className="mt-6 flex justify-end">
            <Button
              variant=""
              onClick={() => handleSubmit()}
              isLoading={submitAssessment.isPending}
              isLoadingText="Submitting..."
              disabled={submitAssessment.isPending}
              className="min-w-[140px] rounded-xl border border-[#21588f] bg-gradient-to-r from-[#1f4f95] via-[#256ab2] to-[#2e7dc2] px-7 py-2.5 text-lg font-semibold text-white shadow-[0_10px_24px_rgba(37,106,178,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(37,106,178,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#256ab2]/40"
            >
              Submit
            </Button>
          </div>
        )}
      </div>

      {showLeaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Leave Assessment?
            </h2>
            <p className="text-gray-600 mb-6">
              Your progress won't be saved. You can submit your current progress
              now and leave, or stay to continue.
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setShowLeaveModal(false)}
                className="w-full sm:w-auto"
              >
                Stay
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSubmit(true)} // Force submit on leave
                className="w-full sm:w-auto"
                isLoading={submitAssessment.isPending}
                isLoadingText="Submitting..."
              >
                Leave and Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {showUnansweredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Unanswered Questions
            </h2>
            <p className="text-gray-600 mb-6">
              Some questions are not yet answered. Are you sure you want to
              submit?
            </p>
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={handleReviewAnswers}
                className="w-full sm:w-auto"
              >
                Review Answers
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSubmit(true)} // Force submit on "Submit Anyway"
                className="w-full sm:w-auto"
                isLoading={submitAssessment.isPending}
                isLoadingText="Submitting..."
              >
                Submit Anyway
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
