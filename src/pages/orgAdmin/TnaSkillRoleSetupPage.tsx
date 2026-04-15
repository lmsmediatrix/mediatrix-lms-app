import { useMemo, useState } from "react";
import { FaBriefcase, FaEdit, FaLightbulb, FaListUl, FaTable, FaThLarge, FaTrash } from "react-icons/fa";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { SearchableSelect } from "../../components/SearchableSelect";
import Button from "../../components/common/Button";
import Dialog from "../../components/common/Dialog";
import GroupedDataTable, {
  GroupedTableColumn,
  GroupedTableGroup,
} from "../../components/common/GroupedDataTable";
import ActionMenuButton from "../../components/orgAdmin/ActionMenuButton";
import { useAuth } from "../../context/AuthContext";
import {
  useCreateTnaSkill,
  useDeleteTnaSkill,
  useDeleteTnaRoleRequirement,
  useGetTnaRoleRequirements,
  useGetTnaSkills,
  useUpsertRoleRequirement,
} from "../../hooks/useTna";

type LevelRow = { skillId: string; level: number };
type StepKey = "skill-library" | "role-requirements";
type DeleteTarget =
  | { type: "skill"; id: string; label: string }
  | { type: "role"; id: string; label: string };

const SETUP_TABS: Array<{
  key: StepKey;
  title: string;
}> = [
  {
    key: "skill-library",
    title: "Skills",
  },
  {
    key: "role-requirements",
    title: "Role",
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
  const deleteSkillMutation = useDeleteTnaSkill();
  const upsertRoleRequirementMutation = useUpsertRoleRequirement();
  const deleteRoleRequirementMutation = useDeleteTnaRoleRequirement();

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

  const skillNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const skill of skills) {
      const id = String(skill?._id || "").trim();
      const name = String(skill?.name || "").trim();
      if (id && name) map.set(id, name);
    }
    return map;
  }, [skills]);

  const getRequiredSkillPreview = (skillItem: any) => {
    const directSkillName = String(skillItem?.skillName || "").trim();
    const nestedSkillName = String(skillItem?.skill?.name || "").trim();
    const nestedSkillIdName = String(skillItem?.skillId?.name || "").trim();

    const rawSkillId = skillItem?.skillId;
    const skillId =
      typeof rawSkillId === "string"
        ? rawSkillId.trim()
        : String(rawSkillId?._id || "").trim();

    const fallbackNameFromLibrary = skillId ? String(skillNameById.get(skillId) || "").trim() : "";
    const name =
      directSkillName || nestedSkillName || nestedSkillIdName || fallbackNameFromLibrary || "Unnamed skill";

    const parsedLevel = Number(skillItem?.requiredLevel);
    const level = Number.isFinite(parsedLevel) ? parsedLevel : 0;

    return { name, level };
  };

  const [activeStep, setActiveStep] = useState<StepKey>("skill-library");
  const [skillName, setSkillName] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [threshold, setThreshold] = useState(70);
  const [requiredSkills, setRequiredSkills] = useState<LevelRow[]>([{ skillId: "", level: 1 }]);
  const [editingRoleRequirementId, setEditingRoleRequirementId] = useState<string | null>(null);
  const [roleStandardsView, setRoleStandardsView] = useState<"card" | "table">("card");
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [requiredSkillsPreviewRole, setRequiredSkillsPreviewRole] = useState<any | null>(null);

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
  const primaryIconButtonClassName =
    "inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_30%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_10%,white)] text-[color:var(--color-primary,#2563eb)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_18%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_28%,transparent)]";
  const secondaryIconButtonClassName =
    "inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_30%,white)] bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_10%,white)] text-[color:var(--color-secondary,#0ea5e9)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_18%,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--color-secondary,#0ea5e9)_28%,transparent)]";
  const dangerIconButtonClassName =
    "inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300";
  const tabPillHighlightTransform = activeStep === "skill-library" ? "translateX(0%)" : "translateX(100%)";
  const canSaveSkill = Boolean(skillName.trim());
  const hasRoleName = Boolean(jobRole.trim());
  const hasRequiredSkill = requiredSkills.some((item) => Boolean(String(item.skillId || "").trim()));
  const isThresholdValid = Number.isFinite(threshold) && threshold >= 0 && threshold <= 100;
  const canSaveRoleRequirements = hasRoleName && hasRequiredSkill && isThresholdValid;
  const isEditingRoleRequirement = Boolean(editingRoleRequirementId);
  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase();
    if (!query) return skills;
    return skills.filter((skill) => String(skill?.name || "").toLowerCase().includes(query));
  }, [skills, skillSearch]);

  const resetRoleRequirementForm = () => {
    setEditingRoleRequirementId(null);
    setJobRole("");
    setThreshold(70);
    setRequiredSkills([{ skillId: "", level: 1 }]);
  };

  const saveSkill = async () => {
    if (!skillName.trim()) return toast.error("Skill name is required");
    try {
      await toast.promise(createSkillMutation.mutateAsync({ name: skillName.trim() }), {
        pending: "Saving skill...",
        success: "Skill saved",
        error: "Failed to save skill",
      });
      setSkillName("");
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
        {
          pending: isEditingRoleRequirement ? "Updating role requirements..." : "Saving role requirements...",
          success: isEditingRoleRequirement ? "Role requirements updated" : "Role requirements saved",
          error: "Failed to save",
        }
      );
      resetRoleRequirementForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const deleteSkill = async (skill: any) => {
    const skillId = String(skill?._id || "").trim();
    if (!skillId) return;

    setDeletingSkillId(skillId);
    try {
      await toast.promise(
        deleteSkillMutation.mutateAsync({ skillId }),
        {
          pending: "Deleting skill...",
          success: "Skill deleted",
          error: "Failed to delete skill",
        }
      );

      setRequiredSkills((previous) => {
        const filtered = previous.filter((item) => item.skillId !== skillId);
        return filtered.length > 0 ? filtered : [{ skillId: "", level: 1 }];
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingSkillId(null);
    }
  };

  const startEditRoleRequirement = (roleRequirement: any) => {
    const roleRequiredSkills = Array.isArray(roleRequirement?.requiredSkills)
      ? roleRequirement.requiredSkills
      : [];

    const normalizedRequiredSkills: LevelRow[] = roleRequiredSkills
      .map((skillItem: any) => {
        const rawSkillId = skillItem?.skill ?? skillItem?.skillId;
        const resolvedSkillId =
          typeof rawSkillId === "string"
            ? rawSkillId.trim()
            : String(rawSkillId?._id || "").trim();

        if (!resolvedSkillId) return null;
        const parsedLevel = Number(skillItem?.requiredLevel);
        return {
          skillId: resolvedSkillId,
          level: Number.isFinite(parsedLevel) ? parsedLevel : 1,
        };
      })
      .filter(Boolean) as LevelRow[];

    setActiveStep("role-requirements");
    setEditingRoleRequirementId(String(roleRequirement?._id || ""));
    setJobRole(String(roleRequirement?.jobRole || ""));
    setThreshold(Number(roleRequirement?.preAssessmentThreshold) || 70);
    setRequiredSkills(
      normalizedRequiredSkills.length > 0
        ? normalizedRequiredSkills
        : [{ skillId: "", level: 1 }]
    );
  };

  const deleteRoleRequirement = async (roleRequirement: any) => {
    const roleRequirementId = String(roleRequirement?._id || "").trim();
    if (!roleRequirementId) return;

    try {
      await toast.promise(
        deleteRoleRequirementMutation.mutateAsync({ roleRequirementId }),
        {
          pending: "Deleting role standard...",
          success: "Role standard deleted",
          error: "Failed to delete role standard",
        }
      );

      if (editingRoleRequirementId === roleRequirementId) {
        resetRoleRequirementForm();
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "skill") {
      const skill = skills.find((item) => String(item?._id || "").trim() === deleteTarget.id);
      if (skill) {
        await deleteSkill(skill);
      }
      setDeleteTarget(null);
      return;
    }

    const roleRequirement = roleRequirements.find(
      (item) => String(item?._id || "").trim() === deleteTarget.id
    );
    if (roleRequirement) {
      await deleteRoleRequirement(roleRequirement);
    }
    setDeleteTarget(null);
  };

  const closeDeleteDialog = () => {
    if (deleteSkillMutation.isPending || deleteRoleRequirementMutation.isPending) return;
    setDeleteTarget(null);
  };

  const roleStandardsTableGroups: GroupedTableGroup<any>[] = [
    {
      key: "role-standards",
      title: "Role Standards",
      rows: roleRequirements,
      badgeText: `${roleRequirements.length} total`,
    },
  ];

  const roleStandardsTableColumns: GroupedTableColumn<any>[] = [
    {
      key: "jobRole",
      label: "Role",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search role",
      sortAccessor: (row) => String(row?.jobRole || ""),
      filterAccessor: (row) => String(row?.jobRole || ""),
      className: "min-w-[260px]",
      render: (row) => (
        <span className="text-sm font-semibold text-slate-900">
          {String(row?.jobRole || "Unnamed role")}
        </span>
      ),
    },
    {
      key: "threshold",
      label: "Threshold",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search threshold",
      sortAccessor: (row) => Number(row?.preAssessmentThreshold) || 70,
      filterAccessor: (row) => `${Number(row?.preAssessmentThreshold) || 70}%`,
      className: "min-w-[130px]",
      render: (row) => (
        <span className="text-sm text-slate-700">{Number(row?.preAssessmentThreshold) || 70}%</span>
      ),
    },
    {
      key: "skillsCount",
      label: "Skills",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search count",
      sortAccessor: (row) => (Array.isArray(row?.requiredSkills) ? row.requiredSkills.length : 0),
      filterAccessor: (row) =>
        String(Array.isArray(row?.requiredSkills) ? row.requiredSkills.length : 0),
      className: "min-w-[110px]",
      render: (row) => (
        <span className="text-sm text-slate-700">
          {Array.isArray(row?.requiredSkills) ? row.requiredSkills.length : 0}
        </span>
      ),
    },
    {
      key: "skillsPreview",
      label: "Required Skills",
      sortable: true,
      filterable: true,
      filterPlaceholder: "Search required skill",
      sortAccessor: (row) => {
        const requiredSkills = Array.isArray(row?.requiredSkills) ? row.requiredSkills : [];
        return requiredSkills.length;
      },
      filterAccessor: (row) => {
        const requiredSkills = Array.isArray(row?.requiredSkills) ? row.requiredSkills : [];
        return requiredSkills
          .map((skillItem: any) => getRequiredSkillPreview(skillItem).name.toLowerCase())
          .join(" ");
      },
      className: "min-w-[320px]",
      render: (row) => {
        const requiredSkills = Array.isArray(row?.requiredSkills) ? row.requiredSkills : [];
        if (requiredSkills.length === 0) {
          return <span className="text-xs text-slate-400">No required skills</span>;
        }

        const previews = requiredSkills.map((skillItem: any) => getRequiredSkillPreview(skillItem));
        const firstTwo = previews.slice(0, 2);
        const extraCount = previews.length - firstTwo.length;

        return (
          <div className="flex flex-wrap items-center gap-1.5">
            {firstTwo.map((preview: { name: string; level: number }, index: number) => (
              <span
                key={`${String(row?._id || row?.jobRole || "role")}-${preview.name}-${index}`}
                className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700"
              >
                {preview.name} (L{preview.level})
              </span>
            ))}
            {extraCount > 0 ? (
              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-500">
                +{extraCount} more
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      className: "min-w-[150px]",
      render: (row) => (
        <div className="flex items-center justify-end" data-row-click-stop="true">
          <ActionMenuButton
            buttonClassName="!px-2 !py-1.5"
            items={[
              {
                key: "view-required-skills",
                label: "View Required Skills",
                onClick: () => setRequiredSkillsPreviewRole(row),
              },
              {
                key: "edit-role-standard",
                label: "Edit Role Standard",
                onClick: () => startEditRoleRequirement(row),
              },
              {
                key: "delete-role-standard",
                label: "Delete Role Standard",
                onClick: () => {
                  setDeleteTarget({
                    type: "role",
                    id: String(row?._id || ""),
                    label: String(row?.jobRole || "this role standard"),
                  });
                },
                disabled: deleteRoleRequirementMutation.isPending,
                danger: true,
              },
            ]}
          />
        </div>
      ),
    },
  ];

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
              <h1 className="text-3xl font-bold text-slate-900 mt-1">Skill and Role</h1>
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

      <section>
        <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-1.5 md:p-2">
          <div className="relative grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <div
              className="pointer-events-none absolute left-0 top-0 hidden h-full w-1/2 rounded-lg border border-primary/20 bg-white shadow-[0_10px_20px_-16px_rgba(37,99,235,0.7)] transition-transform duration-300 sm:block"
              style={{ transform: tabPillHighlightTransform }}
            />
            {SETUP_TABS.map((step) => {
              const isActive = activeStep === step.key;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(step.key)}
                  className={`relative rounded-lg border px-3 py-2.5 text-left transition-all duration-200 ${
                    isActive
                      ? "border-primary/30 bg-white text-slate-900 shadow-[0_8px_18px_-16px_rgba(37,99,235,0.8)]"
                      : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-white/70 hover:text-slate-700"
                  }`}
                >
                  <p className="text-sm font-semibold">{step.title}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {activeStep === "skill-library" && (
          <section id="skill-library" className={`${panelClassName} space-y-4`}>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Skills</h2>
              <p className="text-sm text-slate-600 mt-1">
                Add standardized skills that can be reused by all role requirement profiles.
              </p>
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
                  disabled={!canSaveSkill}
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
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Skill Library ({filteredSkills.length})
                    </p>
                    <input
                      value={skillSearch}
                      onChange={(event) => setSkillSearch(event.target.value)}
                      className="h-9 w-full sm:w-72 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[color:var(--color-primary,#2563eb)] focus:ring-2 focus:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_18%,transparent)]"
                      placeholder="Search skill..."
                    />
                  </div>

                  {filteredSkills.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                      No skills matched your search.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="max-h-[360px] overflow-auto">
                        <table className="w-full min-w-[520px]">
                          <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur">
                            <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                              <th className="px-4 py-3 w-16">#</th>
                              <th className="px-4 py-3">Skill Name</th>
                              <th className="px-4 py-3 w-28 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {filteredSkills.map((skill, index) => {
                              const skillId = String(skill?._id || "");
                              const isDeletingCurrent =
                                deleteSkillMutation.isPending && deletingSkillId === skillId;

                              return (
                                <tr key={skill._id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-3 text-sm font-medium text-slate-500">{index + 1}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                                    {String(skill?.name || "Unnamed skill")}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center justify-center">
                                      <button
                                        type="button"
                                        aria-label={`Delete skill ${skill.name}`}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={() => {
                                          setDeleteTarget({
                                            type: "skill",
                                            id: skillId,
                                            label: String(skill?.name || "this skill"),
                                          });
                                        }}
                                        disabled={deleteSkillMutation.isPending}
                                      >
                                        {isDeletingCurrent ? (
                                          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
                                        ) : (
                                          <FaTrash className="h-3 w-3" />
                                        )}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {activeStep === "role-requirements" && (
          <section id="role-requirements" className={`${panelClassName} space-y-4`}>
            <div className="rounded-xl border border-slate-200 bg-[linear-gradient(140deg,#ffffff,color-mix(in_srgb,var(--color-primary,#2563eb)_6%,#ffffff))] p-4 md:p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_26%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_10%,white)] text-[color:var(--color-primary,#2563eb)]">
                  <FaBriefcase className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Role and Skills Configuration</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Set role expectations with required skills and passing threshold.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-white/90 p-4 md:p-5 space-y-3">
                  <p className={fieldLabelClassName}>Role Metadata</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={fieldLabelClassName}>Job Role</label>
                      <input
                        value={jobRole}
                        onChange={(event) => setJobRole(event.target.value)}
                        disabled={isEditingRoleRequirement}
                        className={`${inputClassName} mt-1`}
                        placeholder="Job role (e.g., Nurse, HR Officer)"
                      />
                      <p className={fieldHintClassName}>
                        {isEditingRoleRequirement
                          ? "Role name is locked while editing. Cancel edit to create a new role name."
                          : "Use a role name that matches your organization chart."}
                      </p>
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

                <div className="rounded-xl border border-slate-200 bg-white/90 p-4 md:p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_26%,white)] bg-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_8%,white)] text-[color:var(--color-primary,#2563eb)]">
                      <FaListUl className="h-3.5 w-3.5" />
                    </span>
                    <p className={fieldLabelClassName}>Required Skills And Levels</p>
                  </div>
                  <div className="hidden md:grid grid-cols-12 gap-2 px-1">
                    <p className={`col-span-8 ${fieldLabelClassName}`}>Skill</p>
                    <p className={`col-span-2 ${fieldLabelClassName}`}>Level</p>
                    <p className={`col-span-2 ${fieldLabelClassName}`}>Action</p>
                  </div>
                  {requiredSkills.map((item, index) => (
                    <div
                      key={`required-${index}`}
                      className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2"
                    >
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
                          emptyMessage="No skills yet. Add skills in the Skills tab."
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
                        className="col-span-5 md:col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-white text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          if (requiredSkills.length === 1) return;
                          setRequiredSkills(requiredSkills.filter((_, rowIndex) => rowIndex !== index));
                        }}
                        disabled={requiredSkills.length === 1}
                      >
                        <FaTrash className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                  <p className={fieldHintClassName}>Use levels 1 to 5, where 5 is expert capability.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="h-10 rounded-lg px-4 font-medium"
                onClick={() => setRequiredSkills([...requiredSkills, { skillId: "", level: 1 }])}
              >
                Add Skill Requirement
              </Button>
              {isEditingRoleRequirement && (
                <Button
                  variant="outline"
                  className="h-10 rounded-lg px-4 font-medium"
                  onClick={resetRoleRequirementForm}
                >
                  Cancel Edit
                </Button>
              )}
              <Button
                variant="primary"
                className="h-10 rounded-lg px-4 font-medium shadow-[0_14px_24px_-18px_rgba(37,99,235,0.65)]"
                onClick={saveRoleRequirements}
                isLoading={upsertRoleRequirementMutation.isPending}
                disabled={!canSaveRoleRequirements}
              >
                {isEditingRoleRequirement ? "Update Role Requirements" : "Save Role Requirements"}
              </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-h-[66px]">
              <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Existing Role Standards
                </p>
                <div className="ml-auto inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setRoleStandardsView("card")}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                      roleStandardsView === "card"
                        ? "bg-[color:var(--color-primary,#2563eb)] text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    }`}
                    aria-label="Card view"
                    title="Card view"
                    aria-pressed={roleStandardsView === "card"}
                  >
                    <FaThLarge className="h-3.5 w-3.5" />
                    <span className="sr-only">Card view</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleStandardsView("table")}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                      roleStandardsView === "table"
                        ? "bg-[color:var(--color-primary,#2563eb)] text-white shadow-sm"
                        : "text-slate-500 hover:bg-white hover:text-slate-700"
                    }`}
                    aria-label="Table view"
                    title="Table view"
                    aria-pressed={roleStandardsView === "table"}
                  >
                    <FaTable className="h-3.5 w-3.5" />
                    <span className="sr-only">Table view</span>
                  </button>
                </div>
              </div>
              {roleRequirementsQuery.isLoading ? (
                <p className="text-sm text-slate-500">Loading role standards...</p>
              ) : roleRequirements.length === 0 ? (
                <p className="text-sm text-slate-500">No role standards yet. Save your first role profile above.</p>
              ) : (
                roleStandardsView === "card" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {roleRequirements.map((roleRequirement: any) => {
                      const roleRequiredSkills = Array.isArray(roleRequirement.requiredSkills)
                        ? roleRequirement.requiredSkills
                        : [];

                      return (
                        <div
                          key={String(roleRequirement._id || roleRequirement.jobRole)}
                          tabIndex={0}
                          className="relative rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 pr-32 outline-none transition-colors focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--color-primary,#2563eb)_28%,transparent)]"
                        >
                          <div className="absolute right-2 top-2 flex items-center gap-1">
                            <button
                              type="button"
                              aria-label="Edit role standard"
                              className={primaryIconButtonClassName}
                              onClick={() => startEditRoleRequirement(roleRequirement)}
                            >
                              <FaEdit className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              aria-label="Delete role standard"
                              className={dangerIconButtonClassName}
                              onClick={() => {
                                setDeleteTarget({
                                  type: "role",
                                  id: String(roleRequirement?._id || ""),
                                  label: String(roleRequirement?.jobRole || "this role standard"),
                                });
                              }}
                              disabled={deleteRoleRequirementMutation.isPending}
                            >
                              <FaTrash className="h-3 w-3" />
                            </button>

                            <button
                              type="button"
                              aria-label="View required skills"
                              className={`group ${secondaryIconButtonClassName}`}
                              onClick={() => setRequiredSkillsPreviewRole(roleRequirement)}
                            >
                              <FaLightbulb className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" />
                            </button>
                          </div>

                          <p className="text-sm font-semibold text-slate-900">
                            {String(roleRequirement.jobRole || "Unnamed role")}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Threshold: {Number(roleRequirement.preAssessmentThreshold) || 70}% | Skills:{" "}
                            {roleRequiredSkills.length}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <GroupedDataTable
                      groups={roleStandardsTableGroups}
                      columns={roleStandardsTableColumns}
                      rowKey={(row) => String(row?._id || row?.jobRole || "")}
                      tableMinWidthClassName="min-w-[980px]"
                      showPagination={false}
                      cardless
                      showGroupHeader={false}
                      emptyFilteredText="No matching role standards found."
                    />
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </div>

      <Dialog
        isOpen={Boolean(requiredSkillsPreviewRole)}
        onClose={() => setRequiredSkillsPreviewRole(null)}
        title={`Required Skills${requiredSkillsPreviewRole?.jobRole ? ` • ${String(requiredSkillsPreviewRole.jobRole)}` : ""}`}
        backdrop="blur"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role Standard Summary</p>
            <p className="mt-1 text-sm text-slate-700">
              Threshold: {Number(requiredSkillsPreviewRole?.preAssessmentThreshold) || 70}% | Skills:{" "}
              {Array.isArray(requiredSkillsPreviewRole?.requiredSkills)
                ? requiredSkillsPreviewRole.requiredSkills.length
                : 0}
            </p>
          </div>

          {!Array.isArray(requiredSkillsPreviewRole?.requiredSkills) ||
          requiredSkillsPreviewRole.requiredSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No required skills configured.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[520px]">
                <thead className="sticky top-0 z-10 bg-slate-100/95">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2.5 w-16">#</th>
                    <th className="px-3 py-2.5">Skill</th>
                    <th className="px-3 py-2.5 w-28">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {requiredSkillsPreviewRole.requiredSkills.map((skillItem: any, index: number) => {
                    const preview = getRequiredSkillPreview(skillItem);
                    return (
                      <tr key={`${String(requiredSkillsPreviewRole?._id || "role")}-${preview.name}-${index}`}>
                        <td className="px-3 py-2.5 text-sm text-slate-500">{index + 1}</td>
                        <td className="px-3 py-2.5 text-sm font-medium text-slate-800">{preview.name}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-700">Level {preview.level}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        isOpen={Boolean(deleteTarget)}
        onClose={closeDeleteDialog}
        title={deleteTarget?.type === "skill" ? "Delete Skill" : "Delete Role Standard"}
        backdrop="blur"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {deleteTarget?.type === "skill" ? (
              <>
                Are you sure you want to delete skill{" "}
                <span className="font-semibold">"{deleteTarget.label}"</span>? This will remove it
                from the skill library.
              </>
            ) : (
              <>
                Are you sure you want to delete role standard{" "}
                <span className="font-semibold">"{deleteTarget?.label}"</span>? This action can be
                undone only by recreating it.
              </>
            )}
          </p>

          <div className="flex gap-2 justify-end mt-6">
            <Button
              type="button"
              variant="cancel"
              onClick={closeDeleteDialog}
              disabled={deleteSkillMutation.isPending || deleteRoleRequirementMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void confirmDeleteTarget();
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteSkillMutation.isPending || deleteRoleRequirementMutation.isPending}
            >
              {deleteSkillMutation.isPending || deleteRoleRequirementMutation.isPending
                ? "Deleting..."
                : deleteTarget?.type === "skill"
                ? "Delete Skill"
                : "Delete Role Standard"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
