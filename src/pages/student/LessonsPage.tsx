import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import BreadCrumbs from "../../components/common/BreadCrumbs";
import { IoMdDownload } from "react-icons/io";

import { FaCheck, FaDownload, FaExclamationCircle } from "react-icons/fa";
import LessonsPageSkeleton from "../../components/skeleton/LessonPageSkeleton";
import {
  useGetLessonBySectionCode,
  useUpdateLessonProgress,
} from "../../hooks/useLesson";
import { useSectionModule } from "../../hooks/useSection";
import { useAuth } from "../../context/AuthContext";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import CreateAssessmentModal from "../../components/instructor/CreateAssessmentModal";
import { useGenerateCertificate, useStudentCertificates } from "../../hooks/useCertificate";
import { toast } from "react-toastify";

const contentTypes = {
  video: ["mp4"],
  office: ["pptx", "ppt", "doc", "docx", "xlsx", "xls"],
  pdf: ["pdf"],
  youtube: ["youtube.com", "youtu.be"],
};

type LessonMainContentType = "video" | "office" | "pdf" | "youtube" | "url" | "rich-text" | null;

const hasHtmlTags = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);
const isHttpUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

const getContentType = (value: string): LessonMainContentType => {
  const trimmedValue = value.trim();
  if (!trimmedValue) return null;

  if (hasHtmlTags(trimmedValue) || !isHttpUrl(trimmedValue)) {
    return "rich-text";
  }

  const lowerUrl = trimmedValue.toLowerCase();
  const normalizedUrl = lowerUrl.split("?")[0];

  if (contentTypes.video.some((ext) => normalizedUrl.endsWith(`.${ext}`)))
    return "video";
  if (contentTypes.pdf.some((ext) => normalizedUrl.endsWith(`.${ext}`)))
    return "pdf";
  if (contentTypes.office.some((ext) => normalizedUrl.endsWith(`.${ext}`)))
    return "office";
  if (contentTypes.youtube.some((domain) => lowerUrl.includes(domain)))
    return "youtube";

  return "url";
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

interface ILessonAssessment {
  _id: string;
  title: string;
  type: string;
  assessmentNo?: number;
  endDate?: string;
  numberOfItems?: number;
  totalPoints?: number;
}

export default function LessonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pathList = location.pathname.split("/");
  const sectionCode = pathList[4];
  const lessonId = pathList.pop() || "";
  const moduleId = searchParams.get("module") || "";
  const { currentUser } = useAuth();
  const role = currentUser?.user?.role;
  const orgCode = currentUser?.user?.organization?.code;
  const isInstructor = role === "instructor";
  const isStudent = role === "student";
  const modal = searchParams.get("modal");
  const userId = currentUser?.user?.id;
  const { data, isPending } = useGetLessonBySectionCode(
    sectionCode,
    lessonId,
    moduleId,
  );
  const { data: moduleData } = useSectionModule(sectionCode);
  const { mutate: updateProgress, isPending: isUpdating } =
    useUpdateLessonProgress();
  const generateCertificateMutation = useGenerateCertificate();

  const section = data?.sections?.[0];
  const lesson = section?.modules?.[0]?.lessons?.[0];
  const lessonAssessments: ILessonAssessment[] = Array.isArray(lesson?.assessments)
    ? lesson.assessments
    : [];
  const progressEntry = lesson?.progress?.find(
    (p: { userId: string }) => p.userId === userId,
  );
  const progressStatus = progressEntry?.status || "not-started";
  const currentModule = useMemo(
    () =>
      moduleData?.modules?.data?.find(
        (module: { _id: string }) => module._id === moduleId,
      ),
    [moduleData?.modules?.data, moduleId],
  );
  const moduleLessons = currentModule?.lessons || [];
  const modulePublishedLessons = moduleLessons.filter(
    (l: { status: string }) => l.status === "published",
  );
  const isModuleCompleted =
    modulePublishedLessons.length > 0 &&
    modulePublishedLessons.every((l: any) =>
      (l.progress || []).some(
        (p: { userId: string; status: string }) =>
          p.userId === userId && p.status === "completed",
      ),
    );
  const certificateEnabled = !!currentModule?.certificateEnabled;
  const {
    data: studentCertificates,
    isPending: isCertificateLoading,
    isError: isCertificateLoadError,
  } = useStudentCertificates(userId || "", {
    moduleId,
    enabled: isStudent && !!userId && !!moduleId && isModuleCompleted && certificateEnabled,
  });
  const moduleCertificate = studentCertificates?.data?.[0];

  useEffect(() => {
    if (isStudent && lesson && progressStatus === "not-started") {
      updateProgress({ lessonId, status: "in-progress" });
    }
  }, [isStudent, lesson?._id, progressStatus, lessonId, updateProgress]);

  if (isPending) return <LessonsPageSkeleton />;

  if (!section || !lesson) {
    return (
      <div className="mx-auto max-w-7xl p-6 text-gray-600">
        Lesson not found.
      </div>
    );
  }

  const { instructor } = section;
  const mainContent = lesson.mainContent;
  const contentType = mainContent ? getContentType(mainContent) : null;
  const isMediaContent = Boolean(contentType && contentType !== "rich-text");
  const canDownloadMainContent =
    contentType === "video" ||
    contentType === "pdf" ||
    contentType === "office" ||
    contentType === "url";

  const openAddAssessmentModal = () => {
    if (!section?._id || !lesson?._id) return;
    const params = new URLSearchParams(searchParams);
    params.set("modal", "create-assessment");
    params.set("sectionId", section._id);
    params.set("lessonId", lesson._id);
    setSearchParams(params);
  };

  const closeAddAssessmentModal = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("modal");
    params.delete("assessmentId");
    params.delete("sectionId");
    params.delete("lessonId");
    setSearchParams(params);
  };

  const openAssessment = (assessmentId: string) => {
    if (!orgCode || !role) return;
    navigate(`/${orgCode}/${role}/sections/${sectionCode}/assessment/${assessmentId}`);
  };

  const onGenerateCertificate = async () => {
    if (!userId || !moduleId || !section?._id) return;
    await toast.promise(
      generateCertificateMutation.mutateAsync({
        studentId: userId,
        moduleId,
        sectionId: section._id,
      }),
      {
        pending: "Generating certificate...",
        success: "Certificate is ready",
        error: "Failed to generate certificate",
      },
    );
  };

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
      case "rich-text":
        return (
          <article
            className="lesson-rich-text p-4 md:p-6"
            dangerouslySetInnerHTML={{ __html: mainContent }}
          />
        );
      case "url":
        return (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-gray-500">
            <p>Main content is available as a download link.</p>
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
          {isStudent &&
            (progressStatus === "completed" ? (
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
            ))}
          {isStudent &&
            progressStatus === "completed" &&
            certificateEnabled &&
            isModuleCompleted && (
              <>
                {isCertificateLoading ? (
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
                    Checking certificate...
                  </span>
                ) : moduleCertificate ? (
                  <span className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700">
                    Certificate: {moduleCertificate.certificateNo}
                  </span>
                ) : (
                  <button
                    onClick={onGenerateCertificate}
                    disabled={generateCertificateMutation.isPending}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {generateCertificateMutation.isPending
                      ? "Generating..."
                      : "Generate Certificate"}
                  </button>
                )}
              </>
            )}
          {isStudent &&
            progressStatus === "completed" &&
            certificateEnabled &&
            isModuleCompleted &&
            isCertificateLoadError && (
              <span className="rounded-lg bg-red-100 px-3 py-2 text-xs text-red-700">
                Unable to load certificate status
              </span>
            )}
          {isInstructor && (
            <button
              onClick={openAddAssessmentModal}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              Add Assessment
            </button>
          )}
          {mainContent && canDownloadMainContent && (
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

      {mainContent ? (
        <div
          className={`mt-6 w-full overflow-hidden rounded-lg bg-gray-100 ${
            isMediaContent ? "h-[300px] md:h-[600px]" : "min-h-[220px]"
          }`}
        >
          {renderContent()}
        </div>
      ) : !lesson.information ? (
        <div className="mt-6 flex min-h-[220px] items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          No content available
        </div>
      ) : null}

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
          {lesson.information && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="mb-2 font-semibold text-gray-800">Reading Content</h3>
              <article
                className="lesson-rich-text"
                dangerouslySetInnerHTML={{ __html: lesson.information }}
              />
            </div>
          )}
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
          <div className="mt-4 border-t border-gray-200 pt-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Assessments</h3>
              <span className="text-xs text-gray-500">
                {lessonAssessments.length} linked
              </span>
            </div>
            {lessonAssessments.length === 0 ? (
              <p className="text-sm text-gray-500">
                No assessments linked to this lesson yet.
              </p>
            ) : (
              <div className="space-y-2">
                {lessonAssessments.map((assessment: ILessonAssessment) => (
                  <button
                    key={assessment._id}
                    type="button"
                    onClick={() => openAssessment(assessment._id)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="line-clamp-1 font-medium text-gray-800">
                        {assessment.title}
                      </p>
                      <span className="text-xs capitalize text-primary">
                        {assessment.type}
                        {assessment.assessmentNo ? ` ${assessment.assessmentNo}` : ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {assessment.numberOfItems || 0} questions |{" "}
                      {assessment.totalPoints || 0} pts
                      {assessment.endDate
                        ? ` | Due ${formatDateMMMDDYYY(assessment.endDate)}`
                        : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isInstructor && modal === "create-assessment" && (
        <CreateAssessmentModal
          isOpen={true}
          onClose={closeAddAssessmentModal}
          sectionName={section.name}
        />
      )}
    </div>
  );
}
