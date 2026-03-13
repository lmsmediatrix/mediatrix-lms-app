import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useRemoveStudentInSection } from "../../hooks/useSection";

interface DeleteStudentFromSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionCode: string;
  studentId: string;
  studentName: string;
}

export default function DeleteStudentFromSectionModal({
  isOpen,
  onClose,
  sectionCode,
  studentId,
  studentName,
}: DeleteStudentFromSectionModalProps) {
  const removeStudent = useRemoveStudentInSection();

  const handleDelete = () => {
    toast.promise(
      removeStudent.mutateAsync(
        { sectionCode, studentId },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (error) => {
            console.error("Error removing student from section:", error);
          },
        }
      ),
      {
        pending: "Removing student from section...",
        success: "Student removed from section successfully",
        error: "Failed to remove student from section",
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Remove Student from Section"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to remove{" "}
          <span className="font-semibold">{studentName}</span> from this
          section? This action cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
            disabled={removeStudent.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={removeStudent.isPending}
          >
            {removeStudent.isPending ? "Removing..." : "Remove Student"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
