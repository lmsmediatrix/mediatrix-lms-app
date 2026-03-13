import { FaPlus, FaRegMinusSquare } from "react-icons/fa";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import AddQuestionComponent from "./AddQuestionComponent";
import { useState, useEffect, ChangeEvent, useRef } from "react";
import { IQuestion } from "../../types/interfaces";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { createAssessmentFormData } from "../../lib/formDataUtils";
import { LuImport } from "react-icons/lu";
import { getMaxDate } from "../../lib/maxDateUtils";
import { GoQuestion } from "react-icons/go";

import {
  useCreateAssessment,
  useGetAssessmentById,
  useUpdateAssessment,
} from "../../hooks/useAssessment";

interface CreateAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName?: string;
}

const assignmentFormSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title must be at least 1 character")
      .max(100, "Title must be at most 100 characters"),
    assessmentType: z.enum(["quiz", "assignment", "activity", "exam"]),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .refine((date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(getMaxDate());
        return selectedDate >= today && selectedDate <= maxDate;
      }, "Start date must be between today and 5 years from now"),
    endDate: z
      .string()
      .min(1, "End date is required")
      .refine((date) => {
        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(getMaxDate());
        return selectedDate >= today && selectedDate <= maxDate;
      }, "End date must be between today and 5 years from now"),
    timeLimit: z
      .number()
      .min(5, "Time limit must be at least 5 minutes")
      .max(7200, "Time limit cannot exceed 5 days"),
    gradeMethod: z.enum(["manual", "auto", "mixed"]),
    attemptsAllowed: z.number().min(1, "Must allow at least 1 attempt"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description must be at most 500 characters"),
    shuffleQuestions: z.boolean(),
    shuffleChoices: z.boolean(),
    questionsToDisplay: z.number().min(1, "Must display at least 1 question"),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  });

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

export default function CreateAssessmentModal({
  isOpen,
  onClose,
  sectionName,
}: CreateAssessmentModalProps) {
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [questionsList, setQuestionsList] = useState<IQuestion[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { currentUser } = useAuth();
  const organizationId = currentUser?.user.organization._id;
  const orgCode = location.pathname.split("/")[1];
  const sectionCode = location.pathname.split("/")[4];
  const sectionId = searchParams.get("sectionId");
  const assessmentId = searchParams.get("assessmentId");
  const modal = searchParams.get("modal");
  const { data, isPending } = useGetAssessmentById(assessmentId || "", true);

  const createAssessment = useCreateAssessment();
  const updateAssessment = useUpdateAssessment();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      assessmentType: "quiz",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      timeLimit: 30,
      gradeMethod: "auto",
      attemptsAllowed: 1,
      description: "",
      shuffleQuestions: false,
      shuffleChoices: false,
      questionsToDisplay: 1,
    },
  });

  const startDate = watch("startDate");
  const shuffleQuestions = watch("shuffleQuestions");

  const isEditMode = modal === "edit-assessment";
  const draftKey = `assessment-draft-${sectionId || sectionCode}`;
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  // Keep a ref to questionsList so the form subscription can access latest value
  const questionsRef = useRef(questionsList);

  // Restore saved draft when modal opens (create mode only)
  useEffect(() => {
    if (isEditMode || !isOpen || assessmentId) return;
    const saved = localStorage.getItem(draftKey);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      if (draft.formValues) reset(draft.formValues);
      if (draft.questions?.length) setQuestionsList(draft.questions);
      setHasDraft(true);
    } catch {
      localStorage.removeItem(draftKey);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep ref in sync + save when questionsList changes
  useEffect(() => {
    questionsRef.current = questionsList;
    if (isEditMode) return;
    localStorage.setItem(
      draftKey,
      JSON.stringify({ formValues: getValues(), questions: questionsList }),
    );
  }, [questionsList]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save draft on every form field change (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    const subscription = watch(() => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          formValues: getValues(),
          questions: questionsRef.current,
        }),
      );
    });
    return () => subscription.unsubscribe();
  }, [isEditMode, draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if questions have different points
  const hasDifferentPoints =
    questionsList.length > 1 &&
    questionsList.some((q, _, arr) => q.points !== arr[0].points);

  // Update gradeMethod based on questionsList
  useEffect(() => {
    const hasEssay = questionsList.some((q) => q.type === "essay");
    const hasOther = questionsList.some((q) => q.type !== "essay");
    if (hasEssay && hasOther) {
      setValue("gradeMethod", "mixed");
    } else if (hasEssay) {
      setValue("gradeMethod", "manual");
    } else {
      setValue("gradeMethod", "auto");
    }
  }, [questionsList, setValue]);

  // Update questionsToDisplay based on questionsList length
  useEffect(() => {
    if (questionsList.length > 0) {
      setValue("questionsToDisplay", questionsList.length);
    }
  }, [questionsList, setValue]);

  useEffect(() => {
    if (data && !isPending) {
      reset({
        title: data.title,
        assessmentType: data.assessmentType || data.type,
        startDate: new Date(data.startDate || data.dueDate)
          .toISOString()
          .split("T")[0],
        endDate: new Date(data.endDate || data.dueDate)
          .toISOString()
          .split("T")[0],
        timeLimit: data.timeLimit,
        gradeMethod: data.gradeMethod,
        attemptsAllowed: data.attemptsAllowed,
        description: data.description,
        shuffleQuestions: data.shuffleQuestions || false,
        shuffleChoices: data.shuffleChoices || false,
        questionsToDisplay: data.numberOfQuestionsToShow,
      });

      setQuestionsList(
        data.questions.map((question: any) => ({
          type: question.type,
          questionText: question.questionText,
          points: question.points,
          options: question.options
            ? question.options.map((opt: any, index: number) => ({
                option: opt.option || `Option ${index + 1}`,
                text: opt.text,
                isCorrect: opt.isCorrect,
                image: opt.image,
              }))
            : undefined,
          correctAnswers: question.correctAnswers,
          _id: question._id,
          questionImage: question.questionImage,
        })),
      );
    }
  }, [data, isPending, reset]);

  const onSubmit = async (data: AssignmentFormData) => {
    const formData = createAssessmentFormData({
      ...(assessmentId && { _id: assessmentId }),
      organizationId: organizationId!,
      section: sectionId,
      title: data.title,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      timeLimit: data.timeLimit,
      gradeMethod: data.gradeMethod,
      attemptsAllowed: data.attemptsAllowed,
      description: data.description,
      type: data.assessmentType,
      questions: questionsList,
      author: currentUser?.user.id,
      orgCode,
      sectionCode,
      csvFile,
      shuffleQuestions: data.shuffleQuestions,
      shuffleChoices: data.shuffleChoices,
      questionsToDisplay: data.questionsToDisplay,
    });

    const mutation = assessmentId ? updateAssessment : createAssessment;

    toast.promise(
      mutation.mutateAsync(formData, {
        onSuccess: () => {
          reset();
          setCsvFile(null);
          localStorage.removeItem(draftKey);
          setHasDraft(false);
          onClose();
        },
      }),
      {
        pending: assessmentId
          ? "Updating assessment..."
          : "Creating assessment...",
        success: assessmentId
          ? "Assessment updated successfully"
          : "Assessment created successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      },
    );
  };

  const handleAddQuestion = (question: IQuestion) => {
    if (editingIndex !== null) {
      const updatedQuestions = [...questionsList];
      updatedQuestions[editingIndex] = question;
      setQuestionsList(updatedQuestions);
      setEditingIndex(null);
    } else {
      setQuestionsList([...questionsList, question]);
      setShowAddQuestion(false);
    }
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestionsList(
      questionsList.filter((_, index) => index !== indexToDelete),
    );
  };

  const handleEditQuestion = (index: number) => {
    setEditingIndex(index);
  };

  const handleCsvUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      toast.error("Please select a valid CSV file");
      event.target.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditCsv = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteCsv = () => {
    setCsvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog
        title="Add Assessment"
        subTitle={sectionName}
        backdrop="blur"
        isOpen={isOpen}
        onClose={() => onClose()}
        size="full"
        contentClassName="w-[95vw] xl:w-[55vw] min-w-[300px] max-w-[1200px]"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 max-w-6xl mx-auto px-4 sm:px-0"
        >
          <div className="border-b border-gray-200 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                    errors.title ? "border-red-500 border" : ""
                  }`}
                  type="text"
                  {...register("title")}
                  disabled={isSubmitting}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Assessment Type
                  </label>
                  <select
                    className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                      errors.assessmentType ? "border-red-500 border" : ""
                    }`}
                    {...register("assessmentType")}
                    disabled={isSubmitting}
                    defaultValue="assignment"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="activity">Activity</option>
                    <option value="exam">Exam</option>
                  </select>
                  {errors.assessmentType && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.assessmentType.message}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="gradeMethod"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Grading Method
                  </label>
                  <select
                    className={`appearance-none mt-1 block w-full px-3 py-2 bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                      errors.gradeMethod ? "border-red-500 border" : ""
                    }`}
                    {...register("gradeMethod")}
                    disabled={true}
                    defaultValue="auto"
                  >
                    <option value="manual">Manually Graded</option>
                    <option value="auto">Automatically Graded</option>
                    <option value="mixed">Mixed Grading</option>
                  </select>
                  {errors.gradeMethod && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.gradeMethod.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="attemptsAllowed"
                  className="block text-sm font-medium text-gray-700"
                >
                  Number of Attempts
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                    errors.attemptsAllowed ? "border-red-500 border" : ""
                  }`}
                  type="number"
                  {...register("attemptsAllowed", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {errors.attemptsAllowed && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.attemptsAllowed.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="timeLimit"
                  className="block text-sm font-medium text-gray-700"
                >
                  Time Limit (minutes)
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                    errors.timeLimit ? "border-red-500 border" : ""
                  }`}
                  type="number"
                  {...register("timeLimit", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {errors.timeLimit && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.timeLimit.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Publish Date
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                    errors.startDate ? "border-red-500 border" : ""
                  }`}
                  type="date"
                  {...register("startDate")}
                  onChange={(e) => {
                    if (new Date(e.target.value) > new Date(getMaxDate())) {
                      e.target.value = getMaxDate();
                    }
                    setValue("startDate", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Due Date
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                    errors.endDate ? "border-red-500 border" : ""
                  }`}
                  type="date"
                  {...register("endDate")}
                  min={startDate}
                  max={getMaxDate()}
                  onChange={(e) => {
                    if (new Date(e.target.value) > new Date(getMaxDate())) {
                      e.target.value = getMaxDate();
                    }
                    setValue("endDate", e.target.value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                  disabled={isSubmitting}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                className={`p-2 mt-1 block w-full rounded-md bg-gray-100 shadow-sm focus:border-green-500 focus:ring-green-500 text-sm sm:text-base ${
                  errors.description ? "border-red-500 border" : ""
                }`}
                rows={3}
                {...register("description")}
                disabled={isSubmitting}
                placeholder="Develop a comprehensive social media marketing plan for a small business."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>

            <hr />
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="shuffleQuestions"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                    {...register("shuffleQuestions")}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="shuffleQuestions"
                    className="text-sm font-medium text-gray-700"
                  >
                    Shuffle Questions
                  </label>
                </div>
                {/* <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shuffleChoices"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  {...register("shuffleChoices")}
                  disabled={isSubmitting}
                />
                <label
                  htmlFor="shuffleChoices"
                  className="text-sm font-medium text-gray-700"
                >
                  Shuffle Choices
                </label>
              </div> */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="questionsToDisplay"
                    className=" text-sm font-medium text-gray-700 flex items-center gap-1 group"
                  >
                    Questions To Display
                    <span className="relative">
                      <GoQuestion className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <span className="absolute top-1/2 transform -translate-y-1/2 left-full ml-2 w-80 p-2 text-xs text-white bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        Set the number of questions to be randomly selected from
                        the question list for each student.
                      </span>
                    </span>
                  </label>
                  <input
                    className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm sm:text-base ${
                      errors.questionsToDisplay ? "border-red-500 border" : ""
                    }`}
                    type="number"
                    {...register("questionsToDisplay", { valueAsNumber: true })}
                    disabled={isSubmitting}
                  />
                  {errors.questionsToDisplay && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.questionsToDisplay.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {hasDifferentPoints && shuffleQuestions && (
              <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                <div className="text-yellow-800 font-semibold mb-2">
                  Important Notice
                </div>
                <p className="text-yellow-700 text-sm w-full">
                  Shuffling the questions, which have different point values,
                  can lead to different total scores for each student.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 gap-4">
              <h3 className="text-lg font-medium">Questions</h3>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleImportClick}
                  className="w-full sm:w-auto"
                >
                  <LuImport className="mr-2" />
                  Import Question
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowAddQuestion(true)}
                  className="w-full sm:w-auto"
                >
                  <FaPlus className="mr-2" /> Add Question
                </Button>
              </div>
            </div>

            {csvFile && (
              <div className="mb-4 text-sm text-gray-700 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <p className="flex-1">
                  Imported CSV:{" "}
                  <span className="font-medium text-green-600">
                    {csvFile.name}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleEditCsv}
                    className="p-1 text-gray-500 hover:text-primary"
                    title="Edit CSV"
                  >
                    <AiOutlineEdit className="text-lg" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCsv}
                    className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                    title="Delete CSV"
                  >
                    <AiOutlineDelete className="text-lg" />
                  </button>
                </div>
              </div>
            )}

            {questionsList.length > 0 && (
              <div className="border border-gray-200 rounded-lg divide-y-[1px] mb-4">
                {questionsList.map((question, index) => (
                  <div key={index}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50">
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center w-full sm:w-auto">
                        <div className="flex gap-2">
                          <p className="text-primary">Question {index + 1}</p>
                        </div>
                        <div className="flex gap-2 items-center max-w-full sm:max-w-md">
                          <FaRegMinusSquare className="text-primary text-lg flex-shrink-0 w-4 h-4" />
                          <span className="text-gray-900 line-clamp-2 sm:line-clamp-1">
                            {question.questionText}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => handleEditQuestion(index)}
                          className="p-1 text-gray-500 hover:text-primary"
                        >
                          <AiOutlineEdit className="text-lg" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(index)}
                          className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete question"
                        >
                          <AiOutlineDelete className="text-lg" />
                        </button>
                      </div>
                    </div>
                    {editingIndex === index && (
                      <div className="border-t border-gray-100">
                        <AddQuestionComponent
                          onAdd={handleAddQuestion}
                          initialQuestion={question}
                          onCancel={() => setEditingIndex(null)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAddQuestion && (
              <AddQuestionComponent
                onAdd={handleAddQuestion}
                onCancel={() => setShowAddQuestion(false)}
              />
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              variant="cancel"
              type="button"
              onClick={() => {
                if (isDirty || questionsList.length > 0) {
                  setShowCancelConfirm(true);
                } else {
                  onClose();
                }
              }}
              className="w-full sm:w-auto bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                isSubmitting ||
                createAssessment.isPending ||
                updateAssessment.isPending ||
                (!isDirty && !hasDraft && questionsList.length === 0)
              }
              isLoading={
                assessmentId
                  ? updateAssessment.isPending
                  : createAssessment.isPending
              }
              isLoadingText={assessmentId ? "Updating..." : "Saving..."}
              className="w-full sm:w-auto"
            >
              {modal === "edit-assessment" ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        title="Discard Changes?"
        size="sm"
        showCloseButton={false}
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600">
            All entered data and questions will be permanently discarded. This
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="cancel"
              className="border border-gray-300"
              onClick={() => setShowCancelConfirm(false)}
            >
              Keep Editing
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowCancelConfirm(false);
                reset();
                setQuestionsList([]);
                setCsvFile(null);
                localStorage.removeItem(draftKey);
                setHasDraft(false);
                onClose();
              }}
            >
              Discard
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
