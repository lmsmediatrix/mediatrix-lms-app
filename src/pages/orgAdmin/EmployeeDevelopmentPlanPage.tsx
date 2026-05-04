import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { FaEllipsisV, FaExternalLinkAlt, FaPen, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import ModernDatePicker from "../../components/common/ModernDatePicker";
import { SearchableSelect } from "../../components/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import {
  useGetDevelopmentPlans,
  useRemoveDevelopmentPlanActivity,
  useUpsertDevelopmentPlan,
  useUpsertDevelopmentPlanActivity,
  useUpsertDevelopmentPlanActivityFromTnaExecution,
  useUpsertDevelopmentPlanQuarter,
} from "../../hooks/useDevelopmentPlan";
import { useSearchStudents } from "../../hooks/useStudent";
import { useGetEmployeeTnaRecommendations } from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type QuarterKey = "Q1" | "Q2" | "Q3" | "Q4";
type ActivityStatus = "planned" | "in_progress" | "completed" | "cancelled";

type PlanActivity = {
  _id?: string;
  title?: string;
  type?: string;
  durationValue?: number;
  durationUnit?: string;
  startDate?: string;
  endDate?: string;
  status?: ActivityStatus;
  source?: string;
  sourceReference?: {
    recommendationId?: string;
    courseId?: string;
    sectionId?: string;
    sectionCode?: string;
    trainingId?: string;
  };
};

const QUARTERS: QuarterKey[] = ["Q1", "Q2", "Q3", "Q4"];

type TnaTrainingOption = {
  key: string;
  recommendationId: string;
  trainingId: string;
  title: string;
  status: "pending" | "in_progress" | "completed";
  courseId?: string;
  sectionId?: string;
  sectionCode?: string;
  scheduledAt?: string;
  scheduledEndAt?: string;
  suggestedQuarter: QuarterKey;
};

const getQuarterFromDate = (value?: string): QuarterKey => {
  if (!value) return "Q1";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Q1";
  const month = date.getMonth();
  if (month <= 2) return "Q1";
  if (month <= 5) return "Q2";
  if (month <= 8) return "Q3";
  return "Q4";
};

const toDateTimeLocalValue = (value?: string): string => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const getQuarterMonthRange = (quarter: QuarterKey): { startMonth: number; endMonth: number } => {
  if (quarter === "Q1") return { startMonth: 0, endMonth: 2 };
  if (quarter === "Q2") return { startMonth: 3, endMonth: 5 };
  if (quarter === "Q3") return { startMonth: 6, endMonth: 8 };
  return { startMonth: 9, endMonth: 11 };
};

const isDateWithinQuarter = (value: Date, quarter: QuarterKey): boolean => {
  const month = value.getMonth();
  const range = getQuarterMonthRange(quarter);
  return month >= range.startMonth && month <= range.endMonth;
};

const formatDateOnlyPreview = (value?: string): string => {
  if (!value) return "--";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const toYmd = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getQuarterDateDefaults = (
  quarter: QuarterKey,
  year: number,
): { startDate: string; endDate: string } => {
  if (quarter === "Q1") {
    return {
      startDate: toYmd(new Date(year, 0, 1)),
      endDate: toYmd(new Date(year, 2, 31)),
    };
  }
  if (quarter === "Q2") {
    return {
      startDate: toYmd(new Date(year, 3, 1)),
      endDate: toYmd(new Date(year, 5, 30)),
    };
  }
  if (quarter === "Q3") {
    return {
      startDate: toYmd(new Date(year, 6, 1)),
      endDate: toYmd(new Date(year, 8, 30)),
    };
  }
  return {
    startDate: toYmd(new Date(year, 9, 1)),
    endDate: toYmd(new Date(year, 11, 31)),
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    const typed = error as {
      response?: { data?: { message?: unknown; error?: unknown } };
      message?: unknown;
    };
    const candidates = [
      typed.response?.data?.error,
      typed.response?.data?.message,
      typed.message,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
    }
  }
  return "Something went wrong";
};

export default function EmployeeDevelopmentPlanPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type || "school";
  const organizationId = currentUser?.user?.organization?._id;
  const employeeTerm = getTerm("learner", orgType);

  const studentsQuery = useSearchStudents({
    organizationId,
    limit: 200,
    skip: 0,
    archiveStatus: "none",
  });

  const [employeeId, setEmployeeId] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState<QuarterKey>("Q1");
  const [editingActivity, setEditingActivity] = useState<{
    quarter: QuarterKey;
    activityId?: string;
    source?: string;
    sourceReference?: PlanActivity["sourceReference"];
  } | null>(null);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState("training");
  const [activityDurationValue, setActivityDurationValue] = useState("");
  const [activityDurationUnit, setActivityDurationUnit] = useState("week");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [activityStatus, setActivityStatus] = useState<ActivityStatus>("planned");
  const [quarterGoalSummary, setQuarterGoalSummary] = useState("");
  const [quarterSkillsFocus, setQuarterSkillsFocus] = useState("");
  const [openActivityMenuId, setOpenActivityMenuId] = useState("");
  const [selectedTnaTrainingKey, setSelectedTnaTrainingKey] = useState("");
  const [tnaImportQuarter, setTnaImportQuarter] = useState<QuarterKey>("Q1");
  const [tnaImportStartDate, setTnaImportStartDate] = useState("");
  const [tnaImportEndDate, setTnaImportEndDate] = useState("");

  const plansQuery = useGetDevelopmentPlans({
    employeeId: employeeId || undefined,
    limit: 1,
    skip: 0,
  });
  const upsertPlanMutation = useUpsertDevelopmentPlan();
  const upsertQuarterMutation = useUpsertDevelopmentPlanQuarter();
  const upsertActivityMutation = useUpsertDevelopmentPlanActivity();
  const upsertTnaActivityMutation = useUpsertDevelopmentPlanActivityFromTnaExecution();
  const removeActivityMutation = useRemoveDevelopmentPlanActivity();
  const employeeTnaRecommendationsQuery = useGetEmployeeTnaRecommendations(employeeId, {
    limit: 200,
    skip: 0,
  });

  const employees = useMemo(() => {
    const response = studentsQuery.data as { students?: any[] } | undefined;
    const rows = Array.isArray(response?.students) ? response.students : [];
    return rows.filter((item) => ["employee", "student"].includes(String(item?.role || "").toLowerCase()));
  }, [studentsQuery.data]);

  const selectedPlan = useMemo(() => {
    const response = plansQuery.data as { data?: any[] } | undefined;
    const plans = Array.isArray(response?.data) ? response.data : [];
    return plans[0] || null;
  }, [plansQuery.data]);

  const quarterMap = useMemo(() => {
    const map = new Map<QuarterKey, any>();
    const quarterPlans = Array.isArray(selectedPlan?.quarterPlans) ? selectedPlan.quarterPlans : [];
    for (const quarterPlan of quarterPlans) {
      const quarter = String(quarterPlan?.quarter || "") as QuarterKey;
      if (QUARTERS.includes(quarter)) map.set(quarter, quarterPlan);
    }
    return map;
  }, [selectedPlan]);

  const activeTnaTrainings = useMemo((): TnaTrainingOption[] => {
    const sectionReferenceByTrainingKey = new Map<
      string,
      { sectionId?: string; sectionCode?: string }
    >();
    const selectedQuarterPlans = Array.isArray(selectedPlan?.quarterPlans)
      ? selectedPlan.quarterPlans
      : [];
    for (const quarterPlan of selectedQuarterPlans) {
      const activities = Array.isArray(quarterPlan?.activities) ? quarterPlan.activities : [];
      for (const activity of activities) {
        const recommendationId = String(activity?.sourceReference?.recommendationId || "").trim();
        const trainingId = String(activity?.sourceReference?.trainingId || "").trim();
        if (!recommendationId || !trainingId) continue;
        sectionReferenceByTrainingKey.set(`${recommendationId}:${trainingId}`, {
          sectionId: String(activity?.sourceReference?.sectionId || "").trim() || undefined,
          sectionCode: String(activity?.sourceReference?.sectionCode || "").trim() || undefined,
        });
      }
    }

    const response = employeeTnaRecommendationsQuery.data as
      | {
          data?: Array<{
            _id?: string;
            execution?: { scheduledAt?: string; scheduledEndAt?: string };
            recommendedTrainings?: Array<{
              _id?: string;
              title?: string;
              progressStatus?: "pending" | "in_progress" | "completed";
              course?: { _id?: string } | string;
            }>;
          }>;
        }
      | undefined;

    const recommendations = Array.isArray(response?.data) ? response.data : [];
    const options: TnaTrainingOption[] = [];

    for (const recommendation of recommendations) {
      const recommendationId = String(recommendation?._id || "").trim();
      if (!recommendationId) continue;
      const scheduledAt = recommendation.execution?.scheduledAt;
      const scheduledEndAt = recommendation.execution?.scheduledEndAt;

      const recommendedTrainings = Array.isArray(recommendation?.recommendedTrainings)
        ? recommendation.recommendedTrainings
        : [];
      for (const training of recommendedTrainings) {
        const progressStatus = training?.progressStatus || "pending";
        if (progressStatus !== "in_progress" && progressStatus !== "pending") continue;

        const trainingId = String(training?._id || "").trim();
        const title = String(training?.title || "").trim();
        if (!trainingId || !title) continue;

        const courseValue = training?.course;
        const courseId =
          typeof courseValue === "string"
            ? courseValue
            : String(courseValue?._id || "").trim() || undefined;

        options.push({
          key: `${recommendationId}:${trainingId}`,
          recommendationId,
          trainingId,
          title,
          status: progressStatus,
          courseId,
          sectionId: sectionReferenceByTrainingKey.get(`${recommendationId}:${trainingId}`)?.sectionId,
          sectionCode:
            sectionReferenceByTrainingKey.get(`${recommendationId}:${trainingId}`)?.sectionCode,
          scheduledAt,
          scheduledEndAt,
          suggestedQuarter: getQuarterFromDate(scheduledAt),
        });
      }
    }

    return options.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "in_progress" ? -1 : 1;
      }
      return a.title.localeCompare(b.title);
    });
  }, [employeeTnaRecommendationsQuery.data, selectedPlan]);

  const selectedTnaTraining = useMemo(
    () => activeTnaTrainings.find((item) => item.key === selectedTnaTrainingKey) || null,
    [activeTnaTrainings, selectedTnaTrainingKey],
  );
  const canAddTnaToPlan = Boolean(
    selectedTnaTraining &&
      tnaImportStartDate.trim() &&
      tnaImportEndDate.trim(),
  );

  const quarterSelectOptions = useMemo(
    () =>
      QUARTERS.map((quarter) => ({
        value: quarter,
        label: quarter,
      })),
    [],
  );

  useEffect(() => {
    if (!employeeId && employees.length > 0) {
      setEmployeeId(String(employees[0]?._id || ""));
    }
  }, [employeeId, employees]);

  useEffect(() => {
    setSelectedTnaTrainingKey("");
    setTnaImportQuarter("Q1");
    setTnaImportStartDate("");
    setTnaImportEndDate("");
  }, [employeeId]);

  useEffect(() => {
    if (!selectedTnaTraining) return;
    setTnaImportQuarter(selectedTnaTraining.suggestedQuarter);
    const startValue = toDateTimeLocalValue(selectedTnaTraining.scheduledAt);
    const endValue = toDateTimeLocalValue(selectedTnaTraining.scheduledEndAt);
    setTnaImportStartDate(startValue ? startValue.slice(0, 10) : "");
    setTnaImportEndDate(endValue ? endValue.slice(0, 10) : "");
  }, [selectedTnaTraining?.key]);

  useEffect(() => {
    const quarter = quarterMap.get(selectedQuarter);
    setQuarterGoalSummary(String(quarter?.goalSummary || ""));
    setQuarterSkillsFocus(Array.isArray(quarter?.skillsFocus) ? quarter.skillsFocus.join(", ") : "");
  }, [quarterMap, selectedQuarter]);

  useEffect(() => {
    const handleClickOutside = () => setOpenActivityMenuId("");
    if (!openActivityMenuId) return;
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActivityMenuId]);

  if (orgType !== "corporate") {
    return <Navigate to={`/${orgCode}/admin/dashboard`} replace />;
  }

  const ensurePlan = async () => {
    if (!employeeId) return;
    if (selectedPlan?._id) return;
    await upsertPlanMutation.mutateAsync({
      employeeId,
      reviewYear: new Date().getFullYear(),
      status: "active",
      quarterPlans: QUARTERS.map((quarter) => ({ quarter, activities: [] })),
    });
  };

  const saveQuarterDetails = async (quarter: QuarterKey) => {
    if (!selectedPlan?._id) {
      await ensurePlan();
    }
    const planId = String(selectedPlan?._id || "");
    if (!planId) return;

    await toast.promise(
      upsertQuarterMutation.mutateAsync({
        planId,
        quarter: {
          quarter,
          goalSummary: quarterGoalSummary,
          skillsFocus: quarterSkillsFocus
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        },
      }),
      { pending: "Saving quarter...", success: "Quarter saved", error: "Failed to save quarter" },
    );
  };

  const openActivityEditor = (quarter: QuarterKey, activity?: PlanActivity) => {
    setEditingActivity({
      quarter,
      activityId: String(activity?._id || "") || undefined,
      source: activity?.source,
      sourceReference: activity?.sourceReference,
    });
    setActivityTitle(String(activity?.title || ""));
    setActivityType(String(activity?.type || "training"));
    setActivityDurationValue(
      typeof activity?.durationValue === "number" ? String(activity.durationValue) : "",
    );
    setActivityDurationUnit(String(activity?.durationUnit || "week"));
    setActivityStartDate(
      String(activity?.startDate || "").trim()
        ? String(activity?.startDate).slice(0, 10)
        : "",
    );
    setActivityEndDate(
      String(activity?.endDate || "").trim() ? String(activity?.endDate).slice(0, 10) : "",
    );
    setActivityStatus((activity?.status as ActivityStatus) || "planned");
  };

  const saveActivity = async () => {
    if (!editingActivity) return;
    if (!activityTitle.trim()) return toast.error("Activity title is required");
    const parsedStartDate = activityStartDate
      ? new Date(`${activityStartDate}T00:00:00`)
      : null;
    const parsedEndDate = activityEndDate ? new Date(`${activityEndDate}T23:59:59`) : null;
    if (
      parsedStartDate &&
      parsedEndDate &&
      parsedEndDate.getTime() < parsedStartDate.getTime()
    ) {
      return toast.error("End date must be after start date.");
    }
    await ensurePlan();
    const planId = String(selectedPlan?._id || "");
    if (!planId) return;

    const activityPayload = {
      activityId: editingActivity.activityId,
      title: activityTitle.trim(),
      type: activityType,
      durationValue: activityDurationValue ? Number(activityDurationValue) : undefined,
      durationUnit: activityDurationUnit,
      startDate: parsedStartDate ? parsedStartDate.toISOString() : undefined,
      endDate: parsedEndDate ? parsedEndDate.toISOString() : undefined,
      status: activityStatus,
      source: editingActivity.source === "tna_execution" ? "tna_execution" : "manual",
      sourceReference: editingActivity.sourceReference,
    };

    const savePromise =
      editingActivity.source === "tna_execution"
        ? upsertTnaActivityMutation.mutateAsync({
            employeeId,
            recommendationId: editingActivity.sourceReference?.recommendationId,
            reviewYear: new Date().getFullYear(),
            quarter: editingActivity.quarter,
            activity: activityPayload,
          })
        : upsertActivityMutation.mutateAsync({
            planId,
            quarter: editingActivity.quarter,
            activity: activityPayload,
          });

    await toast.promise(savePromise, {
      pending: "Saving activity...",
      success: "Activity saved",
      error: "Failed to save activity",
    });
    setEditingActivity(null);
  };

  const removeActivity = async (quarter: QuarterKey, activityId: string) => {
    if (!selectedPlan?._id || !activityId) return;
    await toast.promise(
      removeActivityMutation.mutateAsync({
        planId: String(selectedPlan._id),
        quarter,
        activityId,
      }),
      { pending: "Removing activity...", success: "Activity removed", error: "Failed to remove activity" },
    );
  };

  const importActiveTnaTraining = async () => {
    if (!employeeId) return toast.error("Select employee first");
    if (!selectedTnaTraining) return toast.error("Select active TNA training first");
    if (!tnaImportStartDate || !tnaImportEndDate) {
      return toast.error("Start batch and end batch dates are required.");
    }

    const startDate = new Date(`${tnaImportStartDate}T00:00:00`);
    const endDate = new Date(`${tnaImportEndDate}T23:59:59`);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return toast.error("Invalid batch schedule dates.");
    }
    if (endDate.getTime() < startDate.getTime()) {
      return toast.error("End batch date must be after start batch date.");
    }
    if (!isDateWithinQuarter(startDate, tnaImportQuarter)) {
      return toast.error(`Start batch date must be inside ${tnaImportQuarter}.`);
    }
    if (!isDateWithinQuarter(endDate, tnaImportQuarter)) {
      return toast.error(`End batch date must be inside ${tnaImportQuarter}.`);
    }

    await toast.promise(
      upsertTnaActivityMutation.mutateAsync({
        employeeId,
        recommendationId: selectedTnaTraining.recommendationId,
        reviewYear: new Date().getFullYear(),
        quarter: tnaImportQuarter,
        activity: {
          title: selectedTnaTraining.title,
          type: "training",
          deliveryMode: "internal_lms",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: "in_progress",
          source: "tna_execution",
          sourceReference: {
            recommendationId: selectedTnaTraining.recommendationId,
            courseId: selectedTnaTraining.courseId,
            sectionId: selectedTnaTraining.sectionId,
            sectionCode: selectedTnaTraining.sectionCode,
            trainingId: selectedTnaTraining.trainingId,
          },
        },
      }),
      {
        pending: "Importing active TNA training...",
        success: "Active training added to development plan",
        error: {
          render: ({ data }) => getErrorMessage(data),
        },
      },
    );
  };

  const handleQuarterImportChange = (quarterValue: string) => {
    const quarter = quarterValue as QuarterKey;
    setTnaImportQuarter(quarter);

    const yearFromCurrentDate = Number(tnaImportStartDate?.slice(0, 4));
    const yearFromSelectedTraining = selectedTnaTraining?.scheduledAt
      ? new Date(selectedTnaTraining.scheduledAt).getFullYear()
      : undefined;
    const targetYear = Number.isFinite(yearFromCurrentDate) && yearFromCurrentDate > 0
      ? yearFromCurrentDate
      : typeof yearFromSelectedTraining === "number" && Number.isFinite(yearFromSelectedTraining)
        ? yearFromSelectedTraining
        : new Date().getFullYear();

    const defaults = getQuarterDateDefaults(quarter, targetYear);
    setTnaImportStartDate(defaults.startDate);
    setTnaImportEndDate(defaults.endDate);
  };

  return (
    <div className="pt-14 pb-6 px-4 md:px-6 lg:p-6 space-y-5">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Development Plan
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Employee Quarter Activities</h1>
        </div>
        <div className="w-full md:w-[340px]">
          <SearchableSelect
            options={employees.map((employee) => ({
              value: String(employee?._id || ""),
              label: `${employee?.firstName || ""} ${employee?.lastName || ""}`.trim() || employee?.email || "Unnamed",
              description: employee?.email || undefined,
            }))}
            value={employeeId}
            onChange={setEmployeeId}
            placeholder={`Select ${employeeTerm.toLowerCase()}`}
            loading={studentsQuery.isLoading}
            emptyMessage={`No ${getTerm("learner", orgType, true).toLowerCase()} found.`}
            className="w-full"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Import From TNA
          </p>
          <h2 className="text-lg font-semibold text-slate-900 mt-1">
            Active Training To Quarter Plan
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Select active TNA training, choose quarter, then save as in-progress development activity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_140px_auto] gap-2">
          <SearchableSelect
            options={activeTnaTrainings.map((training) => ({
              value: training.key,
              label: training.title,
              description:
                training.status === "in_progress"
                  ? "In Progress"
                  : "Pending",
            }))}
            value={selectedTnaTrainingKey}
            onChange={setSelectedTnaTrainingKey}
            placeholder="Select active TNA training"
            loading={employeeTnaRecommendationsQuery.isLoading}
            emptyMessage="No active/pending TNA training found for this employee."
            className="w-full"
          />
          <SearchableSelect
            options={quarterSelectOptions}
            value={tnaImportQuarter}
            onChange={handleQuarterImportChange}
            placeholder="Select quarter"
            className="w-full"
          />
          <Button
            variant="primary"
            onClick={() => void importActiveTnaTraining()}
            isLoading={upsertTnaActivityMutation.isPending}
            disabled={!canAddTnaToPlan}
          >
            Add To Plan
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Start Batch
                </label>
                <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModernDatePicker
                      value={tnaImportStartDate}
                      onChange={setTnaImportStartDate}
                      variant="light"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  End Batch
                </label>
                <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <ModernDatePicker
                      value={tnaImportEndDate}
                      onChange={setTnaImportEndDate}
                      variant="light"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Quarter date guide: Q1 (Jan-Mar), Q2 (Apr-Jun), Q3 (Jul-Sep), Q4 (Oct-Dec).
            </p>
          </div>

          {selectedTnaTraining ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p>
                <span className="font-semibold">Training:</span> {selectedTnaTraining.title}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{" "}
                {selectedTnaTraining.status === "in_progress" ? "In Progress" : "Pending"}
              </p>
              <p>
                <span className="font-semibold">Batch Start:</span>{" "}
                {formatDateOnlyPreview(tnaImportStartDate)}
              </p>
              <p>
                <span className="font-semibold">Batch End:</span>{" "}
                {formatDateOnlyPreview(tnaImportEndDate)}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-500">
              Select an active TNA training to view details.
            </div>
          )}
        </div>
      </section>

      {!selectedPlan ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 space-y-3">
          <p className="text-sm text-slate-700">
            No development plan yet for this employee. Create a plan to start adding quarter activities.
          </p>
          <Button variant="primary" onClick={() => void ensurePlan()} isLoading={upsertPlanMutation.isPending}>
            Create Development Plan
          </Button>
        </section>
      ) : (
        <div className="space-y-4">
          {QUARTERS.map((quarter) => {
            const quarterPlan = quarterMap.get(quarter);
            const activities = Array.isArray(quarterPlan?.activities) ? quarterPlan.activities : [];
            const originalGoalSummary = String(quarterPlan?.goalSummary || "");
            const originalSkillsFocus = Array.isArray(quarterPlan?.skillsFocus)
              ? quarterPlan.skillsFocus.join(", ")
              : "";
            const isQuarterDirty =
              selectedQuarter === quarter &&
              (quarterGoalSummary !== originalGoalSummary ||
                quarterSkillsFocus !== originalSkillsFocus);
            return (
              <section key={quarter} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{quarter}</h2>
                  <Button variant="outline" onClick={() => openActivityEditor(quarter)}>
                    Add Activity
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <input
                    value={selectedQuarter === quarter ? quarterGoalSummary : String(quarterPlan?.goalSummary || "")}
                    onFocus={() => setSelectedQuarter(quarter)}
                    onChange={(event) => {
                      setSelectedQuarter(quarter);
                      setQuarterGoalSummary(event.target.value);
                    }}
                    placeholder="Quarter goal summary"
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      value={selectedQuarter === quarter ? quarterSkillsFocus : Array.isArray(quarterPlan?.skillsFocus) ? quarterPlan.skillsFocus.join(", ") : ""}
                      onFocus={() => setSelectedQuarter(quarter)}
                      onChange={(event) => {
                        setSelectedQuarter(quarter);
                        setQuarterSkillsFocus(event.target.value);
                      }}
                      placeholder="Skills focus (comma-separated)"
                      className="h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => void saveQuarterDetails(quarter)}
                      isLoading={upsertQuarterMutation.isPending}
                      disabled={!isQuarterDirty}
                      className={!isQuarterDirty ? "invisible" : ""}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <p className="text-sm text-slate-500">No activities yet for this quarter.</p>
                ) : (
                  <div className="space-y-2">
                    {activities.map((activity: PlanActivity) => (
                      <div key={String(activity._id || activity.title)} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{activity.title || "Untitled activity"}</p>
                            <p className="text-xs text-slate-500">
                              {(activity.type || "training").toUpperCase()} | {activity.durationValue || "--"} {activity.durationUnit || ""}
                            </p>
                            {activity.source === "tna_execution" && (
                              <p className="mt-1 text-xs font-medium text-indigo-700">Source: TNA Execution</p>
                            )}
                          </div>
                          <div className="relative flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                const nextId = String(activity._id || "");
                                setOpenActivityMenuId((previous) =>
                                  previous === nextId ? "" : nextId,
                                );
                              }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                              aria-label="Activity actions"
                            >
                              <FaEllipsisV className="h-3.5 w-3.5" />
                            </button>
                            {openActivityMenuId === String(activity._id || "") ? (
                              <div
                                className="absolute right-0 top-10 z-20 flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    openActivityEditor(quarter, activity);
                                    setOpenActivityMenuId("");
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                                  title="Edit"
                                  aria-label="Edit activity"
                                >
                                  <FaPen className="h-3.5 w-3.5" />
                                </button>
                                {activity.source === "tna_execution" &&
                                (activity.sourceReference?.sectionCode ||
                                  activity.sourceReference?.sectionId) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigate(
                                        `/${orgCode}/admin/section/${activity.sourceReference?.sectionCode || activity.sourceReference?.sectionId}`,
                                      );
                                      setOpenActivityMenuId("");
                                    }}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"
                                    title="Open batch"
                                    aria-label="Open batch"
                                  >
                                    <FaExternalLinkAlt className="h-3.5 w-3.5" />
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => {
                                    void removeActivity(quarter, String(activity._id || ""));
                                    setOpenActivityMenuId("");
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                                  title="Remove"
                                  aria-label="Remove activity"
                                >
                                  <FaTrash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {editingActivity && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">
              {editingActivity.activityId ? "Edit Activity" : "Add Activity"} - {editingActivity.quarter}
            </h3>
            <input
              value={activityTitle}
              onChange={(event) => setActivityTitle(event.target.value)}
              placeholder="Activity title"
              className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
            {editingActivity.source === "tna_execution" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Start Date
                  </label>
                  <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5">
                    <ModernDatePicker
                      value={activityStartDate}
                      onChange={setActivityStartDate}
                      variant="light"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End Date
                  </label>
                  <div className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5">
                    <ModernDatePicker
                      value={activityEndDate}
                      onChange={setActivityEndDate}
                      variant="light"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  value={activityType}
                  onChange={(event) => setActivityType(event.target.value)}
                  placeholder="Type (training/workshop/ojt)"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <input
                  value={activityDurationValue}
                  onChange={(event) => setActivityDurationValue(event.target.value)}
                  placeholder="Duration value"
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                />
                <select
                  value={activityDurationUnit}
                  onChange={(event) => setActivityDurationUnit(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                >
                  <option value="day">day</option>
                  <option value="week">week</option>
                  <option value="month">month</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="cancel" onClick={() => setEditingActivity(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void saveActivity().catch((error) => toast.error(getErrorMessage(error)))}
                isLoading={upsertActivityMutation.isPending}
              >
                Save Activity
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
