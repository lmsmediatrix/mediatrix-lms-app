import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SearchableSelect } from "../../components/SearchableSelect";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import {
  useCreateTnaSkill,
  useGetTnaRoleRequirements,
  useGetTnaSkills,
  useUpsertRoleRequirement,
} from "../../hooks/useTna";

type LevelRow = { skillId: string; level: number };
type StepKey = "skill-library" | "role-requirements";

const FLOW_STEPS: Array<{
  key: StepKey;
  title: string;
  description: string;
}> = [
  {
    key: "skill-library",
    title: "Build Skill Library",
    description: "Create reusable skills that can be used by every role profile.",
  },
  {
    key: "role-requirements",
    title: "Define Role Standards",
    description: "Set required skill levels and passing thresholds per role.",
  },
];

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

export default function TnaSkillRoleSetupPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const orgCode = currentUser?.user?.organization?.code || "";
  const orgType = currentUser?.user?.organization?.type;

  const skillsQuery = useGetTnaSkills({ limit: 200, skip: 0 });
  const roleRequirementsQuery = useGetTnaRoleRequirements({ limit: 200, skip: 0 });
  const createSkillMutation = useCreateTnaSkill();
  const upsertRoleRequirementMutation = useUpsertRoleRequirement();

  const skills = useMemo(() => {
    const response = skillsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [skillsQuery.data]);

  const roleRequirements = useMemo(() => {
    const response = roleRequirementsQuery.data as { data?: any[] } | undefined;
    return Array.isArray(response?.data) ? response.data : [];
  }, [roleRequirementsQuery.data]);

  const skillSelectOptions = useMemo(
    () =>
      skills.map((skill) => ({
        value: String(skill._id || ""),
        label: String(skill.name || "Unnamed skill"),
      })),
    [skills]
  );

  const [activeStep, setActiveStep] = useState<StepKey>("skill-library");
  const [skillName, setSkillName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [threshold, setThreshold] = useState(70);
  const [requiredSkills, setRequiredSkills] = useState<LevelRow[]>([{ skillId: "", level: 1 }]);

  const completionByStep = useMemo<Record<StepKey, boolean>>(
    () => ({
      "skill-library": skills.length > 0,
      "role-requirements":
        Boolean(jobRole.trim()) && requiredSkills.some((skill) => Boolean(skill.skillId)),
    }),
    [skills.length, jobRole, requiredSkills]
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
  const panelClassName =
    "rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-[0_14px_40px_-24px_rgba(15,23,42,0.35)]";
  const fieldLabelClassName = "text-xs font-semibold uppercase tracking-wider text-slate-500";
  const fieldHintClassName = "mt-1 text-xs text-slate-500";
  const sectionSurfaceClassName = "rounded-xl border border-slate-200 bg-white p-3.5";
  const skillLibraryStatus = getStepStatusMeta("skill-library");
  const roleRequirementsStatus = getStepStatusMeta("role-requirements");

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
      navigate(`/${orgCode}/admin/tna`);
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Configuration</p>
              <h1 className="text-3xl font-bold text-slate-900 mt-1">TNA Skill And Role Setup</h1>
              <p className="text-slate-600 mt-2 max-w-3xl">
                Manage reusable skills and role standards here. Training Needs Analysis will only
                handle employee profile inputs and execution.
              </p>
            </div>
            <Button
              variant="outline"
              className="h-10 w-full md:w-auto"
              onClick={() => navigate(`/${orgCode}/admin/tna`)}
            >
              Open Training Needs Analysis
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Skills</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{skills.length}</p>
              <p className="text-xs text-slate-500 mt-1">Reusable skills available</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role Standards</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">{roleRequirements.length}</p>
              <p className="text-xs text-slate-500 mt-1">Configured role requirement profiles</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_12px_36px_-24px_rgba(15,23,42,0.3)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FLOW_STEPS.map((step, index) => {
            const isActive = activeStep === step.key;
            const statusMeta = getStepStatusMeta(step.key);

            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setActiveStep(step.key)}
                className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-slate-200 bg-slate-50/70 hover:border-slate-300"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Step {index + 1}
                </p>
                <p className="mt-0.5 text-sm font-medium text-slate-900">{step.title}</p>
                <p className="mt-1 text-xs text-slate-600">{step.description}</p>
                <span
                  className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusMeta.className}`}
                >
                  {statusMeta.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-6">
        <section
          id="skill-library"
          className={`${panelClassName} space-y-4 ${
            activeStep === "skill-library" ? "ring-2 ring-primary/20" : ""
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className={fieldLabelClassName}>Step 1</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${skillLibraryStatus.className}`}
                >
                  {skillLibraryStatus.label}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Build Skill Library</h2>
              <p className="text-sm text-slate-600 mt-1">
                Add standardized skills that can be reused by all role requirement profiles.
              </p>
            </div>
            <Button variant="outline" onClick={() => setActiveStep("role-requirements")} className="h-fit">
              Next Step
            </Button>
          </div>

          <div className={sectionSurfaceClassName}>
            <p className={fieldLabelClassName}>Add New Skill</p>
            <div className="mt-1 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_120px] gap-2">
              <input
                value={skillName}
                onChange={(event) => setSkillName(event.target.value)}
                className={inputClassName}
                placeholder="Skill name (e.g., Emergency Care)"
              />
              <Button
                variant="primary"
                onClick={saveSkill}
                isLoading={createSkillMutation.isPending}
                className="h-10 whitespace-nowrap justify-center"
              >
                Add Skill
              </Button>
            </div>
            <p className={fieldHintClassName}>
              Keep names short and specific so reports and role standards stay clean.
            </p>
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
              <div className="flex items-center gap-2">
                <p className={fieldLabelClassName}>Step 2</p>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${roleRequirementsStatus.className}`}
                >
                  {roleRequirementsStatus.label}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-slate-900">Define Role Standards</h2>
              <p className="text-sm text-slate-600 mt-1">
                Set job role expectations with required skill levels and pre-assessment threshold.
              </p>
            </div>
          </div>

          <div className={`${sectionSurfaceClassName} space-y-3`}>
            <p className={fieldLabelClassName}>Role Metadata</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={fieldLabelClassName}>Job Role</label>
                <input
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  className={`${inputClassName} mt-1`}
                  placeholder="Job role (e.g., Nurse, HR Officer)"
                />
                <p className={fieldHintClassName}>Use a role name that matches your organization chart.</p>
              </div>
              <div>
                <label className={fieldLabelClassName}>Passing Threshold (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value || 70))}
                  className={`${inputClassName} mt-1`}
                  placeholder="70"
                />
                <p className={fieldHintClassName}>Employees below this score will be flagged for support.</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <p className={fieldLabelClassName}>Required Skills And Levels</p>
            <div className="hidden md:grid grid-cols-12 gap-2 px-1">
              <p className={`col-span-8 ${fieldLabelClassName}`}>Skill</p>
              <p className={`col-span-2 ${fieldLabelClassName}`}>Level</p>
              <p className={`col-span-2 ${fieldLabelClassName}`}>Action</p>
            </div>
            {requiredSkills.map((item, index) => (
              <div key={`required-${index}`} className="grid grid-cols-12 gap-2">
                <div className="col-span-12 md:col-span-8">
                  <SearchableSelect
                    options={skillSelectOptions}
                    value={item.skillId}
                    onChange={(value) => {
                      const next = [...requiredSkills];
                      next[index] = { ...next[index], skillId: value };
                      setRequiredSkills(next);
                    }}
                    placeholder="Select skill"
                    loading={skillsQuery.isLoading}
                    emptyMessage="No skills yet. Add skills in Step 1."
                    className="w-full"
                  />
                </div>
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
            <p className={fieldHintClassName}>Use levels 1 to 5, where 5 is expert capability.</p>
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

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 min-h-[66px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Existing Role Standards
            </p>
            {roleRequirementsQuery.isLoading ? (
              <p className="text-sm text-slate-500">Loading role standards...</p>
            ) : roleRequirements.length === 0 ? (
              <p className="text-sm text-slate-500">No role standards yet. Save your first role profile above.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {roleRequirements.map((roleRequirement: any) => (
                  <div
                    key={String(roleRequirement._id || roleRequirement.jobRole)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {String(roleRequirement.jobRole || "Unnamed role")}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Threshold: {Number(roleRequirement.preAssessmentThreshold) || 70}% | Skills:{" "}
                      {Array.isArray(roleRequirement.requiredSkills)
                        ? roleRequirement.requiredSkills.length
                        : 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

