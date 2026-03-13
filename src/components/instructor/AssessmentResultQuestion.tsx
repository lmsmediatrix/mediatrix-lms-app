import { useState, useEffect } from "react"; // Add useEffect import
import { IQuestion } from "../../types/interfaces";
import Button from "../common/Button";
import { getTerm } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

// Utility function to format question type
const formatQuestionType = (type: string): string => {
  const typeMap: Record<string, string> = {
    true_false: "True/False",
    Checkboxes: "Checkbox",
  };

  if (typeMap[type]) {
    return typeMap[type];
  }

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

interface AssessmentResultQuestionProps {
  question: IQuestion;
  index: number;
  resultData: {
    answer: string | string[];
    correctAnswer: string | string[];
    isCorrect: boolean;
    pointsEarned: number;
  };
  pointsError?: string | null;
  setPointsError?: (error: string | null) => void;
  onPointsChange?: (questionId: string, points: number) => void;
}

export default function AssessmentResultQuestion({
  question,
  index,
  resultData,
  pointsError,
  setPointsError,
  onPointsChange,
}: AssessmentResultQuestionProps) {
  const [isEditingPoints, setIsEditingPoints] = useState(false);
  const [editedPoints, setEditedPoints] = useState(resultData.pointsEarned || 0);
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = orgType ? getTerm("learner", orgType) : "Student";

  // Sync editedPoints with resultData.pointsEarned when it changes
  useEffect(() => {
    if (!isEditingPoints) {
      setEditedPoints(resultData.pointsEarned || 0);
    }
  }, [resultData.pointsEarned, isEditingPoints]);

  const toggleEditPoints = () => {
    setIsEditingPoints(!isEditingPoints);
    if (setPointsError) {
      setPointsError(null);
    }
  };

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPoints = parseInt(e.target.value) || 0;
    if (newPoints > question.points) {
      if (setPointsError) {
        setPointsError(`Points cannot exceed ${question.points}`);
      }
      setEditedPoints(newPoints);
    } else {
      if (setPointsError) {
        setPointsError(null);
      }
      setEditedPoints(newPoints);
      if (question._id && onPointsChange) {
        onPointsChange(question._id, newPoints);
      }
    }
  };

  const renderResultContent = () => {
    switch (question.type) {
      case "multiple_choice":
        const studentAnswerOption = question.options?.find(
          (opt) => opt.isStudentAnswer
        );
        const studentAnswer =
          studentAnswerOption?.option || resultData.answer || "";

        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4 flex justify-center">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
            <div className="space-y-2">
              {question.options?.map((option, index) => {
                const isStudentAnswer = studentAnswer === option.option;
                const isCorrectOption = option.isCorrect;
                const bgClass =
                  (isStudentAnswer && isCorrectOption) ||
                  (!isStudentAnswer && isCorrectOption)
                    ? "bg-green-100 border-green-500"
                    : isStudentAnswer
                    ? "bg-red-100 border-red-500"
                    : "bg-white border-gray-200";

                // Determine the label to display
                let labelText = "";
                if (isStudentAnswer && isCorrectOption) {
                  labelText = `${learnerTerm} answer is correct`;
                } else if (isStudentAnswer) {
                  labelText = `${learnerTerm} answer is incorrect`;
                } else if (isCorrectOption) {
                  labelText = "Correct answer";
                }

                return (
                  <div
                    key={`${question._id}-${index}`}
                    className={`p-3 rounded-lg border ${bgClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={`question-${question._id}`}
                          value={option.option}
                          checked={isStudentAnswer}
                          readOnly
                          disabled
                          className={`w-5 h-5 ${
                            (isStudentAnswer && isCorrectOption) ||
                            (!isStudentAnswer && isCorrectOption)
                              ? "text-green-500"
                              : isStudentAnswer
                              ? "text-red-500"
                              : "text-gray-600"
                          } border-gray-300`}
                        />
                        <span className="text-gray-800 text-base">
                          {option.text}
                        </span>
                      </label>
                      {labelText && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            isStudentAnswer && isCorrectOption
                              ? "bg-green-200 text-green-800"
                              : isStudentAnswer
                              ? "bg-red-200 text-red-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {labelText}
                        </span>
                      )}
                    </div>
                    {option.image && (
                      <div className="mt-2 ml-8">
                        <img
                          src={option.image.toString()}
                          alt={`Option ${option.text} Image`}
                          className="max-w-[150px] h-auto rounded-md"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Points Earned: </span>
                {isEditingPoints ? (
                  <input
                    type="number"
                    value={editedPoints}
                    onChange={handlePointsChange}
                    className="w-20 px-2 py-1 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500"
                    min="0"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {editedPoints}
                  </span>
                )}
                <Button
                  variant="link"
                  onClick={toggleEditPoints}
                  className="text-primary hover:underline text-sm"
                >
                  Edit points
                </Button>
              </div>
              {pointsError && (
                <span className="text-red-500 text-sm">{pointsError}</span>
              )}
            </div>
          </div>
        );

      case "true_false":
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
            <div className="space-y-2">
              {["True", "False"].map((val) => {
                const isStudentAnswer =
                  resultData.answer === val.toLowerCase();
                const isCorrectOption =
                  resultData.correctAnswer === val.toLowerCase();
                const bgClass =
                  (isStudentAnswer && isCorrectOption) ||
                  (!isStudentAnswer && isCorrectOption)
                    ? "bg-green-100 border-green-500"
                    : isStudentAnswer
                    ? "bg-red-100 border-red-500"
                    : "bg-white border-gray-200";

                // Determine the label to display
                let labelText = "";
                if (isStudentAnswer && isCorrectOption) {
                  labelText = `${learnerTerm} answer is correct`;
                } else if (isStudentAnswer) {
                  labelText = `${learnerTerm} answer is incorrect`;
                } else if (isCorrectOption) {
                  labelText = "Correct answer";
                }

                return (
                  <div
                    key={val}
                    className={`p-3 rounded-lg border ${bgClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name={`question-${question._id}`}
                          value={val}
                          checked={isStudentAnswer}
                          readOnly
                          disabled
                          className={`w-5 h-5 ${
                            (isStudentAnswer && isCorrectOption) ||
                            (!isStudentAnswer && isCorrectOption)
                              ? "text-green-500"
                              : isStudentAnswer
                              ? "text-red-500"
                              : "text-gray-600"
                          } border-gray-300`}
                        />
                        <span className="text-gray-800 text-base">{val}</span>
                      </label>
                      {labelText && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            isStudentAnswer && isCorrectOption
                              ? "bg-green-200 text-green-800"
                              : isStudentAnswer
                              ? "bg-red-200 text-red-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {labelText}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Points Earned: </span>
                {isEditingPoints ? (
                  <input
                    type="number"
                    value={editedPoints}
                    onChange={handlePointsChange}
                    className="w-20 px-2 py-1 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500"
                    min="0"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {editedPoints}
                  </span>
                )}
                <Button
                  variant="link"
                  onClick={toggleEditPoints}
                  className="text-primary hover:underline text-sm"
                >
                  Edit points
                </Button>
              </div>
              {pointsError && (
                <span className="text-red-500 text-sm">{pointsError}</span>
              )}
            </div>
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4 flex justify-center">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
            <div className="space-y-2">
              {question.options?.map((option, index) => {
                const isStudentAnswer = option.isStudentAnswer;
                const isCorrectOption = option.isCorrect;
                const bgClass =
                  (isStudentAnswer && isCorrectOption) ||
                  (!isStudentAnswer && isCorrectOption)
                    ? "bg-green-100 border-green-500"
                    : isStudentAnswer
                    ? "bg-red-100 border-red-500"
                    : "bg-white border-gray-200";

                // Determine the label to display
                let labelText = "";
                if (isStudentAnswer && isCorrectOption) {
                  labelText = `${learnerTerm} answer is correct`;
                } else if (isStudentAnswer) {
                  labelText = `${learnerTerm} answer is incorrect`;
                } else if (isCorrectOption) {
                  labelText = "Correct answer";
                }

                return (
                  <div
                    key={`${question._id}-${index}`}
                    className={`p-3 rounded-lg border ${bgClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          name={`question-${question._id}`}
                          value={option.option}
                          checked={!!isStudentAnswer}
                          readOnly
                          disabled
                          className={`w-5 h-5 ${
                            (isStudentAnswer && isCorrectOption) ||
                            (!isStudentAnswer && isCorrectOption)
                              ? "text-green-500"
                              : isStudentAnswer
                              ? "text-red-500"
                              : "text-gray-600"
                          } border-gray-300`}
                        />
                        <span className="text-gray-800 text-base">
                          {option.text}
                        </span>
                      </label>
                      {labelText && (
                        <span
                          className={`text-sm px-2 py-1 rounded ${
                            isStudentAnswer && isCorrectOption
                              ? "bg-green-200 text-green-800"
                              : isStudentAnswer
                              ? "bg-red-200 text-red-800"
                              : "bg-green-200 text-green-800"
                          }`}
                        >
                          {labelText}
                        </span>
                      )}
                    </div>
                    {option.image && (
                      <div className="mt-2 ml-8">
                        <img
                          src={option.image?.toString()}
                          alt={`Option ${option.text} Image`}
                          className="max-w-[150px] h-auto rounded-md"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Points Earned: </span>
                {isEditingPoints ? (
                  <input
                    type="number"
                    value={editedPoints}
                    onChange={handlePointsChange}
                    className="w-20 px-2 py-1 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500"
                    min="0"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {editedPoints}
                  </span>
                )}
                <Button
                  variant="link"
                  onClick={toggleEditPoints}
                  className="text-primary hover:underline text-sm"
                >
                  Edit points
                </Button>
              </div>
              {pointsError && (
                <span className="text-red-500 text-sm">{pointsError}</span>
              )}
            </div>
          </div>
        );

      case "fill_in_the_blank":
        const hasNoFillAnswer =
          !resultData.answer || resultData.answer === "";
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
            <div>
              <span className="text-gray-600 block mb-1">Answer:</span>
              {hasNoFillAnswer ? (
                <div className="text-yellow-600 text-sm">
                  Student has no answer
                </div>
              ) : (
                <div
                  className={`p-2 rounded-lg border ${
                    resultData.isCorrect
                      ? "bg-green-100 border-green-500"
                      : "bg-red-100 border-red-500"
                  }`}
                >
                  <span className="text-gray-800">
                    {typeof resultData.answer === "string"
                      ? resultData.answer
                      : ""}
                  </span>
                </div>
              )}
            </div>
            <div>
              <span className="text-gray-600 block mb-1">Correct Answer:</span>
              <div className="p-2 rounded-lg bg-green-100 border border-green-500">
                <span className="text-gray-800">
                  {typeof resultData.correctAnswer === "string"
                    ? resultData.correctAnswer
                    : ""}
                </span>
              </div>
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Points Earned: </span>
                {isEditingPoints ? (
                  <input
                    type="number"
                    value={editedPoints}
                    onChange={handlePointsChange}
                    className="w-20 px-2 py-1 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500"
                    min="0"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {editedPoints}
                  </span>
                )}
                <Button
                  variant="link"
                  onClick={toggleEditPoints}
                  className="text-primary hover:underline text-sm"
                >
                  Edit points
                </Button>
              </div>
              {pointsError && (
                <span className="text-red-500 text-sm">{pointsError}</span>
              )}
            </div>
          </div>
        );

      case "enumeration":
        const studentAnswers = Array.isArray(resultData.answer)
          ? resultData.answer
          : [""];
        const correctAnswers = Array.isArray(resultData.correctAnswer)
          ? resultData.correctAnswer
          : [""];
        const hasNoEnumAnswer =
          studentAnswers.length === 0 || studentAnswers.every((ans) => ans === "");
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
            <div>
              <span className="text-gray-600 block mb-1">Answers:</span>
              {hasNoEnumAnswer ? (
                <div className="text-yellow-600 text-sm">
                  Student has no answer
                </div>
              ) : (
                studentAnswers.map((ans, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg mb-1 border ${
                      resultData.isCorrect
                        ? "bg-green-100 border-green-500"
                        : "bg-red-100 border-red-500"
                    }`}
                  >
                    <span className="text-gray-800">{ans}</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <span className="text-gray-600 block mb-1">Correct Answers:</span>
              {correctAnswers.map((ans, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg mb-1 bg-green-100 border border-green-500"
                >
                  <span className="text-gray-800">{ans}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Points Earned: </span>
                {isEditingPoints ? (
                  <input
                    type="number"
                    value={editedPoints}
                    onChange={handlePointsChange}
                    className="w-20 px-2 py-1 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500"
                    min="0"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {editedPoints}
                  </span>
                )}
                <Button
                  variant="link"
                  onClick={toggleEditPoints}
                  className="text-primary hover:underline text-sm"
                >
                  Edit points
                </Button>
              </div>
              {pointsError && (
                <span className="text-red-500 text-sm">{pointsError}</span>
              )}
            </div>
          </div>
        );

      case "essay":
        const hasNoEssayAnswer =
          !resultData.answer || resultData.answer === "";
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-md"
                />
              </div>
            )}
            <div>
              <span className="text-gray-600 block mb-1">Answer:</span>
              {hasNoEssayAnswer ? (
                <div className="text-yellow-600 text-sm">
                  Student has no answer
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-gray-800">
                    {typeof resultData.answer === "string"
                      ? resultData.answer
                      : ""}
                  </span>
                </div>
              )}
            </div>
            {resultData.correctAnswer && (
              <div>
                <span className="text-gray-600 block mb-1">
                  Expected Answer:
                </span>
                <div className="p-2 rounded-lg bg-green-100 border border-green-500">
                  <span className="text-gray-800">
                    {typeof resultData.correctAnswer === "string"
                      ? resultData.correctAnswer
                      : ""}
                  </span>
                </div>
              </div>
            )}
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Points Earned: </span>
                {isEditingPoints ? (
                  <input
                    type="number"
                    value={editedPoints}
                    onChange={handlePointsChange}
                    className="w-20 px-2 py-1 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500"
                    min="0"
                  />
                ) : (
                  <span className="font-medium text-gray-900">
                    {editedPoints}
                  </span>
                )}
                <Button
                  variant="link"
                  onClick={toggleEditPoints}
                  className="text-primary hover:underline text-sm"
                >
                  Edit points
                </Button>
              </div>
              {pointsError && (
                <span className="text-red-500 text-sm">{pointsError}</span>
              )}
            </div>
          </div>
        );

      default:
        return <p className="text-gray-500">Unsupported question type</p>;
    }
  };

  return (
    <div className="bg-white rounded-lg md:p-6 p-4 mb-6 shadow">
      <div className="flex items-start">
        <span className="text-gray-600 font-medium mr-2">{index + 1}.</span>
        <div className="flex-1">
          <h3 className="text-gray-800 text-lg font-medium mb-4 flex items-center gap-2">
            {question.questionText}
            <span className="text-gray-400 font-normal text-sm">
              ({question.points}pts - {formatQuestionType(question.type)})
            </span>
          </h3>
          {renderResultContent()}
        </div>
      </div>
    </div>
  );
}