import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useDeleteInstructor } from "../../hooks/useInstructor";

interface DeleteInstructorModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId: string;
  instructorName: string;
}

export default function DeleteInstructorModal({
  isOpen,
  onClose,
  instructorId,
  instructorName,
}: DeleteInstructorModalProps) {
  const deleteInstructor = useDeleteInstructor();

  const handleDelete = () => {
    toast.promise(
      deleteInstructor.mutateAsync(instructorId, {
        onSuccess: () => {
          onClose();
        },
      }),
      {
        pending: "Deleting instructor...",
        success: "Instructor deleted successfully",
        error: `Failed to delete instructor`,
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Instructor"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{instructorName}</span>? This action
          cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            onClick={onClose}
            className="bg-gray-100 text-gray-700 hover:bg-gray-200"
            disabled={deleteInstructor.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleteInstructor.isPending}
            isLoading={deleteInstructor.isPending}
            isLoadingText="Deleting..."
          >
            "Delete Instructor
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
