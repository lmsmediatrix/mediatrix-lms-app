import { BsPlayCircle } from "react-icons/bs";
import { GrAnnounce } from "react-icons/gr";
import { IoSync } from "react-icons/io5";
import { FaLightbulb } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Accordion from "../../components/common/Accordion";
import { IModule } from "../../types/interfaces";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import InstructorTableEmptyState from "../../components/instructor/InstructorTableEmptyState";
import { useAuth } from "../../context/AuthContext";
import { useSectionModule, useSectionAssessment } from "../../hooks/useSection";
import { useStudentCompletedAssessments } from "../../hooks/useStudentAssessmentGrade";
import ModuleTabSkeleton from "../../components/skeleton/ModuleTabSkeleton";
import { useModuleAssessmentDraft } from "../../hooks/useModule";
import { toast } from "react-toastify";
import Dialog from "../../components/common/Dialog";
import Button from "../../components/common/Button";
import CreateAssessmentModal from "../../components/instructor/CreateAssessmentModal";

interface ModuleTabProps {
  sectionCode: string;
  sectionId?: string;
  sectionName?: string;
}

export default function ModuleTab({
  sectionCode,
  sectionId,
  sectionName,
}: ModuleTabProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data, isPending } = useSectionModule(sectionCode);
  const moduleAssessmentDraft = useModuleAssessmentDraft();
  const [moduleToSync, setModuleToSync] = useState<IModule | null>(null);
  const [prefillAssessment, setPrefillAssessment] = useState<any>(null);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const modules = data?.modules.data;
  const userId = currentUser.user.id;
  const isLearner =
    currentUser.user.role === "student" || currentUser.user.role === "employee";
  const isInstructor = currentUser.user.role === "instructor";

  const { data: assessmentData } = useSectionAssessment(
    isLearner ? sectionCode : "",
  );
  useStudentCompletedAssessments(isLearner ? userId : "");
  const totalAssessments = assessmentData?.data?.totalAssessments || 0;
  const completedAssessments = totalAssessments
    ? totalAssessments - (assessmentData?.data?.pendingAssessment || 0)
    : 0;

  const { totalLessons, completedLessons } = (modules || []).reduce(
    (acc: { totalLessons: number; completedLessons: number }, mod: IModule) => {
      const publishedLessons = mod.lessons.filter(
        (l) => l.status === "published",
      );
      acc.totalLessons += publishedLessons.length;
      acc.completedLessons += publishedLessons.filter((l) =>
        (l.progress || []).some(
          (p) => p.userId?.toString() === userId && p.status === "completed",
        ),
      ).length;
      return acc;
    },
    { totalLessons: 0, completedLessons: 0 },
  );

  const totalItems = totalLessons + totalAssessments;
  const completedItems = completedLessons + completedAssessments;
  const overallPercent =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const getProgressMessage = (pct: number) => {
    if (pct === 0) return "Start your first lesson to track your progress!";
    if (pct < 25) return "You've just started. Keep going!";
    if (pct < 50) return "You're making good progress! Keep it up.";
    if (pct < 75) return "You're more than halfway there!";
    if (pct < 100) return "Almost done! Just a little more to go.";
    return "Congratulations! You've completed everything!";
  };

  const onGenerateModuleAssessmentDraft = (moduleId: string) => {
    toast.promise(
      moduleAssessmentDraft.mutateAsync(moduleId).then((response: any) => {
        setModuleToSync(null);
        setPrefillAssessment(response?.data || null);
        setIsAssessmentModalOpen(true);
        return response;
      }),
      {
        pending: "Preparing module assessment...",
        success: "Assessment draft is ready",
        error: "Failed to build module assessment draft",
      },
    );
  };

  const handleCloseSyncDialog = () => {
    if (moduleAssessmentDraft.isPending) return;
    setModuleToSync(null);
  };

  const handleModuleAssessmentClick = (assessmentId: string) => {
    if (isInstructor) {
      navigate(`assessment/${assessmentId}`);
      return;
    }

    navigate(`${location.pathname}?tab=assessments&id=${assessmentId}`);
  };

  if (isPending) {
    return <ModuleTabSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        {isLearner && (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Course Progress
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
              <span className="text-sm font-bold text-primary min-w-[3rem]">
                {overallPercent}%
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {getProgressMessage(overallPercent)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {completedLessons} of {totalLessons} lessons
              {totalAssessments > 0 &&
                ` - ${completedAssessments} of ${totalAssessments} assessments`}
            </p>
          </div>
        )}

        {modules?.length > 0 ? (
          <div className="space-y-3">
            {modules.map((module: IModule) => {
              const publishedLessons = module.lessons.filter(
                (l) => l.status === "published",
              );
              const moduleAssessments = Array.isArray(module.assessments)
                ? module.assessments
                : [];
              const moduleCompleted = publishedLessons.filter((l) =>
                (l.progress || []).some(
                  (p) =>
                    p.userId?.toString() === userId && p.status === "completed",
                ),
              ).length;

              return (
                <Accordion
                  key={module._id}
                  title={module.title}
                  subtitle=""
                  actionButton={
                    <div className="flex items-center gap-2 mr-3 md:mr-4">
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {isInstructor
                          ? `${module.lessons.length} ${module.lessons.length === 1 ? "lesson" : "lessons"}`
                          : `${moduleCompleted} / ${publishedLessons.length}`}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600">
                        {moduleAssessments.length}{" "}
                        {moduleAssessments.length === 1
                          ? "assessment"
                          : "assessments"}
                      </span>
                      {isInstructor && (
                        <button
                          onClick={() => setModuleToSync(module)}
                          disabled={moduleAssessmentDraft.isPending}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm transition-all hover:border-primary hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <IoSync className="text-sm" />
                          <span className="hidden sm:inline">
                            Module Assessment
                          </span>
                          <span className="sm:hidden">Sync</span>
                        </button>
                      )}
                    </div>
                  }
                  defaultExpanded={true}
                >
                  <div>
                    {publishedLessons.map((lesson) => (
                      <div
                        key={lesson._id}
                        onClick={() =>
                          navigate(
                            `lessons/${lesson._id}?module=${module._id}`,
                            {
                              state: {
                                previousPage: module.title,
                                path: location.pathname,
                              },
                            },
                          )
                        }
                        className="flex items-center justify-between md:px-12 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <BsPlayCircle className="text-blue-600 text-lg hidden md:block" />
                          <span className="text-sm text-gray-700 font-medium">
                            {lesson.title}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
                          {formatDateMMMDDYYY(lesson.endDate)}
                        </span>
                      </div>
                    ))}

                    <div className="border-t border-gray-100 bg-slate-50/50">
                      <div className="px-4 md:px-12 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Module Assessments
                      </div>
                      {moduleAssessments.length > 0 ? (
                        moduleAssessments.map((assessment) => (
                          <div
                            key={assessment._id}
                            onClick={() =>
                              handleModuleAssessmentClick(assessment._id)
                            }
                            className="flex items-center justify-between md:px-12 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <GrAnnounce className="text-primary text-base hidden md:block" />
                              <div className="min-w-0">
                                <p className="text-sm text-gray-800 font-medium truncate">
                                  {assessment.title}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  {assessment.type}
                                  {assessment.assessmentNo
                                    ? ` ${assessment.assessmentNo}`
                                    : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded shrink-0">
                              {assessment.endDate
                                ? formatDateMMMDDYYY(assessment.endDate)
                                : "No due date"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 md:px-12 pb-4 text-sm text-gray-500">
                          No module assessments yet.
                        </div>
                      )}
                    </div>
                  </div>
                </Accordion>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="border-b px-4 py-3 bg-gray-50/50">
              <h3 className="text-lg font-medium text-gray-700">Modules</h3>
            </div>
            <div className="p-8">
              {isInstructor ? (
                <InstructorTableEmptyState
                  title="Create Your First Module"
                  description="Start by creating a module. Modules help you organize your course content into logical sections."
                  primaryActionLabel="Add Module"
                  primaryActionPath="manage?tab=modules&modal=create-module"
                  type="module"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="bg-gray-50 p-4 rounded-full mb-3">
                    <BsPlayCircle className="text-gray-300 text-2xl" />
                  </div>
                  <h3 className="text-gray-900 font-medium mb-1">
                    No modules yet
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Modules will appear here once published.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog
        isOpen={!!moduleToSync}
        onClose={handleCloseSyncDialog}
        title="Sync Module Assessments"
        size="md"
        backdrop="blur"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Create a module assessment draft for{" "}
            <span className="font-semibold text-gray-900">
              {moduleToSync?.title || "this module"}
            </span>
            ?
          </p>
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
            <FaLightbulb className="mt-0.5 text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800">
              This will copy and merge questions from all lesson assessments in
              this module. You can edit the title, add more questions, and save
              it as a new assessment.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              onClick={handleCloseSyncDialog}
              variant="cancel"
              className="rounded-full px-5 py-2"
              disabled={moduleAssessmentDraft.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                moduleToSync &&
                onGenerateModuleAssessmentDraft(moduleToSync._id)
              }
              variant="primary"
              className="rounded-full px-5 py-2 shadow-sm"
              isLoading={moduleAssessmentDraft.isPending}
              isLoadingText="Preparing..."
            >
              Continue
            </Button>
          </div>
        </div>
      </Dialog>

      {isAssessmentModalOpen && (
        <CreateAssessmentModal
          isOpen={isAssessmentModalOpen}
          onClose={() => {
            setIsAssessmentModalOpen(false);
            setPrefillAssessment(null);
          }}
          sectionName={sectionName}
          sectionIdOverride={prefillAssessment?.sectionId || sectionId}
          prefillData={prefillAssessment}
        />
      )}
    </>
  );
}
