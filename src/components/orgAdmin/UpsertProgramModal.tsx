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
      <Dialog
        isOpen={isOpen}
        onClose={handleCloseModal}
        title="Loading..."
        backdrop="blur"
        size="full"
        contentClassName="w-full md:w-[40vw] md:min-w-[500px] max-w-[760px]"
      >
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
      backdrop="blur"
      size="full"
      contentClassName="w-full md:w-[40vw] md:min-w-[500px] max-w-[760px]"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Program Details</h3>
            <p className="text-sm text-slate-500">
              Define the program name, code, and a short description.
            </p>
          </div>

          <div>
            <label
              htmlFor="name"
              className={`block text-sm font-medium mb-1 ${
                errors.name ? "text-red-500" : "text-slate-700"
              }`}
            >
              Program Name *
            </label>
            <input
              type="text"
              id="name"
              {...register("name")}
              className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${
                errors.name ? "border-red-500" : "border-slate-300 focus:border-primary"
              }`}
              placeholder="Enter program name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="code"
              className={`block text-sm font-medium mb-1 ${
                errors.code ? "text-red-500" : "text-slate-700"
              }`}
            >
              Program Code *
            </label>
            <input
              type="text"
              id="code"
              {...register("code")}
              className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${
                errors.code ? "border-red-500" : "border-slate-300 focus:border-primary"
              }`}
              placeholder="Enter program code"
              disabled={isLoading}
            />
            {errors.code && (
              <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className={`block text-sm font-medium mb-1 ${
                errors.description ? "text-red-500" : "text-slate-700"
              }`}
            >
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              rows={4}
              className={`w-full px-3.5 py-2.5 border rounded-xl outline-none transition-colors ${
                errors.description ? "border-red-500" : "border-slate-300 focus:border-primary"
              }`}
              placeholder="Enter program description"
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="cancel"
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
