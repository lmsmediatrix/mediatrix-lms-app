import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import {
  useCreateModule,
  useGetModuleById,
  useUpdateModule,
} from "../../hooks/useModule";

const moduleSchema = z.object({
  title: z
    .string()
    .min(3, "Module title must be at least 3 characters")
    .max(100, "Module title must be at most 100 characters"),
  certificateEnabled: z.boolean().optional(),
});

type ModuleFormData = z.infer<typeof moduleSchema>;

interface CreateModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionName?: string;
}

export default function CreateModuleModal({
  isOpen,
  onClose,
  sectionName,
}: CreateModuleModalProps) {
  const [searchParams] = useSearchParams();
  const moduleId = searchParams.get("moduleId");
  const { data: moduleData, isPending } = useGetModuleById(moduleId || "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: { title: "", certificateEnabled: false },
  });

  // Update form when module data is loaded
  useEffect(() => {
    if (moduleId && moduleData?.data) {
      reset({
        title: moduleData.data.title || "",
        certificateEnabled: Boolean(moduleData.data.certificateEnabled),
      });
      return;
    }
    if (!moduleId) {
      reset({ title: "", certificateEnabled: false });
    }
  }, [moduleData, moduleId, reset]);

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  const { currentUser } = useAuth();
  const location = useLocation();

  const onSubmit = async (data: ModuleFormData) => {
    if (moduleId && moduleData) {
      // Update existing module
      toast.promise(
        updateModule.mutateAsync(
          { _id: moduleId, title: data.title, certificateEnabled: !!data.certificateEnabled },
          {
            onSuccess: () => {
              reset();
              onClose();
            },
          }
        ),
        {
          pending: "Updating module...",
          success: "Module updated successfully",
          error: "Failed to update module",
        }
      );
    } else {
      // Create new module
      const moduleData = {
        ...data,
        certificateEnabled: !!data.certificateEnabled,
        organizationId: currentUser?.user.organization._id,
        sectionCode: location.pathname.split("/")[4],
      };

      toast.promise(
        createModule.mutateAsync(moduleData, {
          onSuccess: () => {
            reset();
            onClose();
          },
        }),
        {
          pending: "Creating module...",
          success: "Module created successfully",
          error: "Failed to create module",
        }
      );
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={moduleId ? "Update Module" : "Create New Module"}
      subTitle={`${sectionName}`}
      backdrop="blur"
      contentClassName="w-[50vw]"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="pb-6 w-full">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="title"
              className="text-sm font-medium text-gray-700"
            >
              Module Title
            </label>
            <input
              type="text"
              id="title"
              {...register("title")}
              minLength={1}
              maxLength={100}
              disabled={moduleId ? isSubmitting || isPending : isSubmitting} // Only check isPending for edit mode
              placeholder="Module Title"
              className="mt-1 px-4 py-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
            {errors.title && (
              <p className="mt-1.5 text-sm text-red-600 font-medium">
                {errors.title.message}
              </p>
            )}
          </div>
          <label className="mt-4 inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register("certificateEnabled")}
              disabled={moduleId ? isSubmitting || isPending : isSubmitting}
            />
            Enable completion certificate for this module
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            variant="cancel"
            type="button"
            onClick={onClose}
            className="bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            type="submit"
            disabled={
              isSubmitting ||
              createModule.isPending ||
              updateModule.isPending ||
              !isDirty
            }
            isLoadingText={moduleId ? "Updating..." : "Creating..."}
            isLoading={
              moduleId ? updateModule.isPending : createModule.isPending
            }
          >
            {moduleId ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
