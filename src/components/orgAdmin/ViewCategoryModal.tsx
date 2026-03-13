import { useSearchParams } from "react-router-dom";
import { useViewCategoryById } from "../../hooks/useCategory";
import { formatDate } from "../../lib/dateUtils";
import { FaCalendarAlt } from "react-icons/fa";
import Dialog from "../common/Dialog";
import Button from "../common/Button";

interface ViewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewCategoryModal({
  isOpen,
  onClose,
}: ViewCategoryModalProps) {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get("id");

  const { data: response, isLoading } = useViewCategoryById(categoryId || "");
  const categoryData = response?.data;

  const handleClose = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Category Details"
        backdrop="blur"
        size="2xl"
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      </Dialog>
    );
  }

  if (!categoryData) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Category Details"
        backdrop="blur"
        size="2xl"
      >
        <div className="text-center py-8">
          <p className="text-gray-500">Category not found</p>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Category Details"
      backdrop="blur"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Category Header */}
        <div className="border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {categoryData.name}
          </h2>
          <div className="flex items-center gap-4">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                categoryData.isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {categoryData.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Category Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">
                  {formatDate(categoryData.createdAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">
                  {formatDate(categoryData.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

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
