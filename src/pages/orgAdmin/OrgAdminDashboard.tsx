import { PlusIcon } from "@/components/ui/plus-icon";
import { UserIcon } from "@/components/ui/user-icon";
import { UsersIcon } from "@/components/ui/users-icon";
import { BookOpenIcon } from "@/components/ui/book-open-icon";
import { LayoutGridIcon } from "@/components/ui/layout-grid-icon";
import Button from "../../components/common/Button";
import DashboardHeader from "../../components/common/DashboardHeader";
import StatCard from "../../components/common/StatCard";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import SectionStatus from "../../components/orgAdmin/SectionStatus";
import SectionChart from "../../components/orgAdmin/SectionChart";
import DashboardStatCard from "../../components/orgAdmin/DashboardStatCard";
import {
  useGetAdminDashboard,
  useGetSectionChartData,
} from "../../hooks/useMetrics";
import { useAdminCompletionOverview } from "../../hooks/useSection";
import OrgAdminDashboardSkeleton from "../../components/skeleton/OrgAdminDashboardSkeleton";
import { useGetAllCourses } from "../../hooks/useCourse";
import { useMemo, useState } from "react";
import { ICourse } from "../../types/interfaces";
import SectionAnalyticsSkeleton from "../../components/skeleton/SectionAnalyticsSkeleton";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";

const iconMap = {
  FaBook: BookOpenIcon,
  FaUserTie: UserIcon,
  FaUserGraduate: UsersIcon,
  FaThLarge: LayoutGridIcon,
};

type DashboardStatRoute = "course" | "instructor" | "student" | "section";

type DashboardApiResponse = {
  organizationMetrics: {
    instructorsToAssign: number;
    coursesToAssign: {
      courses: {
        _id: string;
        title: string;
        description: string;
        code: string;
      }[];
      total: number;
    };
  };
  courseMetrics: {
    totalCourseCount: { total: number }[];
    courseCountPerCategory: { total: number; category: string }[];
  };
  userMetrics: {
    totalInstructorCount: { total: number }[];
    totalStudentCount: { total: number }[];
    instructorCountPerFaculty: { total: number; faculty: string }[];
    studentCountPerProgram: { total: number; program: string }[];
  };
  sectionMetrics: {
    totalSectionCount: { total: number }[];
    studentsPerSectionCount: { _id: string; section: string; total: number }[];
    sectionPerStatusCount: { total: number; status: string }[];
  };
};

type SectionChartApiResponse = {
  totalSectionCount: { total: number }[];
  studentsPerSectionCount: { _id: string; section: string; total: number }[];
  sectionPerStatusCount: { total: number; status: string }[];
}[];

type LessonProgressEntry = {
  userId?: string;
  status?: string;
};

type CompletionLesson = {
  _id: string;
  title?: string;
  progress?: LessonProgressEntry[];
};

type CompletionModule = {
  _id: string;
  title?: string;
  lessons?: CompletionLesson[];
};

type CompletionSection = {
  _id: string;
  code?: string;
  name?: string;
  instructor?: { _id?: string; firstName?: string; lastName?: string } | null;
  students?: Array<{ _id?: string }>;
  modules?: CompletionModule[];
};

type ModernChartCardProps = {
  label: string;
  percent: number;
  detail: string;
  color?: string;
};

function ModernChartCard({
  label,
  percent,
  detail,
  color,
}: ModernChartCardProps) {
  const themeColor = color || "var(--color-primary, #2563eb)";
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.45)]">
      <span
        className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: themeColor }}
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative h-[88px] w-[88px] shrink-0">
          <svg viewBox="0 0 88 88" className="h-full w-full -rotate-90">
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="8"
            />
            <circle
              cx="44"
              cy="44"
              r={radius}
              fill="none"
              stroke={themeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 450ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-base font-bold text-slate-900">
              {clampedPercent}%
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{clampedPercent}%</p>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            {detail}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${clampedPercent}%`, backgroundColor: themeColor }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrgAdminDashboard() {
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const learnersTerm = getTerm("learner", orgType, true);
  const navigate = useNavigate();
  const location = useLocation();
  const orgCode = currentUser.user?.organization.code;
  const coverPhoto = currentUser.user?.organization?.branding?.coverPhoto;
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const { data: dashboardData1, isPending: isDashboardPending } =
    useGetAdminDashboard(); // Removed selectedCourseId since it shouldn't depend on course filter

  const { data: courseData, isPending: isCourseDataPending } =
    useGetAllCourses();

  const { data: sectionChartData, isPending: isSectionChartPending } =
    useGetSectionChartData(selectedCourseId, currentUser.user.organization._id);
  const { data: completionOverviewData, isPending: isCompletionOverviewPending } =
    useAdminCompletionOverview(currentUser.user.organization._id);

  const completionHierarchy = useMemo(() => {
    const sections = (
      (completionOverviewData as { sections?: CompletionSection[] } | undefined)
        ?.sections || []
    ) as CompletionSection[];

    const buildPercent = (value: number, total: number) =>
      total > 0 ? Math.round((value / total) * 100) : 0;

    const instructorsMap = new Map<
      string,
      {
        id: string;
        name: string;
        batches: Array<{
          id: string;
          code: string;
          name: string;
          learnerCount: number;
          moduleCount: number;
          lessonCount: number;
          completedSlots: number;
          totalSlots: number;
          percent: number;
          modules: Array<{
            id: string;
            title: string;
            lessonCount: number;
            completedSlots: number;
            totalSlots: number;
            percent: number;
            lessons: Array<{
              id: string;
              title: string;
              completedCount: number;
              learnerCount: number;
              percent: number;
            }>;
          }>;
        }>;
      }
    >();

    sections.forEach((section) => {
      const instructorId = section.instructor?._id || "unassigned";
      const instructorName = section.instructor
        ? `${section.instructor.firstName || ""} ${section.instructor.lastName || ""}`.trim() ||
          "Unknown Instructor"
        : "Unassigned Instructor";

      const learners = Array.isArray(section.students) ? section.students : [];
      const learnerIds = new Set(
        learners.map((student) => String(student?._id || "")).filter(Boolean),
      );
      const learnerCount = learnerIds.size;
      const modules = Array.isArray(section.modules) ? section.modules : [];

      const normalizedModules = modules.map((module) => {
        const lessons = Array.isArray(module.lessons) ? module.lessons : [];
        const normalizedLessons = lessons.map((lesson) => {
          const completedCount = (lesson.progress || []).filter(
            (entry) =>
              entry?.status === "completed" &&
              learnerIds.has(String(entry?.userId || "")),
          ).length;
          const percent = buildPercent(completedCount, learnerCount);

          return {
            id: lesson._id,
            title: String(lesson.title || "Untitled Lesson"),
            completedCount,
            learnerCount,
            percent,
          };
        });

        const lessonCount = normalizedLessons.length;
        const completedSlots = normalizedLessons.reduce(
          (sum, lesson) => sum + lesson.completedCount,
          0,
        );
        const totalSlots = lessonCount * learnerCount;
        const percent = buildPercent(completedSlots, totalSlots);

        return {
          id: module._id,
          title: String(module.title || "Untitled Module"),
          lessonCount,
          completedSlots,
          totalSlots,
          percent,
          lessons: normalizedLessons,
        };
      });

      const moduleCount = normalizedModules.length;
      const lessonCount = normalizedModules.reduce(
        (sum, module) => sum + module.lessonCount,
        0,
      );
      const completedSlots = normalizedModules.reduce(
        (sum, module) => sum + module.completedSlots,
        0,
      );
      const totalSlots = normalizedModules.reduce(
        (sum, module) => sum + module.totalSlots,
        0,
      );
      const percent = buildPercent(completedSlots, totalSlots);

      if (!instructorsMap.has(instructorId)) {
        instructorsMap.set(instructorId, {
          id: instructorId,
          name: instructorName,
          batches: [],
        });
      }

      instructorsMap.get(instructorId)?.batches.push({
        id: section._id,
        code: String(section.code || ""),
        name: String(section.name || "Unnamed Batch"),
        learnerCount,
        moduleCount,
        lessonCount,
        completedSlots,
        totalSlots,
        percent,
        modules: normalizedModules,
      });
    });

    const instructors = Array.from(instructorsMap.values()).map((instructor) => {
      const totals = instructor.batches.reduce(
        (acc, batch) => {
          acc.completed += batch.completedSlots;
          acc.total += batch.totalSlots;
          return acc;
        },
        { completed: 0, total: 0 },
      );

      return {
        ...instructor,
        percent: buildPercent(totals.completed, totals.total),
      };
    });

    const totals = instructors.reduce(
      (acc, instructor) => {
        acc.instructors += 1;
        instructor.batches.forEach((batch) => {
          acc.batches += 1;
          acc.modules += batch.moduleCount;
          acc.lessons += batch.lessonCount;
        });
        return acc;
      },
      { instructors: 0, batches: 0, modules: 0, lessons: 0 },
    );

    const completionSlots = instructors.reduce(
      (acc, instructor) => {
        instructor.batches.forEach((batch) => {
          acc.totalBatches += 1;
          if (batch.percent === 100) acc.completedBatches += 1;

          batch.modules.forEach((module) => {
            acc.completedModuleSlots += module.completedSlots;
            acc.totalModuleSlots += module.totalSlots;

            module.lessons.forEach((lesson) => {
              acc.completedLessonSlots += lesson.completedCount;
              acc.totalLessonSlots += lesson.learnerCount;
            });
          });
        });
        return acc;
      },
      {
        completedBatches: 0,
        totalBatches: 0,
        completedModuleSlots: 0,
        totalModuleSlots: 0,
        completedLessonSlots: 0,
        totalLessonSlots: 0,
      },
    );

    return {
      instructors,
      totals,
      completion: {
        ...completionSlots,
        completedBatchPercent: buildPercent(
          completionSlots.completedBatches,
          completionSlots.totalBatches,
        ),
        modulePercent: buildPercent(
          completionSlots.completedModuleSlots,
          completionSlots.totalModuleSlots,
        ),
        lessonPercent: buildPercent(
          completionSlots.completedLessonSlots,
          completionSlots.totalLessonSlots,
        ),
      },
    };
  }, [completionOverviewData]);

  // Transform API data to match expected structure
  const transformDashboardData = (
    apiData: DashboardApiResponse,
    sectionData: SectionChartApiResponse,
  ) => {
    // Use sectionChartData for section-related metrics
    const sectionMetrics = sectionData[0] || {
      totalSectionCount: [{ total: 0 }],
      studentsPerSectionCount: [],
      sectionPerStatusCount: [],
    };

    return {
      stats: [
        {
          label: "Courses",
          value: apiData.courseMetrics.totalCourseCount[0]?.total || 0,
          icon: "FaBook",
          route: "course" as DashboardStatRoute,
        },
        {
          label: "Instructors",
          value: apiData.userMetrics.totalInstructorCount[0]?.total || 0,
          icon: "FaUserTie",
          route: "instructor" as DashboardStatRoute,
        },
        {
          label: learnersTerm,
          value: apiData.userMetrics.totalStudentCount[0]?.total || 0,
          icon: "FaUserGraduate",
          route: "student" as DashboardStatRoute,
        },
        {
          label: sectionsTerm,
          value: sectionMetrics.totalSectionCount[0]?.total || 0,
          icon: "FaThLarge",
          route: "section" as DashboardStatRoute,
        },
      ],
      sectionChart: {
        labels: sectionMetrics.studentsPerSectionCount.map(
          (item: { section: string }) => item.section,
        ),
        values: sectionMetrics.studentsPerSectionCount.map(
          (item: { total: number }) => item.total,
        ),
        totalStudents: sectionMetrics.studentsPerSectionCount.reduce(
          (sum: number, item: { total: number }) => sum + item.total,
          0,
        ),
      },
      sectionStatus: [
        {
          label: `Upcoming ${sectionsTerm}`,
          value:
            sectionMetrics.sectionPerStatusCount.find(
              (item: { status: string }) => item.status === "upcoming",
            )?.total || 0,
          status: "upcoming" as const,
        },
        {
          label: `Active ${sectionsTerm}`,
          value:
            sectionMetrics.sectionPerStatusCount.find(
              (item: { status: string }) => item.status === "ongoing",
            )?.total || 0,
          status: "active" as const,
        },
        {
          label: `Completed ${sectionsTerm}`,
          value:
            sectionMetrics.sectionPerStatusCount.find(
              (item: { status: string }) => item.status === "completed",
            )?.total || 0,
          status: "completed" as const,
        },
      ],
      instructorsToAssign: apiData.organizationMetrics.instructorsToAssign || 0,
      coursesToAssign: {
        total: apiData.organizationMetrics.coursesToAssign.total || 0,
      },
    };
  };

  // Use transformed data or fallback to empty structure only if dashboard data is pending
  const dashboardData = isDashboardPending
    ? {
        stats: [],
        sectionChart: { labels: [], values: [], totalStudents: 0 },
        sectionStatus: [],
        instructorsToAssign: 0,
        coursesToAssign: { total: 0 },
      }
    : transformDashboardData(dashboardData1, sectionChartData || []);

  // Handle loading state for full dashboard
  if (isDashboardPending) {
    return <OrgAdminDashboardSkeleton />;
  }

  return (
    <div className="bg-gray-50">
      <DashboardHeader
        coverPhoto={coverPhoto}
        subTitle={
          orgType !== "corporate" ? (
            <Button
              onClick={() => navigate(`/${orgCode}/admin/section/new`)}
              className="hidden mt-4 xl:flex bg-secondary w-fit justify-center text-white hover:bg-white hover:text-secondary transition-all duration-300"
            >
              <PlusIcon size={14} /> Create New {getTerm("group", orgType)}
            </Button>
          ) : null
        }
        statCard={
          <div className="flex md:flex gap-2 md:gap-4 md:mt-6">
            <StatCard
              label="Courses to assign"
              value={dashboardData.coursesToAssign.total}
              icon="critical"
              onClick={() =>
                navigate(location.pathname.replace("dashboard", "course"))
              }
            />
            <StatCard
              label="Instructors to assign"
              value={dashboardData.instructorsToAssign}
              icon="students"
              onClick={() =>
                navigate(location.pathname.replace("dashboard", "instructor"))
              }
            />
          </div>
        }
      />

      {/* Main Layout */}
      <div className="w-full p-4">
        {/* Main Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {dashboardData.stats.map(
            (
              stat: {
                label: string;
                value: number;
                icon: string;
                route: DashboardStatRoute;
              },
              idx: number,
            ) => (
              <DashboardStatCard
                key={idx}
                label={stat.label}
                value={stat.value}
                icon={iconMap[stat.icon as keyof typeof iconMap]}
                index={idx}
                onClick={() =>
                  navigate(
                    `/${orgCode}/admin/${stat.route}`,
                  )
                }
              />
            ),
          )}
        </div>
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 mb-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.5)]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Completion Progress
                </h3>
                <HoverHelpTooltip
                  text="Track progress by instructor, with completion across batches, modules, and lessons."
                  className="shrink-0"
                />
              </div>
            </div>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
              onClick={() => navigate(location.pathname.replace("dashboard", "completion"))}
            >
              Open Full Tracker
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <ModernChartCard
                label={`Completed ${sectionsTerm}`}
                percent={completionHierarchy.completion.completedBatchPercent}
                detail={`${completionHierarchy.completion.completedBatches}/${completionHierarchy.completion.totalBatches} completed`}
                color="var(--color-primary, #2563eb)"
              />
              <ModernChartCard
                label="Module Completion"
                percent={completionHierarchy.completion.modulePercent}
                detail={`${completionHierarchy.completion.completedModuleSlots}/${completionHierarchy.completion.totalModuleSlots} module slots`}
                color="var(--color-primary, #2563eb)"
              />
              <ModernChartCard
                label="Lesson Completion"
                percent={completionHierarchy.completion.lessonPercent}
                detail={`${completionHierarchy.completion.completedLessonSlots}/${completionHierarchy.completion.totalLessonSlots} lesson slots`}
                color="var(--color-primary, #2563eb)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Instructors
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {completionHierarchy.totals.instructors}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Batches
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {completionHierarchy.totals.batches}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Modules
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {completionHierarchy.totals.modules}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">
                Lessons
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {completionHierarchy.totals.lessons}
              </p>
            </div>
          </div>

          {isCompletionOverviewPending ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
              Loading completion overview...
            </div>
          ) : completionHierarchy.instructors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
              No completion data available yet.
            </div>
          ) : (
            <div className="space-y-3">
              {completionHierarchy.instructors.map((instructor, instructorIdx) => (
                <details
                  key={instructor.id}
                  className="group rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <summary className="cursor-pointer list-none px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm font-bold">
                          {instructorIdx + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {instructor.name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {instructor.batches.length} batch
                            {instructor.batches.length !== 1 ? "es" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="min-w-[210px]">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-500">Progress</span>
                          <span className="font-semibold text-slate-700">
                            {instructor.percent}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                            style={{ width: `${instructor.percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-slate-200 px-4 py-3 bg-white/70">
                    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                      <div className="grid grid-cols-12 gap-2 bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        <div className="col-span-5">Batch</div>
                        <div className="col-span-2 text-center">Learners</div>
                        <div className="col-span-2 text-center">Modules</div>
                        <div className="col-span-1 text-center">Lessons</div>
                        <div className="col-span-2 text-right">Progress</div>
                      </div>

                      <div>
                        {instructor.batches.map((batch) => (
                          <details key={batch.id} className="border-t border-slate-200 first:border-t-0">
                            <summary className="cursor-pointer list-none grid grid-cols-12 gap-2 px-3 py-2.5 items-center hover:bg-slate-50">
                              <div className="col-span-5">
                                <p className="text-sm font-medium text-slate-900">
                                  {batch.code ? `${batch.code} - ` : ""}
                                  {batch.name}
                                </p>
                              </div>
                              <div className="col-span-2 text-center text-sm text-slate-700">
                                {batch.learnerCount}
                              </div>
                              <div className="col-span-2 text-center text-sm text-slate-700">
                                {batch.moduleCount}
                              </div>
                              <div className="col-span-1 text-center text-sm text-slate-700">
                                {batch.lessonCount}
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-700 mb-1">
                                  <span>{batch.percent}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-all duration-500"
                                    style={{ width: `${batch.percent}%` }}
                                  />
                                </div>
                              </div>
                            </summary>

                            <div className="border-t border-slate-200 bg-slate-50/60 p-3">
                              {batch.modules.length === 0 ? (
                                <p className="text-xs text-slate-500">
                                  No modules in this batch yet.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[720px]">
                                    <thead>
                                      <tr className="text-[11px] uppercase tracking-wide text-slate-500">
                                        <th className="text-left py-1.5 px-2">Module</th>
                                        <th className="text-center py-1.5 px-2">Lessons</th>
                                        <th className="text-right py-1.5 px-2">Progress</th>
                                        <th className="text-left py-1.5 px-2">Lesson Completion</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {batch.modules.map((module) => (
                                        <tr key={module.id} className="border-t border-slate-200/80">
                                          <td className="py-2 px-2">
                                            <p className="text-sm font-medium text-slate-800">
                                              {module.title}
                                            </p>
                                          </td>
                                          <td className="py-2 px-2 text-center text-sm text-slate-700">
                                            {module.lessons.length}
                                          </td>
                                          <td className="py-2 px-2">
                                            <div className="flex items-center justify-end gap-2 text-xs font-semibold text-slate-700 mb-1">
                                              <span>{module.percent}%</span>
                                            </div>
                                            <div className="ml-auto h-1.5 w-28 rounded-full bg-slate-200 overflow-hidden">
                                              <div
                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                                                style={{ width: `${module.percent}%` }}
                                              />
                                            </div>
                                          </td>
                                          <td className="py-2 px-2">
                                            <div className="flex flex-wrap gap-1">
                                              {module.lessons.map((lesson) => (
                                                <span
                                                  key={lesson.id}
                                                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600"
                                                  title={lesson.title}
                                                >
                                                  {lesson.percent}% ({lesson.completedCount}/{lesson.learnerCount || 0})
                                                </span>
                                              ))}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
        {/* Section Chart and Status */}
        {isSectionChartPending ? (
          <SectionAnalyticsSkeleton />
        ) : (
          <div className="bg-white border rounded-xl p-6 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {sectionTerm} Analytics
                  </h2>
                  <HoverHelpTooltip
                    text={`View metrics and status across all course ${sectionsTerm.toLowerCase()}`}
                    className="shrink-0"
                  />
                </div>
              </div>
              <div className="w-full md:w-72">
                <label
                  htmlFor="course-select"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Course Filter
                </label>
                <select
                  id="course-select"
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={isCourseDataPending}
                >
                  <option value="">All Courses</option>
                  {courseData?.data?.map((course: ICourse) => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {isCourseDataPending && (
                  <p className="mt-1 text-xs text-gray-500">
                    Loading courses...
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SectionChart
                  data={dashboardData.sectionChart}
                  xAxisLabel={sectionsTerm}
                  learnerLabel={learnersTerm}
                />
              </div>
              <div>
                <SectionStatus statusData={dashboardData.sectionStatus} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
