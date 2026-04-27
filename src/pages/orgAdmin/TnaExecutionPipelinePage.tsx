import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import { Lightbulb } from "@/components/animate-ui/icons/lightbulb";
import Button from "../../components/common/Button";
import HoverHelpTooltip from "../../components/common/HoverHelpTooltip";
import TnaAutoCreatePlanModal from "../../components/orgAdmin/TnaAutoCreatePlanModal";
import { useAuth } from "../../context/AuthContext";
import {
  useAutoDeployTnaRecommendations,
  useGetTnaRecommendations,
} from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type RecommendationStatus = "pending" | "assigned" | "completed";
type TrainingProgressStatus = "pending" | "in_progress" | "completed";
type TrainingFilterStatus = "all" | TrainingProgressStatus;
type TrainingPriority = "high" | "medium" | "low";
type DeploymentCreateMode = "auto_create" | "manual_create";
type AutoCreatePlannerCourse = {
  trainingId?: string;
  title: string;
  programName?: string;
  batchName?: string;
  description?: string;
  code?: string;
};

type AutoCreatePlannerPayload = {
  courses: AutoCreatePlannerCourse[];
};

type TnaRecommendation = {
  _id: string;
  employee?: { _id?: string; firstName?: string; lastName?: string; email?: string } | string;
  jobRole?: string;
  createdAt?: string;
  status?: RecommendationStatus;
  recommendedTrainings?: Array<{
    _id?: string;
    title?: string;
    priority?: string;
    mandatory?: boolean;
    progressStatus?: TrainingProgressStatus;
  }>;
};

type AutoDeploySummary = {
  noOp?: boolean;
  plannerApplied?: boolean;
  totalGroups: number;
  programsCreated: number;
  programsReused: number;
  coursesCreated: number;
  coursesReused: number;
  batchesCreated: number;
  batchesUpdated: number;
  enrollmentsAdded: number;
  recommendationsUpdated: number;
  groups?: Array<{
    trainingTitle?: string;
    employeeCount?: number;
    recommendationCount?: number;
    program?: { name?: string; code?: string };
    course?: { title?: string; code?: string };
    batch?: { name?: string; code?: string };
    enrollmentsAdded?: number;
    reusedProgram?: boolean;
    reusedCourse?: boolean;
    reusedBatch?: boolean;
  }>;
};

const normalizeStatus = (value?: string): RecommendationStatus => {
  if (value === "assigned" || value === "completed") return value;
  return "pending";
};

const normalizeTrainingProgressStatus = (value?: string): TrainingProgressStatus => {
  if (value === "in_progress" || value === "completed") return value;
  return "pending";
};

const normalizeTrainingPriority = (value?: string): TrainingPriority => {
  if (value === "high" || value === "low") return value;
  return "medium";
};

const trainingStatusLabelMap: Record<TrainingProgressStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const themePrimarySoftBadgeClass =
  "border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_30%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_10%,white)] text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_78%,black)]";
const themePrimaryStrongBadgeClass =
  "border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_34%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_16%,white)] text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_84%,black)]";
const themeSecondarySoftBadgeClass =
  "border-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_30%,white)] bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_10%,white)] text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_78%,black)]";

const trainingStatusBadgeClassMap: Record<TrainingProgressStatus, string> = {
  pending: themeSecondarySoftBadgeClass,
  in_progress: themePrimarySoftBadgeClass,
  completed: themePrimaryStrongBadgeClass,
};

const trainingPriorityLabelMap: Record<TrainingPriority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const trainingPriorityBadgeClassMap: Record<TrainingPriority, string> = {
  high: themePrimaryStrongBadgeClass,
  medium: themeSecondarySoftBadgeClass,
  low: "border-slate-200 bg-slate-50 text-slate-700",
};

const WHAT_HAPPENS_NEXT_ITEMS = [
  "Finish one recommendation item: keep overall status as Assigned.",
  "Finish all recommendation items: recommendation becomes Completed.",
  "Completed batch + passed threshold auto-syncs training progress and employee skill levels.",
  "Open the employee in TNA or rerun analysis to see refreshed levels and next actions.",
];

const getEmployeeName = (recommendation: TnaRecommendation): string => {
  if (!recommendation.employee || typeof recommendation.employee === "string") return "--";
  const fullName = [recommendation.employee.firstName, recommendation.employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "--";
};

const getEmployeeId = (recommendation: TnaRecommendation): string => {
  if (!recommendation.employee || typeof recommendation.employee === "string") return "";
  return recommendation.employee._id || "";
};

const toLocaleDateTime = (value?: string): string => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const typed = error as {
      response?: { data?: { message?: unknown; error?: unknown } };
      message?: unknown;
    };

    const candidateMessages = [typed.response?.data?.error, typed.response?.data?.message, typed.message];
    for (const candidate of candidateMessages) {
      if (typeof candidate === "string" && candidate.trim()) return candidate;
      if (candidate && typeof candidate === "object") {
        const nestedMessage = (candidate as { message?: unknown }).message;
        if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
      }
    }
  }
  return "Failed to complete auto create";
};

export default function TnaExecutionPipelinePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type || "school";
  const employeeTerm = getTerm("learner", orgType);

  const recommendationsQuery = useGetTnaRecommendations({ limit: 500, skip: 0 });
  const autoDeployMutation = useAutoDeployTnaRecommendations();

  const recommendations = useMemo(() => {
    const response = recommendationsQuery.data as { data?: TnaRecommendation[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [recommendationsQuery.data]);

  const [selectedRecommendationId, setSelectedRecommendationId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [trainingSearchTerm, setTrainingSearchTerm] = useState("");
  const [trainingStatusFilter, setTrainingStatusFilter] = useState<TrainingFilterStatus>("all");
  const [autoDeploySummary, setAutoDeploySummary] = useState<AutoDeploySummary | null>(null);
  const [isPlannerModalOpen, setIsPlannerModalOpen] = useState(false);
  const [deploymentCreateMode, setDeploymentCreateMode] =
    useState<DeploymentCreateMode>("auto_create");

  const filteredRecommendations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const withFilter = recommendations.filter((recommendation) => {
      if (!query) return true;
      const haystack = [
        getEmployeeName(recommendation),
        recommendation.employee && typeof recommendation.employee !== "string"
          ? recommendation.employee.email || ""
          : "",
        recommendation.jobRole || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    return withFilter.sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }, [recommendations, searchTerm]);

  const selectedRecommendation = useMemo(
    () =>
      recommendations.find((item) => item._id === selectedRecommendationId) ||
      filteredRecommendations[0] ||
      null,
    [recommendations, filteredRecommendations, selectedRecommendationId]
  );

  const totalRecommendations = recommendations.length;
  const withTrainingRecommendations = useMemo(
    () =>
      recommendations.filter(
        (item) => Array.isArray(item.recommendedTrainings) && item.recommendedTrainings.length > 0
      ).length,
    [recommendations]
  );
  const pendingRecommendations = useMemo(
    () => recommendations.filter((item) => normalizeStatus(item.status) === "pending").length,
    [recommendations]
  );
  const pendingTrainingItemsCount = useMemo(
    () =>
      recommendations.reduce((count, recommendation) => {
        const trainings = Array.isArray(recommendation.recommendedTrainings)
          ? recommendation.recommendedTrainings
          : [];
        const pendingItems = trainings.filter(
          (training) => normalizeTrainingProgressStatus(training.progressStatus) === "pending"
        ).length;
        return count + pendingItems;
      }, 0),
    [recommendations]
  );

  const selectedEmployeeName = selectedRecommendation ? getEmployeeName(selectedRecommendation) : "";
  const selectedEmployeeId = selectedRecommendation ? getEmployeeId(selectedRecommendation) : "";

  const suggestedTrainings = useMemo(() => {
    if (!selectedRecommendation || !Array.isArray(selectedRecommendation.recommendedTrainings)) return [];
    return selectedRecommendation.recommendedTrainings
      .map((item) => String(item.title || "").trim())
      .filter(Boolean);
  }, [selectedRecommendation]);

  const selectedTrainingRows = useMemo(() => {
    if (!selectedRecommendation || !Array.isArray(selectedRecommendation.recommendedTrainings)) return [];
    return selectedRecommendation.recommendedTrainings.map((item, index) => {
      const rowId = String(item?._id || `training-${index}`);
      return {
        id: rowId,
        title: String(item?.title || "").trim() || "Untitled training",
        priority: normalizeTrainingPriority(String(item?.priority || "").trim().toLowerCase()),
        mandatory: Boolean(item?.mandatory),
        status: normalizeTrainingProgressStatus(item?.progressStatus),
      };
    });
  }, [selectedRecommendation]);

  const plannerDefaultCourses = useMemo(() => {
    const safeEmployeeName =
      selectedEmployeeName && selectedEmployeeName !== "--" ? selectedEmployeeName : employeeTerm;
    return selectedTrainingRows
      .filter((row) => row.status === "pending")
      .map((row) => ({
        trainingId: row.id,
        title: row.title,
        programName: `${row.title} Program`,
        batchName: `${safeEmployeeName} - ${row.title} Batch`,
      }));
  }, [selectedTrainingRows, selectedEmployeeName, employeeTerm]);

  const filteredTrainingRows = useMemo(() => {
    const keyword = trainingSearchTerm.trim().toLowerCase();
    return selectedTrainingRows.filter((row) => {
      const matchesFilter = trainingStatusFilter === "all" || row.status === trainingStatusFilter;
      if (!matchesFilter) return false;
      if (!keyword) return true;
      return `${row.title} ${row.priority} ${row.mandatory ? "mandatory" : "optional"}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [selectedTrainingRows, trainingSearchTerm, trainingStatusFilter]);

  const trainingProgressSummary = useMemo(() => {
    const trainings = selectedRecommendation?.recommendedTrainings || [];
    let completed = 0;
    let inProgress = 0;

    for (const training of trainings) {
      const status = normalizeTrainingProgressStatus(training?.progressStatus);
      if (status === "completed") completed += 1;
      if (status === "in_progress") inProgress += 1;
    }

    return {
      total: trainings.length,
      completed,
      inProgress,
      pending: Math.max(trainings.length - completed - inProgress, 0),
    };
  }, [selectedRecommendation]);

  const runAutoDeployFromTna = async (planner?: AutoCreatePlannerPayload) => {
    const recommendationIds = selectedRecommendation?._id ? [selectedRecommendation._id] : undefined;
    try {
      const response = await toast.promise(
        autoDeployMutation.mutateAsync(
          planner ? { recommendationIds, planner } : { recommendationIds }
        ),
        {
          pending: "Auto creating from TNA recommendations...",
          success: {
            render: ({ data }) => {
              const responseMessage = (data as { message?: unknown } | undefined)?.message;
              if (typeof responseMessage === "string" && responseMessage.trim()) return responseMessage;
              return "Program, course, and batch setup completed";
            },
          },
          error: {
            render: ({ data }) => getErrorMessage(data),
          },
        }
      );

      const summary = (response as { data?: AutoDeploySummary } | undefined)?.data;
      if (summary) {
        setAutoDeploySummary(summary);
      }
      setIsPlannerModalOpen(false);
    } catch {
      // Error toast is already handled above.
    }
  };

  const handleConfirmPlanner = async (payload: AutoCreatePlannerPayload) => {
    await runAutoDeployFromTna(payload);
  };

  const openPlannerModal = () => {
    if (!selectedRecommendation?._id) {
      toast.error("Select a recommendation first.");
      return;
    }
    if (plannerDefaultCourses.length === 0) {
      toast.error("No pending training items available for auto create.");
      return;
    }
    setIsPlannerModalOpen(true);
  };

  const suggestedBatchName = useMemo(() => {
    if (!selectedRecommendation) return "";
    const role = String(selectedRecommendation.jobRole || "Training").trim();
    const name = selectedEmployeeName && selectedEmployeeName !== "--" ? selectedEmployeeName : employeeTerm;
    return `${name} - ${role} Batch`;
  }, [selectedRecommendation, selectedEmployeeName, employeeTerm]);

  const batchCreateParams = useMemo(() => {
    if (!selectedRecommendation) return "";
    const params = new URLSearchParams();
    params.set("source", "tna");
    params.set("recommendationId", selectedRecommendation._id);
    if (selectedEmployeeId) params.set("employeeId", selectedEmployeeId);
    if (selectedRecommendation.jobRole) params.set("jobRole", selectedRecommendation.jobRole);
    if (suggestedBatchName) params.set("suggestedBatch", suggestedBatchName);
    if (suggestedTrainings.length > 0) params.set("suggestedTraining", suggestedTrainings.slice(0, 3).join(", "));
    return params.toString();
  }, [selectedRecommendation, selectedEmployeeId, suggestedBatchName, suggestedTrainings]);

  const createBatchPath = `/${orgCode}/admin/section/new${batchCreateParams ? `?${batchCreateParams}` : ""}`;

  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";
  const cardClassName = "rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm";
  const labelClassName = "text-xs font-semibold uppercase tracking-wider text-slate-500";

  return (
    <div className="pt-14 pb-6 px-4 md:px-6 lg:p-6 space-y-6">
      <section
        className="rounded-2xl border border-slate-200 p-5 md:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 16%, #ffffff), #ffffff 56%, color-mix(in srgb, var(--color-secondary) 14%, #ffffff))",
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(`/${orgCode}/admin/tna`)}
              className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Back to TNA"
            >
              <FaArrowLeft className="h-3.5 w-3.5" />
            </button>
            <div>
              <p className={labelClassName}>Post-TNA Handoff</p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                  TNA To Course And Batch Execution
                </h1>
                <HoverHelpTooltip
                  text={`After reviewing TNA, continue in LMS setup: create or select Program and Course, create Batch, assign Instructor, then assign ${employeeTerm.toLowerCase()} to the batch.`}
                  
                  className="shrink-0"
                />
              </div>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-2 sm:w-auto sm:min-w-[390px] sm:grid-cols-3">
            <div className="relative overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_22%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_8%,white)] px-3.5 py-2.5 min-h-[92px] shadow-[0_10px_24px_-18px_rgba(37,99,235,0.34)]">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_48%,white)]" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_68%,black)]">Total TNA</p>
              <p className="mt-1 text-2xl font-bold leading-none text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_84%,black)]">{totalRecommendations}</p>
              <p className="mt-2 text-[11px] text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_62%,black)]">All recommendations in scope</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_24%,white)] bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_10%,white)] px-3.5 py-2.5 min-h-[92px] shadow-[0_10px_24px_-18px_rgba(14,165,233,0.38)]">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_50%,white)]" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_70%,black)]">With Trainings</p>
              <p className="mt-1 text-2xl font-bold leading-none text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_84%,black)]">{withTrainingRecommendations}</p>
              <p className="mt-2 text-[11px] text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_64%,black)]">Has generated training items</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_26%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_6%,white)] px-3.5 py-2.5 min-h-[92px] shadow-[0_10px_24px_-18px_rgba(37,99,235,0.3)]">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_44%,white)]" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_70%,black)]">Pending</p>
              <p className="mt-1 text-2xl font-bold leading-none text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_84%,black)]">{pendingRecommendations}</p>
              <p className="mt-2 text-[11px] text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_64%,black)]">Ready for execution action</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
        <aside className={`${cardClassName} h-fit xl:sticky xl:top-20 space-y-3`}>
          <div>
            <p className={labelClassName}>TNA Recommendations</p>
          </div>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={inputClassName}
            placeholder={`Search ${employeeTerm.toLowerCase()} or role`}
          />
          {recommendationsQuery.isLoading ? (
            <p className="text-sm text-slate-500">Loading recommendations...</p>
          ) : filteredRecommendations.length === 0 ? (
            <p className="text-sm text-slate-500">No matching records found.</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {filteredRecommendations.map((recommendation) => {
                const isActive = recommendation._id === (selectedRecommendation?._id || "");
                const employeeName = getEmployeeName(recommendation);
                const status = normalizeStatus(recommendation.status);
                return (
                  <button
                    key={recommendation._id}
                    type="button"
                    onClick={() => setSelectedRecommendationId(recommendation._id)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900 truncate">{employeeName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {recommendation.jobRole || "--"}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {status}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600">
                        {toLocaleDateTime(recommendation.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className={`${cardClassName} space-y-4 min-h-[520px]`}>
          {!selectedRecommendation ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              Select a recommendation from the left panel.
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className={labelClassName}>Selected Recommendation</p>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {selectedEmployeeName} | {selectedRecommendation.jobRole || "No role"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Generated: {toLocaleDateTime(selectedRecommendation.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-fit"
                    onClick={() => navigate(`/${orgCode}/admin/program`)}
                  >
                    Open Programs
                  </Button>
                  <Button
                    variant="outline"
                    className="h-fit"
                    onClick={() => navigate(`/${orgCode}/admin/course`)}
                  >
                    Open Courses
                  </Button>
                </div>
              </div>

              <section className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className={labelClassName}>Recommended Trainings</p>
                  </div>
                  <div className="relative group/self">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_32%,white)] bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_12%,white)] text-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_78%,black)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_20%,white)] focus:outline-none focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_32%,transparent)]"
                      aria-label="What happens next"
                    >
                      <Lightbulb animateOnHover size={14} />
                    </button>
                    <div className="pointer-events-none absolute right-0 top-9 z-20 w-[320px] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl opacity-0 translate-y-1 transition-all duration-150 group-hover/self:translate-y-0 group-hover/self:opacity-100 group-focus-within/self:translate-y-0 group-focus-within/self:opacity-100">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        What Happens Next
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {WHAT_HAPPENS_NEXT_ITEMS.map((item, index) => (
                          <p key={`next-item-${index}`}>
                            {index + 1}. {item}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {suggestedTrainings.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-2">No generated training recommendations.</p>
                ) : (
                  <>
                    <div className="mt-3 rounded-xl border border-slate-200 bg-white">
                      <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-2.5">
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                          <input
                            value={trainingSearchTerm}
                            onChange={(event) => setTrainingSearchTerm(event.target.value)}
                            className={`${inputClassName} h-9 min-w-0 max-w-none lg:max-w-[640px] py-2`}
                            placeholder="Search training title, priority, or type"
                          />
                          <div className="flex flex-nowrap items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5">
                            {(
                              [
                                {
                                  key: "all",
                                  label: "All",
                                  count: trainingProgressSummary.total,
                                },
                                {
                                  key: "completed",
                                  label: "Completed",
                                  count: trainingProgressSummary.completed,
                                },
                                {
                                  key: "in_progress",
                                  label: "In Progress",
                                  count: trainingProgressSummary.inProgress,
                                },
                                {
                                  key: "pending",
                                  label: "Pending",
                                  count: trainingProgressSummary.pending,
                                },
                              ] as Array<{
                                key: TrainingFilterStatus;
                                label: string;
                                count: number;
                              }>
                            ).map((filterItem) => {
                              const isActive = trainingStatusFilter === filterItem.key;
                              return (
                                <button
                                  key={filterItem.key}
                                  type="button"
                                  onClick={() => setTrainingStatusFilter(filterItem.key)}
                                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                                    isActive
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                  }`}
                                >
                                  {filterItem.label}: {filterItem.count}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {filteredTrainingRows.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-slate-500">
                          No training records match the current filter.
                        </p>
                      ) : (
                        <div className="overflow-auto max-h-[460px]">
                          <table className="min-w-[680px] w-full">
                            <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur">
                              <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                <th className="px-3 py-2.5">Training</th>
                                <th className="px-3 py-2.5">Priority</th>
                                <th className="px-3 py-2.5">Type</th>
                                <th className="px-3 py-2.5">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredTrainingRows.map((row) => (
                                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                                  <td className="px-3 py-2.5 text-sm font-medium text-slate-900">{row.title}</td>
                                  <td className="px-3 py-2.5">
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${trainingPriorityBadgeClassMap[row.priority]}`}
                                    >
                                      {trainingPriorityLabelMap[row.priority]}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span className="text-xs font-medium text-slate-600">
                                      {row.mandatory ? "Mandatory" : "Optional"}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span
                                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${trainingStatusBadgeClassMap[row.status]}`}
                                    >
                                      {trainingStatusLabelMap[row.status]}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-slate-600">
                        {trainingProgressSummary.total > 0 &&
                        trainingProgressSummary.completed === trainingProgressSummary.total
                          ? "All recommendation items are completed. Next: update employee skills and rerun TNA."
                          : trainingProgressSummary.completed > 0
                          ? "Partial completion recorded. Keep recommendation status as Assigned until all items are completed."
                          : "No completed items yet. Auto create will move pending items to In Progress."}
                      </p>
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={labelClassName}>Execution Flow In LMS</p>
                        <HoverHelpTooltip
                          text="Choose execution mode: auto create from TNA, or manual create using LMS setup steps."
                          
                          className="shrink-0"
                        />
                      </div>
                    </div>
                    <div className="inline-grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setDeploymentCreateMode("auto_create")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          deploymentCreateMode === "auto_create"
                            ? "bg-primary text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Auto Create
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeploymentCreateMode("manual_create")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          deploymentCreateMode === "manual_create"
                            ? "bg-primary text-white"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Manual Create
                      </button>
                    </div>
                  </div>
                </div>

                {deploymentCreateMode === "auto_create" ? (
                  <>
                    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs text-slate-600">
                          Auto create runs only for training items still in{" "}
                          <span className="font-semibold">Pending</span>. Deployed items are moved to{" "}
                          <span className="font-semibold">In Progress</span>.
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Pending training items ready for auto create:{" "}
                          <span className="font-semibold text-slate-700">{pendingTrainingItemsCount}</span>
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={openPlannerModal}
                        isLoading={autoDeployMutation.isPending}
                        disabled={pendingTrainingItemsCount === 0}
                        className="h-10"
                      >
                        Plan Auto Create
                      </Button>
                    </div>

                    <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 space-y-1.5">
                      <p className="font-semibold text-slate-900">How auto create works</p>
                      <p>1. Groups employees by the same pending training title.</p>
                      <p>2. Creates or reuses program, course, and batch (no duplicate enrollments).</p>
                      <p>3. Sets deployed training items from Pending to In Progress automatically.</p>
                      <p>4. Re-clicking auto create only processes new pending items.</p>
                    </div>

                    {autoDeploySummary && (
                      <div
                        className={`mt-3 rounded-lg p-3 space-y-2 ${
                          autoDeploySummary.noOp
                            ? "border border-slate-200 bg-slate-50"
                            : "border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_28%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_8%,white)]"
                        }`}
                      >
                        <p
                          className={`text-sm font-semibold ${
                            autoDeploySummary.noOp
                              ? "text-slate-800"
                              : "text-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_84%,black)]"
                          }`}
                        >
                          Auto Create Summary
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Groups: <span className="font-semibold">{autoDeploySummary.totalGroups || 0}</span>
                          </div>
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Programs Created:{" "}
                            <span className="font-semibold">{autoDeploySummary.programsCreated || 0}</span>
                          </div>
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Courses Created:{" "}
                            <span className="font-semibold">{autoDeploySummary.coursesCreated || 0}</span>
                          </div>
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Batches Created:{" "}
                            <span className="font-semibold">{autoDeploySummary.batchesCreated || 0}</span>
                          </div>
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Batches Updated:{" "}
                            <span className="font-semibold">{autoDeploySummary.batchesUpdated || 0}</span>
                          </div>
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Enrollments Added:{" "}
                            <span className="font-semibold">{autoDeploySummary.enrollmentsAdded || 0}</span>
                          </div>
                          <div className="rounded-md border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_24%,white)] bg-white px-2.5 py-1.5">
                            Recommendations Updated:{" "}
                            <span className="font-semibold">
                              {autoDeploySummary.recommendationsUpdated || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 space-y-1.5">
                    <p className="font-semibold text-slate-900">How manual create works</p>
                    <p>1. Choose/create Program, then choose/create Course.</p>
                    <p>2. Create Batch with instructor and schedule.</p>
                    <p>3. Assign the recommended employee to the batch.</p>
                    <p>4. Progress updates are tracked back in TNA recommendation status.</p>
                  </div>
                )}
                {deploymentCreateMode === "manual_create" && (
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">1. Create or select Program</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Group related training initiatives under a program.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/${orgCode}/admin/program`)}>
                        Go To Programs
                      </Button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">2. Create or select Course</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Build the actual training course based on TNA recommendations.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/${orgCode}/admin/course`)}>
                        Go To Courses
                      </Button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          3. Create Batch and assign Instructor
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          In batch creation, choose the course, instructor, and schedule.
                        </p>
                      </div>
                      <Button variant="primary" onClick={() => navigate(createBatchPath)}>
                        Create Batch
                      </Button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          4. Assign {employeeTerm} to Batch
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          After creating the batch, open section details and add the recommended employee.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => navigate(`/${orgCode}/admin/section`)}>
                        Open Batches
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-3">
                <p className={labelClassName}>Suggested Carryover Values</p>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Employee</p>
                    <p className="font-medium text-slate-900">{selectedEmployeeName}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="text-xs text-slate-500">Job Role</p>
                    <p className="font-medium text-slate-900">{selectedRecommendation.jobRole || "--"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:col-span-2">
                    <p className="text-xs text-slate-500">Suggested Batch Name</p>
                    <p className="font-medium text-slate-900">{suggestedBatchName || "--"}</p>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
      <TnaAutoCreatePlanModal
        isOpen={isPlannerModalOpen}
        onClose={() => setIsPlannerModalOpen(false)}
        onConfirm={handleConfirmPlanner}
        isSubmitting={autoDeployMutation.isPending}
        defaultCourses={plannerDefaultCourses}
      />
    </div>
  );
}
