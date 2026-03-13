import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useDeleteStudent } from "../../hooks/useStudent";

interface DeleteStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export default function DeleteStudentModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: DeleteStudentModalProps) {
  const deleteStudent = useDeleteStudent();

  const handleDelete = () => {
    toast.promise(
      deleteStudent.mutateAsync(studentId, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error deleting student:", error);
        },
      }),
      {
        pending: "Deleting student...",
        success: "Student deleted successfully",
        error: {
          render({ data }) {
            return (data as { message: string }).message;
          },
        },
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Student"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{studentName}</span>? This action
          cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
            disabled={deleteStudent.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleteStudent.isPending}
          >
            {deleteStudent.isPending ? "Deleting..." : "Delete Student"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
