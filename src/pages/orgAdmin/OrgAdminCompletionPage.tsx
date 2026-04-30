import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChartBarIcon } from "@/components/ui/chart-bar-icon";
import PageHeader from "../../components/common/PageHeader";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import StatsCards from "../../components/common/StatsCards";
import { useAuth } from "../../context/AuthContext";
import { useAdminCompletionOverview } from "../../hooks/useSection";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";
import { getTerm } from "../../lib/utils";
import {
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiList,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

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

type CompletionStudent = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type CompletionSection = {
  _id: string;
  code?: string;
  name?: string;
  instructor?: { _id?: string; firstName?: string; lastName?: string } | null;
  students?: CompletionStudent[];
  modules?: CompletionModule[];
};

type PerformanceProgress = {
  completedLessons?: number;
  totalLessons?: number;
  completedAssessments?: number;
  totalAssessments?: number;
};

type PerformanceStudent = {
  _id?: string;
  section?: string;
  gpa?: string | number;
  attendance?: number;
  complianceScore?: number;
  standing?: string;
  riskLevel?: string;
  progress?: PerformanceProgress;
};

type EmployeeCompletionRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  instructorId: string;
  instructorName: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  completedModules: number;
  totalModules: number;
  modulePercent: number;
  completedLessons: number;
  totalLessons: number;
  lessonPercent: number;
  completedAssessments: number;
  totalAssessments: number;
  assessmentPercent: number;
  overallPercent: number;
  attendancePercent: number;
  gpa: string;
  complianceScore: number | null;
  standing: string;
  riskLevel: string;
  status: "completed" | "in_progress" | "not_started";
};

type BatchDrilldown = {
  instructorId: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  instructorName: string;
  learnerCount: number;
  completedSlots: number;
  totalSlots: number;
  percent: number;
  modules: Array<{
    id: string;
    title: string;
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
};

type BatchHierarchy = BatchDrilldown & {
  employees: EmployeeCompletionRow[];
  averageEmployeeCompletion: number;
  averageAttendance: number;
  completedAssignments: number;
  completedAssessments: number;
  totalAssessments: number;
  assessmentPercent: number;
};

type InstructorHierarchy = {
  instructorId: string;
  instructorName: string;
  batches: BatchHierarchy[];
  assignmentCount: number;
  completedAssignments: number;
  averageEmployeeCompletion: number;
};

const statusLabelMap: Record<EmployeeCompletionRow["status"], string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

const getFullName = (user?: {
  firstName?: string;
  lastName?: string;
} | null): string => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || "Unknown";
};

const buildPercent = (value: number, total: number): number =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const normalizeSectionCode = (value?: string): string =>
  String(value || "").trim().toLowerCase();

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const getRiskDisplayText = (employee: EmployeeCompletionRow): string => {
  const noActivityYet =
    employee.completedLessons === 0 &&
    employee.completedAssessments === 0 &&
    employee.attendancePercent === 0;

  if (employee.status === "not_started" || noActivityYet) {
    return "--";
  }

  if (employee.totalAssessments > 0 && employee.completedAssessments === 0) {
    return "Awaiting Assessment";
  }

  const numericGrade = Number(employee.gpa);
  const hasGrade = Number.isFinite(numericGrade) && numericGrade > 0;

  if (employee.completedAssessments > 0 && !hasGrade) {
    return "Awaiting Grade";
  }

  return employee.riskLevel;
};

export default function OrgAdminCompletionPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const learnersTerm = getTerm("learner", orgType, true);
  const learnerTerm = getTerm("learner", orgType);
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const orgId = currentUser.user.organization._id;

  const { data: completionOverviewData, isPending } =
    useAdminCompletionOverview(orgId);
  const { data: performanceDashboardData, isPending: isPerformancePending } =
    useGetPerformanceDashboard();

  const sections = useMemo(() => {
    const payload = completionOverviewData as
      | {
          sections?: CompletionSection[];
          documents?: CompletionSection[];
          data?: {
            sections?: CompletionSection[];
            documents?: CompletionSection[];
          };
        }
      | undefined;

    if (Array.isArray(payload?.sections)) return payload.sections;
    if (Array.isArray(payload?.documents)) return payload.documents;
    if (Array.isArray(payload?.data?.sections)) return payload.data.sections;
    if (Array.isArray(payload?.data?.documents)) return payload.data.documents;
    return [] as CompletionSection[];
  }, [completionOverviewData]);

  const performanceStudents = useMemo(() => {
    const payload = performanceDashboardData as
      | {
          students?: PerformanceStudent[];
          data?: { students?: PerformanceStudent[] };
        }
      | undefined;

    if (Array.isArray(payload?.students)) return payload.students;
    if (Array.isArray(payload?.data?.students)) return payload.data.students;
    return [] as PerformanceStudent[];
  }, [performanceDashboardData]);

  const performanceByAssignment = useMemo(() => {
    const map = new Map<string, PerformanceStudent>();

    performanceStudents.forEach((student) => {
      const studentId = String(student?._id || "").trim();
      const sectionCode = normalizeSectionCode(student?.section);
      if (!studentId || !sectionCode) return;
      map.set(`${studentId}:${sectionCode}`, student);
    });

    return map;
  }, [performanceStudents]);

  const completionData = useMemo(() => {
    const employeeRows: EmployeeCompletionRow[] = [];
    const batches: BatchDrilldown[] = [];
    const employeeIds = new Set<string>();

    let completedBatchRows = 0;
    let totalBatchRows = 0;
    let completedOverallSlots = 0;
    let totalOverallSlots = 0;
    let completedModuleSlots = 0;
    let totalModuleSlots = 0;
    let completedLessonSlots = 0;
    let totalLessonSlots = 0;
    let completedAssessmentSlots = 0;
    let totalAssessmentSlots = 0;
    let attendanceSum = 0;
    let attendanceCount = 0;

    sections.forEach((section) => {
      const instructorId = String(section.instructor?._id || "unassigned");
      const instructorName = section.instructor
        ? getFullName(section.instructor)
        : "Unassigned Instructor";

      const learners = Array.isArray(section.students) ? section.students : [];
      const learnerIdSet = new Set(
        learners.map((learner) => String(learner?._id || "")).filter(Boolean),
      );
      const learnerCount = learnerIdSet.size;

      const modules = Array.isArray(section.modules) ? section.modules : [];
      const modulesWithLessons = modules.filter(
        (module) => Array.isArray(module.lessons) && module.lessons.length > 0,
      );

      const moduleDrilldowns = modulesWithLessons.map((module) => {
        const lessons = Array.isArray(module.lessons) ? module.lessons : [];
        const drilldownLessons = lessons.map((lesson) => {
          const completedCount = (lesson.progress || []).filter(
            (progress) =>
              progress?.status === "completed" &&
              learnerIdSet.has(String(progress?.userId || "")),
          ).length;

          return {
            id: lesson._id,
            title: String(lesson.title || "Untitled Lesson"),
            completedCount,
            learnerCount,
            percent: buildPercent(completedCount, learnerCount),
          };
        });

        const completedSlots = drilldownLessons.reduce(
          (sum, lesson) => sum + lesson.completedCount,
          0,
        );
        const totalSlots = drilldownLessons.length * learnerCount;

        return {
          id: module._id,
          title: String(module.title || "Untitled Module"),
          completedSlots,
          totalSlots,
          percent: buildPercent(completedSlots, totalSlots),
          lessons: drilldownLessons,
        };
      });

      const batchCompletedSlots = moduleDrilldowns.reduce(
        (sum, module) => sum + module.completedSlots,
        0,
      );
      const batchTotalSlots = moduleDrilldowns.reduce(
        (sum, module) => sum + module.totalSlots,
        0,
      );

      batches.push({
        instructorId,
        batchId: section._id,
        batchCode: String(section.code || ""),
        batchName: String(section.name || "Unnamed Batch"),
        instructorName,
        learnerCount,
        completedSlots: batchCompletedSlots,
        totalSlots: batchTotalSlots,
        percent: buildPercent(batchCompletedSlots, batchTotalSlots),
        modules: moduleDrilldowns,
      });

      learners.forEach((learner) => {
        const employeeId = String(learner?._id || "");
        if (!employeeId) return;

        employeeIds.add(employeeId);

        const completedLessons = modulesWithLessons.reduce((sum, module) => {
          const lessons = Array.isArray(module.lessons) ? module.lessons : [];
          const done = lessons.filter((lesson) =>
            (lesson.progress || []).some(
              (progress) =>
                progress?.status === "completed" &&
                String(progress?.userId || "") === employeeId,
            ),
          ).length;
          return sum + done;
        }, 0);

        const totalLessons = modulesWithLessons.reduce((sum, module) => {
          const lessons = Array.isArray(module.lessons) ? module.lessons : [];
          return sum + lessons.length;
        }, 0);

        const completedModules = modulesWithLessons.reduce((sum, module) => {
          const lessons = Array.isArray(module.lessons) ? module.lessons : [];
          if (lessons.length === 0) return sum;

          const isComplete = lessons.every((lesson) =>
            (lesson.progress || []).some(
              (progress) =>
                progress?.status === "completed" &&
                String(progress?.userId || "") === employeeId,
            ),
          );

          return sum + (isComplete ? 1 : 0);
        }, 0);

        const totalModules = modulesWithLessons.length;
        const lessonPercent = buildPercent(completedLessons, totalLessons);
        const modulePercent = buildPercent(completedModules, totalModules);

        const assignmentKey = `${employeeId}:${normalizeSectionCode(section.code)}`;
        const performance = performanceByAssignment.get(assignmentKey);

        const completedAssessments = Number(
          performance?.progress?.completedAssessments || 0,
        );
        const totalAssessments = Number(
          performance?.progress?.totalAssessments || 0,
        );
        const assessmentPercent = buildPercent(completedAssessments, totalAssessments);

        const totalTrackedItems = totalLessons + totalAssessments;
        const completedTrackedItems = completedLessons + completedAssessments;
        const overallPercent = buildPercent(completedTrackedItems, totalTrackedItems);

        const attendancePercent = clampPercent(Number(performance?.attendance || 0));

        const gpaRaw = performance?.gpa;
        const gpaValue =
          typeof gpaRaw === "number"
            ? gpaRaw.toFixed(2)
            : typeof gpaRaw === "string" && gpaRaw.trim().length > 0
              ? gpaRaw.trim()
              : "--";

        const complianceScore =
          typeof performance?.complianceScore === "number"
            ? performance.complianceScore
            : null;

        const standing = String(performance?.standing || "N/A");
        const riskLevel = String(performance?.riskLevel || "N/A");

        const status: EmployeeCompletionRow["status"] =
          overallPercent >= 100 && totalTrackedItems > 0
            ? "completed"
            : overallPercent > 0
              ? "in_progress"
              : "not_started";

        totalBatchRows += 1;
        if (status === "completed") completedBatchRows += 1;

        completedOverallSlots += completedTrackedItems;
        totalOverallSlots += totalTrackedItems;

        completedModuleSlots += completedModules;
        totalModuleSlots += totalModules;

        completedLessonSlots += completedLessons;
        totalLessonSlots += totalLessons;

        completedAssessmentSlots += completedAssessments;
        totalAssessmentSlots += totalAssessments;

        attendanceSum += attendancePercent;
        attendanceCount += 1;

        employeeRows.push({
          id: `${employeeId}-${section._id}`,
          employeeId,
          employeeName: getFullName(learner),
          employeeEmail: String(learner?.email || ""),
          instructorId,
          instructorName,
          batchId: section._id,
          batchCode: String(section.code || ""),
          batchName: String(section.name || "Unnamed Batch"),
          completedModules,
          totalModules,
          modulePercent,
          completedLessons,
          totalLessons,
          lessonPercent,
          completedAssessments,
          totalAssessments,
          assessmentPercent,
          overallPercent,
          attendancePercent,
          gpa: gpaValue,
          complianceScore,
          standing,
          riskLevel,
          status,
        });
      });
    });

    const rowsByBatch = new Map<string, EmployeeCompletionRow[]>();
    employeeRows.forEach((row) => {
      if (!rowsByBatch.has(row.batchId)) {
        rowsByBatch.set(row.batchId, []);
      }
      rowsByBatch.get(row.batchId)?.push(row);
    });

    const sortedBatches = [...batches].sort((a, b) => {
      const instructorCompare = a.instructorName.localeCompare(b.instructorName);
      if (instructorCompare !== 0) return instructorCompare;
      return `${a.batchCode}-${a.batchName}`.localeCompare(
        `${b.batchCode}-${b.batchName}`,
      );
    });

    const instructorMap = new Map<string, InstructorHierarchy>();

    sortedBatches.forEach((batch) => {
      const employees = [...(rowsByBatch.get(batch.batchId) || [])].sort(
        (a, b) => b.overallPercent - a.overallPercent,
      );
      const assignmentCount = employees.length;
      const completedAssignments = employees.filter(
        (employee) => employee.status === "completed",
      ).length;

      const avgCompletionRaw =
        assignmentCount > 0
          ? employees.reduce((sum, employee) => sum + employee.overallPercent, 0) /
            assignmentCount
          : 0;

      const avgAttendanceRaw =
        assignmentCount > 0
          ? employees.reduce((sum, employee) => sum + employee.attendancePercent, 0) /
            assignmentCount
          : 0;

      const completedAssessments = employees.reduce(
        (sum, employee) => sum + employee.completedAssessments,
        0,
      );
      const totalAssessments = employees.reduce(
        (sum, employee) => sum + employee.totalAssessments,
        0,
      );

      const batchHierarchy: BatchHierarchy = {
        ...batch,
        employees,
        averageEmployeeCompletion: clampPercent(avgCompletionRaw),
        averageAttendance: clampPercent(avgAttendanceRaw),
        completedAssignments,
        completedAssessments,
        totalAssessments,
        assessmentPercent: buildPercent(completedAssessments, totalAssessments),
      };

      if (!instructorMap.has(batch.instructorId)) {
        instructorMap.set(batch.instructorId, {
          instructorId: batch.instructorId,
          instructorName: batch.instructorName,
          batches: [],
          assignmentCount: 0,
          completedAssignments: 0,
          averageEmployeeCompletion: 0,
        });
      }

      const instructor = instructorMap.get(batch.instructorId);
      if (!instructor) return;

      instructor.batches.push(batchHierarchy);
      instructor.assignmentCount += assignmentCount;
      instructor.completedAssignments += completedAssignments;
    });

    const hierarchy = Array.from(instructorMap.values())
      .map((instructor) => {
        const avgCompletionRaw =
          instructor.assignmentCount > 0
            ? instructor.batches.reduce(
                (sum, batch) =>
                  sum + batch.averageEmployeeCompletion * batch.employees.length,
                0,
              ) / instructor.assignmentCount
            : 0;

        return {
          ...instructor,
          batches: instructor.batches.sort((a, b) => {
            if (b.averageEmployeeCompletion !== a.averageEmployeeCompletion) {
              return b.averageEmployeeCompletion - a.averageEmployeeCompletion;
            }
            return `${a.batchCode}-${a.batchName}`.localeCompare(
              `${b.batchCode}-${b.batchName}`,
            );
          }),
          averageEmployeeCompletion: clampPercent(avgCompletionRaw),
        };
      })
      .sort((a, b) => a.instructorName.localeCompare(b.instructorName));

    return {
      hierarchy,
      metrics: {
        employeesTracked: employeeIds.size,
        completedBatchRows,
        totalBatchRows,
        completedOverallSlots,
        totalOverallSlots,
        completedModuleSlots,
        totalModuleSlots,
        completedLessonSlots,
        totalLessonSlots,
        completedAssessmentSlots,
        totalAssessmentSlots,
        averageAttendancePercent:
          attendanceCount > 0 ? clampPercent(attendanceSum / attendanceCount) : 0,
      },
    };
  }, [performanceByAssignment, sections]);

  const overallCompletionPercent = buildPercent(
    completionData.metrics.completedOverallSlots,
    completionData.metrics.totalOverallSlots,
  );

  const moduleCompletionPercent = buildPercent(
    completionData.metrics.completedModuleSlots,
    completionData.metrics.totalModuleSlots,
  );

  const lessonCompletionPercent = buildPercent(
    completionData.metrics.completedLessonSlots,
    completionData.metrics.totalLessonSlots,
  );

  const assessmentCompletionPercent = buildPercent(
    completionData.metrics.completedAssessmentSlots,
    completionData.metrics.totalAssessmentSlots,
  );
  const completionSummaryStats = useMemo(
    () => [
      {
        title: "Employees Tracked",
        value: completionData.metrics.employeesTracked,
        change: "Total employees in tracker",
        icon: <FiUsers className="text-lg" />,
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        iconBgColor: "bg-blue-500",
        iconTextColor: "text-white",
      },
      {
        title: `Completed ${sectionsTerm}`,
        value: completionData.metrics.completedBatchRows,
        change: `of ${completionData.metrics.totalBatchRows} employee enrollments`,
        icon: <FiCheckCircle className="text-lg" />,
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        iconBgColor: "bg-emerald-500",
        iconTextColor: "text-white",
      },
      {
        title: "Overall Completion",
        value: `${overallCompletionPercent}%`,
        change: `${completionData.metrics.completedOverallSlots}/${completionData.metrics.totalOverallSlots} lesson + assessment slots`,
        icon: <FiTrendingUp className="text-lg" />,
        bgColor: "bg-indigo-50",
        textColor: "text-indigo-700",
        iconBgColor: "bg-indigo-500",
        iconTextColor: "text-white",
      },
      {
        title: "Module Completion",
        value: `${moduleCompletionPercent}%`,
        change: `${completionData.metrics.completedModuleSlots}/${completionData.metrics.totalModuleSlots} module slots`,
        icon: <FiBookOpen className="text-lg" />,
        bgColor: "bg-violet-50",
        textColor: "text-violet-700",
        iconBgColor: "bg-violet-500",
        iconTextColor: "text-white",
      },
      {
        title: "Lesson Completion",
        value: `${lessonCompletionPercent}%`,
        change: `${completionData.metrics.completedLessonSlots}/${completionData.metrics.totalLessonSlots} lesson slots`,
        icon: <FiList className="text-lg" />,
        bgColor: "bg-cyan-50",
        textColor: "text-cyan-700",
        iconBgColor: "bg-cyan-500",
        iconTextColor: "text-white",
      },
      {
        title: "Assessment Completion",
        value: `${assessmentCompletionPercent}%`,
        change: `${completionData.metrics.completedAssessmentSlots}/${completionData.metrics.totalAssessmentSlots} assessment slots`,
        icon: <FiClipboard className="text-lg" />,
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        iconBgColor: "bg-amber-500",
        iconTextColor: "text-white",
      },
      {
        title: "Average Attendance",
        value: `${completionData.metrics.averageAttendancePercent}%`,
        change: "Across all employee-batch enrollments",
        icon: <FiCalendar className="text-lg" />,
        bgColor: "bg-slate-50",
        textColor: "text-slate-700",
        iconBgColor: "bg-slate-500",
        iconTextColor: "text-white",
      },
    ],
    [
      assessmentCompletionPercent,
      completionData.metrics.averageAttendancePercent,
      completionData.metrics.completedAssessmentSlots,
      completionData.metrics.completedBatchRows,
      completionData.metrics.completedLessonSlots,
      completionData.metrics.completedModuleSlots,
      completionData.metrics.completedOverallSlots,
      completionData.metrics.employeesTracked,
      completionData.metrics.totalAssessmentSlots,
      completionData.metrics.totalBatchRows,
      completionData.metrics.totalLessonSlots,
      completionData.metrics.totalModuleSlots,
      completionData.metrics.totalOverallSlots,
      lessonCompletionPercent,
      moduleCompletionPercent,
      overallCompletionPercent,
      sectionsTerm,
    ],
  );

  const isLoading = isPending || isPerformancePending;
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>("");
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [instructorSearch, setInstructorSearch] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeCompletionRow | null>(
    null,
  );
  const detailPaneRef = useRef<HTMLDivElement | null>(null);

  const filteredHierarchy = useMemo(() => {
    const term = instructorSearch.trim().toLowerCase();
    if (!term) return completionData.hierarchy;

    return completionData.hierarchy.filter((instructor) =>
      instructor.instructorName.toLowerCase().includes(term),
    );
  }, [completionData.hierarchy, instructorSearch]);

  const activeInstructor = useMemo(() => {
    if (!filteredHierarchy.length) return null;
    return (
      filteredHierarchy.find(
        (instructor) => instructor.instructorId === selectedInstructorId,
      ) || filteredHierarchy[0]
    );
  }, [filteredHierarchy, selectedInstructorId]);

  const activeBatch = useMemo(() => {
    if (!activeInstructor || activeInstructor.batches.length === 0) return null;
    return (
      activeInstructor.batches.find((batch) => batch.batchId === selectedBatchId) ||
      activeInstructor.batches[0]
    );
  }, [activeInstructor, selectedBatchId]);

  useEffect(() => {
    if (!filteredHierarchy.length) {
      setSelectedInstructorId("");
      setSelectedBatchId("");
      return;
    }

    const hasInstructor = filteredHierarchy.some(
      (instructor) => instructor.instructorId === selectedInstructorId,
    );
    if (!hasInstructor) {
      const firstInstructor = filteredHierarchy[0];
      setSelectedInstructorId(firstInstructor.instructorId);
      setSelectedBatchId(firstInstructor.batches[0]?.batchId || "");
    }
  }, [filteredHierarchy, selectedInstructorId]);

  useEffect(() => {
    if (!activeInstructor) {
      setSelectedBatchId("");
      return;
    }

    const hasBatch = activeInstructor.batches.some(
      (batch) => batch.batchId === selectedBatchId,
    );
    if (!hasBatch) {
      setSelectedBatchId(activeInstructor.batches[0]?.batchId || "");
    }
  }, [activeInstructor, selectedBatchId]);

  const handleSelectInstructor = (instructorId: string, firstBatchId: string) => {
    setSelectedInstructorId(instructorId);
    setSelectedBatchId(firstBatchId);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        detailPaneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1600px] p-6 space-y-5">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/admin/dashboard`)}
          icon={<ChartBarIcon size={16} style={{ color: "var(--color-primary, #2563eb)" }} />}
          iconStyle={{
            backgroundColor:
              "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
          }}
          title={
            <span className="inline-flex items-center gap-2">
              {learnersTerm} Completion Tracker
              <HoverHelpTooltip
                text={`Completion progress across instructors, ${sectionsTerm.toLowerCase()}, modules, lessons, attendance, and assessments.`}
                className="shrink-0"
              />
            </span>
          }
        />

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading completion tracker...
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCards stats={completionSummaryStats} />
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
              <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Admin Completion Workspace
                  </h2>
                  <HoverHelpTooltip
                    text={`Select an instructor, choose a ${sectionTerm.toLowerCase()}, then review each ${learnerTerm.toLowerCase()} in a single table. Use quick-view modal or open dedicated pages for deeper review.`}
                    className="shrink-0"
                  />
                </div>
                {activeBatch && (
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => navigate(`/${orgCode}/admin/section/${activeBatch.batchCode}`)}
                    disabled={!activeBatch.batchCode}
                  >
                    Open Selected {sectionTerm}
                  </button>
                )}
              </div>

              {completionData.hierarchy.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  No completion records found.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-12">
                  <aside className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 md:col-span-2 lg:col-span-2 md:max-h-[72vh] md:overflow-y-auto">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                      Instructors
                    </p>
                    <div className="mb-2">
                      <input
                        type="text"
                        value={instructorSearch}
                        onChange={(event) => setInstructorSearch(event.target.value)}
                        placeholder="Search instructor"
                        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary/40 focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        {filteredHierarchy.length} of {completionData.hierarchy.length} shown
                      </p>
                    </div>

                    <div className="space-y-2">
                      {filteredHierarchy.map((instructor) => {
                        const isActive =
                          instructor.instructorId === activeInstructor?.instructorId;
                        return (
                          <button
                            key={instructor.instructorId}
                            type="button"
                            onClick={() =>
                              handleSelectInstructor(
                                instructor.instructorId,
                                instructor.batches[0]?.batchId || "",
                              )
                            }
                            className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                              isActive
                                ? "border-primary/40 bg-primary/10"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {instructor.instructorName}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {instructor.batches.length} {sectionsTerm.toLowerCase()} |{" "}
                              {instructor.completedAssignments}/{instructor.assignmentCount}{" "}
                              employees completed
                            </p>
                            <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{
                                  width: `${instructor.averageEmployeeCompletion}%`,
                                }}
                              />
                            </div>
                          </button>
                        );
                      })}
                      {filteredHierarchy.length === 0 && (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-5 text-xs text-slate-500">
                          No instructors matched your search.
                        </div>
                      )}
                    </div>
                  </aside>

                  <div
                    ref={detailPaneRef}
                    className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col min-h-[320px] md:col-span-5 lg:col-span-5 md:max-h-[72vh] min-w-0"
                  >
                      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-[13px] font-semibold text-slate-900">
                          {activeInstructor?.instructorName || "Instructor"}: {sectionsTerm}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Pick one {sectionTerm.toLowerCase()} to update employees table.
                        </p>
                      </div>
                      <div className="overflow-auto">
                        <table className="min-w-[560px] w-full text-xs">
                          <thead className="sticky top-0 bg-white z-10">
                            <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                              <th className="py-2 pr-3 text-left">{sectionTerm}</th>
                              <th className="py-2 px-3 text-left">{learnersTerm}</th>
                              <th className="py-2 px-3 text-left">Completion</th>
                              <th className="py-2 px-3 text-left">Assessment</th>
                              <th className="py-2 px-3 text-left">Attendance</th>
                              <th className="py-2 pl-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(activeInstructor?.batches || []).map((batch) => {
                              const isActive = batch.batchId === activeBatch?.batchId;
                              return (
                                <tr
                                  key={batch.batchId}
                                  onClick={() => setSelectedBatchId(batch.batchId)}
                                  className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${
                                    isActive ? "bg-primary/5" : "hover:bg-slate-50"
                                  }`}
                                >
                                  <td className="py-2.5 pr-3">
                                    <p className="font-semibold text-[13px] leading-tight text-slate-900">
                                      {batch.batchCode ? `${batch.batchCode} - ` : ""}
                                      {batch.batchName}
                                    </p>
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {batch.employees.length}
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {batch.averageEmployeeCompletion}%
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {batch.assessmentPercent}%
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {batch.averageAttendance}%
                                  </td>
                                  <td className="py-2.5 pl-3 text-right">
                                    <button
                                      type="button"
                                      className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        navigate(`/${orgCode}/admin/section/${batch.batchCode}`);
                                      }}
                                      disabled={!batch.batchCode}
                                    >
                                      Open Page
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col min-h-[320px] md:col-span-5 lg:col-span-5 md:max-h-[72vh] min-w-0">
                      <div className="mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-[13px] font-semibold text-slate-900">
                          {activeBatch
                            ? `${activeBatch.batchCode ? `${activeBatch.batchCode} - ` : ""}${activeBatch.batchName}`
                            : `${sectionTerm} Details`}
                        </p>
                        {activeBatch && (
                          <p className="text-[11px] text-slate-500">
                            {activeBatch.employees.length} {learnersTerm.toLowerCase()} |{" "}
                            {activeBatch.modules.length} modules
                          </p>
                        )}
                      </div>

                      {!activeBatch || activeBatch.employees.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-sm text-slate-500">
                          No {learnersTerm.toLowerCase()} available in the selected{" "}
                          {sectionTerm.toLowerCase()}.
                        </div>
                      ) : (
                        <div className="overflow-auto">
                          <table className="min-w-[700px] w-full text-xs">
                            <thead className="sticky top-0 bg-white z-10">
                              <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-500">
                                <th className="py-2 pr-3 text-left">{learnerTerm}</th>
                                <th className="py-2 px-3 text-left">Overall</th>
                                <th className="py-2 px-3 text-left">Lessons</th>
                                <th className="py-2 px-3 text-left">Assessments</th>
                                <th className="py-2 px-3 text-left">Attendance</th>
                                <th className="py-2 px-3 text-left">Risk</th>
                                <th className="py-2 px-3 text-left">Status</th>
                                <th className="py-2 pl-3 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeBatch.employees.map((employee) => (
                                <tr
                                  key={employee.id}
                                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
                                >
                                  <td className="py-2.5 pr-3">
                                    <p className="font-semibold text-[13px] leading-tight text-slate-900">
                                      {employee.employeeName}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {employee.employeeEmail || "--"}
                                    </p>
                                  </td>
                                  <td className="py-2.5 px-3 font-semibold text-[12px] text-slate-700">
                                    {employee.overallPercent}%
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {employee.completedLessons}/{employee.totalLessons}
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {employee.completedAssessments}/{employee.totalAssessments}
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {employee.attendancePercent}%
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {getRiskDisplayText(employee)}
                                  </td>
                                  <td className="py-2.5 px-3 text-[12px] text-slate-700">
                                    {statusLabelMap[employee.status]}
                                  </td>
                                  <td className="py-2.5 pl-3 text-right">
                                    <div className="inline-flex gap-2">
                                      <button
                                        type="button"
                                        className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() => setSelectedEmployee(employee)}
                                      >
                                        Quick View
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                        onClick={() =>
                                          navigate(
                                            `/${orgCode}/admin/student/${employee.employeeId}`,
                                          )
                                        }
                                        disabled={!employee.employeeId}
                                      >
                                        Open Page
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                </div>
              )}
            </section>

            {selectedEmployee && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
                onClick={() => setSelectedEmployee(null)}
              >
                <div
                  className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {selectedEmployee.employeeName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedEmployee.employeeEmail || "--"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setSelectedEmployee(null)}
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-xs font-semibold uppercase text-slate-500">Modules</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.completedModules}/{selectedEmployee.totalModules} (
                        {selectedEmployee.modulePercent}%)
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-xs font-semibold uppercase text-slate-500">Lessons</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.completedLessons}/{selectedEmployee.totalLessons} (
                        {selectedEmployee.lessonPercent}%)
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Assessments
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.completedAssessments}/
                        {selectedEmployee.totalAssessments} (
                        {selectedEmployee.assessmentPercent}%)
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[11px] uppercase font-semibold text-slate-500">
                        Attendance
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.attendancePercent}%
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[11px] uppercase font-semibold text-slate-500">Grade</p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.gpa}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[11px] uppercase font-semibold text-slate-500">
                        Compliance
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.complianceScore === null
                          ? "N/A"
                          : `${selectedEmployee.complianceScore}%`}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                      <p className="text-[11px] uppercase font-semibold text-slate-500">
                        Standing
                      </p>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        {selectedEmployee.standing}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() =>
                        navigate(`/${orgCode}/admin/student/${selectedEmployee.employeeId}`)
                      }
                      disabled={!selectedEmployee.employeeId}
                    >
                      Open Employee Page
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      onClick={() => setSelectedEmployee(null)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
