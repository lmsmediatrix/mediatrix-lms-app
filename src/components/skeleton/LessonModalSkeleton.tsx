import Dialog from "../common/Dialog";
interface LessonModalSkeletonProps {
  isOpen: boolean;
  onClose: () => void;
}
export default function LessonModalSkeleton({
  isOpen,
  onClose,
}: LessonModalSkeletonProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Loading..."
      size="full"
      backdrop="blur"
      contentClassName="w-full sm:w-[90vw] lg:w-[55vw] max-w-[90vw] lg:max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <div className="space-y-6 w-full animate-pulse">
        {/* File Upload Section Skeleton */}
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col items-center">
                <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>

        {/* Form Grid Skeleton */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="flex flex-col md:flex-row justify-end gap-3">
          <div className="h-10 bg-gray-200 rounded w-full md:w-24"></div>
          <div className="h-10 bg-gray-200 rounded w-full md:w-32"></div>
        </div>
      </div>
    </Dialog>
  );
}
