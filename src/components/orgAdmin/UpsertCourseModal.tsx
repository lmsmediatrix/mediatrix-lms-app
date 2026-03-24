import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useRef, useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import {
  useCreateCourse,
  useGetCourseById,
  useUpdateCourse,
} from "../../hooks/useCourse";
import { SearchableSelect } from "../SearchableSelect";
import { useInfiniteCategoriesForDropdown } from "../../hooks/useCategory";
import { useAuth } from "../../context/AuthContext";
import { useDebounce } from "../../hooks/useDebounce";
import { createCourseFormData } from "../../lib/formDataUtils";
import ImageCropper from "../ImageCropper";

// Update the schema to match API fields
const courseSchema = z.object({
  title: z
    .string()
    .min(3, "Course title must be at least 3 characters")
    .max(50, "Course title cannot exceed 50 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  category: z.string().optional(),
  level: z.enum(["beginner", "intermediate", "advance"]),
  language: z.string().min(2, "Language is required"),
  status: z.enum(["draft", "published", "archived"]),
  code: z
    .string()
    .min(3, "Course code is required")
    .max(40, "Course code cannot exceed 40 characters"),
  thumbnail: z.any().refine((val) => {
    return val !== null;
  }, "Thumbnail is required"),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface UpsertCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CourseData {
  _id: string;
  title: string;
  description: string;
  category?: string | { _id: string; name: string } | null;
  level: string;
  language: string;
  status: string;
  code: string;
  thumbnail?: string;
}

interface ICategory {
  _id: string;
  name: string;
}

const UpsertCourseModal = ({ isOpen, onClose }: UpsertCourseModalProps) => {
  const { currentUser } = useAuth();
  const isCorporate = currentUser.user.organization.type === "corporate";
  const [searchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const courseId = searchParams.get("id");

  const isEditMode = modal === "edit-course";
  const { data: response, isLoading: isLoadingCourse } = useGetCourseById(
    courseId || ""
  );
  const courseData = response?.data as CourseData;
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const isPending = createCourse.isPending || updateCourse.isPending;

  // Add state for thumbnail and cropper
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [thumbnailChanged, setThumbnailChanged] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for category search
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const debouncedCategorySearchTerm = useDebounce(categorySearchTerm, 300);

  // Categories dropdown hook with infinite scrolling
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    fetchNextPage: fetchNextCategoryPage,
    hasNextPage: hasNextCategoryPage,
    isFetchingNextPage: isFetchingNextCategoryPage,
  } = useInfiniteCategoriesForDropdown({
    organizationId: currentUser.user.organization._id,
    searchTerm: debouncedCategorySearchTerm,
    limit: 10,
    enabled: !isCorporate,
  });

  // Flatten the paginated data
  const categories =
    categoriesData?.pages.flatMap((page) => page.categories || []) || [];
  const categoriesPaginationInfo =
    categoriesData?.pages[categoriesData.pages.length - 1]?.pagination;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    clearErrors,
    setError,
    watch,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "beginner",
      language: "English",
      status: "published",
      code: "",
      thumbnail: null,
    },
  });

  // Set form values when editing an existing course
  useEffect(() => {
    if (courseId && courseData) {
      setValue("title", courseData.title);
      setValue("description", courseData.description);
      if (!isCorporate) {
        const categoryId =
          typeof courseData.category === "string"
            ? courseData.category
            : courseData.category?._id || "";
        setValue("category", categoryId || "");
      } else {
        setValue("category", "");
      }
      setValue(
        "level",
        courseData.level as "beginner" | "intermediate" | "advance"
      );
      setValue("language", courseData.language);
      setValue(
        "status",
        courseData.status as "draft" | "published" | "archived"
      );
      setValue("code", courseData.code);

      if (courseData.thumbnail) {
        setPreviewUrl(courseData.thumbnail);
        setValue("thumbnail", "existing-thumbnail");
      }
    }
  }, [courseId, courseData, setValue, isCorporate]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      setThumbnailFile(file);
      setThumbnailChanged(true);
      setShowCropper(true);
    }
  };

  const handleCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setThumbnailFile(croppedImage);
      setPreviewUrl(URL.createObjectURL(croppedImage));
      setThumbnailChanged(true);
      setValue("thumbnail", croppedImage);
      clearErrors("thumbnail");
    }
    setShowCropper(false);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setThumbnailFile(null);
    setThumbnailChanged(true);
    setValue("thumbnail", null);
  };

  const onSubmit = (data: CourseFormData) => {
    if (!thumbnailFile && !courseId && !previewUrl) {
      setError("thumbnail", {
        message: "Thumbnail is required for new courses",
      });
      return;
    }

    const formData = createCourseFormData({
      ...data,
      category: isCorporate ? "" : data.category,
      _id: courseId || undefined,
      thumbnail: thumbnailFile || undefined,
      orgId: currentUser.user.organization._id,
      orgCode: currentUser.user.organization.code,
    });

    if (courseId) {
      toast.promise(
        updateCourse.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error updating course:", error);
          },
        }),
        {
          pending: "Updating course...",
          success: "Course updated successfully",
          error: {
            render({ data }) {
              return (data as { message: string }).message;
            },
          },
        }
      );
    } else {
      toast.promise(
        createCourse.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error creating course:", error);
          },
        }),
        {
          pending: "Creating course...",
          success: "Course created successfully",
          error: {
            render({ data }) {
              return (data as { message: string }).message;
            },
          },
        }
      );
    }
  };

  const handleCloseModal = () => {
    onClose();
    reset();
    setThumbnailFile(null);
    setPreviewUrl(null);
    setThumbnailChanged(false);
    setShowCropper(false);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={isEditMode ? "Edit Course" : "Create New Course"}
      backdrop="blur"
      size="full"
      contentClassName="w-full md:w-[40vw] md:min-w-[500px] max-w-[800px]"
    >
      {isEditMode && isLoadingCourse ? (
        <div className="space-y-6 animate-pulse">
          {/* Thumbnail Upload Skeleton */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <div className="w-40 h-40 relative">
                <div className="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                  <div className="flex flex-col items-center">
                    <div className="w-36 h-5 bg-gray-300 rounded mb-2"></div>
                    <div className="w-20 h-4 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 w-9 h-9 bg-gray-300 rounded-lg"></div>
              </div>
            </div>
          </div>

          {/* Title Skeleton */}
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
            <div className="h-9 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Course Code Skeleton */}
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
            <div className="h-9 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Description Skeleton */}
          <div>
            <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
            <div className="h-28 w-full bg-gray-200 rounded"></div>
          </div>

          {/* Category and Level Skeleton */}
          {!isCorporate ? (
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
              <div className="col-span-2">
                <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>
          )}

          {/* Language and Status Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>
          </div>

          {/* Form Buttons Skeleton */}
          <div className="flex gap-2 justify-end mt-6">
            <div className="h-9 w-28 bg-gray-200 rounded"></div>
            <div className="h-9 w-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Thumbnail Upload */}
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <div className="w-120 h-40 relative">
                <div
                  className={`w-full h-full bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden
                    ${
                      !thumbnailFile && !previewUrl && !isEditMode
                        ? "border-2 border-dashed"
                        : ""
                    }
                    ${errors.thumbnail ? "border-red-500" : "border-gray-300"}
                  `}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <span
                        className={`text-lg ${
                          errors.thumbnail ? "text-red-500" : "text-gray-500"
                        }`}
                      >
                        Upload Thumbnail
                      </span>
                      {!isEditMode && (
                        <span
                          className={`text-sm ${
                            errors.thumbnail ? "text-red-500" : "text-gray-500"
                          }`}
                        >
                          Required
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-lg p-1.5 hover:bg-red-600 transition-colors z-50 shadow-md"
                  >
                    <IoClose size={18} />
                  </button>
                )}
                <button
                  type="button"
                  className={`absolute bottom-2 right-2 rounded-lg p-2.5 hover:bg-primary/80 z-40
                    ${
                      errors.thumbnail ? "bg-red-500" : "bg-primary"
                    } text-white shadow-md`}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <FaPlus size={18} />
                </button>
              </div>
            </div>
            {errors.thumbnail?.message && (
              <p className="text-red-500 text-sm mt-2">
                {String(errors.thumbnail.message)}
              </p>
            )}
          </div>

          {/* Title - Full width */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.title ? "text-red-500" : "text-gray-700"
              }`}
            >
              Course Title
            </label>
            <input
              {...register("title")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.title ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Bachelor of Science in Information Technology"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Course Code - Full width */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.code ? "text-red-500" : "text-gray-700"
              }`}
            >
              Course Code
            </label>
            <input
              {...register("code")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., 123C"
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          {/* Description - Full width */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.description ? "text-red-500" : "text-gray-700"
              }`}
            >
              Description
            </label>
            <textarea
              {...register("description")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              rows={4}
              placeholder="Enter course description"
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category and Level in one row */}
          {!isCorporate ? (
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    errors.category ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  Category (Optional)
                </label>
                <SearchableSelect
                  options={
                    categories?.map((category: ICategory) => ({
                      value: category._id,
                      label: category.name,
                    })) || []
                  }
                  value={watch("category") || ""}
                  onChange={(value) =>
                    setValue("category", value, { shouldDirty: true })
                  }
                  onSearch={(term) => setCategorySearchTerm(term)}
                  placeholder="Select a category"
                  loading={isLoadingCategories}
                  emptyMessage="No categories available"
                  emptyAction={{
                    label: "Create a new category",
                    path: `/${currentUser.user.organization.code}/admin/category?modal=create-category`,
                  }}
                  hasNextPage={hasNextCategoryPage}
                  isFetchingNextPage={isFetchingNextCategoryPage}
                  onLoadMore={fetchNextCategoryPage}
                  paginationInfo={categoriesPaginationInfo}
                />
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <label
                  className={`block text-sm font-medium mb-1 ${
                    errors.level ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  Level
                </label>
                <select
                  {...register("level")}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.level ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.level && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.level.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.level ? "text-red-500" : "text-gray-700"
                }`}
              >
                Level
              </label>
              <select
                {...register("level")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.level ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {errors.level && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.level.message}
                </p>
              )}
            </div>
          )}

          {/* Language and Status in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.language ? "text-red-500" : "text-gray-700"
                }`}
              >
                Language
              </label>
              <input
                {...register("language")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.language ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., English"
              />
              {errors.language && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.language.message}
                </p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  errors.status ? "text-red-500" : "text-gray-700"
                }`}
              >
                Status
              </label>
              <select
                {...register("status")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.status ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>

          {/* Form Buttons */}
          <div className="flex gap-2 justify-end mt-6">
            <Button
              type="button"
              variant="cancel"
              onClick={handleCloseModal}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              isLoadingText={isEditMode ? "Updating..." : "Creating..."}
              disabled={isPending || (!isDirty && !thumbnailChanged)}
            >
              {isEditMode ? "Update Course" : "Create Course"}
            </Button>
          </div>
        </form>
      )}
      <ImageCropper
        imageSrc={previewUrl}
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        aspectRatio={3/1}
        onCropComplete={handleCropComplete}
      />
    </Dialog>
  );
};

export default UpsertCourseModal;
