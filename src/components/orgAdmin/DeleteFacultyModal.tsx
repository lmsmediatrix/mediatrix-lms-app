import { useState } from "react";
import { toast } from "react-toastify";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useDeleteFaculty } from "../../hooks/useFaculty";

interface FacultyToDelete {
  id: string;
  name: string;
}

interface DeleteFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  faculty: FacultyToDelete;
}

export default function DeleteFacultyModal({
  isOpen,
  onClose,
  faculty,
}: DeleteFacultyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const deleteFaculty = useDeleteFaculty();

  const handleDelete = async () => {
    setIsLoading(true);

    toast.promise(
      deleteFaculty.mutateAsync(faculty.id, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error deleting faculty:", error);
        },
        onSettled: () => {
          setIsLoading(false);
        },
      }),
      {
        pending: "Deleting faculty...",
        success: "Faculty deleted successfully",
        error: "Failed to delete faculty",
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Faculty"
      className="w-full max-w-md"
    >
      <div className="space-y-4">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Delete Faculty
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Are you sure you want to delete the faculty{" "}
            <span className="font-semibold text-gray-900">
              "{faculty.name}"
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Faculty"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
