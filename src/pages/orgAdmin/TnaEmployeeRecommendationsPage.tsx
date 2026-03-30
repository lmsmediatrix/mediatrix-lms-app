import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useSearchStudents } from "../../hooks/useStudent";
import {
  useGetEmployeeTnaRecommendations,
  useGetTnaRecommendations,
} from "../../hooks/useTna";
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
      if (!map.has(employeeId)) {
        map.set(employeeId, recommendation);
      }
    }
    return map;
  }, [recommendations]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (selectedEmployeeId && employees.some((employee) => employee._id === selectedEmployeeId)) {
      return;
    }
    if (employees.length > 0) {
      setSelectedEmployeeId(employees[0]._id);
    }
  }, [employees, selectedEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const withSearch = employees.filter((employee) => {
      if (!query) return true;
      const haystack = `${employee.firstName || ""} ${employee.lastName || ""} ${employee.email || ""}`
        .toLowerCase()
        .trim();
      return haystack.includes(query);
    });

    return withSearch.sort((a, b) => {
      const aHasTna = latestRecommendationByEmployee.has(a._id) ? 1 : 0;
      const bHasTna = latestRecommendationByEmployee.has(b._id) ? 1 : 0;
      if (aHasTna !== bHasTna) return bHasTna - aHasTna;
      return getEmployeeDisplayName(a).localeCompare(getEmployeeDisplayName(b));
    });
  }, [employees, latestRecommendationByEmployee, searchTerm]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee._id === selectedEmployeeId),
    [employees, selectedEmployeeId],
  );

  const latestSelectedRecommendation = selectedEmployeeId
    ? latestRecommendationByEmployee.get(selectedEmployeeId)
    : undefined;

  const selectedEmployeeRecommendationsQuery = useGetEmployeeTnaRecommendations(
    selectedEmployeeId,
    { limit: 100, skip: 0 },
  );

  const selectedEmployeeRecommendations = useMemo(() => {
    const response = selectedEmployeeRecommendationsQuery.data as
      | { data?: TnaRecommendation[] }
      | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [selectedEmployeeRecommendationsQuery.data]);

  const employeesWithTna = useMemo(
    () =>
      employees.filter((employee) => latestRecommendationByEmployee.has(employee._id))
        .length,
    [employees, latestRecommendationByEmployee],
  );

  const employeesWithoutTna = employees.length - employeesWithTna;

  const inputClassName =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";

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

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 h-fit xl:sticky xl:top-20">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">
              {employeesTerm}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Select an employee to view TNA details.
            </p>
          </div>

          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={inputClassName}
            placeholder={`Search ${employeeTerm.toLowerCase()} by name or email`}
          />

          {studentsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading {employeesTerm.toLowerCase()}...</p>
          ) : filteredEmployees.length === 0 ? (
            <p className="text-sm text-slate-500">No matching {employeesTerm.toLowerCase()} found.</p>
          ) : (
            <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
              {filteredEmployees.map((employee) => {
                const latest = latestRecommendationByEmployee.get(employee._id);
                const hasTna = Boolean(latest);
                const isActive = selectedEmployeeId === employee._id;
                const skillGapCount = Array.isArray(latest?.skillGaps)
                  ? latest.skillGaps.length
                  : 0;
                const recommendedTrainingCount = Array.isArray(
                  latest?.recommendedTrainings,
                )
                  ? latest.recommendedTrainings.length
                  : 0;

                return (
                  <button
                    key={employee._id}
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee._id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {getEmployeeDisplayName(employee)}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {employee.email || "--"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                          hasTna
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-300 bg-slate-50 text-slate-500"
                        }`}
                      >
                        {hasTna ? <FaCheckCircle className="h-3 w-3" /> : <FaTimesCircle className="h-3 w-3" />}
                        {hasTna ? "Has TNA" : "No TNA"}
                      </span>
                    </div>

                    {hasTna && (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-700">
                          {latest ? normalizeStatus(latest.status) : "pending"}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-700">
                          Skill gaps: {skillGapCount}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-slate-700">
                          Trainings: {recommendedTrainingCount}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm space-y-4 min-h-[480px]">
          {selectedEmployee ? (
            <>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Selected {employeeTerm}
                  </p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {getEmployeeDisplayName(selectedEmployee)}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {selectedEmployee.email || "--"}
                  </p>
                </div>
                <div className="text-sm text-slate-600">
                  {latestSelectedRecommendation ? (
                    <p>
                      Latest TNA:{" "}
                      <span className="font-medium text-slate-800">
                        {new Date(
                          latestSelectedRecommendation.createdAt || Date.now(),
                        ).toLocaleString()}
                      </span>
                    </p>
                  ) : (
                    <p>No TNA record yet for this {employeeTerm.toLowerCase()}.</p>
                  )}
                </div>
              </div>

              {selectedEmployeeRecommendationsQuery.isLoading ? (
                <p className="text-sm text-slate-500">Loading TNA details...</p>
              ) : selectedEmployeeRecommendations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                  No TNA recommendations found for this {employeeTerm.toLowerCase()}.
                  Run Step 4 in the TNA page first.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedEmployeeRecommendations.map((recommendation) => (
                    <div
                      key={recommendation._id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {recommendation.jobRole || "No role"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(
                              recommendation.createdAt || Date.now(),
                            ).toLocaleString()}
                          </p>
                        </div>
                        <span className="inline-flex h-fit items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                          Status: {normalizeStatus(recommendation.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                          Skill gaps:{" "}
                          {Array.isArray(recommendation.skillGaps)
                            ? recommendation.skillGaps.length
                            : 0}
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                          Recommended trainings:{" "}
                          {Array.isArray(recommendation.recommendedTrainings)
                            ? recommendation.recommendedTrainings.length
                            : 0}
                        </span>
                        {typeof recommendation.preAssessment?.score === "number" && (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700">
                            Pre-test: {recommendation.preAssessment.score}% (threshold{" "}
                            {recommendation.preAssessment.threshold ?? 70}%)
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Skill Gaps
                          </p>
                          {!Array.isArray(recommendation.skillGaps) ||
                          recommendation.skillGaps.length === 0 ? (
                            <p className="text-sm text-slate-500 mt-2">No skill gaps.</p>
                          ) : (
                            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                              {recommendation.skillGaps.map((gapItem, index) => (
                                <li key={`${recommendation._id}-gap-${index}`}>
                                  <span className="font-medium">
                                    {gapItem.skillName || "Unnamed skill"}
                                  </span>{" "}
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
                          {!Array.isArray(recommendation.recommendedTrainings) ||
                          recommendation.recommendedTrainings.length === 0 ? (
                            <p className="text-sm text-slate-500 mt-2">
                              No training recommendations generated.
                            </p>
                          ) : (
                            <ul className="mt-2 space-y-2 text-sm text-slate-700">
                              {recommendation.recommendedTrainings.map((item, index) => {
                                const courseLabel = getCourseLabel(item.course);
                                return (
                                  <li
                                    key={`${recommendation._id}-training-${index}`}
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
                          <p className="font-semibold text-slate-600 mb-1">
                            Performance Gaps
                          </p>
                          <p className="text-slate-500">
                            {(recommendation.performanceGaps || []).join(", ") || "--"}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                          <p className="font-semibold text-slate-600 mb-1">
                            Manager Recommendations
                          </p>
                          <p className="text-slate-500">
                            {(recommendation.managerRecommendations || []).join(", ") ||
                              "--"}
                          </p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
                          <p className="font-semibold text-slate-600 mb-1">
                            Employee Requests
                          </p>
                          <p className="text-slate-500">
                            {(recommendation.employeeRequests || []).join(", ") || "--"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Select an {employeeTerm.toLowerCase()} to view TNA details.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
