import { FaUserGraduate, FaClock } from "react-icons/fa";
import { SiGoogleclassroom } from "react-icons/si";
import { MdImage } from "react-icons/md";
import { formatDate } from "../../lib/dateUtils";

interface SectionCardProps {
  code: string;
  name: string;
  course: {
    _id: string;
    thumbnail?: string;
  } | null;
  instructor?: string;
  status: string;
  updatedAt?: string;
  onClick?: () => void;
  progress?: {
    percent: number;
    completedLessons: number;
    totalLessons: number;
    completedAssessments?: number;
    totalAssessments?: number;
  };
}

const SectionCard = ({
  code,
  name,
  course,
  status,
  updatedAt,
  onClick,
  instructor,
  progress,
}: SectionCardProps) => {
  const truncateText = (text: string, maxLength: number) =>
    text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;

  const sectionName = name || "Untitled Section";
  const displayName = truncateText(sectionName, 70);
  const displayCode = truncateText(code, 24);
  const displayInstructor = instructor ? truncateText(instructor, 34) : "";

  const resolvedProgress = progress ?? {
    percent: 0,
    completedLessons: 0,
    totalLessons: 0,
    completedAssessments: 0,
    totalAssessments: 0,
  };
  const totalItems =
    (resolvedProgress.totalLessons || 0) +
    (resolvedProgress.totalAssessments || 0);

  return (
    <div
      className="flex flex-col w-full bg-white rounded-lg transition-shadow cursor-pointer border shadow-md hover:shadow-lg"
      onClick={onClick}
    >
      {/* Image section */}
      <div className="h-[200px] w-full overflow-hidden rounded-t-lg relative group">
        {course?.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={name || "Section"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <MdImage className="text-gray-400 w-16 h-16" />
          </div>
        )}
      </div>

      {/* Content section */}
      <div className="flex flex-col justify-between p-4 flex-1">
        <h3
          className="text-lg font-semibold text-gray-800 mb-3 leading-snug min-h-[3.5rem]"
          title={sectionName}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {displayName}
        </h3>

        <div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <SiGoogleclassroom className="text-primary" />
              <span className="text-gray-500 w-24 shrink-0">Code:</span>
              <span className="text-gray-700 font-bold truncate flex-1 min-w-0">
                {displayCode}
              </span>
            </div>

            {instructor && (
              <div className="flex items-center gap-2 min-w-0">
                <FaUserGraduate className="text-accent" />
                <span className="text-gray-500 w-24 shrink-0">Instructor:</span>
                <span className="text-gray-700 font-bold truncate flex-1 min-w-0">
                  {displayInstructor}
                </span>
              </div>
            )}

            {updatedAt && (
              <div className="flex items-center gap-2 min-w-0">
                <FaClock className="text-p" />
                <span className="text-gray-500 w-24 shrink-0">Last Updated:</span>
                <span className="text-gray-700 font-bold truncate flex-1 min-w-0">
                  {formatDate(updatedAt)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mb-2 text-sm mt-2">
            <span className="text-gray-500">Status: </span>
            <span
              className={`font-bold ${
                status === "ongoing"
                  ? "text-green-600"
                  : status === "upcoming"
                    ? "text-blue-600"
                    : "text-gray-600"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>

          {resolvedProgress && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Progress</span>
                <span className="text-xs font-semibold text-gray-700">
                  {resolvedProgress.percent}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    resolvedProgress.percent === 0
                      ? "bg-gray-300"
                      : resolvedProgress.percent < 50
                        ? "bg-orange-500"
                        : resolvedProgress.percent < 100
                          ? "bg-blue-500"
                          : "bg-green-500"
                  }`}
                  style={{ width: `${resolvedProgress.percent}%` }}
                />
              </div>
              {totalItems > 0 ? (
                <p className="text-[10px] text-gray-400 mt-1">
                  {resolvedProgress.completedLessons} of {resolvedProgress.totalLessons} lessons
                  {(resolvedProgress.totalAssessments ?? 0) > 0 &&
                    ` - ${resolvedProgress.completedAssessments} of ${resolvedProgress.totalAssessments} assessments`}
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 mt-1">
                  No lessons or assessments yet
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SectionCard;

