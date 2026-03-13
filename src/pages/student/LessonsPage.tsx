import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import BreadCrumbs from "../../components/common/BreadCrumbs";
import { IoMdDownload } from "react-icons/io";

import { FaCheck, FaDownload, FaExclamationCircle } from "react-icons/fa";
import LessonsPageSkeleton from "../../components/skeleton/LessonPageSkeleton";
import {
  useGetLessonBySectionCode,
  useUpdateLessonProgress,
} from "../../hooks/useLesson";
import { useAuth } from "../../context/AuthContext";

const contentTypes = {
  video: ["mp4"],
  office: ["pptx", "ppt", "doc", "docx", "xlsx", "xls"],
  pdf: ["pdf"],
  youtube: ["youtube.com", "youtu.be"],
};

const getContentType = (url: string): string | null => {
  const lowerUrl = url.toLowerCase();
  if (contentTypes.video.some((ext) => lowerUrl.endsWith(`.${ext}`)))
    return "video";
  if (contentTypes.pdf.some((ext) => lowerUrl.endsWith(`.${ext}`)))
    return "pdf";
  if (contentTypes.office.some((ext) => lowerUrl.endsWith(`.${ext}`)))
    return "office";
  if (contentTypes.youtube.some((domain) => lowerUrl.includes(domain)))
    return "youtube";
  return null;
};

const getYouTubeEmbedUrl = (url: string): string => {
  let videoId = "";
  if (url.includes("youtube.com/watch")) {
    const urlParams = new URLSearchParams(new URL(url).search);
    videoId = urlParams.get("v") || "";
  } else if (url.includes("youtu.be")) {
    videoId = url.split("/").pop()?.split("?")[0] || "";
  }
  return `https://www.youtube.com/embed/${videoId}`;
};

const getOfficeViewerUrl = (url: string) => {
  // Microsoft Office Online Viewer is more reliable than Google Docs Viewer
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    url,
  )}`;
};

const getInitials = (firstName: string, lastName: string): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export default function LessonsPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const pathList = location.pathname.split("/");
  const sectionCode = pathList[4];
  const lessonId = pathList.pop() || "";
  const moduleId = searchParams.get("module") || "";
  const { currentUser } = useAuth();
  const userId = currentUser?.user?.id;
  const { data, isPending } = useGetLessonBySectionCode(
    sectionCode,
    lessonId,
    moduleId,
  );
  const { mutate: updateProgress, isPending: isUpdating } =
    useUpdateLessonProgress();

  const lesson = data?.sections?.[0]?.modules?.[0]?.lessons?.[0];
  const progressEntry = lesson?.progress?.find(
    (p: { userId: string }) => p.userId === userId,
  );
  const progressStatus = progressEntry?.status || "not-started";

  useEffect(() => {
    if (lesson && progressStatus === "not-started") {
      updateProgress({ lessonId, status: "in-progress" });
    }
  }, [lesson?._id]);

  if (isPending) return <LessonsPageSkeleton />;

  const { instructor } = data.sections[0];
  const mainContent = lesson.mainContent;
  const contentType = mainContent ? getContentType(mainContent) : null;
  const isFullHeight = contentType !== null;

  const renderContent = () => {
    if (!mainContent) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
          <FaExclamationCircle className="h-10 w-10 text-gray-400" />
          <p>No content available</p>
        </div>
      );
    }

    switch (contentType) {
      case "youtube":
        return (
          <iframe
            className="h-full w-full"
            src={getYouTubeEmbedUrl(mainContent)}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      case "video":
        return (
          <video
            className="h-full w-full object-cover"
            src={mainContent}
            controls
            title={lesson.title}
          />
        );
      case "pdf":
        return (
          <iframe
            className="h-full w-full"
            src={mainContent}
            title={lesson.title}
          />
        );
      case "office":
        return (
          <iframe
            className="h-full w-full"
            src={getOfficeViewerUrl(mainContent)}
            title={lesson.title}
            allowFullScreen
          />
        );
      default:
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
            <p>Unsupported file format</p>
            <a
              href={mainContent}
              download
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-primary hover:underline"
            >
              <IoMdDownload className="h-5 w-5" />
              Download File
            </a>
          </div>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:px-8 md:py-10">
      {location.state && (
        <BreadCrumbs
          items={[
            { name: location.state.previousPage, path: location.state.path },
          ]}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{lesson.title}</h1>
        <div className="flex items-center gap-3">
          {progressStatus === "completed" ? (
            <span className="flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-700">
              <FaCheck className="h-4 w-4" /> Completed
            </span>
          ) : (
            <button
              onClick={() => updateProgress({ lessonId, status: "completed" })}
              disabled={isUpdating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Mark as Complete"}
            </button>
          )}
          {mainContent && contentType !== "youtube" && (
            <a
              href={mainContent}
              download
              className="flex items-center gap-2 rounded-lg p-2 text-gray-600  hover:bg-gray-100 text-sm"
              title="Download main content"
            >
              <IoMdDownload className="h-5 w-5" /> Download
            </a>
          )}
        </div>
      </div>

      <div
        className={`mt-6 w-full overflow-hidden rounded-lg bg-gray-100 ${
          isFullHeight ? "h-[300px] md:h-[600px]" : "h-[200px]"
        }`}
      >
        {renderContent()}
      </div>

      <div className="mt-6 flex gap-4 rounded-lg border bg-white p-4 md:p-6">
        <div className="flex-1 space-y-4 rounded-lg bg-gray-100 p-2 shadow-md md:p-6">
          <div className="flex items-center space-x-3">
            {instructor.avatar ? (
              <img
                src={instructor.avatar}
                alt="Professor"
                className="h-10 w-10 rounded-full"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 font-medium text-gray-600">
                {getInitials(instructor.firstName, instructor.lastName)}
              </div>
            )}
            <div className="font-medium">
              {instructor.firstName} {instructor.lastName}
            </div>
          </div>
          <p className="text-gray-600">{lesson.description}</p>
          {lesson.files?.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-1 font-semibold">Additional Files:</h3>
              <div className="flex flex-wrap gap-4">
                {lesson.files.map((fileUrl: string, index: number) => (
                  <a
                    key={index}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-28 flex-col items-center gap-3 rounded-lg bg-gray-200 py-2 shadow-sm hover:bg-gray-300 md:w-40"
                  >
                    <FaDownload className="h-4 w-4 text-gray-600 md:h-6 md:w-6" />
                    <span
                      className="max-w-[80%] truncate text-xs font-medium text-gray-800"
                      title={
                        fileUrl
                          ? decodeURIComponent(
                              fileUrl.split("/").pop() || "File",
                            )
                          : "File"
                      }
                    >
                      {fileUrl
                        ? decodeURIComponent(fileUrl.split("/").pop() || "File")
                        : "File"}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
