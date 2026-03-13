import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";

import { useState, useEffect } from "react";
import {
  useCreateCategory,
  useGetCategoryById,
  useUpdateCategory,
} from "../../hooks/useCategory";
import { useAuth } from "../../context/AuthContext";
import Dialog from "../../components/common/Dialog";
import Button from "../../components/common/Button";

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  isActive: z.string().transform((val) => val === "true"),
});

type CategoryFormData = {
  name: string;
  isActive: string;
};

interface UpsertCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpsertCategoryModal({
  isOpen,
  onClose,
}: UpsertCategoryModalProps) {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("id");
  const isEditMode = !!categoryId;
  const [isLoading, setIsLoading] = useState(false);

  const { data: categoryData, isLoading: isCategoryLoading } =
    useGetCategoryById(categoryId || "");

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const shouldShowLoading = isEditMode && isCategoryLoading;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
    reset,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      isActive: "true",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (isEditMode && categoryData?.data) {
      const category = categoryData.data;
      reset({
        name: category.name,
        isActive: category.isActive ? "true" : "false",
      });
    } else if (!isEditMode) {
      reset({
        name: "",
        isActive: "true",
      });
      // Explicitly set the isActive value to ensure the select shows the correct option
      setValue("isActive", "true");
    }
  }, [isEditMode, categoryData, reset, setValue]);

  const handleCloseModal = () => {
    onClose();
    reset({
      name: "",
      isActive: "true",
    });
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsLoading(true);
    const formData = {
      ...data,
      organizationId: currentUser.user.organization._id,
      ...(categoryId && { _id: categoryId }),
    };

    if (categoryId) {
      toast.promise(
        updateCategory.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error updating category:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Updating category...",
          success: "Category updated successfully",
          error: {
            render({ data }) {
              return (data as { message: string }).message;
            },
          },
        }
      );
    } else {
      toast.promise(
        createCategory.mutateAsync(formData, {
          onSuccess: () => {
            handleCloseModal();
          },
          onError: (error) => {
            console.error("Error creating category:", error);
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }),
        {
          pending: "Creating category...",
          success: "Category created successfully",
          error: {
            render({ data }) {
              return (data as { message: string }).message;
            },
          },
        }
      );
    }
  };

  if (shouldShowLoading) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleCloseModal}
        title="Loading..."
        className="w-full max-w-md"
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
      title={isEditMode ? "Edit Category" : "Create Category"}
      className="w-full max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            className={`block text-sm font-medium mb-1 ${
              errors.name ? "text-red-500" : "text-gray-700"
            }`}
          >
            Category Name
          </label>
          <input
            {...register("name")}
            className={`w-full px-3 py-2 border rounded-md ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Information Technology"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="w-full md:w-auto"
            disabled={
              isLoading || (isEditMode ? !isDirty || !isValid : !isValid)
            }
          >
            {isLoading
              ? isEditMode
                ? "Updating..."
                : "Creating..."
              : isEditMode
              ? "Update Category"
              : "Create Category"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
