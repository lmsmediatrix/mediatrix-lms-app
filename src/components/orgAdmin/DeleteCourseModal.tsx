import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useArchiveCourse, useCourseArchiveImpact } from "../../hooks/useCourse";

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
  const archiveCourse = useArchiveCourse();
  const [cascadeBatches, setCascadeBatches] = useState(true);

  const { data: archiveImpactData, isLoading: isArchiveImpactLoading } = useCourseArchiveImpact(
    courseId,
    { enabled: isOpen && Boolean(courseId) }
  );

  useEffect(() => {
    if (isOpen) {
      setCascadeBatches(true);
    }
  }, [isOpen]);

  const archiveImpact = archiveImpactData?.data;
  const activeBatchCount = Number(
    archiveImpact?.activeBatchCount ?? archiveImpact?.activeSectionCount ?? 0
  );
  const activeProgramCount = Number(archiveImpact?.activeProgramCount ?? 0);
  const impactedSections = Array.isArray(archiveImpact?.sections) ? archiveImpact.sections : [];
  const impactedPrograms = Array.isArray(archiveImpact?.programs) ? archiveImpact.programs : [];

  const handleDelete = () => {
    toast.promise(
      archiveCourse.mutateAsync(
        {
          courseId,
          confirm: true,
          cascade: cascadeBatches,
        },
        {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          console.error("Error archiving course:", error);
        },
      }
      ),
      {
        pending: "Archiving course...",
        success: "Course archived successfully",
        error: {
          render({ data }) {
            return (
              (data as { message?: string })?.message ||
              "Unable to archive course"
            );
          },
        },
      }
    );
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Course"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to archive{" "}
          <span className="font-semibold">{courseTitle}</span>?
        </p>

        {isArchiveImpactLoading ? (
          <p className="text-sm text-gray-500">
            Checking linked batches and programs...
          </p>
        ) : activeBatchCount > 0 || activeProgramCount > 0 ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {activeBatchCount > 0 && (
              <p className="font-medium">
                This course is linked to {activeBatchCount} active batch
                {activeBatchCount > 1 ? "es" : ""}.
              </p>
            )}
            {activeProgramCount > 0 && (
              <p className="mt-1 font-medium">
                This course is referenced by {activeProgramCount} active program
                {activeProgramCount > 1 ? "s" : ""}.
              </p>
            )}
            <p className="mt-1">
              Review the impact before archiving. You can cascade active batches
              below.
            </p>
            {impactedSections.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {impactedSections.slice(0, 5).map((section: any) => (
                  <li key={section._id}>
                    {(section.code || "No Code").trim()} -{" "}
                    {(section.name || "Unnamed Section").trim()}
                  </li>
                ))}
                {impactedSections.length > 5 && (
                  <li>...and {impactedSections.length - 5} more</li>
                )}
              </ul>
            )}
            {impactedPrograms.length > 0 && (
              <ul className="mt-2 list-disc pl-5">
                {impactedPrograms.slice(0, 5).map((program: any) => (
                  <li key={program._id}>
                    {(program.code || "No Code").trim()} -{" "}
                    {(program.name || "Unnamed Program").trim()}
                  </li>
                ))}
                {impactedPrograms.length > 5 && (
                  <li>...and {impactedPrograms.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No active batch/program dependency found. This will archive the
            course only.
          </p>
        )}

        {activeBatchCount > 0 && (
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={cascadeBatches}
              onChange={(event) => setCascadeBatches(event.target.checked)}
              className="mt-0.5"
            />
            <span>
              Cascade archive active batches linked to this course (recommended).
            </span>
          </label>
        )}

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
            disabled={archiveCourse.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={archiveCourse.isPending || isArchiveImpactLoading}
          >
            {archiveCourse.isPending ? "Archiving..." : "Archive Course"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
