import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { useGetTnaRecommendations, useUpsertTnaRecommendationExecution } from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type RecommendationStatus = "pending" | "assigned" | "completed";
type TrainingProgressStatus = "pending" | "in_progress" | "completed";

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

const normalizeStatus = (value?: string): RecommendationStatus => {
  if (value === "assigned" || value === "completed") return value;
  return "pending";
};

const normalizeTrainingProgressStatus = (value?: string): TrainingProgressStatus => {
  if (value === "in_progress" || value === "completed") return value;
  return "pending";
};

const trainingStatusLabelMap: Record<TrainingProgressStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

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

export default function TnaExecutionPipelinePage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type || "school";
  const employeeTerm = getTerm("learner", orgType);

  const recommendationsQuery = useGetTnaRecommendations({ limit: 500, skip: 0 });
  const upsertExecutionMutation = useUpsertTnaRecommendationExecution();

  const recommendations = useMemo(() => {
    const response = recommendationsQuery.data as { data?: TnaRecommendation[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [recommendationsQuery.data]);

  const [selectedRecommendationId, setSelectedRecommendationId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [trainingStatusDrafts, setTrainingStatusDrafts] = useState<
    Record<string, TrainingProgressStatus>
  >({});

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

  useEffect(() => {
    if (!selectedRecommendation || !Array.isArray(selectedRecommendation.recommendedTrainings)) {
      setTrainingStatusDrafts({});
      return;
    }

    const nextDrafts: Record<string, TrainingProgressStatus> = {};
    for (const training of selectedRecommendation.recommendedTrainings) {
      const trainingId = String(training?._id || "");
      if (!trainingId) continue;
      nextDrafts[trainingId] = normalizeTrainingProgressStatus(training.progressStatus);
    }
    setTrainingStatusDrafts(nextDrafts);
  }, [selectedRecommendation?._id, selectedRecommendation?.recommendedTrainings]);

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

  const selectedEmployeeName = selectedRecommendation ? getEmployeeName(selectedRecommendation) : "";
  const selectedEmployeeId = selectedRecommendation ? getEmployeeId(selectedRecommendation) : "";

  const suggestedTrainings = useMemo(() => {
    if (!selectedRecommendation || !Array.isArray(selectedRecommendation.recommendedTrainings)) return [];
    return selectedRecommendation.recommendedTrainings
      .map((item) => String(item.title || "").trim())
      .filter(Boolean);
  }, [selectedRecommendation]);

  const trainingProgressSummary = useMemo(() => {
    const trainings = selectedRecommendation?.recommendedTrainings || [];
    let completed = 0;
    let inProgress = 0;

    for (const training of trainings) {
      const trainingId = String(training?._id || "");
      const status = trainingId
        ? trainingStatusDrafts[trainingId] || normalizeTrainingProgressStatus(training?.progressStatus)
        : normalizeTrainingProgressStatus(training?.progressStatus);
      if (status === "completed") completed += 1;
      if (status === "in_progress") inProgress += 1;
    }

    return {
      total: trainings.length,
      completed,
      inProgress,
      pending: Math.max(trainings.length - completed - inProgress, 0),
    };
  }, [selectedRecommendation, trainingStatusDrafts]);

  const saveTrainingProgress = async () => {
    if (!selectedRecommendation) return;
    const trainings = selectedRecommendation.recommendedTrainings || [];
    const trainingStatuses = trainings
      .map((training) => {
        const trainingId = String(training?._id || "");
        if (!trainingId) return null;
        return {
          trainingId,
          status:
            trainingStatusDrafts[trainingId] ||
            normalizeTrainingProgressStatus(training.progressStatus),
        };
      })
      .filter((item): item is { trainingId: string; status: TrainingProgressStatus } => Boolean(item));

    try {
      await toast.promise(
        upsertExecutionMutation.mutateAsync({
          recommendationId: selectedRecommendation._id,
          trainingStatuses,
        }),
        {
          pending: "Saving training progress...",
          success: "Training progress updated",
          error: "Failed to save training progress",
        }
      );
    } catch {
      // Error toast is already handled by toast.promise.
    }
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
                TNA To Course And Batch Deployment
              </h1>
              <p className="text-sm text-slate-600 mt-2 max-w-3xl">
                After reviewing TNA, continue in LMS setup: create or select Program and Course,
                create Batch, assign Instructor, then assign {employeeTerm.toLowerCase()} to the batch.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 min-w-[290px] text-sm">
            <div className="rounded-xl border border-slate-200 bg-white/85 px-3 py-2">
              <p className="text-xs text-slate-500">Total TNA</p>
              <p className="text-lg font-semibold text-slate-900">{totalRecommendations}</p>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/90 px-3 py-2">
              <p className="text-xs text-cyan-700">With Trainings</p>
              <p className="text-lg font-semibold text-cyan-700">{withTrainingRecommendations}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-2">
              <p className="text-xs text-amber-700">Pending</p>
              <p className="text-lg font-semibold text-amber-700">{pendingRecommendations}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_minmax(0,1fr)] gap-6">
        <aside className={`${cardClassName} h-fit xl:sticky xl:top-20 space-y-3`}>
          <div>
            <p className={labelClassName}>TNA Recommendations</p>
            <p className="text-xs text-slate-500 mt-1">
              Select a recommendation to continue deployment.
            </p>
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
                    <p className={labelClassName}>Recommended Trainings From TNA</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Update each training item. Recommendation is marked completed only when all items are completed.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                      Total: {trainingProgressSummary.total}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                      Completed: {trainingProgressSummary.completed}
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-cyan-700">
                      In Progress: {trainingProgressSummary.inProgress}
                    </span>
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
                      Pending: {trainingProgressSummary.pending}
                    </span>
                  </div>
                </div>

                {suggestedTrainings.length === 0 ? (
                  <p className="text-sm text-slate-500 mt-2">No generated training recommendations.</p>
                ) : (
                  <>
                    <div className="mt-3 space-y-2">
                      {selectedRecommendation.recommendedTrainings?.map((item, index) => {
                        const trainingId = String(item?._id || "");
                        const trainingStatus = trainingId
                          ? trainingStatusDrafts[trainingId] || normalizeTrainingProgressStatus(item.progressStatus)
                          : normalizeTrainingProgressStatus(item.progressStatus);

                        return (
                          <div
                            key={`${selectedRecommendation._id}-training-${trainingId || index}`}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {item.title || "Untitled training"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Priority: {item.priority || "medium"} |{" "}
                                  {item.mandatory ? "mandatory" : "optional"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Progress</span>
                                <select
                                  value={trainingStatus}
                                  disabled={!trainingId || upsertExecutionMutation.isPending}
                                  onChange={(event) => {
                                    if (!trainingId) return;
                                    setTrainingStatusDrafts((previous) => ({
                                      ...previous,
                                      [trainingId]: event.target.value as TrainingProgressStatus,
                                    }));
                                  }}
                                  className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                  <option value="pending">{trainingStatusLabelMap.pending}</option>
                                  <option value="in_progress">{trainingStatusLabelMap.in_progress}</option>
                                  <option value="completed">{trainingStatusLabelMap.completed}</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <p className="text-xs text-slate-600">
                        {trainingProgressSummary.total > 0 &&
                        trainingProgressSummary.completed === trainingProgressSummary.total
                          ? "All recommendation items are completed. Next: update employee skills and rerun TNA."
                          : trainingProgressSummary.completed > 0
                          ? "Partial completion recorded. Keep recommendation status as Assigned until all items are completed."
                          : "No completed items yet. Start the first training and mark it In Progress."}
                      </p>
                      <Button
                        variant="primary"
                        onClick={saveTrainingProgress}
                        isLoading={upsertExecutionMutation.isPending}
                      >
                        Save Training Progress
                      </Button>
                    </div>
                  </>
                )}
              </section>

              <section className="rounded-xl border border-slate-200 bg-emerald-50/50 p-4">
                <p className={labelClassName}>What Happens Next</p>
                <div className="mt-2 space-y-1.5 text-sm text-slate-700">
                  <p>1. Finish one recommendation item: keep overall status as Assigned.</p>
                  <p>2. Finish all recommendation items: recommendation becomes Completed.</p>
                  <p>3. After completion: update employee skill levels in Step 3.</p>
                  <p>4. Rerun TNA in Step 4 to measure remaining gaps and generate next actions.</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className={labelClassName}>Deployment Flow In LMS</p>
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
    </div>
  );
}
