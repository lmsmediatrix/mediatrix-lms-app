import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { SearchableSelect } from "../../components/SearchableSelect";
import { useAuth } from "../../context/AuthContext";
import { useCourses } from "../../hooks/useCourse";
import { useSearchStudents } from "../../hooks/useStudent";
import {
  useAnalyzeTna,
  useDeleteTnaRecommendation,
  useGetTnaRecommendations,
  useGetTnaRoleRequirements,
  useGetTnaSkills,
  useUpdateTnaRecommendationStatus,
  useUpsertEmployeeSkill,
} from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type LevelRow = { skillId: string; level: number };
type ComplianceRow = { title: string; courseId: string; mandatory: boolean };
type RecommendationStatus = "pending" | "assigned" | "completed";
type StepKey = "employee-skills" | "analyze" | "recommendations";

const FLOW_STEPS: Array<{
  key: StepKey;
  title: string;
  description: string;
}> = [
  {
    key: "employee-skills",
    title: "Capture Employee Role and Skills",
    description: "Select employee, target role, and current competency levels.",
  },
  {
    key: "analyze",
    title: "Run TNA Analysis",
    description: "Compare gaps and include test, manager, compliance, and request signals.",
  },
  {
    key: "recommendations",
    title: "Track Recommendations",
    description: "Review recommendations and move their status to assigned/completed.",
  },
];

const STEP_GUIDANCE: Record<
  StepKey,
  {
    goal: string;
    checklist: string[];
  }
> = {
  "employee-skills": {
    goal: "Capture employee profile inputs so gaps can be measured accurately.",
    checklist: [
      "Select an employee profile.",
      "Select the target role from configured role standards.",
      "Add current skill levels using the same 1 to 5 scale.",
      "Save before moving to analysis.",
    ],
  },
  analyze: {
    goal: "Run analysis to compare role standards versus employee profile and extra signals.",
    checklist: [
      "Choose employee and job role.",
      "Review role standard preview to confirm required levels.",
      "Run analysis to generate recommendations.",
    ],
  },
  recommendations: {
    goal: "Track and manage generated recommendations through completion.",
    checklist: [
      "Review skill gap and recommendation counts per employee.",
      "Update status from pending to assigned or completed.",
      "Open employee details for full recommendation breakdown.",
    ],
  },
};

const parseList = (value: string): string[] =>
  value
    .split(/[\n,]/g)
    .map((item) => item.trim())
    .filter(Boolean);

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object") {
    const err = error as {
      response?: { data?: { message?: string; error?: { message?: string } | string } };
      message?: string;
    };
    const nestedError = err.response?.data?.error;
    if (typeof nestedError === "string") return nestedError;
    if (nestedError && typeof nestedError === "object" && typeof nestedError.message === "string") {
      return nestedError.message;
    }
    if (typeof err.response?.data?.message === "string") return err.response.data.message;
    if (typeof err.message === "string") return err.message;
  }
  return "Something went wrong";
};

const normalizeStatus = (status: string): RecommendationStatus => {
  if (status === "assigned" || status === "completed") return status;
  return "pending";
};

export default function TnaPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type;
  const organizationId = currentUser?.user?.organization?._id;
  const employeeTerm = getTerm("learner", orgType || "school");
  const employeeTermPlural = getTerm("learner", orgType || "school", true);

  const skillsQuery = useGetTnaSkills({ limit: 200, skip: 0 });
  const roleRequirementsQuery = useGetTnaRoleRequirements({ limit: 200, skip: 0 });
  const studentsQuery = useSearchStudents({
    organizationId,
    limit: 200,
    skip: 0,
    archiveStatus: "none",
  });
  const coursesQuery = useCourses({ organizationId, limit: 200, skip: 0, archiveStatus: "none" });
  const recommendationsQuery = useGetTnaRecommendations({ limit: 50, skip: 0 });

  const upsertEmployeeSkillMutation = useUpsertEmployeeSkill();
  const analyzeTnaMutation = useAnalyzeTna();
  const deleteRecommendationMutation = useDeleteTnaRecommendation();
  const updateRecommendationStatusMutation = useUpdateTnaRecommendationStatus();

  const skills = useMemo(() => {
    const response = skillsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [skillsQuery.data]);

  const employees = useMemo(() => {
    const response = studentsQuery.data as { students?: any[] } | undefined;
    return Array.isArray(response?.students) ? response.students : [];
  }, [studentsQuery.data]);

  const roleRequirements = useMemo(() => {
    const response = roleRequirementsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [roleRequirementsQuery.data]);

  const roleOptions = useMemo(() => {
    const uniqueRoles = new Set<string>();
    for (const roleRequirement of roleRequirements) {
      const roleName = String(roleRequirement?.jobRole || "").trim();
      if (roleName) uniqueRoles.add(roleName);
    }
    return Array.from(uniqueRoles).sort((a, b) => a.localeCompare(b));
  }, [roleRequirements]);

  const courses = useMemo(() => {
    const response = coursesQuery.data as { courses?: any[] } | undefined;
    return Array.isArray(response?.courses) ? response.courses : [];
  }, [coursesQuery.data]);

  const recommendations = useMemo(() => {
    const response = recommendationsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [recommendationsQuery.data]);

  const [activeStep, setActiveStep] = useState<StepKey>("employee-skills");
  const [employeeId, setEmployeeId] = useState("");
  const [employeeSkills, setEmployeeSkills] = useState<LevelRow[]>([{ skillId: "", level: 1 }]);

  const [analyzeEmployeeId, setAnalyzeEmployeeId] = useState("");
  const [analyzeJobRole, setAnalyzeJobRole] = useState("");
  const [score, setScore] = useState("");
  const [performanceGaps, setPerformanceGaps] = useState("");
  const [managerRecommendations, setManagerRecommendations] = useState("");
  const [employeeRequests, setEmployeeRequests] = useState("");
  const [compliance, setCompliance] = useState<ComplianceRow[]>([
    { title: "", courseId: "", mandatory: true },
  ]);
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RecommendationStatus>>({});
  const [deletingRecommendationId, setDeletingRecommendationId] = useState<string | null>(null);

  const selectedAnalyzeRoleRequirement = useMemo(() => {
    const normalizedRole = analyzeJobRole.trim().toLowerCase();
    if (!normalizedRole) return null;
    return (
      roleRequirements.find(
        (roleRequirement) =>
          String(roleRequirement?.jobRole || "").trim().toLowerCase() === normalizedRole
      ) || null
    );
  }, [analyzeJobRole, roleRequirements]);

  const selectedAnalyzeRoleSkills = useMemo(() => {
    if (!selectedAnalyzeRoleRequirement) return [];
    if (!Array.isArray(selectedAnalyzeRoleRequirement.requiredSkills)) return [];
    return selectedAnalyzeRoleRequirement.requiredSkills.filter((skillItem: any) =>
      Boolean(skillItem?.skillName)
    );
  }, [selectedAnalyzeRoleRequirement]);

  const analyzeThreshold = useMemo(() => {
    const roleThreshold = Number(selectedAnalyzeRoleRequirement?.preAssessmentThreshold);
    if (Number.isFinite(roleThreshold) && roleThreshold >= 0 && roleThreshold <= 100) {
      return roleThreshold;
    }
    return 70;
  }, [selectedAnalyzeRoleRequirement]);

  useEffect(() => {
    if (!employeeId && employees.length > 0) setEmployeeId(employees[0]._id);
    if (!analyzeEmployeeId && employees.length > 0) setAnalyzeEmployeeId(employees[0]._id);
  }, [employees, employeeId, analyzeEmployeeId]);

  useEffect(() => {
    if (!analyzeJobRole && roleOptions.length > 0) {
      setAnalyzeJobRole(roleOptions[0]);
    }
  }, [analyzeJobRole, roleOptions]);

  useEffect(() => {
    const nextDrafts: Record<string, RecommendationStatus> = {};
    for (const recommendation of recommendations) {
      nextDrafts[recommendation._id] = normalizeStatus(recommendation.status);
    }
    setStatusDrafts(nextDrafts);
  }, [recommendations]);

  const completionByStep = useMemo<Record<StepKey, boolean>>(
    () => ({
      "employee-skills":
        Boolean(employeeId) &&
        Boolean(analyzeJobRole.trim()) &&
        employeeSkills.some((skill) => Boolean(skill.skillId)),
      analyze: recommendations.length > 0,
      recommendations: recommendations.length > 0,
    }),
    [employeeId, analyzeJobRole, employeeSkills, recommendations.length]
  );

  const pendingRecommendations = useMemo(
    () =>
      recommendations.filter(
        (recommendation) => normalizeStatus(recommendation.status) === "pending"
      ).length,
    [recommendations]
  );

  const activeStepIndex = useMemo(
    () => FLOW_STEPS.findIndex((step) => step.key === activeStep),
    [activeStep]
  );

  const completedStepCount = useMemo(
    () => FLOW_STEPS.filter((step) => completionByStep[step.key]).length,
    [completionByStep]
  );

  const flowProgressPercent = useMemo(
    () =>
      Math.max(
        5,
        Math.round((((activeStepIndex < 0 ? 0 : activeStepIndex) + 1) / FLOW_STEPS.length) * 100)
      ),
    [activeStepIndex]
  );

  const nextStepTitle = useMemo(() => {
    if (activeStepIndex < 0 || activeStepIndex >= FLOW_STEPS.length - 1) return "Final step";
    return FLOW_STEPS[activeStepIndex + 1].title;
  }, [activeStepIndex]);

  const skillSelectOptions = useMemo(
    () =>
      skills.map((skill) => ({
        value: String(skill._id || ""),
        label: String(skill.name || "Unnamed skill"),
      })),
    [skills]
  );

  const employeeSelectOptions = useMemo(
    () =>
      employees.map((employee) => {
        const firstName = String(employee.firstName || "").trim();
        const lastName = String(employee.lastName || "").trim();
        const fullName = `${firstName} ${lastName}`.trim() || employee.email || "Unnamed employee";
        return {
          value: String(employee._id || ""),
          label: fullName,
          description: employee.email || undefined,
        };
      }),
    [employees]
  );

  const roleSelectOptions = useMemo(
    () =>
      roleOptions.map((roleOption) => ({
        value: roleOption,
        label: roleOption,
      })),
    [roleOptions]
  );

  const courseSelectOptions = useMemo(
    () =>
      courses.map((course) => ({
        value: String(course._id || ""),
        label: `${course.code ? `${course.code} - ` : ""}${course.title || "Untitled course"}`,
      })),
    [courses]
  );

  const recommendationStatusOptions = useMemo(
    () => [
      { value: "pending", label: "Pending" },
      { value: "assigned", label: "Assigned" },
      { value: "completed", label: "Completed" },
    ],
    []
  );

  const getStepStatusMeta = (stepKey: StepKey) => {
    if (completionByStep[stepKey]) {
      return {
        label: "Complete",
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }
    if (activeStep === stepKey) {
      return {
        label: "In Progress",
        className: "border-primary/25 bg-primary/10 text-primary",
      };
    }
    return {
      label: "Pending",
      className: "border-slate-200 bg-slate-100 text-slate-600",
    };
  };

  if (orgType !== "corporate") {
    return <Navigate to={`/${orgCode}/admin/dashboard`} replace />;
  }

  const inputClassName =
    "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 focus:outline-none focus:border-[color:var(--color-primary,#2563eb)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_18%,transparent)]";
  const textareaClassName =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-200 focus:outline-none focus:border-[color:var(--color-primary,#2563eb)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_18%,transparent)]";
  const panelClassName =
    "rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.35)]";
  const fieldLabelClassName = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  const fieldHintClassName = "mt-1 text-xs text-slate-500";
  const sectionSurfaceClassName = "rounded-xl border border-slate-200 bg-white p-3.5";
  const employeeSkillsStatus = getStepStatusMeta("employee-skills");
  const analyzeStatus = getStepStatusMeta("analyze");
  const recommendationsStatus = getStepStatusMeta("recommendations");

  const saveEmployeeSkills = async () => {
    if (!employeeId) return toast.error(`${employeeTerm} is required`);
    if (!analyzeJobRole.trim()) {
      return toast.error("Job role is required. Configure role standards in TNA Skill and Role Setup.");
    }
    const payloadSkills = employeeSkills.filter((item) => item.skillId).map((item) => ({
      skillId: item.skillId,
      currentLevel: Number(item.level),
    }));
    if (payloadSkills.length === 0) return toast.error("Add at least one skill");
    try {
      await toast.promise(
        upsertEmployeeSkillMutation.mutateAsync({ employeeId, skills: payloadSkills }),
        { pending: "Saving employee skills...", success: "Saved", error: "Failed to save" }
      );
      setAnalyzeEmployeeId(employeeId);
      setActiveStep("analyze");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const runAnalysis = async () => {
    if (!analyzeEmployeeId) return toast.error(`${employeeTerm} is required`);
    if (!analyzeJobRole.trim()) return toast.error("Job role is required");
    try {
      await toast.promise(
        analyzeTnaMutation.mutateAsync({
          employeeId: analyzeEmployeeId,
          jobRole: analyzeJobRole.trim(),
          preAssessment: score.trim()
            ? { score: Number(score), threshold: analyzeThreshold }
            : undefined,
          performanceGaps: parseList(performanceGaps),
          managerRecommendations: parseList(managerRecommendations),
          employeeRequests: parseList(employeeRequests),
          complianceRequirements: compliance
            .filter((item) => item.title.trim())
            .map((item) => ({
              title: item.title.trim(),
              courseId: item.courseId || undefined,
              mandatory: item.mandatory,
            })),
        }),
        { pending: "Running TNA analysis...", success: "Analysis complete", error: "Analysis failed" }
      );
      setActiveStep("recommendations");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const updateStatus = async (
    recommendationId: string,
    nextStatus: RecommendationStatus,
    currentStatus?: RecommendationStatus
  ) => {
    if (currentStatus && nextStatus === currentStatus) return;
    try {
      await toast.promise(
        updateRecommendationStatusMutation.mutateAsync({ recommendationId, status: nextStatus }),
        { pending: "Updating status...", success: "Status updated", error: "Failed to update status" }
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteRecommendation = async (recommendationId: string) => {
    const shouldDelete = window.confirm(
      "Delete this recommendation? This action cannot be undone."
    );
    if (!shouldDelete) return;

    setDeletingRecommendationId(recommendationId);
    try {
      await toast.promise(
        deleteRecommendationMutation.mutateAsync({ recommendationId }),
        {
          pending: "Deleting recommendation...",
          success: "Recommendation deleted",
          error: "Failed to delete recommendation",
        }
      );
      setStatusDrafts((previous) => {
        const next = { ...previous };
        delete next[recommendationId];
        return next;
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingRecommendationId(null);
    }
  };

  return (
    <div className="pt-14 pb-6 px-4 md:px-6 lg:p-6 space-y-6">
      <section
        className="rounded-2xl border border-slate-200 p-5 md:p-6"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, #ffffff), #ffffff 55%, color-mix(in srgb, var(--color-secondary) 15%, #ffffff))",
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Corporate Workflow</p>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">Training Needs Analysis</h1>
              <p className="text-slate-600 mt-2 max-w-3xl">
                This flow is focused on employee role and level capture, analysis, and recommendation
                tracking. Skills and role standards are configured in a separate Configuration page.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-10 w-full md:w-auto"
              onClick={() => navigate(`/${orgCode}/admin/tna/configuration`)}
            >
              Open Skill and Role Setup
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skill Library</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{skills.length}</p>
              <p className="text-xs text-slate-500 mt-1">Reusable skills available</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role Standards</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{roleOptions.length}</p>
              <p className="text-xs text-slate-500 mt-1">Configured role profiles</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{employeeTermPlural}</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{employees.length}</p>
              <p className="text-xs text-slate-500 mt-1">Profiles ready for TNA</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Actions</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{pendingRecommendations}</p>
              <p className="text-xs text-slate-500 mt-1">Recommendations waiting assignment</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.3)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Workflow Progress</p>
            <p className="text-sm text-slate-700 mt-1">
              Step {Math.max(activeStepIndex + 1, 1)} of {FLOW_STEPS.length}:{" "}
              <span className="font-semibold text-slate-900">
                {FLOW_STEPS[Math.max(activeStepIndex, 0)]?.title}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Next: {nextStepTitle}</p>
          </div>
          <div className="text-sm text-slate-600">
            Completed{" "}
            <span className="font-semibold text-slate-900">{completedStepCount}</span> /{" "}
            {FLOW_STEPS.length}
          </div>
        </div>

        <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${flowProgressPercent}%`,
              background:
                "linear-gradient(90deg, var(--color-primary, #2563eb) 0%, color-mix(in srgb, var(--color-primary, #2563eb) 55%, #22c55e 45%) 100%)",
            }}
          />
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
  {FLOW_STEPS.map((step, index) => {
    const isActive = activeStep === step.key;
    const isComplete = completionByStep[step.key];
    const statusMeta = getStepStatusMeta(step.key);
    const stepGuide = STEP_GUIDANCE[step.key] || STEP_GUIDANCE["employee-skills"];
    const hoverAlignClass = index >= FLOW_STEPS.length - 2 ? "right-0" : "left-0";

    return (
      <div key={`flow-chip-${step.key}`} className="relative group">
        <button
          type="button"
          onClick={() => setActiveStep(step.key)}
          className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
            isActive
              ? "border-primary bg-primary/10"
              : isComplete
              ? "border-emerald-200 bg-emerald-50/70"
              : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
          }`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Step {index + 1}
          </p>
          <p className="mt-0.5 flex items-center gap-2 text-sm font-medium text-slate-900">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span>{step.title}</span>
          </p>
          <span
            className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.className}`}
          >
            {statusMeta.label}
          </span>
        </button>

        <div
          className={`pointer-events-none absolute ${hoverAlignClass} top-full z-30 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-[0_20px_50px_-22px_rgba(15,23,42,0.45)] backdrop-blur-sm opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Step {index + 1}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{step.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
          <div className="mt-2 space-y-1.5">
            {stepGuide.checklist.map((item) => (
              <div key={`${step.key}-${item}`} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/80" />
                <p className="text-xs leading-5 text-slate-700">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  })}
</div>
      </section>

      <div className="space-y-6">
          <section
            id="employee-skills"
            className={`${panelClassName} space-y-4 ${
              activeStep === "employee-skills" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className={fieldLabelClassName}>Step 1</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${employeeSkillsStatus.className}`}
                  >
                    {employeeSkillsStatus.label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Capture {employeeTerm} Role and Skills</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Select an employee, pick the role, then save current competency levels.
                </p>
              </div>
              <Button variant="outline" onClick={() => setActiveStep("analyze")} className="h-fit">
                Next Step
              </Button>
            </div>

            <div className={`${sectionSurfaceClassName} space-y-3`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Select {employeeTerm}</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={employeeSelectOptions}
                      value={employeeId}
                      onChange={(value) => setEmployeeId(value)}
                      placeholder={`Select ${employeeTerm.toLowerCase()}`}
                      loading={studentsQuery.isLoading}
                      emptyMessage={`No ${employeeTermPlural.toLowerCase()} found.`}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Job Role</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={roleSelectOptions}
                      value={analyzeJobRole}
                      onChange={(value) => setAnalyzeJobRole(value)}
                      placeholder={
                        roleRequirementsQuery.isLoading
                          ? "Loading role standards..."
                          : roleOptions.length > 0
                          ? "Select job role"
                          : "No role standards yet"
                      }
                      loading={roleRequirementsQuery.isLoading}
                      emptyMessage="No role standards yet. Configure them in TNA Skill and Role Setup."
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
              <p className={fieldHintClassName}>
                Use the same scale from the Level Guide. Skills and role standards are managed in Configuration.
              </p>
              {!roleRequirementsQuery.isLoading && roleOptions.length === 0 && (
                <button
                  type="button"
                  className="text-xs text-amber-700 underline underline-offset-2"
                  onClick={() => navigate(`/${orgCode}/admin/tna/configuration`)}
                >
                  No role standards found. Open Skill and Role Setup.
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
              <p className={fieldLabelClassName}>Current Skills And Levels</p>
              <div className="hidden md:grid grid-cols-12 gap-2 px-1">
                <p className={`col-span-8 ${fieldLabelClassName}`}>Skill</p>
                <p className={`col-span-2 ${fieldLabelClassName}`}>Level</p>
                <p className={`col-span-2 ${fieldLabelClassName}`}>Action</p>
              </div>
              {employeeSkills.map((item, index) => (
                <div key={`employee-skill-${index}`} className="grid grid-cols-12 gap-2">
                  <div className="col-span-12 md:col-span-8">
                    <SearchableSelect
                      options={skillSelectOptions}
                      value={item.skillId}
                      onChange={(value) => {
                        const next = [...employeeSkills];
                        next[index] = { ...next[index], skillId: value };
                        setEmployeeSkills(next);
                      }}
                      placeholder="Select skill"
                      loading={skillsQuery.isLoading}
                      emptyMessage="No skills yet. Add skills in TNA Skill and Role Setup."
                      className="w-full"
                    />
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={item.level}
                    onChange={(event) => {
                      const next = [...employeeSkills];
                      next[index] = { ...next[index], level: Number(event.target.value || 0) };
                      setEmployeeSkills(next);
                    }}
                    className={`col-span-7 md:col-span-2 ${inputClassName}`}
                  />
                  <button
                    type="button"
                    className="col-span-5 md:col-span-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
                    onClick={() => {
                      if (employeeSkills.length === 1) return;
                      setEmployeeSkills(employeeSkills.filter((_, rowIndex) => rowIndex !== index));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <p className={fieldHintClassName}>
                Enter the employee&apos;s actual current level, not the target role level.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setEmployeeSkills([...employeeSkills, { skillId: "", level: 1 }])}
              >
                Add Employee Skill
              </Button>
              <Button
                variant="primary"
                onClick={saveEmployeeSkills}
                isLoading={upsertEmployeeSkillMutation.isPending}
              >
                Save Employee Skills
              </Button>
            </div>
          </section>

          <section
            id="analyze"
            className={`${panelClassName} space-y-4 ${activeStep === "analyze" ? "ring-2 ring-primary/20" : ""}`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className={fieldLabelClassName}>Step 2</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${analyzeStatus.className}`}
                  >
                    {analyzeStatus.label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Run TNA Analysis</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Combine role standards, skill gaps, and optional signals to generate recommendations.
                </p>
              </div>
              <Button variant="outline" onClick={() => setActiveStep("recommendations")} className="h-fit">
                Next Step
              </Button>
            </div>

            <div className={`${sectionSurfaceClassName} space-y-3`}>
              <p className={fieldLabelClassName}>Core Inputs</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={fieldLabelClassName}>{employeeTerm}</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={employeeSelectOptions}
                      value={analyzeEmployeeId}
                      onChange={(value) => setAnalyzeEmployeeId(value)}
                      placeholder={`Select ${employeeTerm.toLowerCase()}`}
                      loading={studentsQuery.isLoading}
                      emptyMessage={`No ${employeeTermPlural.toLowerCase()} found.`}
                      className="w-full"
                    />
                  </div>
                  <p className={fieldHintClassName}>Choose who you want to assess now.</p>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Job Role</label>
                  <div className="mt-1">
                    <SearchableSelect
                      options={roleSelectOptions}
                      value={analyzeJobRole}
                      onChange={(value) => setAnalyzeJobRole(value)}
                      placeholder={
                        roleRequirementsQuery.isLoading
                          ? "Loading role standards..."
                          : roleOptions.length > 0
                          ? "Select job role"
                          : "No role standards yet"
                      }
                      loading={roleRequirementsQuery.isLoading}
                      emptyMessage="No role standards yet. Configure them in TNA Skill and Role Setup."
                      className="w-full"
                    />
                  </div>
                  {!roleRequirementsQuery.isLoading && roleOptions.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      Define role standards in Configuration before running analysis.
                    </p>
                  )}
                </div>
                <div>
                  <label className={fieldLabelClassName}>Pre-test Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    onChange={(event) => setScore(event.target.value)}
                    className={`${inputClassName} mt-1`}
                    placeholder="Optional"
                  />
                  <p className={fieldHintClassName}>Leave empty if no pre-test was taken.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Role Standard Preview</p>
                  <p className="text-xs text-slate-500">
                    {analyzeJobRole.trim()
                      ? `Selected role: ${analyzeJobRole}`
                      : "Select a job role to view required skills and levels."}
                  </p>
                </div>
                <span className="inline-flex h-fit items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                  Passing threshold: {analyzeThreshold}%
                </span>
              </div>

              {!analyzeJobRole.trim() ? (
                <p className="text-sm text-slate-500 mt-3">
                  Choose a role from the dropdown above.
                </p>
              ) : !selectedAnalyzeRoleRequirement ? (
                <p className="text-sm text-amber-700 mt-3">
                  No saved role standards found for this role yet. Configure it in TNA Skill and Role Setup first.
                </p>
              ) : selectedAnalyzeRoleSkills.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">
                  This role has no required skills configured yet.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedAnalyzeRoleSkills.map((skillItem: any, index: number) => (
                    <div
                      key={`${skillItem.skill || skillItem.skillName || "skill"}-${index}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <p className="font-medium text-slate-900">{skillItem.skillName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Required level: {Number(skillItem.requiredLevel) || 0}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className={fieldLabelClassName}>Optional Signals</p>
                <p className="text-xs text-slate-500">
                  Use comma or new line separation for each item.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={fieldLabelClassName}>Performance Gaps</label>
                  <textarea
                    value={performanceGaps}
                    onChange={(event) => setPerformanceGaps(event.target.value)}
                    className={`min-h-[88px] ${textareaClassName} mt-1`}
                    placeholder="Comma or new line separated"
                  />
                  <p className={fieldHintClassName}>Examples: missed deadlines, low quality output.</p>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Manager Recommendations</label>
                  <textarea
                    value={managerRecommendations}
                    onChange={(event) => setManagerRecommendations(event.target.value)}
                    className={`min-h-[88px] ${textareaClassName} mt-1`}
                    placeholder="Comma or new line separated"
                  />
                  <p className={fieldHintClassName}>Examples: mentor support, course focus areas.</p>
                </div>
                <div>
                  <label className={fieldLabelClassName}>Employee Requests</label>
                  <textarea
                    value={employeeRequests}
                    onChange={(event) => setEmployeeRequests(event.target.value)}
                    className={`min-h-[88px] ${textareaClassName} mt-1`}
                    placeholder="Comma or new line separated"
                  />
                  <p className={fieldHintClassName}>Examples: requested topics or certifications.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Compliance Signals</p>
                <p className="text-xs text-slate-500">
                  Add mandatory or optional compliance training requirements.
                </p>
              </div>
              {compliance.map((item, index) => (
                <div
                  key={`compliance-${index}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2"
                >
                  <input
                    value={item.title}
                    onChange={(event) => {
                      const next = [...compliance];
                      next[index] = { ...next[index], title: event.target.value };
                      setCompliance(next);
                    }}
                    className={`md:col-span-5 ${inputClassName}`}
                    placeholder="Compliance training title"
                  />
                  <div className="md:col-span-4">
                    <SearchableSelect
                      options={courseSelectOptions}
                      value={item.courseId}
                      onChange={(value) => {
                        const next = [...compliance];
                        next[index] = { ...next[index], courseId: value };
                        setCompliance(next);
                      }}
                      placeholder={coursesQuery.isLoading ? "Loading courses..." : "Optional course link"}
                      loading={coursesQuery.isLoading}
                      emptyMessage="No courses available"
                      className="w-full"
                    />
                  </div>
                  <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700 rounded-lg border border-slate-200 px-3">
                    <input
                      type="checkbox"
                      checked={item.mandatory}
                      onChange={(event) => {
                        const next = [...compliance];
                        next[index] = { ...next[index], mandatory: event.target.checked };
                        setCompliance(next);
                      }}
                    />
                    Mandatory
                  </label>
                  <button
                    type="button"
                    className="md:col-span-1 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 py-2"
                    onClick={() => {
                      if (compliance.length === 1) return;
                      setCompliance(compliance.filter((_, rowIndex) => rowIndex !== index));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => setCompliance([...compliance, { title: "", courseId: "", mandatory: true }])}
              >
                Add Compliance Requirement
              </Button>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={runAnalysis} isLoading={analyzeTnaMutation.isPending}>
                Run TNA Analysis
              </Button>
            </div>
          </section>

          <section
            id="recommendations"
            className={`${panelClassName} space-y-4 ${
              activeStep === "recommendations" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className={fieldLabelClassName}>Step 3</p>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${recommendationsStatus.className}`}
                  >
                    {recommendationsStatus.label}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Track Recommendations</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Review generated recommendations and move each one through assignment and completion.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row sm:flex-wrap md:justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${orgCode}/admin/tna/employees`)}
                  className="h-10 px-4 text-sm text-center leading-tight"
                >
                  View Employee TNA Details
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/${orgCode}/admin/tna/execution`)}
                  className="h-10 px-4 text-sm text-center leading-tight"
                >
                  Deploy to Program and Batch
                </Button>
              </div>
            </div>

            {recommendationsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No recommendations yet. Complete steps 1 and 2, then run analysis.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white">
                  <table className="w-full table-auto text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3">Skill Gaps</th>
                        <th className="px-4 py-3">Recommended</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recommendations.map((recommendation) => {
                        const currentStatus = normalizeStatus(recommendation.status);
                        const currentDraft = statusDrafts[recommendation._id] || currentStatus;
                        const isDeletingCurrent =
                          deleteRecommendationMutation.isPending &&
                          deletingRecommendationId === recommendation._id;
                        const firstName = String(recommendation.employee?.firstName || "").trim();
                        const lastName = String(recommendation.employee?.lastName || "").trim();
                        const fullName =
                          `${firstName} ${lastName}`.trim() ||
                          recommendation.employee?.email ||
                          "Unknown employee";

                        return (
                          <tr
                            key={recommendation._id}
                            className="border-t border-slate-100 align-top relative focus-within:z-20"
                          >
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-slate-900">{fullName}</p>
                              <p className="text-xs text-slate-500 mt-1">
                                {recommendation.employee?.email || "--"}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-slate-700">{recommendation.jobRole || "--"}</td>
                            <td className="px-4 py-3 text-slate-700">
                              {new Date(recommendation.createdAt || Date.now()).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {Array.isArray(recommendation.skillGaps)
                                  ? recommendation.skillGaps.length
                                  : 0}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {Array.isArray(recommendation.recommendedTrainings)
                                  ? recommendation.recommendedTrainings.length
                                  : 0}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="w-[190px]">
                                <SearchableSelect
                                  options={recommendationStatusOptions}
                                  value={currentDraft}
                                  onChange={(value) => {
                                    const nextStatus = value as RecommendationStatus;
                                    setStatusDrafts((previous) => ({
                                      ...previous,
                                      [recommendation._id]: nextStatus,
                                    }));
                                    void updateStatus(recommendation._id, nextStatus, currentStatus);
                                  }}
                                  placeholder="Select status"
                                  className="w-full"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                className="h-10 min-w-[110px] rounded-lg border border-red-200 px-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => {
                                  void deleteRecommendation(recommendation._id);
                                }}
                                disabled={deleteRecommendationMutation.isPending}
                              >
                                {isDeletingCurrent ? "Deleting..." : "Delete"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
            )}
          </section>
      </div>
    </div>
  );
}

