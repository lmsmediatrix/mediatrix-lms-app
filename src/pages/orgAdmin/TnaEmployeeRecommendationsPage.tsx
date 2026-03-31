import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import {
  GroupedTableColumn,
  GroupedTableGroup,
  default as GroupedDataTable,
} from "../../components/common/GroupedDataTable";
import { useSearchStudents } from "../../hooks/useStudent";
import { useGetTnaRecommendations } from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type EmployeeOption = {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type RecommendationCourse = {
  code?: string;
  title?: string;
};

type RecommendationSkillGap = {
  skillName?: string;
  requiredLevel?: number;
  currentLevel?: number;
  gap?: number;
};

type RecommendationTraining = {
  course?: RecommendationCourse | string;
  title?: string;
  reasonType?: string;
  reasonDetail?: string;
  priority?: string;
  mandatory?: boolean;
};

type TnaRecommendation = {
  _id: string;
  employee?: { _id: string; firstName?: string; lastName?: string; email?: string } | string;
  jobRole?: string;
  createdAt?: string;
  status?: string;
  skillGaps?: RecommendationSkillGap[];
  recommendedTrainings?: RecommendationTraining[];
  preAssessment?: { score?: number; threshold?: number; requiresTraining?: boolean };
  performanceGaps?: string[];
  managerRecommendations?: string[];
  employeeRequests?: string[];
};

type EmployeeSummaryRow = {
  employee: EmployeeOption;
  latest?: TnaRecommendation;
  hasTna: boolean;
  skillGapCount: number;
  recommendedTrainingCount: number;
};

type RecommendationStatus = "pending" | "assigned" | "completed";

const normalizeStatus = (status?: string): RecommendationStatus => {
  if (status === "assigned" || status === "completed") return status;
  return "pending";
};

const getEmployeeIdFromRecommendation = (
  recommendation: TnaRecommendation,
): string | null => {
  if (typeof recommendation.employee === "string") return recommendation.employee;
  if (recommendation.employee?._id) return recommendation.employee._id;
  return null;
};

const getEmployeeDisplayName = (employee?: EmployeeOption): string => {
  if (!employee) return "--";
  const fullName = [employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "--";
};

const formatReasonType = (reasonType?: string): string => {
  if (!reasonType) return "other";
  return reasonType.replace(/_/g, " ");
};

const getCourseLabel = (course?: RecommendationCourse | string): string | null => {
  if (!course || typeof course === "string") return null;
  const label = [course.code, course.title].filter(Boolean).join(" - ").trim();
  return label || null;
};

export default function TnaEmployeeRecommendationsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const orgCode = currentUser?.user?.organization?.code || "";
  const organizationId = currentUser?.user?.organization?._id;
  const orgType = currentUser?.user?.organization?.type || "school";
  const employeeTerm = getTerm("learner", orgType);
  const employeesTerm = getTerm("learner", orgType, true);

  const studentsQuery = useSearchStudents({
    organizationId,
    limit: 500,
    skip: 0,
    archiveStatus: "none",
  });

  const recommendationsQuery = useGetTnaRecommendations({
    limit: 500,
    skip: 0,
  });

  const employees = useMemo(() => {
    const response = studentsQuery.data as { students?: EmployeeOption[] } | undefined;
    return Array.isArray(response?.students) ? response.students : [];
  }, [studentsQuery.data]);

  const recommendations = useMemo(() => {
    const response = recommendationsQuery.data as
      | { data?: TnaRecommendation[] }
      | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [recommendationsQuery.data]);

  const latestRecommendationByEmployee = useMemo(() => {
    const map = new Map<string, TnaRecommendation>();
    for (const recommendation of recommendations) {
      const employeeId = getEmployeeIdFromRecommendation(recommendation);
      if (!employeeId) continue;
      const existing = map.get(employeeId);
      if (!existing) {
        map.set(employeeId, recommendation);
        continue;
      }

      const existingDate = new Date(existing.createdAt || 0).getTime();
      const currentDate = new Date(recommendation.createdAt || 0).getTime();
      if (currentDate > existingDate) {
        map.set(employeeId, recommendation);
      }
    }
    return map;
  }, [recommendations]);

  const [viewDetails, setViewDetails] = useState<{
    employee: EmployeeOption;
    recommendation: TnaRecommendation | null;
  } | null>(null);

  const openDetails = (
    employee: EmployeeOption,
    recommendation?: TnaRecommendation,
  ) => {
    setViewDetails({
      employee,
      recommendation: recommendation || null,
    });
  };

  const selectedRecommendation = viewDetails?.recommendation || null;

  const employeeRows = useMemo((): EmployeeSummaryRow[] => {
    const rows = employees.map((employee) => {
      const latest = latestRecommendationByEmployee.get(employee._id);
      const hasTna = Boolean(latest);
      const skillGapCount = Array.isArray(latest?.skillGaps) ? latest?.skillGaps.length : 0;
      const recommendedTrainingCount = Array.isArray(latest?.recommendedTrainings)
        ? latest.recommendedTrainings.length
        : 0;

      return {
        employee,
        latest,
        hasTna,
        skillGapCount,
        recommendedTrainingCount,
      };
    });

    return rows.sort((a, b) => {
      const aHasTna = a.hasTna ? 1 : 0;
      const bHasTna = b.hasTna ? 1 : 0;
      if (aHasTna !== bHasTna) return bHasTna - aHasTna;
      return getEmployeeDisplayName(a.employee).localeCompare(getEmployeeDisplayName(b.employee));
    });
  }, [employees, latestRecommendationByEmployee]);

  const employeesWithTna = useMemo(
    () =>
      employees.filter((employee) => latestRecommendationByEmployee.has(employee._id))
        .length,
    [employees, latestRecommendationByEmployee],
  );

  const employeesWithoutTna = employees.length - employeesWithTna;

  const tableGroups = useMemo(
    (): GroupedTableGroup<EmployeeSummaryRow>[] => [
      {
        key: "all-employees",
        title: `All ${employeesTerm}`,
        rows: employeeRows,
        badgeText: `${employeeRows.length} total`,
      },
    ],
    [employeeRows, employeesTerm],
  );

  const tableColumns = useMemo(
    (): GroupedTableColumn<EmployeeSummaryRow>[] => [
      {
        key: "employee",
        label: employeeTerm,
        sortable: true,
        filterable: true,
        filterPlaceholder: `Search ${employeeTerm.toLowerCase()}`,
        sortAccessor: (row) => getEmployeeDisplayName(row.employee),
        filterAccessor: (row) =>
          `${getEmployeeDisplayName(row.employee)} ${row.employee.email || ""}`.trim(),
        className: "min-w-[220px]",
        render: (row) => (
          <span className="text-sm font-semibold text-slate-900">
            {getEmployeeDisplayName(row.employee)}
          </span>
        ),
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search email",
        sortAccessor: (row) => row.employee.email || "",
        filterAccessor: (row) => row.employee.email || "",
        className: "min-w-[220px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-600">{row.employee.email || "--"}</span>
        ),
      },
      {
        key: "role",
        label: "Role",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search role",
        sortAccessor: (row) => row.latest?.jobRole || "",
        filterAccessor: (row) => row.latest?.jobRole || "",
        className: "min-w-[150px]",
        render: (row) => <span className="text-sm text-slate-700">{row.latest?.jobRole || "--"}</span>,
      },
      {
        key: "latestTna",
        label: "Latest TNA",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search date",
        sortAccessor: (row) => (row.latest?.createdAt ? new Date(row.latest.createdAt).getTime() : 0),
        filterAccessor: (row) =>
          row.latest?.createdAt ? new Date(row.latest.createdAt).toLocaleString() : "",
        className: "min-w-[200px] hidden md:table-cell",
        render: (row) => (
          <span className="text-sm text-slate-600 whitespace-nowrap">
            {row.latest?.createdAt ? new Date(row.latest.createdAt).toLocaleString() : "--"}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search status",
        sortAccessor: (row) => normalizeStatus(row.latest?.status),
        filterAccessor: (row) => normalizeStatus(row.latest?.status),
        className: "min-w-[130px]",
        render: (row) =>
          row.latest ? (
            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 capitalize">
              {normalizeStatus(row.latest.status)}
            </span>
          ) : (
            <span className="text-slate-400">--</span>
          ),
      },
      {
        key: "skillGaps",
        label: "Skill Gaps",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) => row.skillGapCount,
        filterAccessor: (row) => String(row.skillGapCount),
        align: "right",
        className: "min-w-[120px]",
        render: (row) => <span className="text-sm text-slate-700">{row.skillGapCount}</span>,
      },
      {
        key: "recommended",
        label: "Recommended",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search count",
        sortAccessor: (row) => row.recommendedTrainingCount,
        filterAccessor: (row) => String(row.recommendedTrainingCount),
        align: "right",
        className: "min-w-[130px]",
        render: (row) => <span className="text-sm text-slate-700">{row.recommendedTrainingCount}</span>,
      },
      {
        key: "preTest",
        label: "Pre-test",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search pre-test",
        sortAccessor: (row) => row.latest?.preAssessment?.score ?? -1,
        filterAccessor: (row) =>
          typeof row.latest?.preAssessment?.score === "number"
            ? `${row.latest.preAssessment.score}% / ${row.latest.preAssessment.threshold ?? 70}%`
            : "",
        className: "min-w-[170px] hidden md:table-cell",
        render: (row) => {
          const hasPreTest = typeof row.latest?.preAssessment?.score === "number";
          return (
            <span className="text-sm text-slate-700 whitespace-nowrap">
              {hasPreTest
                ? `${row.latest?.preAssessment?.score}% / ${row.latest?.preAssessment?.threshold ?? 70}%`
                : "--"}
            </span>
          );
        },
      },
      {
        key: "tna",
        label: "TNA",
        sortable: true,
        filterable: true,
        filterPlaceholder: "Search TNA status",
        sortAccessor: (row) => (row.hasTna ? "has tna" : "no tna"),
        filterAccessor: (row) => (row.hasTna ? "has tna" : "no tna"),
        className: "min-w-[120px]",
        render: (row) => (
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
              row.hasTna
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-slate-50 text-slate-500"
            }`}
          >
            {row.hasTna ? "Has TNA" : "No TNA"}
          </span>
        ),
      },
      {
        key: "action",
        label: "Action",
        align: "right",
        className: "min-w-[120px]",
        render: (row) => (
          <button
            type="button"
            data-row-click-stop="true"
            onClick={(event) => {
              event.stopPropagation();
              openDetails(row.employee, row.latest);
            }}
            className={`inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-xs font-medium ${
              row.latest
                ? "border-primary text-primary hover:bg-primary/5"
                : "border-slate-300 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {row.latest ? "View" : "No TNA"}
          </button>
        ),
      },
    ],
    [employeeTerm],
  );

  return (
    <div className="pt-14 pb-6 px-4 md:px-6 lg:p-6 space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(`/${orgCode}/admin/tna`)}
              className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Back to TNA"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                TNA Dashboard
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                {employeeTerm} TNA Recommendations
              </h1>
              <p className="text-sm text-slate-600 mt-1">
                View who has TNA results, plus detailed skill gaps and training recommendations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm min-w-[230px]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">Total {employeesTerm}</p>
              <p className="text-lg font-semibold text-slate-900">{employees.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">With TNA</p>
              <p className="text-lg font-semibold text-emerald-700">{employeesWithTna}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 col-span-2">
              <p className="text-xs text-amber-700">Without TNA</p>
              <p className="text-lg font-semibold text-amber-700">{employeesWithoutTna}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-4 min-h-[480px]">
        <div className="border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              All {employeesTerm}
            </p>
            <h2 className="text-xl font-semibold text-slate-900">Employee TNA Summary Table</h2>
            <p className="text-sm text-slate-500 mt-1">
              One row per employee. Click a row (or view) to open full skill gaps and recommendations.
            </p>
          </div>
        </div>

        {studentsQuery.isLoading ? (
          <p className="text-sm text-slate-500">Loading {employeesTerm.toLowerCase()}...</p>
        ) : employeeRows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
            No matching {employeesTerm.toLowerCase()} found.
          </div>
        ) : (
          <GroupedDataTable
            groups={tableGroups}
            columns={tableColumns}
            rowKey={(row) => row.employee._id}
            emptyFilteredText={`No matching ${employeesTerm.toLowerCase()} found.`}
            tableMinWidthClassName="min-w-[1250px]"
            cardless
            showGroupHeader={false}
            onRowClick={(row) => openDetails(row.employee, row.latest)}
          />
        )}
      </section>

      {viewDetails && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl max-h-[88vh] overflow-hidden">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {selectedRecommendation ? "TNA Recommendation Details" : "TNA Status"}
                </p>
                <h3 className="text-lg font-semibold text-slate-900 mt-1">
                  {getEmployeeDisplayName(viewDetails.employee)} |{" "}
                  {selectedRecommendation?.jobRole || "No TNA Yet"}
                </h3>
                {selectedRecommendation ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selectedRecommendation.createdAt || Date.now()).toLocaleString()} | status:{" "}
                    <span className="capitalize">{normalizeStatus(selectedRecommendation.status)}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">
                    This employee does not have a generated TNA recommendation yet.
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setViewDetails(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                aria-label="Close details modal"
              >
                <span className="text-base leading-none">x</span>
              </button>
            </div>

            <div className="max-h-[calc(88vh-80px)] overflow-y-auto px-5 py-4 space-y-4">
              {!selectedRecommendation ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
                  <p className="text-sm font-semibold text-slate-800">No TNA record available yet</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Run TNA analysis for this employee to generate skill gaps and training
                    recommendations.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="font-semibold text-slate-600 mb-1">Skill Gaps</p>
                      <p className="text-slate-800">
                        {Array.isArray(selectedRecommendation.skillGaps)
                          ? selectedRecommendation.skillGaps.length
                          : 0}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="font-semibold text-slate-600 mb-1">Recommended Trainings</p>
                      <p className="text-slate-800">
                        {Array.isArray(selectedRecommendation.recommendedTrainings)
                          ? selectedRecommendation.recommendedTrainings.length
                          : 0}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="font-semibold text-slate-600 mb-1">Pre-test</p>
                      <p className="text-slate-800">
                        {typeof selectedRecommendation.preAssessment?.score === "number"
                          ? `${selectedRecommendation.preAssessment.score}% (threshold ${selectedRecommendation.preAssessment.threshold ?? 70}%)`
                          : "--"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Skill Gaps
                      </p>
                      {!Array.isArray(selectedRecommendation.skillGaps) ||
                      selectedRecommendation.skillGaps.length === 0 ? (
                        <p className="text-sm text-slate-500 mt-2">No skill gaps.</p>
                      ) : (
                        <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                          {selectedRecommendation.skillGaps.map((gapItem, index) => (
                            <li key={`${selectedRecommendation._id}-gap-${index}`}>
                              <span className="font-medium">{gapItem.skillName || "Unnamed skill"}</span>{" "}
                              - required {gapItem.requiredLevel ?? 0}, current{" "}
                              {gapItem.currentLevel ?? 0}, gap {gapItem.gap ?? 0}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Recommended Trainings
                      </p>
                      {!Array.isArray(selectedRecommendation.recommendedTrainings) ||
                      selectedRecommendation.recommendedTrainings.length === 0 ? (
                        <p className="text-sm text-slate-500 mt-2">
                          No training recommendations generated.
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {selectedRecommendation.recommendedTrainings.map((item, index) => {
                            const courseLabel = getCourseLabel(item.course);
                            return (
                              <li
                                key={`${selectedRecommendation._id}-training-${index}`}
                                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2"
                              >
                                <p className="font-medium text-slate-900">
                                  {item.title || "Untitled training"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {formatReasonType(item.reasonType)} | priority:{" "}
                                  {item.priority || "medium"} |{" "}
                                  {item.mandatory ? "mandatory" : "optional"}
                                </p>
                                {item.reasonDetail && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {item.reasonDetail}
                                  </p>
                                )}
                                {courseLabel && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Linked course: {courseLabel}
                                  </p>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                      <p className="font-semibold text-slate-600 mb-1">Performance Gaps</p>
                      <p className="text-slate-500">
                        {(selectedRecommendation.performanceGaps || []).join(", ") || "--"}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                      <p className="font-semibold text-slate-600 mb-1">Manager Recommendations</p>
                      <p className="text-slate-500">
                        {(selectedRecommendation.managerRecommendations || []).join(", ") || "--"}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                      <p className="font-semibold text-slate-600 mb-1">Employee Requests</p>
                      <p className="text-slate-500">
                        {(selectedRecommendation.employeeRequests || []).join(", ") || "--"}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
