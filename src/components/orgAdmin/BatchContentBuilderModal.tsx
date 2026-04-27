import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import {
  SectionBatchCreateInput,
  useBatchCreateSectionContent,
} from "../../hooks/useSection";

type BatchQuestionOptionForm = {
  option: string;
  text: string;
  isCorrect: boolean;
};

type BatchQuestionForm = {
  type: string;
  questionText: string;
  points: number;
  correctAnswersText: string;
  options: BatchQuestionOptionForm[];
};

type BatchAssessmentForm = {
  title: string;
  description: string;
  assessmentType: string;
  startDate: string;
  endDate: string;
  timeLimit: number;
  gradeMethod: "auto" | "manual" | "mixed";
  attemptsAllowed: number;
  questionsToDisplay: number;
  shuffleQuestions: boolean;
  questions: BatchQuestionForm[];
};

type BatchLessonForm = {
  title: string;
  description: string;
  information: string;
  startDate: string;
  endDate: string;
  mainContentText: string;
  assessments: BatchAssessmentForm[];
};

type BatchModuleForm = {
  title: string;
  description: string;
  certificateEnabled: boolean;
  lessons: BatchLessonForm[];
};

const createDefaultQuestion = (): BatchQuestionForm => ({
  type: "multiple_choice",
  questionText: "",
  points: 1,
  correctAnswersText: "",
  options: [
    { option: "Option 1", text: "", isCorrect: false },
    { option: "Option 2", text: "", isCorrect: false },
  ],
});

const createDefaultAssessment = (): BatchAssessmentForm => ({
  title: "",
  description: "",
  assessmentType: "quiz",
  startDate: "",
  endDate: "",
  timeLimit: 30,
  gradeMethod: "auto",
  attemptsAllowed: 1,
  questionsToDisplay: 1,
  shuffleQuestions: false,
  questions: [],
});

const createDefaultLesson = (): BatchLessonForm => ({
  title: "",
  description: "",
  information: "",
  startDate: "",
  endDate: "",
  mainContentText: "",
  assessments: [],
});

const createDefaultModule = (): BatchModuleForm => ({
  title: "",
  description: "",
  certificateEnabled: false,
  lessons: [],
});

interface BatchContentBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionCode: string;
}

export default function BatchContentBuilderModal({
  isOpen,
  onClose,
  sectionCode,
}: BatchContentBuilderModalProps) {
  const batchCreateMutation = useBatchCreateSectionContent();
  const [modules, setModules] = useState<BatchModuleForm[]>([
    createDefaultModule(),
  ]);

  const summary = useMemo(() => {
    const lessonCount = modules.reduce(
      (acc, moduleItem) => acc + moduleItem.lessons.length,
      0,
    );
    const assessmentCount = modules.reduce(
      (acc, moduleItem) =>
        acc +
        moduleItem.lessons.reduce(
          (lessonAcc, lesson) => lessonAcc + lesson.assessments.length,
          0,
        ),
      0,
    );

    return {
      moduleCount: modules.length,
      lessonCount,
      assessmentCount,
    };
  }, [modules]);

  const updateModule = (index: number, patch: Partial<BatchModuleForm>) => {
    setModules((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    patch: Partial<BatchLessonForm>,
  ) => {
    setModules((prev) =>
      prev.map((moduleItem, mIndex) => {
        if (mIndex !== moduleIndex) return moduleItem;
        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) =>
            lIndex === lessonIndex ? { ...lesson, ...patch } : lesson,
          ),
        };
      }),
    );
  };

  const updateAssessment = (
    moduleIndex: number,
    lessonIndex: number,
    assessmentIndex: number,
    patch: Partial<BatchAssessmentForm>,
  ) => {
    setModules((prev) =>
      prev.map((moduleItem, mIndex) => {
        if (mIndex !== moduleIndex) return moduleItem;
        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) => {
            if (lIndex !== lessonIndex) return lesson;
            return {
              ...lesson,
              assessments: lesson.assessments.map((assessment, aIndex) =>
                aIndex === assessmentIndex
                  ? { ...assessment, ...patch }
                  : assessment,
              ),
            };
          }),
        };
      }),
    );
  };

  const addModule = () =>
    setModules((prev) => [...prev, createDefaultModule()]);

  const removeModule = (moduleIndex: number) => {
    setModules((prev) => prev.filter((_, index) => index !== moduleIndex));
  };

  const addLesson = (moduleIndex: number) => {
    setModules((prev) =>
      prev.map((moduleItem, index) =>
        index === moduleIndex
          ? {
              ...moduleItem,
              lessons: [...moduleItem.lessons, createDefaultLesson()],
            }
          : moduleItem,
      ),
    );
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    setModules((prev) =>
      prev.map((moduleItem, index) =>
        index === moduleIndex
          ? {
              ...moduleItem,
              lessons: moduleItem.lessons.filter(
                (_, lIndex) => lIndex !== lessonIndex,
              ),
            }
          : moduleItem,
      ),
    );
  };

  const addAssessment = (moduleIndex: number, lessonIndex: number) => {
    setModules((prev) =>
      prev.map((moduleItem, index) => {
        if (index !== moduleIndex) return moduleItem;

        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) =>
            lIndex === lessonIndex
              ? {
                  ...lesson,
                  assessments: [
                    ...lesson.assessments,
                    createDefaultAssessment(),
                  ],
                }
              : lesson,
          ),
        };
      }),
    );
  };

  const removeAssessment = (
    moduleIndex: number,
    lessonIndex: number,
    assessmentIndex: number,
  ) => {
    setModules((prev) =>
      prev.map((moduleItem, index) => {
        if (index !== moduleIndex) return moduleItem;

        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) =>
            lIndex === lessonIndex
              ? {
                  ...lesson,
                  assessments: lesson.assessments.filter(
                    (_, aIndex) => aIndex !== assessmentIndex,
                  ),
                }
              : lesson,
          ),
        };
      }),
    );
  };

  const addQuestion = (
    moduleIndex: number,
    lessonIndex: number,
    assessmentIndex: number,
  ) => {
    setModules((prev) =>
      prev.map((moduleItem, index) => {
        if (index !== moduleIndex) return moduleItem;

        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) => {
            if (lIndex !== lessonIndex) return lesson;

            return {
              ...lesson,
              assessments: lesson.assessments.map((assessment, aIndex) =>
                aIndex === assessmentIndex
                  ? {
                      ...assessment,
                      questions: [
                        ...assessment.questions,
                        createDefaultQuestion(),
                      ],
                    }
                  : assessment,
              ),
            };
          }),
        };
      }),
    );
  };

  const removeQuestion = (
    moduleIndex: number,
    lessonIndex: number,
    assessmentIndex: number,
    questionIndex: number,
  ) => {
    setModules((prev) =>
      prev.map((moduleItem, index) => {
        if (index !== moduleIndex) return moduleItem;

        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) => {
            if (lIndex !== lessonIndex) return lesson;

            return {
              ...lesson,
              assessments: lesson.assessments.map((assessment, aIndex) =>
                aIndex === assessmentIndex
                  ? {
                      ...assessment,
                      questions: assessment.questions.filter(
                        (_, qIndex) => qIndex !== questionIndex,
                      ),
                    }
                  : assessment,
              ),
            };
          }),
        };
      }),
    );
  };

  const updateQuestion = (
    moduleIndex: number,
    lessonIndex: number,
    assessmentIndex: number,
    questionIndex: number,
    patch: Partial<BatchQuestionForm>,
  ) => {
    setModules((prev) =>
      prev.map((moduleItem, index) => {
        if (index !== moduleIndex) return moduleItem;

        return {
          ...moduleItem,
          lessons: moduleItem.lessons.map((lesson, lIndex) => {
            if (lIndex !== lessonIndex) return lesson;

            return {
              ...lesson,
              assessments: lesson.assessments.map((assessment, aIndex) => {
                if (aIndex !== assessmentIndex) return assessment;

                return {
                  ...assessment,
                  questions: assessment.questions.map((question, qIndex) =>
                    qIndex === questionIndex
                      ? { ...question, ...patch }
                      : question,
                  ),
                };
              }),
            };
          }),
        };
      }),
    );
  };

  const buildPayload = (): SectionBatchCreateInput => {
    return {
      modules: modules
        .filter((moduleItem) => moduleItem.title.trim().length > 0)
        .map((moduleItem) => ({
          title: moduleItem.title.trim(),
          description: moduleItem.description.trim() || undefined,
          certificateEnabled: moduleItem.certificateEnabled,
          lessons: moduleItem.lessons
            .filter((lesson) => lesson.title.trim().length > 0)
            .map((lesson) => ({
              title: lesson.title.trim(),
              description: lesson.description.trim() || undefined,
              information: lesson.information.trim() || undefined,
              startDate: lesson.startDate || undefined,
              endDate: lesson.endDate || undefined,
              mainContentText: lesson.mainContentText.trim() || undefined,
              assessments: lesson.assessments
                .filter(
                  (assessment) =>
                    assessment.title.trim().length > 0 &&
                    assessment.startDate.length > 0 &&
                    assessment.endDate.length > 0,
                )
                .map((assessment) => ({
                  title: assessment.title.trim(),
                  description: assessment.description.trim() || undefined,
                  assessmentType: assessment.assessmentType,
                  startDate: assessment.startDate,
                  endDate: assessment.endDate,
                  timeLimit: assessment.timeLimit,
                  gradeMethod: assessment.gradeMethod,
                  attemptsAllowed: assessment.attemptsAllowed,
                  questionsToDisplay: assessment.questionsToDisplay,
                  shuffleQuestions: assessment.shuffleQuestions,
                  questions: assessment.questions.map((question) => ({
                    type: question.type,
                    questionText: question.questionText,
                    points: Number(question.points) || 1,
                    correctAnswers: question.correctAnswersText
                      ? question.correctAnswersText
                          .split(",")
                          .map((answer) => answer.trim())
                          .filter(Boolean)
                      : undefined,
                    options: question.options
                      .map((option) => ({
                        option: option.option,
                        text: option.text,
                        isCorrect: option.isCorrect,
                      }))
                      .filter((option) => option.text.trim().length > 0),
                  })),
                })),
            })),
        })),
    };
  };

  const handleSubmit = async () => {
    const payload = buildPayload();

    if (payload.modules.length === 0) {
      toast.error("Add at least one module before submitting batch content.");
      return;
    }

    await toast.promise(
      batchCreateMutation.mutateAsync({
        sectionCode,
        payload,
      }),
      {
        pending: "Creating content batch...",
        success: {
          render({ data }) {
            const summary = data?.data?.summary;
            if (!summary) return "Batch content created.";
            return `Batch done: ${summary.modulesCreated} modules, ${summary.lessonsCreated} lessons, ${summary.assessmentsCreated} assessments.`;
          },
        },
        error: {
          render({ data }) {
            return (
              (data as Error)?.message || "Failed to create batch content."
            );
          },
        },
      },
    );
  };

  const resultSummary = batchCreateMutation.data?.data?.summary;
  const resultErrors = batchCreateMutation.data?.data?.errors || [];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Batch Content Builder"
      subTitle="Text-only v1 flow: module -> lesson -> assessment"
      contentClassName="w-[95vw] md:w-[80vw] max-h-[90vh] overflow-y-auto"
      backdrop="blur"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 border px-4 py-3 text-sm text-gray-600">
          <p>
            Summary: {summary.moduleCount} modules, {summary.lessonCount}{" "}
            lessons, {summary.assessmentCount} assessments
          </p>
          <p className="mt-1">
            Batch mode does not support lesson files or question image uploads.
          </p>
        </div>

        {modules.map((moduleItem, moduleIndex) => (
          <div
            key={`module-${moduleIndex}`}
            className="rounded-lg border p-4 space-y-4 bg-white"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Module {moduleIndex + 1}
              </h3>
              <button
                type="button"
                className="text-xs text-red-600 hover:text-red-700"
                onClick={() => removeModule(moduleIndex)}
                disabled={modules.length <= 1}
              >
                Remove module
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={moduleItem.title}
                onChange={(event) =>
                  updateModule(moduleIndex, { title: event.target.value })
                }
                placeholder="Module title"
                className="border rounded-md px-3 py-2 text-sm"
              />
              <input
                value={moduleItem.description}
                onChange={(event) =>
                  updateModule(moduleIndex, { description: event.target.value })
                }
                placeholder="Module description (optional)"
                className="border rounded-md px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={moduleItem.certificateEnabled}
                onChange={(event) =>
                  updateModule(moduleIndex, {
                    certificateEnabled: event.target.checked,
                  })
                }
              />
              Enable module completion certificate
            </label>

            <div className="space-y-3">
              {moduleItem.lessons.map((lesson, lessonIndex) => (
                <div
                  key={`lesson-${lessonIndex}`}
                  className="rounded-md border bg-gray-50 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Lesson {lessonIndex + 1}
                    </h4>
                    <button
                      type="button"
                      className="text-xs text-red-600 hover:text-red-700"
                      onClick={() => removeLesson(moduleIndex, lessonIndex)}
                    >
                      Remove lesson
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      value={lesson.title}
                      onChange={(event) =>
                        updateLesson(moduleIndex, lessonIndex, {
                          title: event.target.value,
                        })
                      }
                      placeholder="Lesson title"
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      value={lesson.description}
                      onChange={(event) =>
                        updateLesson(moduleIndex, lessonIndex, {
                          description: event.target.value,
                        })
                      }
                      placeholder="Lesson description"
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={lesson.startDate}
                      onChange={(event) =>
                        updateLesson(moduleIndex, lessonIndex, {
                          startDate: event.target.value,
                        })
                      }
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="date"
                      value={lesson.endDate}
                      onChange={(event) =>
                        updateLesson(moduleIndex, lessonIndex, {
                          endDate: event.target.value,
                        })
                      }
                      className="border rounded-md px-3 py-2 text-sm"
                    />
                  </div>

                  <textarea
                    value={lesson.mainContentText}
                    onChange={(event) =>
                      updateLesson(moduleIndex, lessonIndex, {
                        mainContentText: event.target.value,
                      })
                    }
                    placeholder="Lesson main content (text only)"
                    className="w-full border rounded-md px-3 py-2 text-sm min-h-20"
                  />

                  <div className="space-y-3">
                    {lesson.assessments.map((assessment, assessmentIndex) => (
                      <div
                        key={`assessment-${assessmentIndex}`}
                        className="rounded-md border bg-white p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold text-gray-700">
                            Assessment {assessmentIndex + 1}
                          </h5>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:text-red-700"
                            onClick={() =>
                              removeAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                              )
                            }
                          >
                            Remove assessment
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input
                            value={assessment.title}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  title: event.target.value,
                                },
                              )
                            }
                            placeholder="Assessment title"
                            className="border rounded-md px-3 py-2 text-sm"
                          />
                          <select
                            value={assessment.assessmentType}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  assessmentType: event.target.value,
                                },
                              )
                            }
                            className="border rounded-md px-3 py-2 text-sm"
                          >
                            <option value="quiz">Quiz</option>
                            <option value="assignment">Assignment</option>
                            <option value="activity">Activity</option>
                            <option value="monthly_test">Monthly Test</option>
                            <option value="periodical_test">
                              Periodical Test
                            </option>
                            <option value="final_exam">Final Exam</option>
                          </select>
                          <input
                            type="date"
                            value={assessment.startDate}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  startDate: event.target.value,
                                },
                              )
                            }
                            className="border rounded-md px-3 py-2 text-sm"
                          />
                          <input
                            type="date"
                            value={assessment.endDate}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  endDate: event.target.value,
                                },
                              )
                            }
                            className="border rounded-md px-3 py-2 text-sm"
                          />
                        </div>

                        <textarea
                          value={assessment.description}
                          onChange={(event) =>
                            updateAssessment(
                              moduleIndex,
                              lessonIndex,
                              assessmentIndex,
                              {
                                description: event.target.value,
                              },
                            )
                          }
                          placeholder="Assessment description"
                          className="w-full border rounded-md px-3 py-2 text-sm min-h-20"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="number"
                            min={5}
                            value={assessment.timeLimit}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  timeLimit: Number(event.target.value) || 30,
                                },
                              )
                            }
                            placeholder="Time limit"
                            className="border rounded-md px-3 py-2 text-sm"
                          />
                          <select
                            value={assessment.gradeMethod}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  gradeMethod: event.target.value as
                                    | "auto"
                                    | "manual"
                                    | "mixed",
                                },
                              )
                            }
                            className="border rounded-md px-3 py-2 text-sm"
                          >
                            <option value="auto">Auto</option>
                            <option value="manual">Manual</option>
                            <option value="mixed">Mixed</option>
                          </select>
                          <input
                            type="number"
                            min={1}
                            value={assessment.attemptsAllowed}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  attemptsAllowed:
                                    Number(event.target.value) || 1,
                                },
                              )
                            }
                            placeholder="Attempts"
                            className="border rounded-md px-3 py-2 text-sm"
                          />
                          <input
                            type="number"
                            min={1}
                            value={assessment.questionsToDisplay}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  questionsToDisplay:
                                    Number(event.target.value) || 1,
                                },
                              )
                            }
                            placeholder="Questions to show"
                            className="border rounded-md px-3 py-2 text-sm"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={assessment.shuffleQuestions}
                            onChange={(event) =>
                              updateAssessment(
                                moduleIndex,
                                lessonIndex,
                                assessmentIndex,
                                {
                                  shuffleQuestions: event.target.checked,
                                },
                              )
                            }
                          />
                          Shuffle questions
                        </label>

                        <div className="space-y-3 border rounded-md p-3 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-700">
                              Questions (optional)
                            </p>
                            <button
                              type="button"
                              className="text-xs text-primary hover:underline"
                              onClick={() =>
                                addQuestion(
                                  moduleIndex,
                                  lessonIndex,
                                  assessmentIndex,
                                )
                              }
                            >
                              Add question
                            </button>
                          </div>

                          {assessment.questions.length === 0 && (
                            <p className="text-xs text-gray-500">
                              No questions added. You can still create the
                              assessment shell.
                            </p>
                          )}

                          {assessment.questions.map(
                            (question, questionIndex) => (
                              <div
                                key={`question-${questionIndex}`}
                                className="rounded border bg-white p-3 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-gray-700">
                                    Question {questionIndex + 1}
                                  </span>
                                  <button
                                    type="button"
                                    className="text-xs text-red-600 hover:text-red-700"
                                    onClick={() =>
                                      removeQuestion(
                                        moduleIndex,
                                        lessonIndex,
                                        assessmentIndex,
                                        questionIndex,
                                      )
                                    }
                                  >
                                    Remove question
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                  <select
                                    value={question.type}
                                    onChange={(event) =>
                                      updateQuestion(
                                        moduleIndex,
                                        lessonIndex,
                                        assessmentIndex,
                                        questionIndex,
                                        { type: event.target.value },
                                      )
                                    }
                                    className="border rounded-md px-2 py-1 text-sm"
                                  >
                                    <option value="multiple_choice">
                                      Multiple Choice
                                    </option>
                                    <option value="true_false">
                                      True/False
                                    </option>
                                    <option value="enumeration">
                                      Enumeration
                                    </option>
                                    <option value="fill_in_the_blank">
                                      Fill in the blank
                                    </option>
                                    <option value="essay">Essay</option>
                                  </select>
                                  <input
                                    type="number"
                                    min={1}
                                    value={question.points}
                                    onChange={(event) =>
                                      updateQuestion(
                                        moduleIndex,
                                        lessonIndex,
                                        assessmentIndex,
                                        questionIndex,
                                        {
                                          points:
                                            Number(event.target.value) || 1,
                                        },
                                      )
                                    }
                                    className="border rounded-md px-2 py-1 text-sm"
                                    placeholder="Points"
                                  />
                                  <input
                                    value={question.correctAnswersText}
                                    onChange={(event) =>
                                      updateQuestion(
                                        moduleIndex,
                                        lessonIndex,
                                        assessmentIndex,
                                        questionIndex,
                                        {
                                          correctAnswersText:
                                            event.target.value,
                                        },
                                      )
                                    }
                                    className="border rounded-md px-2 py-1 text-sm"
                                    placeholder="Correct answers (comma separated)"
                                  />
                                </div>

                                <textarea
                                  value={question.questionText}
                                  onChange={(event) =>
                                    updateQuestion(
                                      moduleIndex,
                                      lessonIndex,
                                      assessmentIndex,
                                      questionIndex,
                                      { questionText: event.target.value },
                                    )
                                  }
                                  className="w-full border rounded-md px-2 py-1 text-sm min-h-16"
                                  placeholder="Question text"
                                />
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addAssessment(moduleIndex, lessonIndex)}
                    className="text-sm text-primary hover:underline"
                  >
                    Add assessment
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addLesson(moduleIndex)}
              className="text-sm text-primary hover:underline"
            >
              Add lesson
            </button>
          </div>
        ))}

        <div className="flex justify-between items-center pt-2">
          <button
            type="button"
            onClick={addModule}
            className="text-sm text-primary hover:underline"
          >
            Add module
          </button>
          <div className="flex gap-2">
            <Button variant="cancel" type="button" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={handleSubmit}
              isLoading={batchCreateMutation.isPending}
              isLoadingText="Submitting..."
            >
              Run batch create
            </Button>
          </div>
        </div>

        {resultSummary && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Created {resultSummary.modulesCreated} modules,{" "}
            {resultSummary.lessonsCreated} lessons,{" "}
            {resultSummary.assessmentsCreated} assessments.
            {resultSummary.totalErrors > 0 &&
              ` (${resultSummary.totalErrors} item errors)`}
          </div>
        )}

        {resultErrors.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 max-h-44 overflow-y-auto">
            {resultErrors.map(
              (error: { path: string; message: string }, index: number) => (
                <p key={`${error.path}-${index}`}>
                  {error.path}: {error.message}
                </p>
              ),
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
}
