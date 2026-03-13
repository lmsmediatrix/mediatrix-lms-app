import { FaArrowLeft, FaArrowRight, FaTrash, FaEdit } from "react-icons/fa";
import Button from "../../components/common/Button";
import { IoAdd } from "react-icons/io5";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useCreateGrade, useUpdateGrade } from "../../hooks/useInstructor";
import { useAuth } from "../../context/AuthContext";
import { letterGradeScale, pointsBasedScale } from "../../config/common";
import { IGradeCategory, IGradeScale } from "../../types/interfaces";
import { useSectionGradeSystem } from "../../hooks/useSection";
import CreateGradesTabSkeleton from "../../components/skeleton/CreateGradesTabSkeleton";

const gradeFormSchema = z.object({
  gradingMethod: z.enum(["points_based", "letter_grade"]),
  minimumPassingGrade: z.number().min(1).max(100),
  lateSubmissionPenalty: z.number().min(-50).max(0),
  gradeDistribution: z
    .array(
      z.object({
        category: z.string().min(1, "Category is required"),
        weight: z.number().min(1, "Weight must be at least 1").max(100),
      })
    )
    .min(1, "At least one category is required")
    .refine(
      (categories) => {
        const totalWeight = categories.reduce(
          (sum, cat) => sum + cat.weight,
          0
        );
        return totalWeight === 100;
      },
      { message: "Total weight of all categories must equal 100%" }
    ),
  gradingScale: z.array(
    z.object({
      gradeLabel: z.string().min(1, "Grade label is required"),
      percentageRange: z.object({
        startRange: z.number().min(0).max(100),
        endRange: z.number().min(0).max(100),
      }),
      pointValue: z.number().optional(),
    })
  ),
});

type GradeFormData = z.infer<typeof gradeFormSchema>;

const defaultCategories: IGradeCategory[] = [
  { category: "quiz", weight: 20 },
  { category: "assignment", weight: 20 },
  { category: "activity", weight: 20 },
  { category: "exam", weight: 20 },
  { category: "attendance", weight: 20 },
];

export default function CreateGradesTab({
  sectionCode,
}: {
  sectionCode: string;
}) {
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [categories, setCategories] = useState<IGradeCategory[]>([]);
  const [gradeScales, setGradeScales] = useState<IGradeScale[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const createGrades = useCreateGrade();
  const updateGrades = useUpdateGrade();
  const sectionId = searchParams.get("sectionId");

  const { data, isPending } = useSectionGradeSystem(sectionCode);
  const gradeData = data?.data;
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GradeFormData>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: {
      gradingMethod: "points_based",
      minimumPassingGrade: 75,
      lateSubmissionPenalty: -10,
      gradeDistribution: defaultCategories,
      gradingScale: pointsBasedScale,
    },
  });

  const gradingMethod = watch("gradingMethod");

  useEffect(() => {
    let newScale: IGradeScale[];
    switch (gradingMethod) {
      case "points_based":
        newScale = pointsBasedScale;
        break;
      case "letter_grade":
        newScale = letterGradeScale;
        break;
      default:
        newScale = pointsBasedScale;
        break;
    }
    setGradeScales(newScale);
    setValue("gradingScale", newScale);
    setEditingIndex(null);
  }, [gradingMethod, setValue]);

  useEffect(() => {
    if (isPending) return;

    if (gradeData) {
      setValue("gradingMethod", gradeData.gradingMethod);
      setValue("minimumPassingGrade", gradeData.minPassingGrade);
      setValue("lateSubmissionPenalty", gradeData.lateSubmissionPenalty);

      const prefilledCategories = gradeData.gradeDistribution.map(
        (item: IGradeCategory) => ({
          category: item.category.toLowerCase(),
          weight: item.weight,
        })
      );
      setCategories(prefilledCategories);
      setValue("gradeDistribution", prefilledCategories);

      const prefilledGradeScales = gradeData.gradingScale.map(
        (item: IGradeScale) => ({
          gradeLabel: item.gradeLabel,
          percentageRange: {
            startRange: item.percentageRange.startRange,
            endRange: item.percentageRange.endRange,
          },
          pointValue:
            gradeData.gradingMethod === "points_based"
              ? parseFloat(item.gradeLabel) || undefined
              : undefined,
        })
      );
      setGradeScales(prefilledGradeScales);
      setValue("gradingScale", prefilledGradeScales);
    } else {
      setCategories(defaultCategories);
      setValue("gradeDistribution", defaultCategories);
      setGradeScales(pointsBasedScale);
      setValue("gradingScale", pointsBasedScale);
    }
  }, [gradeData, isPending, setValue]);

  const onSubmit = async (data: GradeFormData) => {
    const totalWeight = categories.reduce((sum, cat) => sum + cat.weight, 0);
    if (totalWeight !== 100) {
      toast.error("Total weight of all categories must equal 100%");
      return;
    }

    const formData = {
      ...(gradeData && { _id: gradeData._id }),
      gradingMethod: data.gradingMethod,
      totalCoursePoints: 100,
      minPassingGrade: data.minimumPassingGrade,
      lateSubmissionPenalty: -Math.abs(data.lateSubmissionPenalty),
      gradeDistribution: categories,
      gradingScale: gradeScales,
      sectionId,
      ...(gradeData && { organizationId: currentUser.user.organization._id }),
    };

    const mutation = gradeData ? updateGrades : createGrades;
    toast.promise(
      mutation.mutateAsync(formData, {
        onSuccess: () => {
          navigate("?tab=modules");
        },
        onError: (error) => {
          console.error("Grade operation error:", error);
        },
      }),
      {
        pending: gradeData ? "Updating grade..." : "Creating grade...",
        success: gradeData
          ? "Grade updated successfully"
          : "Grade created successfully",
        error: gradeData ? "Failed to update grade" : "Failed to create grade",
      }
    );
  };

  const addCategory = () => {
    const newCategories = [...categories, { category: "", weight: 0 }];
    setCategories(newCategories);
    setValue("gradeDistribution", newCategories);
  };

  const updateGradeScale = (
    index: number,
    field: keyof IGradeScale | "startRange" | "endRange" | "pointValue",
    value: string | number
  ) => {
    const newGradeScales = [...gradeScales];
    if (field === "startRange" || field === "endRange") {
      newGradeScales[index].percentageRange[field] = Number(value);
    } else if (field === "pointValue") {
      newGradeScales[index][field] = Number(value);
      newGradeScales[index].gradeLabel = Number(value).toFixed(2);
    } else if (field === "gradeLabel") {
      newGradeScales[index][field] = value as string;
    }
    setGradeScales(newGradeScales);
    setValue("gradingScale", newGradeScales);
  };

  const addGradeScale = () => {
    const newGradeScales = [
      ...gradeScales,
      {
        gradeLabel: gradingMethod === "points_based" ? "0.0" : "",
        percentageRange: { startRange: 0, endRange: 0 },
        ...(gradingMethod === "points_based" && { pointValue: 0 }),
      },
    ];
    setGradeScales(newGradeScales);
    setValue("gradingScale", newGradeScales);
    setEditingIndex(newGradeScales.length - 1);
  };

  const deleteGradeScale = (index: number) => {
    const newGradeScales = gradeScales.filter((_, i) => i !== index);
    setGradeScales(newGradeScales);
    setValue("gradingScale", newGradeScales);
    setEditingIndex(null);
  };

  const deleteCategory = (index: number) => {
    const newCategories = categories.filter((_, i) => i !== index);
    setCategories(newCategories);
    setValue("gradeDistribution", newCategories);
  };

  const toggleEdit = (index: number) => {
    setEditingIndex(editingIndex === index ? null : index);
  };

  const categoryOptions = [
    { label: "Quiz", value: "quiz" },
    { label: "Assignment", value: "assignment" },
    { label: "Activity", value: "activity" },
    { label: "Exam", value: "exam" },
    { label: "Attendance", value: "attendance" },
  ];

  if (isPending) {
    return <CreateGradesTabSkeleton />;
  }

  return (
    <div className="bg-white md:shadow rounded-lg max-w-5xl mx-auto">
      <div className="flex justify-between border-b p-4">
        <div className="flex gap-2 items-center">
          <div className="bg-red-600 w-1.5 md:w-2 h-8 md:h-12" />
          <h2 className="text-lg md:text-xl font-bold">Grading System</h2>
        </div>
      </div>

      <form
        id="grade-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 py-2 md:p-6"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gradingMethod"
                className="block text-sm md:text-base font-medium text-gray-700"
              >
                Grading Method
              </label>
              <div className="relative">
                <select
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md text-sm md:text-base ${
                    errors.gradingMethod ? "border-red-500 border" : ""
                  }`}
                  id="gradingMethod"
                  {...register("gradingMethod")}
                >
                  <option value="points_based">Points-Based</option>
                  <option value="letter_grade">Letter Grade</option>
                </select>
                {errors.gradingMethod && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.gradingMethod.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm md:text-base font-medium text-gray-700">
                Total Course Points
              </p>
              <div className="flex items-center gap-2 md:gap-4 px-3 py-2">
                <p className="font-medium text-sm md:text-base">100</p>
                <p className="italic text-xs md:text-sm text-gray-500">
                  Auto Calculated based on assignments, quizzes
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-semibold py-2">
              Grades Distribution
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="minimumPassingGrade"
                  className="block text-sm md:text-base font-medium text-gray-700"
                >
                  Minimum Passing Grade
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.minimumPassingGrade ? "border-red-500 border" : ""
                  }`}
                  type="number"
                  id="minimumPassingGrade"
                  placeholder="60%"
                  {...register("minimumPassingGrade", { valueAsNumber: true })}
                />
                {errors.minimumPassingGrade && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.minimumPassingGrade.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="lateSubmissionPenalty"
                  className="block text-sm md:text-base font-medium text-gray-700"
                >
                  Late Submission Penalty
                </label>
                <input
                  className={`mt-1 block w-full px-3 py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    errors.lateSubmissionPenalty ? "border-red-500 border" : ""
                  }`}
                  type="number"
                  id="lateSubmissionPenalty"
                  placeholder="-10%"
                  {...register("lateSubmissionPenalty", {
                    valueAsNumber: true,
                  })}
                />
                {errors.lateSubmissionPenalty && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.lateSubmissionPenalty.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="w-full rounded-lg border border-gray-200">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 text-gray-500 font-bold text-sm md:text-base w-[50%]">
                        Category
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 text-gray-500 font-bold text-sm md:text-base w-[40%]">
                        Weight (%)
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 text-gray-500 font-bold text-sm md:text-base w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((category, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 bg-white"
                      >
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          <select
                            className={`w-full px-2 py-1 md:px-3 md:py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                              errors.gradeDistribution?.[index]?.category
                                ? "border-red-500 border"
                                : ""
                            }`}
                            value={category.category}
                            onChange={(e) => {
                              const newCategories = [...categories];
                              newCategories[index].category = e.target.value;
                              setCategories(newCategories);
                              setValue("gradeDistribution", newCategories);
                            }}
                          >
                            <option value="" disabled>
                              Select a category
                            </option>
                            {categoryOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {errors.gradeDistribution?.[index]?.category && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.gradeDistribution[index].category.message}
                            </p>
                          )}
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          <input
                            className={`w-full px-2 py-1 md:px-3 md:py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                              errors.gradeDistribution?.[index]?.weight
                                ? "border-red-500 border"
                                : ""
                            }`}
                            type="number"
                            value={category.weight}
                            onChange={(e) => {
                              const newCategories = [...categories];
                              newCategories[index].weight = Number(
                                e.target.value
                              );
                              setCategories(newCategories);
                              setValue("gradeDistribution", newCategories);
                            }}
                            placeholder="Weight %"
                          />
                          {errors.gradeDistribution?.[index]?.weight && (
                            <p className="mt-1 text-sm text-red-600">
                              {errors.gradeDistribution[index].weight.message}
                            </p>
                          )}
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-3 text-center">
                          <button
                            type="button"
                            onClick={() => deleteCategory(index)}
                            className="text-gray-500 hover:text-red-700"
                          >
                            <FaTrash className="text-sm md:text-base" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 md:py-4 px-2 md:px-4">
                        <Button
                          onClick={addCategory}
                          variant="outline"
                          className="w-full md:w-auto"
                        >
                          <IoAdd className="text-base md:text-lg" />
                          Add New Category
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {errors.gradeDistribution && !errors.gradeDistribution[0] && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.gradeDistribution.message}
                </p>
              )}
            </div>

            <div className="space-y-4 mt-4">
              <h3 className="text-base md:text-lg font-semibold py-2">
                Grading Scale
              </h3>
              <div className="w-full rounded-lg border border-gray-200">
                <table className="w-full table-fixed">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-100">
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 text-gray-500 font-bold text-sm md:text-base w-[30%]">
                        {gradingMethod === "points_based"
                          ? "Point Value"
                          : "Letter Grade"}
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 text-gray-500 font-bold text-sm md:text-base w-[60%]">
                        Percentage Range
                      </th>
                      <th className="text-left px-2 py-2 md:px-4 md:py-4 text-gray-500 font-bold text-sm md:text-base w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {gradeScales.map((scale, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 bg-white"
                      >
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          {editingIndex === index ? (
                            gradingMethod === "points_based" ? (
                              <input
                                className="w-full px-2 py-1 md:px-3 md:py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 truncate"
                                type="number"
                                step="0.25"
                                value={scale.pointValue ?? 0}
                                onChange={(e) =>
                                  updateGradeScale(
                                    index,
                                    "pointValue",
                                    e.target.value
                                  )
                                }
                                placeholder="Point value"
                              />
                            ) : (
                              <input
                                className="w-full px-2 py-1 md:px-3 md:py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50 truncate"
                                type="text"
                                value={scale.gradeLabel}
                                onChange={(e) =>
                                  updateGradeScale(
                                    index,
                                    "gradeLabel",
                                    e.target.value
                                  )
                                }
                                placeholder="Grade label"
                              />
                            )
                          ) : (
                            <span className="text-sm md:text-base">
                              {gradingMethod === "points_based"
                                ? scale.pointValue
                                : scale.gradeLabel}
                            </span>
                          )}
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-4">
                          {editingIndex === index ? (
                            <div className="flex items-center gap-2">
                              <input
                                className="w-[45%] px-2 py-1 md:px-3 md:py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                                type="number"
                                value={scale.percentageRange.startRange}
                                onChange={(e) =>
                                  updateGradeScale(
                                    index,
                                    "startRange",
                                    e.target.value
                                  )
                                }
                                placeholder="Start"
                              />
                              <span>-</span>
                              <input
                                className="w-[45%] px-2 py-1 md:px-3 md:py-2 bg-gray-100 rounded-md text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
                                type="number"
                                value={scale.percentageRange.endRange}
                                onChange={(e) =>
                                  updateGradeScale(
                                    index,
                                    "endRange",
                                    e.target.value
                                  )
                                }
                                placeholder="End"
                              />
                            </div>
                          ) : (
                            <span className="text-sm md:text-base">
                              {scale.percentageRange.startRange === 0
                                ? `Below ${scale.percentageRange.endRange}%`
                                : `${scale.percentageRange.startRange}% - ${scale.percentageRange.endRange}%`}
                            </span>
                          )}
                        </td>
                        <td className="py-2 md:py-4 px-2 md:px-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleEdit(index)}
                              className="text-gray-500 hover:text-blue-700"
                            >
                              <FaEdit className="text-sm md:text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGradeScale(index)}
                              className="text-gray-500 hover:text-red-700"
                            >
                              <FaTrash className="text-sm md:text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} className="py-2 md:py-4 px-2 md:px-4">
                        <Button
                          onClick={addGradeScale}
                          variant="outline"
                          className="w-full md:w-auto"
                        >
                          <IoAdd className="text-base md:text-lg" />
                          Add New Grade
                        </Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </form>

      <div className="border-t flex justify-between p-2 md:p-4">
        <Button onClick={() => navigate("?tab=assignments")} variant="cancel">
          <FaArrowLeft className="text-sm md:text-base" />
          Back
        </Button>
        <Button
          onClick={() => handleSubmit(onSubmit)()}
          variant="outline"
          isLoading={createGrades.isPending || updateGrades.isPending}
          isLoadingText="Saving..."
        >
          {gradeData ? "Update" : "Create"}{" "}
          <FaArrowRight className="text-sm md:text-base" />
        </Button>
      </div>
    </div>
  );
}
