import { useQuery } from "@tanstack/react-query";
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../../components/common/Button";
import GroupedDataTable, {
  GroupedTableColumn,
  GroupedTableGroup,
} from "../../components/common/GroupedDataTable";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import TableEmptyState from "../../components/common/TableEmptyState";
import TableSkeletonClean from "../../components/skeleton/TableSkeletonClean";
import { useCourses } from "../../hooks/useCourse";
import { useSearchInstructors } from "../../hooks/useInstructor";
import { useGetPerformanceDashboard } from "../../hooks/useMetrics";
import { useAdminCompletionOverview, useAdminSections } from "../../hooks/useSection";
import { useSearchStudents } from "../../hooks/useStudent";
import { useAuth } from "../../context/AuthContext";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import {
  exportRowsToExcel,
  exportRowsToPdf,
  ReportExportColumn,
} from "../../lib/reportExportUtils";
import { getTerm } from "../../lib/utils";
import studentService from "../../services/studentApi";
import { IInstructor, ISection, IStudent } from "../../types/interfaces";
import {
  FiBarChart2,
  FiBookOpen,
  FiDownload,
  FiFileText,
  FiLayers,
  FiTrendingUp,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import { PanelLeft } from "@/components/animate-ui/icons/panel-left";

type ReportTabId =
  | "students"
  | "instructors"
  | "sections"
  | "courses"
  | "performance"
  | "grades"
  | "batch-progress";

type ReportExportFormat = "excel" | "pdf";

type CourseRow = {
  _id: string;
  code: string;
  title: string;
  category?: { _id?: string; name?: string };
  level: string;
  status: string;
};

type PerformanceStudentRow = {
  _id: string;
  name: string;
  email: string;
  section: string;
  gpa: string | number;
  attendance: number;
  complianceScore?: number;
  standing: string;
  riskLevel: string;
  avatar?: string;
  progress?: {
    completedLessons: number;
    totalLessons: number;
    completedAssessments: number;
    totalAssessments: number;
    percent: number;
  };
};

type SectionGradeAssessment = {
  assessmentId: string;
  totalScore: number;
  totalPoints: number;
  type: string;
  assessmentNo: number;
  gradeMethod: string;
  percentageScore: number;
  gradeLabel: string;
  dueDate?: string;
  submittedAt?: string;
};

type SectionGradeStudent = {
  _id: string;
  studentId: string;
  fullName: string;
  avatar?: string;
  assessments: SectionGradeAssessment[];
};

type SectionGradesPayload = {
  students?: SectionGradeStudent[];
  headers?: string[];
};

type IndividualGradeRow = {
  id: string;
  sectionCode: string;
  sectionName: string;
  courseTitle: string;
  learnerName: string;
  learnerId: string;
  assessmentLabel: string;
  assessmentType: string;
  assessmentNo: number;
  gradeMethod: string;
  gradeLabel: string;
  percentageScore: number;
  totalScore: number;
  totalPoints: number;
  dueDate?: string;
  submittedAt?: string;
};

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

type BatchProgressRow = {
  id: string;
  batchId: string;
  batchCode: string;
  batchName: string;
  instructorName: string;
  learnerCount: number;
  lessonPercent: number;
  assessmentPercent: number;
  averageCompletion: number;
  averageAttendance: number;
  completedLearners: number;
  trackedLearners: number;
  completedLessons: number;
  totalLessons: number;
  completedAssessments: number;
  totalAssessments: number;
  status: "completed" | "in_progress" | "not_started";
};

interface ReportTabButtonProps {
  id: ReportTabId;
  label: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (tab: ReportTabId) => void;
}

interface ReportPanelShellProps {
  title: string;
  description: string;
  totalLabel: string;
  note?: string;
  isExportingExcel?: boolean;
  isExportingPdf?: boolean;
  onExportExcelCurrentPage: () => void;
  onExportExcelAllRows: () => void;
  onExportPdfCurrentPage: () => void;
  onExportPdfAllRows: () => void;
  onOpenPage?: () => void;
  openPageLabel?: string;
  children: React.ReactNode;
}

interface BaseReportProps {
  orgId: string;
  orgCode: string;
  orgType: "school" | "corporate";
}

interface StudentReportProps extends BaseReportProps {
  learnerTerm: string;
  learnersTerm: string;
}

interface InstructorReportProps extends BaseReportProps {
  instructorTerm: string;
  instructorsTerm: string;
}

interface SectionReportProps extends BaseReportProps {
  learnerTerm: string;
  sectionTerm: string;
  sectionsTerm: string;
  instructorTerm: string;
}

interface CourseReportProps extends BaseReportProps {
  isCorporate: boolean;
}

interface PerformanceReportProps extends BaseReportProps {
  learnerTerm: string;
  learnersTerm: string;
  sectionTerm: string;
  isCorporate: boolean;
}

interface IndividualGradesReportProps extends BaseReportProps {
  learnerTerm: string;
  learnersTerm: string;
  sectionTerm: string;
  sectionsTerm: string;
}

interface BatchProgressReportProps extends BaseReportProps {
  learnerTerm: string;
  learnersTerm: string;
  sectionTerm: string;
  sectionsTerm: string;
}

const REPORT_TABLE_LIMIT = 1000;
const REPORT_PAGE_SIZE = 12;
const REPORT_TAB_IDS: ReportTabId[] = [
  "students",
  "instructors",
  "sections",
  "courses",
  "performance",
  "grades",
  "batch-progress",
];
const numberFormatter = new Intl.NumberFormat("en-US");

const STUDENT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "probationary", label: "Probationary" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
  { value: "temporary", label: "Temporary" },
  { value: "volunteer", label: "Volunteer" },
  { value: "retired", label: "Retired" },
];

const SECTION_STATUS_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
];

const COURSE_STATUS_OPTIONS = [
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const COURSE_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advance", label: "Advance" },
];

const formatCount = (value: number) => numberFormatter.format(value);

const buildGroupBadge = (loadedItems: number, totalItems: number) =>
  totalItems > loadedItems
    ? `Showing ${formatCount(loadedItems)} of ${formatCount(totalItems)}`
    : `${formatCount(totalItems)} total`;

const formatEmploymentType = (value?: string) =>
  value
    ? value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "N/A";

const formatCourseLevel = (value?: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "N/A";

const humanizeToken = (value?: string) =>
  value
    ? value
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "N/A";

const formatOptionalDate = (value?: string) =>
  value ? formatDateMMMDDYYY(value) : "N/A";

const formatPercent = (value?: number | string | null) => {
  const numericValue = Number(value ?? 0);
  return `${Number.isFinite(numericValue) ? Math.round(numericValue) : 0}%`;
};

const formatGpa = (value?: number | string | null) => {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value);
};

const formatPerformanceProgress = (
  progress?: PerformanceStudentRow["progress"],
) => {
  if (!progress) {
    return "N/A";
  }

  return `${progress.percent}% · ${progress.completedLessons}/${progress.totalLessons} lessons · ${progress.completedAssessments}/${progress.totalAssessments} assessments`;
};

const normalizeSectionCode = (value?: string): string =>
  String(value || "").trim().toLowerCase();

const buildPercent = (value: number, total: number): number =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const clampPercent = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const getFullName = (
  user?: { firstName?: string; lastName?: string } | null,
): string => {
  const name = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  return name || "Unknown";
};

const getInitials = (firstName?: string, lastName?: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}` || "?";

const getUserStatusClassName = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "inactive":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getSectionStatusClassName = (status?: string) => {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "completed":
      return "bg-slate-200 text-slate-800";
    case "upcoming":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getCourseStatusClassName = (status?: string) => {
  switch (status) {
    case "published":
      return "bg-emerald-100 text-emerald-800";
    case "draft":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const getDepartmentName = (row: IStudent): string => {
  const department = row.person?.department;

  if (!department) {
    return "Unassigned";
  }

  if (typeof department === "string") {
    return /^[a-fA-F0-9]{24}$/.test(department) ? "Unassigned" : department;
  }

  return department.name || "Unassigned";
};

const getDirectManagerName = (row: IStudent): string => {
  if (!row.directTo) {
    return "None";
  }

  if (typeof row.directTo === "string") {
    return "Assigned";
  }

  const fullName = `${row.directTo.firstName || ""} ${row.directTo.lastName || ""}`.trim();
  return fullName || "Assigned";
};

const getRiskLevelClassName = (value?: string) => {
  switch ((value || "").toLowerCase()) {
    case "critical":
      return "bg-rose-100 text-rose-800";
    case "moderate":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-emerald-100 text-emerald-800";
  }
};

const getStandingLabel = (value?: string, isCorporate?: boolean) => {
  if (!value) {
    return "N/A";
  }

  if (!isCorporate) {
    return value;
  }

  switch (value.toLowerCase()) {
    case "probation":
      return "At Risk";
    case "warning":
      return "Needs Improvement";
    default:
      return "On Track";
  }
};

const getStandingClassName = (value?: string) => {
  switch ((value || "").toLowerCase()) {
    case "probation":
      return "text-rose-700";
    case "warning":
      return "text-amber-700";
    default:
      return "text-emerald-700";
  }
};

const getBatchStatusClassName = (value: BatchProgressRow["status"]) => {
  switch (value) {
    case "completed":
      return "bg-emerald-100 text-emerald-800";
    case "in_progress":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

const batchStatusLabelMap: Record<BatchProgressRow["status"], string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

const extractPerformanceStudents = (payload: unknown): PerformanceStudentRow[] => {
  const source = payload as
    | {
        students?: PerformanceStudentRow[];
        data?: { students?: PerformanceStudentRow[] };
      }
    | undefined;

  if (Array.isArray(source?.students)) {
    return source.students;
  }

  if (Array.isArray(source?.data?.students)) {
    return source.data.students;
  }

  return [];
};

const extractCompletionSections = (payload: unknown): CompletionSection[] => {
  const source = payload as
    | {
        sections?: CompletionSection[];
        documents?: CompletionSection[];
        data?: {
          sections?: CompletionSection[];
          documents?: CompletionSection[];
        };
      }
    | undefined;

  if (Array.isArray(source?.sections)) {
    return source.sections;
  }

  if (Array.isArray(source?.documents)) {
    return source.documents;
  }

  if (Array.isArray(source?.data?.sections)) {
    return source.data.sections;
  }

  if (Array.isArray(source?.data?.documents)) {
    return source.data.documents;
  }

  return [];
};

const buildBatchProgressRows = (
  sections: CompletionSection[],
  performanceStudents: PerformanceStudentRow[],
): BatchProgressRow[] => {
  const performanceByAssignment = new Map<string, PerformanceStudentRow>();

  performanceStudents.forEach((student) => {
    const studentId = String(student._id || "").trim();
    const sectionCode = normalizeSectionCode(student.section);

    if (!studentId || !sectionCode) {
      return;
    }

    performanceByAssignment.set(`${studentId}:${sectionCode}`, student);
  });

  return sections
    .map((section) => {
      const batchCode = String(section.code || "");
      const batchName = String(section.name || "Unnamed Batch");
      const learners = Array.isArray(section.students) ? section.students : [];
      const modules = Array.isArray(section.modules) ? section.modules : [];
      const modulesWithLessons = modules.filter(
        (module) => Array.isArray(module.lessons) && module.lessons.length > 0,
      );

      const totalLessonsPerLearner = modulesWithLessons.reduce((sum, module) => {
        const lessons = Array.isArray(module.lessons) ? module.lessons : [];
        return sum + lessons.length;
      }, 0);

      let completedLessons = 0;
      let totalLessons = 0;
      let completedAssessments = 0;
      let totalAssessments = 0;
      let completionSum = 0;
      let attendanceSum = 0;
      let trackedLearners = 0;
      let completedLearners = 0;

      learners.forEach((learner) => {
        const learnerId = String(learner._id || "");
        if (!learnerId) {
          return;
        }

        trackedLearners += 1;

        const learnerCompletedLessons = modulesWithLessons.reduce((sum, module) => {
          const lessons = Array.isArray(module.lessons) ? module.lessons : [];
          const completedCount = lessons.filter((lesson) =>
            (lesson.progress || []).some(
              (progress) =>
                progress?.status === "completed" &&
                String(progress?.userId || "") === learnerId,
            ),
          ).length;

          return sum + completedCount;
        }, 0);

        completedLessons += learnerCompletedLessons;
        totalLessons += totalLessonsPerLearner;

        const performance = performanceByAssignment.get(
          `${learnerId}:${normalizeSectionCode(batchCode)}`,
        );

        const learnerCompletedAssessments = Number(
          performance?.progress?.completedAssessments || 0,
        );
        const learnerTotalAssessments = Number(
          performance?.progress?.totalAssessments || 0,
        );
        const learnerAttendance = clampPercent(Number(performance?.attendance || 0));

        completedAssessments += learnerCompletedAssessments;
        totalAssessments += learnerTotalAssessments;
        attendanceSum += learnerAttendance;

        const trackedItems = totalLessonsPerLearner + learnerTotalAssessments;
        const completedItems =
          learnerCompletedLessons + learnerCompletedAssessments;
        const learnerCompletion = buildPercent(completedItems, trackedItems);

        completionSum += learnerCompletion;
        if (learnerCompletion >= 100 && trackedItems > 0) {
          completedLearners += 1;
        }
      });

      const averageCompletion =
        trackedLearners > 0 ? clampPercent(completionSum / trackedLearners) : 0;
      const averageAttendance =
        trackedLearners > 0 ? clampPercent(attendanceSum / trackedLearners) : 0;
      const lessonPercent = buildPercent(completedLessons, totalLessons);
      const assessmentPercent = buildPercent(
        completedAssessments,
        totalAssessments,
      );
      const status: BatchProgressRow["status"] =
        trackedLearners > 0 && completedLearners === trackedLearners
          ? "completed"
          : averageCompletion > 0
            ? "in_progress"
            : "not_started";

      return {
        id: section._id,
        batchId: section._id,
        batchCode,
        batchName,
        instructorName: section.instructor
          ? getFullName(section.instructor)
          : "Unassigned Instructor",
        learnerCount: learners.length,
        lessonPercent,
        assessmentPercent,
        averageCompletion,
        averageAttendance,
        completedLearners,
        trackedLearners,
        completedLessons,
        totalLessons,
        completedAssessments,
        totalAssessments,
        status,
      };
    })
    .sort((a, b) => {
      if (b.averageCompletion !== a.averageCompletion) {
        return b.averageCompletion - a.averageCompletion;
      }

      return `${a.batchCode}-${a.batchName}`.localeCompare(
        `${b.batchCode}-${b.batchName}`,
      );
    });
};

interface UseReportExportActionsOptions<Row> {
  rows: Row[];
  currentPageRows?: Row[];
  columns: ReportExportColumn<Row>[];
  filenamePrefix: string;
  sheetName: string;
  pdfTitle: string;
  reportLabel: string;
}

function useReportExportActions<Row>({
  rows,
  currentPageRows,
  columns,
  filenamePrefix,
  sheetName,
  pdfTitle,
  reportLabel,
}: UseReportExportActionsOptions<Row>) {
  const [activeFormat, setActiveFormat] = useState<ReportExportFormat | null>(
    null,
  );

  const runExport = (format: ReportExportFormat, scope: "all" | "current") => {
    void (async () => {
      setActiveFormat(format);
      const selectedRows =
        scope === "current"
          ? currentPageRows && currentPageRows.length > 0
            ? currentPageRows
            : rows.slice(0, REPORT_PAGE_SIZE)
          : rows;
      const scopeLabel = scope === "current" ? "current page" : "all loaded rows";

      try {
        if (format === "excel") {
          await exportRowsToExcel({
            rows: selectedRows,
            columns,
            filenamePrefix,
            sheetName,
            pdfTitle,
            toastMessages: {
              pending: `Exporting ${scopeLabel} of ${reportLabel} to Excel...`,
              success: `${scopeLabel} of ${reportLabel} exported to Excel`,
              error: `Failed to export ${scopeLabel} of ${reportLabel} to Excel`,
            },
          });

          return;
        }

        await exportRowsToPdf({
          rows: selectedRows,
          columns,
          filenamePrefix,
          sheetName,
          pdfTitle,
          toastMessages: {
            pending: `Exporting ${scopeLabel} of ${reportLabel} to PDF...`,
            success: `${scopeLabel} of ${reportLabel} exported to PDF`,
            error: `Failed to export ${scopeLabel} of ${reportLabel} to PDF`,
          },
        });
      } finally {
        setActiveFormat(null);
      }
    })();
  };

  return {
    exportExcelCurrentPage: () => runExport("excel", "current"),
    exportExcelAllRows: () => runExport("excel", "all"),
    exportPdfCurrentPage: () => runExport("pdf", "current"),
    exportPdfAllRows: () => runExport("pdf", "all"),
    isExportingExcel: activeFormat === "excel",
    isExportingPdf: activeFormat === "pdf",
  };
}

function useCurrentVisibleRows<Row>() {
  const [currentPageRows, setCurrentPageRows] = useState<Row[]>([]);

  const handleVisibleRowsChange = useCallback(
    (rowsByGroup: Record<string, Row[]>) => {
      const firstGroupRows = Object.values(rowsByGroup)[0] || [];
      setCurrentPageRows((previousRows) => {
        if (
          previousRows.length === firstGroupRows.length &&
          previousRows.every((row, index) => row === firstGroupRows[index])
        ) {
          return previousRows;
        }
        return firstGroupRows;
      });
    },
    [],
  );

  return {
    currentPageRows,
    handleVisibleRowsChange,
  };
}

function ReportTabButton({
  id,
  label,
  description,
  icon,
  isActive,
  onClick,
}: ReportTabButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      title={description}
      aria-label={`${label}. ${description}`}
      className={`inline-flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
        isActive
          ? "border-primary/25 bg-[color-mix(in_srgb,var(--color-primary)_10%,white_90%)] text-slate-900 shadow-sm"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
      }`}
      aria-pressed={isActive}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isActive
            ? "bg-white text-primary"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 text-sm font-medium">{label}</span>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-primary" : "bg-slate-300"
        }`}
        aria-hidden="true"
      />
    </button>
  );
}

function ReportPanelShell({
  title,
  description: _description,
  totalLabel,
  note: _note,
  isExportingExcel = false,
  isExportingPdf = false,
  onExportExcelCurrentPage,
  onExportExcelAllRows,
  onExportPdfCurrentPage,
  onExportPdfAllRows,
  onOpenPage,
  openPageLabel = "Open Source Page",
  children,
}: ReportPanelShellProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActionMenuOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (actionMenuRef.current?.contains(target)) return;
      setIsActionMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isActionMenuOpen]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-5 py-5 lg:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {title}
              </h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                {totalLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 xl:mt-0 xl:justify-end">
          <div className="relative" ref={actionMenuRef}>
            <Button
              variant={isActionMenuOpen ? "outline" : "primary"}
              onClick={() => setIsActionMenuOpen((previous) => !previous)}
              className="h-10 shrink-0 !rounded-xl !px-4"
            >
              <PanelLeft
                size={15}
                animate={isActionMenuOpen ? "default" : false}
                animateOnHover
              />
              <span className="sr-only">Toggle report action menu</span>
            </Button>

            {isActionMenuOpen ? (
              <div className="absolute right-0 top-12 z-30 w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.5)]">
                <div className="grid gap-2">
                  {onOpenPage ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        onOpenPage();
                      }}
                      className="h-10 w-full justify-start whitespace-nowrap !rounded-xl !px-4 !py-2 text-sm"
                    >
                      {openPageLabel}
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onExportExcelCurrentPage();
                    }}
                    className="h-10 w-full justify-start whitespace-nowrap !rounded-xl !px-4 !py-2 text-sm"
                    isLoading={isExportingExcel}
                    isLoadingText="Exporting..."
                  >
                    <FiDownload size={16} />
                    Export Current Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onExportExcelAllRows();
                    }}
                    className="h-10 w-full justify-start whitespace-nowrap !rounded-xl !px-4 !py-2 text-sm"
                    isLoading={isExportingExcel}
                    isLoadingText="Exporting..."
                  >
                    <FiDownload size={16} />
                    Export All
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onExportPdfCurrentPage();
                    }}
                    className="h-10 w-full justify-start whitespace-nowrap !rounded-xl !px-4 !py-2 text-sm"
                    isLoading={isExportingPdf}
                    isLoadingText="Exporting..."
                  >
                    <FiDownload size={16} />
                    Export PDF Current Page
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsActionMenuOpen(false);
                      onExportPdfAllRows();
                    }}
                    className="h-10 w-full justify-start whitespace-nowrap !rounded-xl !px-4 !py-2 text-sm"
                    isLoading={isExportingPdf}
                    isLoadingText="Exporting..."
                  >
                    <FiDownload size={16} />
                    Export PDF All
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="px-5 py-5 lg:px-6">{children}</div>
    </section>
  );
}

function StudentReportTab({
  orgId,
  orgCode,
  orgType,
  learnerTerm,
  learnersTerm,
}: StudentReportProps) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useSearchStudents({
    limit: REPORT_TABLE_LIMIT,
    skip: 0,
    filter: { key: "role", value: "student" },
    organizationId: orgId,
    archiveStatus: "none",
  });

  const rows = useMemo(
    () =>
      ((data?.students || []).filter(
        (student: any) => student.role === "student",
      ) as IStudent[]),
    [data?.students],
  );
  const totalItems = Number(data?.pagination?.totalItems || rows.length);
  const note =
    totalItems > rows.length
      ? `Preview is limited to the first ${formatCount(rows.length)} active records loaded into this tab.`
      : undefined;

  const columns = useMemo((): GroupedTableColumn<IStudent>[] => {
    const baseColumns: GroupedTableColumn<IStudent>[] = [
      {
        key: "name",
        label: `${learnerTerm} Name`,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
        sortAccessor: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        filterAccessor: (row) =>
          `${row.firstName || ""} ${row.lastName || ""} ${row.email || ""}`.trim(),
        className: "min-w-[280px]",
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={`${row.firstName} ${row.lastName} avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {getInitials(row.firstName, row.lastName)}
              </span>
            )}
            <div>
              <div className="font-medium text-slate-900">
                {`${row.firstName} ${row.lastName}`}
              </div>
              <div className="text-xs text-slate-500">{row.email}</div>
            </div>
          </div>
        ),
      },
    ];

    if (orgType === "school") {
      baseColumns.push(
        {
          key: "studentId",
          label: `${learnerTerm} ID`,
          sortable: true,
          filterable: true,
          filterPlaceholder: `Search ${learnerTerm.toLowerCase()} ID`,
          sortAccessor: (row) => row.studentId || "",
          filterAccessor: (row) => row.studentId || "",
          className: "min-w-[170px] hidden md:table-cell",
          render: (row) => (
            <span className="font-medium text-slate-700">
              {row.studentId || "N/A"}
            </span>
          ),
        },
        {
          key: "program",
          label: "Program",
          sortable: true,
          filterable: true,
          filterPlaceholder: "Search program",
          sortAccessor: (row) =>
            (((row as any).program?.code || row.program?.name || "") as string),
          filterAccessor: (row) =>
            `${(row as any).program?.code || ""} ${row.program?.name || ""}`.trim(),
          className: "min-w-[180px] hidden md:table-cell",
          render: (row) => (
            <span className="text-sm text-slate-700">
              {(row as any).program?.code || row.program?.name || "N/A"}
            </span>
          ),
        },
      );
    } else {
      baseColumns.push(
        {
          key: "department",
          label: "Department",
          sortable: true,
          filterable: true,
          filterPlaceholder: "Search department",
          sortAccessor: (row) => getDepartmentName(row),
          filterAccessor: (row) => getDepartmentName(row),
          className: "min-w-[180px] hidden md:table-cell",
          render: (row) => (
            <span className="text-sm text-slate-700">{getDepartmentName(row)}</span>
          ),
        },
        {
          key: "tag",
          label: "Tag",
          sortable: true,
          filterable: true,
          filterVariant: "select",
          filterSelectAllLabel: "All Tags",
          filterOptions: [
            { value: "manager", label: "Manager" },
            { value: "employee", label: "Employee" },
          ],
          sortAccessor: (row) => (row.subrole === "manager" ? "manager" : "employee"),
          filterAccessor: (row) =>
            row.subrole === "manager" ? "manager" : "employee",
          className: "min-w-[130px] hidden md:table-cell",
          render: (row) => (
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                row.subrole === "manager"
                  ? "bg-indigo-100 text-indigo-800"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {row.subrole === "manager" ? "Manager" : "Employee"}
            </span>
          ),
        },
        {
          key: "directTo",
          label: "Direct To",
          sortable: true,
          filterable: true,
          filterPlaceholder: "Search manager",
          sortAccessor: (row) => getDirectManagerName(row),
          filterAccessor: (row) => getDirectManagerName(row),
          className: "min-w-[200px] hidden md:table-cell",
          render: (row) => (
            <span className="text-sm text-slate-700">{getDirectManagerName(row)}</span>
          ),
        },
      );
    }

    baseColumns.push(
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterOptions: STUDENT_STATUS_OPTIONS,
        sortAccessor: (row) => row.status || "",
        filterAccessor: (row) => row.status || "",
        className: "min-w-[130px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getUserStatusClassName(row.status)}`}
          >
            {row.status
              ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
              : "N/A"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/${orgCode}/admin/student/${row._id}`)}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            View Details
          </button>
        ),
      },
    );

    return baseColumns;
  }, [learnerTerm, navigate, orgCode, orgType]);

  const groups = useMemo(
    (): GroupedTableGroup<IStudent>[] => [
      {
        key: "students-report",
        title: learnersTerm,
        rows,
        badgeText: buildGroupBadge(rows.length, totalItems),
      },
    ],
    [learnersTerm, rows, totalItems],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<IStudent>();

  const exportColumns = useMemo((): ReportExportColumn<IStudent>[] => {
    const baseColumns: ReportExportColumn<IStudent>[] = [
      {
        label: `${learnerTerm} Name`,
        value: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      },
      {
        label: "Email",
        value: (row) => row.email || "N/A",
      },
    ];

    if (orgType === "school") {
      baseColumns.push(
        {
          label: `${learnerTerm} ID`,
          value: (row) => row.studentId || "N/A",
        },
        {
          label: "Program",
          value: (row) => (row as any).program?.code || row.program?.name || "N/A",
        },
      );
    } else {
      baseColumns.push(
        {
          label: "Department",
          value: (row) => getDepartmentName(row),
        },
        {
          label: "Tag",
          value: (row) => (row.subrole === "manager" ? "Manager" : "Employee"),
        },
        {
          label: "Direct To",
          value: (row) => getDirectManagerName(row),
        },
      );
    }

    baseColumns.push({
      label: "Status",
      value: (row) =>
        row.status
          ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
          : "N/A",
    });

    return baseColumns;
  }, [learnerTerm, orgType]);

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-students",
    sheetName: learnersTerm,
    pdfTitle: `${learnersTerm} Report`,
    reportLabel: `${learnersTerm.toLowerCase()} report`,
  });

  return (
    <ReportPanelShell
      title={`${learnersTerm} Report`}
      description={`Review the active ${learnersTerm.toLowerCase()} directory in table form, filter columns directly in the datatable, and export the rows loaded in this report to Excel or PDF.`}
      totalLabel={`${formatCount(totalItems)} active ${learnersTerm.toLowerCase()}`}
      note={note}
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/student`)}
    >
      {isPending ? (
        <TableSkeletonClean
          columns={
            orgType === "school"
              ? [
                  { width: "32%", hasAvatar: true },
                  { width: "18%" },
                  { width: "18%" },
                  { width: "14%" },
                  { width: "12%", alignment: "right" },
                ]
              : [
                  { width: "30%", hasAvatar: true },
                  { width: "18%" },
                  { width: "12%" },
                  { width: "18%" },
                  { width: "12%" },
                  { width: "10%", alignment: "right" },
                ]
          }
          rows={5}
        />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the {learnersTerm.toLowerCase()} report.
        </div>
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="student"
          title={`No ${learnersTerm} found`}
          description={`There are no active ${learnersTerm.toLowerCase()} available for this report.`}
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => row._id}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName={
            orgType === "school" ? "min-w-[1100px]" : "min-w-[1180px]"
          }
          emptyFilteredText={`No matching ${learnersTerm.toLowerCase()} found.`}
        />
      )}
    </ReportPanelShell>
  );
}

function InstructorReportTab({
  orgId,
  orgCode,
  orgType,
  instructorTerm,
  instructorsTerm,
}: InstructorReportProps) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useSearchInstructors({
    limit: REPORT_TABLE_LIMIT,
    skip: 0,
    organizationId: orgId,
    archiveStatus: "none",
  });

  const rows = useMemo(
    () => ((data?.instructors || []) as IInstructor[]),
    [data?.instructors],
  );
  const totalItems = Number(data?.pagination?.totalItems || rows.length);
  const note =
    totalItems > rows.length
      ? `Preview is limited to the first ${formatCount(rows.length)} active records loaded into this tab.`
      : undefined;

  const columns = useMemo((): GroupedTableColumn<IInstructor>[] => {
    const baseColumns: GroupedTableColumn<IInstructor>[] = [
      {
        key: "name",
        label: `${instructorTerm} Name`,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${instructorTerm.toLowerCase()}`,
        sortAccessor: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        filterAccessor: (row) =>
          `${row.firstName || ""} ${row.lastName || ""} ${row.email || ""}`.trim(),
        className: "min-w-[280px]",
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={`${row.firstName} ${row.lastName} avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {getInitials(row.firstName, row.lastName)}
              </span>
            )}
            <div>
              <div className="font-medium text-slate-900">
                {`${row.firstName} ${row.lastName}`}
              </div>
              <div className="text-xs text-slate-500">{row.email}</div>
            </div>
          </div>
        ),
      },
    ];

    if (orgType === "school") {
      baseColumns.push({
        key: "faculty",
        label: "Faculty",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search faculty",
        sortAccessor: (row) =>
          row.faculty ? (typeof row.faculty === "string" ? row.faculty : row.faculty.name) : "",
        filterAccessor: (row) =>
          row.faculty ? (typeof row.faculty === "string" ? row.faculty : row.faculty.name) : "",
        className: "min-w-[180px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {row.faculty
              ? typeof row.faculty === "string"
                ? row.faculty
                : row.faculty.name
              : "N/A"}
          </span>
        ),
      });
    }

    baseColumns.push(
      {
        key: "employmentType",
        label: "Type",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Types",
        filterOptions: EMPLOYMENT_TYPE_OPTIONS,
        sortAccessor: (row) => row.employmentType || "",
        filterAccessor: (row) => row.employmentType || "",
        className: "min-w-[170px]",
        render: (row) => (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {formatEmploymentType(row.employmentType)}
          </span>
        ),
      },
      {
        key: "createdAt",
        label: "Created At",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search date",
        sortAccessor: (row) => new Date(row.createdAt || 0).getTime(),
        filterAccessor: (row) => formatDateMMMDDYYY(row.createdAt),
        className: "min-w-[150px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {formatDateMMMDDYYY(row.createdAt)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/${orgCode}/admin/instructor/${row._id}`)}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            View Details
          </button>
        ),
      },
    );

    return baseColumns;
  }, [instructorTerm, navigate, orgCode, orgType]);

  const groups = useMemo(
    (): GroupedTableGroup<IInstructor>[] => [
      {
        key: "instructors-report",
        title: instructorsTerm,
        rows,
        badgeText: buildGroupBadge(rows.length, totalItems),
      },
    ],
    [instructorsTerm, rows, totalItems],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<IInstructor>();

  const exportColumns = useMemo((): ReportExportColumn<IInstructor>[] => {
    const baseColumns: ReportExportColumn<IInstructor>[] = [
      {
        label: `${instructorTerm} Name`,
        value: (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      },
      {
        label: "Email",
        value: (row) => row.email || "N/A",
      },
    ];

    if (orgType === "school") {
      baseColumns.push({
        label: "Faculty",
        value: (row) =>
          row.faculty
            ? typeof row.faculty === "string"
              ? row.faculty
              : row.faculty.name
            : "N/A",
      });
    }

    baseColumns.push(
      {
        label: "Type",
        value: (row) => formatEmploymentType(row.employmentType),
      },
      {
        label: "Created At",
        value: (row) => formatOptionalDate(row.createdAt),
      },
    );

    return baseColumns;
  }, [instructorTerm, orgType]);

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-instructors",
    sheetName: instructorsTerm,
    pdfTitle: `${instructorsTerm} Report`,
    reportLabel: "instructor report",
  });

  return (
    <ReportPanelShell
      title={`${instructorsTerm} Report`}
      description={`Inspect the active ${instructorsTerm.toLowerCase()} directory in datatable format and export the rows loaded in this report to Excel or PDF.`}
      totalLabel={`${formatCount(totalItems)} active ${instructorsTerm.toLowerCase()}`}
      note={note}
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/instructor`)}
    >
      {isPending ? (
        <TableSkeletonClean
          columns={
            orgType === "school"
              ? [
                  { width: "34%", hasAvatar: true },
                  { width: "20%" },
                  { width: "18%" },
                  { width: "16%" },
                  { width: "12%", alignment: "right" },
                ]
              : [
                  { width: "38%", hasAvatar: true },
                  { width: "22%" },
                  { width: "18%" },
                  { width: "12%", alignment: "right" },
                ]
          }
          rows={5}
        />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the {instructorsTerm.toLowerCase()} report.
        </div>
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="instructor"
          title={`No ${instructorsTerm} found`}
          description={`There are no active ${instructorsTerm.toLowerCase()} available for this report.`}
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => row._id}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName={
            orgType === "school" ? "min-w-[1080px]" : "min-w-[980px]"
          }
          emptyFilteredText={`No matching ${instructorsTerm.toLowerCase()} found.`}
        />
      )}
    </ReportPanelShell>
  );
}

function SectionReportTab({
  orgId,
  orgCode,
  learnerTerm,
  sectionTerm,
  sectionsTerm,
  instructorTerm,
}: SectionReportProps) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useAdminSections({
    limit: REPORT_TABLE_LIMIT,
    skip: 0,
    filters: [{ key: "organizationId", value: orgId }],
    archiveStatus: "none",
  });

  const rows = useMemo(() => (data?.sections || []) as ISection[], [data?.sections]);
  const totalItems = Number(data?.pagination?.totalItems || rows.length);
  const note =
    totalItems > rows.length
      ? `Preview is limited to the first ${formatCount(rows.length)} active records loaded into this tab.`
      : undefined;

  const columns = useMemo(
    (): GroupedTableColumn<ISection>[] => [
      {
        key: "code",
        label: `${sectionTerm} Code`,
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search code",
        sortAccessor: (row) => row.code || "",
        filterAccessor: (row) => row.code || "",
        className: "min-w-[160px] hidden md:table-cell",
        render: (row) => <span className="font-semibold text-slate-900">{row.code}</span>,
      },
      {
        key: "name",
        label: "Name",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search name",
        sortAccessor: (row) => row.name || "",
        filterAccessor: (row) =>
          `${row.name || ""} ${row.code || ""} ${row.course?.title || ""} ${
            row.instructor
              ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
              : ""
          }`.trim(),
        className: "min-w-[260px]",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{row.name}</span>
            <span className="text-xs text-slate-500 md:hidden">{row.code}</span>
          </div>
        ),
      },
      {
        key: "instructor",
        label: instructorTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${instructorTerm.toLowerCase()}`,
        sortAccessor: (row) =>
          row.instructor
            ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
            : "",
        filterAccessor: (row) =>
          row.instructor
            ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
            : "",
        className: "min-w-[220px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {row.instructor
              ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
              : "N/A"}
          </span>
        ),
      },
      {
        key: "course",
        label: "Course",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search course",
        sortAccessor: (row) => row.course?.title || "",
        filterAccessor: (row) => row.course?.title || "",
        className: "min-w-[220px]",
        render: (row) => (
          <span className="text-sm text-slate-700">{row.course?.title || "N/A"}</span>
        ),
      },
      {
        key: "students",
        label: `Total ${learnerTerm}`,
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) => row.totalStudent || 0,
        filterAccessor: (row) => String(row.totalStudent || 0),
        className: "min-w-[150px]",
        render: (row) => (
          <span className="text-sm font-medium text-slate-700">
            {formatCount(row.totalStudent || 0)}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterOptions: SECTION_STATUS_OPTIONS,
        sortAccessor: (row) => row.status || "",
        filterAccessor: (row) => row.status || "",
        className: "min-w-[130px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getSectionStatusClassName(row.status)}`}
          >
            {row.status
              ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
              : "N/A"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/${orgCode}/admin/section/${row.code}`)}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Open {sectionTerm}
          </button>
        ),
      },
    ],
    [instructorTerm, learnerTerm, navigate, orgCode, sectionTerm],
  );

  const groups = useMemo(
    (): GroupedTableGroup<ISection>[] => [
      {
        key: "sections-report",
        title: sectionsTerm,
        rows,
        badgeText: buildGroupBadge(rows.length, totalItems),
      },
    ],
    [rows, sectionsTerm, totalItems],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<ISection>();

  const exportColumns = useMemo((): ReportExportColumn<ISection>[] => {
    return [
      {
        label: `${sectionTerm} Code`,
        value: (row) => row.code || "N/A",
      },
      {
        label: "Name",
        value: (row) => row.name || "N/A",
      },
      {
        label: instructorTerm,
        value: (row) =>
          row.instructor
            ? `${row.instructor.firstName || ""} ${row.instructor.lastName || ""}`.trim()
            : "N/A",
      },
      {
        label: "Course",
        value: (row) => row.course?.title || "N/A",
      },
      {
        label: `Total ${learnerTerm}`,
        value: (row) => row.totalStudent || 0,
      },
      {
        label: "Status",
        value: (row) =>
          row.status
            ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
            : "N/A",
      },
    ];
  }, [instructorTerm, learnerTerm, sectionTerm]);

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-sections",
    sheetName: sectionsTerm,
    pdfTitle: `${sectionsTerm} Report`,
    reportLabel: `${sectionsTerm.toLowerCase()} report`,
  });

  return (
    <ReportPanelShell
      title={`${sectionsTerm} Report`}
      description={`Use this report tab to review active ${sectionsTerm.toLowerCase()}, filter by code, course, instructor, status, and export the rows loaded in this report to Excel or PDF.`}
      totalLabel={`${formatCount(totalItems)} active ${sectionsTerm.toLowerCase()}`}
      note={note}
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/section`)}
    >
      {isPending ? (
        <TableSkeletonClean
          columns={[
            { width: "16%" },
            { width: "26%" },
            { width: "20%" },
            { width: "20%" },
            { width: "10%" },
            { width: "8%", alignment: "right" },
          ]}
          rows={5}
        />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the {sectionsTerm.toLowerCase()} report.
        </div>
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="section"
          title={`No ${sectionsTerm} found`}
          description={`There are no active ${sectionsTerm.toLowerCase()} available for this report.`}
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => row._id || row.code}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName="min-w-[1180px]"
          emptyFilteredText={`No matching ${sectionsTerm.toLowerCase()} found.`}
        />
      )}
    </ReportPanelShell>
  );
}

function CourseReportTab({ orgId, orgCode, isCorporate }: CourseReportProps) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useCourses({
    limit: REPORT_TABLE_LIMIT,
    skip: 0,
    organizationId: orgId,
    archiveStatus: "none",
  });

  const rows = useMemo(() => ((data?.courses || []) as CourseRow[]), [data?.courses]);
  const totalItems = Number(data?.pagination?.totalItems || rows.length);
  const note =
    totalItems > rows.length
      ? `Preview is limited to the first ${formatCount(rows.length)} active records loaded into this tab.`
      : undefined;

  const columns = useMemo((): GroupedTableColumn<CourseRow>[] => {
    const baseColumns: GroupedTableColumn<CourseRow>[] = [
      {
        key: "code",
        label: "Course Code",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search code",
        sortAccessor: (row) => row.code || "",
        filterAccessor: (row) => row.code || "",
        className: "min-w-[150px] hidden md:table-cell",
        render: (row) => <span className="font-semibold text-slate-900">{row.code}</span>,
      },
      {
        key: "title",
        label: "Course",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search course",
        sortAccessor: (row) => row.title || "",
        filterAccessor: (row) =>
          `${row.title || ""} ${row.code || ""} ${row.category?.name || ""}`.trim(),
        className: "min-w-[280px]",
        render: (row) => (
          <div className="flex flex-col">
            <span className="font-medium text-slate-900">{row.title}</span>
            <span className="text-xs text-slate-500 md:hidden">{row.code}</span>
          </div>
        ),
      },
    ];

    if (!isCorporate) {
      baseColumns.push({
        key: "category",
        label: "Category",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search category",
        sortAccessor: (row) => row.category?.name || "",
        filterAccessor: (row) => row.category?.name || "",
        className: "min-w-[180px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">{row.category?.name || "N/A"}</span>
        ),
      });
    }

    baseColumns.push(
      {
        key: "level",
        label: "Level",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Levels",
        filterOptions: COURSE_LEVEL_OPTIONS,
        sortAccessor: (row) => row.level || "",
        filterAccessor: (row) => row.level || "",
        className: "min-w-[140px]",
        render: (row) => (
          <span className="text-sm text-slate-700">{formatCourseLevel(row.level)}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterOptions: COURSE_STATUS_OPTIONS,
        sortAccessor: (row) => row.status || "",
        filterAccessor: (row) => row.status || "",
        className: "min-w-[130px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getCourseStatusClassName(row.status)}`}
          >
            {row.status
              ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
              : "N/A"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() =>
              navigate({
                pathname: `/${orgCode}/admin/course`,
                search: `modal=view-course&id=${row._id}`,
              })
            }
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Open Course
          </button>
        ),
      },
    );

    return baseColumns;
  }, [isCorporate, navigate, orgCode]);

  const groups = useMemo(
    (): GroupedTableGroup<CourseRow>[] => [
      {
        key: "courses-report",
        title: "Courses",
        rows,
        badgeText: buildGroupBadge(rows.length, totalItems),
      },
    ],
    [rows, totalItems],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<CourseRow>();

  const exportColumns = useMemo((): ReportExportColumn<CourseRow>[] => {
    const baseColumns: ReportExportColumn<CourseRow>[] = [
      {
        label: "Course Code",
        value: (row) => row.code || "N/A",
      },
      {
        label: "Course",
        value: (row) => row.title || "N/A",
      },
    ];

    if (!isCorporate) {
      baseColumns.push({
        label: "Category",
        value: (row) => row.category?.name || "N/A",
      });
    }

    baseColumns.push(
      {
        label: "Level",
        value: (row) => formatCourseLevel(row.level),
      },
      {
        label: "Status",
        value: (row) =>
          row.status
            ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
            : "N/A",
      },
    );

    return baseColumns;
  }, [isCorporate]);

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-courses",
    sheetName: "Courses",
    pdfTitle: "Courses Report",
    reportLabel: "course report",
  });

  return (
    <ReportPanelShell
      title="Courses Report"
      description="Browse the course catalog in datatable form, filter by code, title, level, status, and export the rows loaded in this report to Excel or PDF."
      totalLabel={`${formatCount(totalItems)} active courses`}
      note={note}
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/course`)}
    >
      {isPending ? (
        <TableSkeletonClean
          columns={
            isCorporate
              ? [
                  { width: "16%" },
                  { width: "38%" },
                  { width: "18%" },
                  { width: "16%" },
                  { width: "12%", alignment: "right" },
                ]
              : [
                  { width: "14%" },
                  { width: "30%" },
                  { width: "18%" },
                  { width: "14%" },
                  { width: "14%" },
                  { width: "10%", alignment: "right" },
                ]
          }
          rows={5}
        />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the course report.
        </div>
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="course"
          title="No courses found"
          description="There are no active courses available for this report."
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => row._id}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName={
            isCorporate ? "min-w-[980px]" : "min-w-[1120px]"
          }
          emptyFilteredText="No matching courses found."
        />
      )}
    </ReportPanelShell>
  );
}

function PerformanceReportTab({
  orgCode,
  learnerTerm,
  learnersTerm,
  sectionTerm,
  isCorporate,
}: PerformanceReportProps) {
  const navigate = useNavigate();
  const { data, isPending, isError } = useGetPerformanceDashboard();

  const rows = useMemo(() => extractPerformanceStudents(data), [data]);

  const columns = useMemo((): GroupedTableColumn<PerformanceStudentRow>[] => {
    return [
      {
        key: "name",
        label: learnerTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
        sortAccessor: (row) => row.name || "",
        filterAccessor: (row) => `${row.name || ""} ${row.email || ""}`.trim(),
        className: "min-w-[260px]",
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.avatar ? (
              <img
                src={row.avatar}
                alt={`${row.name} avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {row.name?.[0] || "?"}
              </span>
            )}
            <div>
              <div className="font-medium text-slate-900">{row.name}</div>
              <div className="text-xs text-slate-500">{row.email}</div>
            </div>
          </div>
        ),
      },
      {
        key: "section",
        label: sectionTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${sectionTerm.toLowerCase()}`,
        sortAccessor: (row) => row.section || "",
        filterAccessor: (row) => row.section || "",
        className: "min-w-[180px]",
        render: (row) => <span className="text-sm text-slate-700">{row.section || "N/A"}</span>,
      },
      {
        key: "gpa",
        label: "GPA",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search GPA",
        sortAccessor: (row) => Number(row.gpa || 0),
        filterAccessor: (row) => formatGpa(row.gpa),
        className: "min-w-[110px]",
        render: (row) => (
          <span className="font-semibold text-slate-700">{formatGpa(row.gpa)}</span>
        ),
      },
      {
        key: "attendance",
        label: "Attendance",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search attendance",
        sortAccessor: (row) => Number(row.attendance || 0),
        filterAccessor: (row) => formatPercent(row.attendance),
        className: "min-w-[120px]",
        render: (row) => (
          <span className="text-sm text-slate-700">{formatPercent(row.attendance)}</span>
        ),
      },
      {
        key: "progress",
        label: "Progress",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search progress",
        sortAccessor: (row) => Number(row.progress?.percent || 0),
        filterAccessor: (row) => formatPerformanceProgress(row.progress),
        className: "min-w-[240px]",
        render: (row) =>
          row.progress ? (
            <div>
              <div className="font-medium text-slate-700">
                {formatPercent(row.progress.percent)}
              </div>
              <div className="text-xs text-slate-500">
                {row.progress.completedLessons}/{row.progress.totalLessons} lessons ·{" "}
                {row.progress.completedAssessments}/
                {row.progress.totalAssessments} assessments
              </div>
            </div>
          ) : (
            <span className="text-sm text-slate-500">N/A</span>
          ),
      },
      {
        key: "compliance",
        label: "Compliance",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search compliance",
        sortAccessor: (row) => Number(row.complianceScore || 0),
        filterAccessor: (row) => formatPercent(row.complianceScore),
        className: "min-w-[130px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {typeof row.complianceScore === "number"
              ? formatPercent(row.complianceScore)
              : "N/A"}
          </span>
        ),
      },
      {
        key: "standing",
        label: isCorporate ? "Performance Status" : "Standing",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search standing",
        sortAccessor: (row) => row.standing || "",
        filterAccessor: (row) => getStandingLabel(row.standing, isCorporate),
        className: "min-w-[160px]",
        render: (row) => (
          <span className={`text-sm font-medium ${getStandingClassName(row.standing)}`}>
            {getStandingLabel(row.standing, isCorporate)}
          </span>
        ),
      },
      {
        key: "riskLevel",
        label: "Risk",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search risk",
        sortAccessor: (row) => row.riskLevel || "",
        filterAccessor: (row) => row.riskLevel || "",
        className: "min-w-[130px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRiskLevelClassName(row.riskLevel)}`}
          >
            {row.riskLevel || "N/A"}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/${orgCode}/admin/student/${row._id}`)}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            View Details
          </button>
        ),
      },
    ];
  }, [isCorporate, learnerTerm, navigate, orgCode, sectionTerm]);

  const groups = useMemo(
    (): GroupedTableGroup<PerformanceStudentRow>[] => [
      {
        key: "performance-report",
        title: "Performance",
        rows,
        badgeText: `${formatCount(rows.length)} total`,
      },
    ],
    [rows],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<PerformanceStudentRow>();

  const exportColumns = useMemo(
    (): ReportExportColumn<PerformanceStudentRow>[] => [
      {
        label: learnerTerm,
        value: (row) => row.name || "N/A",
      },
      {
        label: "Email",
        value: (row) => row.email || "N/A",
      },
      {
        label: sectionTerm,
        value: (row) => row.section || "N/A",
      },
      {
        label: "GPA",
        value: (row) => formatGpa(row.gpa),
      },
      {
        label: "Attendance",
        value: (row) => formatPercent(row.attendance),
      },
      {
        label: "Progress",
        value: (row) => formatPerformanceProgress(row.progress),
      },
      {
        label: "Compliance",
        value: (row) =>
          typeof row.complianceScore === "number"
            ? formatPercent(row.complianceScore)
            : "N/A",
      },
      {
        label: isCorporate ? "Performance Status" : "Standing",
        value: (row) => getStandingLabel(row.standing, isCorporate),
      },
      {
        label: "Risk Level",
        value: (row) => row.riskLevel || "N/A",
      },
    ],
    [isCorporate, learnerTerm, sectionTerm],
  );

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-performance",
    sheetName: "Performance",
    pdfTitle: "Performance Report",
    reportLabel: "performance report",
  });

  return (
    <ReportPanelShell
      title="Performance Report"
      description={`Track ${learnersTerm.toLowerCase()} performance, attendance, progress, standing, and risk level in one datatable, then export the loaded rows to Excel or PDF.`}
      totalLabel={`${formatCount(rows.length)} tracked ${learnersTerm.toLowerCase()}`}
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/completion`)}
      openPageLabel="Open Progress Page"
    >
      {isPending ? (
        <TableSkeletonClean
          columns={[
            { width: "24%", hasAvatar: true },
            { width: "14%" },
            { width: "9%" },
            { width: "10%" },
            { width: "18%" },
            { width: "10%" },
            { width: "8%" },
            { width: "7%", alignment: "right" },
          ]}
          rows={5}
        />
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the performance report.
        </div>
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="student"
          title={`No ${learnersTerm} found`}
          description={`There are no ${learnersTerm.toLowerCase()} available in the performance report.`}
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => `${row._id}-${row.section || "section"}`}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName="min-w-[1360px]"
          emptyFilteredText={`No matching ${learnersTerm.toLowerCase()} found.`}
        />
      )}
    </ReportPanelShell>
  );
}

function IndividualGradesReportTab({
  orgId,
  orgCode,
  learnerTerm,
  learnersTerm,
  sectionTerm,
  sectionsTerm,
}: IndividualGradesReportProps) {
  const navigate = useNavigate();
  const {
    data: sectionData,
    isPending: isSectionsPending,
    isError: isSectionsError,
  } = useAdminSections({
    limit: REPORT_TABLE_LIMIT,
    skip: 0,
    filters: [{ key: "organizationId", value: orgId }],
    archiveStatus: "none",
  });

  const sections = useMemo(
    () =>
      ((sectionData?.sections || []) as ISection[]).filter(
        (section) => typeof section.code === "string" && section.code.trim().length > 0,
      ),
    [sectionData?.sections],
  );
  const totalSections = Number(sectionData?.pagination?.totalItems || sections.length);
  const sectionSignature = useMemo(
    () => sections.map((section) => `${section._id}:${section.code}`).join("|"),
    [sections],
  );

  const {
    data: gradeResults = [],
    isPending: isGradesPending,
    isError: isGradesError,
  } = useQuery({
    queryKey: ["admin-report-individual-grades", orgId, sectionSignature],
    queryFn: async () =>
      Promise.all(
        sections.map(async (section) => {
          try {
            const data = (await studentService.getStudentGradeBySection(
              section.code as string,
            )) as SectionGradesPayload;

            return {
              section,
              data,
              error: null as string | null,
            };
          } catch (error) {
            return {
              section,
              data: null,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load section grades",
            };
          }
        }),
      ),
    enabled: sections.length > 0,
  });

  const rows = useMemo((): IndividualGradeRow[] => {
    return gradeResults.flatMap((result) => {
      const students = result.data?.students || [];

      return students.flatMap((student) => {
        const assessments = Array.isArray(student.assessments)
          ? student.assessments
          : [];

        return assessments.map((assessment) => ({
          id: [
            result.section._id || result.section.code,
            student._id || student.studentId,
            assessment.assessmentId,
            assessment.assessmentNo,
          ].join("-"),
          sectionCode: result.section.code || "N/A",
          sectionName: result.section.name || "Unnamed Section",
          courseTitle: result.section.course?.title || "N/A",
          learnerName: student.fullName || "N/A",
          learnerId: student.studentId || "N/A",
          assessmentLabel: `${humanizeToken(assessment.type)} ${
            assessment.assessmentNo ? `#${assessment.assessmentNo}` : ""
          }`.trim(),
          assessmentType: humanizeToken(assessment.type),
          assessmentNo: Number(assessment.assessmentNo || 0),
          gradeMethod: humanizeToken(assessment.gradeMethod),
          gradeLabel: assessment.gradeLabel || "N/A",
          percentageScore: Number(assessment.percentageScore || 0),
          totalScore: Number(assessment.totalScore || 0),
          totalPoints: Number(assessment.totalPoints || 0),
          dueDate: assessment.dueDate,
          submittedAt: assessment.submittedAt,
        }));
      });
    });
  }, [gradeResults]);

  const failedSectionsCount = useMemo(
    () => gradeResults.filter((result) => result.error).length,
    [gradeResults],
  );

  const loadedSectionsCount = useMemo(
    () => gradeResults.filter((result) => result.data).length,
    [gradeResults],
  );

  const note = useMemo(() => {
    const messages: string[] = [];

    if (totalSections > sections.length) {
      messages.push(
        `Preview is limited to the first ${formatCount(sections.length)} ${sectionsTerm.toLowerCase()} loaded into this tab.`,
      );
    }

    if (failedSectionsCount > 0) {
      messages.push(
        `${formatCount(failedSectionsCount)} ${sectionsTerm.toLowerCase()} could not be loaded for grades.`,
      );
    }

    return messages.join(" ") || undefined;
  }, [failedSectionsCount, sections.length, sectionsTerm, totalSections]);

  const columns = useMemo((): GroupedTableColumn<IndividualGradeRow>[] => {
    return [
      {
        key: "learnerName",
        label: learnerTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
        sortAccessor: (row) => row.learnerName || "",
        filterAccessor: (row) =>
          `${row.learnerName || ""} ${row.learnerId || ""}`.trim(),
        className: "min-w-[240px]",
        render: (row) => (
          <div>
            <div className="font-medium text-slate-900">{row.learnerName}</div>
            <div className="text-xs text-slate-500">{row.learnerId}</div>
          </div>
        ),
      },
      {
        key: "section",
        label: sectionTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${sectionTerm.toLowerCase()}`,
        sortAccessor: (row) => `${row.sectionCode} ${row.sectionName}`.trim(),
        filterAccessor: (row) => `${row.sectionCode} ${row.sectionName}`.trim(),
        className: "min-w-[230px]",
        render: (row) => (
          <div>
            <div className="font-medium text-slate-900">{row.sectionName}</div>
            <div className="text-xs text-slate-500">{row.sectionCode}</div>
          </div>
        ),
      },
      {
        key: "courseTitle",
        label: "Course",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search course",
        sortAccessor: (row) => row.courseTitle || "",
        filterAccessor: (row) => row.courseTitle || "",
        className: "min-w-[220px] hidden md:table-cell",
        render: (row) => <span className="text-sm text-slate-700">{row.courseTitle}</span>,
      },
      {
        key: "assessmentLabel",
        label: "Assessment",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search assessment",
        sortAccessor: (row) => row.assessmentLabel || "",
        filterAccessor: (row) =>
          `${row.assessmentLabel} ${row.gradeMethod}`.trim(),
        className: "min-w-[230px]",
        render: (row) => (
          <div>
            <div className="font-medium text-slate-900">{row.assessmentLabel}</div>
            <div className="text-xs text-slate-500">{row.gradeMethod}</div>
          </div>
        ),
      },
      {
        key: "gradeLabel",
        label: "Result",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search result",
        sortAccessor: (row) => row.percentageScore,
        filterAccessor: (row) => `${row.gradeLabel} ${row.percentageScore}`.trim(),
        className: "min-w-[130px]",
        render: (row) => (
          <div>
            <div className="font-semibold text-slate-700">{row.gradeLabel}</div>
            <div className="text-xs text-slate-500">
              {formatPercent(row.percentageScore)}
            </div>
          </div>
        ),
      },
      {
        key: "score",
        label: "Score",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search score",
        sortAccessor: (row) => row.percentageScore,
        filterAccessor: (row) => `${row.totalScore}/${row.totalPoints}`,
        className: "min-w-[120px]",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {row.totalScore}/{row.totalPoints}
          </span>
        ),
      },
      {
        key: "dueDate",
        label: "Due Date",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search due date",
        sortAccessor: (row) =>
          row.dueDate ? new Date(row.dueDate).getTime() : 0,
        filterAccessor: (row) => formatOptionalDate(row.dueDate),
        className: "min-w-[150px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {formatOptionalDate(row.dueDate)}
          </span>
        ),
      },
      {
        key: "submittedAt",
        label: "Submitted",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search submitted date",
        sortAccessor: (row) =>
          row.submittedAt ? new Date(row.submittedAt).getTime() : 0,
        filterAccessor: (row) => formatOptionalDate(row.submittedAt),
        className: "min-w-[150px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {formatOptionalDate(row.submittedAt)}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/${orgCode}/admin/section/${row.sectionCode}`)}
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Open {sectionTerm}
          </button>
        ),
      },
    ];
  }, [learnerTerm, navigate, orgCode, sectionTerm]);

  const groups = useMemo(
    (): GroupedTableGroup<IndividualGradeRow>[] => [
      {
        key: "grades-report",
        title: "Individual Grades",
        rows,
        badgeText: `${formatCount(rows.length)} total`,
      },
    ],
    [rows],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<IndividualGradeRow>();

  const exportColumns = useMemo(
    (): ReportExportColumn<IndividualGradeRow>[] => [
      {
        label: learnerTerm,
        value: (row) => row.learnerName,
      },
      {
        label: `${learnerTerm} ID`,
        value: (row) => row.learnerId,
      },
      {
        label: sectionTerm,
        value: (row) => `${row.sectionCode} - ${row.sectionName}`.trim(),
      },
      {
        label: "Course",
        value: (row) => row.courseTitle,
      },
      {
        label: "Assessment",
        value: (row) => row.assessmentLabel,
      },
      {
        label: "Grade Method",
        value: (row) => row.gradeMethod,
      },
      {
        label: "Grade",
        value: (row) => row.gradeLabel,
      },
      {
        label: "Percentage",
        value: (row) => formatPercent(row.percentageScore),
      },
      {
        label: "Score",
        value: (row) => `${row.totalScore}/${row.totalPoints}`,
      },
      {
        label: "Due Date",
        value: (row) => formatOptionalDate(row.dueDate),
      },
      {
        label: "Submitted",
        value: (row) => formatOptionalDate(row.submittedAt),
      },
    ],
    [learnerTerm, sectionTerm],
  );

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-individual-grades",
    sheetName: "Individual Grades",
    pdfTitle: "Individual Grades Report",
    reportLabel: "individual grades report",
  });

  return (
    <ReportPanelShell
      title="Individual Grades Report"
      description={`Flatten grade results across the loaded ${sectionsTerm.toLowerCase()} into one datatable, then export the grade entries to Excel or PDF.`}
      totalLabel={`${formatCount(rows.length)} grade entries across ${formatCount(loadedSectionsCount)} loaded ${sectionsTerm.toLowerCase()}`}
      note={note}
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/section`)}
      openPageLabel="Open Sections Page"
    >
      {isSectionsPending || isGradesPending ? (
        <TableSkeletonClean
          columns={[
            { width: "18%" },
            { width: "18%" },
            { width: "16%" },
            { width: "18%" },
            { width: "10%" },
            { width: "10%" },
            { width: "10%" },
          ]}
          rows={6}
        />
      ) : isSectionsError || isGradesError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the individual grades report.
        </div>
      ) : sections.length === 0 ? (
        <TableEmptyState
          type="section"
          title={`No ${sectionsTerm} found`}
          description={`There are no active ${sectionsTerm.toLowerCase()} available for this report.`}
        />
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="student"
          title="No grades found"
          description={`No grade entries were returned from the loaded ${sectionsTerm.toLowerCase()}.`}
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => row.id}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName="min-w-[1480px]"
          emptyFilteredText={`No matching ${learnersTerm.toLowerCase()} grades found.`}
        />
      )}
    </ReportPanelShell>
  );
}

function BatchProgressReportTab({
  orgId,
  orgCode,
  learnersTerm,
  sectionTerm,
  sectionsTerm,
}: BatchProgressReportProps) {
  const navigate = useNavigate();
  const {
    data: completionOverviewData,
    isPending: isCompletionPending,
    isError: isCompletionError,
  } = useAdminCompletionOverview(orgId);
  const {
    data: performanceDashboardData,
    isPending: isPerformancePending,
    isError: isPerformanceError,
  } = useGetPerformanceDashboard();

  const completionSections = useMemo(
    () => extractCompletionSections(completionOverviewData),
    [completionOverviewData],
  );
  const performanceStudents = useMemo(
    () => extractPerformanceStudents(performanceDashboardData),
    [performanceDashboardData],
  );
  const rows = useMemo(
    () => buildBatchProgressRows(completionSections, performanceStudents),
    [completionSections, performanceStudents],
  );

  const columns = useMemo((): GroupedTableColumn<BatchProgressRow>[] => {
    return [
      {
        key: "batchName",
        label: sectionTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${sectionTerm.toLowerCase()}`,
        sortAccessor: (row) => `${row.batchCode} ${row.batchName}`.trim(),
        filterAccessor: (row) =>
          `${row.batchCode} ${row.batchName} ${row.instructorName}`.trim(),
        className: "min-w-[240px]",
        render: (row) => (
          <div>
            <div className="font-medium text-slate-900">{row.batchName}</div>
            <div className="text-xs text-slate-500">{row.batchCode || "No code"}</div>
          </div>
        ),
      },
      {
        key: "instructorName",
        label: "Instructor",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search instructor",
        sortAccessor: (row) => row.instructorName || "",
        filterAccessor: (row) => row.instructorName || "",
        className: "min-w-[200px]",
        render: (row) => <span className="text-sm text-slate-700">{row.instructorName}</span>,
      },
      {
        key: "learnerCount",
        label: `Total ${learnersTerm}`,
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) => row.learnerCount,
        filterAccessor: (row) => String(row.learnerCount),
        className: "min-w-[150px]",
        render: (row) => (
          <span className="text-sm font-medium text-slate-700">
            {formatCount(row.learnerCount)}
          </span>
        ),
      },
      {
        key: "lessonPercent",
        label: "Lessons",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search lesson progress",
        sortAccessor: (row) => row.lessonPercent,
        filterAccessor: (row) => formatPercent(row.lessonPercent),
        className: "min-w-[150px]",
        render: (row) => (
          <div>
            <div className="font-medium text-slate-700">
              {formatPercent(row.lessonPercent)}
            </div>
            <div className="text-xs text-slate-500">
              {row.completedLessons}/{row.totalLessons}
            </div>
          </div>
        ),
      },
      {
        key: "assessmentPercent",
        label: "Assessments",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search assessment progress",
        sortAccessor: (row) => row.assessmentPercent,
        filterAccessor: (row) => formatPercent(row.assessmentPercent),
        className: "min-w-[150px]",
        render: (row) => (
          <div>
            <div className="font-medium text-slate-700">
              {formatPercent(row.assessmentPercent)}
            </div>
            <div className="text-xs text-slate-500">
              {row.completedAssessments}/{row.totalAssessments}
            </div>
          </div>
        ),
      },
      {
        key: "averageCompletion",
        label: "Overall Progress",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search overall progress",
        sortAccessor: (row) => row.averageCompletion,
        filterAccessor: (row) => formatPercent(row.averageCompletion),
        className: "min-w-[160px]",
        render: (row) => (
          <span className="font-semibold text-slate-700">
            {formatPercent(row.averageCompletion)}
          </span>
        ),
      },
      {
        key: "averageAttendance",
        label: "Attendance",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search attendance",
        sortAccessor: (row) => row.averageAttendance,
        filterAccessor: (row) => formatPercent(row.averageAttendance),
        className: "min-w-[130px]",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {formatPercent(row.averageAttendance)}
          </span>
        ),
      },
      {
        key: "completedLearners",
        label: `Completed ${learnersTerm}`,
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search completed count",
        sortAccessor: (row) => row.completedLearners,
        filterAccessor: (row) =>
          `${row.completedLearners}/${row.trackedLearners}`,
        className: "min-w-[170px]",
        render: (row) => (
          <span className="text-sm text-slate-700">
            {row.completedLearners}/{row.trackedLearners}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterVariant: "select",
        filterSelectAllLabel: "All Status",
        filterOptions: [
          { value: "completed", label: "Completed" },
          { value: "in_progress", label: "In Progress" },
          { value: "not_started", label: "Not Started" },
        ],
        sortAccessor: (row) => row.status,
        filterAccessor: (row) => row.status,
        className: "min-w-[140px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getBatchStatusClassName(row.status)}`}
          >
            {batchStatusLabelMap[row.status]}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Actions",
        align: "right",
        className: "min-w-[140px]",
        render: (row) => (
          <button
            type="button"
            onClick={() => navigate(`/${orgCode}/admin/section/${row.batchCode}`)}
            disabled={!row.batchCode}
            className="text-sm font-medium text-primary hover:text-primary/80 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Open {sectionTerm}
          </button>
        ),
      },
    ];
  }, [learnersTerm, navigate, orgCode, sectionTerm]);

  const groups = useMemo(
    (): GroupedTableGroup<BatchProgressRow>[] => [
      {
        key: "batch-progress-report",
        title: `${sectionsTerm} Progress`,
        rows,
        badgeText: `${formatCount(rows.length)} total`,
      },
    ],
    [rows, sectionsTerm],
  );
  const { currentPageRows, handleVisibleRowsChange } =
    useCurrentVisibleRows<BatchProgressRow>();

  const exportColumns = useMemo(
    (): ReportExportColumn<BatchProgressRow>[] => [
      {
        label: `${sectionTerm} Code`,
        value: (row) => row.batchCode || "N/A",
      },
      {
        label: `${sectionTerm} Name`,
        value: (row) => row.batchName,
      },
      {
        label: "Instructor",
        value: (row) => row.instructorName,
      },
      {
        label: `Total ${learnersTerm}`,
        value: (row) => row.learnerCount,
      },
      {
        label: "Lesson Progress",
        value: (row) =>
          `${formatPercent(row.lessonPercent)} (${row.completedLessons}/${row.totalLessons})`,
      },
      {
        label: "Assessment Progress",
        value: (row) =>
          `${formatPercent(row.assessmentPercent)} (${row.completedAssessments}/${row.totalAssessments})`,
      },
      {
        label: "Overall Progress",
        value: (row) => formatPercent(row.averageCompletion),
      },
      {
        label: "Average Attendance",
        value: (row) => formatPercent(row.averageAttendance),
      },
      {
        label: `Completed ${learnersTerm}`,
        value: (row) => `${row.completedLearners}/${row.trackedLearners}`,
      },
      {
        label: "Status",
        value: (row) => batchStatusLabelMap[row.status],
      },
    ],
    [learnersTerm, sectionTerm],
  );

  const reportExporter = useReportExportActions({
    rows,
    currentPageRows,
    columns: exportColumns,
    filenamePrefix: "admin-reports-batch-progress",
    sheetName: "Batch Progress",
    pdfTitle: "Batch Progress Report",
    reportLabel: "batch progress report",
  });

  return (
    <ReportPanelShell
      title={`${sectionsTerm} Progress Report`}
      description={`Review lesson completion, assessment completion, average progress, and attendance across all loaded ${sectionsTerm.toLowerCase()}, then export the summary to Excel or PDF.`}
      totalLabel={`${formatCount(rows.length)} loaded ${sectionsTerm.toLowerCase()}`}
      note="This report combines the current completion overview with the performance dashboard snapshot."
      onExportExcelCurrentPage={reportExporter.exportExcelCurrentPage}
      onExportExcelAllRows={reportExporter.exportExcelAllRows}
      onExportPdfCurrentPage={reportExporter.exportPdfCurrentPage}
      onExportPdfAllRows={reportExporter.exportPdfAllRows}
      isExportingExcel={reportExporter.isExportingExcel}
      isExportingPdf={reportExporter.isExportingPdf}
      onOpenPage={() => navigate(`/${orgCode}/admin/completion`)}
      openPageLabel="Open Completion Page"
    >
      {isCompletionPending || isPerformancePending ? (
        <TableSkeletonClean
          columns={[
            { width: "20%" },
            { width: "16%" },
            { width: "10%" },
            { width: "12%" },
            { width: "12%" },
            { width: "12%" },
            { width: "10%" },
            { width: "8%" },
          ]}
          rows={5}
        />
      ) : isCompletionError || isPerformanceError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load the {sectionsTerm.toLowerCase()} progress report.
        </div>
      ) : rows.length === 0 ? (
        <TableEmptyState
          type="section"
          title={`No ${sectionsTerm} found`}
          description={`There are no ${sectionsTerm.toLowerCase()} available in the progress report.`}
        />
      ) : (
        <GroupedDataTable
          groups={groups}
          columns={columns}
          rowKey={(row) => row.id}
          pageSize={REPORT_PAGE_SIZE}
          showGroupHeader={false}
          cardless={true}
          onVisibleRowsChange={handleVisibleRowsChange}
          tableMinWidthClassName="min-w-[1450px]"
          emptyFilteredText={`No matching ${sectionsTerm.toLowerCase()} found.`}
        />
      )}
    </ReportPanelShell>
  );
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const orgId = currentUser.user.organization._id;
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);
  const instructorTerm = getTerm("instructor", orgType);
  const instructorsTerm = getTerm("instructor", orgType, true);
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const activeTab = (() => {
    const tabValue = searchParams.get("tab");
    return REPORT_TAB_IDS.includes(tabValue as ReportTabId)
      ? (tabValue as ReportTabId)
      : "students";
  })();

  const tabs = useMemo(
    () => [
      {
        id: "students" as ReportTabId,
        label: learnersTerm,
        description: `Review the ${learnersTerm.toLowerCase()} roster report.`,
        icon: <FiUsers size={18} />,
      },
      {
        id: "instructors" as ReportTabId,
        label: instructorsTerm,
        description: `Inspect the ${instructorsTerm.toLowerCase()} directory report.`,
        icon: <FiUserCheck size={18} />,
      },
      {
        id: "sections" as ReportTabId,
        label: sectionsTerm,
        description: `Track active ${sectionsTerm.toLowerCase()} in table form.`,
        icon: <FiLayers size={18} />,
      },
      {
        id: "courses" as ReportTabId,
        label: "Courses",
        description: "Browse the course catalog report and export it.",
        icon: <FiBookOpen size={18} />,
      },
      {
        id: "performance" as ReportTabId,
        label: "Performance",
        description: `Track ${learnersTerm.toLowerCase()} progress, attendance, and risk.`,
        icon: <FiTrendingUp size={18} />,
      },
      {
        id: "grades" as ReportTabId,
        label: "Individual Grades",
        description: `Flatten grade results across loaded ${sectionsTerm.toLowerCase()}.`,
        icon: <FiFileText size={18} />,
      },
      {
        id: "batch-progress" as ReportTabId,
        label: `${sectionTerm} Progress`,
        description: `Summarize progress across all loaded ${sectionsTerm.toLowerCase()}.`,
        icon: <FiBarChart2 size={18} />,
      },
    ],
    [instructorsTerm, learnersTerm, sectionTerm, sectionsTerm],
  );
  const activeTabMeta =
    tabs.find((tab) => tab.id === activeTab) || tabs[0];

  const handleTabChange = (tab: ReportTabId) => {
    startTransition(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      });
    });
  };

  const activeReportContent =
    activeTab === "students" ? (
      <StudentReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        learnerTerm={learnerTerm}
        learnersTerm={learnersTerm}
      />
    ) : activeTab === "instructors" ? (
      <InstructorReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        instructorTerm={instructorTerm}
        instructorsTerm={instructorsTerm}
      />
    ) : activeTab === "sections" ? (
      <SectionReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        learnerTerm={learnerTerm}
        sectionTerm={sectionTerm}
        sectionsTerm={sectionsTerm}
        instructorTerm={instructorTerm}
      />
    ) : activeTab === "courses" ? (
      <CourseReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        isCorporate={orgType === "corporate"}
      />
    ) : activeTab === "performance" ? (
      <PerformanceReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        learnerTerm={learnerTerm}
        learnersTerm={learnersTerm}
        sectionTerm={sectionTerm}
        isCorporate={orgType === "corporate"}
      />
    ) : activeTab === "grades" ? (
      <IndividualGradesReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        learnerTerm={learnerTerm}
        learnersTerm={learnersTerm}
        sectionTerm={sectionTerm}
        sectionsTerm={sectionsTerm}
      />
    ) : (
      <BatchProgressReportTab
        orgId={orgId}
        orgCode={orgCode}
        orgType={orgType}
        learnerTerm={learnerTerm}
        learnersTerm={learnersTerm}
        sectionTerm={sectionTerm}
        sectionsTerm={sectionsTerm}
      />
    );

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 p-4 sm:p-6">
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Reports
          </h1>
          <HoverHelpTooltip
            text={`${activeTabMeta.label} report`}
            className="shrink-0"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((tab) => (
            <ReportTabButton
              key={tab.id}
              id={tab.id}
              label={tab.label}
              description={tab.description}
              icon={tab.icon}
              isActive={activeTab === tab.id}
              onClick={handleTabChange}
            />
          ))}
        </div>
      </section>

      {activeReportContent}
    </div>
  );
}


