import { BsPlayCircle } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import Accordion from "../../components/common/Accordion";
import { IModule } from "../../types/interfaces";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import InstructorTableEmptyState from "../../components/instructor/InstructorTableEmptyState";
import { useAuth } from "../../context/AuthContext";
import { useSectionModule, useSectionAssessment } from "../../hooks/useSection";
import { useStudentCompletedAssessments } from "../../hooks/useStudentAssessmentGrade";
import ModuleTabSkeleton from "../../components/skeleton/ModuleTabSkeleton";

interface ModuleTabProps {
  sectionCode: string;
}

export default function ModuleTab({ sectionCode }: ModuleTabProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { data, isPending } = useSectionModule(sectionCode);
  const modules = data?.modules.data;
  const userId = currentUser.user.id;
  const isStudent = currentUser.user.role === "student";

  // Assessment progress (student only)
  const { data: assessmentData } = useSectionAssessment(
    isStudent ? sectionCode : "",
  );
  useStudentCompletedAssessments(isStudent ? userId : "");
  const totalAssessments = assessmentData?.data?.totalAssessments || 0;
  const completedAssessments = totalAssessments
    ? totalAssessments - (assessmentData?.data?.pendingAssessment || 0)
    : 0;

  // Compute real progress from lesson.progress data
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

  // Render skeleton while data is pending
  if (isPending) {
    return <ModuleTabSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress Section */}
      {isStudent && (
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
              ` · ${completedAssessments} of ${totalAssessments} assessments`}
          </p>
        </div>
      )}

      {modules?.length > 0 ? (
        <div className="space-y-3">
          {modules.map((module: IModule) => {
            // Compute real per-module progress
            const publishedLessons = module.lessons.filter(
              (l) => l.status === "published",
            );
            const moduleCompleted = publishedLessons.filter((l) =>
              (l.progress || []).some(
                (p) =>
                  p.userId?.toString() === userId && p.status === "completed",
              ),
            ).length;

            const isInstructor = currentUser.user.role === "instructor";

            return (
              <Accordion
                key={module._id}
                title={module.title}
                subtitle=""
                actionButton={
                  <div className="flex flex-col gap-1 mr-4 justify-center min-w-[120px]">
                    <div className="flex justify-end items-center text-xs text-gray-500 mb-0.5">
                      <span className="font-medium text-gray-600">
                        {isInstructor
                          ? `${module.lessons.length} lessons`
                          : `${moduleCompleted} / ${publishedLessons.length}`}
                      </span>
                    </div>
                  </div>
                }
                defaultExpanded={true}
              >
                {module.lessons.map(
                  (lesson) =>
                    lesson.status === "published" && (
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
                        className="flex items-center justify-between md:px-12 p-4 bg-white hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0 border-gray-50"
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
                    ),
                )}
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
            {currentUser.user.role === "instructor" ? (
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
  );
}
