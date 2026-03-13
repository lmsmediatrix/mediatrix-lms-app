import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useState, useEffect, useRef } from "react";
import {
  useCreateFaculty,
  useGenerateCode,
  useGetFacultyById,
  useUpdateFaculty,
} from "../../hooks/useFaculty";
import { useAuth } from "../../context/AuthContext";
import { FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import { useDebounce } from "../../hooks/useDebounce";

const facultySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(20, "Code cannot exceed 20 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  isActive: z.string().transform((val) => val === "true"),
});

type FacultyFormData = {
  name: string;
  code: string;
  description: string;
  isActive: string;
};

interface UpsertFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertFacultyModal({
  isOpen,
  onClose,
}: UpsertFacultyModalProps) {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const facultyId = searchParams.get("id");
  const isEditMode = !!facultyId;
  const [isLoading, setIsLoading] = useState(false);
  const skipValidation = useRef(false);

  const { data: facultyData, isLoading: isFacultyLoading } = useGetFacultyById(
    facultyId || ""
  );
  const createFaculty = useCreateFaculty();
  const updateFaculty = useUpdateFaculty();
  const generateCodeHook = useGenerateCode();
  const validateCodeHook = useGenerateCode();

  const shouldShowLoading = isEditMode && isFacultyLoading;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: "true",
    },
    mode: "onChange",
  });

  const facultyName = watch("name");
  const facultyCode = watch("code");
  const debouncedName = useDebounce(facultyName, 500);
  const debouncedCode = useDebounce(facultyCode, 500);

  useEffect(() => {
    if (isEditMode && facultyData) {
      reset({
        name: facultyData.name || "",
        code: facultyData.code || "",
        description: facultyData.description || "",
        isActive: facultyData.isActive ? "true" : "false",
      });
    } else if (!isEditMode) {
      reset({
        name: "",
        code: "",
        description: "",
        isActive: "true",
      });
      setValue("isActive", "true");
    }
  }, [isEditMode, facultyData, reset, setValue]);

  const generateCodeHandler = async (name: string) => {
    if (!name || isEditMode) {
      return;
    }

    try {
      const response = await generateCodeHook.mutateAsync({ name });
      const generatedCode = response.code;

      skipValidation.current = true;
      setValue("code", generatedCode);
      clearErrors("code");
      skipValidation.current = false;
    } catch (error: any) {
      setError("code", {
        message: error.message,
      });
    }
  };

  const validateCodeHandler = async (code: string) => {
    if (!code || skipValidation.current || isEditMode) {
      return;
    }

    try {
      await validateCodeHook.mutateAsync({ code });
      clearErrors("code");
    } catch (error: any) {
      setError("code", {
        message: error.message,
      });
    }
  };

  useEffect(() => {
    if (debouncedName) {
      generateCodeHandler(debouncedName);
    }
  }, [debouncedName]);

  useEffect(() => {
    if (debouncedCode) {
      validateCodeHandler(debouncedCode);
    }
  }, [debouncedCode]);

  const handleCloseModal = () => {
    onClose();
    reset({
      name: "",
      code: "",
      description: "",
      isActive: "true",
    });
  };

  const onSubmit = async (data: FacultyFormData) => {
    setIsLoading(true);
    const formData = {
      ...data,
      organizationId: currentUser.user.organization._id,
      ...(facultyId && { _id: facultyId }),
    };

    if (facultyId) {
      toast.promise(
        updateFaculty.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error updating faculty:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Updating faculty...",
          success: "Faculty updated successfully",
          error: {
            render({ data }) {
              const message =
                (data as { message?: string })?.message ||
                "Failed to update faculty";
              return message;
            },
          },
        }
      );
    } else {
      toast.promise(
        createFaculty.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error creating faculty:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Creating faculty...",
          success: "Faculty created successfully",
          error: {
            render({ data }) {
              const message =
                (data as { message?: string })?.message ||
                "Failed to create faculty";
              return message;
            },
          },
        }
      );
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={isEditMode ? "Edit Faculty" : "Create Faculty"}
      className="w-full max-w-md"
    >
      {shouldShowLoading ? (
        <div className="space-y-4 animate-pulse">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="flex gap-2 pt-4">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Faculty Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.name ? "text-red-500" : "text-gray-700"
              }`}
            >
              Faculty Name
            </label>
            <input
              {...register("name")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter faculty name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Faculty Code */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.code ? "text-red-500" : "text-gray-700"
              }`}
            >
              Faculty Code
            </label>
            <div className="relative">
              <input
                {...register("code")}
                className={`w-full px-3 py-2 border rounded-md pr-8 ${
                  errors.code ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter faculty code"
                disabled={isLoading}
              />
              {(generateCodeHook.isPending || validateCodeHook.isPending) && (
                <FaSpinner
                  className="absolute right-2 top-[14px] transform -translate-y-1/2 text-gray-500"
                  style={{ animation: "customSpin 0.8s linear infinite" }}
                />
              )}
              {watch("code") &&
                !generateCodeHook.isPending &&
                !validateCodeHook.isPending &&
                !generateCodeHook.isError &&
                !validateCodeHook.isError && (
                  <FaCheck className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500" />
                )}
              {(generateCodeHook.isError || validateCodeHook.isError) && (
                <FaTimes className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-500" />
              )}
            </div>
            <style>
              {`
                @keyframes customSpin {
                  0% {
                    transform: rotate(0deg);
                  }
                  100% {
                    transform: rotate(360deg);
                  }
                }
              `}
            </style>
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          {/* Faculty Description */}
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
              rows={3}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter faculty description"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.isActive ? "text-red-500" : "text-gray-700"
              }`}
            >
              Status
            </label>
            <select
              {...register("isActive")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.isActive ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {errors.isActive && (
              <p className="text-red-500 text-sm mt-1">
                {errors.isActive.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full md:w-auto"
              disabled={isLoading || !isDirty}
            >
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Creating..."
                : isEditMode
                ? "Update Faculty"
                : "Create Faculty"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
