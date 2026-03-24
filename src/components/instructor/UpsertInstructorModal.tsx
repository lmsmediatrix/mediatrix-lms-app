import { FaPlus } from "react-icons/fa";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useSearchParams } from "react-router-dom";
import { createInstructorFormData } from "../../lib/formDataUtils";
import {
  useCreateInstructor,
  useGetInstructorById,
  useUpdateInstructor,
} from "../../hooks/useInstructor";
import { IoClose } from "react-icons/io5";
import { getTerm } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";
import { SearchableSelect } from "../SearchableSelect";
import { useInfiniteFacultiesForDropdown } from "../../hooks/useFaculty";
import { useDebounce } from "../../hooks/useDebounce";
import { IFaculty } from "../../types/interfaces";
import ImageCropper from "../ImageCropper";

// Define the schema for the instructor form using Zod
const instructorSchema = (orgType: string) =>
  z.object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters"),
    email: z
      .string()
      .email("Invalid email address")
      .max(100, "Email cannot exceed 100 characters"),
    faculty:
      orgType === "school"
        ? z.string().min(1, "Faculty is required")
        : z.string().optional(),
    employmentType: z.enum(
      [
        "full_time",
        "part_time",
        "probationary",
        "internship",
        "freelance",
        "temporary",
        "volunteer",
        "retired",
      ],
      {
        required_error: "Please select a Type",
      }
    ),
    avatar: z.any().nullable(),
  });

type InstructorFormData = z.infer<ReturnType<typeof instructorSchema>>;

interface UpsertInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertInstructorModal({
  isOpen,
  onClose,
}: UpsertInstructorModalProps) {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const instructorTerm = getTerm("instructor", orgType); // "Teacher" or "Trainer"

  const [searchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const instructorId = searchParams.get("id");

  const isEditMode = modal === "edit-instructor";
  const { data: response, isLoading: isLoadingInstructor } =
    useGetInstructorById(instructorId || "");
  const instructorData = response?.data;
  const createInstructor = useCreateInstructor();
  const updateInstructor = useUpdateInstructor();
  const isPending =
    createInstructor.isPending ||
    updateInstructor.isPending ||
    isLoadingInstructor;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for faculty search
  const [facultySearchTerm, setFacultySearchTerm] = useState("");
  const debouncedFacultySearchTerm = useDebounce(facultySearchTerm, 300);

  // Faculties dropdown hook with infinite scrolling
  const {
    data: facultiesData,
    isLoading: isLoadingFaculties,
    fetchNextPage: fetchNextFacultyPage,
    hasNextPage: hasNextFacultyPage,
    isFetchingNextPage: isFetchingNextFacultyPage,
  } = useInfiniteFacultiesForDropdown({
    organizationId: currentUser.user.organization._id,
    searchTerm: debouncedFacultySearchTerm,
    limit: 10,
  });

  // Flatten the paginated data
  const faculties =
    facultiesData?.pages.flatMap((page) => page.faculties || []) || [];
  const facultiesPaginationInfo =
    facultiesData?.pages[facultiesData.pages.length - 1]?.pagination;

  const schema = instructorSchema(orgType);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<InstructorFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      faculty: "",
      employmentType: "full_time",
      avatar: null,
    },
  });

  useEffect(() => {
    if (isEditMode && instructorData) {
      setValue("firstName", instructorData.firstName);
      setValue("lastName", instructorData.lastName);
      setValue("email", instructorData.email);
      setValue(
        "employmentType",
        instructorData.employmentType === "resigned"
          ? "retired"
          : instructorData.employmentType
      );

      // Handle faculty - it could be a string (ID) or an object with _id
      const facultyId =
        typeof instructorData.faculty === "string"
          ? instructorData.faculty
          : instructorData.faculty?._id;
      if (facultyId) {
        setValue("faculty", facultyId);
      }

      if (instructorData.avatar) {
        setPreviewUrl(instructorData.avatar);
        setValue("avatar", "existing"); // Set a non-null value for existing avatar
      }
    }
  }, [isEditMode, instructorData, setValue]);

  // Handle avatar image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewUrl(imageUrl);
      setAvatarFile(file);
      setAvatarChanged(true);
      setShowCropper(true);
    }
  };

  // Handle crop completion
  const handleCropComplete = (croppedImage: File | null) => {
    if (croppedImage) {
      setAvatarFile(croppedImage);
      setPreviewUrl(URL.createObjectURL(croppedImage));
      setAvatarChanged(true);
      setValue("avatar", croppedImage);
      clearErrors("avatar");
    }
    setShowCropper(false);
  };

  // Handle form submission
  const onSubmit = (data: InstructorFormData) => {
    // Check if this is a new instructor (no instructorId) and no avatar file
    if (!avatarFile && !isEditMode && !previewUrl) {
      setError("avatar", { message: "Avatar is required for new instructors" });
      return;
    }

    const formData = createInstructorFormData({
      ...data,
      userId: instructorId,
      orgCode: currentUser.user.organization.code,
      avatar: avatarFile || undefined,
    });

    if (isEditMode && instructorId) {
      toast.promise(
        updateInstructor.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error: any) => {
            console.error(
              `Error updating ${instructorTerm.toLowerCase()}:`,
              error
            );
            toast.error(
              error.data?.error?.message ||
                `Failed to update ${instructorTerm.toLowerCase()}`
            );
          },
        }),
        {
          pending: `Updating ${instructorTerm}...`,
          success: `${instructorTerm} updated successfully`,
          error: {
            render({ data }) {
              return (
                (data as any)?.data?.error?.message ||
                `Failed to update ${instructorTerm.toLowerCase()}`
              );
            },
          },
        }
      );
    } else {
      toast.promise(
        createInstructor.mutateAsync(formData, {
          onSuccess: () => {
            toast.success(`${instructorTerm} created successfully`);
            handleCloseModal();
          },
          onError: (error: any) => {
            toast.error(error.message);
          },
        }),
        {
          pending: `Creating ${instructorTerm}...`,
          success: `${instructorTerm} created successfully`,
          error: {
            render({ data }) {
              return (
                (data as any)?.message ||
                `Failed to create ${instructorTerm.toLowerCase()}`
              );
            },
          },
        }
      );
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    onClose();
    reset();
    setPreviewUrl(null);
    setAvatarFile(null);
    setAvatarChanged(false);
    setShowCropper(false);
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setAvatarFile(null);
    setAvatarChanged(true);
    setValue("avatar", null);
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={handleCloseModal}
        title={
          isEditMode ? `Edit ${instructorTerm}` : `Create New ${instructorTerm}`
        }
        backdrop="blur"
        size="full"
        contentClassName="w-full md:w-[40vw] md:min-w-[500px] max-w-[800px]"
      >
        {isPending && isLoadingInstructor ? (
          <div className="space-y-6 animate-pulse">
            {/* Avatar Upload Skeleton */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative">
                <div className="w-48 h-48 relative">
                  <div className="w-full h-full bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                    <div className="flex flex-col items-center">
                      <div className="w-28 h-5 bg-gray-300 rounded mb-2"></div>
                      <div className="w-20 h-4 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 w-9 h-9 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            </div>

            {/* First Name and Last Name Skeleton */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Email Skeleton */}
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>

            {/* Faculty Skeleton (conditionally rendered) */}
            {orgType === "school" && (
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
            )}

            {/* Employment Type Skeleton */}
            <div>
              <div className="h-4 w-36 bg-gray-200 rounded mb-2"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>

            {/* Form Buttons Skeleton */}
            <div className="flex gap-2 justify-end mt-6">
              <div className="h-9 w-28 bg-gray-200 rounded"></div>
              <div className="h-9 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <div className="w-48 h-48 relative">
                  <div
                    className={`w-full h-full bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden
                    ${
                      !avatarFile && !isEditMode ? "border-2 border-dashed" : ""
                    }
                    ${errors.avatar ? "border-red-500" : "border-gray-300"}
                  `}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <span
                          className={`text-lg ${
                            errors.avatar ? "text-red-500" : "text-gray-500"
                          }`}
                        >
                          Upload Photo
                        </span>
                        {!isEditMode && (
                          <span
                            className={`text-sm ${
                              errors.avatar ? "text-red-500" : "text-gray-500"
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
                      errors.avatar ? "bg-red-500" : "bg-primary"
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
              {errors.avatar?.message && (
                <p className="text-red-500 text-sm mt-2">
                  {String(errors.avatar.message)}
                </p>
              )}
            </div>

            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    errors.firstName ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  First Name
                </label>
                <input
                  {...register("firstName")}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Elizabeth"
                  disabled={isPending}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    errors.lastName ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  Last Name
                </label>
                <input
                  {...register("lastName")}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Lee"
                  disabled={isPending}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  errors.email ? "text-red-500" : "text-gray-700"
                }`}
              >
                Email
              </label>
              <input
                {...register("email")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                maxLength={50}
                placeholder="elizabeth.lee@university.edu"
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Faculty */}
            {orgType === "school" && (
              <div>
                <label
                  className={`block text-sm font-medium mb-2 ${
                    errors.faculty ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  Faculty
                </label>
                <SearchableSelect
                  options={
                    faculties?.map((faculty: IFaculty) => ({
                      value: faculty._id,
                      label: faculty.name,
                    })) || []
                  }
                  value={watch("faculty")}
                  onChange={(value) => {
                    setValue("faculty", value, { shouldValidate: true });
                    clearErrors("faculty");
                  }}
                  onSearch={(term) => setFacultySearchTerm(term)}
                  placeholder="Select a faculty"
                  loading={isLoadingFaculties}
                  emptyMessage="No faculties available"
                  emptyAction={{
                    label: "Create a new faculty",
                    path: `/${currentUser.user.organization.code}/admin/faculty?modal=create-faculty`,
                  }}
                  hasNextPage={hasNextFacultyPage}
                  isFetchingNextPage={isFetchingNextFacultyPage}
                  onLoadMore={fetchNextFacultyPage}
                  paginationInfo={facultiesPaginationInfo}
                  error={!!errors.faculty}
                />
                {errors.faculty && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.faculty.message}
                  </p>
                )}
              </div>
            )}

            {/* Employment Type */}
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  errors.employmentType ? "text-red-500" : "text-gray-700"
                }`}
              >
                Employment Type
              </label>
              <select
                {...register("employmentType")}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.employmentType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select employment type</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="probationary">Probationary</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
                <option value="temporary">Temporary</option>
                <option value="volunteer">Volunteer</option>
                <option value="retired">Retired</option>
              </select>
              {errors.employmentType && (
                <p className="text-red-500 text-sm mt-1">
                  Please select an employment type
                </p>
              )}
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
                isLoadingText={
                  isEditMode
                    ? `Updating ${instructorTerm}...`
                    : `Creating ${instructorTerm}...`
                }
                disabled={isPending || (!isDirty && !avatarChanged)}
              >
                {isEditMode
                  ? `Update ${instructorTerm}`
                  : `Create ${instructorTerm}`}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
      <ImageCropper
        imageSrc={previewUrl}
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        aspectRatio={1}
        onCropComplete={handleCropComplete}
      />
    </>
  );
}
