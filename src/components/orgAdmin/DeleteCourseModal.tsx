import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useDeleteCourse } from "../../hooks/useCourse";

interface DeleteCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
}

export default function DeleteCourseModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
}: DeleteCourseModalProps) {
  const deleteCourse = useDeleteCourse();

  const handleDelete = () => {
    toast.promise(
      deleteCourse.mutateAsync(courseId, {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error deleting course:", error);
        },
      }),
      {
        pending: "Deleting course...",
        success: "Course deleted successfully",
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
      title="Delete Course"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{courseTitle}</span>? This action
          cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
            disabled={deleteCourse.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={deleteCourse.isPending}
          >
            {deleteCourse.isPending ? "Deleting..." : "Delete Course"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
