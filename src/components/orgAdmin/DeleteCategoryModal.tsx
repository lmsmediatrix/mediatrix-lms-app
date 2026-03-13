import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useDeleteCategory } from "../../hooks/useCategory";
import { useState } from "react";

interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
}

export default function DeleteCategoryModal({
  isOpen,
  onClose,
  categoryId,
  categoryName,
}: DeleteCategoryModalProps) {
  const deleteCategory = useDeleteCategory();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    toast.promise(
      deleteCategory.mutateAsync(categoryId, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error deleting category:", error);
        },
        onSettled: () => {
          setIsLoading(false);
        },
      }),
      {
        pending: "Deleting category...",
        success: "Category deleted successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message || "Failed to delete category";
          },
        },
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Category"
      className="w-full max-w-md"
    >
      <div className="space-y-4">
        <p className="text-gray-600">
          Are you sure you want to delete the category{" "}
          <span className="font-semibold">"{categoryName}"</span>? This action
          cannot be undone.
        </p>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Category"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
