import { toast } from "react-toastify";
import Button from "../common/Button";
import Dialog from "../common/Dialog";
import { useNavigate, useParams } from "react-router-dom";
import { useDeleteSection } from "../../hooks/useSection";

interface DeleteSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionName: string;
}

export default function DeleteSectionModal({
  isOpen,
  onClose,
  sectionId,
  sectionName,
}: DeleteSectionModalProps) {
  const { orgCode } = useParams();
  const navigate = useNavigate();
  const { mutate: deleteSection, isPending } = useDeleteSection();

  const handleDelete = () => {
    deleteSection(sectionId, {
      onSuccess: () => {
        toast.success("Section deleted successfully");
        navigate(`/${orgCode}/admin/section`);
        onClose();
      },
      onError: (error) => {
        toast.error("Failed to delete section: " + error.message);
      },
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Section"
      backdrop="blur"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-gray-700">
          Are you sure you want to delete{" "}
          <span className="font-semibold">{sectionName}</span>? This action
          cannot be undone.
        </p>

        <div className="flex gap-2 justify-end mt-6">
          <Button
            type="button"
            variant="cancel"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isPending}
          >
            {isPending ? "Deleting..." : "Delete Section"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
