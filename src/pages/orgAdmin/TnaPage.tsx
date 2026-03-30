import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { useCourses } from "../../hooks/useCourse";
import { useSearchStudents } from "../../hooks/useStudent";
import {
  useAnalyzeTna,
  useCreateTnaSkill,
  useGetTnaRecommendations,
  useGetTnaSkills,
  useUpdateTnaRecommendationStatus,
  useUpsertEmployeeSkill,
  useUpsertRoleRequirement,
} from "../../hooks/useTna";
import { getTerm } from "../../lib/utils";

type LevelRow = { skillId: string; level: number };
type ComplianceRow = { title: string; courseId: string; mandatory: boolean };
type RecommendationStatus = "pending" | "assigned" | "completed";
type StepKey =
  | "skill-library"
  | "role-requirements"
  | "employee-skills"
  | "analyze"
  | "recommendations";

const FLOW_STEPS: Array<{
  key: StepKey;
  title: string;
  description: string;
}> = [
  {
    key: "skill-library",
    title: "Build Skill Library",
    description: "Create reusable skills used by every role and employee profile.",
  },
  {
    key: "role-requirements",
    title: "Define Role Standards",
    description: "Set required skill levels and passing threshold per job role.",
  },
  {
    key: "employee-skills",
    title: "Capture Employee Skills",
    description: "Store each employee's current competency levels.",
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
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type;
  const organizationId = currentUser?.user?.organization?._id;
  const employeeTerm = getTerm("learner", orgType || "school");
  const employeeTermPlural = getTerm("learner", orgType || "school", true);

  const skillsQuery = useGetTnaSkills({ limit: 200, skip: 0 });
  const studentsQuery = useSearchStudents({
    organizationId,
    limit: 200,
    skip: 0,
    archiveStatus: "none",
  });
  const coursesQuery = useCourses({ organizationId, limit: 200, skip: 0, archiveStatus: "none" });
  const recommendationsQuery = useGetTnaRecommendations({ limit: 50, skip: 0 });

  const createSkillMutation = useCreateTnaSkill();
  const upsertRoleRequirementMutation = useUpsertRoleRequirement();
  const upsertEmployeeSkillMutation = useUpsertEmployeeSkill();
  const analyzeTnaMutation = useAnalyzeTna();
  const updateRecommendationStatusMutation = useUpdateTnaRecommendationStatus();

  const skills = useMemo(() => {
    const response = skillsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [skillsQuery.data]);

  const employees = useMemo(() => {
    const response = studentsQuery.data as { students?: any[] } | undefined;
    return Array.isArray(response?.students) ? response.students : [];
  }, [studentsQuery.data]);

  const courses = useMemo(() => {
    const response = coursesQuery.data as { courses?: any[] } | undefined;
    return Array.isArray(response?.courses) ? response.courses : [];
  }, [coursesQuery.data]);

  const recommendations = useMemo(() => {
    const response = recommendationsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [recommendationsQuery.data]);

  const [activeStep, setActiveStep] = useState<StepKey>("skill-library");
  const [skillName, setSkillName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [threshold, setThreshold] = useState(70);
  const [requiredSkills, setRequiredSkills] = useState<LevelRow[]>([{ skillId: "", level: 1 }]);

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

  useEffect(() => {
    if (!employeeId && employees.length > 0) setEmployeeId(employees[0]._id);
    if (!analyzeEmployeeId && employees.length > 0) setAnalyzeEmployeeId(employees[0]._id);
  }, [employees, employeeId, analyzeEmployeeId]);

  useEffect(() => {
    if (!analyzeJobRole && jobRole) setAnalyzeJobRole(jobRole);
  }, [jobRole, analyzeJobRole]);

  useEffect(() => {
    const nextDrafts: Record<string, RecommendationStatus> = {};
    for (const recommendation of recommendations) {
      nextDrafts[recommendation._id] = normalizeStatus(recommendation.status);
    }
    setStatusDrafts(nextDrafts);
  }, [recommendations]);

  const completionByStep = useMemo<Record<StepKey, boolean>>(
    () => ({
      "skill-library": skills.length > 0,
      "role-requirements":
        Boolean(jobRole.trim()) && requiredSkills.some((skill) => Boolean(skill.skillId)),
      "employee-skills": Boolean(employeeId) && employeeSkills.some((skill) => Boolean(skill.skillId)),
      analyze: recommendations.length > 0,
      recommendations: recommendations.length > 0,
    }),
    [skills.length, jobRole, requiredSkills, employeeId, employeeSkills, recommendations.length]
  );

  const pendingRecommendations = useMemo(
    () =>
      recommendations.filter(
        (recommendation) => normalizeStatus(recommendation.status) === "pending"
      ).length,
    [recommendations]
  );

  const assignedRecommendations = useMemo(
    () =>
      recommendations.filter(
        (recommendation) => normalizeStatus(recommendation.status) === "assigned"
      ).length,
    [recommendations]
  );

  if (orgType !== "corporate") {
    return <Navigate to={`/${orgCode}/admin/dashboard`} replace />;
  }

  const inputClassName =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20";
  const panelClassName = "rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm";

  const saveSkill = async () => {
    if (!skillName.trim()) return toast.error("Skill name is required");
    try {
      await toast.promise(createSkillMutation.mutateAsync({ name: skillName.trim() }), {
        pending: "Saving skill...",
        success: "Skill saved",
        error: "Failed to save skill",
      });
      setSkillName("");
      setActiveStep("role-requirements");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveRoleRequirements = async () => {
    if (!jobRole.trim()) return toast.error("Job role is required");
    const payloadSkills = requiredSkills.filter((item) => item.skillId).map((item) => ({
      skillId: item.skillId,
      requiredLevel: Number(item.level),
    }));
    if (payloadSkills.length === 0) return toast.error("Add at least one required skill");
    try {
      await toast.promise(
        upsertRoleRequirementMutation.mutateAsync({
          jobRole: jobRole.trim(),
          preAssessmentThreshold: Number(threshold) || 70,
          requiredSkills: payloadSkills,
        }),
        { pending: "Saving role requirements...", success: "Saved", error: "Failed to save" }
      );
      setActiveStep("employee-skills");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const saveEmployeeSkills = async () => {
    if (!employeeId) return toast.error(`${employeeTerm} is required`);
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
            ? { score: Number(score), threshold: Number(threshold) || 70 }
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

  const updateStatus = async (recommendationId: string, currentStatus: RecommendationStatus) => {
    const nextStatus = statusDrafts[recommendationId] || currentStatus;
    if (nextStatus === currentStatus) return;
    try {
      await toast.promise(
        updateRecommendationStatusMutation.mutateAsync({ recommendationId, status: nextStatus }),
        { pending: "Updating status...", success: "Status updated", error: "Failed to update status" }
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
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
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Corporate Workflow</p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">Training Needs Analysis</h1>
            <p className="text-slate-600 mt-2 max-w-3xl">
              Follow the flow from setup to recommendation tracking so administrators can evaluate {" "}
              {employeeTermPlural.toLowerCase()} with consistent, auditable data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skill Library</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{skills.length}</p>
              <p className="text-xs text-slate-500 mt-1">Reusable skills available</p>
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
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assigned</p>
              <p className="text-2xl font-bold text-cyan-700 mt-2">{assignedRecommendations}</p>
              <p className="text-xs text-slate-500 mt-1">Recommendations in progress</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)] gap-6">
        <aside className="xl:sticky xl:top-20 h-fit space-y-4">
          <section className={`${panelClassName} space-y-3`}>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-600">TNA Steps</h2>
            <div className="space-y-2">
              {FLOW_STEPS.map((step, index) => {
                const isActive = activeStep === step.key;
                const isComplete = completionByStep[step.key];
                return (
                  <a
                    key={step.key}
                    href={`#${step.key}`}
                    onClick={() => setActiveStep(step.key)}
                    className={`block rounded-xl border p-3 transition-colors ${
                      isActive
                        ? "border-primary bg-primary/5"
                        : isComplete
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isComplete
                            ? "bg-emerald-600 text-white"
                            : isActive
                            ? "bg-primary text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                        <p className="text-xs text-slate-600 mt-1">{step.description}</p>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>

          <section className={panelClassName}>
            <h3 className="text-sm font-semibold text-slate-800">Level Guide</h3>
            <p className="text-xs text-slate-600 mt-1">
              Use consistent scoring for role requirements and employee current skills.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5">1: Beginner</div>
              <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5">2: Basic</div>
              <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5">3: Working</div>
              <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5">4: Advanced</div>
              <div className="rounded-md bg-slate-50 border border-slate-200 px-2 py-1.5 col-span-2">
                5: Expert
              </div>
            </div>
          </section>
        </aside>

        <main className="space-y-6">
          <section
            id="skill-library"
            className={`${panelClassName} space-y-4 ${
              activeStep === "skill-library" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 1</p>
                <h2 className="text-xl font-semibold text-slate-900">Build Skill Library</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Add standardized skills first so they can be reused in role and employee records.
                </p>
              </div>
              <Button variant="outline" onClick={() => setActiveStep("role-requirements")} className="h-fit">
                Next Step
              </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                className={inputClassName}
                placeholder="Skill name (e.g., Emergency Care)"
              />
              <Button variant="primary" onClick={saveSkill} isLoading={createSkillMutation.isPending}>
                Add Skill
              </Button>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 min-h-[66px]">
              {skillsQuery.isLoading ? (
                <p className="text-sm text-slate-500">Loading skills...</p>
              ) : skills.length === 0 ? (
                <p className="text-sm text-slate-500">No skills yet. Add your first skill above.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill._id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section
            id="role-requirements"
            className={`${panelClassName} space-y-4 ${
              activeStep === "role-requirements" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 2</p>
                <h2 className="text-xl font-semibold text-slate-900">Define Role Standards</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Set job role expectations with required skill levels and pre-assessment threshold.
                </p>
              </div>
              <Button variant="outline" onClick={() => setActiveStep("employee-skills")} className="h-fit">
                Next Step
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job Role</label>
                <input
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  className={`${inputClassName} mt-1`}
                  placeholder="Job role (e.g., Nurse, HR Officer)"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Passing Threshold (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value || 70))}
                  className={`${inputClassName} mt-1`}
                  placeholder="70"
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="hidden md:grid grid-cols-12 gap-2 px-1">
                <p className="col-span-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Skill</p>
                <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Level</p>
                <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</p>
              </div>
              {requiredSkills.map((item, index) => (
                <div key={`required-${index}`} className="grid grid-cols-12 gap-2">
                  <select
                    value={item.skillId}
                    onChange={(event) => {
                      const next = [...requiredSkills];
                      next[index] = { ...next[index], skillId: event.target.value };
                      setRequiredSkills(next);
                    }}
                    className={`col-span-12 md:col-span-8 ${inputClassName}`}
                  >
                    <option value="">Select skill</option>
                    {skills.map((skill) => (
                      <option key={skill._id} value={skill._id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={item.level}
                    onChange={(event) => {
                      const next = [...requiredSkills];
                      next[index] = { ...next[index], level: Number(event.target.value || 0) };
                      setRequiredSkills(next);
                    }}
                    className={`col-span-7 md:col-span-2 ${inputClassName}`}
                  />
                  <button
                    type="button"
                    className="col-span-5 md:col-span-2 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
                    onClick={() => {
                      if (requiredSkills.length === 1) return;
                      setRequiredSkills(requiredSkills.filter((_, rowIndex) => rowIndex !== index));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setRequiredSkills([...requiredSkills, { skillId: "", level: 1 }])}
              >
                Add Skill Requirement
              </Button>
              <Button
                variant="primary"
                onClick={saveRoleRequirements}
                isLoading={upsertRoleRequirementMutation.isPending}
              >
                Save Role Requirements
              </Button>
            </div>
          </section>

          <section
            id="employee-skills"
            className={`${panelClassName} space-y-4 ${
              activeStep === "employee-skills" ? "ring-2 ring-primary/20" : ""
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 3</p>
                <h2 className="text-xl font-semibold text-slate-900">Capture {employeeTerm} Skills</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Select an employee and save current competency levels.
                </p>
              </div>
              <Button variant="outline" onClick={() => setActiveStep("analyze")} className="h-fit">
                Next Step
              </Button>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Select {employeeTerm}
              </label>
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className={`${inputClassName} mt-1`}
              >
                <option value="">
                  {studentsQuery.isLoading
                    ? `Loading ${employeeTermPlural.toLowerCase()}...`
                    : `Select ${employeeTerm.toLowerCase()}`}
                </option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="hidden md:grid grid-cols-12 gap-2 px-1">
                <p className="col-span-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Skill</p>
                <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Level</p>
                <p className="col-span-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Action</p>
              </div>
              {employeeSkills.map((item, index) => (
                <div key={`employee-skill-${index}`} className="grid grid-cols-12 gap-2">
                  <select
                    value={item.skillId}
                    onChange={(event) => {
                      const next = [...employeeSkills];
                      next[index] = { ...next[index], skillId: event.target.value };
                      setEmployeeSkills(next);
                    }}
                    className={`col-span-12 md:col-span-8 ${inputClassName}`}
                  >
                    <option value="">Select skill</option>
                    {skills.map((skill) => (
                      <option key={skill._id} value={skill._id}>
                        {skill.name}
                      </option>
                    ))}
                  </select>
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
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 4</p>
                <h2 className="text-xl font-semibold text-slate-900">Run TNA Analysis</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Combine role standards, skill gaps, and optional signals to generate recommendations.
                </p>
              </div>
              <Button variant="outline" onClick={() => setActiveStep("recommendations")} className="h-fit">
                Next Step
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {employeeTerm}
                </label>
                <select
                  value={analyzeEmployeeId}
                  onChange={(event) => setAnalyzeEmployeeId(event.target.value)}
                  className={`${inputClassName} mt-1`}
                >
                  <option value="">Select {employeeTerm.toLowerCase()}</option>
                  {employees.map((employee) => (
                    <option key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Job Role</label>
                <input
                  value={analyzeJobRole}
                  onChange={(event) => setAnalyzeJobRole(event.target.value)}
                  className={`${inputClassName} mt-1`}
                  placeholder="Job role"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Pre-test Score (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(event) => setScore(event.target.value)}
                  className={`${inputClassName} mt-1`}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Performance Gaps
                </label>
                <textarea
                  value={performanceGaps}
                  onChange={(event) => setPerformanceGaps(event.target.value)}
                  className={`min-h-[92px] ${inputClassName} mt-1`}
                  placeholder="Comma or new line separated"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Manager Recommendations
                </label>
                <textarea
                  value={managerRecommendations}
                  onChange={(event) => setManagerRecommendations(event.target.value)}
                  className={`min-h-[92px] ${inputClassName} mt-1`}
                  placeholder="Comma or new line separated"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Employee Requests
                </label>
                <textarea
                  value={employeeRequests}
                  onChange={(event) => setEmployeeRequests(event.target.value)}
                  className={`min-h-[92px] ${inputClassName} mt-1`}
                  placeholder="Comma or new line separated"
                />
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
                <div key={`compliance-${index}`} className="grid grid-cols-1 md:grid-cols-12 gap-2">
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
                  <select
                    value={item.courseId}
                    onChange={(event) => {
                      const next = [...compliance];
                      next[index] = { ...next[index], courseId: event.target.value };
                      setCompliance(next);
                    }}
                    className={`md:col-span-4 ${inputClassName}`}
                  >
                    <option value="">{coursesQuery.isLoading ? "Loading courses..." : "Optional course link"}</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.code ? `${course.code} - ` : ""}
                        {course.title}
                      </option>
                    ))}
                  </select>
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step 5</p>
              <h2 className="text-xl font-semibold text-slate-900">Track Recommendations</h2>
              <p className="text-sm text-slate-600 mt-1">
                Review generated recommendations and move each one through assignment and completion.
              </p>
            </div>

            {recommendationsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No recommendations yet. Complete steps 1 to 4 and run analysis.
              </div>
            ) : (
              <div className="space-y-3">
                {recommendations.map((recommendation) => {
                  const currentStatus = normalizeStatus(recommendation.status);
                  const currentDraft = statusDrafts[recommendation._id] || currentStatus;
                  return (
                    <div key={recommendation._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-slate-900">
                            {recommendation.employee?.firstName || "--"}{" "}
                            {recommendation.employee?.lastName || ""}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {recommendation.jobRole} |{" "}
                            {new Date(recommendation.createdAt || Date.now()).toLocaleString()}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-slate-700">
                              Skill gaps:{" "}
                              {Array.isArray(recommendation.skillGaps)
                                ? recommendation.skillGaps.length
                                : 0}
                            </span>
                            <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-slate-700">
                              Recommended trainings:{" "}
                              {Array.isArray(recommendation.recommendedTrainings)
                                ? recommendation.recommendedTrainings.length
                                : 0}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={currentDraft}
                            onChange={(event) =>
                              setStatusDrafts((previous) => ({
                                ...previous,
                                [recommendation._id]: event.target.value as RecommendationStatus,
                              }))
                            }
                            className={`${inputClassName} min-w-[140px]`}
                          >
                            <option value="pending">pending</option>
                            <option value="assigned">assigned</option>
                            <option value="completed">completed</option>
                          </select>
                          <Button
                            variant="outline"
                            isLoading={updateRecommendationStatusMutation.isPending}
                            onClick={() => updateStatus(recommendation._id, currentStatus)}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
