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
import { motion } from "framer-motion";

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
  const [isDraggingThumbnail, setIsDraggingThumbnail] = useState(false);
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

  const processThumbnailFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);
    setThumbnailFile(file);
    setThumbnailChanged(true);
    setShowCropper(true);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processThumbnailFile(file);
    }
  };

  const handleThumbnailDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleThumbnailDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingThumbnail(true);
  };

  const handleThumbnailDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingThumbnail(false);
  };

  const handleThumbnailDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingThumbnail(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processThumbnailFile(file);
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 relative overflow-hidden">
            <motion.div
              className="absolute -inset-6 bg-gradient-to-r from-cyan-200/30 via-sky-200/20 to-blue-200/30 blur-2xl pointer-events-none"
              animate={isDraggingThumbnail ? { opacity: 1, scale: 1.08 } : { opacity: 0.5, scale: 1 }}
              transition={{ duration: 0.25 }}
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
                disabled={isPending}
              />
              <motion.div
                className="w-full h-48 relative"
                onDragOver={handleThumbnailDragOver}
                onDragEnter={handleThumbnailDragEnter}
                onDragLeave={handleThumbnailDragLeave}
                onDrop={handleThumbnailDrop}
                whileHover={{ scale: 1.005 }}
              >
                <motion.div
                  className={`w-full h-full rounded-xl flex items-center justify-center overflow-hidden
                    ${!thumbnailFile && !previewUrl && !isEditMode ? "border-2 border-dashed" : "border"}
                    ${errors.thumbnail ? "border-red-500 bg-red-50" : "border-slate-300 bg-slate-100"}
                  `}
                  animate={isDraggingThumbnail ? { borderColor: "#38bdf8", backgroundColor: "#f0f9ff" } : {}}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <motion.img
                      src={previewUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                      initial={{ scale: 1.05, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                    />
                  ) : (
                    <motion.div className="flex flex-col items-center text-center" animate={isDraggingThumbnail ? { y: -2 } : { y: 0 }}>
                      <span className={`text-lg ${errors.thumbnail ? "text-red-500" : "text-slate-500"}`}>
                        {isDraggingThumbnail ? "Drop Thumbnail" : "Upload Thumbnail"}
                      </span>
                      <span className={`text-sm ${errors.thumbnail ? "text-red-500" : "text-slate-500"}`}>
                        {isDraggingThumbnail ? "Release to upload" : isEditMode ? "Optional" : "Required"}
                      </span>
                    </motion.div>
                  )}
                </motion.div>
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
                <motion.button
                  type="button"
                  className={`absolute bottom-2 right-2 rounded-lg p-2.5 hover:bg-primary/80 z-40 ${errors.thumbnail ? "bg-red-500" : "bg-primary"} text-white shadow-md`}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPlus size={18} />
                </motion.button>
              </motion.div>
            </div>
            <p className="text-xs text-slate-500 text-center mt-3">
              Drag and drop an image or click the plus button.
            </p>
            {errors.thumbnail?.message && (
              <p className="text-red-500 text-sm mt-2 text-center">
                {String(errors.thumbnail.message)}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Core Course Information</h3>

            <div>
              <label className={`block text-sm font-medium mb-1 ${errors.title ? "text-red-500" : "text-slate-700"}`}>
                Course Title
              </label>
              <input
                {...register("title")}
                className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.title ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                placeholder="e.g., Bachelor of Science in Information Technology"
                disabled={isPending}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${errors.code ? "text-red-500" : "text-slate-700"}`}>
                Course Code
              </label>
              <input
                {...register("code")}
                className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.code ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                placeholder="e.g., 123C"
                disabled={isPending}
              />
              {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${errors.description ? "text-red-500" : "text-slate-700"}`}>
                Description
              </label>
              <textarea
                {...register("description")}
                className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.description ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                rows={4}
                placeholder="Enter course description"
                disabled={isPending}
              />
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-800">Publishing Details</h3>

            {!isCorporate ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-3">
                  <label className={`block text-sm font-medium mb-1 ${errors.category ? "text-red-500" : "text-slate-700"}`}>
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
                    onChange={(value) => setValue("category", value, { shouldDirty: true })}
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
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${errors.level ? "text-red-500" : "text-slate-700"}`}>
                    Level
                  </label>
                  <select
                    {...register("level")}
                    className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.level ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                    disabled={isPending}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level.message}</p>}
                </div>
              </div>
            ) : (
              <div>
                <label className={`block text-sm font-medium mb-1 ${errors.level ? "text-red-500" : "text-slate-700"}`}>
                  Level
                </label>
                <select
                  {...register("level")}
                  className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.level ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                  disabled={isPending}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {errors.level && <p className="text-red-500 text-sm mt-1">{errors.level.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${errors.language ? "text-red-500" : "text-slate-700"}`}>
                  Language
                </label>
                <input
                  {...register("language")}
                  className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.language ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                  placeholder="e.g., English"
                  disabled={isPending}
                />
                {errors.language && <p className="text-red-500 text-sm mt-1">{errors.language.message}</p>}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${errors.status ? "text-red-500" : "text-slate-700"}`}>
                  Status
                </label>
                <select
                  {...register("status")}
                  className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${errors.status ? "border-red-500" : "border-slate-300 focus:border-primary"}`}
                  disabled={isPending}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
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
