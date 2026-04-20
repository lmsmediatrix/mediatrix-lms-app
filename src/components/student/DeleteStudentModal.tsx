import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useDeleteStudent, useStudentArchiveImpact } from "../../hooks/useStudent";

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
  const { data: archiveImpactData, isLoading: isArchiveImpactLoading } =
    useStudentArchiveImpact(studentId, { enabled: isOpen && Boolean(studentId) });

  const archiveImpact = archiveImpactData?.data;
  const sectionCount = Number(archiveImpact?.sectionCount || 0);
  const impactedSections = Array.isArray(archiveImpact?.sections) ? archiveImpact.sections : [];

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
        pending: "Archiving student...",
        success: "Student archived successfully",
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
      title="Archive Student"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to archive{" "}
          <span className="font-semibold">{studentName}</span>?
        </p>

        {isArchiveImpactLoading ? (
          <p className="text-sm text-gray-500">
            Checking section/batch assignments...
          </p>
        ) : sectionCount > 0 ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-medium">
              This learner is assigned to {sectionCount} batch/section
              {sectionCount > 1 ? "s" : ""}.
            </p>
            <p className="mt-1">
              Archiving will automatically remove them from those active batches/sections, while
              keeping history records (attendance/grades).
            </p>
            {impactedSections.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {impactedSections.slice(0, 5).map((section: any) => (
                  <li key={section._id}>
                    {(section.code || "No Code").trim()} - {(section.name || "Unnamed Section").trim()}
                  </li>
                ))}
                {impactedSections.length > 5 && (
                  <li>...and {impactedSections.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No active batch/section assignments found. This will archive the learner only.
          </p>
        )}

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
            disabled={deleteStudent.isPending || isArchiveImpactLoading}
          >
            {deleteStudent.isPending ? "Archiving..." : "Archive Student"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
