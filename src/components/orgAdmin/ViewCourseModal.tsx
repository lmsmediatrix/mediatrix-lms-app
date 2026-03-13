import { useSearchParams } from "react-router-dom";

import { useViewCourseById } from "../../hooks/useCourse";
import { formatDate } from "../../lib/dateUtils";
import { FaGraduationCap, FaLanguage, FaCalendarAlt } from "react-icons/fa";
import Dialog from "../common/Dialog";
import Button from "../common/Button";

interface ViewCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ViewCourseModal({
  isOpen,
  onClose,
}: ViewCourseModalProps) {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("id");

  const { data: response, isLoading } = useViewCourseById(courseId || "");
  const courseData = response?.data;

  const handleClose = () => {
    onClose();
  };

  // Show loading state
  if (isLoading) {
    return (
      <Dialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Course Details"
        backdrop="blur"
        size="full"
        contentClassName="w-full md:w-[45vw] md:min-w-[500px] max-w-[900px]"
      >
        <div className="space-y-6 animate-pulse">
          {/* Thumbnail Skeleton */}
          <div className="w-full h-48 bg-gray-200 rounded-lg"></div>

          {/* Title Skeleton */}
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>

          {/* Description Skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>

          {/* Details Skeleton */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Dialog>
    );
  }

  if (!courseData) {
    return null;
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Course Details"
      backdrop="blur"
      size="full"
      contentClassName="w-full md:w-[45vw] md:min-w-[500px] max-w-[900px]"
    >
      <div className="space-y-6">
        {/* Course Thumbnail */}
        {courseData.thumbnail && (
          <div className="w-full h-48 overflow-hidden rounded-lg">
            <img
              src={courseData.thumbnail}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Course Title and Code */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {courseData.title}
          </h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium whitespace-nowrap">
              Code: {courseData.code}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                courseData.status === "published"
                  ? "bg-green-100 text-green-800"
                  : courseData.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {courseData.status.charAt(0).toUpperCase() +
                courseData.status.slice(1)}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium whitespace-nowrap">
              {courseData.category?.name}
            </span>
          </div>
        </div>

        {/* Course Description */}
        {courseData.description && (
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Description
            </h3>
            <p className="text-gray-600">{courseData.description}</p>
          </div>
        )}

        {/* Course Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-gray-700">
            <FaGraduationCap className="text-primary" size={20} />
            <span className="font-medium">Level:</span>
            <span>
              {courseData.level.charAt(0).toUpperCase() +
                courseData.level.slice(1)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <FaLanguage className="text-primary" size={20} />
            <span className="font-medium">Language:</span>
            <span>{courseData.language}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <FaCalendarAlt className="text-primary" size={20} />
            <span className="font-medium">Created:</span>
            <span>{formatDate(courseData.createdAt)}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <FaCalendarAlt className="text-primary" size={20} />
            <span className="font-medium">Last Updated:</span>
            <span>{formatDate(courseData.updatedAt)}</span>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleClose} variant="cancel">
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
