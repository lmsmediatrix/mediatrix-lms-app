import { useState, useEffect } from "react";
import { IQuestion } from "../../types/interfaces";

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

interface AssessmentQuestionProps {
  question: IQuestion;
  index: number;
  onAnswerChange: (questionId: string, answer: string | string[]) => void;
  initialAnswer?: string | string[];
  isUnanswered?: boolean; // New prop to indicate if the question is unanswered
}

export default function AssessmentQuestion({
  question,
  index,
  onAnswerChange,
  initialAnswer,
  isUnanswered = false, // Default to false
}: AssessmentQuestionProps) {
  const [answer, setAnswer] = useState<string | string[]>(initialAnswer || "");

  useEffect(() => {
    if (initialAnswer !== undefined) {
      setAnswer(initialAnswer);
    }
  }, [initialAnswer]);

  const handleMultipleChoice = (option: string) => {
    setAnswer(option);
    if (question._id) onAnswerChange(question._id, option);
  };

  const handleTrueFalse = (value: string) => {
    const newAnswer = value.toLowerCase();
    setAnswer(newAnswer);
    if (question._id) onAnswerChange(question._id, newAnswer);
  };

  const handleFillIn = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    if (question._id) onAnswerChange(question._id, newAnswer);
  };

  const handleEnumeration = (idx: number, value: string) => {
    const newAnswers = Array.isArray(answer) ? [...answer] : [""];
    newAnswers[idx] = value;
    const filteredAnswers = newAnswers.filter((a) => a);
    setAnswer(filteredAnswers);
    if (question._id) onAnswerChange(question._id, filteredAnswers);
  };

  const addEnumeration = () => {
    const newAnswers = [...(Array.isArray(answer) ? answer : []), ""];
    setAnswer(newAnswers);
    if (question._id) onAnswerChange(question._id, newAnswers);
  };

  const handleEssay = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newAnswer = e.target.value;
    setAnswer(newAnswer);
    if (question._id) onAnswerChange(question._id, newAnswer);
  };

  const handleCheckboxChange = (option: string) => {
    const checkboxAnswers = Array.isArray(answer) ? answer : [];
    let newAnswers: string[];
    if (checkboxAnswers.includes(option)) {
      newAnswers = checkboxAnswers.filter((ans) => ans !== option);
    } else {
      newAnswers = [...checkboxAnswers, option];
    }
    setAnswer(newAnswers);
    if (question._id) onAnswerChange(question._id, newAnswers);
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4 flex justify-center">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-lg"
                />
              </div>
            )}
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <label
                  key={`${question._id}-${index}`}
                  className={`block p-3 rounded-lg border cursor-pointer ${
                    answer === option.option
                      ? "bg-blue-100 border-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={option.option}
                      checked={answer === option.option}
                      onChange={() => handleMultipleChoice(option.option)}
                      className="w-5 h-5 text-gray-600 border-gray-300 focus:ring-0"
                    />
                    <span className="text-gray-800 text-base">
                      {option.text}
                    </span>
                  </div>
                  {option.image && (
                    <div className="ml-8 mt-2">
                      <img
                        src={option.image.toString()}
                        alt={`Option ${option.text} Image`}
                        className="max-w-[150px] h-auto rounded-lg"
                      />
                    </div>
                  )}
                </label>
              ))}
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
                  className="max-w-xs h-auto rounded-lg"
                />
              </div>
            )}
            <div className="space-y-2">
              {["True", "False"].map((val) => (
                <label
                  key={val}
                  className={`block p-3 rounded-lg border cursor-pointer ${
                    answer === val.toLowerCase()
                      ? "bg-blue-100 border-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={val}
                      checked={answer === val.toLowerCase()}
                      onChange={() => handleTrueFalse(val)}
                      className="w-5 h-5 text-gray-600 border-gray-300 focus:ring-0"
                    />
                    <span className="text-gray-800 text-base">{val}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case "checkbox":
        const checkboxAnswers = Array.isArray(answer) ? answer : [];
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4 flex justify-center">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-lg"
                />
              </div>
            )}
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <label
                  key={`${question._id}-${index}`}
                  className={`block p-3 rounded-lg border cursor-pointer ${
                    checkboxAnswers.includes(option.option)
                      ? "bg-blue-100 border-blue-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name={`question-${question._id}`}
                      value={option.option}
                      checked={checkboxAnswers.includes(option.option)}
                      onChange={() => handleCheckboxChange(option.option)}
                      className="w-5 h-5 text-gray-600 border-gray-300 focus:ring-0"
                    />
                    <span className="text-gray-800 text-base">
                      {option.text}
                    </span>
                  </div>
                  {option.image && (
                    <div className="ml-8 mt-2">
                      <img
                        src={option.image?.toString()}
                        alt={`Option ${option.text} Image`}
                        className="max-w-[150px] h-auto rounded-lg"
                      />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>
        );

      case "fill_in_the_blank":
        return (
          <div>
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-lg"
                />
              </div>
            )}
            <input
              type="text"
              value={typeof answer === "string" ? answer : ""}
              onChange={handleFillIn}
              placeholder="Your answer"
              minLength={1}
              maxLength={100}
              className="w-full max-w-md px-3 py-2 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500 bg-white"
            />
          </div>
        );

      case "enumeration":
        const enumAnswers = Array.isArray(answer) ? answer : [""];
        return (
          <div className="space-y-3">
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-lg"
                />
              </div>
            )}
            {enumAnswers.map((ans, idx) => (
              <input
                key={idx}
                type="text"
                value={ans}
                onChange={(e) => handleEnumeration(idx, e.target.value)}
                placeholder={`Answer ${idx + 1}`}
                minLength={1}
                maxLength={100}
                className="w-full max-w-md px-3 py-2 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:border-green-500 bg-white"
              />
            ))}
            <button
              onClick={addEnumeration}
              className="text-primary hover:underline text-sm ml-2"
            >
              Add another answer
            </button>
          </div>
        );

      case "essay":
        return (
          <div>
            {question.questionImage && (
              <div className="mb-4">
                <img
                  src={question.questionImage?.toString()}
                  alt="Question Image"
                  className="max-w-xs h-auto rounded-lg"
                />
              </div>
            )}
            <textarea
              value={typeof answer === "string" ? answer : ""}
              onChange={handleEssay}
              placeholder="Your answer"
              maxLength={4000}
              className="w-full max-w-2xl px-3 py-2 text-gray-800 border rounded-lg border-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-y min-h-[200px]"
            />
          </div>
        );

      default:
        return <p className="text-gray-500">Unsupported question type</p>;
    }
  };

  return (
    <div
      className={`bg-white rounded-lg md:p-6 p-4 mb-6 shadow ${
        isUnanswered ? "border-2 border-red-500" : "border border-gray-200"
      }`}
    >
      <div className="flex items-start">
        <span className="text-gray-600 font-medium mr-2">{index + 1}.</span>
        <div className="flex-1">
          <h3 className="text-gray-800 text-lg font-medium mb-4 flex items-center gap-2">
            {question.questionText}
            <span className="text-gray-400 font-normal text-sm">
              ({question.points}pts - {formatQuestionType(question.type)})
            </span>
          </h3>
          {renderQuestionContent()}
        </div>
      </div>
    </div>
  );
}