import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useGetStudentProfile } from "../../hooks/useStudent";
import { useGetDevelopmentPlans } from "../../hooks/useDevelopmentPlan";
import {
  FaAngleLeft,
  FaUserCircle,
  FaRegUser,
  FaHashtag,
  FaBook,
  FaBuilding,
  FaUserTie,
  FaBriefcase,
  FaIdBadge,
  FaClock,
  FaCalendarAlt,
  FaEdit,
} from "react-icons/fa";
import ProfilePageSkeleton from "../../components/skeleton/ProfilePage";
import UserSectionsSkeleton from "../../components/skeleton/UserSectionsSkeleton";
import { IStudent } from "../../types/interfaces";
import { useStudentSections } from "../../hooks/useSection";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { getTerm, getYearLevelText } from "../../lib/utils";
import { formatDateMMMDDYYY } from "../../lib/dateUtils";
import DeleteStudentModal from "../../components/student/DeleteStudentModal";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import { FiDownload } from "react-icons/fi";
import { generateTimestamp } from "../../lib/dateUtils";
import { toast } from "react-toastify";

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
}

interface Module {
  _id: string;
  lessons: {
    _id: string;
    progress?: Array<{
      userId?: string | { _id?: string };
      status?: "completed" | "in-progress" | "not-started";
    }>;
  }[];
}

interface Section {
  _id: string;
  name: string;
  code?: string;
  status?: string;
  course?: Course;
  modules?: Module[];
  assessments?: Array<{ _id: string }>;
  schedule?: {
    startDate?: string;
    endDate?: string;
  };
}

interface StudentAssessmentResult {
  assessmentId?: string | { _id?: string };
  sectionCode?: string;
  isFinished?: boolean;
  isPassed?: boolean;
  totalScore?: number;
  answers?: Array<unknown>;
  updatedAt?: string;
  createdAt?: string;
}

interface InfoGridProps {
  items: { label: string; value: string; icon?: JSX.Element }[];
}

interface SectionsHookResult {
  data?: { sections?: Section[] };
  isPending: boolean;
}

type BatchActivityMetrics = {
  batchId: string;
  batchName: string;
  batchCode: string;
  enrollmentStatus: string;
  courseTitle: string;
  startedAt?: string;
  lesson: {
    total: number;
    completed: number;
    incomplete: number;
    notStarted: number;
  };
  module: {
    total: number;
    completed: number;
    incomplete: number;
    notStarted: number;
  };
  assessment: {
    total: number;
    taken: number;
    passed: number;
    failed: number;
    notTaken: number;
  };
};

const normalizeId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null) {
    const obj = value as { _id?: string };
    return typeof obj._id === "string" ? obj._id : "";
  }
  return "";
};

const getLessonStatusForStudent = (
  lesson: Module["lessons"][number],
  studentId: string,
): "completed" | "in-progress" | "not-started" => {
  const progressEntries = Array.isArray(lesson.progress) ? lesson.progress : [];
  const studentProgress = progressEntries.find(
    (entry) => normalizeId(entry.userId) === studentId,
  );
  const status = studentProgress?.status;
  if (status === "completed" || status === "in-progress") {
    return status;
  }
  return "not-started";
};

const buildBatchActivityBreakdown = (
  sections: Section[],
  studentId: string,
  assessmentResults: StudentAssessmentResult[],
): BatchActivityMetrics[] => {
  return sections.map((section) => {
    const allLessons = (section.modules || []).flatMap((module) =>
      Array.isArray(module.lessons) ? module.lessons : [],
    );
    const lessonStatuses = allLessons.map((lesson) =>
      getLessonStatusForStudent(lesson, studentId),
    );
    const lessonCompleted = lessonStatuses.filter(
      (status) => status === "completed",
    ).length;
    const lessonInProgress = lessonStatuses.filter(
      (status) => status === "in-progress",
    ).length;
    const lessonNotStarted = lessonStatuses.filter(
      (status) => status === "not-started",
    ).length;

    const moduleMetrics = (section.modules || []).reduce(
      (acc, module) => {
        const moduleLessonStatuses = (module.lessons || []).map((lesson) =>
          getLessonStatusForStudent(lesson, studentId),
        );

        if (moduleLessonStatuses.length === 0) {
          acc.notStarted += 1;
          return acc;
        }

        const allCompleted = moduleLessonStatuses.every(
          (status) => status === "completed",
        );
        const allNotStarted = moduleLessonStatuses.every(
          (status) => status === "not-started",
        );

        if (allCompleted) {
          acc.completed += 1;
        } else if (allNotStarted) {
          acc.notStarted += 1;
        } else {
          acc.incomplete += 1;
        }
        return acc;
      },
      { completed: 0, incomplete: 0, notStarted: 0 },
    );

    const sectionAssessmentIds = new Set(
      (section.assessments || [])
        .map((assessment) => normalizeId(assessment?._id))
        .filter(Boolean),
    );

    const relevantAssessmentResults = assessmentResults.filter((result) => {
      const resultAssessmentId = normalizeId(result.assessmentId);
      if (resultAssessmentId && sectionAssessmentIds.has(resultAssessmentId)) {
        return true;
      }
      return (
        typeof result.sectionCode === "string" && result.sectionCode === section.code
      );
    });

    const latestResultByAssessment = new Map<string, StudentAssessmentResult>();
    relevantAssessmentResults.forEach((result) => {
      const assessmentId = normalizeId(result.assessmentId);
      if (!assessmentId) return;
      const existing = latestResultByAssessment.get(assessmentId);
      if (!existing) {
        latestResultByAssessment.set(assessmentId, result);
        return;
      }
      const currentTime = new Date(
        result.updatedAt || result.createdAt || 0,
      ).getTime();
      const existingTime = new Date(
        existing.updatedAt || existing.createdAt || 0,
      ).getTime();
      if (currentTime >= existingTime) {
        latestResultByAssessment.set(assessmentId, result);
      }
    });

    const dedupedResults = Array.from(latestResultByAssessment.values());
    const takenCount = dedupedResults.filter((result) => {
      if (result.isFinished) return true;
      if (typeof result.totalScore === "number") return true;
      return Array.isArray(result.answers) && result.answers.length > 0;
    }).length;
    const passedCount = dedupedResults.filter(
      (result) => result.isPassed === true,
    ).length;
    const failedCount = dedupedResults.filter(
      (result) => result.isPassed === false,
    ).length;
    const totalAssessments = sectionAssessmentIds.size;

    return {
      batchId: section._id,
      batchName: section.name || "Untitled Batch",
      batchCode: section.code || "N/A",
      enrollmentStatus: section.status || "unknown",
      courseTitle: section.course?.title || "N/A",
      startedAt: section.schedule?.startDate,
      lesson: {
        total: allLessons.length,
        completed: lessonCompleted,
        incomplete: lessonInProgress,
        notStarted: lessonNotStarted,
      },
      module: {
        total: (section.modules || []).length,
        completed: moduleMetrics.completed,
        incomplete: moduleMetrics.incomplete,
        notStarted: moduleMetrics.notStarted,
      },
      assessment: {
        total: totalAssessments,
        taken: takenCount,
        passed: passedCount,
        failed: failedCount,
        notTaken: Math.max(totalAssessments - takenCount, 0),
      },
    };
  });
};

const uniqueRowsBy = <RowType,>(
  rows: RowType[],
  getKey: (row: RowType) => string,
): RowType[] => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = getKey(row);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeStatusLabel = (value: string | undefined): string =>
  String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatOptionalDate = (value?: string): string =>
  value ? formatDateMMMDDYYY(value, true) : "N/A";

const getExportColumnWidths = (
  rows: Array<Record<string, string | number>>,
): Array<{ wch: number }> => {
  const keys = Object.keys(rows[0] || {});
  return keys.map((key) => {
    const maxLength = rows.reduce((length, row) => {
      const valueLength = String(row[key] ?? "").length;
      return Math.max(length, valueLength);
    }, key.length);
    return { wch: Math.min(Math.max(maxLength + 2, 12), 42) };
  });
};

function InfoGrid({ items }: InfoGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      {items.map(({ label, value, icon }, index) => (
        <div key={index} className="flex items-start space-x-2">
          {icon && <span className="text-gray-400 text-sm mt-1">{icon}</span>}
          <div className="flex flex-col">
            <span className="text-gray-800 font-semibold">{label}</span>
            <span className="text-gray-500">{value || "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionsDisplayGeneric({
  userId,
  useSectionsHook,
  learnerTerm,
  sectionTerm,
  onManageEnrollments,
}: {
  userId: string;
  useSectionsHook: (params: { studentId: string }) => SectionsHookResult;
  learnerTerm: string;
  sectionTerm: string;
  onManageEnrollments: () => void;
}) {
  const { data: sectionsData, isPending: isSectionsPending } = useSectionsHook({
    studentId: userId,
  });
  const sections: Section[] = sectionsData?.sections || [];

  if (isSectionsPending) {
    return <UserSectionsSkeleton />;
  }

  if (!sections.length) {
    return (
      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white p-6">
        <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
          <FaRegUser className="text-gray-500 text-lg" />
          <span>{sectionTerm} Assignments</span>
        </h3>
        <p className="text-gray-600 text-sm mb-4">
          No active {sectionTerm.toLowerCase()} enrollments for this{" "}
          {learnerTerm.toLowerCase()}.
        </p>
        <Button variant="outline" onClick={onManageEnrollments}>
          Manage {sectionTerm}s
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800">
          <FaRegUser className="text-gray-500 text-lg" />
          <span>{sectionTerm} Assignments</span>
        </h3>
        <Button variant="outline" onClick={onManageEnrollments}>
          Manage {sectionTerm}s
        </Button>
      </div>

      {sections.map((section: Section) => {
        const totalLessons = (section.modules || []).reduce(
          (sum: number, module: Module) => sum + (module.lessons?.length || 0),
          0,
        );
        const enrollmentStatus = section.status
          ? section.status.charAt(0).toUpperCase() + section.status.slice(1)
          : "Unknown";
        const scheduleStart = section.schedule?.startDate
          ? formatDateMMMDDYYY(section.schedule.startDate, true)
          : "N/A";
        const scheduleEnd = section.schedule?.endDate
          ? formatDateMMMDDYYY(section.schedule.endDate, true)
          : "N/A";

        return (
          <div
            key={section._id}
            className="border border-gray-200 rounded-lg p-4 mb-3 last:mb-0"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  {section.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {section.code || "No Code"}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded bg-blue-100 text-blue-700 w-fit">
                {enrollmentStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 text-sm">
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium text-gray-800">{learnerTerm}</p>
              </div>
              <div>
                <p className="text-gray-500">Course</p>
                <p className="font-medium text-gray-800">
                  {section.course?.title || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Start Date</p>
                <p className="font-medium text-gray-800">{scheduleStart}</p>
              </div>
              <div>
                <p className="text-gray-500">End Date</p>
                <p className="font-medium text-gray-800">{scheduleEnd}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {totalLessons} lessons assigned
            </p>
            {section.course?.description && (
              <p className="text-sm text-gray-600 mt-2">
                {section.course.description}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

type ProfileTab =
  | "overview"
  | "enrollments"
  | "activity"
  | "development-plan"
  | "settings";

const isProfileTab = (value: string | null): value is ProfileTab =>
  value === "overview" ||
  value === "enrollments" ||
  value === "activity" ||
  value === "development-plan" ||
  value === "settings";

export default function StudentDetailsPage() {
  const { id: studentId = "", orgCode = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isPending } = useGetStudentProfile(studentId, {
    includeArchived: true,
  });
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const orgType = currentUser.user.organization.type;
  const learnerTerm = getTerm("learner", orgType);
  const sectionTerm = getTerm("group", orgType);
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    const tabParam = searchParams.get("tab");
    return isProfileTab(tabParam) ? tabParam : "overview";
  });
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isExportingProfile, setIsExportingProfile] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (isProfileTab(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
      return;
    }

    if (!isProfileTab(tabParam) && activeTab !== "overview") {
      setActiveTab("overview");
    }
  }, [activeTab, searchParams]);

  const handleTabChange = (tab: ProfileTab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "overview") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", tab);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const { data: sectionsData, isPending: isSectionsPending } =
    useStudentSections({
      studentId,
      limit: 1000,
      skip: 0,
    });
  const developmentPlansQuery = useGetDevelopmentPlans({
    employeeId: studentId,
    limit: 50,
    skip: 0,
  });
  const sections: Section[] = sectionsData?.sections || [];

  if (isPending) return <ProfilePageSkeleton />;

  const userData = data?.data as IStudent | undefined;
  const assessmentResults =
    (
      userData as
        | (IStudent & { studentAssessmentResults?: StudentAssessmentResult[] })
        | undefined
    )?.studentAssessmentResults || [];
  const isArchived = Boolean(
    (userData as IStudent & { archive?: { status?: boolean } })?.archive
      ?.status,
  );
  const statusText = isArchived
    ? "Archived"
    : userData?.status
      ? `${userData.status.charAt(0).toUpperCase()}${userData.status.slice(1)}`
      : "Active";

  if (!userData) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
          <p className="text-sm text-gray-500">
            We couldn&apos;t load this {learnerTerm.toLowerCase()} profile.
          </p>
        </div>
        <Button
          variant="link"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
          onClick={() => navigate(-1)}
        >
          <FaAngleLeft /> Go back
        </Button>
      </div>
    );
  }

  const userDataWithLastLogin = userData as IStudent & { lastLogin?: string };

  const roleValue =
    orgType === "corporate"
      ? "Employee"
      : userData.role
        ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
        : learnerTerm;
  const subRoleValue = userData.subrole
    ? userData.subrole
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    : "N/A";

  const infoItems = [
    {
      label: `${learnerTerm} ID`,
      value: userData.studentId || "",
      icon: <FaHashtag />,
    },
    {
      label: "Program",
      value: userData.program?.name || "",
      icon: <FaBook />,
    },
    {
      label: "Year Level",
      value: userData.yearLevel ? getYearLevelText(userData.yearLevel) : "",
      icon: <FaBook />,
    },
    {
      label: "Role",
      value: roleValue,
      icon: <FaBriefcase />,
    },
    {
      label: "Subrole",
      value: subRoleValue,
      icon: <FaIdBadge />,
    },
  ];

  const departmentValue =
    typeof userData.person?.department === "string"
      ? userData.person.department
      : userData.person?.department?.name || userData.department?.name || "";

  const managerValue =
    typeof userData.directTo === "string"
      ? userData.directTo
      : `${userData.directTo?.firstName || ""} ${userData.directTo?.lastName || ""}`.trim();

  const corporateInfoItems = [
    {
      label: "Department",
      value: departmentValue,
      icon: <FaBuilding />,
    },
    {
      label: "Manager",
      value: managerValue || "Not Assigned",
      icon: <FaUserTie />,
    },
    {
      label: "Role",
      value: roleValue,
      icon: <FaBriefcase />,
    },
    {
      label: "Subrole",
      value: subRoleValue,
      icon: <FaIdBadge />,
    },
  ];

  const metadataItems = [
    {
      label: "Last Login",
      value: userDataWithLastLogin.lastLogin
        ? formatDateMMMDDYYY(userDataWithLastLogin.lastLogin, true)
        : "No login record",
      icon: <FaClock />,
    },
    {
      label: "Created Date",
      value: userData.createdAt
        ? formatDateMMMDDYYY(userData.createdAt, true)
        : "N/A",
      icon: <FaCalendarAlt />,
    },
    {
      label: "Last Updated",
      value: userData.updatedAt
        ? formatDateMMMDDYYY(userData.updatedAt, true)
        : "N/A",
      icon: <FaEdit />,
    },
  ];

  const batchBreakdown = buildBatchActivityBreakdown(
    sections,
    studentId,
    assessmentResults,
  );

  const metrics = {
    enrolledCount: batchBreakdown.length,
    completedCount: batchBreakdown.filter(
      (batch) => batch.enrollmentStatus === "completed",
    ).length,
    lessonCount: batchBreakdown.reduce(
      (total, batch) => total + batch.lesson.total,
      0,
    ),
    uniqueCourseCount: new Set(
      sections
        .map((section) => section.course?._id)
        .filter((courseId): courseId is string => Boolean(courseId)),
    ).size,
  };

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "enrollments", label: `${sectionTerm}s` },
    { id: "activity", label: "Activity" },
    ...(orgType === "corporate"
      ? ([{ id: "development-plan", label: "Development Plan" }] as {
          id: ProfileTab;
          label: string;
        }[])
      : []),
    { id: "settings", label: "Settings" },
  ];

  const developmentPlans = (
    developmentPlansQuery.data as { data?: Array<Record<string, any>> } | undefined
  )?.data || [];

  const handleExportProfile = async (format: "excel" | "pdf") => {
    if (!userData) return;

    const profileName =
      `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
      "employee-profile";

    const overviewRows: Array<Record<string, string | number>> = [
      { Section: "Profile", Field: "Name", Value: profileName },
      { Section: "Profile", Field: "Email", Value: userData.email || "N/A" },
      { Section: "Profile", Field: `${learnerTerm} ID`, Value: userData.studentId || "N/A" },
      { Section: "Profile", Field: "Role", Value: roleValue },
      { Section: "Profile", Field: "Subrole", Value: subRoleValue },
      {
        Section: "Profile",
        Field: "Department",
        Value: departmentValue || "N/A",
      },
      {
        Section: "Profile",
        Field: "Manager",
        Value: managerValue || "Not Assigned",
      },
      { Section: "Profile", Field: "Status", Value: statusText },
      { Section: "Profile", Field: "GPA", Value: userData.gpa ?? "N/A" },
      {
        Section: "System",
        Field: "Last Login",
        Value: userDataWithLastLogin.lastLogin
          ? formatDateMMMDDYYY(userDataWithLastLogin.lastLogin, true)
          : "No login record",
      },
      {
        Section: "System",
        Field: "Created Date",
        Value: userData.createdAt
          ? formatDateMMMDDYYY(userData.createdAt, true)
          : "N/A",
      },
      {
        Section: "System",
        Field: "Last Updated",
        Value: userData.updatedAt
          ? formatDateMMMDDYYY(userData.updatedAt, true)
          : "N/A",
      },
    ];

    const enrollmentRows = uniqueRowsBy(
      sections.map((section) => {
        const totalLessons = (section.modules || []).reduce(
          (sum, module) => sum + (module.lessons?.length || 0),
          0,
        );
        return {
          "Batch Name": section.name || "Untitled Batch",
          "Batch Code": section.code || "N/A",
          Course: section.course?.title || "N/A",
          Status: normalizeStatusLabel(section.status),
          "Start Date": formatOptionalDate(section.schedule?.startDate),
          "End Date": formatOptionalDate(section.schedule?.endDate),
          "Lessons Assigned": totalLessons,
        };
      }),
      (row) =>
        [
          row["Batch Name"],
          row["Batch Code"],
          row.Course,
          row["Start Date"],
          row["End Date"],
        ].join("|"),
    );

    const activitySummaryRows: Array<Record<string, string | number>> = [
      { Metric: `${sectionTerm}s Enrolled`, Value: metrics.enrolledCount },
      { Metric: `Completed ${sectionTerm}s`, Value: metrics.completedCount },
      { Metric: "Courses Assigned", Value: metrics.uniqueCourseCount },
      { Metric: "Lessons Assigned", Value: metrics.lessonCount },
    ];

    const activityBatchRows = uniqueRowsBy(
      batchBreakdown.map((batch) => ({
        "Batch Name": batch.batchName,
        "Batch Code": batch.batchCode,
        Course: batch.courseTitle,
        Status: normalizeStatusLabel(batch.enrollmentStatus),
        "Start Date": formatOptionalDate(batch.startedAt),
        "Lessons Total": batch.lesson.total,
        "Lessons Completed": batch.lesson.completed,
        "Lessons Incomplete": batch.lesson.incomplete,
        "Lessons Not Started": batch.lesson.notStarted,
        "Modules Total": batch.module.total,
        "Modules Completed": batch.module.completed,
        "Modules Incomplete": batch.module.incomplete,
        "Modules Not Started": batch.module.notStarted,
        "Assessments Total": batch.assessment.total,
        "Assessments Taken": batch.assessment.taken,
        "Assessments Passed": batch.assessment.passed,
        "Assessments Failed": batch.assessment.failed,
        "Assessments Not Taken": batch.assessment.notTaken,
      })),
      (row) => `${row["Batch Name"]}|${row["Batch Code"]}|${row.Course}`,
    );

    const developmentPlanRows = uniqueRowsBy(
      developmentPlans.flatMap((plan) => {
        const quarterPlans = Array.isArray(plan?.quarterPlans) ? plan.quarterPlans : [];

        if (quarterPlans.length === 0) {
          return [
            {
              "Review Year": String(plan?.reviewYear || "N/A"),
              "Plan Status": normalizeStatusLabel(String(plan?.status || "draft")),
              Quarter: "N/A",
              "Activity Title": "No activities",
              "Activity Status": "N/A",
              "Start Date": "N/A",
              "End Date": "N/A",
            },
          ];
        }

        return quarterPlans.flatMap((quarterPlan: Record<string, any>) => {
          const activities = Array.isArray(quarterPlan?.activities)
            ? quarterPlan.activities
            : [];

          if (activities.length === 0) {
            return [
              {
                "Review Year": String(plan?.reviewYear || "N/A"),
                "Plan Status": normalizeStatusLabel(String(plan?.status || "draft")),
                Quarter: String(quarterPlan?.quarter || "Quarter"),
                "Activity Title": "No activities",
                "Activity Status": "N/A",
                "Start Date": "N/A",
                "End Date": "N/A",
              },
            ];
          }

          return activities.map((activity: Record<string, any>) => ({
            "Review Year": String(plan?.reviewYear || "N/A"),
            "Plan Status": normalizeStatusLabel(String(plan?.status || "draft")),
            Quarter: String(quarterPlan?.quarter || "Quarter"),
            "Activity Title": String(activity?.title || "Untitled"),
            "Activity Status": normalizeStatusLabel(String(activity?.status || "planned")),
            "Start Date": formatOptionalDate(activity?.startDate),
            "End Date": formatOptionalDate(activity?.endDate),
          }));
        });
      }),
      (row) =>
        [
          row["Review Year"],
          row.Quarter,
          row["Activity Title"],
          row["Start Date"],
          row["End Date"],
        ].join("|"),
    );

    const exportSheets = [
      { sheetName: "Overview", title: "Overview", rows: overviewRows },
      { sheetName: `${sectionTerm}s`, title: `${sectionTerm}s`, rows: enrollmentRows },
      { sheetName: "Activity Summary", title: "Activity Summary", rows: activitySummaryRows },
      { sheetName: "Activity by Batch", title: "Activity by Batch", rows: activityBatchRows },
      { sheetName: "Development Plan", title: "Development Plan", rows: developmentPlanRows },
    ];

    setIsExportingProfile(true);
    const pendingLabel = format === "excel" ? "Excel" : "PDF";

    try {
      await toast.promise(
        (async () => {
          if (format === "excel") {
            const XLSX = await import("xlsx");
            const workbook = XLSX.utils.book_new();

            exportSheets.forEach((sheet) => {
              const rows =
                sheet.rows.length > 0 ? sheet.rows : [{ Message: "No data available" }];
              const worksheet = XLSX.utils.json_to_sheet(rows);
              worksheet["!cols"] = getExportColumnWidths(rows);
              XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                sheet.sheetName.slice(0, 31),
              );
            });

            const filename = `${profileName.replace(/\s+/g, "-").toLowerCase()}-profile-${generateTimestamp()}.xlsx`;
            XLSX.writeFile(workbook, filename);
            return;
          }

          const [{ jsPDF }, autoTableModule] = await Promise.all([
            import("jspdf"),
            import("jspdf-autotable"),
          ]);
          const autoTable = autoTableModule.default;
          const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
          });

          doc.setFontSize(16);
          doc.text(`${profileName} - Profile Export`, 40, 40);
          doc.setFontSize(10);
          doc.setTextColor(100);
          doc.text(`Generated ${new Date().toLocaleString("en-US")}`, 40, 58);

          let cursorY = 78;
          exportSheets.forEach((sheet, index) => {
            if (index > 0) {
              doc.addPage("a4", "landscape");
              cursorY = 48;
            }

            doc.setFontSize(13);
            doc.setTextColor(20);
            doc.text(sheet.title, 40, cursorY);
            const rows =
              sheet.rows.length > 0 ? sheet.rows : [{ Message: "No data available" }];
            const columns = Object.keys(rows[0] || {});
            const pdfColumns =
              sheet.sheetName === "Activity by Batch"
                ? columns.filter(
                    (column) => column !== "Batch Code" && column !== "Course",
                  )
                : columns;

            autoTable(doc, {
              startY: cursorY + 12,
              head: [pdfColumns],
              body: rows.map((row) =>
                pdfColumns.map(
                  (column) =>
                    String((row as Record<string, string | number>)[column] ?? ""),
                ),
              ),
              styles: {
                fontSize: 6.5,
                cellPadding: 2.5,
                overflow: "linebreak",
              },
              headStyles: {
                fillColor: [30, 64, 175],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                fontSize: 7,
              },
              margin: { top: 40, right: 20, bottom: 30, left: 20 },
              theme: "grid",
            });
          });

          const filename = `${profileName.replace(/\s+/g, "-").toLowerCase()}-profile-${generateTimestamp()}.pdf`;
          doc.save(filename);
        })(),
        {
          pending: `Exporting employee profile to ${pendingLabel}...`,
          success: `Employee profile exported to ${pendingLabel}`,
          error: `Failed to export employee profile to ${pendingLabel}`,
        },
      );
    } finally {
      setIsExportingProfile(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{learnerTerm} Details</h1>
            <HoverHelpTooltip
              text={`View ${learnerTerm.toLowerCase()} account information`}
              className="shrink-0"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm"
            onClick={() => handleExportProfile("excel")}
            disabled={isExportingProfile}
          >
            <FiDownload /> Export Excel
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm"
            onClick={() => handleExportProfile("pdf")}
            disabled={isExportingProfile}
          >
            <FiDownload /> Export PDF
          </Button>
          <Button
            variant="link"
            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 text-sm font-medium"
            onClick={() => navigate(-1)}
          >
            <FaAngleLeft /> Go back
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 shadow-sm bg-white mb-4">
        <div className="bg-[#F5F8FF] rounded-t-xl p-6">
          <div className="flex items-center space-x-4">
            <div>
              {userData.avatar ? (
                <img
                  src={userData.avatar}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <FaUserCircle className="size-8 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex justify-between flex-1">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {`${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
                    `Unnamed ${learnerTerm}`}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">
                    {userData.email || "No email available"}
                  </span>
                  <span
                    className={`text-xs font-medium px-2.5 py-0.5 rounded ${
                      isArchived
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {statusText}
                  </span>
                </div>
              </div>
              {userData.gpa && (
                <div className="mt-1 py-1 px-3 bg-gray-100 rounded-full text-center">
                  <p className="text-gray-800 text-sm">
                    GPA: <span className="font-bold">{userData.gpa}</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 pt-4 pb-2 border-t border-gray-100">
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && orgType === "school" && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>{learnerTerm} Details</span>
            </h3>
            <InfoGrid items={infoItems} />
            <div className="mt-6">
              <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
                <FaRegUser className="text-gray-500 text-lg" />
                <span>System Metadata</span>
              </h3>
              <InfoGrid items={metadataItems} />
            </div>
          </div>
        )}

        {activeTab === "overview" && orgType === "corporate" && (
          <div className="p-6">
            <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
              <FaRegUser className="text-gray-500 text-lg" />
              <span>{learnerTerm} Details</span>
            </h3>
            <InfoGrid items={corporateInfoItems} />
            <div className="mt-6">
              <h3 className="text-base font-medium flex items-center space-x-2 text-gray-800 mb-4">
                <FaRegUser className="text-gray-500 text-lg" />
                <span>System Metadata</span>
              </h3>
              <InfoGrid items={metadataItems} />
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-base font-medium text-gray-800 mb-4">
              Learning Activity & Performance
            </h3>
            {isSectionsPending ? (
              <UserSectionsSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    {sectionTerm}s Enrolled
                  </p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.enrolledCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    Completed {sectionTerm}s
                  </p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.completedCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Courses Assigned</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.uniqueCourseCount}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 mb-1">Lessons Assigned</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {metrics.lessonCount}
                  </p>
                </div>
              </div>
            )}

            {!isSectionsPending && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Batch Activity Breakdown
                </h4>

                {batchBreakdown.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                    No enrolled batches found for this employee.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {batchBreakdown.map((batch) => {
                      const enrollmentStatusLabel = batch.enrollmentStatus
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (char) => char.toUpperCase());

                      return (
                        <div
                          key={batch.batchId}
                          className="rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {batch.batchName}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {batch.batchCode} • {batch.courseTitle}
                              </p>
                              {batch.startedAt ? (
                                <p className="text-xs text-gray-500 mt-1">
                                  Start: {formatDateMMMDDYYY(batch.startedAt, true)}
                                </p>
                              ) : null}
                            </div>
                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
                              {enrollmentStatusLabel}
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                                Lessons
                              </p>
                              <p className="text-xs text-gray-700">
                                Total: {batch.lesson.total}
                              </p>
                              <p className="text-xs text-green-700">
                                Completed: {batch.lesson.completed}
                              </p>
                              <p className="text-xs text-amber-700">
                                Incomplete: {batch.lesson.incomplete}
                              </p>
                              <p className="text-xs text-gray-700">
                                Not Started: {batch.lesson.notStarted}
                              </p>
                            </div>

                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                                Modules
                              </p>
                              <p className="text-xs text-gray-700">
                                Total: {batch.module.total}
                              </p>
                              <p className="text-xs text-green-700">
                                Completed: {batch.module.completed}
                              </p>
                              <p className="text-xs text-amber-700">
                                Incomplete: {batch.module.incomplete}
                              </p>
                              <p className="text-xs text-gray-700">
                                Not Started: {batch.module.notStarted}
                              </p>
                            </div>

                            <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-2">
                                Assessments
                              </p>
                              <p className="text-xs text-gray-700">
                                Total: {batch.assessment.total}
                              </p>
                              <p className="text-xs text-blue-700">
                                Taken: {batch.assessment.taken}
                              </p>
                              <p className="text-xs text-green-700">
                                Passed: {batch.assessment.passed}
                              </p>
                              <p className="text-xs text-red-700">
                                Failed: {batch.assessment.failed}
                              </p>
                              <p className="text-xs text-gray-700">
                                Not Taken: {batch.assessment.notTaken}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-base font-medium text-gray-800 mb-2">
              Administrative Actions
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Manage enrollments, review performance, and control account
              status.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/${orgCode}/admin/section`)}
              >
                Manage {sectionTerm}s
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/${orgCode}/admin/completion`)}
              >
                View Progress
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsArchiveModalOpen(true)}
                disabled={isArchived}
              >
                {isArchived ? "Already Archived" : `Archive ${learnerTerm}`}
              </Button>
            </div>
            {!isArchived && (
              <p className="text-xs text-gray-500 mt-3">
                Archiving will show section/batch impact and automatically
                detach active enrollments while preserving historical records.
              </p>
            )}
          </div>
        )}

        {activeTab === "development-plan" && orgType === "corporate" && (
          <div className="p-6 border-t border-gray-100">
            <h3 className="text-base font-medium text-gray-800 mb-4">
              Development Plans
            </h3>
            {developmentPlansQuery.isLoading ? (
              <p className="text-sm text-gray-500">Loading development plans...</p>
            ) : developmentPlans.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                No development plans found for this employee.
              </div>
            ) : (
              <div className="space-y-3">
                {developmentPlans.map((plan) => {
                  const quarterPlans = Array.isArray(plan?.quarterPlans)
                    ? plan.quarterPlans
                    : [];
                  return (
                    <div
                      key={String(plan?._id || `${plan?.employee}-${plan?.reviewYear}`)}
                      className="rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-800">
                          Review Year: {plan?.reviewYear || "N/A"}
                        </span>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {String(plan?.status || "draft").replace(/_/g, " ")}
                        </span>
                      </div>

                      {quarterPlans.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No quarter activities yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {quarterPlans.map(
                            (quarterPlan: Record<string, any>, quarterIndex: number) => {
                            const activities = Array.isArray(quarterPlan?.activities)
                              ? quarterPlan.activities
                              : [];
                            return (
                              <div
                                key={String(quarterPlan?.quarter || quarterIndex)}
                                className="rounded-md border border-gray-200 bg-gray-50 p-3"
                              >
                                <p className="text-sm font-semibold text-gray-800">
                                  {quarterPlan?.quarter || "Quarter"}
                                </p>
                                {activities.length === 0 ? (
                                  <p className="text-xs text-gray-500 mt-1">
                                    No activities.
                                  </p>
                                ) : (
                                  <div className="mt-2 space-y-2">
                                    {activities.map(
                                      (activity: Record<string, any>, activityIndex: number) => (
                                      <div
                                        key={String(
                                          activity?._id || `${activity?.title}-${activityIndex}`,
                                        )}
                                        className="rounded-lg border border-gray-200 bg-white p-3"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                          <p className="text-sm font-medium text-gray-800">
                                            {activity?.title || "Untitled"}
                                          </p>
                                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                            {String(activity?.status || "planned").replace(
                                              /_/g,
                                              " ",
                                            )}
                                          </span>
                                        </div>

                                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                          <div className="rounded-md bg-slate-50 px-2.5 py-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                              Start Batch
                                            </p>
                                            <p className="text-xs text-slate-700">
                                              {activity?.startDate
                                                ? formatDateMMMDDYYY(activity.startDate)
                                                : "N/A"}
                                            </p>
                                          </div>
                                          <div className="rounded-md bg-slate-50 px-2.5 py-2">
                                            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                                              End Batch
                                            </p>
                                            <p className="text-xs text-slate-700">
                                              {activity?.endDate
                                                ? formatDateMMMDDYYY(activity.endDate)
                                                : "N/A"}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                            },
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === "enrollments" && (
        <SectionsDisplayGeneric
          userId={studentId}
          useSectionsHook={useStudentSections}
          learnerTerm={learnerTerm}
          sectionTerm={sectionTerm}
          onManageEnrollments={() => navigate(`/${orgCode}/admin/section`)}
        />
      )}

      <DeleteStudentModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        studentId={studentId}
        studentName={
          `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
          `Unnamed ${learnerTerm}`
        }
      />
    </div>
  );
}
