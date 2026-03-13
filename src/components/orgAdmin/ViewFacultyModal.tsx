import { useSearchParams } from "react-router-dom";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useViewFacultyById } from "../../hooks/useFaculty";
import { formatDate } from "../../lib/dateUtils";
import { FaHashtag, FaFileAlt, FaCalendarAlt } from "react-icons/fa";

interface ViewFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewFacultyModal({
  isOpen,
  onClose,
}: ViewFacultyModalProps) {
  const [searchParams] = useSearchParams();
  const facultyId = searchParams.get("id");

  const { data, isLoading } = useViewFacultyById(facultyId || "");

  const handleClose = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Faculty Details"
        backdrop="blur"
        size="2xl"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </Dialog>
    );
  }

  if (!data) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Faculty Details"
        backdrop="blur"
        size="2xl"
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Faculty not found</p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Faculty Details"
      backdrop="blur"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Faculty Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{data.name}</h2>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                data.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {data.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Faculty Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaHashtag className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Faculty Code</p>
                <p className="font-medium">{data.code}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(data.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(data.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {data.description && (
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <FaFileAlt className="text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {data.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
