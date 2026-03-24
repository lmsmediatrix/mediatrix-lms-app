import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useState, useEffect } from "react";
import {
  useCreateProgram,
  useGetProgramById,
  useUpdateProgram,
} from "../../hooks/useProgram";
import { useAuth } from "../../context/AuthContext";

const programSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  code: z
    .string()
    .min(1, "Program code is required")
    .max(500, "Description cannot exceed 500 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
});

type ProgramFormData = z.infer<typeof programSchema>;

interface UpsertProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertProgramModal({
  isOpen,
  onClose,
}: UpsertProgramModalProps) {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  const programId = searchParams.get("id");
  const isEditMode = !!programId;

  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const { data: programData, isLoading: isProgramLoading } = useGetProgramById(
    programId || ""
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProgramFormData>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
    mode: "onChange", // Ensure validation runs on every change
  });


  useEffect(() => {
    if (isEditMode && programData) {
      reset({
        name: programData.name || "",
        code: programData.code || "",
        description: programData.description || "",
      });
    } else if (!isEditMode) {
      reset({
        name: "",
        code: "",
        description: "",
      });
    }
  }, [isEditMode, programData, reset]);

  const handleCloseModal = () => {
    onClose();
    reset({
      name: "",
      code: "",
      description: "",
    });
  };

  const onSubmit = async (data: ProgramFormData) => {
    setIsLoading(true);
    const formData = {
      ...data,
      organizationId: currentUser.user.organization._id,
      ...(programId && { _id: programId }),
    };

    if (programId) {
      toast.promise(
        updateProgram.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error updating program:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Updating program...",
          success: "Program updated successfully",
          error: {
            render({ data }) {
              return (data as { message: string }).message;
            },
          },
        }
      );
    } else {
      toast.promise(
        createProgram.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error creating program:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Creating program...",
          success: "Program created successfully",
          error: {
            render({ data }) {
              return (data as { message: string }).message;
            },
          },
        }
      );
    }
  };

  if (isEditMode && isProgramLoading) {
    return (
      <Dialog isOpen={isOpen} onClose={handleCloseModal} title="Loading...">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCloseModal}
      title={isEditMode ? "Edit Program" : "Create New Program"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className={`block text-sm font-medium mb-1 ${
              errors.name ? "text-red-500" : "text-gray-700"
            }`}
          >
            Program Name *
          </label>
          <input
            type="text"
            id="name"
            {...register("name")}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter program name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="code"
            className={`block text-sm font-medium mb-1 ${
              errors.code ? "text-red-500" : "text-gray-700"
            }`}
          >
            Program Code *
          </label>
          <input
            type="text"
            id="code"
            {...register("code")}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.code ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter program code"
          />
          {errors.code && (
            <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className={`block text-sm font-medium mb-1 ${
              errors.description ? "text-red-500" : "text-gray-700"
            }`}
          >
            Description *
          </label>
          <textarea
            id="description"
            {...register("description")}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter program description"
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseModal}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !isDirty}
          >
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Program"
              : "Create Program"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
