import { FaPlus } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import {
  useCreateStudent,
  useUpdateStudent,
  useGetStudentById,
} from "../../hooks/useStudent";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import { SearchableSelect } from "../SearchableSelect";
import { useInfiniteProgramsForDropdown } from "../../hooks/useProgram";
import { useDebounce } from "../../hooks/useDebounce";
import { IProgram } from "../../types/interfaces";
import { createStudentFormData } from "../../lib/formDataUtils";
import ImageCropper from "../ImageCropper";

// Define the schema for the student form using Zod
const studentSchema = (orgType: string) =>
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
    studentId:
      orgType === "school"
        ? z
            .string()
            .min(3, "ID must be at least 3 characters")
            .max(50, "ID cannot exceed 50 characters")
        : z.string().optional(),
    program:
      orgType === "school"
        ? z
            .string()
            .min(1, "Program is required")
            .max(50, "Program cannot exceed 50 characters")
        : z.string().optional(),
    avatar: z.any().refine((val) => {
      return val !== null;
    }, "Avatar is required"),
  });

type StudentFormData = z.infer<ReturnType<typeof studentSchema>>;

interface StudentData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: string;
  status: string;
  studentId: string;
  createdAt: string;
  updatedAt: string;
  program: { _id: string; name: string };
}

interface UpsertStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertStudentModal({
  isOpen,
  onClose,
}: UpsertStudentModalProps) {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType); // "Student" or "Employee"

  const [searchParams] = useSearchParams();
  const modal = searchParams.get("modal");
  const studentId = searchParams.get("id");

  const isEditMode = modal === "edit-student";
  const { data: response, isLoading: isLoadingStudent } = useGetStudentById(
    studentId || ""
  );
  const studentData = response?.data as StudentData;
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const isPending =
    createStudent.isPending || updateStudent.isPending || isLoadingStudent;

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for program search
  const [programSearchTerm, setProgramSearchTerm] = useState("");
  const debouncedProgramSearchTerm = useDebounce(programSearchTerm, 300);

  // Programs dropdown hook with infinite scrolling
  const {
    data: programsData,
    isLoading: isLoadingPrograms,
    fetchNextPage: fetchNextProgramPage,
    hasNextPage: hasNextProgramPage,
    isFetchingNextPage: isFetchingNextProgramPage,
  } = useInfiniteProgramsForDropdown({
    organizationId: currentUser.user.organization._id,
    searchTerm: debouncedProgramSearchTerm,
    limit: 10,
  });

  // Flatten the paginated data
  const programs =
    programsData?.pages.flatMap((page) => page.programs || []) || [];
  const programsPaginationInfo =
    programsData?.pages[programsData.pages.length - 1]?.pagination;

  const schema = studentSchema(orgType);
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<StudentFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      studentId: "",
      program: "",
      avatar: null,
    },
  });

  // Set form values when editing an existing student
  useEffect(() => {
    if (isEditMode && studentData) {
      setValue("firstName", studentData.firstName);
      setValue("lastName", studentData.lastName);
      setValue("email", studentData.email);
      setValue("studentId", studentData.studentId);

      // Handle program - it could be a string (ID) or an object with _id
      const programId = studentData.program?._id;
      setValue("program", programId);

      // Set avatar preview if available
      if (studentData.avatar) {
        setPreviewUrl(studentData.avatar);
        setValue("avatar", "existing"); // Set a non-null value for existing avatar
      }
    }
  }, [isEditMode, studentData, setValue]);

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

  const onSubmit = (data: StudentFormData) => {
    if (!avatarFile && !studentId && !previewUrl) {
      setError("avatar", { message: "Avatar is required for new students" });
      return;
    }

    const formData = createStudentFormData({
      ...data,
      avatar: avatarFile || undefined,
      _id: studentId || undefined,
      orgCode: currentUser.user.organization.code,
    });

    if (isEditMode && studentId) {
      toast.promise(
        updateStudent.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error: any) => {
            console.error(
              `Error updating ${learnerTerm.toLowerCase()}:`,
              error
            );
          },
        }),
        {
          pending: `Updating ${learnerTerm.toLowerCase()}...`,
          success: `${learnerTerm} updated successfully`,
          error: {
            render({ data }) {
              return (
                (data as { message: string }).message ||
                `Failed to update ${learnerTerm.toLowerCase()}`
              );
            },
          },
        }
      );
    } else {
      toast.promise(
        createStudent.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error: any) => {
            console.error(
              `Error creating ${learnerTerm.toLowerCase()}:`,
              error
            );
          },
        }),
        {
          pending: `Creating ${learnerTerm.toLowerCase()}...`,
          success: `${learnerTerm} created successfully`,
          error: {
            render({ data }) {
              return (
                (data as { message: string }).message ||
                `Failed to create ${learnerTerm.toLowerCase()}`
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
        title={isEditMode ? `Edit ${learnerTerm}` : `Create New ${learnerTerm}`}
        backdrop="blur"
        size="full"
        contentClassName="w-full md:w-[40vw] md:min-w-[500px] max-w-[800px]"
      >
        {isPending && isLoadingStudent ? (
          <div className="space-y-4 animate-pulse">
            {/* Avatar Upload Skeleton */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative">
                <div className="w-40 h-40 relative">
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
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-9 w-full bg-gray-200 rounded"></div>
              </div>
            </div>

            {/* Email Skeleton */}
            <div>
              <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>

            {/* Student ID Skeleton */}
            <div>
              <div className="h-4 w-28 bg-gray-200 rounded mb-1"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>

            {/* Program Skeleton */}
            <div>
              <div className="h-4 w-20 bg-gray-200 rounded mb-1"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>

            {/* Form Buttons Skeleton */}
            <div className="flex gap-2 justify-end mt-6">
              <div className="h-9 w-28 bg-gray-200 rounded"></div>
              <div className="h-9 w-40 bg-gray-200 rounded"></div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  disabled={isPending}
                />
                <div className="w-40 h-40 relative">
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
                        <span
                          className={`text-sm ${
                            errors.avatar ? "text-red-500" : "text-gray-500"
                          }`}
                        >
                          Required
                        </span>
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
                  className={`block text-sm font-medium mb-1 ${
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
                  placeholder="John"
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
                  className={`block text-sm font-medium mb-1 ${
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
                  placeholder="Doe"
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
                className={`block text-sm font-medium mb-1 ${
                  errors.email ? "text-red-500" : "text-gray-700"
                }`}
              >
                Email
              </label>
              <input
                {...register("email")}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-md ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="john.doe@university.edu"
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* ID field */}
            {orgType === "school" && (
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    errors.studentId ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  {learnerTerm} ID
                </label>
                <input
                  {...register("studentId")}
                  maxLength={50}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.studentId ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder={`e.g., ${learnerTerm.toLowerCase()}123`}
                  disabled={isPending}
                />
                {errors.studentId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.studentId.message}
                  </p>
                )}
              </div>
            )}

            {/* Program field */}
            {orgType === "school" && (
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    errors.program ? "text-red-500" : "text-gray-700"
                  }`}
                >
                  Program
                </label>
                <SearchableSelect
                  options={
                    programs?.map((program: IProgram) => ({
                      value: program._id,
                      label: program.name,
                    })) || []
                  }
                  value={watch("program")}
                  onChange={(value) =>
                    setValue("program", value, { shouldDirty: true })
                  }
                  onSearch={(term) => setProgramSearchTerm(term)}
                  placeholder="Select a program"
                  loading={isLoadingPrograms}
                  emptyMessage="No programs available"
                  emptyAction={{
                    label: "Create a new program",
                    path: `/${currentUser.user.organization.code}/admin/program?modal=create-program`,
                  }}
                  hasNextPage={hasNextProgramPage}
                  isFetchingNextPage={isFetchingNextProgramPage}
                  onLoadMore={fetchNextProgramPage}
                  paginationInfo={programsPaginationInfo}
                />
                {errors.program && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.program.message}
                  </p>
                )}
              </div>
            )}

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
                    ? `Updating ${learnerTerm}...`
                    : `Creating ${learnerTerm}...`
                }
                disabled={isPending || (!isDirty && !avatarChanged)}
              >
                {isEditMode ? `Update ${learnerTerm}` : `Create ${learnerTerm}`}
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
