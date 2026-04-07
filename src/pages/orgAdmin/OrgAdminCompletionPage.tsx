import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChartBarIcon } from "@/components/ui/chart-bar-icon";
import PageHeader from "../../components/common/PageHeader";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import { useAuth } from "../../context/AuthContext";
import { useAdminCompletionOverview } from "../../hooks/useSection";
import { getTerm } from "../../lib/utils";

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
  batchPercent: number;
  status: "completed" | "in_progress" | "not_started";
};

type BatchDrilldown = {
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

const statusLabelMap: Record<EmployeeCompletionRow["status"], string> = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

const getStatusStyle = (status: EmployeeCompletionRow["status"]) => {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "in_progress") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
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

  const sections = useMemo(() => {
    const payload = completionOverviewData as
      | {
          sections?: CompletionSection[];
          documents?: CompletionSection[];
          data?: { sections?: CompletionSection[]; documents?: CompletionSection[] };
        }
      | undefined;

    if (Array.isArray(payload?.sections)) return payload.sections;
    if (Array.isArray(payload?.documents)) return payload.documents;
    if (Array.isArray(payload?.data?.sections)) return payload.data.sections;
    if (Array.isArray(payload?.data?.documents)) return payload.data.documents;
    return [] as CompletionSection[];
  }, [completionOverviewData]);

  const completionData = useMemo(() => {
    const employeeRows: EmployeeCompletionRow[] = [];
    const batches: BatchDrilldown[] = [];
    const employeeIds = new Set<string>();
    let completedBatchRows = 0;
    let totalBatchRows = 0;
    let completedModuleSlots = 0;
    let totalModuleSlots = 0;
    let completedLessonSlots = 0;
    let totalLessonSlots = 0;

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
        const batchPercent = lessonPercent;

        const status: EmployeeCompletionRow["status"] =
          batchPercent >= 100 && totalLessons > 0
            ? "completed"
            : batchPercent > 0
              ? "in_progress"
              : "not_started";

        totalBatchRows += 1;
        if (status === "completed") completedBatchRows += 1;
        completedModuleSlots += completedModules;
        totalModuleSlots += totalModules;
        completedLessonSlots += completedLessons;
        totalLessonSlots += totalLessons;

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
          batchPercent,
          status,
        });
      });
    });

    const groupMap = new Map<string, GroupedTableGroup<EmployeeCompletionRow>>();
    employeeRows.forEach((row) => {
      if (!groupMap.has(row.instructorId)) {
        groupMap.set(row.instructorId, {
          key: row.instructorId,
          title: row.instructorName,
          rows: [],
          badgeText: "",
        });
      }
      groupMap.get(row.instructorId)?.rows.push(row);
    });

    const groups = Array.from(groupMap.values())
      .map((group) => ({
        ...group,
        rows: [...group.rows].sort((a, b) => b.batchPercent - a.batchPercent),
        badgeText: `${group.rows.length} assignments`,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    const sortedBatches = [...batches].sort((a, b) => {
      const instructorCompare = a.instructorName.localeCompare(b.instructorName);
      if (instructorCompare !== 0) return instructorCompare;
      return `${a.batchCode}-${a.batchName}`.localeCompare(`${b.batchCode}-${b.batchName}`);
    });

    return {
      groups,
      batches: sortedBatches,
      metrics: {
        employeesTracked: employeeIds.size,
        completedBatchRows,
        totalBatchRows,
        completedModuleSlots,
        totalModuleSlots,
        completedLessonSlots,
        totalLessonSlots,
      },
    };
  }, [sections]);

  const tableColumns = useMemo(
    (): GroupedTableColumn<EmployeeCompletionRow>[] => [
      {
        key: "employeeName",
        label: learnerTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${learnerTerm.toLowerCase()}`,
        sortAccessor: (row) => row.employeeName,
        filterAccessor: (row) => `${row.employeeName} ${row.employeeEmail}`.trim(),
        render: (row) => (
          <div>
            <p className="text-sm font-semibold text-slate-900">{row.employeeName}</p>
            <p className="text-xs text-slate-500">{row.employeeEmail || "--"}</p>
          </div>
        ),
      },
      {
        key: "batchName",
        label: sectionTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${sectionTerm.toLowerCase()}`,
        sortAccessor: (row) => `${row.batchCode} ${row.batchName}`.trim(),
        filterAccessor: (row) => `${row.batchCode} ${row.batchName}`.trim(),
        render: (row) => (
          <div>
            <p className="text-sm font-medium text-slate-800">
              {row.batchCode ? `${row.batchCode} - ` : ""}
              {row.batchName}
            </p>
          </div>
        ),
      },
      {
        key: "modules",
        label: "Modules",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search module %",
        sortAccessor: (row) => row.modulePercent,
        filterAccessor: (row) =>
          `${row.modulePercent} ${row.completedModules}/${row.totalModules}`,
        render: (row) => (
          <div className="space-y-1">
            <p className="text-sm text-slate-700">
              {row.completedModules}/{row.totalModules}
            </p>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${row.modulePercent}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: "lessons",
        label: "Lessons",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search lesson %",
        sortAccessor: (row) => row.lessonPercent,
        filterAccessor: (row) =>
          `${row.lessonPercent} ${row.completedLessons}/${row.totalLessons}`,
        render: (row) => (
          <div className="space-y-1">
            <p className="text-sm text-slate-700">
              {row.completedLessons}/{row.totalLessons}
            </p>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-500"
                style={{ width: `${row.lessonPercent}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        key: "batchPercent",
        label: `${sectionTerm} Completion`,
        sortable: true,
        sortAccessor: (row) => row.batchPercent,
        render: (row) => (
          <div className="min-w-[140px]">
            <p className="text-xs font-semibold text-slate-700 mb-1">
              {row.batchPercent}%
            </p>
            <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${row.batchPercent}%` }}
              />
            </div>
          </div>
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
        sortAccessor: (row) => statusLabelMap[row.status],
        filterAccessor: (row) => row.status,
        render: (row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
              row.status,
            )}`}
          >
            {statusLabelMap[row.status]}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Action",
        align: "right",
        render: (row) => (
          <button
            type="button"
            className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => navigate(`/${orgCode}/admin/section/${row.batchCode}`)}
            data-row-click-stop="true"
            disabled={!row.batchCode}
          >
            View Batch
          </button>
        ),
      },
    ],
    [learnerTerm, navigate, orgCode, sectionTerm],
  );

  const moduleCompletionPercent = buildPercent(
    completionData.metrics.completedModuleSlots,
    completionData.metrics.totalModuleSlots,
  );
  const lessonCompletionPercent = buildPercent(
    completionData.metrics.completedLessonSlots,
    completionData.metrics.totalLessonSlots,
  );

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
          title={`${learnersTerm} Completion Tracker`}
          subtitle={`Completion progress across instructors, ${sectionsTerm.toLowerCase()}, modules, and lessons.`}
        />

        {isPending ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
            Loading completion tracker...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Employees Tracked
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {completionData.metrics.employeesTracked}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Completed {sectionsTerm}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {completionData.metrics.completedBatchRows}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  of {completionData.metrics.totalBatchRows} employee assignments
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Module Completion
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {moduleCompletionPercent}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {completionData.metrics.completedModuleSlots}/
                  {completionData.metrics.totalModuleSlots} module slots
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Lesson Completion
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {lessonCompletionPercent}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {completionData.metrics.completedLessonSlots}/
                  {completionData.metrics.totalLessonSlots} lesson slots
                </p>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {learnersTerm} Completion by Instructor
                </h2>
                <p className="text-sm text-slate-600">
                  Use column filters to find who finished lessons, modules, and each {sectionTerm.toLowerCase()}.
                </p>
              </div>
              {completionData.groups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  No completion records found.
                </div>
              ) : (
                <GroupedDataTable
                  groups={completionData.groups}
                  columns={tableColumns}
                  rowKey={(row) => row.id}
                  pageSize={8}
                  emptyFilteredText={`No matching ${learnersTerm.toLowerCase()} found.`}
                  tableMinWidthClassName="min-w-[1120px]"
                />
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  {sectionsTerm} Module and Lesson Drilldown
                </h2>
                <p className="text-sm text-slate-600">
                  Expand each {sectionTerm.toLowerCase()} to view module and lesson completion percentages.
                </p>
              </div>
              {completionData.batches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                  No {sectionsTerm.toLowerCase()} available.
                </div>
              ) : (
                <div className="space-y-3">
                  {completionData.batches.map((batch) => (
                    <details
                      key={batch.batchId}
                      className="rounded-xl border border-slate-200 bg-slate-50/70"
                    >
                      <summary className="cursor-pointer list-none px-4 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {batch.batchCode ? `${batch.batchCode} - ` : ""}
                              {batch.batchName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {batch.instructorName} • {batch.learnerCount} {learnersTerm.toLowerCase()} •{" "}
                              {batch.modules.length} modules
                            </p>
                          </div>
                          <div className="min-w-[180px]">
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${batch.percent}%` }}
                              />
                            </div>
                            <p className="mt-1 text-right text-xs font-medium text-slate-600">
                              {batch.percent}% completed
                            </p>
                          </div>
                        </div>
                      </summary>
                      <div className="border-t border-slate-200 px-4 py-3 bg-white/80 space-y-2">
                        {batch.modules.length === 0 ? (
                          <p className="text-xs text-slate-500">
                            No published modules with lessons in this {sectionTerm.toLowerCase()}.
                          </p>
                        ) : (
                          batch.modules.map((module) => (
                            <div
                              key={module.id}
                              className="rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-medium text-slate-800">
                                  {module.title}
                                </p>
                                <span className="text-xs font-semibold text-slate-700">
                                  {module.percent}%
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                  style={{ width: `${module.percent}%` }}
                                />
                              </div>
                              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-1.5">
                                {module.lessons.map((lesson) => (
                                  <div
                                    key={lesson.id}
                                    className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5"
                                  >
                                    <p className="text-xs font-medium text-slate-700 truncate">
                                      {lesson.title}
                                    </p>
                                    <p className="text-[11px] text-slate-500">
                                      {lesson.percent}% ({lesson.completedCount}/
                                      {lesson.learnerCount})
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
