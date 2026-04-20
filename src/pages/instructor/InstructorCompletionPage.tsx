import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetPerformanceDashboard,
  useGetStudentPerformanceDetails,
} from "../../hooks/useMetrics";
import { useInstructorSections } from "../../hooks/useSection";
import { useAuth } from "../../context/AuthContext";
import { getTerm } from "../../lib/utils";
import PageHeader from "../../components/common/PageHeader";
import { ChartBarIcon } from "@/components/ui/chart-bar-icon";

type CompletionType = "lessons" | "modules" | "assessments" | "sections";

const baseLabelMap: Omit<Record<CompletionType, string>, "sections"> = {
  lessons: "Lessons",
  modules: "Modules",
  assessments: "Assessments",
};

interface StudentEntry {
  _id: string;
  name: string;
  email: string;
  section: string;
  sectionName?: string;
  progress?: {
    completedLessons?: number;
    totalLessons?: number;
    completedModules?: number;
    totalModules?: number;
    completedAssessments?: number;
    totalAssessments?: number;
    percent?: number;
  };
}

interface SectionGroup {
  sectionCode: string;
  sectionName: string;
  students: StudentEntry[];
  completedCount: number;
}

interface CourseBreakdownEntry {
  course: string;
  section?: string;
  grade: number;
  status: string;
  progress?: {
    completedLessons: number;
    totalLessons: number;
    completedAssessments: number;
    totalAssessments: number;
    percent: number;
  };
}

interface StudentPerformanceDetails {
  _id: string;
  name: string;
  email: string;
  section: string;
  program: string;
  gpa: number;
  riskLevel: string;
  attendance: number;
  missingAssignments: number;
  courseBreakdown: CourseBreakdownEntry[];
}

type GroupSortKey = "employee" | "program" | "assessments" | "status";
type GroupSortDirection = "asc" | "desc";

interface GroupFilters {
  employee: string;
  program: string;
  assessments: string;
  status: string;
}

interface GroupPreparedRow {
  student: StudentEntry;
  completedLessons: number;
  totalLessons: number;
  lessonPercent: number;
  completedAssessments: number;
  totalAssessments: number;
  assessmentPercent: number;
  overallPercent: number;
  statusLabel: "Completed" | "In Progress" | "Not Started";
}

export default function InstructorCompletionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const orgCode = currentUser.user.organization.code;
  const orgType = currentUser.user.organization.type;
  const instructorId =
    (currentUser.user as { id?: string; _id?: string }).id ||
    (currentUser.user as { id?: string; _id?: string })._id ||
    "";
  const sectionTerm = getTerm("group", orgType);
  const sectionsTerm = getTerm("group", orgType, true);
  const learnerTerm = getTerm("learner", orgType);
  const learnersTerm = getTerm("learner", orgType, true);
  const isCorporate = orgType === "corporate";
  const labelMap: Record<CompletionType, string> = {
    ...baseLabelMap,
    sections: sectionsTerm,
  };
  const typeParam = (searchParams.get("type") || "lessons").toLowerCase();
  const completionType = (["lessons", "modules", "assessments", "sections"].includes(typeParam)
    ? typeParam
    : "lessons") as CompletionType;
  const sectionCode = searchParams.get("sectionCode") || undefined;

  const { data, isLoading } = useGetPerformanceDashboard(sectionCode);
  const { data: instructorSectionsData } = useInstructorSections({
    instructorId,
    limit: 500,
    skip: 0,
  });
  const students: StudentEntry[] = data?.students || [];
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [programSearch, setProgramSearch] = useState("");
  const [groupPageByCode, setGroupPageByCode] = useState<Record<string, number>>(
    {}
  );
  const [groupSortByCode, setGroupSortByCode] = useState<
    Record<string, { key: GroupSortKey; direction: GroupSortDirection }>
  >({});
  const [groupFiltersByCode, setGroupFiltersByCode] = useState<
    Record<string, GroupFilters>
  >({});

  const {
    data: rawStudentDetails,
    isLoading: isStudentDetailsLoading,
    isError: isStudentDetailsError,
  } = useGetStudentPerformanceDetails(selectedStudentId || "");

  const studentDetails = rawStudentDetails as StudentPerformanceDetails | undefined;
  const detailCourseBreakdown = studentDetails?.courseBreakdown || [];

  const detailLessonTotals = useMemo(() => {
    const completed = detailCourseBreakdown.reduce(
      (sum, course) => sum + (course.progress?.completedLessons || 0),
      0
    );
    const total = detailCourseBreakdown.reduce(
      (sum, course) => sum + (course.progress?.totalLessons || 0),
      0
    );
    return { completed, total };
  }, [detailCourseBreakdown]);

  const detailAssessmentTotals = useMemo(() => {
    const completed = detailCourseBreakdown.reduce(
      (sum, course) => sum + (course.progress?.completedAssessments || 0),
      0
    );
    const total = detailCourseBreakdown.reduce(
      (sum, course) => sum + (course.progress?.totalAssessments || 0),
      0
    );
    return { completed, total };
  }, [detailCourseBreakdown]);

  const detailOverallPercent = useMemo(() => {
    const completed = detailLessonTotals.completed + detailAssessmentTotals.completed;
    const total = detailLessonTotals.total + detailAssessmentTotals.total;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [detailAssessmentTotals, detailLessonTotals]);

  const sectionNameByCode = useMemo(() => {
    const map = new Map<string, string>();
    const raw = instructorSectionsData as any;
    const sectionDocs = Array.isArray(raw?.sections)
      ? raw.sections
      : Array.isArray(raw?.data?.sections)
        ? raw.data.sections
        : Array.isArray(raw?.documents)
          ? raw.documents
          : Array.isArray(raw?.data?.documents)
            ? raw.data.documents
            : [];

    for (const section of sectionDocs) {
      const code = section?.code;
      const name = section?.name || section?.title;
      if (typeof code === "string" && typeof name === "string" && name.trim()) {
        map.set(code, name.trim());
      }
    }

    return map;
  }, [instructorSectionsData]);

  const openStudentDetails = (studentId: string) => {
    setSelectedStudentId(studentId);
  };

  const closeStudentDetails = () => {
    setSelectedStudentId(null);
  };

  const getCourseResult = (course: CourseBreakdownEntry) => {
    const statusValue = (course.status || "").toLowerCase();
    if (statusValue.includes("fail")) return "Fail";
    if (statusValue.includes("pass")) return "Pass";
    return Number(course.grade || 0) >= 75 ? "Pass" : "Needs Review";
  };

  function getCompletionStats(student: StudentEntry) {
    const progress = student.progress;
    if (!progress) return { value: 0, total: 0, percent: 0 };
    switch (completionType) {
      case "lessons": {
        const value = progress.completedLessons || 0;
        const total = progress.totalLessons || 0;
        return { value, total, percent: total > 0 ? Math.round((value / total) * 100) : 0 };
      }
      case "modules": {
        const value = progress.completedModules || 0;
        const total = progress.totalModules || 0;
        return { value, total, percent: total > 0 ? Math.round((value / total) * 100) : 0 };
      }
      case "assessments": {
        const value = progress.completedAssessments || 0;
        const total = progress.totalAssessments || 0;
        return { value, total, percent: total > 0 ? Math.round((value / total) * 100) : 0 };
      }
      case "sections": {
        const percent = progress.percent || 0;
        return { value: percent, total: 100, percent };
      }
      default:
        return { value: 0, total: 0, percent: 0 };
    }
  }

  function isCompleted(student: StudentEntry) {
    const p = student.progress;
    if (!p) return false;
    switch (completionType) {
      case "lessons": return (p.completedLessons || 0) > 0;
      case "modules": return (p.completedModules || 0) > 0;
      case "assessments": return (p.completedAssessments || 0) > 0;
      case "sections": {
        const total = (p.totalLessons || 0) + (p.totalAssessments || 0);
        return total > 0 && p.percent === 100;
      }
      default: return false;
    }
  }

  const looksLikeSectionCode = (value: string) =>
    /^[A-Z]{1,6}\d{2,}$/i.test(value.trim());

  const groupPageSize = 5;
  const defaultGroupFilters: GroupFilters = {
    employee: "",
    program: "",
    assessments: "",
    status: "",
  };

  const getGroupSortState = (groupCode: string) =>
    groupSortByCode[groupCode] || { key: "employee" as GroupSortKey, direction: "asc" as GroupSortDirection };

  const getGroupFiltersState = (groupCode: string) =>
    groupFiltersByCode[groupCode] || defaultGroupFilters;

  const toggleGroupSort = (groupCode: string, key: GroupSortKey) => {
    setGroupSortByCode((prev) => {
      const current = prev[groupCode] || {
        key: "employee" as GroupSortKey,
        direction: "asc" as GroupSortDirection,
      };

      if (current.key === key) {
        return {
          ...prev,
          [groupCode]: {
            key,
            direction: current.direction === "asc" ? "desc" : "asc",
          },
        };
      }

      return {
        ...prev,
        [groupCode]: { key, direction: "asc" },
      };
    });

    setGroupPageByCode((prev) => ({
      ...prev,
      [groupCode]: 1,
    }));
  };

  const updateGroupFilter = (
    groupCode: string,
    filterKey: keyof GroupFilters,
    value: string
  ) => {
    setGroupFiltersByCode((prev) => ({
      ...prev,
      [groupCode]: {
        ...(prev[groupCode] || defaultGroupFilters),
        [filterKey]: value,
      },
    }));
    setGroupPageByCode((prev) => ({
      ...prev,
      [groupCode]: 1,
    }));
  };

  // Group students by section, sorted within each group by progress desc
  const sectionGroups = useMemo((): SectionGroup[] => {
    const map = new Map<string, SectionGroup>();
    for (const student of students) {
      const key = student.section || "Unknown";
      const studentName =
        typeof student.sectionName === "string" ? student.sectionName.trim() : "";
      const mappedName = sectionNameByCode.get(key)?.trim() || "";
      const preferredName =
        studentName && studentName !== key ? studentName : mappedName;

      if (!map.has(key)) {
        map.set(key, {
          sectionCode: key,
          sectionName: preferredName,
          students: [],
          completedCount: 0,
        });
      }
      map.get(key)!.students.push(student);
    }
    // Sort students within each section by percent desc, then count completed
    const groups = Array.from(map.values());
    for (const group of groups) {
      group.students.sort((a, b) => getCompletionStats(b).percent - getCompletionStats(a).percent);
      group.completedCount = group.students.filter(isCompleted).length;
    }

    // Sort sections by preferred display name (fallback to section code)
    groups.sort((a, b) =>
      (a.sectionName || a.sectionCode).localeCompare(b.sectionName || b.sectionCode)
    );

    // Never show raw codes like CH078 as the visible group label
    groups.forEach((group, index) => {
      if (!group.sectionName || looksLikeSectionCode(group.sectionName)) {
        group.sectionName = `${sectionTerm} ${index + 1}`;
      }
    });

    return groups;
  }, [students, completionType, sectionNameByCode, sectionTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCompleted = useMemo(() => students.filter(isCompleted).length, [students, completionType]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedSectionLabel = useMemo(() => {
    if (!sectionCode) return `All ${sectionsTerm.toLowerCase()}`;
    const mappedName = sectionNameByCode.get(sectionCode);
    return mappedName
      ? `${sectionTerm}: ${mappedName}`
      : `Selected ${sectionTerm.toLowerCase()}`;
  }, [sectionCode, sectionNameByCode, sectionTerm, sectionsTerm]);
  const progressTitle = isCorporate
    ? "Program Progress"
    : `${labelMap[completionType]} Progress`;
  const learnersCompletedLabel =
    students.length === 1
      ? learnerTerm.toLowerCase()
      : learnersTerm.toLowerCase();
  const progressSearchLabel = isCorporate
    ? "program"
    : sectionTerm.toLowerCase();
  const filteredSectionGroups = useMemo(() => {
    const normalized = programSearch.trim().toLowerCase();
    if (!normalized) return sectionGroups;

    return sectionGroups.filter((group) =>
      group.sectionName.toLowerCase().includes(normalized)
    );
  }, [sectionGroups, programSearch]);
  const headerSearchAction = (
    <div className="w-[280px] md:w-[340px]">
      <input
        type="text"
        value={programSearch}
        onChange={(e) => setProgramSearch(e.target.value)}
        placeholder={`Search ${progressSearchLabel}`}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          onBack={() => navigate(`/${orgCode}/instructor/dashboard`)}
          icon={
            <ChartBarIcon size={16} style={{ color: "var(--color-primary, #2563eb)" }} />
          }
          iconStyle={{
            backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
          }}
          title={progressTitle}
          subtitle={`${totalCompleted} of ${students.length} ${learnersCompletedLabel} completed - ${selectedSectionLabel}`}
          actions={headerSearchAction}
        />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden animate-pulse">
                <div className="px-5 py-3 bg-gray-50 h-10" />
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-4 px-5 py-4 border-t border-gray-50">
                    <div className="h-9 w-9 rounded-full bg-gray-100 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded w-32" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-16 shadow-sm text-center">
            <ChartBarIcon size={36} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">
              No {learnersTerm.toLowerCase()} enrolled
            </p>
            <p className="text-sm text-gray-400 mt-1">
              No {learnersTerm.toLowerCase()} found in your{" "}
              {sectionsTerm.toLowerCase()}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSectionGroups.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 shadow-sm text-center text-sm text-gray-500">
                No {progressSearchLabel} matches "{programSearch.trim()}".
              </div>
            ) : (
              filteredSectionGroups.map((group) => {
              const groupCode = group.sectionCode;
              const sortState = getGroupSortState(groupCode);
              const filters = getGroupFiltersState(groupCode);

              const getStatusLabel = (
                overallPercent: number
              ): GroupPreparedRow["statusLabel"] => {
                if (overallPercent >= 100) return "Completed";
                if (overallPercent > 0) return "In Progress";
                return "Not Started";
              };

              const getStatusStyle = (
                statusLabel: GroupPreparedRow["statusLabel"]
              ) => {
                if (statusLabel === "Completed") {
                  return {
                    backgroundColor:
                      "color-mix(in srgb, var(--color-success, #10b981) 10%, white 90%)",
                    color:
                      "color-mix(in srgb, var(--color-success, #10b981) 80%, black 20%)",
                    borderColor:
                      "color-mix(in srgb, var(--color-success, #10b981) 25%, white 75%)",
                  };
                }
                if (statusLabel === "In Progress") {
                  return {
                    backgroundColor:
                      "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                    color: "var(--color-primary, #2563eb)",
                    borderColor:
                      "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                  };
                }
                return {
                  backgroundColor: "#f9fafb",
                  color: "#6b7280",
                  borderColor: "#e5e7eb",
                };
              };

              const preparedRows: GroupPreparedRow[] = group.students.map(
                (student) => {
                  const completedLessons = student.progress?.completedLessons ?? 0;
                  const totalLessons = student.progress?.totalLessons ?? 0;
                  const lessonPercent =
                    totalLessons > 0
                      ? Math.round((completedLessons / totalLessons) * 100)
                      : 0;

                  const completedAssessments =
                    student.progress?.completedAssessments ?? 0;
                  const totalAssessments =
                    student.progress?.totalAssessments ?? 0;
                  const assessmentPercent =
                    totalAssessments > 0
                      ? Math.round(
                          (completedAssessments / totalAssessments) * 100
                        )
                      : 0;

                  const overallCompleted =
                    completedLessons + completedAssessments;
                  const overallTotal = totalLessons + totalAssessments;
                  const overallPercent =
                    overallTotal > 0
                      ? Math.round((overallCompleted / overallTotal) * 100)
                      : 0;

                  return {
                    student,
                    completedLessons,
                    totalLessons,
                    lessonPercent,
                    completedAssessments,
                    totalAssessments,
                    assessmentPercent,
                    overallPercent,
                    statusLabel: getStatusLabel(overallPercent),
                  };
                }
              );

              const normalizedFilters = {
                employee: filters.employee.trim().toLowerCase(),
                program: filters.program.trim().toLowerCase(),
                assessments: filters.assessments.trim().toLowerCase(),
                status: filters.status.trim().toLowerCase(),
              };

              const filteredRows = preparedRows.filter((row) => {
                const employeeValue =
                  `${row.student.name} ${row.student.email}`.toLowerCase();
                const programValue =
                  `${row.completedLessons}/${row.totalLessons} ${row.lessonPercent}%`.toLowerCase();
                const assessmentsValue =
                  `${row.completedAssessments}/${row.totalAssessments} ${row.assessmentPercent}%`.toLowerCase();
                const statusValue = row.statusLabel.toLowerCase();

                return (
                  employeeValue.includes(normalizedFilters.employee) &&
                  programValue.includes(normalizedFilters.program) &&
                  assessmentsValue.includes(normalizedFilters.assessments) &&
                  statusValue.includes(normalizedFilters.status)
                );
              });

              const sortedRows = [...filteredRows].sort((a, b) => {
                let comparison = 0;

                if (sortState.key === "employee") {
                  comparison = (a.student.name || "").localeCompare(
                    b.student.name || "",
                    undefined,
                    { sensitivity: "base" }
                  );
                } else if (sortState.key === "program") {
                  comparison =
                    a.lessonPercent - b.lessonPercent ||
                    a.completedLessons - b.completedLessons ||
                    a.totalLessons - b.totalLessons;
                } else if (sortState.key === "assessments") {
                  comparison =
                    a.assessmentPercent - b.assessmentPercent ||
                    a.completedAssessments - b.completedAssessments ||
                    a.totalAssessments - b.totalAssessments;
                } else {
                  const statusRank: Record<
                    GroupPreparedRow["statusLabel"],
                    number
                  > = {
                    "Not Started": 0,
                    "In Progress": 1,
                    Completed: 2,
                  };
                  comparison =
                    statusRank[a.statusLabel] - statusRank[b.statusLabel];
                }

                return sortState.direction === "asc" ? comparison : -comparison;
              });

              const requestedPage = groupPageByCode[groupCode] || 1;
              const totalPages = Math.max(
                1,
                Math.ceil(sortedRows.length / groupPageSize)
              );
              const currentPage = Math.min(requestedPage, totalPages);
              const pageStartIndex = (currentPage - 1) * groupPageSize;
              const pagedRows = sortedRows.slice(
                pageStartIndex,
                pageStartIndex + groupPageSize
              );

              const sortIndicator = (key: GroupSortKey) => {
                if (sortState.key !== key) return "↕";
                return sortState.direction === "asc" ? "↑" : "↓";
              };

              return (
              <div
                key={group.sectionCode}
                className="rounded-2xl border shadow-sm overflow-hidden"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)",
                  borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                }}
              >
                {/* Section header */}
                <div
                  className="flex items-center justify-between px-5 py-3 border-b"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                    borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 15%, white 85%)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">
                      {group.sectionName}
                    </span>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-0.5 rounded-full border"
                    style={{
                      color: "color-mix(in srgb, var(--color-primary, #3b82f6) 80%, black 20%)",
                      backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 10%, white 90%)",
                      borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 20%, white 80%)",
                    }}
                  >
                    {group.completedCount} / {group.students.length} completed
                  </span>
                </div>

                {/* Students table */}
                <div className="bg-white overflow-x-auto">
                    <table className="w-full min-w-[980px]">
                      <thead>
                        <tr
                          className="border-b"
                          style={{
                            backgroundColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 5%, white 95%)",
                            borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                          }}
                        >
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <button
                              type="button"
                              onClick={() => toggleGroupSort(groupCode, "employee")}
                              className="inline-flex items-center gap-1 hover:text-gray-700"
                            >
                              {learnerTerm}
                              <span className="text-[10px]">
                                {sortIndicator("employee")}
                              </span>
                            </button>
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <button
                              type="button"
                              onClick={() => toggleGroupSort(groupCode, "program")}
                              className="inline-flex items-center gap-1 hover:text-gray-700"
                            >
                              Lessons Progress
                              <span className="text-[10px]">
                                {sortIndicator("program")}
                              </span>
                            </button>
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <button
                              type="button"
                              onClick={() => toggleGroupSort(groupCode, "assessments")}
                              className="inline-flex items-center gap-1 hover:text-gray-700"
                            >
                              Assessments Progress
                              <span className="text-[10px]">
                                {sortIndicator("assessments")}
                              </span>
                            </button>
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <button
                              type="button"
                              onClick={() => toggleGroupSort(groupCode, "status")}
                              className="inline-flex items-center gap-1 hover:text-gray-700"
                            >
                              Status
                              <span className="text-[10px]">
                                {sortIndicator("status")}
                              </span>
                            </button>
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                        <tr
                          className="border-b"
                          style={{
                            borderColor:
                              "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                            backgroundColor: "white",
                          }}
                        >
                          <th className="px-5 py-2">
                            <input
                              type="text"
                              value={filters.employee}
                              onChange={(e) =>
                                updateGroupFilter(groupCode, "employee", e.target.value)
                              }
                              placeholder={`Search ${learnerTerm.toLowerCase()}`}
                              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </th>
                          <th className="px-5 py-2">
                            <input
                              type="text"
                              value={filters.program}
                              onChange={(e) =>
                                updateGroupFilter(groupCode, "program", e.target.value)
                              }
                              placeholder="Search lessons progress"
                              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </th>
                          <th className="px-5 py-2">
                            <input
                              type="text"
                              value={filters.assessments}
                              onChange={(e) =>
                                updateGroupFilter(groupCode, "assessments", e.target.value)
                              }
                              placeholder="Search assessments progress"
                              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </th>
                          <th className="px-5 py-2">
                            <input
                              type="text"
                              value={filters.status}
                              onChange={(e) =>
                                updateGroupFilter(groupCode, "status", e.target.value)
                              }
                              placeholder="Search status"
                              className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                          </th>
                          <th className="px-5 py-2 text-right">
                            <span className="text-[11px] text-gray-400">
                              {filteredRows.length} result
                              {filteredRows.length !== 1 ? "s" : ""}
                            </span>
                          </th>
                        </tr>
                      </thead>
                    <tbody
                      className="divide-y"
                      style={{
                        borderColor: "color-mix(in srgb, var(--color-primary, #3b82f6) 8%, white 92%)",
                      }}
                    >
                      {pagedRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-5 py-8 text-center text-sm text-gray-500"
                          >
                            No matching {learnersTerm.toLowerCase()} in this{" "}
                            {sectionTerm.toLowerCase()}.
                          </td>
                        </tr>
                      ) : (
                        pagedRows.map((row) => {
                          const { student } = row;
                          const initials =
                            student.name?.charAt(0)?.toUpperCase() || "?";

                          return (
                            <tr
                              key={student._id}
                              className="cursor-pointer transition-colors hover:brightness-[0.98]"
                              style={{ backgroundColor: "white" }}
                              onClick={() => openStudentDetails(student._id)}
                              onMouseEnter={(e) =>
                                ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                  "color-mix(in srgb, var(--color-primary, #3b82f6) 4%, white 96%)")
                              }
                              onMouseLeave={(e) =>
                                ((e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                                  "white")
                              }
                            >
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{
                                      backgroundColor:
                                        "color-mix(in srgb, var(--color-primary, #3b82f6) 12%, white 88%)",
                                      color: "var(--color-primary, #2563eb)",
                                    }}
                                  >
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">
                                      {student.name}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {student.email}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-5 py-4 min-w-[240px]">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${row.lessonPercent}%`,
                                        backgroundColor:
                                          row.lessonPercent >= 100
                                            ? "var(--color-success, #10b981)"
                                            : row.lessonPercent > 0
                                            ? "var(--color-primary, #3b82f6)"
                                            : "#d1d5db",
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 tabular-nums min-w-[56px] text-right">
                                    {row.completedLessons}/{row.totalLessons}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4 min-w-[260px]">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${row.assessmentPercent}%`,
                                        backgroundColor:
                                          row.assessmentPercent >= 100
                                            ? "var(--color-success, #10b981)"
                                            : row.assessmentPercent > 0
                                            ? "var(--color-primary, #3b82f6)"
                                            : "#d1d5db",
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium text-gray-700 tabular-nums min-w-[56px] text-right">
                                    {row.completedAssessments}/{row.totalAssessments}
                                  </span>
                                </div>
                              </td>

                              <td className="px-5 py-4">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                                  style={getStatusStyle(row.statusLabel)}
                                >
                                  {row.statusLabel}
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openStudentDetails(student._id);
                                  }}
                                  className="text-xs font-medium hover:underline transition-colors"
                                  style={{ color: "var(--color-primary, #2563eb)" }}
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    {sortedRows.length === 0
                      ? 0
                      : `${pageStartIndex + 1}-${Math.min(
                          pageStartIndex + groupPageSize,
                          sortedRows.length
                        )}`}{" "}
                    of {sortedRows.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setGroupPageByCode((prev) => ({
                          ...prev,
                          [groupCode]: Math.max(1, currentPage - 1),
                        }))
                      }
                      disabled={currentPage <= 1}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-gray-600 min-w-[70px] text-center">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setGroupPageByCode((prev) => ({
                          ...prev,
                          [groupCode]: Math.min(totalPages, currentPage + 1),
                        }))
                      }
                      disabled={currentPage >= totalPages}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            );
            })
            )}
          </div>
        )}
      </div>

      {selectedStudentId && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
            onClick={closeStudentDetails}
            aria-label="Close student details panel"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                    {learnerTerm} Completion Details
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">
                    {studentDetails?.name ||
                      `Loading ${learnerTerm.toLowerCase()}...`}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {studentDetails?.email || "Fetching details..."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeStudentDetails}
                  className="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-colors"
                  aria-label="Close details"
                >
                  x
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {isStudentDetailsLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-24 rounded-xl bg-gray-100" />
                  <div className="h-56 rounded-xl bg-gray-100" />
                  <div className="h-56 rounded-xl bg-gray-100" />
                </div>
              ) : isStudentDetailsError || !studentDetails ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">
                    Unable to load {learnerTerm.toLowerCase()} details right now.
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Please try again, or open the full details page.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Overall</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailOverallPercent}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Completion rate</p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Lessons</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailLessonTotals.completed}/{detailLessonTotals.total}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Completed lessons</p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Assessments</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailAssessmentTotals.completed}/{detailAssessmentTotals.total}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Submitted assessments</p>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs text-gray-500 uppercase tracking-wide">GPA</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {Number(studentDetails.gpa || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {studentDetails.program || "Program not set"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Section Breakdown</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Lessons, assessments, grade, and pass/fail status per section.
                      </p>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[880px]">
                        <thead>
                          <tr className="border-b border-gray-200 bg-white">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Section / Course
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Lessons
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Assessments
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Grade
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                              Result
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {detailCourseBreakdown.length > 0 ? (
                            detailCourseBreakdown.map((course, idx) => {
                              const lessonsCompleted = course.progress?.completedLessons || 0;
                              const lessonsTotal = course.progress?.totalLessons || 0;
                              const lessonsPct =
                                lessonsTotal > 0
                                  ? Math.round((lessonsCompleted / lessonsTotal) * 100)
                                  : 0;
                              const assessmentsCompleted =
                                course.progress?.completedAssessments || 0;
                              const assessmentsTotal = course.progress?.totalAssessments || 0;
                              const assessmentsPct =
                                assessmentsTotal > 0
                                  ? Math.round(
                                      (assessmentsCompleted / assessmentsTotal) * 100
                                    )
                                  : 0;
                              const result = getCourseResult(course);

                              return (
                                <tr key={`${course.section || course.course}-${idx}`}>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {course.section || "Section"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{course.course}</p>
                                  </td>
                                  <td className="px-4 py-4 min-w-[190px]">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{
                                            width: `${lessonsPct}%`,
                                            backgroundColor:
                                              lessonsPct >= 100
                                                ? "var(--color-success, #10b981)"
                                                : lessonsPct > 0
                                                ? "var(--color-primary, #3b82f6)"
                                                : "#d1d5db",
                                          }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-gray-700 tabular-nums min-w-[56px] text-right">
                                        {lessonsCompleted}/{lessonsTotal}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4 min-w-[220px]">
                                    <div className="flex items-center gap-3">
                                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{
                                            width: `${assessmentsPct}%`,
                                            backgroundColor:
                                              assessmentsPct >= 100
                                                ? "var(--color-success, #10b981)"
                                                : assessmentsPct > 0
                                                ? "var(--color-primary, #3b82f6)"
                                                : "#d1d5db",
                                          }}
                                        />
                                      </div>
                                      <span className="text-sm font-medium text-gray-700 tabular-nums min-w-[56px] text-right">
                                        {assessmentsCompleted}/{assessmentsTotal}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {Number(course.grade || 0).toFixed(2)}
                                    </p>
                                  </td>
                                  <td className="px-4 py-4">
                                    <span
                                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                                      style={
                                        result === "Pass"
                                          ? {
                                              backgroundColor:
                                                "color-mix(in srgb, var(--color-success, #10b981) 10%, white 90%)",
                                              color:
                                                "color-mix(in srgb, var(--color-success, #10b981) 80%, black 20%)",
                                              borderColor:
                                                "color-mix(in srgb, var(--color-success, #10b981) 25%, white 75%)",
                                            }
                                          : result === "Fail"
                                          ? {
                                              backgroundColor:
                                                "color-mix(in srgb, var(--color-danger, #ef4444) 10%, white 90%)",
                                              color:
                                                "color-mix(in srgb, var(--color-danger, #ef4444) 80%, black 20%)",
                                              borderColor:
                                                "color-mix(in srgb, var(--color-danger, #ef4444) 25%, white 75%)",
                                            }
                                          : {
                                              backgroundColor: "#f9fafb",
                                              color: "#6b7280",
                                              borderColor: "#e5e7eb",
                                            }
                                      }
                                    >
                                      {result}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                                No section breakdown found for this{" "}
                                {learnerTerm.toLowerCase()}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end">
                    <button
                      type="button"
                      onClick={closeStudentDetails}
                      className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-300 hover:text-gray-800"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/${orgCode}/instructor/completion/${selectedStudentId}`)
                      }
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style={{ backgroundColor: "var(--color-primary, #2563eb)" }}
                    >
                      Open Full Details Page
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}


