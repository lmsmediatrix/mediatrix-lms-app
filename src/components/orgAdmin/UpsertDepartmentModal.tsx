import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useState, useEffect } from "react";
import {
  useCreateDepartment,
  useGetDepartmentById,
  useUpdateDepartment,
} from "../../hooks/useDepartment";
import { useAuth } from "../../context/AuthContext";

const departmentSchema = z.object({
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

type DepartmentFormData = {
  name: string;
  code: string;
  description: string;
  isActive: string;
};

interface UpsertDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertDepartmentModal({
  isOpen,
  onClose,
}: UpsertDepartmentModalProps) {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const departmentId = searchParams.get("id");
  const isEditMode = !!departmentId;
  const [isLoading, setIsLoading] = useState(false);

  const { data: departmentData, isLoading: isDepartmentLoading } = useGetDepartmentById(
    departmentId || ""
  );
  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: "true",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isEditMode && departmentData) {
      reset({
        name: departmentData.name || "",
        code: departmentData.code || "",
        description: departmentData.description || "",
        isActive: departmentData.isActive ? "true" : "false",
      });
    } else if (!isEditMode) {
      reset({
        name: "",
        code: "",
        description: "",
        isActive: "true",
      });
    }
  }, [isEditMode, departmentData, reset]);

  const handleCloseModal = () => {
    onClose();
    reset({
      name: "",
      code: "",
      description: "",
      isActive: "true",
    });
  };

  const onSubmit = async (data: DepartmentFormData) => {
    setIsLoading(true);
    const formData = {
      ...data,
      organizationId: currentUser.user.organization._id,
      ...(departmentId && { _id: departmentId }),
    };

    if (departmentId) {
      toast.promise(
        updateDepartment.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error updating department:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Updating department...",
          success: "Department updated successfully",
          error: {
            render({ data }) {
              return (
                (data as { message?: string })?.message ||
                "Failed to update department"
              );
            },
          },
        }
      );
    } else {
      toast.promise(
        createDepartment.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error creating department:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Creating department...",
          success: "Department created successfully",
          error: {
            render({ data }) {
              return (
                (data as { message?: string })?.message ||
                "Failed to create department"
              );
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
      title={isEditMode ? "Edit Department" : "Create Department"}
      className="w-full max-w-md"
    >
      {isEditMode && isDepartmentLoading ? (
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
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.name ? "text-red-500" : "text-gray-700"
              }`}
            >
              Department Name
            </label>
            <input
              {...register("name")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter department name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                errors.code ? "text-red-500" : "text-gray-700"
              }`}
            >
              Department Code
            </label>
            <input
              {...register("code")}
              className={`w-full px-3 py-2 border rounded-md ${
                errors.code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter department code"
              disabled={isLoading}
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

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
              placeholder="Enter department description"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

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
                ? "Update Department"
                : "Create Department"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
