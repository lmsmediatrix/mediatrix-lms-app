import { useSearchParams } from "react-router-dom";
import Dialog from "../common/Dialog";
import Button from "../common/Button";
import { useViewProgramById } from "../../hooks/useProgram";
import { formatDate } from "../../lib/dateUtils";
import {
  FaHashtag,
  FaFileAlt,
  FaCalendarAlt,
} from "react-icons/fa";

interface ViewProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewProgramModal({
  isOpen,
  onClose,
}: ViewProgramModalProps) {
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("id");

  const { data: programData, isLoading } = useViewProgramById(programId || "");

  const handleClose = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Program Details"
        backdrop="blur"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </Dialog>
    );
  }

  if (!programData) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Program Details"
        backdrop="blur"
        size="2xl"
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Program not found</p>
        </div>
      </Dialog>
    );
  }

  const program = programData;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Program Details"
      className="w-full"
      backdrop="blur"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Program Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {program.name}
          </h2>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Program
            </span>
          </div>
        </div>

        {/* Program Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaHashtag className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Program Code</p>
                <p className="font-medium">{program.code}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{formatDate(program.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{formatDate(program.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        {program.description && (
          <div className="border-t pt-4">
            <div className="flex items-start gap-3">
              <FaFileAlt className="text-gray-400 mt-1" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {program.description}
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
