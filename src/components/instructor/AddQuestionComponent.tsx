import React, { useState, useEffect } from "react";
import Button from "../common/Button";
import { MdDelete } from "react-icons/md";
import { TQuestionType, IQuestion } from "../../types/interfaces";
import { FaImage } from "react-icons/fa";

interface AddQuestionComponentProps {
  onAdd: (question: IQuestion) => void;
  initialQuestion?: IQuestion;
  onCancel?: () => void;
  /** When "auto", essay questions are not allowed (manual grading required). */
  gradeMethod?: "manual" | "auto" | "mixed";
}

export default function AddQuestionComponent({
  onAdd,
  initialQuestion,
  onCancel,
  gradeMethod = "auto",
}: AddQuestionComponentProps) {
  const allowEssay = gradeMethod !== "auto" || initialQuestion?.type === "essay";
  const [questionText, setQuestionText] = useState(
    initialQuestion?.questionText || ""
  );
  const [questionType, setQuestionType] = useState<TQuestionType>(
    (initialQuestion?.type as TQuestionType) || "multiple_choice"
  );
  const [choices, setChoices] = useState<string[]>(
    initialQuestion?.options?.map((opt) => opt.text || "") || []
  );
  const [correctAnswer, setCorrectAnswer] = useState<number | null>(() => {
    if (initialQuestion?.type === "true_false") {
      const firstCorrectAnswer =
        typeof initialQuestion?.correctAnswers?.[0] === "string"
          ? initialQuestion.correctAnswers[0].toLowerCase()
          : "";

      if (firstCorrectAnswer === "true") return 0;
      if (firstCorrectAnswer === "false") return 1;

      if (initialQuestion?.options && initialQuestion.options.length > 0) {
        const correctIndexFromOption = initialQuestion.options.findIndex(
          (opt) => opt.isCorrect
        );
        return correctIndexFromOption >= 0 ? correctIndexFromOption : null;
      }

      return null;
    } else if (initialQuestion?.options) {
      const correctIndex = initialQuestion.options.findIndex(
        (opt) => opt.isCorrect
      );
      return correctIndex >= 0 ? correctIndex : null;
    }
    return null;
  });
  const [points, setPoints] = useState(initialQuestion?.points || 1);
  const [enumerationAnswers, setEnumerationAnswers] = useState<string[]>(
    initialQuestion?.correctAnswers || [""]
  );
  const [fillInBlankAnswer, setFillInBlankAnswer] = useState(
    initialQuestion?.correctAnswers?.[0] || ""
  );
  const [correctAnswers, setCorrectAnswers] = useState<number[]>(() => {
    if (initialQuestion?.options) {
      return initialQuestion.options
        .map((opt, index) => (opt.isCorrect ? index : -1))
        .filter((index) => index !== -1);
    }
    return [];
  });
  const [newChoice, setNewChoice] = useState<string>("");
  const [newChoiceImage, setNewChoiceImage] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [questionImage, setQuestionImage] = useState<File | string | null>(
    initialQuestion?.questionImage || null
  );
  const [choiceImages, setChoiceImages] = useState<(File | string | null)[]>(
    initialQuestion?.options?.map((opt) => opt.image || null) || []
  );
  const enumerationPointTotal = Math.max(
    1,
    enumerationAnswers.filter((answer) => answer.trim()).length
  );

  useEffect(() => {
    if (questionType === "enumeration" && points !== enumerationPointTotal) {
      setPoints(enumerationPointTotal);
    }
  }, [questionType, points, enumerationPointTotal]);

  useEffect(() => {
    if (!initialQuestion) {
      if (questionType === "true_false") {
        setChoices(["True", "False"]);
        setNewChoice("");
        setCorrectAnswers([]);
        setCorrectAnswer(null);
      } else if (questionType === "enumeration") {
        setEnumerationAnswers([""]);
      } else if (questionType === "fill_in_the_blank") {
        setFillInBlankAnswer("");
      }
    } else if (questionType === "true_false" && choices.length === 0) {
      setChoices(["True", "False"]);
    }
  }, [questionType, initialQuestion, choices.length]);

  const handleAddChoice = () => {
    if (!newChoice.trim() && !newChoiceImage) {
      setError("Please provide either text or an image for the choice");
      return;
    }
    setChoices((prev) => [...prev, newChoice.trim()]);
    setChoiceImages((prev) => [...prev, newChoiceImage]);
    setNewChoice("");
    setNewChoiceImage(null);
    setError("");
  };

  const handleDeleteChoice = (indexToDelete: number) => {
    setChoices(choices.filter((_, index) => index !== indexToDelete));
    setChoiceImages(choiceImages.filter((_, index) => index !== indexToDelete));
    if (correctAnswer === indexToDelete) {
      setCorrectAnswer(null);
    } else if (correctAnswer !== null && correctAnswer > indexToDelete) {
      setCorrectAnswer(correctAnswer - 1);
    }
    setCorrectAnswers((prev) =>
      prev
        .filter((i) => i !== indexToDelete)
        .map((i) => (i > indexToDelete ? i - 1 : i))
    );
  };

  const handleQuestionImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setQuestionImage(e.target.files[0]);
    }
  };

  const handleNewChoiceImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files[0]) {
      setNewChoiceImage(e.target.files[0]);
    }
  };

  const handleAddQuestion = () => {
    if (!questionText.trim()) {
      setError("Please enter a question");
      return;
    }

    let newQuestion: IQuestion = {
      type: questionType,
      questionText: questionText,
      points: points,
      ...(questionImage && { image: questionImage }),
    };

    switch (questionType) {
      case "multiple_choice":
        if (correctAnswer === null || choices.length < 2) {
          setError("Please select a correct answer and add at least 2 choices");
          return;
        }
        newQuestion.options = choices.map((text, index) => ({
          option: `Option ${index + 1}`,
          text,
          isCorrect: index === correctAnswer,
          ...(choiceImages[index] && { image: choiceImages[index] }),
        }));
        break;

      case "checkbox":
        if (correctAnswers.length < 2 || choices.length < 3) {
          setError(
            "Please select at least 2 correct answer and add at least 3 choices"
          );
          return;
        }
        newQuestion.options = choices.map((text, index) => ({
          option: `Option ${index + 1}`,
          text,
          isCorrect: correctAnswers.includes(index),
          ...(choiceImages[index] && { image: choiceImages[index] }),
        }));
        break;

      case "true_false":
        if (correctAnswer === null) {
          setError("Please select True or False as the correct answer");
          return;
        }
        newQuestion.correctAnswers = [choices[correctAnswer].toLowerCase()];
        newQuestion.options = choices.map((text, index) => ({
          option: `Option ${index + 1}`,
          text,
          isCorrect: index === correctAnswer,
          ...(choiceImages[index] && { image: choiceImages[index] }),
        }));
        break;

      case "essay":
        break;

      case "enumeration":
        if (enumerationAnswers.some((answer) => !answer.trim())) {
          setError("Please fill in all enumeration answers");
          return;
        }
        if (enumerationAnswers.length < 2) {
          setError("Please add at least 2 answers for enumeration");
          return;
        }
        newQuestion.correctAnswers = enumerationAnswers.filter((answer) =>
          answer.trim()
        );
        newQuestion.points = newQuestion.correctAnswers.length;
        break;

      case "fill_in_the_blank":
        if (!fillInBlankAnswer.trim()) {
          setError("Please provide the correct answer");
          return;
        }
        newQuestion.correctAnswers = [fillInBlankAnswer];
        break;
    }

    onAdd(newQuestion);
    setQuestionText("");
    setChoices([]);
    setCorrectAnswer(null);
    setCorrectAnswers([]);
    setError("");
    setQuestionImage(null);
    setChoiceImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddChoice();
    }
  };

  const handleCheckboxChange = (index: number) => {
    setCorrectAnswers((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleEnumerationAnswerChange = (index: number, value: string) => {
    const newAnswers = [...enumerationAnswers];
    newAnswers[index] = value;
    setEnumerationAnswers(newAnswers);
  };

  const addEnumerationAnswer = () => {
    setEnumerationAnswers([...enumerationAnswers, ""]);
  };

  const removeEnumerationAnswer = (index: number) => {
    setEnumerationAnswers(enumerationAnswers.filter((_, i) => i !== index));
  };

  const getImageSrc = (image: File | string | null) => {
    if (!image) return null;
    return image instanceof File ? URL.createObjectURL(image) : image;
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Question Type
          </label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as TQuestionType)}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="enumeration">Enumeration</option>
            <option value="fill_in_the_blank">Fill in the Blank</option>
            <option value="essay" disabled={!allowEssay}>
              Essay{!allowEssay ? " (use Manually or Mixed grading)" : ""}
            </option>
            <option value="checkbox">Checkbox</option>
          </select>
          {!allowEssay && (
            <p className="mt-1 text-xs text-amber-600">
              Essay requires Manually or Mixed grading. Change Grading Method above to add essay questions.
            </p>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">
            Points
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(parseInt(e.target.value))}
            placeholder="Enter points"
            min={1}
            max={100}
                className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={questionType === "enumeration"}
          />
          {questionType === "enumeration" && (
            <p className="mt-1 text-xs text-gray-500">
              Auto points: 1 point per enumeration answer ({enumerationPointTotal} total).
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mt-2">
            Question Text
          </label>
          <input
            type="text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Enter your question here"
            minLength={1}
            maxLength={500}
            className="mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {questionImage && (
            <div className="mt-2 flex justify-center">
              <img
                src={getImageSrc(questionImage) || undefined}
                alt="Question preview"
                className="max-w-xs max-h-48 object-contain"
              />
            </div>
          )}
        </div>
        <label className="mt-6 cursor-pointer">
          <FaImage className="text-gray-500 hover:text-primary" size={20} />
          <input
            type="file"
            accept="image/*"
            onChange={handleQuestionImageChange}
            className="hidden"
          />
        </label>
      </div>

      {questionType !== "essay" &&
        questionType !== "enumeration" &&
        questionType !== "fill_in_the_blank" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mt-2">
              {questionType === "true_false" ? "Answer" : "Choices"}
              <span className="pl-2 text-gray-500 font-normal italic">
                {questionType === "checkbox"
                  ? "Select all correct answers"
                  : "Mark the correct answer"}
              </span>
            </label>

            <div className="space-y-2 mt-2">
              {choices.map((choice, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-2 py-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center flex-1 gap-2">
                    {questionType === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={correctAnswers.includes(index)}
                        onChange={() => handleCheckboxChange(index)}
                        className="mr-2"
                      />
                    ) : (
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={correctAnswer === index}
                        onChange={() => setCorrectAnswer(index)}
                        className="mr-2"
                      />
                    )}
                    {choice ? (
                      <div>
                        <span
                          className={`${
                            (
                              questionType === "checkbox"
                                ? correctAnswers.includes(index)
                                : correctAnswer === index
                            )
                              ? "text-primary font-semibold"
                              : ""
                          }`}
                        >
                          {choice}
                          {(questionType === "checkbox"
                            ? correctAnswers.includes(index)
                            : correctAnswer === index) && (
                            <span className="ml-2 bg-primary px-2 py-1 rounded-full text-white font-normal text-xs">
                              Correct Answer
                            </span>
                          )}
                        </span>
                        {choiceImages[index] && (
                          <div className="mt-2">
                            <img
                              src={
                                getImageSrc(choiceImages[index]) || undefined
                              }
                              alt={`Option ${index + 1} preview`}
                              className="max-w-xs max-h-32 object-contain"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      choiceImages[index] && (
                        <div className="flex items-center gap-2">
                          <img
                            src={getImageSrc(choiceImages[index]) || undefined}
                            alt={`Option ${index + 1} preview`}
                            className="max-w-xs max-h-32 object-contain"
                          />
                          {(questionType === "checkbox"
                            ? correctAnswers.includes(index)
                            : correctAnswer === index) && (
                            <span className="bg-primary px-2 py-1 rounded-full text-white font-normal text-xs">
                              Correct Answer
                            </span>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  {questionType !== "true_false" && (
                    <button
                      type="button"
                      onClick={() => handleDeleteChoice(index)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
                      title="Delete choice"
                    >
                      <MdDelete size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {questionType !== "true_false" &&
        questionType !== "essay" &&
        questionType !== "enumeration" &&
        questionType !== "fill_in_the_blank" && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChoice}
                onChange={(e) => setNewChoice(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add choice"
                minLength={1}
                maxLength={500}
                className="px-3 py-2 w-1/2 bg-gray-100 rounded-md"
              />
              <button
                type="button"
                onClick={handleAddChoice}
                className="ml-2 bg-gray-100 text-primary hover:text-white px-4 py-2 rounded hover:bg-primary"
              >
                Add
              </button>
              <label className="cursor-pointer">
                <FaImage
                  className="text-gray-500 hover:text-primary"
                  size={20}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewChoiceImageChange}
                  className="hidden"
                />
              </label>
            </div>
            {newChoiceImage && (
              <div className="ml-2">
                <img
                  src={getImageSrc(newChoiceImage) || undefined}
                  alt="New choice preview"
                  className="max-w-xs max-h-32 object-contain"
                />
              </div>
            )}
          </div>
        )}

      {questionType === "enumeration" && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Correct Answers
          </label>
          {enumerationAnswers.map((answer, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={answer}
                onChange={(e) =>
                  handleEnumerationAnswerChange(index, e.target.value)
                }
                className="px-3 py-2 bg-gray-100 rounded-md flex-1"
                placeholder={`Answer ${index + 1}`}
              />
              {enumerationAnswers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEnumerationAnswer(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addEnumerationAnswer}
            className="text-primary hover:text-primary-dark"
          >
            Add Another Answer
          </button>
        </div>
      )}

      {questionType === "fill_in_the_blank" && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Correct Answer
          </label>
          <input
            type="text"
            value={fillInBlankAnswer}
            onChange={(e) => setFillInBlankAnswer(e.target.value)}
            className="mt-1 px-3 py-2 bg-gray-100 rounded-md w-full"
            placeholder="Enter the correct answer"
          />
        </div>
      )}

      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="cancel" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button variant="primary" onClick={handleAddQuestion}>
          {/* {initialQuestion ? "Update Question" : "Add Question"} */}Save
        </Button>
      </div>
    </div>
  );
}
